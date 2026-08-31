import { io } from "socket.io-client";

const getSocketUrl = () => {
    const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return rawUrl.replace(/\/api\/?$/, "") || "http://localhost:5000";
};

const socketUrl = getSocketUrl();
const token = localStorage.getItem("token");

export const socket = io(socketUrl, {
    autoConnect: Boolean(token),
    withCredentials: true,
    auth: {
        token: token || "",
    },
});

export const connectSocket = () => {
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
        socket.auth = { token: currentToken };
        if (!socket.connected) {
            socket.connect();
        }
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket;
