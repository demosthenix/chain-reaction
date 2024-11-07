import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Player } from "../types/game";

interface OnlineLobbyProps {
  onGameStart: (players: Player[]) => void;
}

export function OnlineLobby({ onGameStart }: OnlineLobbyProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    socket?.emit("create-room", newRoomId);
    setRoomId(newRoomId);
    setIsHost(true);
  };

  const joinRoom = () => {
    if (roomId) {
      socket?.emit("join-room", roomId, players[0]);
    }
  };

  const startGame = () => {
    if (players.length >= 2) {
      onGameStart(players);
      socket?.emit("game-start", roomId, players);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("player-joined", (player: Player) => {
      setPlayers((prev) => [...prev, player]);
    });

    socket.on("game-start", (gamePlayers: Player[]) => {
      onGameStart(gamePlayers);
    });

    return () => {
      socket.off("player-joined");
      socket.off("game-start");
    };
  }, [socket, onGameStart]);

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl mb-4">Online Lobby</h2>
      {!roomId ? (
        <div className="space-y-4">
          <button
            onClick={createRoom}
            className="block w-48 px-4 py-2 bg-blue-500 rounded"
          >
            Create Room
          </button>
          <div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="px-4 py-2 text-black rounded"
            />
            <button
              onClick={joinRoom}
              className="ml-2 px-4 py-2 bg-green-500 rounded"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Room ID: {roomId}</p>
          <div className="mt-4">
            <h3>Players ({players.length}/6):</h3>
            {players.map((player, index) => (
              <div key={index} style={{ color: player.color }}>
                {player.letter}
              </div>
            ))}
          </div>
          {isHost && players.length >= 2 && (
            <button
              onClick={startGame}
              className="mt-4 px-4 py-2 bg-green-500 rounded"
            >
              Start Game
            </button>
          )}
        </div>
      )}
    </div>
  );
}
