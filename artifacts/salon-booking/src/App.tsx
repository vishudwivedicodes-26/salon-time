import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "./pages/landing";
import OwnerLogin from "./pages/owner-login";
import OwnerDashboard from "./pages/owner-dashboard";
import OwnerServices from "./pages/owner-services";
import ClientSalons from "./pages/client-salons";
import ClientServices from "./pages/client-services";
import ClientBooking from "./pages/client-booking";
import ClientConfirmation from "./pages/client-confirmation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground font-sans">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">This page could not be found.</p>
        <a href="/" className="text-primary hover:underline font-medium">Return Home</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={Landing} />
            
            {/* Owner Routes */}
            <Route path="/owner" component={OwnerLogin} />
            <Route path="/owner/:salonId" component={OwnerDashboard} />
            <Route path="/owner/:salonId/services" component={OwnerServices} />
            
            {/* Client Routes */}
            <Route path="/book" component={ClientSalons} />
            <Route path="/book/:salonId" component={ClientServices} />
            <Route path="/book/:salonId/slots" component={ClientBooking} />
            <Route path="/book/confirm/:bookingId" component={ClientConfirmation} />
            
            <Route component={NotFound} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
