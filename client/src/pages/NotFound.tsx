/**
 * NotFound.tsx — 404 error page.
 *
 * Displayed when the user navigates to a route that doesn't exist.
 * Shows a friendly error message with a button to return home.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4 rounded-2xl border-0 shadow-xl">
        <CardContent className="pt-10 pb-10 text-center">
          <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-rose-500" />
          </div>

          <h1 className="text-5xl font-extrabold text-gradient mb-2">404</h1>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Page Not Found</h2>

          <p className="text-gray-500 mb-8 leading-relaxed">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved or deleted.
          </p>

          <Button
            onClick={() => setLocation("/")}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 btn-shimmer px-8 py-5"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
