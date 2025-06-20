import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:3000');
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join', user.id);
      });

      newSocket.on('ledger_created', (ledger) => {
        toast.success(`New ledger created: ${ledger.name}`);
      });

      newSocket.on('entry_pending', (entry) => {
        toast(`New entry from ${entry.creditor.username}: $${entry.amount}`, {
          icon: '💰',
          duration: 5000,
        });
      });

      newSocket.on('entry_updated', (entry) => {
        const status = entry.status === 'approved' ? 'approved' : 'rejected';
        toast.success(`Entry ${status} by ${entry.debtor.username}`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const value = {
    socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};