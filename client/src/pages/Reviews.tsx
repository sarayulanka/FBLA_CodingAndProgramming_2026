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
        <Card className="max-w-md rounded-2xl border-0 shadow-xl text-center p-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl font-bold">Sign in Required</CardTitle>
            <CardDescription className="text-base">
              You need to be signed in to write reviews.
            </CardDescription>
          </CardHeader>
          <Button asChild className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600">
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
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
        <Card className="max-w-2xl mx-auto text-center p-10 rounded-2xl border-0 shadow-lg">
          <div className="w-20 h-20 mx-auto bg-violet-100 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-violet-500" />
          </div>
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-2xl font-bold">How to Write a Review</CardTitle>
            <CardDescription className="text-base leading-relaxed mt-3">
              To write a review, search for a business on the{" "}
              <Link href="/" className="text-violet-600 hover:underline font-semibold">
                home page
              </Link>{" "}
              and click on it to open the business details. You'll find a "Write a Review" button there.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center p-0">
            <Button
              onClick={() => setLocation("/")}
              size="lg"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 btn-shimmer"
            >
              Go to Home Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
