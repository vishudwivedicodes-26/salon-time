import { Link } from "wouter";
import { ArrowLeft, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  backLink?: string;
  ownerMode?: boolean;
  salonId?: number;
}

export function Layout({ children, title, backLink, ownerMode, salonId }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backLink && (
              <Link href={backLink} className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <Link href="/" className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-primary hover:opacity-80 transition-opacity">
              Aura<span className="text-foreground">Salon</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            {title && <h1 className="font-display text-xl font-medium hidden md:block text-foreground/80">{title}</h1>}
            
            {ownerMode && salonId && (
              <div className="flex items-center gap-2">
                <Link href={`/owner/${salonId}`} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Dashboard">
                  <Calendar className="w-5 h-5" />
                </Link>
                <Link href={`/owner/${salonId}/services`} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Services">
                  <User className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
