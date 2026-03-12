import { useRoute } from "wouter";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui";
import { useSalon } from "@/hooks/use-salons";
import { useBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, XCircle } from "lucide-react";

export default function OwnerDashboard() {
  const [, params] = useRoute("/owner/:salonId");
  const salonId = parseInt(params?.salonId || "0", 10);
  
  const { data: salon, isLoading: isSalonLoading } = useSalon(salonId);
  const { data: bookings, isLoading: isBookingsLoading } = useBookings(salonId);
  const updateStatus = useUpdateBookingStatus();

  const handleStatusChange = (bookingId: number, status: string) => {
    updateStatus.mutate({ bookingId, data: { status } });
  };

  if (isSalonLoading || isBookingsLoading) {
    return <Layout backLink="/owner"><div className="p-12 text-center animate-pulse text-muted-foreground">Loading dashboard...</div></Layout>;
  }

  if (!salon) return <Layout backLink="/owner"><div className="p-12 text-center text-destructive">Salon not found</div></Layout>;

  // Sort bookings: upcoming first
  const sortedBookings = [...(bookings || [])].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time}`).getTime();
    const timeB = new Date(`${b.date}T${b.time}`).getTime();
    return timeA - timeB;
  });

  const pendingBookings = sortedBookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const pastBookings = sortedBookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  return (
    <Layout title="Dashboard" backLink="/owner" ownerMode salonId={salonId}>
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Welcome, {salon.ownerName}</h1>
        <p className="text-muted-foreground text-lg">Here is the schedule for {salon.name}.</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            Upcoming Appointments
          </h2>
          
          {pendingBookings.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No upcoming appointments</h3>
              <p className="text-muted-foreground">Your schedule is clear for now.</p>
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
                          {format(new Date(booking.date), 'MMM d, yyyy')} at {booking.time}
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
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4" /> Complete
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                      onClick={() => handleStatusChange(booking.id, 'cancelled')}
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
            <h2 className="text-2xl font-display font-semibold mb-6 text-muted-foreground">Past & Cancelled</h2>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {pastBookings.map(booking => (
                  <div key={booking.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity">
                    <div>
                      <h4 className="font-semibold text-foreground">{booking.serviceName}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        {format(new Date(booking.date), 'MMM d')} • {booking.time} • {booking.clientName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full w-fit ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
