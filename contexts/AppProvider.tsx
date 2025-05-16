import LoadingScreen from '@/components/LoadingScreen';
import { initializeApp } from '@/services/firebase/initialize';
import React, { useEffect, useState } from 'react';
import { AuthProvider } from './AuthContext';
import { CleaningProvider } from './CleaningContext';
import { CleaningRequestProvider } from './CleaningRequestContext';
import { ReservationProvider } from './ReservationContext';
import { RoomProvider } from './RoomContext';
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp().then(() => setIsInitialized(true)).catch(console.error);
  }, []);


  if (!isInitialized) {
    return <LoadingScreen message="Инициализация приложения..." />;
  }

  return (
    <AuthProvider>
      <ReservationProvider>
        <RoomProvider>
          <CleaningProvider>
            <CleaningRequestProvider>
              {children}
            </CleaningRequestProvider>
          </CleaningProvider>
        </RoomProvider>
      </ReservationProvider>
    </AuthProvider>
  );
}; 