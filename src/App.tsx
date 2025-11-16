import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import JobFlow from "./pages/JobFlow";
import BreakTimer from "./pages/BreakTimer";
import CalendarView from "./pages/CalendarView";
import EarningsPage from "./pages/EarningsPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ACSUWallet from "./pages/ACSUWallet";
import BranchManagement from "./pages/BranchManagement";
import BranchSelector from "./pages/BranchSelector";
import AvailabilityReport from "./pages/AvailabilityReport";
import AdminDashboard from "./pages/AdminDashboard";
import StaffManagement from "./pages/StaffManagement";
import EnhancedBookingManagement from "./pages/EnhancedBookingManagement";
import { BranchProvider } from "./contexts/BranchContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BranchProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/job-flow" element={<ProtectedRoute><JobFlow /></ProtectedRoute>} />
            <Route path="/break-timer" element={<ProtectedRoute><BreakTimer /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><EarningsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/acsu-wallet" element={<ProtectedRoute><ACSUWallet /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute></ProtectedRoute>} />
            <Route path="/staff-management" element={<ProtectedRoute><ProtectedAdminRoute><StaffManagement /></ProtectedAdminRoute></ProtectedRoute>} />
            <Route path="/booking-management" element={<ProtectedRoute><ProtectedAdminRoute><EnhancedBookingManagement /></ProtectedAdminRoute></ProtectedRoute>} />
            <Route path="/branch-management" element={<ProtectedRoute><ProtectedAdminRoute><BranchManagement /></ProtectedAdminRoute></ProtectedRoute>} />
            <Route path="/branch-selector" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/availability-report" element={<ProtectedRoute><ProtectedAdminRoute><AvailabilityReport /></ProtectedAdminRoute></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BranchProvider>
  </QueryClientProvider>
);

export default App;
