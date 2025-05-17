import { useRouter } from 'expo-router';
import React from 'react';
import { useAuth } from './AuthContext';
import { CleaningProvider } from './CleaningContext';
import { CleaningRequestProvider } from './CleaningRequestContext';
import { ReservationProvider } from './ReservationContext';
import { RoomProvider } from './RoomContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isCleaner } = useAuth();
  const router = useRouter();

  // useEffect(() => {
  //   if (isCleaner) {
  //     router.replace('/(cleaner)' as any);
  //   } else {
  //     router.replace('/(user)' as any);
  //   }
  // }, [user, isCleaner]);

  return (
    <ReservationProvider>
      <RoomProvider>
        <CleaningProvider>
          <CleaningRequestProvider>
            {children}
          </CleaningRequestProvider>
        </CleaningProvider>
      </RoomProvider>
    </ReservationProvider>
  );
}; 