import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans">
      <div className="absolute inset-0 z-0">
         <img 
           src={`${import.meta.env.BASE_URL}images/hero.png`} 
           alt="Elegant Salon"
           className="w-full h-full object-cover" 
         />
         <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      
      <header className="relative z-10 p-6 md:p-10 flex justify-center">
        <div className="font-display text-4xl md:text-5xl font-bold tracking-wide text-primary">
          Aura<span className="text-foreground">Salon</span>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
         <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
           Experience Elegance <br/> <span className="text-primary italic font-light">& Precision</span>
         </h1>
         <p className="text-lg md:text-2xl text-foreground/70 mb-12 font-light max-w-2xl">
           Book your next appointment seamlessly with your favorite stylists, or manage your salon with effortless grace.
         </p>
         
         <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
           <Link 
             href="/book" 
             className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center"
           >
             Book an Appointment
           </Link>
           <Link 
             href="/owner" 
             className="px-8 py-4 rounded-xl bg-card/80 backdrop-blur-md text-foreground border-2 border-border/80 font-semibold text-lg hover:border-primary/50 hover:bg-card hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center shadow-lg shadow-black/5"
           >
             I'm a Salon Owner
           </Link>
         </div>
      </div>
    </div>
  );
}
