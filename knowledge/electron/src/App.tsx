import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import StartupLoading from "./components/shared/StartupLoading";

import { ThemeProvider } from "@/components/theme-provider";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import { AuthProvider, useAuth } from "@/components/auth-provider";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.hasCompletedOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (user && user.hasCompletedOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <StartupLoading onLoadingComplete={() => setIsAppReady(true)} />
      {isAppReady && <Outlet />}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pixel-perfect-theme">
        <AccessibilityProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <HashRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </HashRouter>
            </TooltipProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
