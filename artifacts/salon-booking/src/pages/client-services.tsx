import { useRoute, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui";
import { useSalon } from "@/hooks/use-salons";
import { useServices } from "@/hooks/use-services";
import { Clock, ArrowRight } from "lucide-react";

export default function ClientServices() {
  const [, params] = useRoute("/book/:salonId");
  const salonId = parseInt(params?.salonId || "0", 10);
  
  const { data: salon, isLoading: isSalonLoading } = useSalon(salonId);
  const { data: services, isLoading: isServicesLoading } = useServices(salonId);

  if (isSalonLoading || isServicesLoading) {
    return <Layout backLink="/book"><div className="p-12 text-center animate-pulse text-muted-foreground">Loading services...</div></Layout>;
  }

  if (!salon) return <Layout backLink="/book"><div className="p-12 text-center text-destructive">Salon not found</div></Layout>;

  return (
    <Layout title={salon.name} backLink="/book">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">Choose a Service</h1>
        <p className="text-muted-foreground text-lg">Select a treatment from {salon.name}'s curated menu.</p>
      </div>

      {services?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
          <h3 className="text-xl font-semibold text-foreground mb-2">No services available</h3>
          <p className="text-muted-foreground">This salon hasn't added any services yet.</p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-4">
          {services?.map(service => (
            <Link key={service.id} href={`/book/${salon.id}/slots?serviceId=${service.id}`}>
              <Card className="group cursor-pointer p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5">
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                  <p className="text-muted-foreground mb-3 leading-relaxed">
                    {service.description || "Premium treatment tailored to your needs."}
                  </p>
                  <div className="flex items-center gap-4 text-sm font-medium text-foreground/70">
                    <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 text-primary" />
                      {service.durationMinutes} mins
                    </span>
                    <span className="font-semibold text-foreground bg-primary/5 text-primary px-3 py-1 rounded-full">
                      ${service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-full bg-muted items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
