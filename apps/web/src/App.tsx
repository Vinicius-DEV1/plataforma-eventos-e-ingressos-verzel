import { Navigate, Route, Routes } from 'react-router';
import { PrivateRoute } from '@/components/PrivateRoute';
import { AuthProvider } from '@/contexts/AuthProvider';
import CheckoutPage from '@/pages/CheckoutPage';
import EventDetailPage from '@/pages/EventDetailPage';
import EventsPage from '@/pages/EventsPage';
import GatekeeperPage from '@/pages/GatekeeperPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import OrganizerPage from '@/pages/OrganizerPage';
import SharedTicketPage from '@/pages/SharedTicketPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import TicketsPage from '@/pages/TicketsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/eventos" element={<EventsPage />} />
        <Route path="/eventos/:id" element={<EventDetailPage />} />
        <Route
          path="/reservas/checkout"
          element={
            <PrivateRoute roles={['CUSTOMER']}>
              <CheckoutPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ingressos"
          element={
            <PrivateRoute roles={['CUSTOMER']}>
              <TicketsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ingressos/compartilhar/:shareToken"
          element={<SharedTicketPage />}
        />
        <Route
          path="/ingressos/:id"
          element={
            <PrivateRoute roles={['CUSTOMER']}>
              <TicketDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/organizador"
          element={
            <PrivateRoute roles={['ORGANIZER']}>
              <OrganizerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/portaria"
          element={
            <PrivateRoute roles={['GATEKEEPER']}>
              <GatekeeperPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
