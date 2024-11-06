"use client";

import { useState } from "react";
import PlayerSetup from "./components/PlayerSetup";
import GameBoard from "./components/GameBoard";
import { Player } from "./types/game";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);

  return (
    <main className="min-h-screen bg-black">
      {players.length === 0 ? (
        <PlayerSetup onStartGame={setPlayers} />
      ) : (
        <GameBoard initialPlayers={players} />
      )}
    </main>
  );
}
