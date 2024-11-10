// app/online/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnlineGame } from "@/app/components/OnlineGame";
import GameBoard from "@/app/components/GameBoard";
import { useRecoilState, useSetRecoilState } from "recoil";
import { gameSetupAtom } from "@/app/atoms/gameSetup";
import { gameStateAtom } from "@/app/atoms/gameState";
import { Player } from "@/app/types/game";

export default function OnlinePage() {
  const router = useRouter();
  const [gameSetup, setGameSetup] = useRecoilState(gameSetupAtom);
  const [gameState, setGameState] = useRecoilState(gameStateAtom);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Initialize or restore online game mode
    setGameSetup((prev) => ({
      ...prev,
      mode: "online",
    }));

    // Clean up game state when leaving the page
    return () => {
      setGameSetup({
        mode: null,
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
  }, []);

  const handleJoinGame = (players: Player[], roomId: string) => {
    setGameSetup((prev) => ({
      ...prev,
      players,
      roomId,
      mode: "online",
      isGameStarted: true,
    }));
  };

  if (!mounted) return null;

  const handleLeaveGame = () => {
    setGameSetup({
      mode: "online",
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

  // Only show game board when game has actually started
  if (
    gameSetup.isGameStarted &&
    gameSetup.players.length > 0 &&
    gameSetup.roomId
  ) {
    return (
      <div className="relative flex flex-col justify-between items-center h-[100vh]">
        <GameBoard
          initialPlayers={gameSetup.players}
          isOnline={true}
          roomId={gameSetup.roomId}
        />
        <button
          onClick={handleLeaveGame}
          className=" bg-red-500 text-white w-48 my-2"
        >
          Leave Game
        </button>
      </div>
    );
  }

  // Show online game setup otherwise
  return <OnlineGame onJoinGame={handleJoinGame} />;
}
