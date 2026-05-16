"use client";
import { useState, useEffect } from "react";

export default function ChallanModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editData = null,
  parties = [],
  items = [],
  onQuickAddParty,
  onQuickAddItem 
}) {
  const [formData, setFormData] = useState({
    party_id: "",
    itemsList: [],
    amount: "",
  });

  const [loading, setLoading] = useState(false);

  // Initialize form data when modal opens or edit data changes
  useEffect(() => {
    if (editData) {
      setFormData({
        party_id: editData.party_id || "",
        amount: editData.amount || "",
        itemsList: editData.items?.map((it) => ({
          id: it.item_id,
          name: it.name,
          qty: it.quantity,
          price: it.price || 0, // Add price field
        })) || [],
      });
    } else {
      setFormData({
        party_id: "",
        itemsList: [],
        amount: "",
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addItem = (itemId) => {
    if (!itemId) return;
    const item = items.find((i) => i.id == itemId);
    if (!item) return;
    
    // Check if item already exists
    const existingIndex = formData.itemsList.findIndex(it => it.id == itemId);
    if (existingIndex >= 0) {
      // Increase quantity if item already exists
      const updated = [...formData.itemsList];
      updated[existingIndex].qty += 1;
      setFormData({ ...formData, itemsList: updated });
    } else {
      // Add new item with price
      setFormData((prev) => ({
        ...prev,
        itemsList: [...(prev.itemsList || []), { 
          id: item.id, 
          name: item.name, 
          qty: 1, 
          price: item.price || 0 
        }],
      }));
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...formData.itemsList];
    updated[index][field] = Number(value);
    setFormData({ ...formData, itemsList: updated });
  };

  const updateItemQty = (index, value) => {
    updateItem(index, 'qty', Math.max(1, Number(value)));
  };

  const updateItemPrice = (index, value) => {
    updateItem(index, 'price', Math.max(0, Number(value)));
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      itemsList: formData.itemsList.filter((_, i) => i !== index),
    });
  };

  // Calculation functions
  const calculateSubtotal = () => {
    return (
      formData.itemsList?.reduce((sum, i) => sum + (i.qty * i.price), 0) || 0
    ).toFixed(2);
  };

  const calculateTotalQuantity = () => {
    return formData.itemsList?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.party_id || formData.itemsList.length === 0) {
      alert("Please select a party and add at least one item");
      return;
    }

    // Use calculated subtotal as amount if no manual amount is provided
    const finalAmount = formData.amount || calculateSubtotal();

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        amount: finalAmount
      });
      // Reset form
      setFormData({
        party_id: "",
        itemsList: [],
        amount: "",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting challan:", error);
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
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editData ? "Edit Challan" : "Add New Challan"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            
            {/* Section 1: Challan Details */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                Challan Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Party *
                    </label>
                    <button
                      type="button"
                      onClick={onQuickAddParty}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Quick Add
                    </button>
                  </div>
                  <select
                    name="party_id"
                    value={formData.party_id}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                    required
                  >
                    <option value="">Select Party</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.party_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Manual Amount Override (₹) <span className="text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                    <input
                      type="number"
                      name="amount"
                      placeholder="Auto-calculated from items"
                      value={formData.amount}
                      onChange={handleChange}
                      min={0}
                      step="0.01"
                      className="border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Leave empty to use calculated amount (₹{calculateSubtotal()})
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                  Items for Delivery
                </h3>
                <button
                  type="button"
                  onClick={onQuickAddItem}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Quick Add Item
                </button>
              </div>

              <div className="mb-3">
                <select
                  onChange={(e) => { addItem(e.target.value); e.target.value = ""; }}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full md:w-64"
                >
                  <option value="">+ Add Item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (₹{item.price || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Price (₹)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.itemsList?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                          No items added yet
                        </td>
                      </tr>
                    ) : (
                      formData.itemsList?.map((it, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 font-medium">
                            {it.name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={it.qty}
                              min={1}
                              onChange={(e) => updateItemQty(index, e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 w-20 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              value={it.price}
                              min={0}
                              step="0.01"
                              onChange={(e) => updateItemPrice(index, e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 w-24 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ₹{((it.qty || 0) * (it.price || 0)).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 font-medium text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                Summary
              </h3>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.itemsList?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Total Quantity:</span>
                      <span className="font-semibold text-gray-900">
                        {calculateTotalQuantity()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">
                        ₹{calculateSubtotal()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 md:border-t-0 md:pt-0">
                    <span className="text-base font-semibold text-gray-900">
                      Total Amount:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{formData.amount || calculateSubtotal()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors shadow-sm"
            >
              {loading ? "Saving..." : (editData ? "Update Challan" : "Save Challan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}