"use client";
import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import QuickAddItemModal from "@/components/QuickAddItemModal";
import QuickAddPartyModal from "@/components/QuickAddPartyModal";

export default function Purchases() {
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [gstParties, setGstParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);
  const [showQuickAddParty, setShowQuickAddParty] = useState(false);
  const [formData, setFormData] = useState({
    bill_number: "",
    party: "",
    date: "",
    state: "",
    gst_party_id: "",
    itemsList: [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/purchases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }

      const data = await res.json();
      console.log(data);
      setPurchases(data.purchases);

    } catch (err) {
      console.error("Fetch Purchases Error:", err.message);
    }
  };

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

  const fetchGstParties = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/parties/gst", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setGstParties(data.gstParties);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/items", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setItems(data.items);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPurchases(),
          fetchParties(),
          fetchItems(),
          fetchGstParties()
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Handle quick add callbacks
  const handleItemAdded = (newItem) => {
    setItems(prev => [...prev, newItem]);
    setFormData(prev => ({ ...prev, item_id: newItem.id }));
  };

  const handlePartyAdded = (newParty) => {
    setParties(prev => [...prev, newParty]);
    setFormData(prev => ({ ...prev, party_id: newParty.id }));
  };

  // ADD / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("form:", formData);
    console.log("gst_party_id being sent:", formData.gst_party_id);

    try {
      const token = localStorage.getItem("token");
      const method = editId ? "PUT" : "POST";

      const submitData = editId ? { ...formData, id: editId } : formData;
      console.log("Data being submitted:", submitData);

      const res = await fetch("/api/purchases", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Reset form
      setFormData({
        bill_number: "",
        party: "",
        date: "",
        state: "",
        gst_party_id: "",
        itemsList: [],
      });

      setEditId(null);
      setShowForm(false);
      fetchPurchases();

    } catch (err) {
      alert(err.message);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/purchases", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      fetchPurchases();
    } catch (err) {
      alert(err.message);
    }
  };

  // EDIT
  const handleEdit = (p) => {
    setFormData({
      bill_number: p.bill_number || "",
      party: p.party_id || "",
      date: p.date ? p.date.split("T")[0] : "",
      state: p.state || "",
      gst_party_id: p.gst_party_id || "",
      itemsList: p.items?.map((it) => ({
        id: it.item_id,
        name: it.name,
        qty: it.quantity,
        price: it.price,
      })) || [],
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleView = (purchase) => {
    setViewData(purchase);
    setShowViewModal(true);
  };

  const openAddForm = () => {
    setFormData({
      bill_number: "",
      party: "",
      date: "",
      state: "",
      gst_party_id: "",
      itemsList: [],
    });
    setShowForm(true);
    setEditId(null);
  };

  // Helper functions
  const addItem = (id) => {
    const item = items.find((i) => i.id == id);
    if (!item) return;

    setFormData((prev) => ({
      ...prev,
      itemsList: [
        ...(prev.itemsList || []),
        { id: item.id, name: item.name, qty: 1, price: item.price },
      ],
    }));
  };

  const updateItem = (index, field, value) => {
    const updated = [...formData.itemsList];
    updated[index][field] = Number(value);

    setFormData({ ...formData, itemsList: updated });
  };

  const removeItem = (index) => {
    const updated = formData.itemsList.filter((_, i) => i !== index);
    setFormData({ ...formData, itemsList: updated });
  };

  const calculateSubtotal = () => {
    return (
      formData.itemsList?.reduce((sum, i) => sum + i.qty * i.price, 0) || 0
    ).toFixed(2);
  };

  const calculateGST = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const selectedGstParty = gstParties.find(p => p.id == parseInt(formData.gst_party_id));
    
    console.log("gst_party_id:", formData.gst_party_id);
    console.log("gstParties:", gstParties);
    console.log("selectedGstParty:", selectedGstParty);
    
    const gstPercent = selectedGstParty ? parseFloat(selectedGstParty.gst_percentage) : 0;
    console.log("gstPercent:", gstPercent);
    console.log("subtotal:", subtotal);
    console.log("gst calculation:", ((subtotal * gstPercent) / 100).toFixed(2));
    return ((subtotal * gstPercent) / 100).toFixed(2);
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const gst = parseFloat(calculateGST());
    return (subtotal + gst).toFixed(2);
  };

  const exportToExcel = () => {
    if (purchases.length === 0) {
      alert('No purchases data to export');
      return;
    }

    // Prepare data for export
    const exportData = [];
    
    purchases.forEach(purchase => {
      // Add main purchase row
      const baseRow = {
        'Bill Number': purchase.bill_number,
        'Party': purchase.party_name,
        'Date': new Date(purchase.date).toLocaleDateString(),
        'State': purchase.state || '',
        'Item Name': '',
        'Quantity': '',
        'Price': '',
        'Item Total': '',
        'GST %': purchase.gst_percent,
        'GST Amount': purchase.gst_amount,
        'Total Amount': purchase.total_amount
      };

      if (purchase.items && purchase.items.length > 0) {
        // Add rows for each item
        purchase.items.forEach((item, index) => {
          const row = { ...baseRow };
          if (index === 0) {
            // First item row includes all purchase details
            row['Item Name'] = item.name;
            row['Quantity'] = item.quantity;
            row['Price'] = item.price;
            row['Item Total'] = (item.quantity * item.price).toFixed(2);
          } else {
            // Subsequent item rows only show item details
            row['Bill Number'] = '';
            row['Party'] = '';
            row['Date'] = '';
            row['State'] = '';
            row['GST %'] = '';
            row['GST Amount'] = '';
            row['Total Amount'] = '';
            row['Item Name'] = item.name;
            row['Quantity'] = item.quantity;
            row['Price'] = item.price;
            row['Item Total'] = (item.quantity * item.price).toFixed(2);
          }
          exportData.push(row);
        });
      } else {
        // No items, just add the base row
        exportData.push(baseRow);
      }
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Bill Number
      { wch: 20 }, // Party
      { wch: 12 }, // Date
      { wch: 15 }, // State
      { wch: 25 }, // Item Name
      { wch: 10 }, // Quantity
      { wch: 12 }, // Price
      { wch: 12 }, // Item Total
      { wch: 8 },  // GST %
      { wch: 12 }, // GST Amount
      { wch: 15 }  // Total Amount
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Purchases');

    // Generate filename with current date
    const today = new Date();
    const filename = `Purchases_Export_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Purchases</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your purchase records</p>
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
            Add Purchase
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
                  <div className="h-4 bg-gray-100 rounded w-28" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-28 ml-auto" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">📦</span>
              <p className="text-base font-medium text-gray-500">No purchases yet</p>
              <p className="text-sm mt-1">Click "Add Purchase" to create your first purchase.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">GST</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {purchase.bill_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{purchase.party_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {purchase.total_items} items
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">
                        +₹{purchase.gst_amount}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{purchase.total_amount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(purchase)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(purchase)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(purchase.id)}
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
        {!loading && purchases.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {purchases.length} purchase{purchases.length !== 1 ? "s" : ""} total
          </p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Edit Purchase" : "Add New Purchase"}
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
                
                {/* Section 1: Purchase Details */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Purchase Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Party *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowQuickAddParty(true)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Quick Add
                        </button>
                      </div>
                      <select
                        name="party"
                        value={formData.party}
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
                        Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Bill Number
                      </label>
                      <input
                        name="bill_number"
                        placeholder="e.g. INV-001"
                        value={formData.bill_number}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        State
                      </label>
                      <input
                        name="state"
                        placeholder="e.g. Maharashtra"
                        value={formData.state || ""}
                        onChange={handleChange}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                      Items
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddItem(true)}
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
                      onChange={(e) => addItem(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition w-full md:w-64"
                    >
                      <option value="">+ Add Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (₹)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
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
                              <td className="px-4 py-3 text-gray-700">{it.name}</td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={it.qty}
                                  onChange={(e) => updateItem(index, "qty", e.target.value)}
                                  className="border border-gray-200 rounded-lg px-2 py-1.5 w-20 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={it.price}
                                  onChange={(e) => updateItem(index, "price", e.target.value)}
                                  className="border border-gray-200 rounded-lg px-2 py-1.5 w-24 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">
                                ₹{(it.qty * it.price || 0).toFixed(2)}
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

                {/* Section 3: Summary & Taxes */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Summary & Taxes
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold text-gray-900">
                            ₹{calculateSubtotal()}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Total Items:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.itemsList?.length || 0}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            GST Party (Optional)
                          </label>
                          <select
                            name="gst_party_id"
                            value={formData.gst_party_id}
                            onChange={handleChange}
                            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                          >
                            <option value="">No GST</option>
                            {gstParties.map((gst) => (
                              <option key={gst.id} value={gst.id}>
                                {gst.name} ({gst.gst_percentage}%)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">GST Amount:</span>
                          <span className="text-green-600 font-semibold">
                            +₹{calculateGST()}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-200 md:col-span-2">
                        <span className="text-base font-semibold text-gray-900">
                          Total Amount:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          ₹{calculateTotal()}
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
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm"
                >
                  {editId ? "Update Purchase" : "Save Purchase"}
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
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Purchase Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              
              {/* Purchase Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bill Number</p>
                  <p className="text-lg font-semibold text-gray-900">{viewData.bill_number}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(viewData.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Party</p>
                  <p className="text-lg font-semibold text-gray-900">{viewData.party_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">{viewData.total_items}</p>
                </div>
                {viewData.state && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">State</p>
                    <p className="text-lg font-semibold text-gray-900">{viewData.state}</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (₹)</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewData.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-700">{item.name}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">₹{item.price}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">₹{viewData.subtotal}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-gray-600">GST ({viewData.gst_percent}%):</span>
                    <span className="text-green-600 font-semibold">+₹{viewData.gst_amount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">₹{viewData.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modals */}
      <QuickAddItemModal
        isOpen={showQuickAddItem}
        onClose={() => setShowQuickAddItem(false)}
        onItemAdded={handleItemAdded}
      />
      
      <QuickAddPartyModal
        isOpen={showQuickAddParty}
        onClose={() => setShowQuickAddParty(false)}
        onPartyAdded={handlePartyAdded}
        defaultType="sundry_creditor"
      />
    </div>
  );
}
