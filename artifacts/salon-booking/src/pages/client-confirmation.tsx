import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui";
import { useBooking } from "@/hooks/use-bookings";
import { CheckCircle2, Calendar, Clock, MapPin, Scissors } from "lucide-react";

export default function ClientConfirmation() {
  const [, params] = useRoute("/book/confirm/:bookingId");
  const bookingId = parseInt(params?.bookingId || "0", 10);
  
  const { data: booking, isLoading } = useBooking(bookingId);

  if (isLoading) return <Layout><div className="p-20 text-center animate-pulse">Loading confirmation...</div></Layout>;
  if (!booking) return <Layout><div className="p-20 text-center">Booking not found.</div></Layout>;

  return (
    <Layout title="Booking Confirmed">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center mt-8 animate-in zoom-in-95 duration-700">
        
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-600/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">You're All Set!</h1>
        <p className="text-xl text-muted-foreground mb-10">
          Thank you, {booking.clientName}. Your appointment has been confirmed.
        </p>

        <Card className="w-full p-8 text-left relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          
          <h2 className="text-2xl font-display font-semibold mb-6 border-b border-border/50 pb-4">Booking Details</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Service</p>
                <p className="font-medium text-lg">{booking.serviceName}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date</p>
                <p className="font-medium text-lg">{format(new Date(booking.date), 'EEEE, MMMM do, yyyy')}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Time</p>
                <p className="font-medium text-lg">{booking.time}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium text-lg capitalize">{booking.status}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-10 flex gap-4 w-full sm:w-auto">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">Return Home</Button>
          </Link>
          <Link href="/book">
            <Button className="w-full sm:w-auto">Book Another</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
