import { Navigate, Route, Routes } from 'react-router';
import { PrivateRoute } from '@/components/PrivateRoute';
import { AuthProvider } from '@/contexts/AuthProvider';
import EventDetailPage from '@/pages/EventDetailPage';
import EventsPage from '@/pages/EventsPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OrganizerPage from '@/pages/OrganizerPage';
import ReservationConfirmationPage from '@/pages/ReservationConfirmationPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/eventos/:id" element={<EventDetailPage />} />
        <Route
          path="/reservas/confirmacao"
          element={<ReservationConfirmationPage />}
        />
        <Route
          path="/organizador"
          element={
            <PrivateRoute roles={['ORGANIZER']}>
              <OrganizerPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
