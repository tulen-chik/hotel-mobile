import React from 'react';
import { CleaningProvider } from './CleaningContext';
import { CleaningRequestProvider } from './CleaningRequestContext';
import { ReservationProvider } from './ReservationContext';
import { RoomProvider } from './RoomContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {


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