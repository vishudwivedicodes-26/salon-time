import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card, Button, Modal } from "@/components/ui";
import { useSalon } from "@/hooks/use-salons";
import { isAuthorizedForSalon, clearSalonAuth } from "@/hooks/use-salons";
import { useBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { QRCodeSVG } from "react-qr-code";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  QrCode,
  LogOut,
  Copy,
  Check,
} from "lucide-react";

export default function OwnerDashboard() {
  const [, params] = useRoute("/owner/:salonId");
  const [, navigate] = useLocation();
  const salonId = parseInt(params?.salonId || "0", 10);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: salon, isLoading: isSalonLoading } = useSalon(salonId);
  const { data: bookings, isLoading: isBookingsLoading } = useBookings(salonId);
  const updateStatus = useUpdateBookingStatus();

  // Auth guard: redirect if not authenticated for this salon
  useEffect(() => {
    if (!isAuthorizedForSalon(salonId)) {
      navigate("/owner");
    }
  }, [salonId, navigate]);

  if (!isAuthorizedForSalon(salonId)) {
    return null;
  }

  const handleStatusChange = (bookingId: number, status: string) => {
    updateStatus.mutate({ bookingId, data: { status } });
  };

  const handleLogout = () => {
    clearSalonAuth();
    navigate("/owner");
  };

  // Build booking URL for QR code
  const bookingUrl = `${window.location.origin}/book/${salonId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSalonLoading || isBookingsLoading) {
    return (
      <Layout backLink="/owner">
        <div className="p-12 text-center animate-pulse text-muted-foreground">Dashboard load ho raha hai...</div>
      </Layout>
    );
  }

  if (!salon) {
    return (
      <Layout backLink="/owner">
        <div className="p-12 text-center text-destructive">Salon nahi mila</div>
      </Layout>
    );
  }

  const sortedBookings = [...(bookings || [])].sort((a, b) =>
    new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
  );

  const pendingBookings = sortedBookings.filter(b => b.status === "pending" || b.status === "confirmed");
  const pastBookings = sortedBookings.filter(b => b.status === "completed" || b.status === "cancelled");

  return (
    <Layout title="Dashboard" backLink="/owner" ownerMode salonId={salonId}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Namaste, {salon.ownerName} 👋
          </h1>
          <p className="text-muted-foreground text-lg">{salon.name} ka dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsQrOpen(true)}
          >
            <QrCode className="w-4 h-4" /> QR Code
          </Button>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* QR Code Banner */}
      <div
        className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center gap-5 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => setIsQrOpen(true)}
      >
        <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
          <QRCodeSVG value={bookingUrl} size={64} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            Apna Booking QR Code
          </h3>
          <p className="text-sm text-muted-foreground">
            Is QR code ko scan karke client seedha aapke salon ki booking page pe aa jayenge.
            Salon ke bahar ya visiting card pe lagayein.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 sm:ml-auto">Bada Dekhein</Button>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            Upcoming Appointments ({pendingBookings.length})
          </h2>

          {pendingBookings.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Abhi koi appointment nahi</h3>
              <p className="text-muted-foreground">Aapka schedule abhi khali hai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingBookings.map(booking => (
                <Card key={booking.id} className="p-6 border-l-4 border-l-primary flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-xl text-foreground">{booking.serviceName}</h3>
                        <div className="flex items-center gap-2 text-primary font-medium mt-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(booking.date), "d MMM yyyy")} — {booking.time}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full">
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6 bg-muted/50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 text-foreground/80">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.clientName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-foreground/80">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.clientPhone}</span>
                      </div>
                      {booking.notes && (
                        <div className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground italic">
                          "{booking.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleStatusChange(booking.id, "completed")}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4" /> Complete
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                      onClick={() => handleStatusChange(booking.id, "cancelled")}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {pastBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-display font-semibold mb-6 text-muted-foreground">
              Past & Cancelled
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {pastBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground">{booking.serviceName}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        {format(new Date(booking.date), "d MMM")} • {booking.time} • {booking.clientName}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full w-fit ${
                        booking.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* QR Code Modal */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="Apna Booking QR Code">
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-border">
            <QRCodeSVG value={bookingUrl} size={220} />
          </div>

          <div className="text-center">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">{salon.name}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Client is QR code ko kisi bhi phone se scan karein — directly aapke booking page pe aa jayenge.
              Google Lens ya kisi bhi QR scanner se kaam karta hai.
            </p>
          </div>

          <div className="w-full p-3 bg-muted rounded-xl flex items-center gap-3">
            <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{bookingUrl}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg bg-background border border-border hover:border-primary/40 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>

          <div className="w-full p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-foreground/80 space-y-1">
            <p className="font-semibold text-foreground mb-2">📌 QR Code kahan lagayein:</p>
            <p>• Salon ke bahar darwaze par</p>
            <p>• Visiting card ya pamphlet mein</p>
            <p>• WhatsApp status ya social media par</p>
            <p>• Counter par print karke rakhen</p>
          </div>

          <Button className="w-full" onClick={() => setIsQrOpen(false)}>Band Karein</Button>
        </div>
      </Modal>
    </Layout>
  );
}
