import { BrowserRouter, Route, Router, Routes } from "react-router-dom"
import Signup from "./pages/signup"



function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
