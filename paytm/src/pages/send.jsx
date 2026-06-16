import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function SendMoney() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const user = state?.user;
    const recipientName = user ? `${user.firstName} ${user.lastName}` : "Select a user from dashboard";
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            navigate("/dashboard");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await API.post("/account/transfer", {
                recipientEmail: user.email,
                amount: Number(amount),
            });

            alert(response.data.message || "Transfer initiated successfully.");
            navigate("/dashboard");
        } catch (error) {
            console.error("Transfer error:", error);
            alert(error.response?.data?.message || "Transfer failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-gray-100 flex items-center justify-center px-4">
            <div
                className="fixed inset-0 bg-black/40"
                onClick={() => navigate("/dashboard")}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="absolute right-4 top-4 cursor-pointer text-sm font-semibold text-gray-500 hover:text-black"
                >
                    Close
                </button>

                <h1 className="text-center text-3xl font-bold text-gray-900">Send Money</h1>

                <div className="mt-8 flex items-center gap-4 rounded-xl bg-green-50 p-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
                        {user?.firstName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Sending money to</p>
                        <h2 className="text-xl font-semibold text-gray-900">{recipientName}</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="amount" className="mb-2 block text-sm font-semibold text-gray-700">
                            Amount (in Rs.)
                        </label>
                        <input
                            id="amount"
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!user || isSubmitting}
                        className="w-full cursor-pointer rounded-xl bg-green-500 px-4 py-3 text-base font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isSubmitting ? "Processing..." : "Initiate Transfer"}
                    </button>
                </form>
            </div>
        </div>
    );
}
