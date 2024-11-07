import { Explosion } from "../types/game";
import { GroupedExplosion } from "../types/game";

const CELL_SIZE = 48;
const CELL_GAP = 4;

interface ExplosionEffectProps {
  explosion: GroupedExplosion;
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

export function ExplosionEffect({
  explosion,
  onAnimationStart,
  onAnimationEnd,
}: ExplosionEffectProps) {
  const fromPixelX = explosion.fromX * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const fromPixelY = explosion.fromY * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;

  return (
    <>
      {explosion.targets.map((target, index) => {
        const toPixelX = target.toX * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
        const toPixelY = target.toY * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;

        return (
          <div
            key={`${explosion.id}-${index}`}
            className="absolute w-3 h-3 explosion pointer-events-none"
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
                target.toX,
                target.toY
              )
            }
            onAnimationEnd={() =>
              onAnimationEnd(
                explosion.fromX,
                explosion.fromY,
                target.toX,
                target.toY
              )
            }
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill={explosion.color} />
            </svg>
          </div>
        );
      })}
    </>
  );
}
