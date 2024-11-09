import { Cell, OrbPosition, Player } from "../types/game";
import { getOrbPositions } from "../lib/gameLogic";
import { useEffect, useState } from "react";
import { ANIMATION_DURATION } from "../constants/board";

interface GameCellProps {
  cell: Cell;
  x: number;
  y: number;
  currentPlayer: Player;
  players: Player[];
  onClick: () => void;
  isPrevCell: boolean;
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
  isPrevCell,
  isExploding = false,
  isReceiving = false,
}: GameCellProps) {
  const orbPositions = getOrbPositions(cell.orbs);
  const cellPlayer =
    cell.owner !== null
      ? players.find((p) => p.id === cell.owner) || currentPlayer
      : currentPlayer;
  const animationDuration = Math.max(3 - cell.orbs * 0.5, 0.5);

  const [animationState, setAnimationState] = useState<
    "idle" | "exploding" | "receiving"
  >("idle");
  const [prevOrbCount, setPrevOrbCount] = useState(cell.orbs);

  console.log({ isExploding, isReceiving, animationState });

  useEffect(() => {
    if (cell.orbs !== prevOrbCount) {
      setPrevOrbCount(cell.orbs);
    }
  }, [cell.orbs, prevOrbCount]);

  useEffect(() => {
    if (isExploding) {
      setAnimationState("exploding");
      const timer = setTimeout(
        () => setAnimationState("idle"),
        ANIMATION_DURATION
      );
      return () => clearTimeout(timer);
    }
    if (isReceiving) {
      setAnimationState("receiving");
      const timer = setTimeout(
        () => setAnimationState("idle"),
        ANIMATION_DURATION
      );
      return () => clearTimeout(timer);
    }
  }, [isExploding, isReceiving]);

  return (
    <div
      aria-label={(cell.orbs || 0).toString()}
      className="border-2 relative cursor-pointer transition-colors hover:bg-gray-900
      w-full aspect-square"
      style={{
        transitionDuration: `${ANIMATION_DURATION}ms`,
        borderColor: cellPlayer.color,
        backgroundColor: isPrevCell ? "#61616180" : "",
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
            {orbPositions.map((pos: OrbPosition, i: number) => {
              return (
                <div
                  key={i}
                  className="absolute w-4 h-4 max-sm:w-[13px] max-sm:h-[13px]"
                  style={{
                    top: pos.top,
                    left: pos.left,
                    transform: "translate(-50%, -50%)",
                    opacity: animationState === "exploding" ? 0 : 1,
                    transition: `opacity ${ANIMATION_DURATION}ms ease-out`,
                    animation:
                      animationState === "exploding"
                        ? `explode-out ${ANIMATION_DURATION}ms ease-out`
                        : animationState === "receiving"
                        ? `fade-in ${ANIMATION_DURATION}ms ease-out`
                        : "none",
                  }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="w-4 h-4 max-sm:w-[13px] max-sm:h-[13px]"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill={cellPlayer.color}
                      filter="url(#glow)"
                      stroke="white"
                      strokeWidth={3}
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
