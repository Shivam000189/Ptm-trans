import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import ReceiptModal from "../components/ReceiptModal";

export default function Dashboard() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [balance, setBalance] = useState(0);
    const [users, setUsers] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Notifications state
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
    const dropdownRef = useRef(null);

    const loadDashboard = async () => {
        try {
            const [meResponse, balanceResponse, usersResponse, historyResponse] = await Promise.all([
                API.get("/auth/me"),
                API.get("/account/balance"),
                API.get("/auth/user/bulk"),
                API.get("/account/history", { params: { limit: 5 } }),
            ]);

            setCurrentUser(meResponse.data.user);
            setBalance(balanceResponse.data.balance);
            setUsers(usersResponse.data.users || []);
            setRecentTransactions(historyResponse.data.transactions || []);
        } catch (error) {
            console.error("Dashboard load error:", error);
            alert(error.response?.data?.message || "Unable to load dashboard data.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const res = await API.get("/notifications/unread-count");
            setUnreadCount(res.data?.count || 0);
        } catch (error) {
            console.error("Failed to fetch unread notification count:", error);
        }
    };

    const fetchNotifications = async () => {
        setIsNotificationsLoading(true);
        try {
            const res = await API.get("/notifications", { params: { limit: 5 } });
            setNotifications(res.data?.notifications || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsNotificationsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        loadDashboard();
        fetchUnreadCount();

        // Poll unread count every 30 seconds
        const pollInterval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        // Real-time auto-refresh when socket receives money
        const handleWalletUpdated = () => {
            loadDashboard();
            fetchUnreadCount();
            if (isDropdownOpen) {
                fetchNotifications();
            }
        };

        window.addEventListener("wallet:updated", handleWalletUpdated);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener("wallet:updated", handleWalletUpdated);
        };
    }, [navigate, isDropdownOpen]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Search users debounce
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

    const handleToggleDropdown = () => {
        if (!isDropdownOpen) {
            fetchNotifications();
        }
        setIsDropdownOpen((prev) => !prev);
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await API.put(`/notifications/${notif._id}/read`);
                setNotifications((prev) =>
                    prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }

        if (notif.type === "money_received" || notif.type === "money_sent" || notif.relatedTransaction) {
            setIsDropdownOpen(false);
            navigate("/transactions");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await API.put("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    const handleSendMoney = (user) => {
        navigate("/sendmoney", {
            state: { user },
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-screen items-center justify-center bg-gray-50 text-xl font-semibold text-gray-700">
                <div className="flex items-center gap-3">
                    <svg className="size-6 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-gray-50 flex flex-col">
            {/* Top Navbar */}
            <div className="w-full border-b border-gray-200 bg-white px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Payments App</h1>
                    <Link
                        to="/transactions"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Transactions
                    </Link>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <span className="hidden md:inline text-sm font-semibold text-gray-700">
                        Welcome, {currentUser?.firstName || "User"}!
                    </span>

                    {/* User Avatar */}
                    <span className="flex size-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-xs shrink-0">
                        {currentUser?.firstName?.[0]?.toUpperCase() || "U"}
                    </span>

                    {/* Notification Bell Dropdown Container */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={handleToggleDropdown}
                            className="relative flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none cursor-pointer"
                            title="Notifications"
                        >
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>

                            {/* Red Unread Count Badge */}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-xs">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Panel */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/70">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                                {unreadCount} unread
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                    {isNotificationsLoading ? (
                                        <div className="p-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                            <svg className="size-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading notifications...
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="py-10 text-center px-4">
                                            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700">No notifications yet</p>
                                            <p className="text-xs text-gray-400 mt-0.5">We&apos;ll notify you when money arrives or transfers complete.</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-gray-50/80 ${
                                                    !notif.isRead ? "bg-indigo-50/30" : ""
                                                }`}
                                            >
                                                <div
                                                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                        notif.type === "money_received"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-rose-100 text-rose-700"
                                                    }`}
                                                >
                                                    {notif.type === "money_received" ? "↓" : "↑"}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{notif.title}</p>
                                                        <span className="text-[10px] text-gray-400 shrink-0">
                                                            {formatRelativeTime(notif.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{notif.message}</p>
                                                </div>

                                                {/* Blue Dot if unread */}
                                                {!notif.isRead && (
                                                    <span className="size-2 rounded-full bg-blue-600 shrink-0 mt-1.5 ring-2 ring-blue-100"></span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/70 text-center">
                                    <Link
                                        to="/transactions"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                    >
                                        View all transactions →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8 flex-1">
                {/* Balance Card */}
                <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your Current Balance</p>
                        <p className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">
                            ₹{Number(balance).toFixed(2)}
                        </p>
                    </div>
                    <Link
                        to="/transactions"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                        View History →
                    </Link>
                </div>

                {/* Users Section */}
                <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Send Money to Users</h2>
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                        />
                    </div>

                    <div className="mt-6 divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {users.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                                        {user.firstName?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            {user.firstName} {user.lastName}
                                        </h3>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSendMoney(user)}
                                    className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
                                >
                                    Send Money
                                </button>
                            </div>
                        ))}

                        {users.length === 0 && (
                            <p className="py-6 text-center text-sm text-gray-500">No users found.</p>
                        )}
                    </div>
                </div>

                {/* Recent Transactions Section */}
                <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                        <Link
                            to="/transactions"
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                        >
                            View all ({recentTransactions.length}) →
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-gray-500">No recent transactions found.</p>
                            <p className="text-xs text-gray-400 mt-1">Send or receive money to see activities here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentTransactions.map((tx) => {
                                const isCredit = tx.type === "credit";
                                const counterparty = isCredit ? tx.sender : tx.recipient;
                                const counterpartyName = counterparty
                                    ? `${counterparty.firstName || ""} ${counterparty.lastName || ""}`.trim()
                                    : "User";

                                return (
                                    <div
                                        key={tx._id}
                                        onClick={() => setSelectedTransaction(tx)}
                                        className="group flex items-center justify-between py-3.5 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 px-2 rounded-xl transition"
                                        title="Click to view receipt"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex size-9 items-center justify-center rounded-xl transition group-hover:scale-105 ${
                                                    isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                }`}
                                            >
                                                {isCredit ? (
                                                    <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 4.5-15 15m0 0h11.25m-11.25 0V8.25" />
                                                    </svg>
                                                ) : (
                                                    <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                                    </svg>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition">
                                                    {isCredit ? `Received from ${counterpartyName}` : `Sent to ${counterpartyName}`}
                                                </p>
                                                <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p
                                                className={`text-sm font-bold ${
                                                    isCredit ? "text-emerald-600" : "text-rose-600"
                                                }`}
                                            >
                                                {isCredit ? "+" : "-"} ₹{Number(tx.amount || 0).toFixed(2)}
                                            </p>
                                            <span className="text-[11px] text-indigo-600 font-medium group-hover:underline">
                                                Receipt →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
