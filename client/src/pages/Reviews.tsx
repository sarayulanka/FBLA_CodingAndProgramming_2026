/**
 * Reviews.tsx — "Write a Review" instructions page.
 *
 * Guides authenticated users to the Home page where they can
 * search for a business and write a review from the details dialog.
 * Unauthenticated users see a sign-in prompt.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

export default function Reviews() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full rounded-2xl text-center p-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in Required</h2>
          <p className="text-white/55 text-base mb-6">
            You need to be signed in to write reviews.
          </p>
          <Button asChild className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Write a Review</h1>
              <p className="text-violet-200 mt-1">Share your experience with the community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="glass-card max-w-2xl mx-auto text-center p-10 rounded-2xl">
          <div className="w-20 h-20 mx-auto bg-violet-500/20 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">How to Write a Review</h2>
          <p className="text-white/55 text-base leading-relaxed mt-3 mb-6">
            To write a review, search for a business on the{" "}
            <Link href="/" className="text-violet-400 hover:text-violet-300 hover:underline font-semibold">
              home page
            </Link>{" "}
            and click on it to open the business details. You'll find a "Write a Review" button there.
          </p>
          <Button
            onClick={() => setLocation("/")}
            size="lg"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 btn-shimmer"
          >
            Go to Home Page
          </Button>
        </div>
      </div>
    </div>
  );
}
