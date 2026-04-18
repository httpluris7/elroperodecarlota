"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  category: string;
  categorySlug: string;
  score: number;
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
      setSearched(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setSearched(true);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-[10vh] px-4">
        <div className="bg-background rounded-sm shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center border-b border-sand/30 px-5">
            <Search size={18} className="text-foreground/30 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Buscar productos... (vestidos, blusas, negro...)"
              className="flex-1 px-4 py-4.5 text-sm bg-transparent outline-none placeholder:text-foreground/30"
            />
            {loading ? (
              <Loader2 size={16} className="animate-spin text-foreground/30 shrink-0" />
            ) : query ? (
              <button
                onClick={() => { setQuery(""); setResults([]); setSearched(false); inputRef.current?.focus(); }}
                className="text-foreground/30 hover:text-foreground transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="hidden sm:inline text-[10px] text-foreground/25 border border-foreground/10 px-1.5 py-0.5 rounded shrink-0">
                ESC
              </kbd>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length > 0 && (
              <div className="p-3">
                <p className="text-[10px] tracking-[0.15em] uppercase text-foreground/30 font-medium px-2 mb-2">
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </p>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 px-2 py-3 hover:bg-sand/15 rounded-sm transition-colors group"
                  >
                    <div className="relative w-12 h-16 bg-sand/20 shrink-0 overflow-hidden rounded-sm">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-sand/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-wider uppercase text-gold mb-0.5">
                        {product.category}
                      </p>
                      <p className="text-sm group-hover:text-gold transition-colors truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium">{formatPrice(product.price)}</span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-[11px] text-foreground/30 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Link to full results */}
                <Link
                  href={`/tienda?q=${encodeURIComponent(query)}`}
                  onClick={() => setOpen(false)}
                  className="block text-center py-3 mt-1 text-xs tracking-wider uppercase text-foreground/40 hover:text-gold transition-colors border-t border-sand/20"
                >
                  Ver todos los resultados
                </Link>
              </div>
            )}

            {searched && results.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-foreground/40 text-sm mb-1">
                  No encontramos resultados para &ldquo;{query}&rdquo;
                </p>
                <p className="text-foreground/25 text-xs">
                  Prueba con otras palabras o revisa la ortografía
                </p>
              </div>
            )}

            {!searched && !loading && (
              <div className="py-10 text-center">
                <p className="text-foreground/25 text-xs">
                  Escribe para buscar entre vestidos, tops, pantalones...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Trigger button to open search - used in Navbar */
export function SearchTrigger({ className }: { className?: string }) {
  const [, setForceRender] = useState(0);

  // This is a trick: we store setOpen in a ref on the modal
  // Instead, we'll use a global event
  const handleClick = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  };

  // Force re-render to pick up state
  useEffect(() => {
    setForceRender((n) => n + 1);
  }, []);

  return (
    <button
      onClick={handleClick}
      className={className}
      aria-label="Buscar"
    >
      <Search size={19} />
    </button>
  );
}
