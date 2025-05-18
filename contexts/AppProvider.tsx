import React from 'react';
import { AuthProvider } from './AuthContext';
import { CleaningProvider } from './CleaningContext';
import { CleaningRequestProvider } from './CleaningRequestContext';
import { KitchenProvider } from './KitchenContext';
import { RepairProvider } from './RepairContext';
import { ReservationProvider } from './ReservationContext';
import { RoomProvider } from './RoomContext';
import { RoomServiceProvider } from './RoomServiceContext';
import { UserProvider } from './UserContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserProvider>
        <RoomProvider>
          <ReservationProvider>
            <CleaningRequestProvider>
              <CleaningProvider>
                <KitchenProvider>
                  <RoomServiceProvider>
                    <RepairProvider>
                      {children}
                    </RepairProvider>
                  </RoomServiceProvider>
                </KitchenProvider>
              </CleaningProvider>
            </CleaningRequestProvider>
          </ReservationProvider>
        </RoomProvider>
      </UserProvider>
    </AuthProvider>
  );
}; 