import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClientProvider } from "./contexts/ClientContext";
import DashboardLayout from "./components/DashboardLayout";
import ZoomHome from "./pages/ZoomHome";
import ZoomHistory from "./pages/ZoomHistory";
import ZoomSettingsPage from "./pages/ZoomSettings";
import InvitationTemplatePage from "./pages/InvitationTemplatePage";
import LandingPage from "./pages/Landing";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./pages/AuthPages";
import PasscodeManagement from "./pages/PasscodeManagement";
import ResetPassword from "./pages/ResetPassword";

function AdminRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={ZoomHome} />
        <Route path="/zoom" component={ZoomHome} />
        <Route path="/zoom-history" component={ZoomHistory} />
        <Route path="/zoom-settings" component={ZoomSettingsPage} />
        <Route path="/invitation-template" component={InvitationTemplatePage} />
        <Route path="/app-settings" component={ZoomSettingsPage} />
        <Route path="/passcodes" component={PasscodeManagement} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function AppRouter() {
  const [location] = useLocation();

  if (location === "/lp") {
    return <LandingPage />;
  }
  if (location === "/login") {
    return <LoginPage />;
  }
  if (location === "/register") {
    return <RegisterPage />;
  }
  if (location === "/forgot-password") {
    return <ForgotPasswordPage />;
  }
  if (location.startsWith("/reset-password")) {
    return <ResetPasswordPage />;
  }
  return <AdminRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ClientProvider>
            <Toaster />
            <AppRouter />
          </ClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
