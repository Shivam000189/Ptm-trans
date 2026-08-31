import { useState } from "react";

export default function ReceiptModal({ transaction, onClose }) {
    const [copied, setCopied] = useState(false);

    if (!transaction) return null;

    const isCredit = transaction.type === "credit";
    const amount = Number(transaction.amount || 0).toFixed(2);

    const senderName = transaction.sender
        ? `${transaction.sender.firstName || ""} ${transaction.sender.lastName || ""}`.trim()
        : "Unknown Sender";
    const senderEmail = transaction.sender?.email || "N/A";

    const recipientName = transaction.recipient
        ? `${transaction.recipient.firstName || ""} ${transaction.recipient.lastName || ""}`.trim()
        : "Unknown Recipient";
    const recipientEmail = transaction.recipient?.email || "N/A";

    // Format full date & time
    const formatFullDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    };

    const handleCopyId = () => {
        if (transaction._id) {
            navigator.clipboard.writeText(transaction._id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="fixed inset-0"
                onClick={onClose}
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 transition-all">
                {/* Decorative Top Accent Bar */}
                <div className={`h-2.5 w-full ${isCredit ? "bg-emerald-500" : "bg-indigo-600"}`} />

                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
                    title="Close"
                >
                    ✕
                </button>

                <div className="p-6 sm:p-8">
                    {/* Header Section */}
                    <div className="text-center">
                        <div
                            className={`mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl shadow-inner ${
                                isCredit
                                    ? "bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50"
                                    : "bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50"
                            }`}
                        >
                            {isCredit ? (
                                <svg className="size-7" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            ) : (
                                <svg className="size-7" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                </svg>
                            )}
                        </div>

                        <span className="inline-block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Transaction Receipt
                        </span>
                        <h2 className="text-xl font-extrabold text-gray-900">
                            {isCredit ? "Money Received" : "Money Sent"}
                        </h2>

                        {/* Large Amount */}
                        <div className="mt-3">
                            <span
                                className={`text-4xl font-black tracking-tight ${
                                    isCredit ? "text-emerald-600" : "text-gray-900"
                                }`}
                            >
                                {isCredit ? "+" : "-"}₹{amount}
                            </span>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                            Payment Successful
                        </div>
                    </div>

                    {/* Receipt Details Card */}
                    <div className="mt-6 rounded-2xl bg-gray-50/80 p-4 sm:p-5 border border-gray-200/80 space-y-3.5 text-sm">
                        {/* Transaction Time */}
                        <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-3">
                            <span className="text-gray-500 shrink-0 font-medium">Date & Time</span>
                            <span className="text-right font-semibold text-gray-900">
                                {formatFullDateTime(transaction.createdAt)}
                            </span>
                        </div>

                        {/* Sender */}
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-gray-500 shrink-0 font-medium">From (Sender)</span>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{senderName}</p>
                                <p className="text-xs text-gray-500">{senderEmail}</p>
                            </div>
                        </div>

                        {/* Recipient */}
                        <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-3">
                            <span className="text-gray-500 shrink-0 font-medium">To (Recipient)</span>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">{recipientName}</p>
                                <p className="text-xs text-gray-500">{recipientEmail}</p>
                            </div>
                        </div>

                        {/* Type & Description */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Transaction Type</span>
                            <span className="font-semibold text-gray-800 capitalize">
                                {transaction.type} Transfer
                            </span>
                        </div>

                        {transaction.description && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 font-medium">Description</span>
                                <span className="text-gray-700">{transaction.description}</span>
                            </div>
                        )}

                        {/* Transaction Reference ID */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                            <span className="text-gray-400 font-medium">Reference ID</span>
                            <div className="flex items-center gap-1.5 font-mono text-gray-600">
                                <span className="truncate max-w-[170px]">{transaction._id}</span>
                                <button
                                    onClick={handleCopyId}
                                    title="Copy ID"
                                    className="cursor-pointer p-1 text-gray-400 hover:text-indigo-600 transition"
                                >
                                    {copied ? (
                                        <span className="text-[10px] font-sans font-bold text-emerald-600">Copied!</span>
                                    ) : (
                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
                        >
                            <svg className="size-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                            </svg>
                            Print Receipt
                        </button>

                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
