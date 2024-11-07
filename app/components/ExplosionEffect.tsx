import { Explosion } from "../types/game";

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

export function ExplosionEffect({
  explosion,
  onAnimationStart,
  onAnimationEnd,
}: ExplosionEffectProps) {
  const fromPixelX = explosion.fromX * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const fromPixelY = explosion.fromY * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const toPixelX = explosion.toX * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const toPixelY = explosion.toY * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;

  return (
    <div
      className="absolute w-4 h-4 explosion pointer-events-none"
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
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill={explosion.color} />
      </svg>
    </div>
  );
}
