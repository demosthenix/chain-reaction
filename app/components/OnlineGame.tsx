"use client";

import { useEffect, useState } from "react";
import { Player, ValidationError } from "../types/game";
import { useSocket } from "../providers/SocketProvider";
import { PLAYER_COLORS } from "../constants/colors";
import { gameSetupAtom } from "../atoms/gameSetup";
import { useRecoilState } from "recoil";

interface OnlineGameProps {
  onJoinGame: (players: Player[], roomId: string) => void;
}
export function OnlineGame({ onJoinGame }: OnlineGameProps) {
  const { socket, clientId } = useSocket();
  const [gameSetup, setGameSetup] = useRecoilState(gameSetupAtom);
  const [roomId, setRoomId] = useState(gameSetup.roomId || "");
  const [players, setPlayers] = useState<Player[]>(gameSetup.players || []);
  const [player, setPlayer] = useState<Player>(() => {
    if (gameSetup.players.length > 0 && socket) {
      const savedPlayer = gameSetup.players.find((p) => p.id === clientId);
      if (savedPlayer) return savedPlayer;
    }
    return {
      id: "",
      name: "",
      color: "",
      letter: "",
    };
  });

  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (gameSetup.roomId) {
      setRoomId(gameSetup.roomId);
      setPlayers(gameSetup.players);
      const host = gameSetup.players?.find((p) => p.isOwner);
      if (host) {
        setIsOwner(host.id === player.id);
      } else {
        const newHost = gameSetup.players[0];
        newHost.isOwner = true;
        const newPlayers = [newHost, ...gameSetup.players.slice(1)];
        setPlayer((prev) => (prev.id === newHost.id ? newHost : prev));
        setPlayers(newPlayers);
        setIsOwner(newHost.id === player.id);
        setGameSetup((prev) => ({ ...prev, players: newPlayers }));
      }
    }
  }, [socket, gameSetup]);

  // Try to reconnect to existing game
  useEffect(() => {
    if (socket && gameSetup.roomId && gameSetup.players.length > 0) {
      const savedPlayer = gameSetup.players.find((p) => p.id === clientId);
      if (savedPlayer) {
        setPlayer(savedPlayer);
        setRoomId(gameSetup.roomId);
        socket.emit("sync-request", { roomId: gameSetup.roomId });
      }
    }
  }, [socket, gameSetup]);

  // Add validation function
  const validatePlayer = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!player.letter.trim()) {
      errors.push({ field: "letter", message: "Player letter is required" });
    }

    if (!player.color) {
      errors.push({ field: "color", message: "Player color is required" });
    }

    const duplicateLetter = players.some(
      (p) =>
        p.id !== player.id &&
        p.letter.trim().toUpperCase() === player.letter.trim().toUpperCase()
    );

    if (duplicateLetter) {
      errors.push({ field: "letter", message: "This letter is already taken" });
    }

    return errors;
  };

  useEffect(() => {
    if (!socket) return;

    // Player updates handler
    socket.on("player-updated", (updatedPlayers: Player[]) => {
      console.log("Players updated:", updatedPlayers);
      setPlayers(updatedPlayers);

      // Check if you're still in the game
      const yourPlayer = updatedPlayers.find((p) => p.id === clientId);
      if (yourPlayer) {
        setPlayer(yourPlayer);
        setIsOwner(!!yourPlayer.isOwner);
      }

      setGameSetup((prev) => ({
        ...prev,
        players: updatedPlayers,
      }));
    });

    // Player left handler
    socket.on(
      "player-left",
      ({
        playerId,
        players: updatedPlayers,
      }: {
        playerId: string;
        players: Player[];
      }) => {
        console.log("Player left:", { playerId, updatedPlayers });

        if (playerId === clientId) {
          // If you're the one who left
          setRoomId("");
          setPlayers([]);
          setGameSetup((prev) => ({
            ...prev,
            players: [],
            roomId: "",
            isGameStarted: false,
          }));
        } else {
          // If another player left
          setPlayers(updatedPlayers);

          // Check if you became the owner
          const yourPlayer = updatedPlayers.find((p) => p.id === clientId);
          if (yourPlayer) {
            setPlayer(yourPlayer);
            setIsOwner(!!yourPlayer.isOwner);
          }

          setGameSetup((prev) => ({
            ...prev,
            players: updatedPlayers,
          }));
        }
      }
    );

    // Game started handler
    socket.on("game-started", (gamePlayers: Player[]) => {
      // Update persisted state before starting game
      setGameSetup((prev) => ({
        ...prev,
        players: gamePlayers,
        roomId: roomId,
        isGameStarted: true,
      }));
      onJoinGame(gamePlayers, roomId);
    });

    return () => {
      socket.off("player-updated");
      socket.off("player-left");
      socket.off("game-started");
    };
  }, [socket, clientId, onJoinGame, roomId]);

  const createGame = () => {
    if (!socket) return;

    const validationErrors = validatePlayer();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsJoining(true);
    // First create room
    socket.emit("create-room", ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setIsOwner(true);

      // Then join the created room
      const newPlayer = { ...player, id: clientId, isOwner: true };
      setPlayer(newPlayer);
      socket.emit(
        "join-room",
        { roomId, player: newPlayer },
        (response: any) => {
          setIsJoining(false);
          if (response.success) {
            setPlayers([newPlayer]);
            setGameSetup((prev) => ({
              ...prev,
              players: [newPlayer],
              roomId: roomId,
            }));
            setErrors([]);
          } else {
            setErrors([
              {
                field: "general",
                message: response.message || "Failed to create game",
              },
            ]);
          }
        }
      );
    });
  };

  const joinGame = () => {
    if (!socket) return;

    if (!joinCode.trim()) {
      setErrors([{ field: "roomCode", message: "Room code is required" }]);
      return;
    }

    const validationErrors = validatePlayer();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsJoining(true);
    const newPlayer = { ...player, id: clientId };
    setPlayer(newPlayer);

    socket.emit(
      "join-room",
      { roomId: joinCode.toUpperCase(), player: newPlayer },
      (response: any) => {
        setIsJoining(false);
        if (response.success) {
          const newRoomId = joinCode.toUpperCase();
          setRoomId(newRoomId);
          setGameSetup((prev) => ({
            ...prev,
            roomId: newRoomId,
          }));
          setErrors([]);
        } else {
          setErrors([
            {
              field: "general",
              message: response.message || "Failed to join game",
            },
          ]);
        }
      }
    );
  };

  const leaveGame = () => {
    if (socket && roomId) {
      console.log("Leaving game...", { roomId, clientId });
      socket.emit(
        "leave-room",
        { roomId, playerId: clientId },
        (response: any) => {
          // Add callback to confirm event was received
          console.log("Leave room response:", response);
          setRoomId("");
          setPlayers([]);
          setGameSetup((prev) => ({
            ...prev,
            players: [],
            roomId: "",
            isGameStarted: false,
          }));
        }
      );
    }
  };

  const updatePlayerInfo = (key: keyof Player, value: string) => {
    const updatedPlayer = { ...player, [key]: value };
    setPlayer(updatedPlayer);

    if (socket && roomId) {
      socket.emit("update-player", { roomId, player: updatedPlayer });
      setGameSetup((prev) => ({
        ...prev,
        players: players.map((p) =>
          p.id === updatedPlayer.id ? updatedPlayer : p
        ),
      }));
    }
  };

  const startGame = () => {
    if (!socket || !roomId || !isOwner) return;

    const incompletePlayer = players.find((p) => !p.letter || !p.color);
    if (incompletePlayer) {
      setErrors([
        {
          field: "general",
          message:
            "All players must choose their letter and color before starting",
        },
      ]);
      return;
    }

    if (players.length < 2) {
      setErrors([
        {
          field: "general",
          message: "At least 2 players are required to start",
        },
      ]);
      return;
    }
    // Check for duplicate letters
    const letters = players.map((p) => p.letter.toUpperCase().trim());
    const hasDuplicates = new Set(letters).size !== letters.length;
    if (hasDuplicates) {
      setErrors([
        {
          field: "general",
          message: "Each player must have a unique letter",
        },
      ]);
      return;
    }

    socket.emit("start-game", roomId);
    setGameSetup((prev) => ({
      ...prev,
      isGameStarted: true,
    }));
  };

  const getAvailableColors = () => {
    const usedColors = players.map((p) => p.color);
    return PLAYER_COLORS.filter(
      (color) => color === player.color || !usedColors.includes(color)
    );
  };

  return (
    <div className="p-4 min-h-screen bg-background flex items-center justify-start">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Online Game</h1>
        {/* Player Setup */}
        <div className="mb-6">
          <div className="bg-gray-900 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-white font-medium min-w-[100px]">
              Your Player Info
            </span>

            <input
              type="text"
              maxLength={1}
              placeholder="First Letter"
              value={player.letter}
              onChange={(e) =>
                updatePlayerInfo("letter", e.target.value.toUpperCase())
              }
              className="flex-1 sm:w-24"
            />
            <select
              value={player.color}
              onChange={(e) => updatePlayerInfo("color", e.target.value)}
              className="flex-1 sm:w-40"
            >
              <option value="">Select Color</option>
              {getAvailableColors().map((color) => (
                <option key={color} value={color}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            {errors.map((error, i) => (
              <p key={i} className="text-red-400">
                {error.message}
              </p>
            ))}
          </div>
        )}
        {!roomId ? (
          <div className="space-y-4">
            <button
              onClick={createGame}
              disabled={isJoining}
              className="bg-blue-500 sm:w-auto"
            >
              {isJoining ? "Creating Game..." : "Create New Game"}
            </button>
            <h2 className="text-xl mb-4 max-sm:text-center">OR</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 sm:flex-none sm:w-48"
              />
              <button
                onClick={joinGame}
                disabled={isJoining}
                className="bg-green-500 sm:w-auto"
              >
                {isJoining ? "Joining..." : "Join Game"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl mb-4">Room Code: {roomId}</h2>
            <div className="mb-4">
              <h3 className="text-lg font-medium">Players in Lobby:</h3>
              <ul>
                {players.map((p, index) => (
                  <li key={p.id}>
                    Player {index + 1}:{" "}
                    <span style={{ color: p.color }} className="ml-4 font-bold">
                      {p.letter}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {isOwner && players.length >= 2 ? (
              <button onClick={startGame} className="bg-green-500">
                Start Game
              </button>
            ) : players.length < 2 ? (
              <p>Waiting for other players to join the game...</p>
            ) : (
              <p>Waiting for the host to start the game...</p>
            )}
          </div>
        )}
        {roomId && (
          <div>
            <button
              onClick={leaveGame}
              className="bg-red-500/20 hover:bg-red-500/40 transition-colors px-4 py-2 rounded-lg text-white mt-4"
            >
              Leave Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
