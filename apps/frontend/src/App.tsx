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
import ManageEventFormPage from './pages/ManageEventFormPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/layout/Footer';

function App() {
  const location = useLocation();
  const hideFooterRoutes = ['/login', '/register'];
  const showFooter = !hideFooterRoutes.includes(location.pathname);

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
          <Route path="/users/:userId" element={<PublicProfilePage />} />

          {/* Shared Protected Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Attendee Only Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['USER']}><DashboardPage /></ProtectedRoute>} />

          {/* Organizer/Admin Only Routes */}
          <Route path="/organizer" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><OrganizerDashboardPage /></ProtectedRoute>} />
          <Route path="/organizer/events/new" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><EventFormPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/edit" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><EventFormPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/attendees" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><EventAttendeesPage /></ProtectedRoute>} />
          <Route path="/organizer/events/:id/form" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><ManageEventFormPage /></ProtectedRoute>} />

          {/* Admin Only Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}

export default App;
