"use client";

import { useState, useRef, useEffect } from "react";
import {
  Cell,
  Player,
  Explosion,
  GameState,
  ExplosionEvent,
  GameMove,
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
import { useSocket } from "../hooks/useSocket";

interface GameBoardProps {
  initialPlayers: Player[];
  isOnline?: boolean;
}

export default function GameBoard({
  initialPlayers,
  isOnline,
}: GameBoardProps) {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState<string>("");
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
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const explosionCount = useRef(0);

  useEffect(() => {
    if (isOnline && socket) {
      // Get room ID from URL or storage
      const currentRoomId =
        new URLSearchParams(window.location.search).get("room") || "";
      setRoomId(currentRoomId);

      socket.on("move-made", (move: GameMove) => {
        handleCellClick(move.x, move.y);
      });

      return () => {
        socket.off("move-made");
      };
    }
  }, [isOnline, socket]);

  useEffect(() => {
    if (gameState.isGameOver && isOnline && socket && roomId) {
      const winner = gameState.players[gameState.currentPlayerIndex];
      socket.emit("game-over", roomId, winner);
    }
  }, [gameState.isGameOver, isOnline, socket, roomId]);

  const animateExplosions = async (
    explosionSequence: ExplosionEvent[],
    finalBoard: Cell[][],
    preMoveBoard: Cell[][]
  ) => {
    const ANIMATION_DURATION = 200;

    // Start with pre-move board plus the initial click
    let currentBoard = JSON.parse(JSON.stringify(preMoveBoard));

    // Add the initial orb that triggered the explosion
    const firstEvent = explosionSequence[0];
    currentBoard[firstEvent.fromY][firstEvent.fromX] = {
      orbs: preMoveBoard[firstEvent.fromY][firstEvent.fromX].orbs + 1,
      owner: gameState.players[gameState.currentPlayerIndex].id,
    };

    setIntermediateBoard(currentBoard);

    // Process explosions one source cell at a time
    let i = 0;
    while (i < explosionSequence.length) {
      // Find all explosions from the same source cell
      const currentSource = `${explosionSequence[i].fromX},${explosionSequence[i].fromY}`;
      const simultaneousExplosions: Explosion[] = [];

      // Collect all explosions from the same source
      while (
        i < explosionSequence.length &&
        `${explosionSequence[i].fromX},${explosionSequence[i].fromY}` ===
          currentSource
      ) {
        simultaneousExplosions.push({
          id: `explosion-${explosionCount.current++}`,
          fromX: explosionSequence[i].fromX,
          fromY: explosionSequence[i].fromY,
          toX: explosionSequence[i].toX,
          toY: explosionSequence[i].toY,
          color: explosionSequence[i].color,
        });
        i++;
      }

      // Show all explosions from this source simultaneously
      setExplosions(simultaneousExplosions);

      // But process state updates one by one to maintain game logic
      for (const explosion of simultaneousExplosions) {
        currentBoard = simulateExplosionStep(
          currentBoard,
          explosion.fromX,
          explosion.fromY,
          explosion.toX,
          explosion.toY,
          currentBoard[explosion.fromY][explosion.fromX].owner
        );
      }
      setIntermediateBoard(currentBoard);

      // Wait for animations to complete
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      setExplosions([]);
    }

    // Final state update
    await new Promise((resolve) => setTimeout(resolve, 50));

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
      if (cell.orbs >= capacity) return;

      // In online mode, emit the move
      if (isOnline && socket) {
        socket.emit("make-move", roomId, { x, y, playerId: currentPlayer.id });
      }

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
        className="mb-4 text-xl"
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
        {/* Multiple explosions can now render simultaneously from the same source */}
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
