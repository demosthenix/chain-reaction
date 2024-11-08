import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io({
        path: "/api/socket",
        addTrailingSlash: false,
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to socket server");
        setIsConnected(true);
      });

      socketRef.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setIsConnected(false);
      });

      socketRef.current.on("disconnect", () => {
        console.log("Disconnected from socket server");
        setIsConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
