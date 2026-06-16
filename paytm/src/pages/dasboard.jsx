import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        const loadDashboard = async () => {
            try {
                const [meResponse, balanceResponse, usersResponse] = await Promise.all([
                    API.get("/auth/me"),
                    API.get("/account/balance"),
                    API.get("/auth/user/bulk"),
                ]);

                setCurrentUser(meResponse.data.user);
                setBalance(balanceResponse.data.balance);
                setUsers(usersResponse.data.users || []);
            } catch (error) {
                console.error("Dashboard load error:", error);
                alert(error.response?.data?.message || "Unable to load dashboard data.");
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const response = await API.get("/auth/user/bulk", {
                    params: { filter: searchTerm },
                });
                setUsers(response.data.users || []);
            } catch (error) {
                console.error("User search error:", error);
            }
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSendMoney = (user) => {
        navigate("/sendmoney", {
            state: { user },
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-screen items-center justify-center bg-white text-xl font-semibold">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-white flex flex-col">
            <div className="w-full border-b flex items-center justify-between px-4 py-4">
                <h1 className="text-3xl font-bold">Payments App</h1>

                <div className="flex items-center">
                    <span className="text-lg font-semibold">
                        Welcome, {currentUser?.firstName || "User"}!
                    </span>
                    <span className="ml-4 flex size-10 items-center justify-center rounded-full bg-gray-400 text-lg font-semibold text-white">
                        {currentUser?.firstName?.[0]?.toUpperCase() || "U"}
                    </span>
                </div>
            </div>

            <div className="flex items-center px-4 py-6">
                <h2 className="text-2xl font-bold">Your Balance</h2>
                <p className="ml-3 text-2xl font-bold">Rs. {Number(balance).toFixed(2)}</p>
            </div>

            <div className="px-4">
                <h2 className="mt-4 text-2xl font-bold text-center">Users Search</h2>
                <div className="mt-4 flex items-center justify-center">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-1/3 rounded-md border-2 border-gray-300 p-2"
                    />
                </div>

                <h2 className="mt-8 text-2xl font-bold text-center">User List</h2>
                <div className="mt-4 flex flex-col items-center justify-center">
                    {users.map((user) => (
                        <div
                            key={user._id}
                            className="mb-4 flex w-1/2 items-center justify-between rounded-md border-2 border-gray-300 p-4"
                        >
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {user.firstName} {user.lastName}
                                </h3>
                                <p>Email: {user.email}</p>
                            </div>

                            <button
                                onClick={() => handleSendMoney(user)}
                                className="cursor-pointer rounded-md bg-blue-500 p-2 text-white hover:opacity-80"
                            >
                                Send Money
                            </button>
                        </div>
                    ))}

                    {users.length === 0 && (
                        <p className="text-center text-gray-500">No users found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
