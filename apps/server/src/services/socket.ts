import Redis from "ioredis";
import { Server } from "socket.io";

const redisConfig = {
  host: "127.0.0.1",
  port: 6379,
  username: "default",
  password: "",
};
const pub = new Redis(redisConfig);
const sub = new Redis(redisConfig);
class SocketService {
  private _io: Server;
  constructor() {
    console.log("Init Socket Service..");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      },
    });
    sub.subscribe("MESSAGES");
  }

  public initListeners() {
    const io = this._io;
    console.log("Init Socket Listeners...");

    io.on("connect", (socket) => {
      console.log(`New Socket Connected ${socket.id}`);
      socket.on("event:message", async (message: { message: string }) => {
        console.log("New Message Rec", message);
        // publish this message to redis
        await pub.publish("MESSAGES", JSON.stringify(message));
      });
    });

    sub.on("message", async (channel, message) => {
      if (channel === "MESSAGES") {
        console.log("new message from redis", message);
        io.emit("message", message);
      }
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
