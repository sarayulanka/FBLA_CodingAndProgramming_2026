/**
 * App.tsx — Root application component for BizBloom.
 *
 * Sets up global providers (error boundary, theme, tooltips, toast notifications)
 * and defines client-side routing using Wouter.
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider } from "./contexts/SearchContext";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Reviews from "./pages/Reviews";
import Deals from "./pages/Deals";
import CommunityReviews from "./pages/CommunityReviews";
import Trending from "./pages/Trending";
import Badges from "./pages/Badges";
import Impact from "./pages/Impact";
import Plan from "./pages/Plan";

/**
 * Router — declares all client-side routes inside the shared Layout shell.
 * The final <Route> without a path acts as the catch-all 404 handler.
 */
function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/favorites"} component={Favorites} />
        <Route path={"/reviews"} component={Reviews} />
        <Route path={"/deals"} component={Deals} />
        <Route path={"/community-reviews"} component={CommunityReviews} />
        <Route path={"/trending"} component={Trending} />
        <Route path={"/badges"} component={Badges} />
        <Route path={"/impact"} component={Impact} />
        <Route path={"/plan"} component={Plan} />
        <Route path={"/404"} component={NotFound} />
        {/* Catch-all: any unmatched path renders the 404 page */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

/**
 * App — top-level component that wraps the entire application in context providers.
 *
 * Provider order (outermost → innermost):
 *  1. ErrorBoundary  — catches unhandled React errors
 *  2. ThemeProvider   — manages light/dark theme state
 *  3. TooltipProvider — enables UI tooltips globally
 *  4. Toaster         — renders toast notifications from `sonner`
 *  5. Router          — page-level routing
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SearchProvider>
            <Toaster />
            <Router />
          </SearchProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
