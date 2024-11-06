"use client";

import { useState } from "react";
import { Player } from "../types/game";

const colors = ["red", "green", "blue", "yellow", "cyan", "magenta"];

interface PlayerSetupProps {
  onStartGame: (players: Player[]) => void;
}

const PlayerSetup = ({ onStartGame }: PlayerSetupProps) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: "", color: "", letter: "" },
  ]);

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([
        ...players,
        { id: players.length, name: "", color: "", letter: "" },
      ]);
    }
  };

  const updatePlayer = (index: number, key: string, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [key]: value };
    setPlayers(newPlayers);
  };

  const startGame = () => {
    const letters = players.map((p) => p.letter.toUpperCase());
    const uniqueLetters = new Set(letters);
    const colorsSelected = players.map((p) => p.color);
    const uniqueColors = new Set(colorsSelected);

    if (
      uniqueLetters.size !== letters.length ||
      uniqueColors.size !== colorsSelected.length
    ) {
      alert("Player letters and colors must be unique.");
      return;
    }

    onStartGame(players.map((p, index) => ({ ...p, id: index })));
  };

  return (
    <div className="p-4">
      {players.map((player, index) => {
        const colorOptions = colors.filter(
          (c) => !players.some((p) => p.color === c) || player.color === c
        );
        return (
          <div key={index} className="mb-4">
            <h2 className="text-lg font-bold">Player {index + 1}</h2>
            <input
              type="text"
              placeholder="First Letter"
              maxLength={1}
              value={player.letter}
              onChange={(e) =>
                updatePlayer(index, "letter", e.target.value.toUpperCase())
              }
              className="border p-2 mr-2 text-black w-[6rem]"
            />
            <select
              value={player.color}
              onChange={(e) => updatePlayer(index, "color", e.target.value)}
              className="border p-2 text-black"
            >
              <option value="">Select Color</option>
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <button
        onClick={addPlayer}
        className="bg-blue-500 text-white px-4 py-2 mr-2"
      >
        Add Player
      </button>
      <button onClick={startGame} className="bg-green-500 text-white px-4 py-2">
        Start Game
      </button>
    </div>
  );
};

export default PlayerSetup;
