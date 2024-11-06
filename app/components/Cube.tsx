// app/components/Cube.tsx
import { useRecoilValue } from "recoil";
import { Edges, Text } from "@react-three/drei";
import { gameState } from "../atoms/gameState";
import { Cell } from "../types/game";

interface CubeProps {
  position: [number, number, number];
  cell: Cell;
  onClick: () => void;
}

const Cube = ({ position, cell, onClick }: CubeProps) => {
  const game = useRecoilValue(gameState);

  // Get the cell owner's color
  const player = cell.owner !== null ? game.players[cell.owner] : null;
  const edgeColor = player ? player.color : "gray";

  return (
    <mesh position={position} onClick={onClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
      <Edges scale={1.01} color={edgeColor} />
      {cell.owner !== null && (
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.5}
          color={player?.color}
          anchorX="center"
          anchorY="middle"
        >
          {cell.orbs}
        </Text>
      )}
    </mesh>
  );
};

export default Cube;
