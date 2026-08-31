import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function SendMoney() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const user = state?.user;
    const recipientName = user ? `${user.firstName} ${user.lastName}` : "Recipient";
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        if (!user) {
            navigate("/dashboard");
        }
    }, [navigate, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!user) {
            navigate("/dashboard");
            return;
        }

        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setErrorMessage("Please enter a valid amount greater than 0.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await API.post("/account/transfer", {
                recipientEmail: user.email,
                amount: numAmount,
            });

            setSuccessData({
                message: response.data.message || "Transfer successful",
                transactionId: response.data.transactionId,
                amount: numAmount,
                recipientName,
                recipientEmail: user.email,
                date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
        } catch (error) {
            console.error("Transfer error:", error);
            setErrorMessage(
                error.response?.data?.message || "Transfer failed. Please check your balance or try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setAmount("");
        setSuccessData(null);
        setErrorMessage("");
    };

    return (
        <div className="min-h-screen w-screen bg-gray-100 flex items-center justify-center px-4">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={() => navigate("/dashboard")}
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl transition-all">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="absolute right-4 top-4 cursor-pointer text-sm font-semibold text-gray-400 hover:text-gray-700 transition"
                >
                    ✕
                </button>

                {successData ? (
                    /* Success State */
                    <div className="text-center py-2">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
                            <svg className="size-8" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900">Transfer Successful!</h2>
                        <p className="mt-1 text-sm text-gray-500">{successData.message}</p>

                        <div className="mt-6 rounded-2xl bg-gray-50 p-4 border border-gray-100 text-left space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                                <span className="text-sm text-gray-500">Amount Sent</span>
                                <span className="text-xl font-bold text-emerald-600">
                                    ₹{Number(successData.amount).toFixed(2)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Recipient</span>
                                <span className="font-semibold text-gray-900">{successData.recipientName}</span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Email</span>
                                <span className="text-gray-700">{successData.recipientEmail}</span>
                            </div>

                            {successData.transactionId && (
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                                    <span className="text-gray-400">Transaction ID</span>
                                    <span className="font-mono text-gray-600 truncate max-w-[180px]">
                                        {successData.transactionId}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-2.5">
                            <button
                                onClick={() => navigate("/transactions")}
                                className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                            >
                                View Transactions
                            </button>

                            <button
                                onClick={() => navigate("/dashboard")}
                                className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleReset}
                                className="text-xs text-gray-500 hover:text-indigo-600 transition underline pt-1"
                            >
                                Send another payment to {user?.firstName}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Send Form */
                    <>
                        <h1 className="text-center text-3xl font-bold text-gray-900">Send Money</h1>

                        <div className="mt-6 flex items-center gap-4 rounded-xl bg-indigo-50/80 p-4 border border-indigo-100">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow-xs">
                                {user?.firstName?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Recipient</p>
                                <h2 className="text-lg font-bold text-gray-900 truncate">{recipientName}</h2>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 border border-rose-200">
                                <svg className="size-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                </svg>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="amount" className="mb-2 block text-sm font-semibold text-gray-700">
                                    Amount (in ₹)
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-semibold">
                                        ₹
                                    </span>
                                    <input
                                        id="amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={isSubmitting}
                                        className="w-full rounded-xl border border-gray-300 py-3 pl-9 pr-4 text-gray-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 disabled:bg-gray-100"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!user || isSubmitting || !amount}
                                className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="size-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Processing Transfer...</span>
                                    </>
                                ) : (
                                    "Initiate Transfer"
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
