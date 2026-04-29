import { Route, Routes } from 'react-router-dom';
import { AdminGuard } from './components/admin/AdminGuard';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AdminGuard>
            <DashboardPage />
          </AdminGuard>
        }
      />
    </Routes>
  );
}
