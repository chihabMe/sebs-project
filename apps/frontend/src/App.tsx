import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import BrowseEventsPage from './pages/BrowseEventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import EventFormPage from './pages/EventFormPage';
import EventAttendeesPage from './pages/EventAttendeesPage';
import EventApplicationsPage from './pages/EventApplicationsPage';
import ManageEventFormPage from './pages/ManageEventFormPage';
import PublicProfilePage from './pages/PublicProfilePage';
import CheckinPage from './pages/CheckinPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/layout/Footer';
import OnboardingModal from './components/auth/OnboardingModal';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const hideFooterRoutes = ['/login', '/register'];
  const showFooter = !hideFooterRoutes.includes(location.pathname);

  const showOnboarding = user && user.role === 'USER' && (!user.tags || user.tags.length === 0);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/events" element={<BrowseEventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/events/:id/checkin" element={<CheckinPage />} />
          <Route path="/users/:userId" element={<PublicProfilePage />} />

          {/* Shared Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Attendee Only Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['USER']}><DashboardPage /></ProtectedRoute>} />

          {/* Organizer Only Routes */}
          <Route path="/organizer" element={<ProtectedRoute allowedRoles={['ORGANIZER']}><OrganizerDashboardPage /></ProtectedRoute>} />
          <Route path="/organizer/events/new" element={<ProtectedRoute allowedRoles={['ORGANIZER']}><EventFormPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/edit" element={<ProtectedRoute allowedRoles={['ORGANIZER']}><EventFormPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/attendees" element={<ProtectedRoute allowedRoles={['ORGANIZER']}><EventAttendeesPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/applications" element={<ProtectedRoute allowedRoles={['ORGANIZER']}><EventApplicationsPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/form" element={<ProtectedRoute allowedRoles={['ORGANIZER']}><ManageEventFormPage /></ProtectedRoute>} />
        </Routes>
      </div>
      {showFooter && <Footer />}
      {showOnboarding && <OnboardingModal />}
    </div>
  );
}

export default App;
