"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
interface SocketProviderProps {
  children: React.ReactNode;
}

interface ISocketContext {
  sendMessage: (msg: string) => unknown;
  messages: string[];
}

const SocketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(SocketContext);
  if (!state) throw Error(`State is undefined`);
  return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket>();
  const [messages, setMessages] = useState<ISocketContext["messages"]>([]);

  const sendMessage: ISocketContext["sendMessage"] = useCallback(
    (msg) => {
      if (socket) {
        socket.emit("event:message", { message: msg });
      }
    },
    [socket]
  );

  const onMessageRec = useCallback((msg: string) => {
    console.log("Message rec from server", msg);
    const { message } = JSON.parse(msg) as { message: string };
    console.log(typeof message);
    setMessages((pre) => [...pre, message]);
  }, []);

  useEffect(() => {
    const _socket = io("http://localhost:8000");
    _socket.on("message", onMessageRec);
    setSocket(_socket);
    return () => {
      _socket.disconnect();
      _socket.off("message", onMessageRec);
      setSocket(undefined);
    };
  }, [onMessageRec]);
  return (
    <SocketContext.Provider value={{ sendMessage, messages }}>
      {children}
    </SocketContext.Provider>
  );
};
