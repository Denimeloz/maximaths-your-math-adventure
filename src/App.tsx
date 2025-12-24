import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardBadges from "./pages/DashboardBadges";
import DashboardAssignments from "./pages/DashboardAssignments";
import DashboardCalendar from "./pages/DashboardCalendar";
import DashboardSettings from "./pages/DashboardSettings";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import College from "./pages/College";
import Lycee from "./pages/Lycee";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import CourseView from "./pages/CourseView";
import QuizPage from "./pages/QuizPage";
import AssignmentSubmit from "./pages/AssignmentSubmit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/badges" element={<DashboardBadges />} />
            <Route path="/dashboard/assignments" element={<DashboardAssignments />} />
            <Route path="/dashboard/calendar" element={<DashboardCalendar />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/courses" element={<Admin />} />
            <Route path="/admin/users" element={<Admin />} />
            <Route path="/admin/stats" element={<Admin />} />
            <Route path="/admin/settings" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/college" element={<College />} />
            <Route path="/lycee" element={<Lycee />} />
            <Route path="/about" element={<About />} />
            <Route path="/course/:courseId" element={<CourseView />} />
            <Route path="/quiz/:quizId" element={<QuizPage />} />
            <Route path="/assignment/:assignmentId" element={<AssignmentSubmit />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
