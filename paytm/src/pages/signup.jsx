import { useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../api/axios";


export default function Signup() {
    const [formData, setFormData] = useState({
        firstname:"",
        lastname:"",
        email:"",
        password:"",
        });

        const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try{
            const response = await API.post("/auth/signup", formData);
            console.log(response.data);
            alert("Signup successful! Please login.");
            navigate("/dashboard");
        } catch (error) {
            console.error("Signup error:", error);
            alert("Signup failed. Please try again.");
        }
    };
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-400">
            <div className="bg-white p-8 rounded-md shadow-md w-96 space-y-4"> 
                <h1 className="text-3xl font-bold text-center">Signup Page</h1>

                <form onSubmit={handleSubmit} className="flex flex-col justify-center">
                    <label htmlFor="firstName" className="text-lg font-semibold">First Name</label>
                    <input type="text" placeholder="First Name" value={formData.firstname} onChange={(e) => setFormData({...formData, firstname: e.target.value})} className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <label htmlFor="lastName" className="text-lg font-semibold">Last Name</label>
                    <input type="text" placeholder="Last Name" value={formData.lastname} onChange={(e) => setFormData({...formData, lastname: e.target.value})} className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <label htmlFor="email" className="text-lg font-semibold">Email</label>
                    <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <label htmlFor="password" className="text-lg font-semibold">Password</label>
                    <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="border-2 border-gray-300 rounded-md p-2 m-2" />
                    <button type="submit" className="bg-black text-white rounded-md hover:opacity-80 p-2 m-2 cursor-pointer">Signup</button>
                </form>


                <p className="text-center">Already have an account? <a href="/signin" className="text-blue-500 hover:underline">Login</a></p>
            </div>
        </div>
    )
}