import { Navigate, Route, Routes } from 'react-router';
import { PrivateRoute } from '@/components/PrivateRoute';
import { AuthProvider } from '@/contexts/AuthProvider';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OrganizerPlaceholderPage from '@/pages/OrganizerPlaceholderPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/organizador"
          element={
            <PrivateRoute roles={['ORGANIZER']}>
              <OrganizerPlaceholderPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
