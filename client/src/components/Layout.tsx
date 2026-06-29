/**
 * Layout.tsx — Shared page layout with responsive navigation.
 *
 * Renders the sticky top navigation bar (desktop + mobile hamburger menu),
 * user authentication controls, and the AI Help panel.
 * All page content is rendered as {children} inside the <main> tag.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";
import { HelpPanel } from "@/components/HelpPanel";
import { AuthModal } from "@/components/AuthModal";
import { useSearchContext } from "@/contexts/SearchContext";
import {
  Building2, TrendingUp, Tag, MessageSquare, Heart, BarChart3,
  HelpCircle, User, ChevronDown, LogOut, Trophy, Menu, X, Sparkles, Globe, Calendar
} from "lucide-react";

// Navigation items displayed in the top bar (both desktop and mobile)
const NAV_ITEMS = [
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/community-reviews", label: "Reviews", icon: MessageSquare },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/impact", label: "Impact", icon: Globe },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { nearbyBusinesses } = useSearchContext();
  const [location] = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="container py-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* Left — logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-pink-400 to-violet-400 rounded-full animate-glow-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </Link>

            {/* Center — nav links */}
            <div className="hidden md:flex items-center justify-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "text-white/65 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/plan"
                className={`nav-link p-2 rounded-lg transition-all tooltip-trigger ${
                  location === "/plan"
                    ? "bg-white/12 text-white"
                    : "text-white/65 hover:text-white hover:bg-white/8"
                }`}
                title="Plan My Day"
              >
                <Calendar className="w-5 h-5" />
              </Link>

              <button
                onClick={() => setShowHelp(true)}
                className="nav-link px-3.5 py-2 rounded-lg text-sm font-medium text-white/65 hover:text-white hover:bg-white/8 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Help
              </button>
            </div>

            {/* Right — auth controls + mobile menu button */}
            <div className="flex items-center gap-2 justify-end">
              <div className="w-px h-6 bg-white/10" />
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-xl hover:bg-white/10 text-white">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{user?.name || "User"}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/badges" className="flex items-center cursor-pointer">
                        <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                        View Badges
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout.mutate()} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuth(true)} className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 btn-shimmer">
                  Sign In
                </Button>
              )}
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition text-white/70"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 border-t mt-3 space-y-1 animate-slide-up">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "text-white/65 hover:bg-white/8 hover:text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/plan"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  location === "/plan"
                    ? "bg-white/12 text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                Plan My Day
              </Link>
              <button
                onClick={() => { setShowHelp(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/65 hover:bg-white/8 hover:text-white transition w-full"
              >
                <Sparkles className="w-4 h-4" />
                AI Help
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 mt-2 w-full"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>

      {/* Help Panel */}
      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} nearbyBusinesses={nearbyBusinesses} />

      {/* Auth Modal */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
