import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);

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
      console.log("Client disconnected", socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
