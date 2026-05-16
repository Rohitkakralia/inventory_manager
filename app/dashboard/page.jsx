"use client";

import { useEffect, useState } from "react";

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState({
    toCollect: 0,
    toPay: 0,
    totalCashBank: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [parties, setParties] = useState([]);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [addMoneyForm, setAddMoneyForm] = useState({
    account_type: "",
    account_id: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch parties data to calculate business metrics
      const partiesRes = await fetch("/api/parties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const partiesData = await partiesRes.json();

      if (partiesRes.ok) {
        setParties(partiesData.parties);
        await calculateBusinessMetrics(partiesData.parties, token);
      }

      // Fetch accounts for add money functionality
      try {
        const accountsRes = await fetch("/api/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          setAccounts(accountsData.accounts || []);
        }
      } catch (err) {
        console.log("Accounts API not available:", err);
      }

      // Fetch real transactions from multiple APIs
      await fetchLatestTransactions(token);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateBusinessMetrics = async (partiesData, token) => {
    let toCollect = 0;
    let toPay = 0;
    let totalCashBank = 0;

    // Calculate cash and bank balances from parties data
    partiesData.forEach((party) => {
      const balance = parseFloat(
        party.balance || party.current_balance || party.opening_balance || 0
      );

      if (
        party.party_type === "bank_account" ||
        party.party_type === "cash_in_hand"
      ) {
        totalCashBank += balance;
      }
    });

    // Get total sales amount
    let totalSales = 0;
    try {
      const salesRes = await fetch("/api/sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        totalSales = (salesData.sales || []).reduce(
          (sum, sale) => sum + Number(sale.total_amount || 0),
          0
        );
      }
    } catch (err) {
      console.log("Sales API not available for calculation:", err);
    }

    // Get total purchases amount
    let totalPurchases = 0;
    try {
      const purchasesRes = await fetch("/api/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        totalPurchases = (purchasesData.purchases || []).reduce(
          (sum, purchase) => sum + Number(purchase.total_amount || 0),
          0
        );
      }
    } catch (err) {
      console.log("Purchases API not available for calculation:", err);
    }

    // Get payment totals
    let totalReceived = 0;
    let totalPaid = 0;
    try {
      const paymentsRes = await fetch("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        totalReceived = (paymentsData.payments || [])
          .filter((p) => p.payment_type === "received")
          .reduce((sum, p) => sum + Number(p.amount), 0);

        totalPaid = (paymentsData.payments || [])
          .filter((p) => p.payment_type === "paid")
          .reduce((sum, p) => sum + Number(p.amount), 0);
      }
    } catch (err) {
      console.log("Payments API not available for calculation:", err);
    }

    // Calculate business metrics
    toCollect = Math.max(0, totalSales - totalReceived); // What customers still owe us
    toPay = Math.max(0, totalPurchases - totalPaid); // What we still owe for purchases

    setBusinessData({
      toCollect,
      toPay,
      totalCashBank,
    });
  };

  const fetchLatestTransactions = async (token) => {
    try {
      const allTransactions = [];

      // Fetch payments
      try {
        const paymentsRes = await fetch("/api/payments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          const payments = (paymentsData.payments || [])
            .slice(0, 3)
            .map((payment) => ({
              date: new Date(
                payment.date || payment.created_at
              ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              type: "Payment",
              partyName: payment.party_name || payment.to_party || "Unknown",
              amount: parseFloat(payment.amount || 0),
            }));
          allTransactions.push(...payments);
        }
      } catch (err) {
        console.log("Payments API not available:", err);
      }

      // Fetch expenses
      try {
        const expensesRes = await fetch("/api/expense", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          const expenses = (expensesData.expenses || [])
            .slice(0, 3)
            .map((expense) => ({
              date: new Date(
                expense.date || expense.created_at
              ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              type: "Expense",
              partyName: expense.party_name || expense.description || "Expense",
              amount: parseFloat(expense.amount || 0),
            }));
          allTransactions.push(...expenses);
        }
      } catch (err) {
        console.log("Expenses API not available:", err);
      }

      // Fetch bank vouchers
      try {
        const vouchersRes = await fetch("/api/bank-voucher", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (vouchersRes.ok) {
          const vouchersData = await vouchersRes.json();
          const vouchers = (vouchersData.vouchers || [])
            .slice(0, 3)
            .map((voucher) => ({
              date: new Date(
                voucher.date || voucher.created_at
              ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              type: "Bank Voucher",
              partyName:
                voucher.party_name || voucher.description || "Bank Transaction",
              amount: parseFloat(voucher.amount || 0),
            }));
          allTransactions.push(...vouchers);
        }
      } catch (err) {
        console.log("Bank vouchers API not available:", err);
      }

      // Sort by date (most recent first) and take top 5
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions.slice(0, 5));
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    }
  };

  const formatCurrency = (amount) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    return `${isNegative ? "- " : ""}₹ ${absAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return now.toLocaleDateString("en-GB", options).replace(",", " |");
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

      // Create a bank voucher entry to add money (from external source to selected account)
      const voucherData = {
        from_account_type: "external", // Indicates external money source
        from_account_id: "0", // Dummy ID for external source
        to_account_type: addMoneyForm.account_type,
        to_account_id: addMoneyForm.account_id,
        amount: addMoneyForm.amount,
        transfer_date: new Date().toISOString().split("T")[0],
        description: addMoneyForm.description || "Money added to account",
      };

      // Since the bank voucher API expects transfers between existing accounts,
      // we'll directly update the account balance and create a record
      const updateRes = await fetch("/api/accounts/add-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_type: addMoneyForm.account_type,
          account_id: addMoneyForm.account_id,
          amount: addMoneyForm.amount,
          description: addMoneyForm.description || "Money added to account",
        }),
      });

      if (!updateRes.ok) {
        // Fallback: try to update parties directly
        const partiesUpdateRes = await fetch("/api/parties", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: addMoneyForm.account_id,
            current_balance: parseFloat(addMoneyForm.amount),
            action: "add_balance",
          }),
        });

        if (!partiesUpdateRes.ok) {
          throw new Error("Failed to add money");
        }
      }

      // Reset form and close modal
      setAddMoneyForm({
        account_type: "",
        account_id: "",
        amount: "",
        description: "",
      });
      setShowAddMoneyModal(false);

      // Refresh dashboard data
      fetchDashboardData();

      alert("Money added successfully!");
    } catch (err) {
      console.error("Error adding money:", err);
      alert("Failed to add money. Please try again.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Business Overview
          </h1>
        </div>
        <div className="text-sm text-gray-500">
          Last Update: {getCurrentDateTime()}
        </div>
      </div>

      {/* Business Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* To Collect */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">
                To Collect
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(businessData.toCollect)}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full opacity-50"></div>
        </div>

        {/* To Pay */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">To Pay</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(businessData.toPay)}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full opacity-50"></div>
        </div>

        {/* Total Cash + Bank Balance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">
                Total Cash + Bank Balance
              </span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
          <div
            className={`text-2xl font-bold mb-2 ${
              businessData.totalCashBank < 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatCurrency(businessData.totalCashBank)}
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full opacity-50"></div>
        </div>
      </div>

      {/* Latest Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Latest Transactions
          </h2>
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 mb-4 text-gray-300">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No transactions yet
            </h3>
            <p className="text-sm text-gray-400">
              Start by adding parties and creating invoices to see transactions
              here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Party Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-900">{txn.date}</td>
                      <td className="px-6 py-4 text-gray-600">{txn.type}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {txn.partyName}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹ {txn.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                See All Transactions
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setShowAddMoneyModal(false)
          }
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Money
                </h2>
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
                    <option value="cash_in_hand">Cash in Hand</option>
                    <option value="bank_account">Bank Account</option>
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
                      {parties
                        .filter(
                          (party) =>
                            party.party_type === addMoneyForm.account_type
                        )
                        .map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} (₹
                            {parseFloat(
                              party.balance ||
                                party.current_balance ||
                                party.opening_balance ||
                                0
                            ).toFixed(2)}
                            )
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

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={openAddMoneyModal}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          title="Add Money"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
