import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui";
import { useSalons } from "@/hooks/use-salons";
import { MapPin, Clock, ArrowRight, Search, X } from "lucide-react";

export default function ClientSalons() {
  const { data: salons, isLoading } = useSalons();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = salons?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <Layout title="Salon Dhundein" backLink="/">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Apna Salon Dhundein
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Apne pasandida salon mein appointment book karein.
        </p>

        {/* Search Box */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Salon ka naam ya sheher likhein..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results count */}
        {searchQuery && !isLoading && (
          <p className="mt-3 text-sm text-muted-foreground">
            {filtered.length === 0
              ? "Koi salon nahi mila"
              : `${filtered.length} salon mila${filtered.length > 1 ? "e" : ""}`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 && searchQuery ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <Search className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            "{searchQuery}" se koi salon nahi mila
          </h3>
          <p className="text-muted-foreground mb-4">Dusra naam ya sheher try karein.</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-primary hover:underline text-sm font-medium"
          >
            Sabhi salons dekhein
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map(salon => (
            <Link key={salon.id} href={`/book/${salon.id}`}>
              <Card className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col">
                <div className="h-28 bg-gradient-to-br from-primary/20 to-accent/40 relative">
                  <div className="absolute -bottom-6 left-6 w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-lg border border-border">
                    <span className="font-display text-2xl font-bold text-primary">
                      {salon.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="pt-10 p-6 flex-1 flex flex-col">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                    {/* Highlight search match */}
                    {searchQuery
                      ? highlightText(salon.name, searchQuery)
                      : salon.name}
                  </h2>

                  <div className="space-y-2 mb-6">
                    <p className="text-muted-foreground flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                      {salon.address}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary/70 shrink-0" />
                      Khula: {salon.openTime} – {salon.closeTime}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-primary font-medium">
                    <span>Services Dekhein</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}

function highlightText(text: string, query: string) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
