import { useEffect, useState } from "react";
import { Explosion } from "../types/game";
import { BOARD_COLUMNS } from "../constants/board";

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

export function ExplosionEffect({
  explosion,
  onAnimationStart,
  onAnimationEnd,
}: ExplosionEffectProps) {
  const [dimensions, setDimensions] = useState({
    cellSize: 0,
    cellGap: 0,
  });

  useEffect(() => {
    // Function to calculate dimensions
    const calculateDimensions = () => {
      // Get the grid container
      const gridContainer = document.querySelector(".grid");
      if (!gridContainer) return;

      // Calculate gap from the first cell's border width
      const firstCell = gridContainer.querySelector("div");
      const borderWidth = firstCell
        ? parseFloat(window.getComputedStyle(firstCell).borderWidth)
        : 2;

      // Calculate cell size from grid width (8 columns)
      const gridWidth = gridContainer.clientWidth;
      const cellWidth = gridWidth / BOARD_COLUMNS;

      setDimensions({
        cellSize: cellWidth,
        cellGap: borderWidth * 2, // Double the border width for total gap
      });
    };

    // Calculate initially
    calculateDimensions();

    // Recalculate on window resize
    const handleResize = () => {
      calculateDimensions();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Only render when we have valid dimensions
  if (dimensions.cellSize === 0) return null;

  const offset = 6;

  const fromPixelX =
    explosion.fromX * dimensions.cellSize + dimensions.cellSize / 2 - offset;
  const fromPixelY =
    explosion.fromY * dimensions.cellSize + dimensions.cellSize / 2 - offset;
  const toPixelX =
    explosion.toX * dimensions.cellSize + dimensions.cellSize / 2 - offset;
  const toPixelY =
    explosion.toY * dimensions.cellSize + dimensions.cellSize / 2 - offset;

  // Calculate explosion orb size based on cell size
  const orbSize = Math.max(dimensions.cellSize * 0.3, 13); // Minimum size of 13px

  return (
    <div
      className="absolute w-4 h-4 max-sm:w-[13px] max-sm:h-[13px] explosion pointer-events-none"
      style={
        {
          "--from-x": `${fromPixelX}px`,
          "--from-y": `${fromPixelY}px`,
          "--to-x": `${toPixelX}px`,
          "--to-y": `${toPixelY}px`,
          width: `${orbSize}px`,
          height: `${orbSize}px`,
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
