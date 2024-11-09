import { BOARD_COLUMNS, BOARD_ROWS } from "../constants/board";
import { Cell, ExplosionEvent, OrbPosition, Player } from "../types/game";

export const getCellCapacity = (x: number, y: number) => {
  let capacity = 4;
  if (x === 0 || x === BOARD_COLUMNS - 1) capacity -= 1;
  if (y === 0 || y === BOARD_ROWS - 1) capacity -= 1;
  return capacity;
};

export const getNeighbors = (x: number, y: number) => {
  const neighbors = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < BOARD_COLUMNS - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < BOARD_ROWS - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
};

export const getRemainingPlayers = (
  board: Cell[][],
  players: Player[]
): Player[] => {
  const activePlayers: { [key: string]: boolean } = {};

  // Initialize all players as inactive
  players.forEach((player) => (activePlayers[player.id] = false));

  // Mark players as active if they own any cells
  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.orbs > 0 && cell.owner !== null) {
        activePlayers[cell.owner] = true;
      }
    });
  });

  // Return the list of active players
  return players.filter((player) => activePlayers[player.id]);
};

export const isGameOver = (board: Cell[][]) => {
  let existingOwner: string | null = null;

  for (const row of board) {
    for (const cell of row) {
      if (cell.owner && !existingOwner) {
        existingOwner = cell.owner;
        continue;
      }
      if (cell.owner && cell.owner !== existingOwner) {
        return false;
      }
    }
  }

  return true;
};

export const createInitialBoard = (): Cell[][] => {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLUMNS }, () => ({ orbs: 0, owner: null }))
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
  const maxIterations = BOARD_ROWS * BOARD_COLUMNS * 2;

  // Deep copy the board for calculations
  const workingBoard: Cell[][] = JSON.parse(JSON.stringify(board));

  while (cellsToProcess.length > 0) {
    if (processedExplosions.size >= maxIterations) {
      console.warn(
        "Maximum explosion chain limit reached, stopping propagation"
      );
      break;
    }
    const { x, y } = cellsToProcess.shift()!;
    const cellKey = `${x},${y}`;

    if (processedExplosions.has(cellKey)) continue;

    const cell = workingBoard[y][x];
    const capacity = getCellCapacity(x, y);

    // Check if this cell should explode
    if (cell.orbs >= capacity && cell.owner !== null) {
      processedExplosions.add(cellKey);
      const neighbors = getNeighbors(x, y);
      const ownerColor = players.find((p) => p.id === cell.owner)?.color || "";

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

  if (isGameOver(board)) {
    return sequence;
  }

  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!isWithInCapacity(board, x, y)) {
        sequence.push(...collectExplosionSequence(board, x, y, players));
      }
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
