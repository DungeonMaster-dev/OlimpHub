import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Problems from "@/pages/Problems";
import Progress from "@/pages/Progress";
import Settings from "@/pages/Settings";
import Skills from "@/pages/Skills";
import Training from "@/pages/Training";
import TrainingSession from "@/pages/TrainingSession";
import Workspace from "@/pages/Workspace";
import { Route, Switch } from "wouter";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/problems" component={Problems} />
        <Route path="/problems/:id" component={Workspace} />
        <Route path="/training" component={Training} />
        <Route path="/training/:id" component={TrainingSession} />
        <Route path="/skills" component={Skills} />
        <Route path="/progress" component={Progress} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
