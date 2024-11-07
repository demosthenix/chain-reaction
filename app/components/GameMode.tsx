import { useState } from "react";

interface GameModeProps {
  onSelectMode: (mode: "local" | "online") => void;
}

export function GameMode({ onSelectMode }: GameModeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl mb-8">Chain Reaction</h1>
      <div className="space-y-4">
        <button
          onClick={() => onSelectMode("local")}
          className="block w-48 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
        >
          Local Multiplayer
        </button>
        <button
          onClick={() => onSelectMode("online")}
          className="block w-48 px-4 py-2 bg-green-500 rounded hover:bg-green-600"
        >
          Online Multiplayer
        </button>
      </div>
    </div>
  );
}
