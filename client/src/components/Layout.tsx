import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, getLoginUrl } from "@/const";
import { HelpPanel } from "@/components/HelpPanel";
import {
  Building2, TrendingUp, Tag, MessageSquare, Heart, BarChart3,
  HelpCircle, User, ChevronDown, LogOut, Trophy, Menu, X, Sparkles
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/community-reviews", label: "Reviews", icon: MessageSquare },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => window.location.reload(),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-pink-400 to-violet-400 rounded-full animate-glow-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {APP_TITLE}
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-violet-100 text-violet-700"
                        : "text-gray-600 hover:text-violet-700 hover:bg-violet-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <button
                onClick={() => setShowHelp(true)}
                className="nav-link px-3.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Help
              </button>

              <div className="w-px h-6 bg-gray-200 mx-2" />

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 rounded-xl hover:bg-violet-50">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{user?.name || "User"}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
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
                <Button asChild className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 btn-shimmer">
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-violet-50 transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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
                        ? "bg-violet-100 text-violet-700"
                        : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setShowHelp(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition w-full"
              >
                <Sparkles className="w-4 h-4" />
                AI Help
              </button>
              {!isAuthenticated && (
                <a
                  href={getLoginUrl()}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 mt-2"
                >
                  Sign In
                </a>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>

      {/* Help Panel */}
      <HelpPanel open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
