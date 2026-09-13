import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import RoleRoute from '@/components/RoleRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import CompleteProfile from '@/pages/CompleteProfile';

// Public pages
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Book from '@/pages/Book';

// Customer pages
import CustomerDashboard from '@/pages/customer/Dashboard';
import MyBookings from '@/pages/customer/MyBookings';
import BookingDetail from '@/pages/customer/BookingDetail';
import Profile from '@/pages/customer/Profile';
import MyAddress from '@/pages/customer/MyAddress';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminBookings from '@/pages/admin/Bookings';
import AdminServices from '@/pages/admin/Services';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminCustomers from '@/pages/admin/Customers';
import AdminServiceBoys from '@/pages/admin/ServiceBoys';
import AdminExpenses from '@/pages/admin/Expenses';
import BusinessReport from '@/pages/admin/BusinessReport';
import AdminSettings from '@/pages/admin/Settings';

// Service boy pages
import ServiceBoyDashboard from '@/pages/serviceboy/Dashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/services" element={<Services />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Mandatory profile completion for brand-new accounts. Guarded routes
          bounce here until a full name and phone number are on file. */}
      <Route path="/complete-profile" element={<CompleteProfile />} />

      {/* Booking (customer) */}
      <Route path="/book" element={<RoleRoute allowedRoles={["customer"]}><Book /></RoleRoute>} />

      {/* Customer dashboard */}
      <Route path="/dashboard" element={<RoleRoute allowedRoles={["customer"]}><CustomerDashboard /></RoleRoute>} />
      <Route path="/dashboard/bookings" element={<RoleRoute allowedRoles={["customer"]}><MyBookings /></RoleRoute>} />
      <Route path="/dashboard/bookings/:id" element={<RoleRoute allowedRoles={["customer"]}><BookingDetail /></RoleRoute>} />
      <Route path="/dashboard/profile" element={<RoleRoute allowedRoles={["customer"]}><Profile /></RoleRoute>} />
      <Route path="/dashboard/address" element={<RoleRoute allowedRoles={["customer"]}><MyAddress /></RoleRoute>} />

      {/* Admin dashboard */}
      <Route path="/admin" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
      <Route path="/admin/bookings" element={<RoleRoute allowedRoles={["admin"]}><AdminBookings /></RoleRoute>} />
      <Route path="/admin/services" element={<RoleRoute allowedRoles={["admin"]}><AdminServices /></RoleRoute>} />
      <Route path="/admin/coupons" element={<RoleRoute allowedRoles={["admin"]}><AdminCoupons /></RoleRoute>} />
      <Route path="/admin/customers" element={<RoleRoute allowedRoles={["admin"]}><AdminCustomers /></RoleRoute>} />
      <Route path="/admin/serviceboys" element={<RoleRoute allowedRoles={["admin"]}><AdminServiceBoys /></RoleRoute>} />
      <Route path="/admin/expenses" element={<RoleRoute allowedRoles={["admin"]}><AdminExpenses /></RoleRoute>} />
      <Route path="/admin/report" element={<RoleRoute allowedRoles={["admin"]}><BusinessReport /></RoleRoute>} />
      <Route path="/admin/settings" element={<RoleRoute allowedRoles={["admin"]}><AdminSettings /></RoleRoute>} />

      {/* Service boy dashboard */}
      <Route path="/serviceboy" element={<RoleRoute allowedRoles={["service_boy"]}><ServiceBoyDashboard /></RoleRoute>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <ErrorBoundary>
              <AuthenticatedApp />
            </ErrorBoundary>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App