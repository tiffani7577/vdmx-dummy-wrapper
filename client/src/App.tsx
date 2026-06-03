import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import ProDashboard from "@/pages/ProDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import SongSwitcher from "@/pages/SongSwitcher";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"}>
        <ErrorBoundary>
          <ProDashboard />
        </ErrorBoundary>
      </Route>
      <Route path={"/pro"}>
        <ErrorBoundary>
          <ProDashboard />
        </ErrorBoundary>
      </Route>
      <Route path={"/songs"} component={SongSwitcher} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/home"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
        <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
