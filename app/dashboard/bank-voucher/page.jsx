"use client";
import { useEffect, useState } from "react";

export default function BankVoucher() {
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [formData, setFormData] = useState({
    from_account_type: "",
    from_account_id: "",
    to_account_type: "",
    to_account_id: "",
    amount: "",
    transfer_date: "",
    description: "",
  });
  const [addMoneyForm, setAddMoneyForm] = useState({
    account_type: "",
    account_id: "",
    amount: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset dependent fields when account type changes
    if (name === 'from_account_type') {
      setFormData({ 
        ...formData, 
        [name]: value,
        from_account_id: ""
      });
    } else if (name === 'to_account_type') {
      setFormData({ 
        ...formData, 
        [name]: value,
        to_account_id: ""
      });
    } else {
      setFormData({ ...formData, [name]: value });
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

  const fetchTransfers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/bank-voucher", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch transfers");
      }

      const data = await res.json();
      setTransfers(data.transfers);
    } catch (err) {
      console.error("Fetch Transfers Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchAccounts(), fetchTransfers()]);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.from_account_type === formData.to_account_type && 
        formData.from_account_id === formData.to_account_id) {
      alert("Cannot transfer to the same account");
      return;
    }

    try {
      console.log("Submitting transfer:", formData);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/bank-voucher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Reset form
      setFormData({
        from_account_type: "",
        from_account_id: "",
        to_account_type: "",
        to_account_id: "",
        amount: "",
        transfer_date: "",
        description: "",
      });

      setShowTransferForm(false);
      
      // Refresh data
      await Promise.all([fetchAccounts(), fetchTransfers()]);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleView = (transfer) => {
    setViewData(transfer);
    setShowViewModal(true);
  };

  const openTransferForm = () => {
    setFormData({
      from_account_type: "",
      from_account_id: "",
      to_account_type: "",
      to_account_id: "",
      amount: "",
      transfer_date: new Date().toISOString().split('T')[0],
      description: "",
    });
    setShowTransferForm(true);
  };

  const handleAddMoneyChange = (e) => {
    const { name, value } = e.target;
    if (name === "account_type") {
      setAddMoneyForm({ ...addMoneyForm, [name]: value, account_id: "" });
    } else {
      setAddMoneyForm({ ...addMoneyForm, [name]: value });
    }
  };

 const handleAddMoney = async (e) => {
  e.preventDefault();
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/bank-voucher", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: addMoneyForm.account_id,
        amount: parseFloat(addMoneyForm.amount),
        action: "add_balance",
      }),
    });

    // Safe JSON parse — 405/empty responses have no body
    let data = {};
    try { data = await res.json(); } catch {}

    if (!res.ok) throw new Error(data.message || "Failed to add money");

    setAddMoneyForm({ account_type: "", account_id: "", amount: "", description: "" });
    setShowAddMoneyModal(false);
    await Promise.all([fetchAccounts(), fetchTransfers()]);
    alert("Money added successfully!");
  } catch (err) {
    console.error("Error adding money:", err);
    alert(err.message || "Failed to add money. Please try again.");
  }
};
  const openAddMoneyModal = () => {
    setAddMoneyForm({
      account_type: "",
      account_id: "",
      amount: "",
      description: "",
    });
    setShowAddMoneyModal(true);
  };

  // Separate accounts by type
  const bankAccounts = accounts.filter(acc => acc.account_type === 'bank');
  const cashAccounts = accounts.filter(acc => acc.account_type === 'cash');

  // Calculate totals
  const totalBankBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  const totalCashBalance = cashAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  const totalBalance = totalBankBalance + totalCashBalance;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Bank Voucher
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage account balances and transfers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddMoneyModal}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Money
            </button>
            <button
              onClick={openTransferForm}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer Money
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Bank Balance</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">₹{totalBankBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{bankAccounts.length} accounts</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Cash Balance</p>
                <p className="text-3xl font-bold text-green-600 mt-1">₹{totalCashBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{cashAccounts.length} accounts</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">₹{totalBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">All accounts</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Balances Section */}
      <div className="px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bank Accounts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Bank Accounts
              </h3>
            </div>
            <div className="p-6">
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-3xl mb-2 block">🏦</span>
                  <p className="text-sm">No bank accounts found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500">{account.account_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">₹{account.current_balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash Accounts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cash in Hand
              </h3>
            </div>
            <div className="p-6">
              {cashAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="text-3xl mb-2 block">💵</span>
                  <p className="text-sm">No cash accounts found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cashAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{account.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{account.current_balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer History */}
      <div className="mx-8 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Transfer History</h3>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-24 ml-auto" />
                </div>
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">💸</span>
              <p className="text-base font-medium text-gray-500">No transfers yet</p>
              <p className="text-sm mt-1">Click "Transfer Money" to make your first transfer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">To</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(transfer.transfer_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            transfer.from_account_type === 'bank' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></span>
                          <span className="font-medium text-gray-900">{transfer.from_account_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            transfer.to_account_type === 'bank' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></span>
                          <span className="font-medium text-gray-900">{transfer.to_account_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-purple-600">
                        ₹{transfer.amount}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {transfer.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleView(transfer)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            View
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
        {!loading && transfers.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {transfers.length} transfer{transfers.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div> 

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowAddMoneyModal(false)}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Money</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Increase cash or bank balance
                </p>
              </div>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddMoney}>
              <div className="px-6 py-5 flex flex-col gap-4">
                {/* Account Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account Type *
                  </label>
                  <select
                    name="account_type"
                    value={addMoneyForm.account_type}
                    onChange={handleAddMoneyChange}
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="">Select Account Type</option>
                    <option value="bank">Bank Account</option>
                    <option value="cash">Cash in Hand</option>
                  </select>
                </div>

                {/* Account Selection */}
                {addMoneyForm.account_type && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Select Account *
                    </label>
                    <select
                      name="account_id"
                      value={addMoneyForm.account_id}
                      onChange={handleAddMoneyChange}
                      required
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    >
                      <option value="">Select Account</option>
                      {(addMoneyForm.account_type === 'bank' ? bankAccounts : cashAccounts).map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} {account.account_number ? `- ${account.account_number}` : ''} (₹{account.current_balance})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={addMoneyForm.amount}
                    onChange={handleAddMoneyChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={addMoneyForm.description}
                    onChange={handleAddMoneyChange}
                    placeholder="e.g., Capital injection, Loan received"
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-lg transition-colors shadow-sm"
                >
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     {/* Transfer Form Modal */}
      {showTransferForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
          onClick={(e) => e.target === e.currentTarget && setShowTransferForm(false)}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Transfer Money</h2>
              <button
                onClick={() => setShowTransferForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                
                {/* Transfer Details Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Transfer Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Transfer Date */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Transfer Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="transfer_date"
                          value={formData.transfer_date}
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
                          min="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* From Account Section */}
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <h4 className="text-sm font-semibold text-red-700 mb-3">From Account (Money will be deducted)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* From Account Type */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Account Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="from_account_type"
                            value={formData.from_account_type}
                            onChange={handleChange}
                            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                            required
                          >
                            <option value="">Select Type</option>
                            <option value="bank">Bank Account</option>
                            <option value="cash">Cash Account</option>
                          </select>
                        </div>

                        {/* From Account */}
                        {formData.from_account_type && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Account <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="from_account_id"
                              value={formData.from_account_id}
                              onChange={handleChange}
                              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                              required
                            >
                              <option value="">Select Account</option>
                              {(formData.from_account_type === 'bank' ? bankAccounts : cashAccounts).map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} {acc.account_number ? `- ${acc.account_number}` : ''} (₹{acc.current_balance})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* To Account Section */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <h4 className="text-sm font-semibold text-green-700 mb-3">To Account (Money will be added)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* To Account Type */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Account Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="to_account_type"
                            value={formData.to_account_type}
                            onChange={handleChange}
                            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                            required
                          >
                            <option value="">Select Type</option>
                            <option value="bank">Bank Account</option>
                            <option value="cash">Cash Account</option>
                          </select>
                        </div>

                        {/* To Account */}
                        {formData.to_account_type && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Account <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="to_account_id"
                              value={formData.to_account_id}
                              onChange={handleChange}
                              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                              required
                            >
                              <option value="">Select Account</option>
                              {(formData.to_account_type === 'bank' ? bankAccounts : cashAccounts)
                                .filter(acc => !(formData.from_account_type === formData.to_account_type && acc.id == formData.from_account_id))
                                .map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} {acc.account_number ? `- ${acc.account_number}` : ''} (₹{acc.current_balance})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        name="description"
                        placeholder="Reason for transfer..."
                        value={formData.description}
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
                  onClick={() => setShowTransferForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm"
                >
                  Transfer Money
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
              <h2 className="text-lg font-semibold text-gray-900">Transfer Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Transfer Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(viewData.transfer_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-2xl font-bold text-purple-600">₹{viewData.amount}</p>
                </div>
              </div>

              {/* Transfer Flow */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Transfer Flow</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      viewData.from_account_type === 'bank' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {viewData.from_account_type === 'bank' ? (
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{viewData.from_account_name}</p>
                    <p className="text-xs text-gray-500">From</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      viewData.to_account_type === 'bank' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {viewData.to_account_type === 'bank' ? (
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{viewData.to_account_name}</p>
                    <p className="text-xs text-gray-500">To</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {viewData.description && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-gray-700">{viewData.description}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
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