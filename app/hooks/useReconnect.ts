import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { DefaultEventsMap, Socket } from "socket.io";
import { GameState } from "../types/game";

export default function useReconnect(
  socket: any,
  isOnline: boolean,
  setGameState: Dispatch<SetStateAction<GameState>>,
  roomId?: string
) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectionTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOnline && socket) {
      const handleReconnection = () => {
        if (isReconnecting && roomId) {
          socket.emit("sync-request", { roomId });
        }
      };

      const handleDisconnect = () => {
        setIsReconnecting(true);
        // Set a timeout to show reconnecting UI after a brief delay
        reconnectionTimeout.current = setTimeout(() => {
          setIsReconnecting(true);
        }, 1000);
      };

      const handleGameStateSync = (gameState: GameState) => {
        setGameState(gameState);
        setIsReconnecting(false);
        if (reconnectionTimeout.current) {
          clearTimeout(reconnectionTimeout.current);
        }
      };

      const handlePlayerDisconnected = ({
        playerId,
        gameState,
      }: {
        playerId: string;
        gameState: GameState;
      }) => {
        // Update game state if provided
        if (gameState) {
          setGameState(gameState);
        }
        // Optionally show a notification
        console.log(`Player ${playerId} disconnected`);
      };

      socket.on("connect", handleReconnection);
      socket.on("disconnect", handleDisconnect);
      socket.on("sync-game-state", handleGameStateSync);
      socket.on("player-disconnected", handlePlayerDisconnected);

      return () => {
        socket.off("connect", handleReconnection);
        socket.off("disconnect", handleDisconnect);
        socket.off("sync-game-state", handleGameStateSync);
        socket.off("player-disconnected", handlePlayerDisconnected);
        if (reconnectionTimeout.current) {
          clearTimeout(reconnectionTimeout.current);
        }
      };
    }
  }, [isOnline, socket, roomId, isReconnecting]);

  return { isReconnecting, setIsReconnecting };
}
