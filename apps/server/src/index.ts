import * as http from "http";
import SocketService from "./services/socket";

async function init() {
  const socketService = new SocketService();
  const httpServer = http.createServer();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

  socketService.io.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`HTTP server start at PORT:${PORT}`);
  });

  socketService.initListeners();
}

// start the server
init().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
