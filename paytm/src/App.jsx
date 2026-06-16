import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signup from "./pages/signup";
import SignIn from "./pages/signin";
import Dashboard from "./pages/dasboard";
import SendMoney from "./pages/send";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sendmoney" element={<SendMoney />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
