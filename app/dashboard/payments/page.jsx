"use client";
import { useEffect, useState } from "react";

export default function Payments() {
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, received, paid
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [formData, setFormData] = useState({
    party_id: "",
    payment_date: "",
    payment_type: "",
    amount: "",
    payment_method: "",
    account_id: "",
    reference_number: "",
    notes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset account_id when payment method changes
    if (name === 'payment_method') {
      setFormData({ 
        ...formData, 
        [name]: value,
        account_id: "" // Reset account selection
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }

      const data = await res.json();
      setPayments(data.payments);
    } catch (err) {
      console.error("Fetch Payments Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalExpenses = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/expense/total", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch expenses");
      }

      const data = await res.json();
      setTotalExpenses(Number(data.total_expenses) || 0);
    } catch (err) {
      console.error("Fetch Total Expenses Error:", err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchPayments(), fetchTotalExpenses()]);
    };
    fetchData();
  }, []);

  const fetchParties = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/parties", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setParties(data.parties);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAccounts(data.accounts);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const method = editId ? "PUT" : "POST";

      const res = await fetch("/api/payments", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setFormData({
        party_id: "",
        payment_date: "",
        payment_type: "",
        amount: "",
        payment_method: "",
        account_id: "",
        reference_number: "",
        notes: "",
      });

      setEditId(null);
      setShowForm(false);

      fetchPayments();
      fetchTotalExpenses(); // Refresh expenses total
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this payment record?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      fetchPayments();
      fetchTotalExpenses(); // Refresh expenses total
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      party_id: payment.party_id || "",
      payment_date: payment.payment_date
        ? payment.payment_date.split("T")[0]
        : "",
      payment_type: payment.payment_type || "",
      amount: payment.amount || "",
      payment_method: payment.payment_method || "",
      account_id: payment.account_id || "",
      reference_number: payment.reference_number || "",
      notes: payment.notes || "",
    });
    setEditId(payment.id);
    setShowForm(true);
  };

  const handleView = (payment) => {
    setViewData(payment);
    setShowViewModal(true);
  };

  const openFormWithType = (type) => {
    setFormData({
      party_id: "",
      payment_date: "",
      payment_type: type,
      amount: "",
      payment_method: "",
      account_id: "",
      reference_number: "",
      notes: "",
    });
    setEditId(null);
    setShowForm(true);
  };

  // Calculate totals
  const totalReceived = payments
    .filter((p) => p.payment_type === "received")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPaid = payments
    .filter((p) => p.payment_type === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Calculate net amount (Total Received - Total Expenses)
  const netAmount = totalReceived - totalExpenses-totalPaid.toFixed(2);

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (filterType === "all") return true;
    if (filterType === "received") return p.payment_type === "received";
    if (filterType === "paid") return p.payment_type === "paid";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Payments</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage incoming & outgoing payments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => openFormWithType("received")}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              In Payment
            </button>
            <button
              onClick={() => openFormWithType("paid")}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Out Payment
            </button>
            <button
              onClick={() => {
                setFormData({
                  party_id: "",
                  payment_date: "",
                  payment_type: "",
                  amount: "",
                  payment_method: "",
                  account_id: "",
                  reference_number: "",
                  notes: "",
                });
                setEditId(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Record Payment
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Received</p>
                <p className="text-3xl font-bold text-green-600 mt-1">₹{totalReceived.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">From customers</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600 mt-1">₹{totalExpenses.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Business expenses</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Paid</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">₹{totalPaid.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">To vendors</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br ${netAmount >= 0 ? 'from-blue-50 to-white border-blue-100' : 'from-purple-50 to-white border-purple-100'} rounded-xl border p-5 shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Net Amount</p>
                <p className={`text-3xl font-bold mt-1 ${netAmount >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                  ₹{netAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Received - Expenses - Total Paid</p>
              </div>
              <div className={`${netAmount >= 0 ? 'bg-blue-100' : 'bg-purple-100'} p-3 rounded-lg`}>
                <svg className={`w-6 h-6 ${netAmount >= 0 ? 'text-blue-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterType === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setFilterType("received")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterType === "received"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setFilterType("paid")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterType === "paid"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="mx-8 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                  <div className="h-4 bg-gray-100 rounded w-24 ml-auto" />
                  <div className="h-4 bg-gray-100 rounded w-28" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-36" />
                </div>
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">💰</span>
              <p className="text-base font-medium text-gray-500">No payments found</p>
              <p className="text-sm mt-1">Click "Record Payment" to add your first payment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{payment.party_name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.payment_type === "received"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {payment.payment_type === "received" ? "Received" : "Paid"}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${
                        payment.payment_type === "received" ? "text-green-600" : "text-red-600"
                      }`}>
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {payment.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {payment.account_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {payment.reference_number || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(payment)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(payment)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row count */}
        {!loading && filteredPayments.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Edit Payment" : "Record Payment"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                
                {/* Payment Details Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Payment Details
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Party */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Party <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="party_id"
                        value={formData.party_id}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                        required
                      >
                        <option value="">Select Party</option>
                        {parties
                          .filter((party, index, self) => 
                            index === self.findIndex(p => p.id === party.id)
                          )
                          .map((p, index) => (
                          <option key={`party-${p.id}-${index}`} value={p.id}>
                            {p.name} ({p.party_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Payment Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Payment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="payment_date"
                          value={formData.payment_date}
                          onChange={handleChange}
                          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                          required
                        />
                      </div>

                      {/* Payment Type */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Payment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="payment_type"
                          value={formData.payment_type}
                          onChange={handleChange}
                          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                          required
                        >
                          <option value="">Select Type</option>
                          <option value="received">Payment Received (From Customer)</option>
                          <option value="paid">Payment Made (To Vendor)</option>
                        </select>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="amount"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                        step="0.01"
                        required
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Payment Method <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                        required
                      >
                        <option value="">Select Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Account Selection */}
                    {formData.payment_method && formData.payment_method !== 'Other' && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {formData.payment_method === 'Cash' ? 'Cash Account' : 'Bank Account'} <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="account_id"
                          value={formData.account_id}
                          onChange={handleChange}
                          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                          required
                        >
                          <option value="">Select Account</option>
                          {formData.payment_method === 'Cash' 
                            ? accounts.filter(acc => acc.account_type === 'cash').map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} (₹{acc.current_balance})
                                </option>
                              ))
                            : accounts.filter(acc => acc.account_type === 'bank').map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} - {acc.account_number} (₹{acc.current_balance})
                                </option>
                              ))
                          }
                        </select>
                      </div>
                    )}

                    {/* Reference Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Reference Number
                      </label>
                      <input
                        type="text"
                        name="reference_number"
                        placeholder="Transaction ID, Cheque No, etc."
                        value={formData.reference_number}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        placeholder="Additional notes..."
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm"
                >
                  {editId ? "Update Payment" : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
          onClick={(e) => e.target === e.currentTarget && setShowViewModal(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              
              {/* Payment Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Party</p>
                  <p className="text-lg font-semibold text-gray-900">{viewData.party_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(viewData.payment_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Type</p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                    viewData.payment_type === "received"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {viewData.payment_type === "received" ? "Payment Received" : "Payment Made"}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className={`text-2xl font-bold ${
                    viewData.payment_type === "received" ? "text-green-600" : "text-red-600"
                  }`}>
                    ₹{viewData.amount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="font-semibold text-gray-900">{viewData.payment_method}</p>
                </div>
                {viewData.reference_number && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reference Number</p>
                    <p className="font-semibold text-gray-900 font-mono text-sm">{viewData.reference_number}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {viewData.notes && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-gray-700">{viewData.notes}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";

// export default function Payments() {
//   const [showForm, setShowForm] = useState(false);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [viewData, setViewData] = useState(null);
//   const [payments, setPayments] = useState([]);
//   const [parties, setParties] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editId, setEditId] = useState(null);
//   const [filterType, setFilterType] = useState("all"); // all, received, paid
//   const [formData, setFormData] = useState({
//     party_id: "",
//     payment_date: "",
//     payment_type: "",
//     amount: "",
//     payment_method: "",
//     reference_number: "",
//     notes: "",
//   });

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const fetchPayments = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/payments", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         throw new Error(text || "Failed to fetch");
//       }

//       const data = await res.json();
//       setPayments(data.payments);
//     } catch (err) {
//       console.error("Fetch Payments Error:", err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPayments();
//   }, []);

//   const fetchParties = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/parties", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       setParties(data.parties);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchParties();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const token = localStorage.getItem("token");

//       const method = editId ? "PUT" : "POST";

//       const res = await fetch("/api/payments", {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       setFormData({
//         party_id: "",
//         payment_date: "",
//         payment_type: "",
//         amount: "",
//         payment_method: "",
//         reference_number: "",
//         notes: "",
//       });

//       setEditId(null);
//       setShowForm(false);

//       fetchPayments();
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure?")) return;

//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/payments", {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ id }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       fetchPayments();
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const handleEdit = (payment) => {
//     setFormData({
//       party_id: payment.party_id || "",
//       payment_date: payment.payment_date
//         ? payment.payment_date.split("T")[0]
//         : "",
//       payment_type: payment.payment_type || "",
//       amount: payment.amount || "",
//       payment_method: payment.payment_method || "",
//       reference_number: payment.reference_number || "",
//       notes: payment.notes || "",
//     });
//     setEditId(payment.id);
//     setShowForm(true);
//   };

//   const handleView = (payment) => {
//     setViewData(payment);
//     setShowViewModal(true);
//   };

//   const openFormWithType = (type) => {
//     setFormData({
//       party_id: "",
//       payment_date: "",
//       payment_type: type,
//       amount: "",
//       payment_method: "",
//       reference_number: "",
//       notes: "",
//     });
//     setEditId(null);
//     setShowForm(true);
//   };

//   // Calculate totals
//   const totalReceived = payments
//     .filter((p) => p.payment_type === "received")
//     .reduce((sum, p) => sum + Number(p.amount), 0);

//   const totalPaid = payments
//     .filter((p) => p.payment_type === "paid")
//     .reduce((sum, p) => sum + Number(p.amount), 0);

//   // Filter payments
//   const filteredPayments = payments.filter((p) => {
//     if (filterType === "all") return true;
//     if (filterType === "received") return p.payment_type === "received";
//     if (filterType === "paid") return p.payment_type === "paid";
//     return true;
//   });

//   return (
//     <>
//       {/* Header */}
//       <div className="p-6 bg-zinc-50">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold">Payments</h1>
//           <div className="flex gap-3">
//             <button
//               onClick={() => openFormWithType("received")}
//               className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
//             >
//               <span>↓</span> In Payment
//             </button>
//             <button
//               onClick={() => openFormWithType("paid")}
//               className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
//             >
//               <span>↑</span> Out Payment
//             </button>
//             <button
//               onClick={() => {
//                 setShowForm(true);
//                 setEditId(null);
//               }}
//               className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
//             >
//               + Record Payment
//             </button>
//           </div>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-2 gap-4 mb-6">
//           <div className="bg-white p-6 rounded shadow">
//             <div className="flex items-start gap-4">
//               <div className="bg-green-100 p-3 rounded">
//                 <span className="text-green-600 text-2xl">↓</span>
//               </div>
//               <div>
//                 <p className="text-gray-600 text-sm">Total Received</p>
//                 <p className="text-2xl font-bold text-green-600">
//                   ₹{totalReceived.toFixed(2)}
//                 </p>
//                 <p className="text-gray-500 text-xs">From customers</p>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white p-6 rounded shadow">
//             <div className="flex items-start gap-4">
//               <div className="bg-red-100 p-3 rounded">
//                 <span className="text-red-600 text-2xl">↑</span>
//               </div>
//               <div>
//                 <p className="text-gray-600 text-sm">Total Paid</p>
//                 <p className="text-2xl font-bold text-red-600">
//                   ₹{totalPaid.toFixed(2)}
//                 </p>
//                 <p className="text-gray-500 text-xs">To vendors</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded shadow overflow-x-auto mx-6">
//         {loading ? (
//           <p className="p-4">Loading...</p>
//         ) : filteredPayments.length === 0 ? (
//           <p className="p-4">No Payments found</p>
//         ) : (
//           <table className="w-full">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 text-left">DATE</th>
//                 <th className="p-3 text-left">PARTY</th>
//                 <th className="p-3 text-left">TYPE</th>
//                 <th className="p-3 text-right">AMOUNT</th>
//                 <th className="p-3 text-left">METHOD</th>
//                 <th className="p-3 text-left">REFERENCE</th>
//                 <th className="p-3 text-center">ACTIONS</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredPayments.map((payment) => (
//                 <tr key={payment.id} className="border-t">
//                   <td className="p-3 text-left">
//                     {new Date(payment.payment_date).toLocaleDateString()}
//                   </td>
//                   <td className="p-3 text-left">{payment.party_name}</td>
//                   <td className="p-3 text-left">
//                     <span
//                       className={`px-2 py-1 rounded text-xs ${
//                         payment.payment_type === "received"
//                           ? "bg-green-100 text-green-700"
//                           : "bg-red-100 text-red-700"
//                       }`}
//                     >
//                       {payment.payment_type === "received"
//                         ? "Received"
//                         : "Paid"}
//                     </span>
//                   </td>
//                   <td className="p-3 text-right font-semibold">₹{payment.amount}</td>
//                   <td className="p-3 text-left">{payment.payment_method}</td>
//                   <td className="p-3 text-left">{payment.reference_number || "-"}</td>

//                   <td className="p-3">
//                     <div className="flex gap-2 justify-center">
//                       <button
//                         onClick={() => handleView(payment)}
//                         className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
//                       >
//                         View
//                       </button>

//                       <button
//                         onClick={() => handleEdit(payment)}
//                         className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
//                       >
//                         Edit
//                       </button>

//                       <button
//                         onClick={() => handleDelete(payment.id)}
//                         className="bg-red-600 text-white px-3 py-1 rounded text-sm"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Modal */}
//       {showForm && (
//         <div className="fixed inset-0 flex justify-center items-center bg-black/30 overflow-auto p-6">
//           <div className="bg-white p-6 rounded w-full max-w-2xl shadow-lg">
//             <h2 className="text-xl mb-4 font-semibold">
//               {editId ? "Edit Payment" : "Record Payment"}
//             </h2>

//             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//               <h3 className="font-semibold">Payment Details</h3>

//               {/* Party */}
//               <div>
//                 <label className="block text-sm mb-1">
//                   Party <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="party_id"
//                   value={formData.party_id}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                   required
//                 >
//                   <option value="">Select Party</option>
//                   {parties.map((p) => (
//                     <option key={p.id} value={p.id}>
//                       {p.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Payment Date */}
//               <div>
//                 <label className="block text-sm mb-1">
//                   Payment Date <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="date"
//                   name="payment_date"
//                   value={formData.payment_date}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                   required
//                 />
//               </div>

//               {/* Payment Type */}
//               <div>
//                 <label className="block text-sm mb-1">
//                   Payment Type <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="payment_type"
//                   value={formData.payment_type}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                   required
//                 >
//                   <option value="">Select Type</option>
//                   <option value="received">Payment Received (From Customer)</option>
//                   <option value="paid">Payment Made (To Vendor)</option>
//                 </select>
//               </div>

//               {/* Amount */}
//               <div>
//                 <label className="block text-sm mb-1">
//                   Amount <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="amount"
//                   placeholder="₹"
//                   value={formData.amount}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                   step="0.01"
//                   required
//                 />
//               </div>

//               {/* Payment Method */}
//               <div>
//                 <label className="block text-sm mb-1">
//                   Payment Method <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="payment_method"
//                   value={formData.payment_method}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                   required
//                 >
//                   <option value="">Select Method</option>
//                   <option value="Cash">Cash</option>
//                   <option value="Bank Transfer">Bank Transfer</option>
//                   <option value="Cheque">Cheque</option>
//                   <option value="UPI">UPI</option>
//                   <option value="Card">Card</option>
//                   <option value="Other">Other</option>
//                 </select>
//               </div>

//               {/* Reference Number */}
//               <div>
//                 <label className="block text-sm mb-1">Reference Number</label>
//                 <input
//                   type="text"
//                   name="reference_number"
//                   placeholder="Transaction ID, Cheque No, etc."
//                   value={formData.reference_number}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                 />
//               </div>

//               {/* Notes */}
//               <div>
//                 <label className="block text-sm mb-1">Notes (Optional)</label>
//                 <textarea
//                   name="notes"
//                   placeholder="Additional notes..."
//                   value={formData.notes}
//                   onChange={handleChange}
//                   className="border p-2 rounded w-full"
//                   rows="3"
//                 />
//               </div>

//               {/* Buttons */}
//               <div className="flex justify-end gap-2 mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowForm(false)}
//                   className="border px-4 py-2 rounded"
//                 >
//                   Cancel
//                 </button>

//                 <button className="bg-blue-600 text-white px-4 py-2 rounded">
//                   Save Payment
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* View Modal */}
//       {showViewModal && viewData && (
//         <div className="fixed inset-0 flex justify-center items-center bg-black/30 overflow-auto p-6 z-50">
//           <div className="bg-white p-6 rounded w-full max-w-2xl shadow-lg">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">Payment Details</h2>
//               <button
//                 onClick={() => setShowViewModal(false)}
//                 className="text-gray-500 hover:text-gray-700 text-2xl"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="space-y-4">
//               {/* Payment Info */}
//               <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
//                 <div>
//                   <p className="text-sm text-gray-600">Party</p>
//                   <p className="font-semibold">{viewData.party_name}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Date</p>
//                   <p className="font-semibold">
//                     {new Date(viewData.payment_date).toLocaleDateString()}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Payment Type</p>
//                   <span
//                     className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
//                       viewData.payment_type === "received"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-red-100 text-red-700"
//                     }`}
//                   >
//                     {viewData.payment_type === "received"
//                       ? "Payment Received"
//                       : "Payment Made"}
//                   </span>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Amount</p>
//                   <p className="font-bold text-xl">₹{viewData.amount}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Payment Method</p>
//                   <p className="font-semibold">{viewData.payment_method}</p>
//                 </div>
//                 {viewData.reference_number && (
//                   <div>
//                     <p className="text-sm text-gray-600">Reference Number</p>
//                     <p className="font-semibold">{viewData.reference_number}</p>
//                   </div>
//                 )}
//               </div>

//               {/* Notes */}
//               {viewData.notes && (
//                 <div className="p-4 bg-blue-50 rounded">
//                   <p className="text-sm text-gray-600 mb-1">Notes</p>
//                   <p>{viewData.notes}</p>
//                 </div>
//               )}

//               <div className="flex justify-end">
//                 <button
//                   onClick={() => setShowViewModal(false)}
//                   className="bg-gray-500 text-white px-6 py-2 rounded"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
