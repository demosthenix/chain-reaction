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
  const [showCounter, setShowCounter] = useState(false);

  useEffect(() => {
    if (cell.orbs !== prevOrbCount) {
      setShowCounter(true);
      const timer = setTimeout(() => setShowCounter(false), 300);
      setPrevOrbCount(cell.orbs);
      return () => clearTimeout(timer);
    }
  }, [cell.orbs, prevOrbCount]);

  useEffect(() => {
    if (isExploding) {
      setAnimationState("exploding");
      const timer = setTimeout(() => setAnimationState("idle"), 300);
      return () => clearTimeout(timer);
    }
    if (isReceiving) {
      setAnimationState("receiving");
      const timer = setTimeout(() => setAnimationState("idle"), 300);
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
      {showCounter && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none
            ${
              cell.orbs > prevOrbCount
                ? "animate-count-up"
                : "animate-count-down"
            }
          `}
        >
          <div
            className="text-xl font-bold"
            style={{ color: cellPlayer.color }}
          >
            {cell.orbs > prevOrbCount ? "+" : "-"}
          </div>
        </div>
      )}

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
                  transition: "opacity 300ms ease-out",
                  animation:
                    animationState === "exploding"
                      ? "explode-out 300ms ease-out"
                      : animationState === "receiving"
                      ? "fade-in 300ms ease-out"
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
