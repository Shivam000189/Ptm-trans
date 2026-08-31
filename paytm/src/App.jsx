import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import socket, { connectSocket, disconnectSocket } from "./socket";
import Signup from "./pages/signup";
import SignIn from "./pages/signin";
import Dashboard from "./pages/dasboard";
import SendMoney from "./pages/send";
import Transactions from "./pages/transactions";

function SocketManager() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      connectSocket();
    }

    const onConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const onDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
    };

    const onConnectError = (error) => {
      console.error("Socket connect_error:", error?.message || error);
    };

    const onMoneyReceived = (data) => {
      console.log("Realtime event - money:received:", data);

      toast.success(`💰 You received Rs. ${data.amount} from ${data.senderName}`, {
        description: data.senderEmail ? `From: ${data.senderEmail}` : undefined,
        duration: 8000,
        action: {
          label: "View Dashboard",
          onClick: () => navigate("/dashboard"),
        },
      });

      // Dispatch custom event to auto-refresh Dashboard & Transactions views
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: data }));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("money:received", onMoneyReceived);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("money:received", onMoneyReceived);
      disconnectSocket();
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <SocketManager />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sendmoney" element={<SendMoney />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
