import { Cell, OrbPosition, Player } from "../types/game";
import { getOrbPositions } from "../lib/gameLogic";
import { useEffect, useState } from "react";

interface GameCellProps {
  cell: Cell;
  x: number;
  y: number;
  currentPlayer: Player;
  players: Player[];
  onClick: () => void;
  isExploding?: boolean;
  isReceiving?: boolean;
}

export function GameCell({
  cell,
  x,
  y,
  currentPlayer,
  players,
  onClick,
  isExploding = false,
  isReceiving = false,
}: GameCellProps) {
  const orbPositions = getOrbPositions(cell.orbs);
  const cellPlayer = cell.owner !== null ? players[cell.owner] : currentPlayer;
  const animationDuration = Math.max(3 - cell.orbs * 0.5, 0.5);

  const [animationState, setAnimationState] = useState<
    "idle" | "exploding" | "receiving"
  >("idle");
  const [prevOrbCount, setPrevOrbCount] = useState(cell.orbs);

  useEffect(() => {
    if (cell.orbs !== prevOrbCount) {
      setPrevOrbCount(cell.orbs);
    }
  }, [cell.orbs, prevOrbCount]);

  useEffect(() => {
    if (isExploding) {
      setAnimationState("exploding");
      const timer = setTimeout(() => setAnimationState("idle"), 200);
      return () => clearTimeout(timer);
    }
    if (isReceiving) {
      setAnimationState("receiving");
      const timer = setTimeout(() => setAnimationState("idle"), 200);
      return () => clearTimeout(timer);
    }
  }, [isExploding, isReceiving]);

  return (
    <div
      aria-label={(cell.orbs || 0).toString()}
      className="w-12 h-12 border-2 relative cursor-pointer transition-colors duration-200 hover:bg-gray-900"
      style={{
        borderColor: cellPlayer.color,
      }}
      onClick={onClick}
    >
      {/* Orb Counter Animation */}
      {cell.orbs > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-8 h-8"
            style={{
              animation:
                animationState === "idle"
                  ? `spin ${animationDuration}s linear infinite`
                  : "none",
            }}
          >
            {orbPositions.map((pos: OrbPosition, i: number) => (
              <div
                key={i}
                className="absolute w-4 h-4"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: "translate(-50%, -50%)",
                  opacity: animationState === "exploding" ? 0 : 1,
                  transition: "opacity 200ms ease-out",
                  animation:
                    animationState === "exploding"
                      ? "explode-out 200ms ease-out"
                      : animationState === "receiving"
                      ? "fade-in 200ms ease-out"
                      : "none",
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill={cellPlayer.color}
                    filter="url(#glow)"
                  />
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
