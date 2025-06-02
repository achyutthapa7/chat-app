import React, { createContext, useContext } from "react";
import { io } from "socket.io-client";
const SocketContext = createContext<null | any>(null);
export const SocketProvider = ({ children }: any) => {
  const socket = io("http://localhost:3000");
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
