import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import TrialBanner from './components/TrialBanner';
import SubscriptionExpiredModal from './components/SubscriptionExpiredModal';
import LimitReachedNotifier from './components/LimitReachedNotifier';
import OnboardingWizard from './components/OnboardingWizard';
import { FullPageSpinner } from './components/ui/Spinner';

// Lazy load all page components for code splitting & faster initial load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trainers = lazy(() => import('./pages/Trainers'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Members = lazy(() => import('./pages/Members'));
const Financials = lazy(() => import('./pages/Financials'));
const Settings = lazy(() => import('./pages/Settings'));
const Leads = lazy(() => import('./pages/Leads'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Subscription = lazy(() => import('./pages/Subscription'));

// Protects routes and limits access by user role
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-text-muted">Loading...</div>;
  if (!user) return <Navigate to="/landing" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

// Layout for authenticated/dashboard routes
const DashboardLayout = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-text-muted">Loading...</div>;
  if (!user) return <Navigate to="/landing" replace />;

  return (
    <div className="mesh-gradient-bg min-h-screen text-text-main flex selection:bg-primary/30 relative">
      <Sidebar />
      <main className="flex-1 w-full md:ml-64 min-h-screen flex flex-col z-10 relative">
        <Navbar />
        {/* Trial Banner — shows for trial users below navbar */}
        <TrialBanner />
        <div className="p-4 md:p-8 pt-0 max-w-[1600px] mx-auto w-full flex-1">
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      {/* Subscription Expired Modal — globally mounted, non-dismissable */}
      <SubscriptionExpiredModal />
      {/* Limit Reached Toast — listens for 403 LIMIT_REACHED events */}
      <LimitReachedNotifier />
      {/* Onboarding Wizard — renders if gym is not onboarded */}
      <OnboardingWizard />
    </div>
  );
};

function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Gym Owner & Trainer routes */}
            <Route element={<ProtectedRoute allowedRoles={['gym_owner', 'trainer']} />}>
              <Route path="/members" element={<Members />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Gym Owner restricted routes */}
            <Route element={<ProtectedRoute allowedRoles={['gym_owner', 'superadmin']} />}>
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

