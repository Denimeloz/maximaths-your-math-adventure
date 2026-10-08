import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import ScrollManager from "@/components/ScrollManager";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Les autres pages sont chargées à la demande : un élève ne télécharge plus le code de l'espace admin.
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const About = lazy(() => import("./pages/About"));
const CourseView = lazy(() => import("./pages/CourseView"));
const LevelContent = lazy(() => import("./pages/LevelContent"));
const ClubMaths = lazy(() => import("./pages/ClubMaths"));
const DnbRevisionResources = lazy(() => import("./pages/DnbRevisionResources"));
const ProgressionSpiralee = lazy(() => import("./pages/ProgressionSpiralee"));
const Automatismes = lazy(() => import("./pages/Automatismes"));
const ParcoursRevision = lazy(() => import("./pages/ParcoursRevision"));
const ParentResources = lazy(() => import("./pages/ParentResources"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-hero-gradient flex items-center justify-center" role="status" aria-label="Chargement">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AcademicYearProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollManager />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                {/* Ancienne page intermédiaire : on va directement à la connexion */}
                <Route path="/admin-login" element={<Navigate to="/auth" replace />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/courses" element={<Admin />} />
                <Route path="/admin/users" element={<Admin />} />
                <Route path="/admin/stats" element={<Admin />} />
                <Route path="/admin/settings" element={<Admin />} />
                <Route path="/about" element={<About />} />
                <Route path="/niveau/:levelId/:contentType" element={<LevelContent />} />
                <Route path="/course/:courseId" element={<CourseView />} />
                <Route path="/club-maths" element={<ClubMaths />} />
                <Route path="/club-maths/:activitySlug" element={<ClubMaths />} />
                <Route path="/ressources-dnb" element={<DnbRevisionResources />} />
                <Route path="/progression-spiralee" element={<ProgressionSpiralee />} />
                <Route path="/automatismes" element={<Automatismes />} />
                <Route path="/parcours-revision" element={<ParcoursRevision />} />
                <Route path="/ressources-parents" element={<ParentResources />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AcademicYearProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
