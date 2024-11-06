"use client";

import { Canvas } from "@react-three/fiber";
import { useRecoilState } from "recoil";
import { Cell } from "../types/game";
import { gameState } from "../atoms/gameState";
import Cube from "./Cube";
import { Suspense } from "react";

const GameBoard = () => {
  const [game, setGame] = useRecoilState(gameState);

  const getCellCapacity = (x: number, y: number) => {
    let capacity = 4;
    if (x === 0 || x === 15) capacity -= 1;
    if (y === 0 || y === 7) capacity -= 1;
    return capacity;
  };

  const getNeighbors = (x: number, y: number) => {
    const neighbors = [];
    if (x > 0) neighbors.push({ x: x - 1, y });
    if (x < 15) neighbors.push({ x: x + 1, y });
    if (y > 0) neighbors.push({ x, y: y - 1 });
    if (y < 7) neighbors.push({ x, y: y + 1 });
    return neighbors;
  };

  const handleChainReactions = (board: Cell[][], x: number, y: number) => {
    const stack = [{ x, y }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const cellKey = `${x}-${y}`;

      if (visited.has(cellKey)) continue;
      visited.add(cellKey);

      const cell = board[y][x];
      const capacity = getCellCapacity(x, y);

      if (cell.orbs >= capacity) {
        board[y][x] = {
          ...cell,
          orbs: cell.orbs - capacity,
        };

        getNeighbors(x, y).forEach(({ x: nx, y: ny }) => {
          const neighborCell = board[ny][nx];
          board[ny][nx] = {
            ...neighborCell,
            orbs: neighborCell.orbs + 1,
            owner: cell.owner,
          };

          const neighborKey = `${nx}-${ny}`;
          if (!visited.has(neighborKey)) {
            stack.push({ x: nx, y: ny });
          }
        });
      }
    }
  };

  const checkGameOver = (board: Cell[][]) => {
    const owners = new Set<number>();
    board.forEach((row) =>
      row.forEach((cell) => {
        if (cell.owner !== null) owners.add(cell.owner);
      })
    );

    if (owners.size <= 1) {
      setGame((prevGame) => ({ ...prevGame, isGameOver: true }));
    }
  };

  const handleCubeClick = (x: number, y: number) => {
    if (game.isGameOver) return;
    if (x < 0 || x >= 16 || y < 0 || y >= 8) return;

    setGame((prevGame) => {
      const currentPlayer = prevGame.players[prevGame.currentPlayerIndex];
      const cell = prevGame.board[y][x];

      if (cell.owner === null || cell.owner === currentPlayer.id) {
        const newBoard = prevGame.board.map((row) =>
          row.map((cell) => ({ ...cell }))
        );

        newBoard[y][x] = {
          ...newBoard[y][x],
          orbs: newBoard[y][x].orbs + 1,
          owner: currentPlayer.id,
        };

        handleChainReactions(newBoard, x, y);

        const nextState = {
          ...prevGame,
          board: newBoard,
          currentPlayerIndex:
            (prevGame.currentPlayerIndex + 1) % prevGame.players.length,
        };

        // Check game over after state update
        setTimeout(() => checkGameOver(newBoard), 0);

        return nextState;
      }

      return prevGame;
    });
  };

  if (game.isGameOver) {
    const resetGame = () => {
      localStorage.removeItem("recoil-persist");
      setGame({
        players: [],
        currentPlayerIndex: 0,
        board: [],
        isGameOver: false,
      });
    };

    return (
      <div className="text-center">
        <h1 className="text-3xl">Game Over!</h1>
        <button
          onClick={resetGame}
          className="bg-blue-500 text-white px-4 py-2 mt-4"
        >
          Restart Game
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Canvas
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: "default",
        }}
        camera={{ position: [0, 0, 50], fov: 75, zoom: 4 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          {game.board.map((row, y) =>
            row.map((cell, x) => (
              <Cube
                key={`${x}-${y}`}
                position={[3.5 - y, x - 7.5, 0]}
                cell={cell}
                onClick={() => handleCubeClick(x, y)}
              />
            ))
          )}
        </Suspense>
      </Canvas>
      <div className="absolute top-4 left-4 text-white">
        Current Player: {game.players[game.currentPlayerIndex]?.letter || ""}
      </div>
    </div>
  );
};

export default GameBoard;
