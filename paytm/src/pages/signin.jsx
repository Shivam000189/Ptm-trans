import { useState } from "react";



export default function SignIn() {
    const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await API.post("/auth/login", formData);
            console.log(response.data);
            localStorage.setItem("token", response.data.token);
            alert("Login successful!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed. Please check your credentials and try again.");
        }
    }


    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-400">
            <div className="bg-white p-8 rounded-md shadow-md w-96 space-y-4"> 
                <h1 className="text-3xl font-bold text-center">Login Page</h1>
                <form onSubmit={handleSubmit} className="flex flex-col justify-center">
                    <label htmlFor="email" className="text-lg font-semibold">Email</label>
                    <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <label htmlFor="password" className="text-lg font-semibold">Password</label>
                    <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <button type="submit" className="bg-black text-white rounded-md hover:opacity-80 p-2 m-2 cursor-pointer">Login</button>
                </form>
                <p className="text-center">Don't have an account? <a href="/signup" className="text-blue-500 hover:underline">Signup</a></p>
            </div>
        </div>
    )
}