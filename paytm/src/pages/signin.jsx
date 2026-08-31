import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { connectSocket } from "../socket";

export default function SignIn() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await API.post("/auth/login", formData);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            connectSocket();
            alert("Login successful!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            alert(error.response?.data?.message || "Login failed. Please check your credentials and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-400">
            <div className="w-96 space-y-4 rounded-md bg-white p-8 shadow-md">
                <h1 className="text-center text-3xl font-bold">Login Page</h1>
                <form onSubmit={handleSubmit} className="flex flex-col justify-center">
                    <label htmlFor="email" className="text-lg font-semibold">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="m-2 rounded-md border-2 border-gray-300 p-2"
                        required
                    />

                    <label htmlFor="password" className="text-lg font-semibold">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="m-2 rounded-md border-2 border-gray-300 p-2"
                        required
                    />

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="m-2 cursor-pointer rounded-md bg-black p-2 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="text-center">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="text-blue-500 hover:underline">
                        Signup
                    </Link>
                </p>
            </div>
        </div>
    );
}
