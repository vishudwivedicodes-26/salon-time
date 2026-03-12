import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { format, subDays, isAfter, parseISO, isToday } from "date-fns";
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
  History,
  Search,
  X,
  Filter,
  ChevronRight,
} from "lucide-react";

type TabType = "upcoming" | "history";

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_HINDI: Record<string, string> = {
  pending:   "Pending",
  confirmed: "Confirmed",
  completed: "Poora Hua",
  cancelled: "Cancel",
};

export default function OwnerDashboard() {
  const [, params] = useRoute("/owner/:salonId");
  const [, navigate] = useLocation();
  const salonId = parseInt(params?.salonId || "0", 10);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [selectedBooking, setSelectedBooking] = useState<null | any>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<string>("all");

  const { data: salon, isLoading: isSalonLoading } = useSalon(salonId);
  const { data: bookings, isLoading: isBookingsLoading } = useBookings(salonId);
  const updateStatus = useUpdateBookingStatus();

  useEffect(() => {
    if (!isAuthorizedForSalon(salonId)) navigate("/owner");
  }, [salonId, navigate]);

  if (!isAuthorizedForSalon(salonId)) return null;

  const handleStatusChange = (bookingId: number, status: string) => {
    updateStatus.mutate({ bookingId, data: { status } }, {
      onSuccess: () => setSelectedBooking(null),
    });
  };

  const handleLogout = () => { clearSalonAuth(); navigate("/owner"); };

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

  const allBookings = [...(bookings || [])].sort(
    (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
  );

  const upcoming = allBookings.filter(b => b.status === "pending" || b.status === "confirmed");

  // Last 30 days
  const thirtyDaysAgo = subDays(new Date(), 30);
  const history30 = allBookings.filter(b =>
    isAfter(parseISO(b.date), thirtyDaysAgo)
  );

  // Filtered history
  const filteredHistory = history30.filter(b => {
    const matchStatus = historyStatus === "all" || b.status === historyStatus;
    const q = historySearch.toLowerCase();
    const matchSearch =
      !q ||
      b.clientName.toLowerCase().includes(q) ||
      b.clientPhone.includes(q) ||
      b.serviceName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // Stats
  const todayBookings = allBookings.filter(b => isToday(parseISO(b.date)));
  const completedLast30 = history30.filter(b => b.status === "completed");
  const uniqueClients = new Set(allBookings.map(b => b.clientPhone)).size;

  return (
    <Layout title="Dashboard" backLink="/owner" ownerMode salonId={salonId}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-1">
            Namaste, {salon.ownerName} 👋
          </h1>
          <p className="text-muted-foreground">{salon.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsQrOpen(true)}>
            <QrCode className="w-4 h-4" /> QR Code
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Aaj Ki Bookings", value: todayBookings.length, color: "text-primary" },
          { label: "Upcoming", value: upcoming.length, color: "text-blue-600" },
          { label: "Is Mahine Poore", value: completedLast30.length, color: "text-green-600" },
          { label: "Total Clients", value: uniqueClients, color: "text-foreground" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold font-display ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* QR Banner */}
      <div
        className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => setIsQrOpen(true)}
      >
        <div className="bg-white p-1.5 rounded-xl shadow-sm shrink-0">
          <QRCode value={bookingUrl} size={52} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-primary" /> Booking QR Code
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            Clients scan karein → seedha booking page pe aa jayenge
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">Dekhein</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "upcoming"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Upcoming
          {upcoming.length > 0 && (
            <span className="bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "history"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          1 Mahine Ka Itihas
          <span className="bg-muted-foreground/20 text-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {history30.length}
          </span>
        </button>
      </div>

      {/* ────── UPCOMING TAB ────── */}
      {activeTab === "upcoming" && (
        <div>
          {upcoming.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-14 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Abhi koi appointment nahi</h3>
              <p className="text-muted-foreground text-sm">QR code share karein taaki clients booking karein.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {upcoming.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onSelect={() => setSelectedBooking(booking)}
                  onComplete={() => handleStatusChange(booking.id, "completed")}
                  onCancel={() => handleStatusChange(booking.id, "cancelled")}
                  isPending={updateStatus.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────── HISTORY TAB ────── */}
      {activeTab === "history" && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Client ka naam ya phone number..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {historySearch && (
                <button onClick={() => setHistorySearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={historyStatus}
                onChange={e => setHistoryStatus(e.target.value)}
                className="py-2.5 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="all">Sabhi Status</option>
                <option value="completed">Poora Hua</option>
                <option value="cancelled">Cancel</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-muted-foreground mb-4 font-medium">
            Pichhle 30 din mein {filteredHistory.length} booking{filteredHistory.length !== 1 ? "s" : ""}
            {historySearch && ` — "${historySearch}" ke liye`}
          </p>

          {filteredHistory.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground mb-1">Koi booking nahi mili</p>
              <p className="text-sm text-muted-foreground">Filter ya search badlein</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-muted/50 border-b border-border">
                <p className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</p>
                <p className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Service</p>
                <p className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</p>
                <p className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="col-span-1" />
              </div>

              <div className="divide-y divide-border">
                {filteredHistory.map(booking => (
                  <div
                    key={booking.id}
                    className="px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-foreground">{booking.clientName}</p>
                          <a
                            href={`tel:${booking.clientPhone}`}
                            onClick={e => e.stopPropagation()}
                            className="text-sm text-primary flex items-center gap-1 hover:underline mt-0.5"
                          >
                            <Phone className="w-3 h-3" /> {booking.clientPhone}
                          </a>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full ${STATUS_STYLES[booking.status]}`}>
                          {STATUS_HINDI[booking.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Scissors className="w-3 h-3" /> {booking.serviceName}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(parseISO(booking.date), "d MMM")} · {booking.time}</span>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                      {/* Client */}
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">
                              {booking.clientName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{booking.clientName}</p>
                            <a
                              href={`tel:${booking.clientPhone}`}
                              onClick={e => e.stopPropagation()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 group/phone"
                            >
                              <Phone className="w-3 h-3" />
                              {booking.clientPhone}
                              <PhoneCall className="w-3 h-3 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Service */}
                      <div className="col-span-3 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {booking.serviceName}
                        </p>
                        {booking.notes && (
                          <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="col-span-3">
                        <p className="text-sm text-foreground font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {format(parseISO(booking.date), "d MMM yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground ml-5">{booking.time}</p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-full ${STATUS_STYLES[booking.status]}`}>
                          {STATUS_HINDI[booking.status]}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div className="col-span-1 flex justify-end">
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────── CLIENT DETAIL MODAL ────── */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Ki Poori Jankari"
      >
        {selectedBooking && (
          <div className="space-y-4 py-2">
            {/* Booking ID + Status */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Booking #{selectedBooking.id}</span>
              <span className={`ml-auto px-2.5 py-1 text-xs font-bold uppercase rounded-full ${STATUS_STYLES[selectedBooking.status]}`}>
                {STATUS_HINDI[selectedBooking.status]}
              </span>
            </div>

            {/* Client Section */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Client Ki Jankari
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                    {selectedBooking.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">{selectedBooking.clientName}</p>
                    <p className="text-xs text-muted-foreground">Client Ka Naam</p>
                  </div>
                </div>

                <a
                  href={`tel:${selectedBooking.clientPhone}`}
                  className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                      {selectedBooking.clientPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">Phone — tap karke seedha call karein</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <PhoneCall className="w-4 h-4" /> Call
                  </div>
                </a>
              </div>
            </div>

            {/* Service Section */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                Service & Waqt
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{selectedBooking.serviceName}</p>
                    <p className="text-xs text-muted-foreground">Service</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {format(parseISO(selectedBooking.date), "EEEE, d MMMM yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.time} baje</p>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div className="flex items-start gap-3 p-3.5 bg-card border border-border rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground italic">"{selectedBooking.notes}"</p>
                      <p className="text-xs text-muted-foreground mt-1">Client Ka Note</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions for pending/confirmed */}
            {(selectedBooking.status === "pending" || selectedBooking.status === "confirmed") && (
              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleStatusChange(selectedBooking.id, "completed")}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="w-4 h-4" /> Complete Karein
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
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

      {/* ────── QR CODE MODAL ────── */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="Apna Booking QR Code">
        <div className="flex flex-col items-center gap-5 py-3">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-border">
            <QRCode value={bookingUrl} size={220} />
          </div>
          <div className="text-center">
            <h3 className="font-display text-xl font-bold text-foreground mb-1">{salon.name}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Client is QR code ko scan karein — directly aapke booking page pe aa jayenge.
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

function BookingCard({
  booking,
  onSelect,
  onComplete,
  onCancel,
  isPending,
}: {
  booking: any;
  onSelect: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <Card
      className="border-l-4 border-l-primary overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      {/* Service + Status */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="w-4 h-4 text-primary shrink-0" />
            <h3 className="font-bold text-lg text-foreground truncate">{booking.serviceName}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
            <Clock className="w-3.5 h-3.5" />
            {format(parseISO(booking.date), "EEE, d MMM")} — {booking.time}
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full shrink-0 ${STATUS_STYLES[booking.status]}`}>
          {STATUS_HINDI[booking.status]}
        </span>
      </div>

      <div className="mx-5 border-t border-border/60" />

      {/* Client Details */}
      <div className="px-5 py-4 bg-muted/30">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Client Ki Details
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0 text-primary font-bold">
              {booking.clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-foreground">{booking.clientName}</p>
              <p className="text-xs text-muted-foreground">Client Ka Naam</p>
            </div>
          </div>

          <a
            href={`tel:${booking.clientPhone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-3 group/ph"
          >
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <p className="font-bold text-foreground group-hover/ph:text-primary transition-colors flex items-center gap-1.5">
                {booking.clientPhone}
                <PhoneCall className="w-3.5 h-3.5 text-primary opacity-0 group-hover/ph:opacity-100 transition-opacity" />
              </p>
              <p className="text-xs text-muted-foreground">Tap karke call karein</p>
            </div>
          </a>

          {booking.notes && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground italic">"{booking.notes}"</p>
                <p className="text-xs text-muted-foreground">Note</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 flex gap-3">
        <Button
          className="flex-1 gap-1.5 text-sm"
          onClick={e => { e.stopPropagation(); onComplete(); }}
          disabled={isPending}
        >
          <CheckCircle className="w-4 h-4" /> Complete
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-sm border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
          onClick={e => { e.stopPropagation(); onCancel(); }}
          disabled={isPending}
        >
          <XCircle className="w-4 h-4" /> Cancel
        </Button>
      </div>
    </Card>
  );
}
