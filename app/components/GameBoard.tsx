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
import { useSocket } from "../providers/SocketProvider";
import useSound from "use-sound";
import {
  ANIMATION_DURATION,
  BOARD_COLUMNS,
  BOARD_ROWS,
} from "../constants/board";
import useReconnect from "../hooks/useReconnect";
import { useRecoilState } from "recoil";
import { gameStateAtom } from "../atoms/gameState";

interface GameBoardProps {
  initialPlayers: Player[];
  isOnline?: boolean;
  roomId?: string;
}
export default function GameBoard({
  initialPlayers,
  isOnline,
  roomId,
}: GameBoardProps) {
  const { socket, clientId } = useSocket();
  const [gameState, setGameState] = useRecoilState<GameState>(gameStateAtom);
  const [connectedPlayer, setConnectedPlayer] = useState<Player | null>(null);
  const [intermediateBoard, setIntermediateBoard] = useState<Cell[][]>(
    createInitialBoard()
  );
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const explosionCount = useRef(0);
  const [prevCell, setPrevCell] = useState<[number, number]>([-1, -1]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [playClick] = useSound("/sounds/click.mp3", {
    volume: 0.5,
    disabled: !isSoundEnabled,
  });
  const [playExplosion] = useSound("/sounds/explode.mp3", {
    volume: 0.75,
    disabled: !isSoundEnabled,
  });

  const { isReconnecting } = useReconnect(
    socket,
    !!isOnline,
    setGameState,
    roomId
  );

  // console.log({ isReconnecting });

  useEffect(() => {
    // Initialize game state if it's empty or players don't match
    if (gameState.players.length === 0 || gameState.board.length === 0) {
      setGameState({
        players: initialPlayers,
        currentPlayerIndex: 0,
        board: createInitialBoard(),
        isGameOver: false,
        moving: false,
      });
    }
  }, [initialPlayers]);

  const vibrate = (pattern: number | number[]) => {
    if (Boolean(window.navigator.vibrate)) {
      window.navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    if (isOnline && socket && clientId) {
      // Find the connected player's information
      const player = gameState.players.find((p) => p.id === clientId) || null;
      setConnectedPlayer(player);

      socket.on("move-made", (move: GameMove) => {
        handleCellClick(move.x, move.y, move.playerId, false);
      });

      socket.on("game-ended", (winner: Player) => {
        setGameState((prev) => ({ ...prev, isGameOver: true }));
      });

      return () => {
        socket.off("move-made");
        socket.off("game-ended");
      };
    } else {
      // In local mode, set connected player to null
      setConnectedPlayer(null);
    }
  }, [isOnline, socket, gameState, setGameState, clientId]);

  useEffect(() => {
    if (isOnline && socket) {
      socket.on("sync-game-state", (serverGameState: GameState) => {
        setGameState(serverGameState);
      });

      socket.on(
        "player-disconnected",
        ({ gameState: updatedGameState }: { gameState: GameState }) => {
          setGameState(updatedGameState);
        }
      );

      // Request sync when component mounts
      if (roomId) {
        socket.emit("sync-request", { roomId });
      }

      return () => {
        socket.off("sync-game-state");
        socket.off("player-disconnected");
      };
    }
  }, [isOnline, socket, roomId]);

  useEffect(() => {
    if (gameState.isGameOver && isOnline && socket && roomId) {
      const winner = gameState.players[0];
      socket.emit("game-over", { roomId, winner });
    }
  }, [gameState.isGameOver, isOnline, socket, roomId]);

  const animateExplosions = async (
    explosionSequence: ExplosionEvent[],
    finalBoard: Cell[][],
    preMoveBoard: Cell[][],
    movingPlayerIndex: number
  ) => {
    // Start with pre-move board plus the initial click
    let currentBoard = JSON.parse(JSON.stringify(preMoveBoard));

    // Add the initial orb that triggered the explosion
    const firstEvent = explosionSequence[0];
    currentBoard[firstEvent.fromY][firstEvent.fromX] = {
      orbs: preMoveBoard[firstEvent.fromY][firstEvent.fromX].orbs + 1,
      owner: gameState.players[gameState.currentPlayerIndex]?.id,
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
        playExplosion();
        vibrate([100, 50, 100]);
      }
      await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));
      setIntermediateBoard(currentBoard);

      // Wait for animations to complete
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
        ? movingPlayerIndex
        : (movingPlayerIndex + 1) % prev.players.length,
      players: remainingPlayers,
      isGameOver,
      moving: false,
    }));
  };

  const handleCellClick = (
    x: number,
    y: number,
    playerId?: string,
    emitMove = true
  ) => {
    if (gameState.isGameOver || gameState.moving) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    // Determine the moving player
    const movingPlayerId = playerId || currentPlayer.id;
    // Find the index of the moving player
    const movingPlayerIndex = gameState.players.findIndex(
      (p) => p.id === movingPlayerId
    );
    if (movingPlayerIndex === -1) {
      console.error("Invalid player ID");
      return;
    }
    // Only allow the current player to make a move when initiating the move
    if (emitMove && isOnline && currentPlayer.id !== clientId) return;

    const cell = gameState.board[y][x];
    const capacity = getCellCapacity(x, y);

    if (cell.owner === null || cell.owner === movingPlayerId) {
      if (cell.orbs >= capacity) return;

      playClick();
      vibrate(50);
      // In online mode, emit the move
      if (isOnline && emitMove && socket && roomId) {
        const updatedGameState: GameState = {
          board: gameState.board,
          currentPlayerIndex:
            (movingPlayerIndex + 1) % gameState.players.length,
          players: gameState.players,
          isGameOver: false,
          moving: false,
        };

        socket.emit("make-move", {
          roomId,
          move: { x, y, playerId: movingPlayerId },
          gameState: updatedGameState,
        });
      }

      setGameState((prev) => ({ ...prev, moving: true }));

      const preMoveBoard: Cell[][] = JSON.parse(
        JSON.stringify(gameState.board)
      );
      const finalBoard: Cell[][] = JSON.parse(JSON.stringify(preMoveBoard));

      // Add orb to clicked cell
      finalBoard[y][x] = {
        orbs: Math.min(capacity, finalBoard[y][x].orbs + 1),
        owner: movingPlayerId,
      };

      const explosionSequence = collectExplosionSequence(
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
        animateExplosions(
          explosionSequence,
          finalBoard,
          preMoveBoard,
          movingPlayerIndex
        );
        setPrevCell([-1, -1]);
      } else {
        setPrevCell([x, y]);
        setGameState((prev) => ({
          ...prev,
          board: finalBoard,
          currentPlayerIndex: (movingPlayerIndex + 1) % prev.players.length,
          moving: false,
          isGameOver: false,
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div
          style={{ color: gameState.players[0]?.color }} // Add optional chaining
          className="text-4xl font-bold mb-8 text-center"
        >
          Player {gameState.players[0]?.letter} Wins!
        </div>
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
          className="bg-white/10 w-48"
        >
          Play Again
        </button>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background p-4 rounded-lg text-white">
          <div className="animate-pulse">Reconnecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-background p-1 sm:p-2 md:p-4">
      {/* Header info section */}
      <div className="w-full px-4 flex flex-col items-center">
        <div className="flex flex-row justify-center items-center gap-4 mt-3">
          {/* Display connected player's info */}
          {isOnline && connectedPlayer && (
            <div
              style={{ color: connectedPlayer.color }}
              className="mb-4 text-base flex items-center bg-white/5 px-3 py-1 rounded-lg"
            >
              <span>Your Player:</span>
              <span className="ml-2 font-bold">{connectedPlayer.letter}</span>
            </div>
          )}
          {/* Display current player's turn */}
          {gameState.players.length > 0 && (
            <div
              style={{
                color: gameState.players[gameState.currentPlayerIndex]?.color,
              }}
              className="mb-4 text-base flex items-center bg-white/5 px-3 py-1 rounded-lg"
            >
              {connectedPlayer?.id ===
              gameState.players[gameState.currentPlayerIndex]?.id ? (
                <span>Your Turn</span>
              ) : (
                <>
                  <span>Current Player:</span>
                  <span className="ml-2 font-bold">
                    {gameState.players[gameState.currentPlayerIndex]?.letter}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Responsive game grid container */}
        <div className="w-full flex justify-center">
          <div
            className={`grid relative w-full`}
            style={{
              gridTemplateColumns: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_ROWS},minmax(0,1fr))`,
              width: "min(100%, calc(100vh - 170px)/2)",
              aspectRatio: "1 / 2",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor:
                gameState.players[gameState.currentPlayerIndex]?.color ||
                "white",
            }} // Maintains 8x16 grid aspect ratio
          >
            {(gameState.moving ? intermediateBoard : gameState.board).map(
              (row, y) =>
                row.map((cell, x) => (
                  <GameCell
                    key={`${x}-${y}`}
                    cell={cell}
                    x={x}
                    y={y}
                    currentPlayer={
                      gameState.players[gameState.currentPlayerIndex]
                    }
                    isPrevCell={prevCell[0] === x && prevCell[1] === y}
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
      </div>
    </div>
  );
}
