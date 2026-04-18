import { Bot, InlineKeyboard, Keyboard, session } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// ─── Setup ───────────────────────────────────────────────

const prisma = new PrismaClient();
process.on("beforeExit", () => prisma.$disconnect());

interface StockMap { [size: string]: number }

interface SessionData {
  step?: string;
  productData?: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: number;
    images?: string[];
    sizes?: string[];
    colors?: string[];
    stock?: StockMap;
  };
  selectedSizes?: string[];
  selectedColors?: string[];
  editProductId?: number;
  stockEditSize?: string;
  productPage?: number;
  orderPage?: number;
  orderFilter?: string;
  newsletterSubject?: string;
  newsletterContent?: string;
}

type BotContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

const bot = new Bot<BotContext>(token);
bot.use(session({ initial: (): SessionData => ({}) }));
bot.catch((err) => console.error("Bot error:", err.error));

// ─── Constants ───────────────────────────────────────────

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Talla única"];
const COLORS = ["Negro", "Blanco", "Beige", "Rosa", "Azul", "Rojo", "Verde", "Marrón", "Gris"];
const PRODUCTS_PER_PAGE = 5;
const ORDERS_PER_PAGE = 5;

const STATUS_LABELS: Record<string, string> = {
  pending: "⏳ Pendiente",
  paid: "💳 Pagado",
  shipped: "🚚 Enviado",
  delivered: "✅ Entregado",
  cancelled: "❌ Cancelado",
};

// ─── Helpers ─────────────────────────────────────────────

function safeJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function resetSession(ctx: BotContext) {
  ctx.session.step = undefined;
  ctx.session.productData = undefined;
  ctx.session.selectedSizes = undefined;
  ctx.session.selectedColors = undefined;
  ctx.session.editProductId = undefined;
  ctx.session.newsletterSubject = undefined;
  ctx.session.newsletterContent = undefined;
}

function makeSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

async function downloadFile(fileId: string): Promise<string> {
  const file = await bot.api.getFile(fileId);
  const filePath = file.file_path!;
  const url = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(filePath) || ".jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const fullPath = path.join(uploadsDir, fileName);
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(fullPath);
    https.get(url, (res) => {
      res.pipe(stream);
      stream.on("finish", () => { stream.close(); resolve(`/uploads/products/${fileName}`); });
    }).on("error", reject);
  });
}

// ─── Main Menu (Reply Keyboard — always visible at bottom) ──

const mainMenu = new Keyboard()
  .text("📦 Productos").text("🛒 Pedidos")
  .row()
  .text("📊 Estadísticas").text("📨 Newsletter")
  .row()
  .text("❓ Ayuda")
  .resized()
  .persistent();

// ─── Keyboard Builders ───────────────────────────────────

function calcStockTotal(stock: StockMap): number {
  return Object.values(stock).reduce((a, b) => a + b, 0);
}

function formatStock(stock: StockMap): string {
  const entries = Object.entries(stock);
  if (entries.length === 0) return "Sin stock";
  return entries.map(([size, qty]) => {
    const icon = qty === 0 ? "🔴" : qty <= 2 ? "🟡" : "🟢";
    return `${icon} ${size}: *${qty}*`;
  }).join("\n");
}

function buildStockKeyboard(stock: StockMap, productId: number): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const size of Object.keys(stock)) {
    kb.text(`➖`, `sk:${productId}:${size}:-1`)
      .text(`${size}: ${stock[size]}`, "noop")
      .text(`➕`, `sk:${productId}:${size}:1`)
      .row();
  }
  kb.text("⬅️ Volver al producto", `pv:${productId}`);
  return kb;
}

function buildNewStockKeyboard(stock: StockMap): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const size of Object.keys(stock)) {
    kb.text(`➖`, `ns:${size}:-1`)
      .text(`${size}: ${stock[size]}`, "noop")
      .text(`➕`, `ns:${size}:1`)
      .row();
  }
  kb.text("✔️ Continuar", "nsd").row();
  kb.text("❌ Cancelar", "xx");
  return kb;
}

function buildSizesKeyboard(selected: string[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (let i = 0; i < SIZES.length; i++) {
    const s = SIZES[i];
    const icon = selected.includes(s) ? "✅" : "⬜";
    kb.text(`${icon} ${s}`, `sz:${i}`);
    if ((i + 1) % 3 === 0) kb.row();
  }
  if (SIZES.length % 3 !== 0) kb.row();
  kb.text("✔️ Continuar", "szd").text("❌ Cancelar", "xx");
  return kb;
}

function buildColorsKeyboard(selected: string[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (let i = 0; i < COLORS.length; i++) {
    const c = COLORS[i];
    const icon = selected.includes(c) ? "✅" : "⬜";
    kb.text(`${icon} ${c}`, `cl:${i}`);
    if ((i + 1) % 3 === 0) kb.row();
  }
  if (COLORS.length % 3 !== 0) kb.row();
  kb.text("✔️ Continuar", "cld").text("❌ Cancelar", "xx");
  return kb;
}

async function buildProductListMessage(page: number) {
  const total = await prisma.product.count();
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
    skip: page * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const kb = new InlineKeyboard();

  for (const p of products) {
    const status = p.active ? "✅" : "⛔";
    const stockTag = p.stockTotal === 0 ? " 🔴" : p.stockTotal <= 3 ? " 🟡" : "";
    kb.text(`${status} ${p.name} — ${p.price.toFixed(2)}€${stockTag}`, `pv:${p.id}`).row();
  }

  // Pagination
  if (totalPages > 1) {
    if (page > 0) kb.text("⬅️ Anterior", `pl:${page - 1}`);
    kb.text(`${page + 1}/${totalPages}`, `noop`);
    if (page < totalPages - 1) kb.text("Siguiente ➡️", `pl:${page + 1}`);
    kb.row();
  }

  kb.text("⬅️ Volver", "prod");

  const text =
    total === 0
      ? "📋 *No hay productos todavía*\n\nCrea tu primer producto desde el menú de Productos."
      : `📋 *Tus productos* (${total} en total)\n\nPulsa sobre un producto para gestionarlo:`;

  return { text, kb };
}

async function buildOrderListMessage(filter: string, page: number) {
  const where = filter === "all" ? {} : { status: filter };
  const total = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    skip: page * ORDERS_PER_PAGE,
    take: ORDERS_PER_PAGE,
  });
  const totalPages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
  const kb = new InlineKeyboard();

  for (const o of orders) {
    const emoji = STATUS_LABELS[o.status]?.split(" ")[0] || "❓";
    kb.text(`${emoji} #${o.id} — ${o.customerName} — ${o.total.toFixed(2)}€`, `ov:${o.id}`).row();
  }

  if (totalPages > 1) {
    if (page > 0) kb.text("⬅️", `ol:${filter}:${page - 1}`);
    kb.text(`${page + 1}/${totalPages}`, `noop`);
    if (page < totalPages - 1) kb.text("➡️", `ol:${filter}:${page + 1}`);
    kb.row();
  }

  kb.text("⬅️ Volver", "ord");

  const filterName = filter === "all" ? "Todos" : STATUS_LABELS[filter] || filter;
  const text =
    total === 0
      ? `🛒 *${filterName}*\n\nNo hay pedidos en esta categoría.`
      : `🛒 *${filterName}* (${total} pedido${total !== 1 ? "s" : ""})\n\nPulsa sobre un pedido para ver el detalle:`;

  return { text, kb };
}

// ─── /start ──────────────────────────────────────────────

bot.command("start", async (ctx) => {
  resetSession(ctx);
  await ctx.reply(
    "👋 *¡Hola!*\n\n" +
      "Soy el asistente de *El Ropero de Carlota*.\n" +
      "Desde aquí puedes gestionar tu tienda.\n\n" +
      "Usa los botones de abajo para navegar 👇",
    { parse_mode: "Markdown", reply_markup: mainMenu }
  );
});

// ─── Reply Keyboard Handlers (main menu buttons) ────────

bot.hears("📦 Productos", async (ctx) => {
  resetSession(ctx);
  const kb = new InlineKeyboard()
    .text("➕ Añadir producto", "np").row()
    .text("📋 Ver mis productos", "pl:0").row()
    .text("🏠 Menú principal", "mm");
  await ctx.reply("📦 *Productos*\n\n¿Qué quieres hacer?", {
    parse_mode: "Markdown",
    reply_markup: kb,
  });
});

bot.hears("🛒 Pedidos", async (ctx) => {
  resetSession(ctx);
  const pending = await prisma.order.count({ where: { status: "pending" } });
  const paid = await prisma.order.count({ where: { status: "paid" } });
  const shipped = await prisma.order.count({ where: { status: "shipped" } });

  const kb = new InlineKeyboard()
    .text(`⏳ Pendientes (${pending})`, "ol:pending:0")
    .text(`💳 Pagados (${paid})`, "ol:paid:0").row()
    .text(`🚚 Enviados (${shipped})`, "ol:shipped:0")
    .text("✅ Entregados", "ol:delivered:0").row()
    .text("📋 Ver todos", "ol:all:0").row()
    .text("🏠 Menú principal", "mm");

  await ctx.reply("🛒 *Pedidos*\n\n¿Qué pedidos quieres ver?", {
    parse_mode: "Markdown",
    reply_markup: kb,
  });
});

bot.hears("📊 Estadísticas", async (ctx) => {
  resetSession(ctx);
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthName = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

    const [activeProducts, totalProducts, monthOrders, pendingOrders] = await Promise.all([
      prisma.product.count({ where: { active: true } }),
      prisma.product.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: firstOfMonth }, status: { not: "cancelled" } },
      }),
      prisma.order.count({ where: { status: "pending" } }),
    ]);

    const totalSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

    const kb = new InlineKeyboard()
      .text("🔄 Actualizar", "stats")
      .text("🏠 Menú principal", "mm");

    await ctx.reply(
      `📊 *Estadísticas — ${monthName}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛍️  Productos activos: *${activeProducts}* de ${totalProducts}\n` +
        `📦  Pedidos del mes: *${monthOrders.length}*\n` +
        `⏳  Pedidos pendientes: *${pendingOrders}*\n` +
        `💰  Ventas del mes: *${totalSales.toFixed(2)}€*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`,
      { parse_mode: "Markdown", reply_markup: kb }
    );
  } catch (e) {
    console.error("Stats error:", e);
    await ctx.reply("❌ Error al obtener estadísticas.");
  }
});

bot.hears("❓ Ayuda", async (ctx) => {
  resetSession(ctx);
  const kb = new InlineKeyboard().text("🏠 Menú principal", "mm");
  await ctx.reply(
    "❓ *Ayuda*\n\n" +
      "Este bot te permite gestionar tu tienda\n" +
      "*El Ropero de Carlota* desde el móvil.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "📦 *Productos*\n" +
      "Crea, edita y gestiona tu catálogo.\n" +
      "Puedes subir fotos, elegir tallas y colores.\n\n" +
      "🛒 *Pedidos*\n" +
      "Revisa los pedidos y cambia su estado\n" +
      "(Pagado → Enviado → Entregado).\n\n" +
      "📊 *Estadísticas*\n" +
      "Resumen de ventas y productos del mes.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "💡 *Consejos:*\n" +
      "• Usa siempre los botones para navegar\n" +
      "• Puedes cancelar cualquier operación\n" +
      "• Las fotos se guardan al enviarlas\n" +
      "• Recibirás avisos de nuevos pedidos automáticamente",
    { parse_mode: "Markdown", reply_markup: kb }
  );
});

bot.hears("📨 Newsletter", async (ctx) => {
  resetSession(ctx);
  try {
    const [totalSubs, activeSubs, emailSubs] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { active: true } }),
      prisma.subscriber.count({ where: { active: true, wantsEmail: true } }),
    ]);

    const kb = new InlineKeyboard()
      .text("✉️ Enviar newsletter", "nw:compose").row()
      .text("👥 Ver suscriptores", "nw:list:0").row()
      .text("🏠 Menú principal", "mm");

    await ctx.reply(
      `📨 *Newsletter*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👥  Total suscriptores: *${totalSubs}*\n` +
        `✅  Activos: *${activeSubs}*\n` +
        `📧  Reciben email: *${emailSubs}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`,
      { parse_mode: "Markdown", reply_markup: kb }
    );
  } catch (e) {
    console.error("Newsletter menu error:", e);
    await ctx.reply("❌ Error al cargar datos de newsletter.");
  }
});

// ─── Callback Queries ────────────────────────────────────

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  try {
    // ── Navigation ─────────────────────────────────

    if (data === "noop") {
      await ctx.answerCallbackQuery();
      return;
    }

    if (data === "mm") {
      resetSession(ctx);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        "🏠 *Menú principal*\n\nUsa los botones de abajo para navegar 👇",
        { parse_mode: "Markdown" }
      );
      return;
    }

    if (data === "xx") {
      resetSession(ctx);
      await ctx.answerCallbackQuery({ text: "Operación cancelada" });
      await ctx.editMessageText("❌ Operación cancelada.\n\nUsa los botones de abajo para continuar.");
      return;
    }

    if (data === "prod") {
      resetSession(ctx);
      const kb = new InlineKeyboard()
        .text("➕ Añadir producto", "np").row()
        .text("📋 Ver mis productos", "pl:0").row()
        .text("🏠 Menú principal", "mm");
      await ctx.answerCallbackQuery();
      await ctx.editMessageText("📦 *Productos*\n\n¿Qué quieres hacer?", {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
      return;
    }

    if (data === "ord") {
      resetSession(ctx);
      const pending = await prisma.order.count({ where: { status: "pending" } });
      const paid = await prisma.order.count({ where: { status: "paid" } });
      const shipped = await prisma.order.count({ where: { status: "shipped" } });
      const kb = new InlineKeyboard()
        .text(`⏳ Pendientes (${pending})`, "ol:pending:0")
        .text(`💳 Pagados (${paid})`, "ol:paid:0").row()
        .text(`🚚 Enviados (${shipped})`, "ol:shipped:0")
        .text("✅ Entregados", "ol:delivered:0").row()
        .text("📋 Ver todos", "ol:all:0").row()
        .text("🏠 Menú principal", "mm");
      await ctx.answerCallbackQuery();
      await ctx.editMessageText("🛒 *Pedidos*\n\n¿Qué pedidos quieres ver?", {
        parse_mode: "Markdown",
        reply_markup: kb,
      });
      return;
    }

    if (data === "stats") {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthName = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      const [activeProducts, totalProducts, monthOrders, pendingOrders] = await Promise.all([
        prisma.product.count({ where: { active: true } }),
        prisma.product.count(),
        prisma.order.findMany({
          where: { createdAt: { gte: firstOfMonth }, status: { not: "cancelled" } },
        }),
        prisma.order.count({ where: { status: "pending" } }),
      ]);
      const totalSales = monthOrders.reduce((sum, o) => sum + o.total, 0);
      const kb = new InlineKeyboard()
        .text("🔄 Actualizar", "stats")
        .text("🏠 Menú principal", "mm");
      await ctx.answerCallbackQuery({ text: "Actualizado" });
      await ctx.editMessageText(
        `📊 *Estadísticas — ${monthName}*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🛍️  Productos activos: *${activeProducts}* de ${totalProducts}\n` +
          `📦  Pedidos del mes: *${monthOrders.length}*\n` +
          `⏳  Pedidos pendientes: *${pendingOrders}*\n` +
          `💰  Ventas del mes: *${totalSales.toFixed(2)}€*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Product List ───────────────────────────────

    if (data.startsWith("pl:")) {
      const page = parseInt(data.split(":")[1]) || 0;
      const { text, kb } = await buildProductListMessage(page);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
      return;
    }

    // ── Product Detail ─────────────────────────────

    if (data.startsWith("pv:")) {
      const id = parseInt(data.split(":")[1]);
      const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
      if (!product) {
        await ctx.answerCallbackQuery({ text: "Producto no encontrado" });
        return;
      }
      const images = safeJson<string[]>(product.images, []);
      const sizes = safeJson<string[]>(product.sizes, []);
      const colors = safeJson<string[]>(product.colors, []);

      const stockMap: StockMap = safeJson<StockMap>(product.stock, {});
      const stockTotal = calcStockTotal(stockMap);
      const stockWarn = stockTotal === 0 ? " ⚠️ SIN STOCK" : stockTotal <= 3 ? " ⚠️ Poco stock" : "";

      const kb = new InlineKeyboard()
        .text("✏️ Editar", `pe:${id}`).row()
        .text(product.active ? "⛔ Desactivar" : "✅ Activar", `pt:${id}`)
        .text("🗑 Eliminar", `pdq:${id}`).row()
        .text("⬅️ Volver a productos", "pl:0");

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `📦 *${product.name}*\n\n` +
          `📁  Categoría: ${product.category.name}\n` +
          `💰  Precio: *${product.price.toFixed(2)}€*\n` +
          (product.compareAtPrice ? `🏷️  Antes: ${product.compareAtPrice.toFixed(2)}€\n` : "") +
          `🎨  Colores: ${colors.length > 0 ? colors.join(", ") : "—"}\n` +
          `📸  Fotos: ${images.length}\n` +
          `🔘  Estado: ${product.active ? "✅ Activo" : "⛔ Desactivado"}\n\n` +
          `📊 *Stock:* ${stockTotal} uds${stockWarn}\n` +
          formatStock(stockMap),
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Toggle Product ─────────────────────────────

    if (data.startsWith("pt:")) {
      const id = parseInt(data.split(":")[1]);
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      const updated = await prisma.product.update({ where: { id }, data: { active: !product.active } });
      await ctx.answerCallbackQuery({
        text: updated.active ? "✅ Producto activado" : "⛔ Producto desactivado",
      });
      const full = await prisma.product.findUnique({ where: { id }, include: { category: true } });
      if (!full) return;
      const images = safeJson<string[]>(full.images, []);
      const colors = safeJson<string[]>(full.colors, []);
      const stockMap: StockMap = safeJson<StockMap>(full.stock, {});
      const stockTotal = calcStockTotal(stockMap);
      const stockWarn = stockTotal === 0 ? " ⚠️ SIN STOCK" : stockTotal <= 3 ? " ⚠️ Poco stock" : "";
      const kb = new InlineKeyboard()
        .text("✏️ Editar", `pe:${id}`).row()
        .text(full.active ? "⛔ Desactivar" : "✅ Activar", `pt:${id}`)
        .text("🗑 Eliminar", `pdq:${id}`).row()
        .text("⬅️ Volver a productos", "pl:0");
      await ctx.editMessageText(
        `📦 *${full.name}*\n\n` +
          `📁  Categoría: ${full.category.name}\n` +
          `💰  Precio: *${full.price.toFixed(2)}€*\n` +
          (full.compareAtPrice ? `🏷️  Antes: ${full.compareAtPrice.toFixed(2)}€\n` : "") +
          `🎨  Colores: ${colors.length > 0 ? colors.join(", ") : "—"}\n` +
          `📸  Fotos: ${images.length}\n` +
          `🔘  Estado: ${full.active ? "✅ Activo" : "⛔ Desactivado"}\n\n` +
          `📊 *Stock:* ${stockTotal} uds${stockWarn}\n` +
          formatStock(stockMap),
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Delete Product (ask) ───────────────────────

    if (data.startsWith("pdq:")) {
      const id = parseInt(data.split(":")[1]);
      const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      const images = safeJson<string[]>(product.images, []);
      const sizes = safeJson<string[]>(product.sizes, []);
      const kb = new InlineKeyboard()
        .text("🗑 Sí, ELIMINAR definitivamente", `pdy:${id}`).row()
        .text("⬅️ No, volver atrás", `pv:${id}`);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `⚠️ *¿Seguro que quieres eliminar este producto?*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📦  ${product.name}\n` +
          `📁  ${product.category.name}\n` +
          `💰  ${product.price.toFixed(2)}€\n` +
          `📏  ${sizes.length > 0 ? sizes.join(", ") : "sin tallas"}\n` +
          `📸  ${images.length} foto${images.length !== 1 ? "s" : ""}\n` +
          `📊  ${product.stockTotal} en stock\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🚨 *Esta acción no se puede deshacer.*\n` +
          `El producto desaparecerá de la web.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Delete Product (confirm) ───────────────────

    if (data.startsWith("pdy:")) {
      const id = parseInt(data.split(":")[1]);
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "Ya eliminado" }); return; }
      await prisma.product.delete({ where: { id } });
      await ctx.answerCallbackQuery({ text: "Producto eliminado" });
      const kb = new InlineKeyboard()
        .text("📋 Ver productos", "pl:0").row()
        .text("🏠 Menú principal", "mm");
      await ctx.editMessageText(
        `🗑 *Producto eliminado correctamente*\n\n` +
          `Se ha eliminado: _${product.name}_\n\n` +
          `Ya no aparece en la tienda.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Edit Product Menu ──────────────────────────

    if (data.startsWith("pe:")) {
      const id = parseInt(data.split(":")[1]);
      ctx.session.editProductId = id;
      const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      const sizes = safeJson<string[]>(product.sizes, []);
      const colors = safeJson<string[]>(product.colors, []);
      const images = safeJson<string[]>(product.images, []);

      const kb = new InlineKeyboard()
        .text("📝 Nombre", "en").text("💰 Precio", "ep").row()
        .text("📄 Descripción", "ed").row()
        .text("📏 Tallas", "es").text("🎨 Colores", "ec").row()
        .text("📸 Añadir fotos", "ef").text("📊 Stock", "ek").row()
        .text("⬅️ Volver", `pv:${id}`);

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `✏️ *Editando: ${product.name}*\n\n` +
          `Estos son los datos actuales. Pulsa el que\n` +
          `quieras cambiar:\n\n` +
          `📝 Nombre: _${product.name}_\n` +
          `💰 Precio: _${product.price.toFixed(2)}€_\n` +
          `📄 Descripción: _${product.description ? product.description.slice(0, 60) + (product.description.length > 60 ? "..." : "") : "Sin descripción"}_\n` +
          `📏 Tallas: _${sizes.length > 0 ? sizes.join(", ") : "ninguna"}_\n` +
          `🎨 Colores: _${colors.length > 0 ? colors.join(", ") : "ninguno"}_\n` +
          `📸 Fotos: _${images.length}_\n` +
          `📊 Stock: _${product.stockTotal} unidades_`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Edit Fields (start text input) ─────────────

    if (data === "en") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      ctx.session.step = "edit_name";
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard().text("❌ Cancelar", `pe:${id}`);
      await ctx.reply(
        `📝 *Cambiar nombre*\n\n` +
          `Nombre actual:\n` +
          `▸ _${product.name}_\n\n` +
          `Escribe el nuevo nombre:`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (data === "ep") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      ctx.session.step = "edit_price";
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard().text("❌ Cancelar", `pe:${id}`);
      await ctx.reply(
        `💰 *Cambiar precio*\n\n` +
          `Precio actual:\n` +
          `▸ _${product.price.toFixed(2)}€_\n\n` +
          `Escribe el nuevo precio (ejemplo: 29.90):`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (data === "ed") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      ctx.session.step = "edit_desc";
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard().text("❌ Cancelar", `pe:${id}`);
      await ctx.reply(
        `📄 *Cambiar descripción*\n\n` +
          `Descripción actual:\n` +
          `▸ _${product.description || "Sin descripción"}_\n\n` +
          `Escribe la nueva descripción:`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (data === "ek") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      const stock: StockMap = safeJson<StockMap>(product.stock, {});
      const total = calcStockTotal(stock);
      if (Object.keys(stock).length === 0) {
        // No sizes configured yet, show message
        const kb = new InlineKeyboard().text("⬅️ Volver", `pe:${id}`);
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
          `📊 *Stock de: ${product.name}*\n\n` +
            `⚠️ Este producto no tiene tallas configuradas.\n` +
            `Primero ve a *Editar → Tallas* para añadir tallas.`,
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `📊 *Stock de: ${product.name}*\n\nTotal: *${total} unidades*\n\n` + formatStock(stock),
        { parse_mode: "Markdown", reply_markup: buildStockKeyboard(stock, id) }
      );
      return;
    }

    // stk and stw removed — replaced by sk: handler above

    if (data.startsWith("stw:")) {
      // Legacy: ignore
      await ctx.answerCallbackQuery();
      return;
    }

    if (data.startsWith("stk:")) {
      // Legacy: ignore
      await ctx.answerCallbackQuery();
      return;
    }

    if (data === "es") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      ctx.session.step = "edit_sizes";
      const current = safeJson<string[]>(product.sizes, []);
      ctx.session.selectedSizes = current;
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `📏 *Tallas de: ${product.name}*\n\n` +
          `Actuales: _${current.length > 0 ? current.join(", ") : "ninguna"}_\n\n` +
          `Pulsa para marcar o desmarcar:`,
        { parse_mode: "Markdown", reply_markup: buildSizesKeyboard(ctx.session.selectedSizes) }
      );
      return;
    }

    if (data === "ec") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      ctx.session.step = "edit_colors";
      const current = safeJson<string[]>(product.colors, []);
      ctx.session.selectedColors = current;
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `🎨 *Colores de: ${product.name}*\n\n` +
          `Actuales: _${current.length > 0 ? current.join(", ") : "ninguno"}_\n\n` +
          `Pulsa para marcar o desmarcar:`,
        { parse_mode: "Markdown", reply_markup: buildColorsKeyboard(ctx.session.selectedColors) }
      );
      return;
    }

    if (data === "ef") {
      const id = ctx.session.editProductId;
      if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      const images = safeJson<string[]>(product.images, []);
      ctx.session.step = "edit_photos";
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard()
        .text("✔️ He terminado", "phd").row()
        .text("🗑 Borrar todas las fotos", `phc:${id}`).row()
        .text("❌ Cancelar", `pe:${id}`);
      await ctx.reply(
        `📸 *Fotos de: ${product.name}*\n\n` +
          `Fotos actuales: _${images.length}_\n\n` +
          `Envía nuevas fotos y se añadirán a las existentes.\n` +
          `Cuando termines, pulsa *He terminado*.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Clear all photos ───────────────────────────

    if (data.startsWith("phc:")) {
      const id = parseInt(data.split(":")[1]);
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      await prisma.product.update({ where: { id }, data: { images: "[]" } });
      ctx.session.step = undefined;
      await ctx.answerCallbackQuery({ text: "Fotos eliminadas" });
      const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
      await ctx.reply(
        `🗑 *Fotos eliminadas*\n\nPuedes subir nuevas fotos desde el menú de edición.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Size Toggle ────────────────────────────────

    if (data.startsWith("sz:")) {
      const idx = parseInt(data.split(":")[1]);
      const size = SIZES[idx];
      if (!size) { await ctx.answerCallbackQuery(); return; }

      const selected = ctx.session.selectedSizes || [];
      if (selected.includes(size)) {
        ctx.session.selectedSizes = selected.filter((s) => s !== size);
      } else {
        ctx.session.selectedSizes = [...selected, size];
      }

      await ctx.answerCallbackQuery();
      const step = ctx.session.step;
      const title = step === "new_sizes"
        ? "📏 *Selecciona las tallas disponibles*\n\nPulsa para marcar o desmarcar:"
        : "📏 *Selecciona las tallas disponibles*\n\nPulsa para marcar o desmarcar:";
      await ctx.editMessageText(title, {
        parse_mode: "Markdown",
        reply_markup: buildSizesKeyboard(ctx.session.selectedSizes),
      });
      return;
    }

    // ── Sizes Done ─────────────────────────────────

    if (data === "szd") {
      const step = ctx.session.step;

      if (step === "edit_sizes") {
        const id = ctx.session.editProductId;
        if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
        await prisma.product.update({
          where: { id },
          data: { sizes: JSON.stringify(ctx.session.selectedSizes || []) },
        });
        const sizes = (ctx.session.selectedSizes || []).join(", ") || "ninguna";
        ctx.session.step = undefined;
        ctx.session.selectedSizes = undefined;
        await ctx.answerCallbackQuery({ text: "Tallas actualizadas" });
        const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
        await ctx.editMessageText(
          `✅ *Tallas actualizadas*\n\n📏 ${sizes}`,
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }

      if (step === "new_sizes") {
        const sizes = ctx.session.selectedSizes || [];
        if (sizes.length === 0) {
          await ctx.answerCallbackQuery({ text: "Selecciona al menos una talla" });
          return;
        }
        // Initialize stock per size at 0
        const stock: StockMap = {};
        for (const s of sizes) stock[s] = 0;
        ctx.session.productData!.stock = stock;
        ctx.session.step = "new_stock";
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
          "📊 *Nuevo producto — Stock por talla*\n\n" +
            "Usa los botones *➕* y *➖* para indicar\n" +
            "cuántas unidades tienes de cada talla:",
          { parse_mode: "Markdown", reply_markup: buildNewStockKeyboard(stock) }
        );
        return;
      }

      await ctx.answerCallbackQuery();
      return;
    }

    // ── Color Toggle ───────────────────────────────

    if (data.startsWith("cl:")) {
      const idx = parseInt(data.split(":")[1]);
      const color = COLORS[idx];
      if (!color) { await ctx.answerCallbackQuery(); return; }

      const selected = ctx.session.selectedColors || [];
      if (selected.includes(color)) {
        ctx.session.selectedColors = selected.filter((c) => c !== color);
      } else {
        ctx.session.selectedColors = [...selected, color];
      }

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        "🎨 *Selecciona los colores disponibles*\n\nPulsa para marcar o desmarcar:",
        {
          parse_mode: "Markdown",
          reply_markup: buildColorsKeyboard(ctx.session.selectedColors),
        }
      );
      return;
    }

    // ── Colors Done ────────────────────────────────

    if (data === "cld") {
      const step = ctx.session.step;

      if (step === "edit_colors") {
        const id = ctx.session.editProductId;
        if (!id) { await ctx.answerCallbackQuery({ text: "Error" }); return; }
        await prisma.product.update({
          where: { id },
          data: { colors: JSON.stringify(ctx.session.selectedColors || []) },
        });
        const colors = (ctx.session.selectedColors || []).join(", ") || "ninguno";
        ctx.session.step = undefined;
        ctx.session.selectedColors = undefined;
        await ctx.answerCallbackQuery({ text: "Colores actualizados" });
        const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
        await ctx.editMessageText(
          `✅ *Colores actualizados*\n\n🎨 ${colors}`,
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }

      if (step === "new_colors") {
        // Show preview before creating
        const pd = ctx.session.productData!;
        const category = pd.categoryId
          ? await prisma.category.findUnique({ where: { id: pd.categoryId } })
          : null;
        const sizes = (ctx.session.selectedSizes || []).join(", ") || "ninguna";
        const colors = (ctx.session.selectedColors || []).join(", ") || "ninguno";
        pd.sizes = ctx.session.selectedSizes || [];
        pd.colors = ctx.session.selectedColors || [];

        const kb = new InlineKeyboard()
          .text("✅ Publicar producto", "npc").row()
          .text("❌ Cancelar", "xx");

        await ctx.answerCallbackQuery();
        await ctx.editMessageText(
          "👀 *Vista previa del producto*\n\n" +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📌  Nombre: *${pd.name}*\n` +
            `📄  Descripción: ${pd.description || "—"}\n` +
            `💰  Precio: *${pd.price?.toFixed(2)}€*\n` +
            `📁  Categoría: ${category?.name || "—"}\n` +
            `📏  Tallas: ${sizes}\n` +
            `🎨  Colores: ${colors}\n` +
            `📸  Fotos: ${(pd.images || []).length}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            "¿Todo correcto? Pulsa *Publicar* para añadirlo a la tienda.",
          { parse_mode: "Markdown", reply_markup: kb }
        );
        return;
      }

      await ctx.answerCallbackQuery();
      return;
    }

    // ── New Product: Confirm ───────────────────────

    if (data === "npc") {
      const pd = ctx.session.productData;
      if (!pd || !pd.name || !pd.price || !pd.categoryId) {
        await ctx.answerCallbackQuery({ text: "Datos incompletos" });
        return;
      }

      const slug = makeSlug(pd.name);
      const stockMap = pd.stock || {};
      const product = await prisma.product.create({
        data: {
          name: pd.name,
          slug,
          description: pd.description || "",
          price: pd.price,
          categoryId: pd.categoryId,
          images: JSON.stringify(pd.images || []),
          sizes: JSON.stringify(pd.sizes || []),
          colors: JSON.stringify(pd.colors || []),
          stock: JSON.stringify(stockMap),
          stockTotal: calcStockTotal(stockMap),
          active: true,
        },
      });

      resetSession(ctx);
      await ctx.answerCallbackQuery({ text: "¡Producto creado!" });
      const kb = new InlineKeyboard()
        .text("📦 Ver producto", `pv:${product.id}`).row()
        .text("➕ Crear otro", "np")
        .text("🏠 Menú principal", "mm");
      await ctx.editMessageText(
        `🎉 *¡Producto publicado!*\n\n` +
          `📌 ${product.name}\n` +
          `💰 ${product.price.toFixed(2)}€\n` +
          `🆔 ID: ${product.id}\n\n` +
          `Ya está visible en la tienda.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── New Product: Start ─────────────────────────

    if (data === "np") {
      resetSession(ctx);
      ctx.session.step = "new_name";
      ctx.session.productData = {};
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard().text("❌ Cancelar", "xx");
      await ctx.reply(
        "✨ *Nuevo producto — Paso 1 de 6*\n\n" +
          "📝 Escribe el *nombre* del producto\n\n" +
          "_Ejemplo: Vestido flores manga larga_",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Photos Done ────────────────────────────────

    if (data === "phd") {
      const step = ctx.session.step;

      if (step === "edit_photos") {
        const id = ctx.session.editProductId;
        ctx.session.step = undefined;
        await ctx.answerCallbackQuery({ text: "Fotos guardadas" });
        if (id) {
          const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
          await ctx.editMessageText("✅ *Fotos añadidas correctamente*", {
            parse_mode: "Markdown",
            reply_markup: kb,
          });
        }
        return;
      }

      if (step === "new_photos") {
        ctx.session.step = "new_sizes";
        ctx.session.selectedSizes = [];
        await ctx.answerCallbackQuery();
        await ctx.reply(
          "📏 *Nuevo producto — Paso 5 de 6*\n\n" +
            "Selecciona las *tallas* disponibles.\n" +
            "Pulsa para marcar o desmarcar:",
          { parse_mode: "Markdown", reply_markup: buildSizesKeyboard([]) }
        );
        return;
      }

      await ctx.answerCallbackQuery();
      return;
    }

    // ── New Product Stock Adjust ─────────────────────

    if (data.startsWith("ns:")) {
      const parts = data.split(":");
      const size = parts[1];
      const delta = parseInt(parts[2]);
      const stock = ctx.session.productData?.stock || {};
      stock[size] = Math.max(0, (stock[size] || 0) + delta);
      ctx.session.productData!.stock = stock;
      await ctx.answerCallbackQuery({ text: `${size}: ${stock[size]}` });
      await ctx.editMessageText(
        "📊 *Nuevo producto — Stock por talla*\n\n" +
          "Usa los botones *➕* y *➖* para indicar\n" +
          "cuántas unidades tienes de cada talla:",
        { parse_mode: "Markdown", reply_markup: buildNewStockKeyboard(stock) }
      );
      return;
    }

    if (data === "nsd") {
      const stock = ctx.session.productData?.stock || {};
      const total = calcStockTotal(stock);
      if (total === 0) {
        await ctx.answerCallbackQuery({ text: "Añade al menos 1 unidad" });
        return;
      }
      ctx.session.productData!.sizes = Object.keys(stock);
      ctx.session.step = "new_colors";
      ctx.session.selectedColors = [];
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        "🎨 *Selecciona los colores disponibles*\n\nPulsa para marcar o desmarcar:",
        { parse_mode: "Markdown", reply_markup: buildColorsKeyboard([]) }
      );
      return;
    }

    // ── Edit Stock per Size ────────────────────────

    if (data.startsWith("sk:")) {
      const parts = data.split(":");
      const id = parseInt(parts[1]);
      const size = parts[2];
      const delta = parseInt(parts[3]);
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }
      const stock: StockMap = safeJson<StockMap>(product.stock, {});
      stock[size] = Math.max(0, (stock[size] || 0) + delta);
      const total = calcStockTotal(stock);
      await prisma.product.update({
        where: { id },
        data: { stock: JSON.stringify(stock), stockTotal: total },
      });
      await ctx.answerCallbackQuery({ text: `${size}: ${stock[size]}` });
      await ctx.editMessageText(
        `📊 *Stock de: ${product.name}*\n\nTotal: *${total} unidades*\n\n` + formatStock(stock),
        { parse_mode: "Markdown", reply_markup: buildStockKeyboard(stock, id) }
      );
      return;
    }

    // ── Skip Description (new product) ─────────────

    if (data === "skip_desc") {
      ctx.session.productData!.description = "";
      ctx.session.step = "new_price";
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard().text("❌ Cancelar", "xx");
      await ctx.reply(
        "✨ *Nuevo producto — Paso 3 de 6*\n\n" +
          "💰 Escribe el *precio* del producto\n\n" +
          "_Ejemplo: 29.90_",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Category Selection (new product) ───────────

    if (data.startsWith("cat:")) {
      const catId = parseInt(data.split(":")[1]);
      if (ctx.session.productData) {
        ctx.session.productData.categoryId = catId;
        ctx.session.productData.images = [];
        ctx.session.step = "new_photos";
        await ctx.answerCallbackQuery();
        const kb = new InlineKeyboard()
          .text("✔️ He terminado", "phd").row()
          .text("❌ Cancelar", "xx");
        await ctx.reply(
          "📸 *Nuevo producto — Paso 4 de 6*\n\n" +
            "Envía las *fotos* del producto (1 a 5).\n\n" +
            "Cuando termines, pulsa *He terminado*.\n\n" +
            "_Puedes enviar varias fotos seguidas._",
          { parse_mode: "Markdown", reply_markup: kb }
        );
      }
      return;
    }

    // ── Order List ─────────────────────────────────

    if (data.startsWith("ol:")) {
      const parts = data.split(":");
      const filter = parts[1];
      const page = parseInt(parts[2]) || 0;
      const { text, kb } = await buildOrderListMessage(filter, page);
      await ctx.answerCallbackQuery();
      await ctx.editMessageText(text, { parse_mode: "Markdown", reply_markup: kb });
      return;
    }

    // ── Order Detail ───────────────────────────────

    if (data.startsWith("ov:")) {
      const id = parseInt(data.split(":")[1]);
      const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) { await ctx.answerCallbackQuery({ text: "No encontrado" }); return; }

      const address = safeJson<Record<string, string>>(order.address, {});
      const items = order.items
        .map((i) => `  • ${i.productName} x${i.quantity}${i.size ? ` (${i.size})` : ""}${i.color ? ` [${i.color}]` : ""} — ${i.price.toFixed(2)}€`)
        .join("\n");

      const status = STATUS_LABELS[order.status] || order.status;

      const kb = new InlineKeyboard();
      if (order.status === "paid") kb.text("📦 Marcar como enviado", `os:${id}`).row();
      if (order.status === "shipped") kb.text("✅ Marcar como entregado", `odl:${id}`).row();
      kb.text("⬅️ Volver", "ord");

      await ctx.answerCallbackQuery();
      const isPickup = order.deliveryMethod === "pickup";
      const deliveryLine = isPickup
        ? "🏪  Recogida en tienda"
        : address.street ? `📦  Envío a: ${address.street}, ${address.city || ""} ${address.postalCode || ""}` : "";

      await ctx.editMessageText(
        `📦 *Pedido #${order.id}*\n\n` +
          `👤  Cliente: ${order.customerName}\n` +
          `📧  Email: ${order.email}\n` +
          (order.phone ? `📱  Teléfono: ${order.phone}\n` : "") +
          (deliveryLine ? `${deliveryLine}\n` : "") +
          `\n📋 *Productos:*\n${items || "  (vacío)"}\n\n` +
          `💰  Total: *${order.total.toFixed(2)}€*\n` +
          `📊  Estado: *${status}*\n` +
          `📅  Fecha: ${order.createdAt.toLocaleDateString("es-ES")}`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Newsletter ─────────────────────────────────

    if (data === "nw:compose") {
      ctx.session.step = "newsletter_subject";
      ctx.session.newsletterSubject = undefined;
      ctx.session.newsletterContent = undefined;
      await ctx.answerCallbackQuery();
      const kb = new InlineKeyboard().text("❌ Cancelar", "xx");
      await ctx.editMessageText(
        "✉️ *Enviar Newsletter*\n\n" +
          "Paso 1/2 — Escribe el *asunto* del email:",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (data === "nw:confirm") {
      const subject = ctx.session.newsletterSubject;
      const content = ctx.session.newsletterContent;
      if (!subject || !content) {
        await ctx.answerCallbackQuery({ text: "Faltan datos" });
        return;
      }

      await ctx.answerCallbackQuery();
      await ctx.editMessageText("⏳ *Enviando newsletter...*\n\nEsto puede tardar unos segundos.", { parse_mode: "Markdown" });

      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/newsletter/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            content: `<p>${content.replace(/\n/g, "</p><p>")}</p>`,
            botSecret: process.env.BOT_NEWSLETTER_SECRET,
          }),
        });
        const result = await res.json() as { sent?: number; failed?: number; total?: number; error?: string };

        if (!res.ok) {
          await ctx.reply(`❌ Error: ${result.error || "Error desconocido"}`, { reply_markup: mainMenu });
        } else {
          await ctx.reply(
            `✅ *Newsletter enviada*\n\n` +
              `📧 Enviados: *${result.sent}*\n` +
              `❌ Fallidos: *${result.failed}*\n` +
              `👥 Total destinatarios: *${result.total}*`,
            { parse_mode: "Markdown", reply_markup: mainMenu }
          );
        }
      } catch (e) {
        console.error("Newsletter send error:", e);
        await ctx.reply("❌ Error al enviar la newsletter. ¿Está el servidor web activo?", { reply_markup: mainMenu });
      }
      resetSession(ctx);
      return;
    }

    if (data === "nw:cancel") {
      resetSession(ctx);
      await ctx.answerCallbackQuery({ text: "Newsletter cancelada" });
      await ctx.editMessageText("❌ Newsletter cancelada.\n\nUsa los botones de abajo para continuar.");
      return;
    }

    if (data.startsWith("nw:list:")) {
      const page = parseInt(data.split(":")[2]);
      const perPage = 10;
      const [subscribers, total] = await Promise.all([
        prisma.subscriber.findMany({
          where: { active: true },
          orderBy: { createdAt: "desc" },
          skip: page * perPage,
          take: perPage,
        }),
        prisma.subscriber.count({ where: { active: true } }),
      ]);

      if (subscribers.length === 0) {
        await ctx.answerCallbackQuery();
        const kb = new InlineKeyboard().text("⬅️ Volver", "nw:back");
        await ctx.editMessageText("👥 No hay suscriptores activos.", { reply_markup: kb });
        return;
      }

      const list = subscribers
        .map((s) => {
          const prefs = [s.wantsEmail ? "📧" : "", s.wantsWhatsapp ? "💬" : ""].filter(Boolean).join("");
          return `• ${s.email} ${prefs}\n  _${s.createdAt.toLocaleDateString("es-ES")} · ${s.consentSource}_`;
        })
        .join("\n");

      const totalPages = Math.ceil(total / perPage);
      const kb = new InlineKeyboard();
      if (page > 0) kb.text("⬅️ Anterior", `nw:list:${page - 1}`);
      if (page < totalPages - 1) kb.text("➡️ Siguiente", `nw:list:${page + 1}`);
      kb.row().text("⬅️ Volver", "nw:back");

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `👥 *Suscriptores* (${total} activos)\n` +
          `Página ${page + 1}/${totalPages}\n\n${list}`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (data === "nw:back") {
      const [totalSubs, activeSubs, emailSubs] = await Promise.all([
        prisma.subscriber.count(),
        prisma.subscriber.count({ where: { active: true } }),
        prisma.subscriber.count({ where: { active: true, wantsEmail: true } }),
      ]);

      const kb = new InlineKeyboard()
        .text("✉️ Enviar newsletter", "nw:compose").row()
        .text("👥 Ver suscriptores", "nw:list:0").row()
        .text("🏠 Menú principal", "mm");

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        `📨 *Newsletter*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👥  Total suscriptores: *${totalSubs}*\n` +
          `✅  Activos: *${activeSubs}*\n` +
          `📧  Reciben email: *${emailSubs}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Ship Order ─────────────────────────────────

    if (data.startsWith("os:")) {
      const id = parseInt(data.split(":")[1]);
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order || order.status !== "paid") {
        await ctx.answerCallbackQuery({ text: "No se puede enviar este pedido" });
        return;
      }
      await prisma.order.update({ where: { id }, data: { status: "shipped" } });
      await ctx.answerCallbackQuery({ text: "✅ Marcado como enviado" });
      // Refresh detail
      const kb = new InlineKeyboard()
        .text("✅ Marcar como entregado", `odl:${id}`).row()
        .text("⬅️ Volver", "ord");
      await ctx.editMessageText(
        `🚚 *Pedido #${id} — Enviado*\n\n` +
          `El pedido de *${order.customerName}* ha sido marcado como enviado.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Deliver Order ──────────────────────────────

    if (data.startsWith("odl:")) {
      const id = parseInt(data.split(":")[1]);
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order || order.status !== "shipped") {
        await ctx.answerCallbackQuery({ text: "No se puede entregar este pedido" });
        return;
      }
      await prisma.order.update({ where: { id }, data: { status: "delivered" } });
      await ctx.answerCallbackQuery({ text: "✅ Marcado como entregado" });
      const kb = new InlineKeyboard().text("⬅️ Volver", "ord");
      await ctx.editMessageText(
        `✅ *Pedido #${id} — Entregado*\n\n` +
          `El pedido de *${order.customerName}* ha sido completado.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    await ctx.answerCallbackQuery();
  } catch (e) {
    console.error("Callback error:", e);
    try { await ctx.answerCallbackQuery({ text: "❌ Ha ocurrido un error" }); } catch {}
  }
});

// ─── Text Messages (flow handler + fallback) ────────────

bot.on("message:text", async (ctx) => {
  const step = ctx.session.step;
  const text = ctx.message.text.trim();

  // No active flow → show main menu
  if (!step) {
    await ctx.reply(
      "👋 Usa los botones de abajo para navegar 👇",
      { reply_markup: mainMenu }
    );
    return;
  }

  try {
    // ── New Product Flow ─────────────────────────

    if (step === "new_name") {
      ctx.session.productData!.name = text;
      ctx.session.step = "new_desc";
      const kb = new InlineKeyboard().text("⏩ Saltar", "skip_desc").text("❌ Cancelar", "xx");
      await ctx.reply(
        "✨ *Nuevo producto — Paso 2 de 6*\n\n" +
          "📄 Escribe una *descripción* del producto\n\n" +
          "_Ejemplo: Vestido elegante con estampado floral, perfecto para primavera._\n\n" +
          "Si no quieres descripción, pulsa *Saltar*.",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (step === "new_desc") {
      ctx.session.productData!.description = text;
      ctx.session.step = "new_price";
      const kb = new InlineKeyboard().text("❌ Cancelar", "xx");
      await ctx.reply(
        "✨ *Nuevo producto — Paso 3 de 6*\n\n" +
          "💰 Escribe el *precio* del producto\n\n" +
          "_Ejemplo: 29.90_",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (step === "new_price") {
      const price = parseFloat(text.replace(",", "."));
      if (isNaN(price) || price <= 0) {
        await ctx.reply("⚠️ Precio no válido. Escribe un número positivo.\n\n_Ejemplo: 29.90_", {
          parse_mode: "Markdown",
        });
        return;
      }
      ctx.session.productData!.price = price;
      ctx.session.step = "new_category";

      const categories = await prisma.category.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      });

      const kb = new InlineKeyboard();
      categories.forEach((cat, i) => {
        kb.text(cat.name, `cat:${cat.id}`);
        if ((i + 1) % 2 === 0) kb.row();
      });
      if (categories.length % 2 !== 0) kb.row();
      kb.text("❌ Cancelar", "xx");

      await ctx.reply(
        "✨ *Nuevo producto — Paso 3½ de 6*\n\n" +
          "📁 Elige la *categoría*:",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Edit Flows ───────────────────────────────

    if (step === "edit_name") {
      const id = ctx.session.editProductId;
      if (!id) { ctx.session.step = undefined; return; }
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        ctx.session.step = undefined;
        await ctx.reply("❌ Producto no encontrado.");
        return;
      }
      let slug = makeSlug(text);
      const conflict = await prisma.product.findFirst({ where: { slug, id: { not: id } } });
      if (conflict) slug = `${slug}-${Date.now().toString(36)}`;
      await prisma.product.update({ where: { id }, data: { name: text, slug } });
      ctx.session.step = undefined;
      const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
      await ctx.reply(
        `✅ *Nombre actualizado*\n\n📝 ${text}`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (step === "edit_price") {
      const id = ctx.session.editProductId;
      if (!id) { ctx.session.step = undefined; return; }
      const price = parseFloat(text.replace(",", "."));
      if (isNaN(price) || price <= 0) {
        await ctx.reply("⚠️ Precio no válido. Escribe un número positivo.\n\n_Ejemplo: 29.90_", {
          parse_mode: "Markdown",
        });
        return;
      }
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        ctx.session.step = undefined;
        await ctx.reply("❌ Producto no encontrado.");
        return;
      }
      await prisma.product.update({ where: { id }, data: { price } });
      ctx.session.step = undefined;
      const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
      await ctx.reply(
        `✅ *Precio actualizado*\n\n💰 ${price.toFixed(2)}€`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (step === "edit_desc") {
      const id = ctx.session.editProductId;
      if (!id) { ctx.session.step = undefined; return; }
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        ctx.session.step = undefined;
        await ctx.reply("❌ Producto no encontrado.");
        return;
      }
      await prisma.product.update({ where: { id }, data: { description: text } });
      ctx.session.step = undefined;
      const kb = new InlineKeyboard().text("⬅️ Volver al producto", `pv:${id}`);
      await ctx.reply(
        "✅ *Descripción actualizada*",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    // ── Newsletter Flow ─────────────────────────

    if (step === "newsletter_subject") {
      ctx.session.newsletterSubject = text;
      ctx.session.step = "newsletter_content";
      const kb = new InlineKeyboard().text("❌ Cancelar", "nw:cancel");
      await ctx.reply(
        "✉️ *Newsletter — Paso 2 de 2*\n\n" +
          `📌 Asunto: _${text}_\n\n` +
          "Ahora escribe el *contenido* del email:",
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (step === "newsletter_content") {
      ctx.session.newsletterContent = text;
      ctx.session.step = undefined;

      const emailSubs = await prisma.subscriber.count({ where: { active: true, wantsEmail: true } });

      const kb = new InlineKeyboard()
        .text("✅ Enviar", "nw:confirm").row()
        .text("❌ Cancelar", "nw:cancel");

      await ctx.reply(
        "✉️ *Preview de newsletter*\n\n" +
          `📌 *Asunto:* ${ctx.session.newsletterSubject}\n\n` +
          `📝 *Contenido:*\n${text}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📧 Se enviará a *${emailSubs}* suscriptores\n\n` +
          `¿Confirmar envío?`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

  } catch (e) {
    console.error("Text handler error:", e);
    await ctx.reply("❌ Ha ocurrido un error. Inténtalo de nuevo.\n\nUsa los botones de abajo para volver al menú.", {
      reply_markup: mainMenu,
    });
    resetSession(ctx);
  }
});

// ─── Photo Handler ───────────────────────────────────────

bot.on("message:photo", async (ctx) => {
  const step = ctx.session.step;
  if (step !== "new_photos" && step !== "edit_photos") return;

  const photos = ctx.message.photo;
  const largest = photos[photos.length - 1];

  try {
    const filePath = await downloadFile(largest.file_id);

    if (step === "new_photos") {
      if (!ctx.session.productData!.images) ctx.session.productData!.images = [];
      ctx.session.productData!.images.push(filePath);
      const count = ctx.session.productData!.images.length;
      const kb = new InlineKeyboard()
        .text("✔️ He terminado", "phd").row()
        .text("❌ Cancelar", "xx");
      await ctx.reply(
        `📸 *Foto ${count} guardada* ✅\n\nEnvía más fotos o pulsa *He terminado*.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }

    if (step === "edit_photos") {
      const id = ctx.session.editProductId;
      if (!id) return;
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return;
      const images = safeJson<string[]>(product.images, []);
      images.push(filePath);
      await prisma.product.update({ where: { id }, data: { images: JSON.stringify(images) } });
      const kb = new InlineKeyboard()
        .text("✔️ He terminado", "phd").row()
        .text("❌ Cancelar", "xx");
      await ctx.reply(
        `📸 *Foto guardada* ✅ (${images.length} en total)\n\nEnvía más o pulsa *He terminado*.`,
        { parse_mode: "Markdown", reply_markup: kb }
      );
      return;
    }
  } catch (e) {
    console.error("Photo error:", e);
    await ctx.reply("❌ Error al guardar la foto. Inténtalo de nuevo.");
  }
});

// ─── Start Bot ───────────────────────────────────────────

bot.start({
  onStart: () => console.log("🤖 Bot de Telegram iniciado"),
});
