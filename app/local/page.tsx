// app/local/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PlayerSetup from "@/app/components/PlayerSetup";
import GameBoard from "@/app/components/GameBoard";
import { useRecoilState, useSetRecoilState } from "recoil";
import { gameSetupAtom } from "@/app/atoms/gameSetup";
import { gameStateAtom } from "@/app/atoms/gameState";
import { Player } from "@/app/types/game";

export default function LocalGame() {
  const router = useRouter();
  const [gameSetup, setGameSetup] = useRecoilState(gameSetupAtom);
  const setGameState = useSetRecoilState(gameStateAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize or restore local game mode
    setGameSetup((prev) => ({
      ...prev,
      mode: "local",
      roomId: "",
    }));
  }, []);

  if (!mounted) return null;

  const handleStartGame = (players: Player[]) => {
    setGameSetup((prev) => ({
      ...prev,
      players,
      mode: "local",
    }));
  };

  const handleResetGame = () => {
    setGameSetup({
      mode: "local",
      players: [],
      roomId: "",
      isGameStarted: false,
    });
    setGameState({
      moving: false,
      players: [],
      currentPlayerIndex: 0,
      board: [],
      isGameOver: false,
    });
  };

  // Show game board if players are set up
  if (gameSetup.players.length > 0) {
    return (
      <div className="relative flex flex-col justify-between items-center h-[100vh]">
        <GameBoard initialPlayers={gameSetup.players} isOnline={false} />
        <button
          onClick={handleResetGame}
          className=" bg-red-500 text-white w-48 my-2"
        >
          New Game
        </button>
      </div>
    );
  }

  // Show player setup otherwise
  return <PlayerSetup onStartGame={handleStartGame} />;
}
