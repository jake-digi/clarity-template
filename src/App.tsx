import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarStateProvider } from "@/contexts/SidebarContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import PeopleManagement from "./pages/PeopleManagement.tsx";
import Participants from "./pages/Participants.tsx";
import ParticipantProfile from "./pages/ParticipantProfile.tsx";
import ParticipantInstancePage from "./pages/ParticipantInstancePage.tsx";
import InstancesPage from "./pages/InstancesPage.tsx";
import NewInstancePage from "./pages/NewInstancePage.tsx";
import InstanceDetailPage from "./pages/InstanceDetailPage.tsx";
import TrackingPage from "./pages/TrackingPage.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Login from "./pages/Login.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import CasesPage from "./pages/CasesPage.tsx";
import CaseDetailPage from "./pages/CaseDetailPage.tsx";
import RolesPage from "./pages/RolesPage.tsx";
import AdministrationPage from "./pages/AdministrationPage.tsx";
import SitesPage from "./pages/SitesPage.tsx";
import SiteDetailPage from "./pages/SiteDetailPage.tsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarStateProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/people" element={<ProtectedRoute><PeopleManagement /></ProtectedRoute>} />
              <Route path="/people/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/participants" element={<ProtectedRoute><Participants /></ProtectedRoute>} />
              <Route path="/participants/:id" element={<ProtectedRoute><ParticipantProfile /></ProtectedRoute>} />
              <Route path="/participants/:id/instances/:instanceId" element={<ProtectedRoute><ParticipantInstancePage /></ProtectedRoute>} />
              <Route path="/instances" element={<ProtectedRoute><InstancesPage /></ProtectedRoute>} />
              <Route path="/instances/new" element={<ProtectedRoute><NewInstancePage /></ProtectedRoute>} />
              <Route path="/instances/:instanceId" element={<ProtectedRoute><InstanceDetailPage /></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
              <Route path="/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
              <Route path="/cases/:caseId" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
              <Route path="/sites" element={<ProtectedRoute><SitesPage /></ProtectedRoute>} />
              <Route path="/sites/:siteId" element={<ProtectedRoute><SiteDetailPage /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
