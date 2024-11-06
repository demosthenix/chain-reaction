import { Cell, OrbPosition } from "../types/game";

export const GRID_COLS = 8;
export const GRID_ROWS = 16;

export const getCellCapacity = (x: number, y: number) => {
  let capacity = 4;
  if (x === 0 || x === GRID_COLS - 1) capacity -= 1;
  if (y === 0 || y === GRID_ROWS - 1) capacity -= 1;
  return capacity;
};

export const getNeighbors = (x: number, y: number) => {
  const neighbors = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < GRID_COLS - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < GRID_ROWS - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
};

export const checkGameOver = (board: Cell[][]) => {
  let totalOrbs = 0;
  const playerOrbs = new Map<number, number>();

  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.orbs > 0) {
        totalOrbs += cell.orbs;
        if (cell.owner !== null) {
          playerOrbs.set(
            cell.owner,
            (playerOrbs.get(cell.owner) || 0) + cell.orbs
          );
        }
      }
    });
  });

  if (totalOrbs === 0 || playerOrbs.size <= 1) return false;
  return playerOrbs.size === 1;
};

export const createInitialBoard = (): Cell[][] => {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ orbs: 0, owner: null }))
  );
};

export const getOrbPositions = (count: number): OrbPosition[] => {
  switch (count) {
    case 1:
      return [{ top: "50%", left: "50%" }];
    case 2:
      return [
        { top: "50%", left: "35%" },
        { top: "50%", left: "65%" },
      ];
    case 3:
      return [
        { top: "35%", left: "50%" },
        { top: "65%", left: "35%" },
        { top: "65%", left: "65%" },
      ];
    case 4:
      return [
        { top: "35%", left: "35%" },
        { top: "35%", left: "65%" },
        { top: "65%", left: "35%" },
        { top: "65%", left: "65%" },
      ];
    default:
      return [];
  }
};
