"use client";
import { useEffect, useState } from "react";

const PARTY_TYPES = [
  { value: "cash_in_hand", label: "Cash in Hand", desc: "Petty cash / wallet" },
  {
    value: "bank_account",
    label: "Bank Account",
    desc: "Account, IFSC, branch",
  },
  {
    value: "sundry_debtor",
    label: "Sundry Debtors",
    desc: "Customers / buyers",
  },
  {
    value: "sundry_creditor",
    label: "Sundry Creditors",
    desc: "Suppliers / vendors",
  },
  {
    value: "gst",
    label: "GST",
    desc: "GST percentage & current text",
  },
];

const EMPTY_FORM = {
  party_type: "",
  name: "",
  balance: "",
  account_number: "",
  ifsc_code: "",
  branch_name: "",
  mobile: "",
  city: "",
  gst_status: "Non-GST",
  gst_number: "",
  credit_limit: "",
  gst_percentage: "",
  current_text: "",
};

const TABS = [
  { key: "all", label: "All Accounts" },
  // { key: "parties", label: "Parties" },
  // { key: "banks", label: "Banks" },
  // { key: "cash_in_hand", label: "Cash" },
];

export default function Parties() {
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [step, setStep] = useState(1);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ─── derived lists ────────────────────────────────────────────────────────
  const banks = allRecords.filter((r) => r.party_type === "bank_account");
  const cash = allRecords.filter((r) => r.party_type === "cash_in_hand");
  const parties = allRecords.filter(
    (r) =>
      r.party_type === "sundry_debtor" || r.party_type === "sundry_creditor"
  );
  const gst = allRecords.filter((r) => r.party_type === "gst");

  const currentList =
    activeTab === "all"
      ? allRecords
      : activeTab === "banks"
      ? banks
      : activeTab === "cash_in_hand"
      ? cash
      : parties;

  // ─── helpers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "gst_status" && value === "Non-GST") {
      setFormData((f) => ({ ...f, gst_status: "Non-GST", gst_number: "" }));
    } else {
      setFormData((f) => ({ ...f, [name]: value }));
    }
  };

  const selectType = (value) => {
    // Check if trying to create cash in hand when one already exists
    if (value === "cash_in_hand" && !editId && cash.length > 0) {
      alert(
        "Only one Cash in Hand account is allowed. You can edit the existing one instead."
      );
      return;
    }
    setFormData({ ...EMPTY_FORM, party_type: value });
    setStep(2);
  };

  const resetModal = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
    setStep(1);
    setShowForm(false);
  };

  const openAddForm = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
    // pre-select type based on active tab so user skips step 1 for banks/cash
    if (activeTab === "banks") {
      setFormData({ ...EMPTY_FORM, party_type: "bank_account" });
      setStep(2);
    } else if (activeTab === "cash_in_hand") {
      // Check if cash in hand already exists
      if (cash.length > 0) {
        alert(
          "Only one Cash in Hand account is allowed. You can edit the existing one instead."
        );
        return;
      }
      setFormData({ ...EMPTY_FORM, party_type: "cash_in_hand" });
      setStep(2);
    } else {
      setStep(1);
    }
    setShowForm(true);
  };

  const formatBalance = (v) => `₹${parseFloat(v || 0).toFixed(2)}`;
  const typeLabel = (val) =>
    PARTY_TYPES.find((t) => t.value === val)?.label ?? val;

  // ─── API ──────────────────────────────────────────────────────────────────
  const fetchParties = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/parties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAllRecords(data.parties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Additional validation for cash in hand
    if (formData.party_type === "cash_in_hand" && !editId && cash.length > 0) {
      alert("Only one Cash in Hand account is allowed.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const method = editId ? "PUT" : "POST";
      console.log("Submitting form with data:", formData);

      const res = await fetch("/api/parties", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      resetModal();
      fetchParties();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/parties", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchParties();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      party_type: record.party_type || "",
      name: record.name || "",
      balance: record.balance || record.opening_balance || "",
      account_number: record.account_number || "",
      ifsc_code: record.ifsc_code || "",
      branch_name: record.branch_name || "",
      mobile: record.mobile || "",
      city: record.city || "",
      gst_status: record.gst_status || "Non-GST",
      gst_number: record.gst_number || "",
      credit_limit: record.credit_limit || "",
      gst_percentage: record.gst_percentage || "",
      current_text: record.current_text || "",
    });
    setEditId(record.id);
    setStep(2);
    setShowForm(true);
  };

  // ─── form fields per type ─────────────────────────────────────────────────
  const renderFields = () => {
    const t = formData.party_type;

    const field = (label, children) => (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </label>
        {children}
      </div>
    );

    const inp = (props) => (
      <input
        {...props}
        onChange={handleChange}
        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
      />
    );

    const nameField = field(
      t === "bank_account" ? "Bank Name *" : "Party Name *",
      inp({
        name: "name",
        value: formData.name,
        placeholder:
          t === "bank_account" ? "e.g. HDFC Bank" : "e.g. Sharma Traders",
        required: true,
      })
    );

    const balanceField = field(
      "Balance (₹)",
      inp({
        name: "balance",
        type: "number",
        step: "0.01",
        placeholder: "0.00",
        value: formData.balance,
      })
    );

    if (t === "cash_in_hand")
      return (
        <>
          {nameField}
          {balanceField}
        </>
      );

    if (t === "bank_account")
      return (
        <>
          {nameField}
          {field(
            "Account Number *",
            inp({
              name: "account_number",
              value: formData.account_number,
              placeholder: "e.g. 1234567890",
              required: true,
            })
          )}
          <div className="grid grid-cols-2 gap-3">
            {field(
              "IFSC Code *",
              inp({
                name: "ifsc_code",
                value: formData.ifsc_code,
                placeholder: "e.g. HDFC0001234",
                required: true,
                className:
                  "border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-mono",
              })
            )}
            {field(
              "Branch Name *",
              inp({
                name: "branch_name",
                value: formData.branch_name,
                placeholder: "e.g. Connaught Place",
                required: true,
              })
            )}
          </div>
          {balanceField}
        </>
      );

    // sundry debtor / creditor
    if (t === "sundry_debtor" || t === "sundry_creditor") {
      return (
        <>
          {nameField}
          {field(
            "Mobile Number",
            inp({
              name: "mobile",
              type: "tel",
              value: formData.mobile,
              placeholder: "e.g. 9876543210",
            })
          )}
          {field(
            "City",
            inp({ name: "city", value: formData.city, placeholder: "City" })
          )}
          {field(
            "GST Status",
            <select
              name="gst_status"
              value={formData.gst_status}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="Non-GST">Non-GST</option>
              <option value="GST">GST Registered</option>
            </select>
          )}
          {formData.gst_status === "GST" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                GST Number *
              </label>
              <input
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="e.g. 22AAAAA0000A1Z5"
                required
                pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                title="Enter valid 15-character GSTIN"
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-mono"
              />
              <p className="text-xs text-gray-400">
                Enter 15-character GSTIN number
              </p>
            </div>
          )}
          {t === "sundry_debtor" &&
            field(
              "Credit Limit (₹)",
              inp({
                name: "credit_limit",
                type: "number",
                step: "0.01",
                placeholder: "0.00",
                value: formData.credit_limit,
              })
            )}
          {balanceField}
        </>
      );
    }

    // GST party type
    if (t === "gst") {
      return (
        <>
          {nameField}
          {field(
            "GST Percentage (%)",
            inp({
              name: "gst_percentage",
              type: "number",
              min: "0",
              max: "100",
              step: "0.01",
              placeholder: "e.g. 18",
              value: formData.gst_percentage,
              required: true,
            })
          )}
          
        </>
      );
    }

    return null;
  };

  // ─── table columns per tab ────────────────────────────────────────────────
  const renderTable = () => {
    // Unified table showing all account types with appropriate fields
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {[
              "Party Name",
              "Type",
              "GST Number",
              "Credit Limit",
              "Balance",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className={`px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                  ["Balance", "Credit Limit"].includes(h)
                    ? "text-right"
                    : h === "Actions"
                    ? "text-center"
                    : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {currentList.map((r) => (
            <tr
              key={`${r.party_type}-${r.id}`}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{r.name}</div>
                  {r.city && (
                    <div className="text-xs text-gray-500 mt-0.5">{r.city}</div>
                  )}
                  {r.party_type === "gst" && r.gst_percentage && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      GST: {r.gst_percentage}%
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.party_type === "sundry_debtor"
                      ? "bg-blue-50 text-blue-700"
                      : r.party_type === "sundry_creditor"
                      ? "bg-purple-50 text-purple-700"
                      : r.party_type === "bank_account"
                      ? "bg-green-50 text-green-700"
                      : r.party_type === "gst"
                      ? "bg-yellow-50 text-yellow-700"
                      : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {r.party_type === "sundry_debtor"
                    ? "Customer"
                    : r.party_type === "sundry_creditor"
                    ? "Supplier"
                    : r.party_type === "bank_account"
                    ? "Bank"
                    : r.party_type === "gst"
                    ? "GST"
                    : "Cash"}
                </span>
              </td>
              <td className="px-6 py-4">
                {r.gst_number ? (
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {r.gst_number}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                {r.credit_limit ? (
                  <span className="text-gray-700 font-medium">
                    {formatBalance(r.credit_limit)}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-right font-semibold text-gray-800">
                {r.party_type === "gst"
                  ? formatBalance(r.current_text || 0)
                  : formatBalance(r.balance || r.opening_balance || r.current_balance)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  {actionBtns(r)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const handleView = (record) => {
    setViewData(record);
    setShowViewModal(true);
  };

  const actionBtns = (r) => (
    <>
      <button
        onClick={() => handleView(r)}
        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
      >
        View
      </button>
      <button
        onClick={() => handleEdit(r)}
        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => handleDelete(r.id)}
        className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
      >
        Delete
      </button>
    </>
  );

  const emptyMessages = {
    all: {
      icon: "📊",
      title: "No accounts yet",
      sub: 'Click "Add" to add parties, banks, or cash accounts.',
    },
    parties: {
      icon: "🤝",
      title: "No parties yet",
      sub: 'Click "Add" to add a customer or supplier.',
    },
    banks: {
      icon: "🏦",
      title: "No bank accounts yet",
      sub: 'Click "Add" to add a bank account.',
    },
    cash_in_hand: {
      icon: "💵",
      title: "No cash account yet",
      sub: 'Click "Add" to add your cash in hand entry. Only one cash account is allowed.',
    },
  };

  const addLabels = {
    all: "Add Account",
    parties: "Add Party",
    banks: "Add Bank",
    cash_in_hand: "Add Cash",
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Accounts
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Parties, banks &amp; cash in hand
          </p>
        </div>
        <button
          onClick={openAddForm}
          disabled={activeTab === "cash_in_hand" && cash.length > 0}
          className={`inline-flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm ${
            activeTab === "cash_in_hand" && cash.length > 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          <span className="text-lg leading-none">+</span>
          {activeTab === "cash_in_hand" && cash.length > 0
            ? "Cash Account Exists"
            : addLabels[activeTab]}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <nav className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {/* count badge */}
              {!loading &&
                (() => {
                  const count =
                    tab.key === "all"
                      ? allRecords.length
                      : tab.key === "banks"
                      ? banks.length
                      : tab.key === "cash_in_hand"
                      ? cash.length
                      : parties.length;
                  return count > 0 ? (
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        activeTab === tab.key
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  ) : null;
                })()}
            </button>
          ))}
        </nav>
      </div>

      {/* Table Card */}
      <div className="mx-8 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/5" />
                  <div className="h-4 bg-gray-100 rounded w-1/6" />
                  <div className="h-4 bg-gray-100 rounded w-24 ml-auto" />
                </div>
              ))}
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">
                {emptyMessages[activeTab].icon}
              </span>
              <p className="text-base font-medium text-gray-500">
                {emptyMessages[activeTab].title}
              </p>
              <p className="text-sm mt-1">{emptyMessages[activeTab].sub}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">{renderTable()}</div>
          )}
        </div>

        {!loading && currentList.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {currentList.length} record{currentList.length !== 1 ? "s" : ""}{" "}
            total
          </p>
        )}
      </div>

      {/* ── View Modal ── */}
      {showViewModal && viewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) =>
            e.target === e.currentTarget && setShowViewModal(false)
          }
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewData.name}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {typeLabel(viewData.party_type)} Details
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-5">
              <div className="grid gap-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Party Type
                    </label>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          viewData.party_type === "sundry_debtor"
                            ? "bg-blue-50 text-blue-700"
                            : viewData.party_type === "sundry_creditor"
                            ? "bg-purple-50 text-purple-700"
                            : viewData.party_type === "bank_account"
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {typeLabel(viewData.party_type)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Opening Balance
                    </label>
                    <div className="mt-1 text-sm font-semibold text-gray-800">
                      {formatBalance(
                        viewData.balance || viewData.opening_balance || viewData.current_balance
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                {viewData.party_type === "bank_account" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Account Number
                      </label>
                      <div className="mt-1 text-sm text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                        {viewData.account_number || "-"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          IFSC Code
                        </label>
                        <div className="mt-1 text-sm text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                          {viewData.ifsc_code || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Branch Name
                        </label>
                        <div className="mt-1 text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewData.branch_name || "-"}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Party Details (Debtors/Creditors) */}
                {(viewData.party_type === "sundry_debtor" ||
                  viewData.party_type === "sundry_creditor") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Mobile Number
                        </label>
                        <div className="mt-1 text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewData.mobile || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          City
                        </label>
                        <div className="mt-1 text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewData.city || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          GST Status
                        </label>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                              viewData.gst_status === "GST"
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {viewData.gst_status || "Non-GST"}
                          </span>
                        </div>
                      </div>
                      {viewData.gst_number && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            GST Number
                          </label>
                          <div className="mt-1 text-sm text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                            {viewData.gst_number}
                          </div>
                        </div>
                      )}
                    </div>

                    {viewData.party_type === "sundry_debtor" &&
                      viewData.credit_limit && (
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Credit Limit
                          </label>
                          <div className="mt-1 text-sm font-semibold text-gray-800">
                            {formatBalance(viewData.credit_limit)}
                          </div>
                        </div>
                      )}
                  </>
                )}

                {/* GST Party Details */}
                {viewData.party_type === "gst" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          GST Percentage
                        </label>
                        <div className="mt-1 text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                          {viewData.gst_percentage
                            ? `${viewData.gst_percentage}%`
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Current Text
                        </label>
                        <div className="mt-1 text-sm font-semibold text-gray-800">
                          {formatBalance(viewData.current_text || 0)}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Timestamps if available */}
                {(viewData.created_at || viewData.updated_at) && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                      {viewData.created_at && (
                        <div>
                          <span className="font-semibold">Created:</span>
                          <div className="mt-0.5">
                            {new Date(viewData.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      {viewData.updated_at && (
                        <div>
                          <span className="font-semibold">Updated:</span>
                          <div className="mt-0.5">
                            {new Date(viewData.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewData);
                }}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && resetModal()}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editId ? "Edit" : "Add"}{" "}
                  {step === 1
                    ? "Party"
                    : formData.party_type === "bank_account"
                    ? "Bank Account"
                    : formData.party_type === "cash_in_hand"
                    ? "Cash in Hand"
                    : formData.party_type === "sundry_debtor"
                    ? "Sundry Debtor"
                    : formData.party_type === "sundry_creditor"
                    ? "Sundry Creditor"
                    : formData.party_type === "gst"
                    ? "GST"
                    : "Party"}
                </h2>
                {step === 2 && !editId && formData.party_type && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {typeLabel(formData.party_type)}
                  </p>
                )}
              </div>
              <button
                onClick={resetModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Step 1 — type picker (only for Parties tab) */}
            {step === 1 && (
              <div className="px-6 py-5">
                <p className="text-sm text-gray-500 mb-4">
                  What kind of account do you want to add?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(activeTab === "all"
                    ? PARTY_TYPES
                    : [
                        {
                          value: "sundry_debtor",
                          label: "Sundry Debtors",
                          desc: "Customers / buyers",
                        },
                        {
                          value: "sundry_creditor",
                          label: "Sundry Creditors",
                          desc: "Suppliers / vendors",
                        },
                      ]
                  ).map((t) => {
                    const isCashInHandDisabled =
                      t.value === "cash_in_hand" && cash.length > 0;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => selectType(t.value)}
                        disabled={isCashInHandDisabled}
                        className={`text-left p-4 rounded-xl border transition-all group ${
                          isCashInHandDisabled
                            ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                            : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <div
                          className={`text-sm font-semibold ${
                            isCashInHandDisabled
                              ? "text-gray-400"
                              : "text-gray-800 group-hover:text-blue-700"
                          }`}
                        >
                          {t.label}
                          {isCashInHandDisabled && " (Already exists)"}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {isCashInHandDisabled
                            ? "Only one cash account is allowed"
                            : t.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — fields */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 flex flex-col gap-4">
                  {renderFields()}
                </div>
                <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                  {!editId &&
                  (activeTab === "parties" || activeTab === "all") ? (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1 transition-colors"
                    >
                      ← Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetModal}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm"
                    >
                      {editId ? "Update" : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}