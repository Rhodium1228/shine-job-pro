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
import ACSULoyaltyConfig from "./pages/ACSULoyaltyConfig";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import CustomerFeedback from "./pages/CustomerFeedback";
import StaffInvite from "./pages/StaffInvite";
import StaffOnboarding from "./pages/StaffOnboarding";
import { BranchProvider } from "./contexts/BranchContext";
import { TenantProvider } from "./contexts/TenantContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import TenantRoute from "./components/TenantRoute";
import { AdminLayout } from "./components/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TenantProvider>
      <BranchProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Branch/Salon Selector (Pre-Tenant Selection) */}
            <Route path="/branch-selector" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            
            {/* Tenant-Scoped Routes: /app/{salonId}/... */}
            <Route path="/app/:salonId/*" element={
              <ProtectedRoute>
                <TenantRoute>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="job-flow" element={<JobFlow />} />
                    <Route path="break-timer" element={<BreakTimer />} />
                    <Route path="calendar" element={<CalendarView />} />
                    <Route path="earnings" element={<EarningsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="acsu-wallet" element={<ACSUWallet />} />
                    <Route path="onboarding" element={<StaffOnboarding />} />
                    
                    {/* Admin Routes within Tenant Context */}
                    <Route path="admin" element={<ProtectedAdminRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="staff-management" element={<ProtectedAdminRoute><AdminLayout><StaffManagement /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="booking-management" element={<ProtectedAdminRoute><AdminLayout><EnhancedBookingManagement /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="branch-management" element={<ProtectedAdminRoute><AdminLayout><BranchManagement /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="availability-report" element={<ProtectedAdminRoute><AdminLayout><AvailabilityReport /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="loyalty-config" element={<ProtectedAdminRoute><AdminLayout><ACSULoyaltyConfig /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="reports-analytics" element={<ProtectedAdminRoute><AdminLayout><ReportsAnalytics /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="customer-feedback" element={<ProtectedAdminRoute><AdminLayout><CustomerFeedback /></AdminLayout></ProtectedAdminRoute>} />
                    <Route path="staff-invite" element={<ProtectedAdminRoute><AdminLayout><StaffInvite /></AdminLayout></ProtectedAdminRoute>} />
                  </Routes>
                </TenantRoute>
              </ProtectedRoute>
            } />

            {/* Legacy Routes - Redirect to branch selector */}
            <Route path="/dashboard" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/job-flow" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/break-timer" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/acsu-wallet" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/staff-management" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/booking-management" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/branch-management" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/availability-report" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/loyalty-config" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/reports-analytics" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/customer-feedback" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/staff-invite" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><BranchSelector /></ProtectedRoute>} />
            
            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </BranchProvider>
    </TenantProvider>
  </QueryClientProvider>
);

export default App;
