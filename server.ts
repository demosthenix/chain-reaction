// server.ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Socket, Server as SocketIOServer } from "socket.io";
import { GameMove, GameState, Player, Room } from "./app/types/game";
import { generateRoomId } from "./app/utils/setup";

interface CustomSocket extends Socket {
  clientId?: string;
}

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

  io.on("connection", (socket: CustomSocket) => {
    const clientId = socket.handshake.auth.clientId;
    socket.clientId = clientId; // Store clientId in socket object
    console.log("Client connected:", { socketId: socket.id, clientId });

    // Find and restore previous session
    Object.entries(rooms).forEach(([roomId, room]) => {
      const existingPlayer = room.players.find((p) => p.id === clientId); // Compare with player.id
      if (existingPlayer) {
        socket.join(roomId);
        if (room.gameState) {
          socket.emit("sync-game-state", room.gameState);
        }
        io.to(roomId).emit("player-updated", room.players);
      }
    });

    socket.on("sync-request", ({ roomId }: { roomId: string }) => {
      const room = rooms[roomId];
      if (room?.gameState) {
        socket.emit("sync-game-state", room.gameState);
      }
    });

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
      ({
        roomId,
        move,
        gameState,
      }: {
        roomId: string;
        move: GameMove;
        gameState: GameState;
      }) => {
        const room = rooms[roomId];
        if (room) {
          room.gameState = gameState;
          socket.to(roomId).emit("move-made", move);
        }
      }
    );

    socket.on(
      "game-over",
      ({ roomId, winner }: { roomId: string; winner: Player }) => {
        io.to(roomId).emit("game-ended", winner);
      }
    );

    socket.on(
      "leave-room",
      (
        { roomId, playerId }: { roomId: string; playerId: string },
        callback?: (response: any) => void
      ) => {
        console.log("Leave room request received:", {
          roomId,
          playerId,
          socketId: socket.id,
        });

        const room = rooms[roomId];
        if (room) {
          if (!room.isGameStarted) {
            // Remove the player
            const playerToRemove = room.players.find((p) => p.id === playerId);
            const wasOwner = playerToRemove?.isOwner;

            console.log("Before filter:", {
              players: room.players,
              playerId,
              wasOwner,
            });

            room.players = room.players.filter((p) => p.id !== playerId);

            console.log("After filter:", {
              remainingPlayers: room.players,
            });

            if (room.players.length === 0) {
              console.log("Deleting empty room:", roomId);
              delete rooms[roomId];
            } else if (wasOwner) {
              // Assign new owner
              room.players[0].isOwner = true;
              console.log("New owner assigned:", room.players[0]);
            }

            // Emit to all players including the one leaving
            io.to(roomId).emit("player-left", {
              playerId,
              players: room.players,
            });
          } else {
            // Handle game in progress...
            if (room.gameState) {
              room.gameState.board.forEach((row) => {
                row.forEach((cell) => {
                  if (cell.owner === playerId) {
                    cell.owner = null;
                    cell.orbs = 0;
                  }
                });
              });
              room.gameState.players = room.gameState.players.filter(
                (p) => p.id !== playerId
              );
              room.players = room.players.filter((p) => p.id !== playerId);

              io.to(roomId).emit("player-disconnected", {
                playerId,
                gameState: room.gameState,
              });
            }
          }

          // Leave the room
          socket.leave(roomId);

          // Send callback confirmation
          if (callback) {
            callback({ success: true });
          }
        } else {
          console.log("Room not found:", roomId);
          if (callback) {
            callback({ success: false, error: "Room not found" });
          }
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.clientId);

      // Find the room this player was in
      const roomEntry = Object.entries(rooms).find(([_, room]) =>
        room.players.some((p) => p.id === socket.clientId)
      );

      if (roomEntry) {
        const [roomId, room] = roomEntry;

        if (!room.isGameStarted) {
          // Remove the player
          room.players = room.players.filter((p) => p.id !== socket.clientId);

          if (room.players.length === 0) {
            delete rooms[roomId];
          } else {
            // Reassign owner if needed
            const wasOwner = room.players.some(
              (p) => p.id === socket.clientId && p.isOwner
            );
            if (wasOwner) {
              room.players[0].isOwner = true;
            }

            // Emit updated player list
            io.to(roomId).emit("player-left", {
              playerId: socket.clientId,
              players: room.players,
            });
          }
        } else {
          // If game started, start a timeout
          setTimeout(() => {
            if (room.gameState) {
              // Clear player's cells
              room.gameState.board.forEach((row) => {
                row.forEach((cell) => {
                  if (cell.owner === socket.clientId) {
                    cell.owner = null;
                    cell.orbs = 0;
                  }
                });
              });

              // Remove player from game state
              room.gameState.players = room.gameState.players.filter(
                (p) => p.id !== socket.clientId
              );
              room.players = room.players.filter(
                (p) => p.id !== socket.clientId
              );

              // Emit updated state
              io.to(roomId).emit("player-disconnected", {
                playerId: socket.clientId,
                gameState: room.gameState,
              });
            }
          }, 30000); // 30 seconds timeout
        }
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});

// Helper function to generate unique room IDs
