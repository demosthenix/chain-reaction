"use client";

import { useState, useRef } from "react";
import {
  Cell,
  Player,
  Explosion,
  GameState,
  ExplosionEvent,
  GroupedExplosion,
} from "../types/game";
import { GameCell } from "./GameCell";
import { ExplosionEffect } from "./ExplosionEffect";
import {
  getCellCapacity,
  getNeighbors,
  getRemainingPlayers,
  createInitialBoard,
  collectExplosionSequence,
  simulateExplosionStep,
  isWithInCapacity,
} from "../lib/gameLogic";

interface GameBoardProps {
  initialPlayers: Player[];
}

export default function GameBoard({ initialPlayers }: GameBoardProps) {
  const [gameState, setGameState] = useState({
    players: initialPlayers,
    currentPlayerIndex: 0,
    board: createInitialBoard(),
    isGameOver: false,
    moving: false,
  });
  const [intermediateBoard, setIntermediateBoard] = useState<Cell[][]>(
    createInitialBoard()
  );
  const [explosions, setExplosions] = useState<GroupedExplosion[]>([]);
  const explosionCount = useRef(0);

  const groupExplosions = (sequence: ExplosionEvent[]): GroupedExplosion[] => {
    const grouped = new Map<string, GroupedExplosion>();

    sequence.forEach((explosion) => {
      const key = `${explosion.fromX},${explosion.fromY}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: `explosion-${explosionCount.current++}`,
          fromX: explosion.fromX,
          fromY: explosion.fromY,
          targets: [],
          color: explosion.color,
        });
      }
      grouped.get(key)!.targets.push({
        toX: explosion.toX,
        toY: explosion.toY,
      });
    });

    return Array.from(grouped.values());
  };

  const animateExplosions = async (
    explosionSequence: ExplosionEvent[],
    finalBoard: Cell[][],
    preMoveBoard: Cell[][]
  ) => {
    const ANIMATION_DURATION = 100;
    let currentBoard = JSON.parse(JSON.stringify(preMoveBoard));

    // Add the initial orb that triggered the explosion
    const firstEvent = explosionSequence[0];
    currentBoard[firstEvent.fromY][firstEvent.fromX] = {
      orbs: preMoveBoard[firstEvent.fromY][firstEvent.fromX].orbs + 1,
      owner: gameState.players[gameState.currentPlayerIndex].id,
    };

    setIntermediateBoard(currentBoard);

    // Group explosions by source cell
    const groupedExplosions = groupExplosions(explosionSequence);

    for (const groupedExplosion of groupedExplosions) {
      setExplosions([groupedExplosion]);

      // Update all target cells simultaneously
      groupedExplosion.targets.forEach(({ toX, toY }) => {
        currentBoard = simulateExplosionStep(
          currentBoard,
          groupedExplosion.fromX,
          groupedExplosion.fromY,
          toX,
          toY,
          currentBoard[groupedExplosion.fromY][groupedExplosion.fromX].owner
        );
      });
      setIntermediateBoard(currentBoard);

      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      setExplosions([]);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const remainingPlayers = getRemainingPlayers(finalBoard, gameState.players);
    const isGameOver = remainingPlayers.length <= 1;
    setGameState((prev) => ({
      ...prev,
      board: finalBoard,
      currentPlayerIndex: isGameOver
        ? prev.currentPlayerIndex
        : (prev.currentPlayerIndex + 1) % remainingPlayers.length,
      players: remainingPlayers,
      isGameOver,
      moving: false,
    }));
  };

  const handleCellClick = (x: number, y: number) => {
    if (gameState.isGameOver || gameState.moving) return;
    console.log("Cliecked", "x", x, "y", y);

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const cell = gameState.board[y][x];
    const capacity = getCellCapacity(x, y);

    if (cell.owner === null || cell.owner === currentPlayer.id) {
      if (cell.orbs >= capacity) return; // Prevent clicking on full cells

      setGameState((prev) => ({ ...prev, moving: true }));

      const preMoveBoard: Cell[][] = JSON.parse(
        JSON.stringify(gameState.board)
      );
      const finalBoard: Cell[][] = JSON.parse(JSON.stringify(preMoveBoard));

      // Add orb to clicked cell
      finalBoard[y][x] = {
        orbs: Math.min(capacity, finalBoard[y][x].orbs + 1),
        owner: currentPlayer.id,
      };

      let explosionSequence = collectExplosionSequence(
        finalBoard,
        x,
        y,
        gameState.players
      );

      // Final capacity check
      finalBoard.forEach((row, ny) => {
        row.forEach((cell, nx) => {
          if (!isWithInCapacity(finalBoard, nx, ny)) {
            explosionSequence.push(
              ...collectExplosionSequence(finalBoard, nx, ny, gameState.players)
            );
          }
        });
      });

      if (explosionSequence.length > 0) {
        animateExplosions(explosionSequence, finalBoard, preMoveBoard);
      } else {
        setGameState((prev) => ({
          ...prev,
          board: finalBoard,
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
          Game Over! {gameState.players[0].letter} Wins!
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
      <div
        className={`mb-4  text-xl`}
        style={{ color: gameState.players[gameState.currentPlayerIndex].color }}
      >
        Current Player: {gameState.players[gameState.currentPlayerIndex].letter}
      </div>
      <div className="grid grid-cols-8 gap-1 relative">
        {(gameState.moving ? intermediateBoard : gameState.board).map(
          (row, y) =>
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
