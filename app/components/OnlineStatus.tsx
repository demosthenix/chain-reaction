import { Player } from "../types/game";

interface OnlineStatusProps {
  isConnected: boolean;
  currentPlayer: Player;
}

export function OnlineStatus({
  isConnected,
  currentPlayer,
}: OnlineStatusProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center space-x-2 text-white">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span>{isConnected ? "Connected" : "Disconnected"}</span>
    </div>
  );
}
