'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  setUser: (user: FarcasterUser | null) => void;
  isAuthenticated: boolean;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);

  return (
    <FarcasterContext.Provider 
      value={{ 
        user, 
        setUser, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterUser() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcasterUser must be used within a FarcasterProvider');
  }
  return context;
}