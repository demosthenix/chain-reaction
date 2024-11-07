import { NextResponse } from "next/server";
import { Server } from "socket.io";
import type { NextApiRequest } from "next";
import { NextApiResponseWithSocket } from "@/app/lib/socket";

let io: Server;

export async function GET(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!io) {
    console.log("Initializing socket server...");

    // @ts-ignore - we need to access the server instance directly
    const httpServer = res?.socket?.server;

    io = new Server(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    });

    // @ts-ignore
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("create-room", (roomId: string) => {
        socket.join(roomId);
        io.to(roomId).emit("room-created", { roomId });
      });

      socket.on("join-room", (roomId: string, player: any) => {
        socket.join(roomId);
        io.to(roomId).emit("player-joined", player);
      });

      socket.on("make-move", (roomId: string, move: any) => {
        socket.to(roomId).emit("move-made", move);
      });

      socket.on("game-over", (roomId: string, winner: any) => {
        io.to(roomId).emit("game-ended", winner);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
