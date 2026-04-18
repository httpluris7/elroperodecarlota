import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ─── Singleton transporter ──────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// ─── Base HTML template ─────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:'Helvetica Neue',Arial,sans-serif;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E8DDD3;">
        <!-- Header -->
        <tr><td style="background:#111;padding:28px 32px;text-align:center;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#FAFAFA;letter-spacing:1px;">
            El Ropero de Carlota
          </h1>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F5F5F5;padding:20px 32px;text-align:center;font-size:12px;color:#999;">
          <p style="margin:0;">El Ropero de Carlota &middot; Archena, Murcia</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Order confirmation email ───────────────────────────

interface OrderForEmail {
  id: number;
  customerName: string;
  email: string;
  total: number;
  deliveryMethod: string;
  address: string;
  items: { productName: string; quantity: number; size: string; color: string; price: number }[];
}

function parseAddress(raw: string): { street?: string; city?: string; postalCode?: string; province?: string; pickup?: boolean } {
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function sendOrderConfirmation(order: OrderForEmail): Promise<void> {
  const addr = parseAddress(order.address);
  const isPickup = order.deliveryMethod === "pickup";

  const itemsRows = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">
            ${i.productName}${i.size ? ` <span style="color:#999;">(${i.size})</span>` : ""}${i.color ? ` <span style="color:#999;">· ${i.color}</span>` : ""}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;">${i.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;">${(i.price * i.quantity).toFixed(2)} &euro;</td>
        </tr>`
    )
    .join("");

  const deliveryInfo = isPickup
    ? `<div style="background:#F9F6F2;padding:16px;margin-top:24px;border-left:3px solid #C9A96E;">
        <p style="margin:0;font-size:14px;font-weight:600;">Recogida en tienda</p>
        <p style="margin:4px 0 0;font-size:13px;color:#666;">Te avisaremos cuando tu pedido esté listo para recoger en nuestra tienda de Archena, Murcia.</p>
      </div>`
    : `<div style="background:#F9F6F2;padding:16px;margin-top:24px;border-left:3px solid #C9A96E;">
        <p style="margin:0;font-size:14px;font-weight:600;">Envío a domicilio</p>
        <p style="margin:4px 0 0;font-size:13px;color:#666;">${addr.street || ""}, ${addr.postalCode || ""} ${addr.city || ""}, ${addr.province || ""}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#666;">Te avisaremos cuando tu pedido sea enviado.</p>
      </div>`;

  const content = `
    <p style="font-size:16px;margin:0 0 4px;">Hola <strong>${order.customerName}</strong>,</p>
    <p style="font-size:14px;color:#666;margin:0 0 24px;">Gracias por tu compra. Tu pedido <strong>#${order.id}</strong> ha sido confirmado.</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="background:#111;color:#FAFAFA;">
        <td style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Producto</td>
        <td style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-align:center;">Ud.</td>
        <td style="padding:10px 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-align:right;">Precio</td>
      </tr>
      ${itemsRows}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      <tr>
        <td style="text-align:right;font-size:18px;font-weight:600;padding:8px 0;">
          Total: ${order.total.toFixed(2)} &euro;
        </td>
      </tr>
    </table>

    ${deliveryInfo}
  `;

  const html = baseTemplate(content);

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: order.email,
      subject: `Pedido #${order.id} confirmado — El Ropero de Carlota`,
      html,
    });
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
}

// ─── Newsletter email ───────────────────────────────────

export async function sendNewsletter(
  to: string,
  subject: string,
  content: string,
  unsubscribeToken: string
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${unsubscribeToken}`;

  const htmlContent = `
    <div style="font-size:14px;line-height:1.7;color:#333;">
      ${content}
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;">
    <p style="font-size:11px;color:#999;text-align:center;">
      Si no deseas recibir más emails, puedes <a href="${unsubscribeUrl}" style="color:#C9A96E;">darte de baja aquí</a>.
    </p>
  `;

  const html = baseTemplate(htmlContent);

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return true;
  } catch (err) {
    console.error(`Failed to send newsletter to ${to}:`, err);
    return false;
  }
}

// ─── Batch sending ──────────────────────────────────────

interface SubscriberForBatch {
  email: string;
  unsubscribeToken: string;
}

export async function sendNewsletterBatch(
  subscribers: SubscriberForBatch[],
  subject: string,
  content: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const ok = await sendNewsletter(sub.email, subject, content, sub.unsubscribeToken);
    if (ok) sent++;
    else failed++;
    // Small delay to avoid SMTP rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  return { sent, failed };
}
