import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui";
import { useSalons } from "@/hooks/use-salons";
import { MapPin, Clock, ArrowRight } from "lucide-react";

export default function ClientSalons() {
  const { data: salons, isLoading } = useSalons();

  return (
    <Layout title="Find a Salon" backLink="/">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">Select a Destination</h1>
        <p className="text-muted-foreground text-lg">Discover premium salons near you and book your next moment of luxury.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {salons?.map(salon => (
            <Link key={salon.id} href={`/book/${salon.id}`}>
              <Card className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/40 relative">
                  <div className="absolute -bottom-6 left-6 w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-lg border border-border">
                    <span className="font-display text-2xl font-bold text-primary">{salon.name.charAt(0)}</span>
                  </div>
                </div>
                <div className="pt-10 p-6 flex-1 flex flex-col">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-3">{salon.name}</h2>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-muted-foreground flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                      {salon.address}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary/70 shrink-0" />
                      Open {salon.openTime} - {salon.closeTime}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-primary font-medium">
                    <span>View Services</span>
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
