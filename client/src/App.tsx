import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Reviews from "./pages/Reviews";
import Deals from "./pages/Deals";
import CommunityReviews from "./pages/CommunityReviews";
import Trending from "./pages/Trending";
import Badges from "./pages/Badges";
import Analytics from "./pages/Analytics";

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
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
