"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Player } from "../types/game";

interface OnlineGameProps {
  onJoinGame: (players: Player[]) => void;
}

export function OnlineGame({ onJoinGame }: OnlineGameProps) {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  const [player, setPlayer] = useState<Player>({
    id: 0,
    name: "",
    color: "",
    letter: "",
  });
  const [error, setError] = useState("");

  const createGame = () => {
    if (!player.color || !player.letter) {
      setError("Please set your color and letter first");
      return;
    }

    const newRoomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    socket?.emit("create-room", newRoomId);
    setRoomId(newRoomId);
    setRoomPlayers([player]);
    socket?.emit("join-room", newRoomId, player);
  };

  const joinGame = () => {
    if (!player.color || !player.letter) {
      setError("Please set your color and letter first");
      return;
    }

    if (!joinCode) {
      setError("Please enter a room code");
      return;
    }

    socket?.emit("join-room", joinCode.toUpperCase(), player);
    setRoomId(joinCode.toUpperCase());
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("room-created", ({ roomId }) => {
      setRoomId(roomId);
    });

    socket.on("player-joined", (newPlayer) => {
      setRoomPlayers((prev) => {
        const updatedPlayers = [...prev, newPlayer];
        // Start game when we have 2 or more players
        if (updatedPlayers.length >= 2) {
          onJoinGame(updatedPlayers);
        }
        return updatedPlayers;
      });
    });

    return () => {
      socket.off("room-created");
      socket.off("player-joined");
    };
  }, [socket, onJoinGame]);

  if (!isConnected) {
    return <div>Connecting to server...</div>;
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl mb-6">Online Game</h1>

      {/* Player Setup */}
      <div className="mb-6">
        <h2 className="text-xl mb-4">Your Player Info</h2>
        <input
          type="text"
          maxLength={1}
          placeholder="Letter"
          value={player.letter}
          onChange={(e) =>
            setPlayer((prev) => ({
              ...prev,
              letter: e.target.value.toUpperCase(),
            }))
          }
          className="p-2 mr-2 text-black"
        />
        <select
          value={player.color}
          onChange={(e) =>
            setPlayer((prev) => ({
              ...prev,
              color: e.target.value,
            }))
          }
          className="p-2 text-black"
        >
          <option value="">Select Color</option>
          <option value="red">Red</option>
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
          <option value="cyan">Cyan</option>
          <option value="magenta">Magenta</option>
        </select>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Game Creation/Joining */}
      {!roomId ? (
        <div className="space-y-4">
          <div>
            <button
              onClick={createGame}
              className="bg-blue-500 px-4 py-2 rounded mr-4"
            >
              Create New Game
            </button>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="p-2 mr-2 text-black"
            />
            <button
              onClick={joinGame}
              className="bg-green-500 px-4 py-2 rounded"
            >
              Join Game
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl mb-4">Room Code: {roomId}</h2>
          <p>Waiting for other players to join...</p>
        </div>
      )}
    </div>
  );
}
