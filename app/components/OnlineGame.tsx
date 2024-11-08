"use client";

import { useEffect, useState } from "react";
import { Player } from "../types/game";
import { useSocket } from "../providers/SocketProvider";

interface OnlineGameProps {
  onJoinGame: (players: Player[], roomId: string) => void;
}
export function OnlineGame({ onJoinGame }: OnlineGameProps) {
  const { socket } = useSocket();
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [player, setPlayer] = useState<Player>({
    id: "",
    name: "",
    color: "",
    letter: "",
  });
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (!socket) return;

    socket.on("player-updated", (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on("game-started", (gamePlayers: Player[]) => {
      onJoinGame(gamePlayers, roomId);
    });

    return () => {
      socket.off("player-updated");
      socket.off("game-started");
    };
  }, [socket, onJoinGame, roomId]);

  const createGame = () => {
    if (!socket) return;

    socket.emit("create-room", ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setIsOwner(true);
      const newPlayer = { ...player, id: socket.id! };
      setPlayer(newPlayer);
      socket.emit(
        "join-room",
        { roomId, player: newPlayer },
        (response: any) => {
          if (response.success) {
            setPlayers([newPlayer]);
          }
        }
      );
    });
  };

  const joinGame = () => {
    if (!socket) return;

    if (!joinCode) {
      setError("Please enter a room code");
      return;
    }

    const newPlayer = { ...player, id: socket.id! };
    setPlayer(newPlayer);

    socket.emit(
      "join-room",
      { roomId: joinCode.toUpperCase(), player: newPlayer },
      (response: any) => {
        if (response.success) {
          setRoomId(joinCode.toUpperCase());
        } else {
          setError(response.message);
        }
      }
    );
  };

  const updatePlayerInfo = (key: keyof Player, value: string) => {
    const updatedPlayer = { ...player, [key]: value };
    setPlayer(updatedPlayer);

    if (socket && roomId) {
      socket.emit("update-player", { roomId, player: updatedPlayer });
    }
  };

  const startGame = () => {
    if (socket && roomId && isOwner && players.length >= 2) {
      socket.emit("start-game", roomId);
    }
  };

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
            updatePlayerInfo("letter", e.target.value.toUpperCase())
          }
          className="p-2 mr-2 text-black"
        />
        <select
          value={player.color}
          onChange={(e) => updatePlayerInfo("color", e.target.value)}
          className="p-2 text-black"
        >
          <option value="">Select Color</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
          <option value="yellow">Yellow</option>
          <option value="cyan">Cyan</option>
          <option value="magenta">Magenta</option>
        </select>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!roomId ? (
        <div className="space-y-4">
          <button
            onClick={createGame}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            Create New Game
          </button>
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
          <div className="mb-4">
            <h3 className="text-lg">Players in Lobby:</h3>
            <ul>
              {players.map((p) => (
                <li key={p.id} style={{ color: p.color }}>
                  {p.letter}
                </li>
              ))}
            </ul>
          </div>
          {isOwner && players.length >= 2 ? (
            <button
              onClick={startGame}
              className="bg-green-500 px-4 py-2 rounded"
            >
              Start Game
            </button>
          ) : (
            <p>Waiting for the host to start the game...</p>
          )}
        </div>
      )}
    </div>
  );
}
