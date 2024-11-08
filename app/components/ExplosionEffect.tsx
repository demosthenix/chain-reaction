import { Explosion } from "../types/game";
import { useMediaQuery } from "react-responsive";

interface ExplosionEffectProps {
  explosion: Explosion;
  onAnimationStart: (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => void;
  onAnimationEnd: (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => void;
}

const CELL_SIZE = 48;
const CELL_GAP = 4;

const SMALL_CELL_SIZE = 36;
const SMALL_CELL_GAP = 3.5;

export function ExplosionEffect({
  explosion,
  onAnimationStart,
  onAnimationEnd,
}: ExplosionEffectProps) {
  const isSmallScreen = useMediaQuery({ maxWidth: 639 }); // <640px
  const cellSize = isSmallScreen ? SMALL_CELL_SIZE : CELL_SIZE;
  const cellGap = isSmallScreen ? SMALL_CELL_GAP : CELL_GAP;

  const fromPixelX = explosion.fromX * (cellSize + cellGap) + cellSize / 2;
  const fromPixelY = explosion.fromY * (cellSize + cellGap) + cellSize / 2;
  const toPixelX = explosion.toX * (cellSize + cellGap) + cellSize / 2;
  const toPixelY = explosion.toY * (cellSize + cellGap) + cellSize / 2;

  return (
    <div
      className="absolute w-4 h-4 max-sm:w-[13px] max-sm:h-[13px] explosion pointer-events-none"
      style={
        {
          "--from-x": `${fromPixelX}px`,
          "--from-y": `${fromPixelY}px`,
          "--to-x": `${toPixelX}px`,
          "--to-y": `${toPixelY}px`,
        } as React.CSSProperties
      }
      onAnimationStart={() =>
        onAnimationStart(
          explosion.fromX,
          explosion.fromY,
          explosion.toX,
          explosion.toY
        )
      }
      onAnimationEnd={() =>
        onAnimationEnd(
          explosion.fromX,
          explosion.fromY,
          explosion.toX,
          explosion.toY
        )
      }
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        stroke="white"
        strokeWidth={3}
      >
        <circle cx="50" cy="50" r="45" fill={explosion.color} />
      </svg>
    </div>
  );
}
