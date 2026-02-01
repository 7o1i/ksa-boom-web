import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import Download from "./pages/Download";
import AdminDashboard from "./pages/admin/Dashboard";
import LicenseManagement from "./pages/admin/Licenses";
import SecurityMonitor from "./pages/admin/Security";
import AdminSettings from "./pages/admin/Settings";
import AdminOrders from "./pages/admin/Orders";
import PaymentSuccess from "./pages/PaymentSuccess";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/download" component={Download} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/licenses" component={LicenseManagement} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/security" component={SecurityMonitor} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
