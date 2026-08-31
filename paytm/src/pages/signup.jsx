import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await API.post("/auth/register", formData);
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            alert("Signup successful!");
            navigate("/dashboard");
        } catch (error) {
            console.error("Signup error:", error);
            alert(error.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-400">
            <div className="w-96 space-y-4 rounded-md bg-white p-8 shadow-md">
                <h1 className="text-center text-3xl font-bold">Signup Page</h1>

                <form onSubmit={handleSubmit} className="flex flex-col justify-center">
                    <label htmlFor="firstName" className="text-lg font-semibold">First Name</label>
                    <input
                        id="firstName"
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="m-2 rounded-md border-2 border-gray-300 p-2"
                        required
                    />

                    <label htmlFor="lastName" className="text-lg font-semibold">Last Name</label>
                    <input
                        id="lastName"
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="m-2 rounded-md border-2 border-gray-300 p-2"
                        required
                    />

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
                        {isSubmitting ? "Signing up..." : "Signup"}
                    </button>
                </form>

                <p className="text-center">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-blue-500 hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
