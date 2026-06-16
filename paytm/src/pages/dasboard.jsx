import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const users = [
        { id: 1, name: "John Doe", email: "john.doe@example.com" },
        { id: 2, name: "Jane Smith", email: "jane.smith@example.com" },
    ];
    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    const handleSendMoney = (user) => {
        navigate("/sendmoney", {
            state: { user },
        });
    };

    return (
        <div className="min-h-screen w-screen bg-white flex flex-col">
            <div className="w-full border-b flex items-center justify-between px-4 py-4">
                <h1 className="text-3xl font-bold">Payments App</h1>

                <div className="flex items-center">
                    <span className="text-lg font-semibold">Welcome, User!</span>
                    <span className="ml-4 flex size-10 items-center justify-center rounded-full bg-gray-400 text-lg font-semibold text-white">
                        U
                    </span>
                </div>
            </div>

            <div className="flex items-center px-4 py-6">
                <h2 className="text-2xl font-bold">Your Balance</h2>
                <p className="ml-3 text-2xl font-bold">Rs. 10,000</p>
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
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="mb-4 flex w-1/2 items-center justify-between rounded-md border-2 border-gray-300 p-4"
                        >
                            <div>
                                <h3 className="text-lg font-semibold">{user.name}</h3>
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

                    {filteredUsers.length === 0 && (
                        <p className="text-center text-gray-500">No users found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
