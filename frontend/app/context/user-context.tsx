'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  username: string;
  email: string;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState('user123');
  const [email, setEmail] = useState('user@example.com');

  return (
    <UserContext.Provider value={{ username, email, setUsername, setEmail }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
