import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import ReceiptModal from "../components/ReceiptModal";

export default function Transactions() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Check for auth token on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
            }
        }
    }, [navigate]);

    const fetchTransactions = useCallback(async (page = 1, type = "all") => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit: 10,
            };
            if (type && type !== "all") {
                params.type = type;
            }

            const response = await API.get("/account/history", { params });
            const data = response.data;
            setTransactions(data.transactions || []);
            setCurrentPage(data.currentPage || 1);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
            setHasNextPage(Boolean(data.hasNextPage));
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                alert(error.response?.data?.message || "Failed to load transaction history.");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchTransactions(currentPage, filterType);

            const intervalId = setInterval(() => {
                fetchTransactions(currentPage, filterType);
            }, 30000);

            const handleWalletUpdated = () => {
                fetchTransactions(currentPage, filterType);
            };

            window.addEventListener("wallet:updated", handleWalletUpdated);

            return () => {
                clearInterval(intervalId);
                window.removeEventListener("wallet:updated", handleWalletUpdated);
            };
        }
    }, [currentPage, filterType, fetchTransactions]);

    const handleFilterChange = (newType) => {
        setFilterType(newType);
        setCurrentPage(1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (hasNextPage || currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const getStatusBadge = (status) => {
        const normalized = (status || "completed").toLowerCase();
        if (normalized === "completed") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                    <span className="size-1.5 rounded-full bg-emerald-500"></span>
                    Completed
                </span>
            );
        }
        if (normalized === "pending") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                    <span className="size-1.5 rounded-full bg-amber-500"></span>
                    Pending
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-600/20 ring-inset">
                <span className="size-1.5 rounded-full bg-rose-500"></span>
                Failed
            </span>
        );
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            Back to Dashboard
                        </Link>
                        <span className="h-5 w-px bg-gray-300"></span>
                        <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-block text-sm font-medium text-gray-600">
                            {currentUser?.firstName} {currentUser?.lastName}
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
                            {currentUser?.firstName?.[0]?.toUpperCase() || "U"}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {/* Top Control Bar */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">All Transactions</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Click on any transaction to view its detailed receipt & exact timestamp
                        </p>
                    </div>

                    {/* Filter Dropdown & Refresh */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <label htmlFor="filterType" className="sr-only">Filter by type</label>
                            <select
                                id="filterType"
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="cursor-pointer appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-gray-700 shadow-xs transition hover:border-gray-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none"
                            >
                                <option value="all">All Types</option>
                                <option value="debit">Sent (Debit)</option>
                                <option value="credit">Received (Credit)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>

                        <button
                            onClick={() => fetchTransactions(currentPage, filterType)}
                            disabled={isLoading}
                            title="Refresh"
                            className="flex items-center justify-center rounded-xl border border-gray-300 bg-white p-2.5 text-gray-600 shadow-xs transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                        >
                            <svg className={`size-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                    {/* Loading State: Skeletons */}
                    {isLoading ? (
                        <div className="divide-y divide-gray-100">
                            {[...Array(5)].map((_, idx) => (
                                <div key={idx} className="flex items-center justify-between p-5 animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="size-11 rounded-full bg-gray-200"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-40 rounded-md bg-gray-200"></div>
                                            <div className="h-3 w-56 rounded-md bg-gray-100"></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        <div className="h-5 w-24 rounded-md bg-gray-200"></div>
                                        <div className="h-3 w-28 rounded-md bg-gray-100"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                                <svg className="size-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No transactions found</h3>
                            <p className="mt-1 max-w-sm text-sm text-gray-500">
                                {filterType !== "all"
                                    ? `No ${filterType === "debit" ? "sent (debit)" : "received (credit)"} transactions recorded for your account yet.`
                                    : "You haven't made or received any payments yet."}
                            </p>
                            <Link
                                to="/dashboard"
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
                            >
                                Send Money
                            </Link>
                        </div>
                    ) : (
                        /* Transactions List / Table */
                        <div className="divide-y divide-gray-100">
                            {transactions.map((tx) => {
                                const isCredit = tx.type === "credit";
                                const counterparty = isCredit ? tx.sender : tx.recipient;
                                const counterpartyName = counterparty
                                    ? `${counterparty.firstName || ""} ${counterparty.lastName || ""}`.trim()
                                    : "Unknown User";
                                const counterpartyEmail = counterparty?.email || "No email available";

                                return (
                                    <div
                                        key={tx._id}
                                        onClick={() => setSelectedTransaction(tx)}
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 cursor-pointer transition hover:bg-indigo-50/40"
                                        title="Click to view receipt"
                                    >
                                        {/* Left Side: Avatar + Info */}
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-xs transition group-hover:scale-105 ${
                                                    isCredit
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : "bg-rose-50 text-rose-600"
                                                }`}
                                            >
                                                {isCredit ? (
                                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
                                                    </svg>
                                                ) : (
                                                    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                                    </svg>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                                                        {isCredit ? `Received from ${counterpartyName}` : `Sent to ${counterpartyName}`}
                                                    </span>
                                                    {getStatusBadge(tx.status)}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                    <span>{counterpartyEmail}</span>
                                                    <span className="hidden sm:inline text-gray-300">•</span>
                                                    <span className="font-medium text-gray-600">{formatDate(tx.createdAt)}</span>
                                                    {tx.description && tx.description !== "Money Transfer" && (
                                                        <>
                                                            <span className="hidden sm:inline text-gray-300">•</span>
                                                            <span className="italic">{tx.description}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Amount & Receipt Button */}
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                                            <span
                                                className={`text-lg font-bold tracking-tight ${
                                                    isCredit ? "text-emerald-600" : "text-rose-600"
                                                }`}
                                            >
                                                {isCredit ? "+" : "-"} ₹{Number(tx.amount || 0).toFixed(2)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium group-hover:underline mt-0.5">
                                                <span>View Receipt</span>
                                                <svg className="size-3 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-gray-50/50 px-5 py-4">
                            <div className="text-sm text-gray-600">
                                Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
                                <span className="font-semibold text-gray-900">{totalPages || 1}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage <= 1 || isLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                    </svg>
                                    Previous
                                </button>

                                <button
                                    onClick={handleNextPage}
                                    disabled={!hasNextPage || currentPage >= totalPages || isLoading}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Receipt Modal */}
            {selectedTransaction && (
                <ReceiptModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                />
            )}
        </div>
    );
}
