// server.ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { GameMove, Player, Room } from "./app/types/game";
import { generateRoomId } from "./app/utils/setup";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handler = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(() => {
  const server = createServer(handler);

  // Initialize Socket.IO server
  const io = new SocketIOServer(server, {
    path: "/socket.io",
  });

  // In-memory storage for rooms
  const rooms: { [roomId: string]: Room } = {};

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on(
      "create-room",
      (callback: ({ roomId }: { roomId: string }) => void) => {
        const roomId = generateRoomId();
        rooms[roomId] = {
          id: roomId,
          players: [],
          isGameStarted: false,
        };
        socket.join(roomId);
        callback({ roomId });
      }
    );

    socket.on(
      "join-room",
      (
        { roomId, player }: { roomId: string; player: Player },
        callback: (response: any) => void
      ) => {
        const room = rooms[roomId];
        if (room && !room.isGameStarted) {
          room.players.push(player);
          socket.join(roomId);
          io.to(roomId).emit("player-updated", room.players);
          callback({ success: true });
        } else {
          callback({
            success: false,
            message: "Room not found or game already started.",
          });
        }
      }
    );

    socket.on(
      "update-player",
      ({ roomId, player }: { roomId: string; player: Player }) => {
        const room = rooms[roomId];
        if (room) {
          const playerIndex = room.players.findIndex((p) => p.id === player.id);
          if (playerIndex !== -1) {
            room.players[playerIndex] = player;
            io.to(roomId).emit("player-updated", room.players);
          }
        }
      }
    );

    socket.on("start-game", (roomId: string) => {
      const room = rooms[roomId];
      if (room && room.players.length >= 2) {
        room.isGameStarted = true;
        io.to(roomId).emit("game-started", room.players);
      }
    });

    socket.on(
      "make-move",
      ({ roomId, move }: { roomId: string; move: GameMove }) => {
        socket.to(roomId).emit("move-made", move);
      }
    );

    socket.on(
      "game-over",
      ({ roomId, winner }: { roomId: string; winner: Player }) => {
        io.to(roomId).emit("game-ended", winner);
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      // Handle player disconnection if necessary
    });
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

// Helper function to generate unique room IDs
