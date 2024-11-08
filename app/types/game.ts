import { Server as NetServer, Socket } from "net";
import { Server as HTTPServer } from "http";
import { NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";

export interface Player {
  id: string;
  name: string;
  color: string;
  letter: string;
}

export interface Cell {
  orbs: number;
  owner: string | null;
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

export interface GameMove {
  x: number;
  y: number;
  playerId: string;
}

export interface OnlineGameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  board: Cell[][];
  isGameOver: boolean;
  moving: boolean;
}

// new change
export type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

export interface Room {
  id: string;
  players: Player[];
  isGameStarted: boolean;
}

export type ValidationError = {
  field: string;
  message: string;
  playerIndex?: number;
};
