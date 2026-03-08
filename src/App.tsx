import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Pricing from "@/pages/Pricing";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import Clients from "@/pages/Clients";
import Supplies from "@/pages/Supplies";
import Recipes from "@/pages/Recipes";
import Packaging from "@/pages/Packaging";
import Finance from "@/pages/Finance";
import Shopping from "@/pages/Shopping";
import DigitalMenu from "@/pages/DigitalMenu";
import BusinessInfo from "@/pages/BusinessInfo";
import Plans from "@/pages/Plans";
import SettingsPage from "@/pages/SettingsPage";
import AccountSettings from "@/pages/AccountSettings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/login" element={<Navigate to="/auth" replace />} />
    <Route path="/register" element={<Navigate to="/auth" replace />} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
    <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
    <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
    <Route path="/supplies" element={<ProtectedRoute><Supplies /></ProtectedRoute>} />
    <Route path="/packaging" element={<ProtectedRoute><Packaging /></ProtectedRoute>} />
    <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
    <Route path="/shopping" element={<ProtectedRoute><Shopping /></ProtectedRoute>} />
    <Route path="/menu" element={<ProtectedRoute><DigitalMenu /></ProtectedRoute>} />
    <Route path="/business-info" element={<ProtectedRoute><BusinessInfo /></ProtectedRoute>} />
    <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
