"use client";

import { useState } from "react";
import PlayerSetup from "./components/PlayerSetup";
import GameBoard from "./components/GameBoard";
import { OnlineGame } from "./components/OnlineGame";
import { Player } from "./types/game";

type GameMode = "local" | "online" | null;

export default function Home() {
  const [mode, setMode] = useState<GameMode>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  if (!mode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="space-y-4">
          <button
            onClick={() => setMode("local")}
            className="block w-48 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Local Game
          </button>
          <button
            onClick={() => setMode("online")}
            className="block w-48 bg-green-500 text-white px-4 py-2 rounded"
          >
            Online Game
          </button>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return mode === "local" ? (
      <PlayerSetup onStartGame={setPlayers} />
    ) : (
      <OnlineGame onJoinGame={setPlayers} />
    );
  }

  return <GameBoard initialPlayers={players} isOnline={mode === "online"} />;
}
