import { BrowserRouter, Route, Router, Routes } from "react-router-dom"
import Signup from "./pages/signup"
import SignIn from "./pages/signin"
import Dashboard from "./pages/dasboard"



function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
