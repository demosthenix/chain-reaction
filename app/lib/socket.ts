import { Server as IOServer } from "socket.io";
import { NextApiResponse } from "next";
import { Server as NetServer } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: IOServer;
    };
  };
};

let io: IOServer;

export const getIO = (res: NextApiResponseWithSocket) => {
  if (!io) {
    io = new IOServer(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    });
    res.socket.server.io = io;
  }
  return io;
};
