import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AcademicYearProvider } from "@/contexts/AcademicYearContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import CourseView from "./pages/CourseView";
import LevelContent from "./pages/LevelContent";
import AdminLogin from "./pages/AdminLogin";
import ClubMaths from "./pages/ClubMaths";
import DnbRevisionResources from "./pages/DnbRevisionResources";
import ProgressionSpiralee from "./pages/ProgressionSpiralee";
import Automatismes from "./pages/Automatismes";
import ParcoursRevision from "./pages/ParcoursRevision";
import ParentResources from "./pages/ParentResources";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AcademicYearProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-login" element={<AdminLogin />} />
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

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AcademicYearProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;