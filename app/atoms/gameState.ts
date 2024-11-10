// app/atoms/gameState.ts
import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";
import { GameState } from "@/app/types/game";

const { persistAtom } = recoilPersist();

export const gameStateAtom = atom<GameState>({
  key: "gameStateAtom",
  default: {
    moving: false,
    players: [],
    currentPlayerIndex: 0,
    board: [],
    isGameOver: false,
  },
  effects_UNSTABLE: [persistAtom],
});
