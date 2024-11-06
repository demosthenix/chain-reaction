// app/atoms/gameState.ts
import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";
import { GameState } from "@/app/types/game";

const { persistAtom } = recoilPersist();

export const gameState = atom<GameState>({
  key: "gameState",
  default: {
    players: [],
    currentPlayerIndex: 0,
    board: [],
    isGameOver: false,
  },
  effects_UNSTABLE: [persistAtom],
});
