import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClientProvider } from "./contexts/ClientContext";
import DashboardLayout from "./components/DashboardLayout";
import ClientPortalLayout from "./components/ClientPortalLayout";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/Clients";
import LineSettingsPage from "./pages/LineSettings";
import RichMenusPage from "./pages/RichMenus";
import AutoRepliesPage from "./pages/AutoReplies";
import GreetingPage from "./pages/Greeting";
import StepDeliveryPage from "./pages/StepDelivery";
import FriendsPage from "./pages/Friends";
import MessageLogsPage from "./pages/MessageLogs";
import TemplatesPage from "./pages/Templates";
import ChatbotPage from "./pages/Chatbot";
import ChatbotEditorPage from "./pages/ChatbotEditor";
import { PortalDashboard, PortalLineSettings, withPortalClient } from "./pages/portal";
import LandingPage from "./pages/Landing";
import ZoomHome from "./pages/ZoomHome";
import ZoomHistory from "./pages/ZoomHistory";
import ZoomSettingsPage from "./pages/ZoomSettings";
import AppSettingsPage from "./pages/AppSettingsPage";
import InvitationTemplatePage from "./pages/InvitationTemplatePage";
import RecurringMeetingPage from "./pages/RecurringMeetingPage";

// Portal-wrapped versions of admin pages (auto-inject client context)
const PortalRichMenus = withPortalClient(RichMenusPage);
const PortalAutoReplies = withPortalClient(AutoRepliesPage);
const PortalChatbot = withPortalClient(ChatbotPage);
const PortalChatbotEditor = withPortalClient(ChatbotEditorPage);
const PortalGreeting = withPortalClient(GreetingPage);
const PortalStepDelivery = withPortalClient(StepDeliveryPage);
const PortalFriends = withPortalClient(FriendsPage);
const PortalMessageLogs = withPortalClient(MessageLogsPage);

function AdminRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/line-settings" component={LineSettingsPage} />
        <Route path="/rich-menus" component={RichMenusPage} />
        <Route path="/auto-replies" component={AutoRepliesPage} />
        <Route path="/greeting" component={GreetingPage} />
        <Route path="/step-delivery" component={StepDeliveryPage} />
        <Route path="/step-delivery/:id" component={StepDeliveryPage} />
        <Route path="/friends" component={FriendsPage} />
        <Route path="/message-logs" component={MessageLogsPage} />
        <Route path="/chatbot" component={ChatbotPage} />
        <Route path="/chatbot/:id" component={ChatbotEditorPage} />
        <Route path="/templates" component={TemplatesPage} />
        <Route path="/zoom" component={ZoomHome} />
        <Route path="/zoom-history" component={ZoomHistory} />
        <Route path="/zoom-settings" component={ZoomSettingsPage} />
        <Route path="/app-settings" component={AppSettingsPage} />
        <Route path="/invitation-template" component={InvitationTemplatePage} />
        <Route path="/recurring" component={RecurringMeetingPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function PortalRouter() {
  return (
    <ClientPortalLayout>
      <Switch>
        <Route path="/portal" component={PortalDashboard} />
        <Route path="/portal/line-settings" component={PortalLineSettings} />
        <Route path="/portal/rich-menus" component={PortalRichMenus} />
        <Route path="/portal/auto-replies" component={PortalAutoReplies} />
        <Route path="/portal/chatbot" component={PortalChatbot} />
        <Route path="/portal/chatbot/:id" component={PortalChatbotEditor} />
        <Route path="/portal/greeting" component={PortalGreeting} />
        <Route path="/portal/step-delivery" component={PortalStepDelivery} />
        <Route path="/portal/step-delivery/:id" component={PortalStepDelivery} />
        <Route path="/portal/friends" component={PortalFriends} />
        <Route path="/portal/message-logs" component={PortalMessageLogs} />
        <Route component={NotFound} />
      </Switch>
    </ClientPortalLayout>
  );
}

function AppRouter() {
  const [location] = useLocation();

  if (location === "/lp") {
    return <LandingPage />;
  }
  if (location.startsWith("/portal")) {
    return <PortalRouter />;
  }
  return <AdminRouter />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
