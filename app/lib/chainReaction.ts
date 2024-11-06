import { Cell, Explosion, GameState } from "../types/game";

export interface ExplosionStep {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  owner: number;
  color: string;
}

export interface ChainReactionState {
  board: Cell[][];
  explosionQueue: ExplosionStep[];
}

export const getCellCapacity = (x: number, y: number) => {
  let capacity = 4;
  if (x === 0 || x === 7) capacity -= 1;
  if (y === 0 || y === 15) capacity -= 1;
  return capacity;
};

export const getNeighbors = (x: number, y: number) => {
  const neighbors = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < 7) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < 15) neighbors.push({ x, y: y + 1 });
  return neighbors;
};

export const prepareChainReaction = (
  board: Cell[][],
  startX: number,
  startY: number,
  players: GameState["players"]
): ChainReactionState => {
  const newBoard = JSON.parse(JSON.stringify(board));
  const explosionQueue: ExplosionStep[] = [];
  const processedCells = new Set<string>();
  const cellsToCheck = [{ x: startX, y: startY }];

  while (cellsToCheck.length > 0) {
    const { x, y } = cellsToCheck.shift()!;
    const cellKey = `${x},${y}`;

    if (processedCells.has(cellKey)) continue;
    processedCells.add(cellKey);

    const cell = newBoard[y][x];
    const capacity = getCellCapacity(x, y);

    if (cell.orbs >= capacity && cell.owner !== null) {
      const ownerColor = players[cell.owner].color;

      // Add explosions to queue for each neighbor
      getNeighbors(x, y).forEach(({ x: nx, y: ny }) => {
        explosionQueue.push({
          fromX: x,
          fromY: y,
          toX: nx,
          toY: ny,
          owner: cell.owner!,
          color: ownerColor,
        });
      });

      // Add neighbors to check queue
      getNeighbors(x, y).forEach(({ x: nx, y: ny }) => {
        cellsToCheck.push({ x: nx, y: ny });
      });
    }
  }

  return {
    board: newBoard,
    explosionQueue,
  };
};

export const processNextExplosion = (
  board: Cell[][],
  explosion: ExplosionStep
): Cell[][] => {
  const newBoard = JSON.parse(JSON.stringify(board));
  const { fromX, fromY, toX, toY, owner } = explosion;

  // Remove orb from source cell
  const sourceCapacity = getCellCapacity(fromX, fromY);
  newBoard[fromY][fromX] = {
    orbs: newBoard[fromY][fromX].orbs - 1,
    owner: newBoard[fromY][fromX].orbs > 1 ? owner : null,
  };

  // Add orb to target cell
  newBoard[toY][toX] = {
    orbs: newBoard[toY][toX].orbs + 1,
    owner,
  };

  return newBoard;
};
