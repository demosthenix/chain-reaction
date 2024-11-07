export interface Player {
  id: number;
  name: string;
  color: string;
  letter: string;
}

export interface Cell {
  orbs: number;
  owner: number | null;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: Cell[][];
  isGameOver: boolean;
  moving: boolean;
}

export interface Explosion {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

export interface OrbPosition {
  top: string;
  left: string;
}

export interface ExplosionEvent {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

export interface GroupedExplosion {
  id: string;
  fromX: number;
  fromY: number;
  targets: { toX: number; toY: number }[];
  color: string;
}
