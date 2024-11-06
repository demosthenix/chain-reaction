"use client";

import { useState, useRef } from "react";
import { Cell, Player, Explosion, GameState } from "../types/game";
import { GameCell } from "./GameCell";
import { ExplosionEffect } from "./ExplosionEffect";
import {
  getCellCapacity,
  getNeighbors,
  checkGameOver,
  createInitialBoard,
} from "../lib/gameLogic";

interface GameBoardProps {
  initialPlayers: Player[];
}
interface ExplosionEvent {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

export default function GameBoard({ initialPlayers }: GameBoardProps) {
  const [gameState, setGameState] = useState({
    players: initialPlayers,
    currentPlayerIndex: 0,
    board: createInitialBoard(),
    isGameOver: false,
    moving: false,
  });

  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const explosionCount = useRef(0);

  const collectExplosionSequence = (
    board: Cell[][],
    startX: number,
    startY: number
  ): ExplosionEvent[] => {
    const sequence: ExplosionEvent[] = [];
    const processedCells = new Set<string>();
    const cellsToProcess = [{ x: startX, y: startY }];

    while (cellsToProcess.length > 0) {
      const { x, y } = cellsToProcess.shift()!;
      const cellKey = `${x},${y}`;

      if (processedCells.has(cellKey)) continue;
      processedCells.add(cellKey);

      const cell = board[y][x];
      const capacity = getCellCapacity(x, y);

      if (cell.orbs >= capacity && cell.owner !== null) {
        const neighbors = getNeighbors(x, y);
        const ownerColor = gameState.players[cell.owner].color;

        neighbors.forEach(({ x: nx, y: ny }) => {
          sequence.push({
            fromX: x,
            fromY: y,
            toX: nx,
            toY: ny,
            color: ownerColor,
          });

          // Add neighbor to process if it will explode
          const neighborCell = board[ny][nx];
          if (neighborCell.orbs + 1 >= getCellCapacity(nx, ny)) {
            cellsToProcess.push({ x: nx, y: ny });
          }
        });

        // Update board state for next iterations
        board[y][x] = {
          ...cell,
          orbs: 0,
          owner: null,
        };

        neighbors.forEach(({ x: nx, y: ny }) => {
          board[ny][nx] = {
            orbs: board[ny][nx].orbs + 1,
            owner: cell.owner,
          };
        });
      }
    }

    return sequence;
  };

  const animateExplosions = async (
    explosionSequence: ExplosionEvent[],
    boardCopy: Cell[][]
  ) => {
    const ANIMATION_DURATION = 300; // Increased from 200 to ensure animations complete

    for (const event of explosionSequence) {
      // Create explosion animation
      setExplosions([
        {
          id: `explosion-${explosionCount.current++}`,
          fromX: event.fromX,
          fromY: event.fromY,
          toX: event.toX,
          toY: event.toY,
          color: event.color,
        },
      ]);

      // Wait for the complete animation cycle
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

      // Clear explosion after animation completes
      setExplosions([]);
    }

    // Add a small delay before final state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    const isGameOver = checkGameOver(boardCopy);
    setGameState((prev) => ({
      ...prev,
      board: boardCopy,
      currentPlayerIndex: isGameOver
        ? prev.currentPlayerIndex
        : (prev.currentPlayerIndex + 1) % prev.players.length,
      isGameOver,
      moving: false,
    }));
  };

  const handleCellClick = (x: number, y: number) => {
    if (gameState.isGameOver || gameState.moving) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const cell = gameState.board[y][x];

    if (cell.owner === null || cell.owner === currentPlayer.id) {
      setGameState((prev) => ({ ...prev, moving: true }));

      // Create a deep copy of the board for calculations
      const boardCopy = JSON.parse(JSON.stringify(gameState.board));

      // Add orb to clicked cell
      boardCopy[y][x] = {
        orbs: boardCopy[y][x].orbs + 1,
        owner: currentPlayer.id,
      };

      // Collect all explosion events that will occur
      const explosionSequence = collectExplosionSequence(boardCopy, x, y);

      // If there are explosions, animate them
      if (explosionSequence.length > 0) {
        animateExplosions(explosionSequence, boardCopy);
      } else {
        // If no explosions, just update state normally
        setGameState((prev) => ({
          ...prev,
          board: boardCopy,
          currentPlayerIndex:
            (prev.currentPlayerIndex + 1) % prev.players.length,
          moving: false,
        }));
      }
    }
  };

  const [explodingCells, setExplodingCells] = useState<Set<string>>(new Set());
  const [receivingCells, setReceivingCells] = useState<Set<string>>(new Set());

  const handleAnimationStart = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    setExplodingCells((prev) => new Set(prev).add(`${fromX},${fromY}`));
    setReceivingCells((prev) => new Set(prev).add(`${toX},${toY}`));
  };

  const handleAnimationEnd = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    setExplodingCells((prev) => {
      const next = new Set(prev);
      next.delete(`${fromX},${fromY}`);
      return next;
    });
    setReceivingCells((prev) => {
      const next = new Set(prev);
      next.delete(`${toX},${toY}`);
      return next;
    });
  };

  if (gameState.isGameOver) {
    return (
      <div className="text-center">
        <h1 className="text-3xl mb-4 text-white">
          Game Over! {gameState.players[gameState.currentPlayerIndex].letter}{" "}
          Wins!
        </h1>
        <button
          onClick={() => {
            setGameState({
              players: initialPlayers,
              currentPlayerIndex: 0,
              board: createInitialBoard(),
              isGameOver: false,
              moving: false,
            });
          }}
          className="bg-blue-500 text-white px-4 py-2 mt-4"
        >
          Restart Game
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-black p-4">
      <div className="mb-4 text-white text-xl">
        Current Player: {gameState.players[gameState.currentPlayerIndex].letter}
      </div>
      <div className="grid grid-cols-8 gap-1 relative">
        {gameState.board.map((row, y) =>
          row.map((cell, x) => (
            <GameCell
              key={`${x}-${y}`}
              cell={cell}
              x={x}
              y={y}
              currentPlayer={gameState.players[gameState.currentPlayerIndex]}
              players={gameState.players}
              onClick={() => handleCellClick(x, y)}
              isExploding={explodingCells.has(`${x},${y}`)}
              isReceiving={receivingCells.has(`${x},${y}`)}
            />
          ))
        )}
        {explosions.map((explosion) => (
          <ExplosionEffect
            key={explosion.id}
            explosion={explosion}
            onAnimationStart={handleAnimationStart}
            onAnimationEnd={handleAnimationEnd}
          />
        ))}
      </div>
    </div>
  );
}
