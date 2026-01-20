import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    // Redirect to home if already logged in
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
