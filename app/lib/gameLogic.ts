import { Cell, ExplosionEvent, OrbPosition, Player } from "../types/game";

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

export const isWithInCapacity = (board: Cell[][], x: number, y: number) => {
  const cell = board[y][x];
  return cell.orbs < getCellCapacity(x, y);
};

export const collectExplosionSequence = (
  board: Cell[][],
  startX: number,
  startY: number,
  players: Player[]
): ExplosionEvent[] => {
  const sequence: ExplosionEvent[] = [];
  const processedExplosions = new Set<string>();
  const cellsToProcess = [{ x: startX, y: startY }];

  // Deep copy the board for calculations
  const workingBoard = JSON.parse(JSON.stringify(board));

  while (cellsToProcess.length > 0) {
    const { x, y } = cellsToProcess.shift()!;
    const cellKey = `${x},${y}`;

    if (processedExplosions.has(cellKey)) continue;

    const cell = workingBoard[y][x];
    const capacity = getCellCapacity(x, y);

    // Check if this cell should explode
    if (cell.orbs >= capacity && cell.owner !== null) {
      processedExplosions.add(cellKey);
      const neighbors = getNeighbors(x, y);
      const ownerColor = players[cell.owner].color;

      // Reset the exploding cell
      workingBoard[y][x] = {
        orbs: 0,
        owner: null,
      };

      // Distribute orbs to neighbors
      neighbors.forEach(({ x: nx, y: ny }) => {
        sequence.push({
          fromX: x,
          fromY: y,
          toX: nx,
          toY: ny,
          color: ownerColor,
        });

        // Update neighbor's state
        const neighborCell = workingBoard[ny][nx];
        workingBoard[ny][nx] = {
          orbs: neighborCell.orbs + 1,
          owner: cell.owner,
        };

        // If this update causes the neighbor to exceed capacity,
        // add it to processing queue if not already processed
        if (
          workingBoard[ny][nx].orbs >= getCellCapacity(nx, ny) &&
          !processedExplosions.has(`${nx},${ny}`)
        ) {
          cellsToProcess.push({ x: nx, y: ny });
        }
      });
    }
  }

  // Copy final state back to original board
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      cell.orbs = workingBoard[y][x].orbs;
      cell.owner = workingBoard[y][x].owner;
    });
  });

  return sequence;
};

// Update simulateExplosionStep to ensure capacity is never exceeded
export const simulateExplosionStep = (
  board: Cell[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  owner: number | null
): Cell[][] => {
  const newBoard = JSON.parse(JSON.stringify(board));

  // Get capacities
  const sourceCapacity = getCellCapacity(fromX, fromY);
  const targetCapacity = getCellCapacity(toX, toY);

  // Update source cell
  newBoard[fromY][fromX] = {
    orbs: Math.min(
      sourceCapacity,
      Math.max(0, newBoard[fromY][fromX].orbs - 1)
    ),
    owner: newBoard[fromY][fromX].orbs > 1 ? owner : null,
  };

  // Update target cell
  newBoard[toY][toX] = {
    orbs: Math.min(targetCapacity, newBoard[toY][toX].orbs + 1),
    owner,
  };

  return newBoard;
};
