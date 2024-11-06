// app/page.tsx
"use client";

import { RecoilRoot, useRecoilValue } from "recoil";
import PlayerSetup from "./components/PlayerSetup";
import { gameState } from "./atoms/gameState";
import GameBoard from "./components/GameBoard";
import { Suspense } from "react";

export default function Home() {
  return (
    <RecoilRoot>
      <Suspense>
        <GameClient />
      </Suspense>
    </RecoilRoot>
  );
}

const GameClient = () => {
  const game = useRecoilValue(gameState);

  return (
    <>
      {game.players.length === 0 || game.isGameOver ? (
        <PlayerSetup />
      ) : (
        <GameBoard />
      )}
    </>
  );
};
