"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    expense_date: "",
    amount: "",
    description: "",
    category: "",
    payment_method: "Cash",
    account_id: "",
  });

  const categories = [
    "Office Supplies",
    "Travel & Transportation",
    "Utilities",
    "Marketing & Advertising",
    "Professional Services",
    "Equipment & Software",
    "Rent & Facilities",
    "Insurance",
    "Meals & Entertainment",
    "Training & Development",
    "Other",
  ];

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

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/expense", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }

      const data = await res.json();
      setExpenses(data.expenses);
    } catch (err) {
      console.error("Fetch Expenses Error:", err.message);
    } finally {
      setLoading(false);
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
      console.error("Fetch Accounts Error:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchExpenses(), fetchAccounts()]);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const method = editId ? "PUT" : "POST";

      const res = await fetch("/api/expense", {
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
        expense_date: "",
        amount: "",
        description: "",
        category: "",
        payment_method: "Cash",
        account_id: "",
      });

      setEditId(null);
      setShowForm(false);

      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/expense", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      expense_date: expense.expense_date || "",
      amount: expense.amount || "",
      description: expense.description || "",
      category: expense.category || "",
      payment_method: expense.payment_method || "Cash",
      account_id: expense.account_id || "",
    });
    setEditId(expense.id);
    setShowForm(true);
  };

  const handleView = (expense) => {
    setViewData(expense);
    setShowViewModal(true);
  };

  const openAddForm = () => {
    setFormData({
      expense_date: "",
      amount: "",
      description: "",
      category: "",
      payment_method: "Cash",
      account_id: "",
    });
    setEditId(null);
    setShowForm(true);
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const exportToExcel = () => {
    if (expenses.length === 0) {
      alert("No expenses data to export");
      return;
    }

    // Prepare data for export
    const exportData = expenses.map((expense) => ({
      Date: new Date(expense.expense_date).toLocaleDateString(),
      Category: expense.category,
      Description: expense.description,
      Amount: expense.amount,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Category
      { wch: 40 }, // Description
      { wch: 15 }, // Amount
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    // Generate filename with current date
    const today = new Date();
    const filename = `Expenses_Export_${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Expenses
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Track and manage business expenses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">📊</span>
              Export Excel
            </button>
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Add Expense
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-5 shadow-sm max-w-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Expenses
              </p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                ₹{totalExpenses.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Business expenses</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
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
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-4 bg-gray-100 rounded w-24 ml-auto" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">💸</span>
              <p className="text-base font-medium text-gray-500">
                No expenses yet
              </p>
              <p className="text-sm mt-1">
                Click "Add Expense" to record your first expense.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 max-w-xs truncate">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          {expense.payment_method || 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {expense.account_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        ₹{expense.amount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(expense)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(expense)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
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
        {!loading && expenses.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} total
          </p>
        )}
      </div>
      {/* 
Add/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Edit Expense" : "Add New Expense"}
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
                {/* Expense Details Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                    Expense Details
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Expense Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="expense_date"
                          value={formData.expense_date}
                          onChange={handleChange}
                          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                          required
                        />
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
                    </div>

                    {/* Category */}
                    {/* Category */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
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

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        placeholder="Describe the expense..."
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition resize-none"
                        required
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
                  {editId ? "Update Expense" : "Save Expense"}
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
          onClick={(e) =>
            e.target === e.currentTarget && setShowViewModal(false)
          }
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Expense Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Expense Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(viewData.expense_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white rounded-lg p-4 border border-red-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Amount
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{viewData.amount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Category
                  </p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg">
                    {viewData.category}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </p>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                    {viewData.payment_method || 'Cash'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Account Used
                  </p>
                  <p className="text-sm text-gray-600">
                    {viewData.account_name || 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Created
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(viewData.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  Description
                </p>
                <p className="text-gray-700">{viewData.description}</p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewData);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Edit Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
