import { useState } from "react";
import { useRoute, useSearch, useLocation } from "wouter";
import { format, addDays } from "date-fns";
import { Layout } from "@/components/Layout";
import { Card, Button, Input, Label, Textarea } from "@/components/ui";
import { useSalon } from "@/hooks/use-salons";
import { useServices } from "@/hooks/use-services";
import { useAvailableSlots, useCreateBooking } from "@/hooks/use-bookings";
import { Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";

export default function ClientBooking() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/book/:salonId/slots");
  const salonId = parseInt(params?.salonId || "0", 10);
  
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const serviceIdParam = searchParams.get("serviceId");
  const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : undefined;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data: salon } = useSalon(salonId);
  const { data: services } = useServices(salonId);
  const service = services?.find(s => s.id === serviceId);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: slots, isLoading: isSlotsLoading } = useAvailableSlots(salonId, dateStr, serviceId);
  const createBooking = useCreateBooking();

  // Generate 14 days for the horizontal picker
  const days = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  const handleBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!serviceId || !selectedTime) return;
    
    const fd = new FormData(e.currentTarget);
    createBooking.mutate({
      data: {
        salonId,
        serviceId,
        date: dateStr,
        time: selectedTime,
        clientName: fd.get("clientName") as string,
        clientPhone: fd.get("clientPhone") as string,
        notes: fd.get("notes") as string,
      }
    }, {
      onSuccess: (data) => {
        setLocation(`/book/confirm/${data.id}`);
      }
    });
  };

  if (!serviceId) return <Layout backLink={`/book/${salonId}`}>Missing service selection.</Layout>;

  return (
    <Layout title="Select Time" backLink={`/book/${salonId}`}>
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Step 1: Summary */}
        <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{service?.name}</h2>
            <p className="text-muted-foreground">{salon?.name}</p>
          </div>
          <div className="text-left sm:text-right font-medium text-primary bg-primary/5 px-4 py-2 rounded-xl w-fit">
            {service?.durationMinutes} mins • ${service?.price.toFixed(2)}
          </div>
        </div>

        {/* Step 2: Date Picker */}
        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" /> Select Date
          </h3>
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 snap-x">
            {days.map((day, i) => {
              const isSelected = format(day, 'yyyy-MM-dd') === dateStr;
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                  className={`snap-start shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                      : 'border-border/50 bg-card hover:border-primary/30 text-foreground'
                  }`}
                >
                  <span className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className="font-display text-2xl font-bold">{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Time Slots */}
        <section className="animate-in fade-in duration-500">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Available Times
          </h3>
          
          {isSlotsLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
               {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : slots?.length === 0 ? (
            <div className="p-8 text-center bg-muted/30 rounded-2xl border border-border border-dashed text-muted-foreground">
              No available slots on this day. Please select another date.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {slots?.map(slot => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-3 px-2 rounded-xl text-center font-medium transition-all duration-200 border-2 ${
                    !slot.available 
                      ? 'opacity-40 cursor-not-allowed bg-muted/50 border-transparent text-muted-foreground' 
                      : selectedTime === slot.time
                        ? 'border-primary bg-primary/10 text-primary shadow-inner scale-105'
                        : 'border-border/50 bg-card hover:border-primary/40 text-foreground hover:bg-muted/30'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Step 4: Details Form (Shows only after time is selected) */}
        {selectedTime && (
          <section className="animate-in slide-in-from-bottom-8 fade-in duration-500 pt-8 border-t border-border/50">
            <h3 className="text-2xl font-display font-semibold mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" /> Complete Booking
            </h3>
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Full Name</Label>
                    <Input name="clientName" placeholder="Emma Watson" required autoFocus />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input type="tel" name="clientPhone" placeholder="(555) 000-0000" required />
                  </div>
                </div>
                <div>
                  <Label>Special Requests (Optional)</Label>
                  <Textarea name="notes" placeholder="Any specific requirements or stylist preferences?" />
                </div>
                <Button type="submit" className="w-full text-lg py-4" disabled={createBooking.isPending}>
                  {createBooking.isPending ? "Confirming..." : `Confirm Booking for ${selectedTime}`}
                </Button>
              </form>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
}
