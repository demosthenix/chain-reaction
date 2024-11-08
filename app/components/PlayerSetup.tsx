"use client";

import { useState } from "react";
import { Player, ValidationError } from "../types/game";
import { PLAYER_COLORS } from "../constants/colors";

const colors = ["red", "green", "blue", "yellow", "cyan", "magenta"];

interface PlayerSetupProps {
  onStartGame: (players: Player[]) => void;
}

const PlayerSetup = ({ onStartGame }: PlayerSetupProps) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: "0", name: "", color: "", letter: "" },
    { id: "1", name: "", color: "", letter: "" },
  ]);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const getAvailableColors = (currentPlayerIndex: number) => {
    const usedColors = players
      .filter((_, index) => index !== currentPlayerIndex)
      .map((p) => p.color);
    return PLAYER_COLORS.filter((color) => !usedColors.includes(color));
  };

  const validatePlayers = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check for minimum players
    if (players.length < 2) {
      errors.push({
        field: "players",
        message: "At least 2 players are required",
      });
      return errors;
    }

    // Validate each player
    players.forEach((player, index) => {
      // Required fields
      if (!player.letter.trim()) {
        errors.push({
          field: "letter",
          message: `Player ${index + 1} letter is required`,
          playerIndex: index,
        });
      }
      if (!player.color) {
        errors.push({
          field: "color",
          message: `Player ${index + 1} color is required`,
          playerIndex: index,
        });
      }
    });

    // Check for duplicate letters
    const letters = players.map((p) => p.letter.toUpperCase().trim());
    const duplicateLetters = letters.filter(
      (letter, index) => letter && letters.indexOf(letter) !== index
    );

    if (duplicateLetters.length > 0) {
      errors.push({
        field: "letter",
        message: "Each player must have a unique letter",
      });
    }

    return errors;
  };

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
    // Clear errors when user makes changes
    setErrors([]);
  };

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([
        ...players,
        { id: players.length.toString(), name: "", color: "", letter: "" },
      ]);
      setErrors([]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
      setErrors([]);
    }
  };

  const handleStartGame = () => {
    const validationErrors = validatePlayers();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    onStartGame(players.map((p, index) => ({ ...p, id: index.toString() })));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Player Setup</h1>

        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            {errors.map((error, i) => (
              <p key={i} className="text-red-400">
                {error.message}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {players.map((player, index) => (
            <div
              key={index}
              className="bg-gray-900 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <span className="text-white font-medium min-w-[100px]">
                Player {index + 1}
              </span>

              <input
                type="text"
                placeholder="First Letter"
                maxLength={1}
                value={player.letter}
                onChange={(e) =>
                  updatePlayer(index, "letter", e.target.value.toUpperCase())
                }
                className="flex-1 sm:w-24"
              />

              <select
                value={player.color}
                onChange={(e) => updatePlayer(index, "color", e.target.value)}
                className="flex-1 sm:w-40"
              >
                <option value="">Select Color</option>
                {getAvailableColors(index).map((color) => (
                  <option key={color} value={color}>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </option>
                ))}
              </select>

              {players.length > 2 && (
                <button
                  onClick={() => removePlayer(index)}
                  className="mt-2 sm:mt-0 p-2 text-red-400 hover:text-red-300 
                              transition-colors rounded-full hover:bg-red-500/10"
                  aria-label="Remove player"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 
                             00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 
                             1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 
                             10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 
                             7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={addPlayer}
            disabled={players.length >= 6}
            className="sm:w-auto bg-blue-500 transition-colors disabled:cursor-not-allowed"
          >
            Add Player
          </button>

          <button
            onClick={handleStartGame}
            className=" sm:w-auto bg-green-500 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSetup;
