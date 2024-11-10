// app/atoms/gameSetup.ts
import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";
import { GameSetup, Player } from "../types/game";

const { persistAtom } = recoilPersist();

export const gameSetupAtom = atom<GameSetup>({
  key: "gameSetupAtom",
  default: {
    mode: null,
    players: [],
    roomId: undefined,
    isGameStarted: false,
  },
  effects_UNSTABLE: [persistAtom],
});
