import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  CreditCard,
  IndianRupee,
  X,
} from "lucide-react";

const LedgerView = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [entryForm, setEntryForm] = useState({
    debtorId: "",
    amount: "",
    description: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    creditorId: "",
    amount: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchLedgerData();
  }, [id]);

  useEffect(() => {
    // Recalculate balance whenever entries change
    const newBalance = calculateBalance();
    setBalance(newBalance);
  }, [entries, user]);

  const fetchLedgerData = async () => {
    try {
      const [ledgerResponse, entriesResponse] = await Promise.all([
        axios.get("/ledgers"),
        axios.get(`/ledgers/${id}/entries`),
      ]);

      const currentLedger = ledgerResponse.data.find((l) => l._id === id);
      setLedger(currentLedger);
      setEntries(entriesResponse.data);
    } catch (error) {
      toast.error("Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();

    if (!entryForm.debtorId || !entryForm.amount || !entryForm.description) {
      toast.error("Please fill all fields");
      return;
    }

    if (parseFloat(entryForm.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/entries", {
        ledgerId: id,
        debtorId: entryForm.debtorId,
        amount: parseFloat(entryForm.amount),
        description: entryForm.description,
        type: "debt",
      });

      setShowAddEntry(false);
      setEntryForm({ debtorId: "", amount: "", description: "" });
      toast.success("Entry added successfully!");
      // Refresh data to show new entry
      fetchLedgerData();
    } catch (error) {
      toast.error("Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (
      !paymentForm.creditorId ||
      !paymentForm.amount ||
      !paymentForm.description
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (parseFloat(paymentForm.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/entries", {
        ledgerId: id,
        creditorId: paymentForm.creditorId,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description,
        type: "payment",
      });

      setShowAddPayment(false);
      setPaymentForm({ creditorId: "", amount: "", description: "" });
      toast.success("Payment recorded successfully!");
      // Refresh data to show new payment
      fetchLedgerData();
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEntryAction = async (entryId, status, action = null) => {
    try {
      const payload = action ? { action } : { status };
      await axios.patch(`/entries/${entryId}`, payload);

      if (action === "request_close") {
        toast.success("Close request sent!");
      } else if (action === "approve_close") {
        toast.success("Transaction closed successfully!");
      } else if (action === "reject_close") {
        toast.success("Close request rejected");
      } else {
        toast.success(`Entry ${status}!`);
      }

      // Refresh data to show updated status
      fetchLedgerData();
    } catch (error) {
      if (action) {
        toast.error(`Failed to ${action.replace("_", " ")}`);
      } else {
        toast.error(`Failed to ${status} entry`);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "close_requested":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "closed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "close_requested":
        return "bg-orange-100 text-orange-800";
      case "closed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const calculateBalance = () => {
    if (!user) {
      console.log("User not available for balance calculation");
      return 0;
    }

    // Try both user.id and user._id to handle different user object structures
    const userId = user.id || user._id;
    if (!userId) {
      console.log("User ID not found in user object:", user);
      return 0;
    }

    const approvedEntries = entries.filter(
      (entry) => entry.status === "approved"
    );
    // console.log("Calculating balance for user:", userId);
    // console.log("User object:", user);
    // console.log("Approved entries:", approvedEntries);

    let userOwes = 0;
    let userIsOwed = 0;

    approvedEntries.forEach((entry) => {
      // Default to 'debt' if type is not set (for backward compatibility)
      const entryType = entry.type || "debt";

      // console.log("Processing entry:", {
      //   type: entryType,
      //   amount: entry.amount,
      //   creditor: entry.creditor._id,
      //   debtor: entry.debtor._id,
      //   currentUser: userId,
      // });

      if (entryType === "debt") {
        // For debt entries: if user is debtor, they owe money; if creditor, they are owed money
        if (entry.debtor._id === userId) {
          userOwes += entry.amount;
          // console.log(`User owes +${entry.amount}, total owes: ${userOwes}`);
        } else if (entry.creditor._id === userId) {
          userIsOwed += entry.amount;
          // console.log(
          //   `User is owed +${entry.amount}, total owed: ${userIsOwed}`
          // );
        }
      } else if (entryType === "payment") {
        // For payment entries: if user is debtor (made payment), they owe less; if creditor (received payment), they are owed less
        if (entry.debtor._id === userId) {
          // User made a payment, so they owe less (reduce debt)
          userOwes -= entry.amount;
          // console.log(
          //   `User made payment -${entry.amount}, total owes: ${userOwes}`
          // );
        } else if (entry.creditor._id === userId) {
          // User received a payment, so they are owed less (reduce what others owe them)
          userIsOwed -= entry.amount;
          // console.log(
          //   `User received payment -${entry.amount}, total owed: ${userIsOwed}`
          // );
        }
      }
    });

    const finalBalance = userIsOwed - userOwes;
    // console.log(
    //   `Final calculation: ${userIsOwed} - ${userOwes} = ${finalBalance}`
    // );
    return finalBalance;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ledger not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Ledger Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {ledger.name}
            </h1>
            <div className="flex items-center mt-2 text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">
                {ledger.participants.length} participants
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {ledger.participants.map((participant) => (
                <span
                  key={participant._id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium bg-indigo-100 text-indigo-800 truncate max-w-24 sm:max-w-none"
                >
                  {participant.username}
                </span>
              ))}
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="text-sm text-gray-500">Your Balance</div>
            <div
              className={`text-xl sm:text-2xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹ {balance.toFixed(2).toString().replace("-", "")}
            </div>
            <div className="text-sm text-gray-500">
              {balance >= 0 ? "You are gived" : "You Taked"}
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry/Payment Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
          Entries
        </h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => setShowAddEntry(!showAddEntry)}
            disabled={showAddPayment}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Entry
          </button>
          {/* <button
            onClick={() => setShowAddPayment(!showAddPayment)}
            disabled={showAddEntry}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Record Payment
          </button> */}
        </div>
      </div>

      {/* Add Entry Form */}
      {showAddEntry && (
        <div className="fixed inset-0 bg-gray-400 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add New Entry
              </h3>
              <button
                onClick={() => setShowAddEntry(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who you gave money to?
                </label>
                <select
                  value={entryForm.debtorId}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, debtorId: e.target.value })
                  }
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  required
                >
                  <option value="">Select a person</option>
                  {ledger.participants
                    .filter((p) => p._id !== (user.id || user._id))
                    .map((participant) => (
                      <option key={participant._id} value={participant._id}>
                        {participant.username}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={entryForm.amount}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, amount: e.target.value })
                    }
                    className="pl-10 w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={entryForm.description}
                  onChange={(e) =>
                    setEntryForm({
                      ...entryForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  placeholder="What was this for?"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddEntry(false)}
                  className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 sm:py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm sm:text-base"
                >
                  {submitting ? "Adding..." : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Form */}
      {/* {showAddPayment && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who did you pay?
              </label>
              <select
                value={paymentForm.creditorId}
                onChange={(e) => setPaymentForm({ ...paymentForm, creditorId: e.target.value })}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                required
              >
                <option value="">Select a person</option>
                {ledger.participants
                  .filter(p => p._id !== (user.id || user._id))
                  .map((participant) => (
                    <option key={participant._id} value={participant._id}>
                      {participant.username}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="pl-10 w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Description
              </label>
              <input
                type="text"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                placeholder="Payment method or description"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={() => setShowAddPayment(false)}
                className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm sm:text-base"
              >
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )} */}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <IndianRupee className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No entries yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first entry.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry._id}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`text-lg sm:text-xl font-semibold ${
                          (entry.type || "debt") === "payment"
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {(entry.type || "debt") === "payment" ? "-" : ""}₹
                        {entry.amount.toFixed(2)}
                      </div>
                      {(entry.type || "debt") === "payment" && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Payment
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(entry.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          entry.status
                        )}`}
                      >
                        {entry.status.charAt(0).toUpperCase() +
                          entry.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-gray-900 font-medium">
                      {entry.description}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(entry.type || "debt") === "debt" ? (
                        <>
                          <span className="font-medium">
                            {entry.creditor.username}
                          </span>{" "}
                          lent to{" "}
                          <span className="font-medium">
                            {entry.debtor.username}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">
                            {entry.debtor.username}
                          </span>{" "}
                          paid{" "}
                          <span className="font-medium">
                            {entry.creditor.username}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Created {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                    {new Date(entry.createdAt).toLocaleTimeString()}
                    {entry.approvedAt && (
                      <span className="block sm:inline sm:ml-2">
                        • Approved{" "}
                        {new Date(entry.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                    {entry.closeRequestedAt && (
                      <span className="block sm:inline sm:ml-2">
                        • Close requested{" "}
                        {new Date(entry.closeRequestedAt).toLocaleDateString()}
                        {entry.closeRequestedBy &&
                          ` by ${entry.closeRequestedBy.username}`}
                      </span>
                    )}
                    {entry.closedAt && (
                      <span className="block sm:inline sm:ml-2">
                        • Closed {new Date(entry.closedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons based on entry status and user role */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-6">
                  {/* Pending entry - different logic for debt vs payment */}
                  {entry.status === "pending" && (
                    <>
                      {/* For debt entries: debtor can approve/reject */}
                      {(entry.type || "debt") === "debt" &&
                        entry.debtor._id === (user.id || user._id) && (
                          <>
                            <button
                              onClick={() =>
                                handleEntryAction(entry._id, "rejected")
                              }
                              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() =>
                                handleEntryAction(entry._id, "approved")
                              }
                              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            >
                              Approve
                            </button>
                          </>
                        )}

                      {/* For payment entries: creditor can approve/reject */}
                      {entry.type === "payment" &&
                        entry.creditor._id === (user.id || user._id) && (
                          <>
                            <button
                              onClick={() =>
                                handleEntryAction(entry._id, "rejected")
                              }
                              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              Reject Payment
                            </button>
                            <button
                              onClick={() =>
                                handleEntryAction(entry._id, "approved")
                              }
                              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            >
                              Confirm Payment
                            </button>
                          </>
                        )}

                      {/* Show waiting status for the other party */}
                      {(entry.type || "debt") === "debt" &&
                        entry.creditor._id === (user.id || user._id) && (
                          <div className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md">
                            Waiting for {entry.debtor.username} to approve
                          </div>
                        )}

                      {entry.type === "payment" &&
                        entry.debtor._id === (user.id || user._id) && (
                          <div className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md">
                            Waiting for {entry.creditor.username} to confirm
                          </div>
                        )}
                    </>
                  )}

                  {/* Approved entry - both parties can request to close (only for debt entries) */}
                  {entry.status === "approved" &&
                    (entry.type || "debt") === "debt" &&
                    (entry.creditor._id === (user.id || user._id) ||
                      entry.debtor._id === (user.id || user._id)) && (
                      <button
                        onClick={() =>
                          handleEntryAction(entry._id, null, "request_close")
                        }
                        className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        Request Close
                      </button>
                    )}

                  {/* Close requested - other party can approve/reject close (only for debt entries) */}
                  {entry.status === "close_requested" &&
                    (entry.type || "debt") === "debt" &&
                    entry.closeRequestedBy._id !== (user.id || user._id) &&
                    (entry.creditor._id === (user.id || user._id) ||
                      entry.debtor._id === (user.id || user._id)) && (
                      <>
                        <button
                          onClick={() =>
                            handleEntryAction(entry._id, null, "reject_close")
                          }
                          className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Reject Close
                        </button>
                        <button
                          onClick={() =>
                            handleEntryAction(entry._id, null, "approve_close")
                          }
                          className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Approve Close
                        </button>
                      </>
                    )}

                  {/* Show status for requester when close is requested */}
                  {entry.status === "close_requested" &&
                    (entry.type || "debt") === "debt" &&
                    entry.closeRequestedBy._id === (user.id || user._id) && (
                      <div className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-md">
                        Waiting for approval
                      </div>
                    )}

                  {/* Payment entries - show different message when approved */}
                  {entry.type === "payment" && entry.status === "approved" && (
                    <div className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md">
                      Payment Confirmed
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LedgerView;
