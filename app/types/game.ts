// app/types/game.ts
export interface Player {
  id: number;
  name: string;
  color: string;
  letter: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: Cell[][];
  isGameOver: boolean;
}

export interface Cell {
  orbs: number;
  owner: number | null; // Player ID
}
