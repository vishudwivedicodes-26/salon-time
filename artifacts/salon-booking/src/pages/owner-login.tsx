import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, Button, Modal, Input, Label } from "@/components/ui";
import { useSalons, useCreateSalon } from "@/hooks/use-salons";
import { Store, Plus, ArrowRight } from "lucide-react";

export default function OwnerLogin() {
  const { data: salons, isLoading } = useSalons();
  const createSalon = useCreateSalon();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createSalon.mutate({
      data: {
        name: fd.get("name") as string,
        ownerName: fd.get("ownerName") as string,
        phone: fd.get("phone") as string,
        address: fd.get("address") as string,
        openTime: fd.get("openTime") as string,
        closeTime: fd.get("closeTime") as string,
      }
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
      }
    });
  };

  return (
    <Layout title="Owner Portal" backLink="/">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Select Your Salon</h1>
            <p className="text-muted-foreground text-lg font-light">Choose your salon to view today's schedule and manage services.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="shrink-0 gap-2">
            <Plus className="w-5 h-5" /> Register New Salon
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : salons?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
            <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No salons found</h3>
            <p className="text-muted-foreground mb-6">Get started by registering your first salon.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">Create Salon</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {salons?.map(salon => (
              <Link key={salon.id} href={`/owner/${salon.id}`}>
                <Card className="group cursor-pointer hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col justify-between">
                  <div className="p-8">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Store className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">{salon.name}</h2>
                    <p className="text-muted-foreground line-clamp-1">{salon.address}</p>
                    <p className="text-sm text-primary mt-4 font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter Dashboard <ArrowRight className="w-4 h-4" />
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Salon">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-4">
            <div>
              <Label>Salon Name</Label>
              <Input name="name" placeholder="Aura Beauty Studio" required />
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input name="ownerName" placeholder="Jane Doe" required />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input name="phone" placeholder="(555) 123-4567" required />
            </div>
            <div>
              <Label>Address</Label>
              <Input name="address" placeholder="123 Elegant Ave, City" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Opening Time</Label>
                <Input type="time" name="openTime" defaultValue="09:00" required />
              </div>
              <div>
                <Label>Closing Time</Label>
                <Input type="time" name="closeTime" defaultValue="18:00" required />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createSalon.isPending}>
              {createSalon.isPending ? "Creating..." : "Create Salon"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
