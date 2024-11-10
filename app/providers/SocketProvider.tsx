// app/providers/SocketProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

interface SocketContextProps {
  socket: Socket | null;
  clientId: string;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  clientId: "",
});

const CLIENT_ID_KEY = "chain_reaction_client_id";

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    // Get or create a persistent client ID
    let storedClientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!storedClientId) {
      storedClientId = uuidv4();
      localStorage.setItem(CLIENT_ID_KEY, storedClientId);
    }
    setClientId(storedClientId);

    const socketIo = io({
      path: "/socket.io",
      auth: { clientId: storedClientId },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketIo);

    function cleanup() {
      if (socketIo) {
        socketIo.disconnect();
      }
    }

    return cleanup;
  }, []);

  return (
    <SocketContext.Provider value={{ socket, clientId }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
