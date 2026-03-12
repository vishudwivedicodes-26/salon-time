import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card, Button, Modal } from "@/components/ui";
import { useSalon, isAuthorizedForSalon, clearSalonAuth } from "@/hooks/use-salons";
import { useBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import QRCode from "react-qr-code";
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
  Scissors,
  MessageSquare,
  PhoneCall,
  Hash,
} from "lucide-react";

export default function OwnerDashboard() {
  const [, params] = useRoute("/owner/:salonId");
  const [, navigate] = useLocation();
  const salonId = parseInt(params?.salonId || "0", 10);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<null | (typeof pendingBookings)[0]>(null);

  const { data: salon, isLoading: isSalonLoading } = useSalon(salonId);
  const { data: bookings, isLoading: isBookingsLoading } = useBookings(salonId);
  const updateStatus = useUpdateBookingStatus();

  useEffect(() => {
    if (!isAuthorizedForSalon(salonId)) {
      navigate("/owner");
    }
  }, [salonId, navigate]);

  if (!isAuthorizedForSalon(salonId)) return null;

  const handleStatusChange = (bookingId: number, status: string) => {
    updateStatus.mutate({ bookingId, data: { status } }, {
      onSuccess: () => setSelectedBooking(null),
    });
  };

  const handleLogout = () => {
    clearSalonAuth();
    navigate("/owner");
  };

  const bookingUrl = `${window.location.origin}/book/${salonId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSalonLoading || isBookingsLoading) {
    return (
      <Layout backLink="/owner">
        <div className="p-12 text-center animate-pulse text-muted-foreground">
          Dashboard load ho raha hai...
        </div>
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

  const sortedBookings = [...(bookings || [])].sort(
    (a, b) =>
      new Date(`${a.date}T${a.time}`).getTime() -
      new Date(`${b.date}T${b.time}`).getTime()
  );

  const pendingBookings = sortedBookings.filter(
    b => b.status === "pending" || b.status === "confirmed"
  );
  const pastBookings = sortedBookings.filter(
    b => b.status === "completed" || b.status === "cancelled"
  );

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <Layout title="Dashboard" backLink="/owner" ownerMode salonId={salonId}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-1">
            Namaste, {salon.ownerName} 👋
          </h1>
          <p className="text-muted-foreground">{salon.name} ka dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setIsQrOpen(true)}>
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

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Aaj Ki Bookings", value: sortedBookings.filter(b => b.date === new Date().toISOString().split("T")[0]).length, color: "text-primary" },
          { label: "Upcoming", value: pendingBookings.length, color: "text-blue-600" },
          { label: "Completed", value: pastBookings.filter(b => b.status === "completed").length, color: "text-green-600" },
          { label: "Total Clients", value: sortedBookings.length, color: "text-foreground" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold font-display ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* QR Code Banner */}
      <div
        className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => setIsQrOpen(true)}
      >
        <div className="bg-white p-1.5 rounded-xl shadow-sm shrink-0">
          <QRCode value={bookingUrl} size={52} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-primary" /> Booking QR Code
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Clients scan karein → seedha booking page pe aa jayenge
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">Dekhein</Button>
      </div>

      <div className="space-y-10">

        {/* Upcoming Appointments */}
        <section>
          <h2 className="text-2xl font-display font-semibold mb-5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            Upcoming Appointments ({pendingBookings.length})
          </h2>

          {pendingBookings.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Abhi koi appointment nahi</h3>
              <p className="text-muted-foreground">Aapka schedule khali hai.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pendingBookings.map(booking => (
                <Card
                  key={booking.id}
                  className="border-l-4 border-l-primary overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedBooking(booking as any)}
                >
                  {/* Card header: service + status */}
                  <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Scissors className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-bold text-lg text-foreground truncate">
                          {booking.serviceName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(booking.date), "EEE, d MMM yyyy")} — {booking.time}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full shrink-0 ${statusColor[booking.status] ?? "bg-muted text-muted-foreground"}`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 border-t border-border/60" />

                  {/* Client details */}
                  <div className="px-5 py-4 bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Client Ki Details
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{booking.clientName}</p>
                          <p className="text-xs text-muted-foreground">Client Ka Naam</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <a
                            href={`tel:${booking.clientPhone}`}
                            onClick={e => e.stopPropagation()}
                            className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                          >
                            {booking.clientPhone}
                            <PhoneCall className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </a>
                          <p className="text-xs text-muted-foreground">Phone Number (tap to call)</p>
                        </div>
                      </div>
                      {booking.notes && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            <MessageSquare className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-foreground italic">"{booking.notes}"</p>
                            <p className="text-xs text-muted-foreground">Client Ki Note</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 flex gap-3">
                    <Button
                      className="flex-1 gap-1.5 text-sm"
                      onClick={e => { e.stopPropagation(); handleStatusChange(booking.id, "completed"); }}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4" /> Complete
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 text-sm border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                      onClick={e => { e.stopPropagation(); handleStatusChange(booking.id, "cancelled"); }}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past bookings */}
        {pastBookings.length > 0 && (
          <section>
            <h2 className="text-2xl font-display font-semibold mb-5 text-muted-foreground">
              Past & Cancelled ({pastBookings.length})
            </h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {pastBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{booking.clientName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5" /> {booking.serviceName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {format(new Date(booking.date), "d MMM")} · {booking.time}
                          </span>
                          <a
                            href={`tel:${booking.clientPhone}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <Phone className="w-3.5 h-3.5" /> {booking.clientPhone}
                          </a>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full w-fit ${statusColor[booking.status] ?? "bg-muted"}`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Client Detail Modal (click on card) */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Client Ki Poori Details"
      >
        {selectedBooking && (
          <div className="space-y-5 py-2">
            {/* Booking ID */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Booking ID:</span>
              <span className="font-bold text-foreground">#{selectedBooking.id}</span>
              <span className={`ml-auto px-2.5 py-1 text-xs font-bold uppercase rounded-full ${statusColor[selectedBooking.status]}`}>
                {selectedBooking.status}
              </span>
            </div>

            {/* Service & Time */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service & Waqt</p>
              <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                <Scissors className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{selectedBooking.serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedBooking.date), "EEEE, d MMMM yyyy")} — {selectedBooking.time}
                  </p>
                </div>
              </div>
            </div>

            {/* Client info */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Ki Jankari</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{selectedBooking.clientName}</p>
                    <p className="text-xs text-muted-foreground">Client Ka Naam</p>
                  </div>
                </div>
                <a
                  href={`tel:${selectedBooking.clientPhone}`}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {selectedBooking.clientPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">Phone Number — tap karke call karein</p>
                  </div>
                  <PhoneCall className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                {selectedBooking.notes && (
                  <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground italic">"{selectedBooking.notes}"</p>
                      <p className="text-xs text-muted-foreground mt-1">Client Ki Note</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {(selectedBooking.status === "pending" || selectedBooking.status === "confirmed") && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleStatusChange(selectedBooking.id, "completed")}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="w-4 h-4" /> Complete Karein
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5"
                  onClick={() => handleStatusChange(selectedBooking.id, "cancelled")}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="Apna Booking QR Code">
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-border">
            <QRCode value={bookingUrl} size={220} />
          </div>
          <div className="text-center">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">{salon.name}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Client is QR code ko kisi bhi phone se scan karein — directly aapke booking page pe aa jayenge.
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
          </div>
          <Button className="w-full" onClick={() => setIsQrOpen(false)}>Band Karein</Button>
        </div>
      </Modal>
    </Layout>
  );
}
