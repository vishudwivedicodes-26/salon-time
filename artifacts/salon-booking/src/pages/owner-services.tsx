import { useState } from "react";
import { useRoute } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, Button, Modal, Input, Label, Textarea } from "@/components/ui";
import { useServices, useCreateService } from "@/hooks/use-services";
import { Plus, Scissors, Clock, DollarSign } from "lucide-react";

export default function OwnerServices() {
  const [, params] = useRoute("/owner/:salonId/services");
  const salonId = parseInt(params?.salonId || "0", 10);
  
  const { data: services, isLoading } = useServices(salonId);
  const createService = useCreateService(salonId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createService.mutate({
      salonId,
      data: {
        name: fd.get("name") as string,
        description: fd.get("description") as string,
        durationMinutes: parseInt(fd.get("durationMinutes") as string, 10),
        price: parseFloat(fd.get("price") as string),
      }
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
      }
    });
  };

  return (
    <Layout title="Services Menu" backLink={`/owner/${salonId}`} ownerMode salonId={salonId}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Service Menu</h1>
          <p className="text-muted-foreground text-lg">Manage the services offered at your salon.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0 gap-2">
          <Plus className="w-5 h-5" /> Add New Service
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : services?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
          <Scissors className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No services yet</h3>
          <p className="text-muted-foreground mb-6">Add your first service to let clients start booking.</p>
          <Button onClick={() => setIsModalOpen(true)} variant="outline">Add Service</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map(service => (
            <Card key={service.id} className="p-6 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-display text-2xl font-bold text-foreground pr-4">{service.name}</h3>
                  <span className="font-semibold text-lg text-primary shrink-0">${service.price.toFixed(2)}</span>
                </div>
                <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                  {service.description || "No description provided."}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/70 bg-muted/50 w-fit px-3 py-1.5 rounded-full mt-auto">
                <Clock className="w-4 h-4 text-primary" />
                {service.durationMinutes} minutes
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Service">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-4">
            <div>
              <Label>Service Name</Label>
              <Input name="name" placeholder="E.g. Balayage & Blowout" required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea name="description" placeholder="Describe the service..." className="min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (Minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <Input type="number" name="durationMinutes" className="pl-10" placeholder="60" required min="15" step="15" />
                </div>
              </div>
              <div>
                <Label>Price ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <Input type="number" name="price" className="pl-10" placeholder="120.00" required min="0" step="0.01" />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createService.isPending}>
              {createService.isPending ? "Adding..." : "Add Service"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
