import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, Button, Modal, Input, Label } from "@/components/ui";
import { useSalons, useCreateSalon, useSalonLogin, setSalonAuth } from "@/hooks/use-salons";
import { Store, Plus, ArrowRight, Lock, Eye, EyeOff } from "lucide-react";

export default function OwnerLogin() {
  const [, navigate] = useLocation();
  const { data: salons, isLoading } = useSalons();
  const createSalon = useCreateSalon();
  const salonLogin = useSalonLogin();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [pinModalSalon, setPinModalSalon] = useState<{ id: number; name: string } | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerPin, setRegisterPin] = useState("");
  const [showRegisterPin, setShowRegisterPin] = useState(false);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pinVal = fd.get("pin") as string;
    if (pinVal.length !== 4 || !/^\d{4}$/.test(pinVal)) {
      return;
    }
    createSalon.mutate({
      data: {
        name: fd.get("name") as string,
        ownerName: fd.get("ownerName") as string,
        phone: fd.get("phone") as string,
        address: fd.get("address") as string,
        openTime: fd.get("openTime") as string,
        closeTime: fd.get("closeTime") as string,
        pin: pinVal,
      }
    }, {
      onSuccess: (salon) => {
        setIsRegisterOpen(false);
        setRegisterPin("");
        setSalonAuth({ salonId: salon.id, salonName: salon.name });
        navigate(`/owner/${salon.id}`);
      }
    });
  };

  const openPinModal = (salon: { id: number; name: string }) => {
    setPinModalSalon(salon);
    setPin("");
    setLoginError("");
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalSalon) return;
    setLoginError("");
    salonLogin.mutate({
      data: { salonId: pinModalSalon.id, pin }
    }, {
      onSuccess: (salon) => {
        setSalonAuth({ salonId: salon.id, salonName: salon.name });
        setPinModalSalon(null);
        navigate(`/owner/${salon.id}`);
      },
      onError: () => {
        setLoginError("Galat PIN hai. Dobara try karein.");
      }
    });
  };

  return (
    <Layout title="Owner Portal" backLink="/">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Owner Portal</h1>
            <p className="text-muted-foreground text-lg font-light">Apna salon chunein aur PIN se login karein.</p>
          </div>
          <Button onClick={() => setIsRegisterOpen(true)} className="shrink-0 gap-2">
            <Plus className="w-5 h-5" /> Naya Salon Register Karein
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : salons?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
            <Store className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Koi salon nahi mila</h3>
            <p className="text-muted-foreground mb-6">Apna pehla salon register karein.</p>
            <Button onClick={() => setIsRegisterOpen(true)} variant="outline">Salon Banayein</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {salons?.map(salon => (
              <div
                key={salon.id}
                onClick={() => openPinModal({ id: salon.id, name: salon.name })}
                className="cursor-pointer"
              >
                <Card className="group hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col justify-between">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                        <Lock className="w-3 h-3" /> PIN se login
                      </div>
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">{salon.name}</h2>
                    <p className="text-muted-foreground line-clamp-1">{salon.address}</p>
                    <p className="text-sm text-primary mt-4 font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Login Karein <ArrowRight className="w-4 h-4" />
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PIN Login Modal */}
      <Modal isOpen={!!pinModalSalon} onClose={() => setPinModalSalon(null)} title={`Login: ${pinModalSalon?.name}`}>
        <form onSubmit={handlePinLogin} className="space-y-5">
          <p className="text-muted-foreground text-sm">
            Apna 4-digit PIN daalen jo aapne register karte waqt set kiya tha.
          </p>
          <div>
            <Label>4-Digit PIN</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(val);
                  setLoginError("");
                }}
                placeholder="••••"
                className="pl-10 pr-10 text-center text-2xl tracking-widest font-bold"
                maxLength={4}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {loginError && (
              <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                ⚠️ {loginError}
              </p>
            )}
          </div>
          <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setPinModalSalon(null)}>Ruk Jao</Button>
            <Button type="submit" disabled={pin.length !== 4 || salonLogin.isPending}>
              {salonLogin.isPending ? "Verify ho raha hai..." : "Login Karein"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Register New Salon Modal */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Naya Salon Register Karein">
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-4">
            <div>
              <Label>Salon Ka Naam</Label>
              <Input name="name" placeholder="jaise: Glamour Beauty Studio" required />
            </div>
            <div>
              <Label>Owner Ka Naam</Label>
              <Input name="ownerName" placeholder="jaise: Priya Sharma" required />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input name="phone" placeholder="9876543210" required />
            </div>
            <div>
              <Label>Pata (Address)</Label>
              <Input name="address" placeholder="jaise: Connaught Place, New Delhi" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kholne Ka Waqt</Label>
                <Input type="time" name="openTime" defaultValue="09:00" required />
              </div>
              <div>
                <Label>Band Karne Ka Waqt</Label>
                <Input type="time" name="closeTime" defaultValue="20:00" required />
              </div>
            </div>
            <div>
              <Label>Dashboard PIN (sirf 4 numbers)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showRegisterPin ? "text" : "password"}
                  name="pin"
                  value={registerPin}
                  onChange={e => setRegisterPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="pl-10 pr-10 text-center text-2xl tracking-widest font-bold"
                  maxLength={4}
                  required
                  pattern="\d{4}"
                  title="Sirf 4 numbers daalen"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPin(v => !v)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showRegisterPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Yeh PIN yaad rakhein — isi se aap apna dashboard khol payenge.</p>
            </div>
          </div>
          <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>Ruk Jao</Button>
            <Button type="submit" disabled={createSalon.isPending || registerPin.length !== 4}>
              {createSalon.isPending ? "Register ho raha hai..." : "Register Karein"}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
