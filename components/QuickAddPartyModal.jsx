"use client";
import { useState } from "react";

const PARTY_TYPES = [
  { value: "sundry_debtor", label: "Customer", desc: "Buyers / customers" },
  { value: "sundry_creditor", label: "Supplier", desc: "Vendors / suppliers" },
];

export default function QuickAddPartyModal({ isOpen, onClose, onPartyAdded, defaultType = "sundry_debtor" }) {
  const [formData, setFormData] = useState({
    party_type: defaultType,
    name: "",
    balance: "",
    mobile: "",
    city: "",
    gst_status: "Non-GST",
    gst_number: "",
    credit_limit: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear GST number when switching to Non-GST
    if (name === 'gst_status' && value === 'Non-GST') {
      setFormData({ 
        ...formData, 
        [name]: value,
        gst_number: ""
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/parties", {
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
        party_type: defaultType,
        name: "",
        balance: "",
        mobile: "",
        city: "",
        gst_status: "Non-GST",
        gst_number: "",
        credit_limit: "",
      });

      // Notify parent component
      if (onPartyAdded) {
        onPartyAdded(data.party || { id: data.id, ...formData });
      }

      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Quick Add Party</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Party Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Party Type <span className="text-red-500">*</span>
              </label>
              <select
                name="party_type"
                value={formData.party_type}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                required
              >
                {PARTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Party Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter party name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Mobile */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Mobile
                </label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Balance */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Balance (₹)
                </label>
                <input
                  type="number"
                  name="balance"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                  step="0.01"
                />
              </div>

              {/* Credit Limit */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Credit Limit (₹)
                </label>
                <input
                  type="number"
                  name="credit_limit"
                  placeholder="0.00"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                  step="0.01"
                />
              </div>
            </div>

            {/* GST Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                GST Status <span className="text-red-500">*</span>
              </label>
              <select
                name="gst_status"
                value={formData.gst_status}
                onChange={handleChange}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                required
              >
                <option value="Non-GST">Non-GST</option>
                <option value="GST">GST</option>
              </select>
            </div>

            {/* GST Number - Only show when GST is selected */}
            {formData.gst_status === "GST" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  GST Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gst_number"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gst_number}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                  pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}"
                  title="Please enter a valid GST number (15 characters)"
                  maxLength="15"
                  required
                />
                <p className="text-xs text-gray-500">Format: 22AAAAA0000A1Z5 (15 characters)</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              {loading ? "Adding..." : "Add Party"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}