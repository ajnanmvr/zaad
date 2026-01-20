import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export default function AuthInitializer({ children }: AuthInitializerProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      await authService.initializeAuth();
      setIsInitializing(false);
    };

    initialize();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
