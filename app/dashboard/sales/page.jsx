"use client";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import QuickAddItemModal from "@/components/QuickAddItemModal";
import QuickAddPartyModal from "@/components/QuickAddPartyModal";

export default function Sales() {
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [sales, setSales] = useState([]);
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
    gst_party_id: "",
    itemsList: [],
  });

  // Generate bill number from settings
  const generateBillNumber = () => {
    const config = JSON.parse(
      localStorage.getItem("billNumberConfig") ||
        '{"prefix":"SB","nextNumber":1,"digits":4}'
    );
    return `${config.prefix}-${String(config.nextNumber).padStart(
      config.digits,
      "0"
    )}`;
  };

  // Increment bill number in settings
  const incrementBillNumber = () => {
    const config = JSON.parse(
      localStorage.getItem("billNumberConfig") ||
        '{"prefix":"SB","nextNumber":1,"digits":4}'
    );
    config.nextNumber += 1;
    localStorage.setItem("billNumberConfig", JSON.stringify(config));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/sales", {
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
      setSales(data.sales);
    } catch (err) {
      console.error("Fetch Sales Error:", err.message);
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
        await Promise.all([fetchSales(), fetchParties(), fetchItems(), fetchGstParties()]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("form:", formData);

    try {
      const token = localStorage.getItem("token");

      const method = editId ? "PUT" : "POST";

      const res = await fetch("/api/sales", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Only increment bill number for new sales (not edits)
      if (!editId) {
        incrementBillNumber();
      }

      setFormData({
        bill_number: "",
        party: "",
        date: "",
        gst_party_id: "",
        itemsList: [],
      });

      setEditId(null);
      setShowForm(false);

      fetchSales();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/sales", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      fetchSales();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (s) => {
    setFormData({
      bill_number: s.bill_number || "",
      party: s.party_id || "",
      date: s.date ? s.date.split("T")[0] : "",
      gst_party_id: s.gst_party_id || "",
      itemsList:
        s.items?.map((it) => ({
          id: it.item_id,
          name: it.name,
          qty: it.quantity,
          price: it.price,
        })) || [],
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleView = (sale) => {
    setViewData(sale);
    setShowViewModal(true);
  };

  const handleViewInvoice = (sale) => {
    window.open(`/invoice/${sale.id}`, "_blank");
  };

  const handleDownloadInvoice = (sale) => {
    window.open(`/invoice/${sale.id}?download=true`, "_blank");
  };

  const openAddForm = () => {
    setFormData({
      bill_number: generateBillNumber(),
      party: "",
      date: "",
      gst_party_id: "",
      itemsList: [],
    });
    setEditId(null);
    setShowForm(true);
  };

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
    const subtotal = calculateSubtotal();
    const selectedGstParty = gstParties.find(p => p.id == formData.gst_party_id);
    const gstPercent = selectedGstParty ? selectedGstParty.gst_percentage : 0;
    return ((subtotal * gstPercent) / 100 || 0).toFixed(2);
  };

  const calculateTotal = () => {
    const subtotal = Number(calculateSubtotal());
    const gst = Number(calculateGST());

    return (subtotal + gst).toFixed(2);
  };

  const exportToExcel = () => {
    if (sales.length === 0) {
      alert("No sales data to export");
      return;
    }

    // Prepare data for export
    const exportData = [];

    sales.forEach((sale) => {
      // Add main sale row
      const baseRow = {
        "Bill Number": sale.bill_number,
        Party: sale.party_name,
        Date: new Date(sale.date).toLocaleDateString(),
        "Item Name": "",
        Quantity: "",
        Price: "",
        "Item Total": "",
        "GST %": sale.gst_percent,
        "GST Amount": sale.gst_amount,
        "Total Amount": sale.total_amount,
      };

      if (sale.items && sale.items.length > 0) {
        // Add rows for each item
        sale.items.forEach((item, index) => {
          const row = { ...baseRow };
          if (index === 0) {
            // First item row includes all sale details
            row["Item Name"] = item.name;
            row["Quantity"] = item.quantity;
            row["Price"] = item.price;
            row["Item Total"] = (item.quantity * item.price).toFixed(2);
          } else {
            // Subsequent item rows only show item details
            row["Bill Number"] = "";
            row["Party"] = "";
            row["Date"] = "";
            row["GST %"] = "";
            row["GST Amount"] = "";
            row["Total Amount"] = "";
            row["Item Name"] = item.name;
            row["Quantity"] = item.quantity;
            row["Price"] = item.price;
            row["Item Total"] = (item.quantity * item.price).toFixed(2);
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
      { wch: 25 }, // Item Name
      { wch: 10 }, // Quantity
      { wch: 12 }, // Price
      { wch: 12 }, // Item Total
      { wch: 8 }, // GST %
      { wch: 12 }, // GST Amount
      { wch: 15 }, // Total Amount
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sales");

    // Generate filename with current date
    const today = new Date();
    const filename = `Sales_Export_${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            Sales
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your sales records & invoices
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
            Add Sale
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
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">💰</span>
              <p className="text-base font-medium text-gray-500">
                No sales yet
              </p>
              <p className="text-sm mt-1">
                Click "Add Sale" to create your first sale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Bill Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Party
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      GST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {sale.bill_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {sale.party_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {sale.total_items} items
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">
                        +₹{sale.gst_amount}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{sale.total_amount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(sale)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(sale)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
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
        {!loading && sales.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {sales.length} sale{sales.length !== 1 ? "s" : ""} total
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
                {editId ? "Edit Sale" : "Add New Sale"}
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
                {/* Section 1: Sale Details */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Sale Details
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

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Bill Number
                      </label>
                      <input
                        name="bill_number"
                        value={formData.bill_number}
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 bg-gray-100 cursor-not-allowed font-mono"
                        readOnly
                      />
                      <p className="text-xs text-gray-400">
                        Auto-generated from settings
                      </p>
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
                          {item.name} (₹{item.price})
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
                            <td
                              colSpan="5"
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              No items added yet
                            </td>
                          </tr>
                        ) : (
                          formData.itemsList?.map((it, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-700">
                                {it.name}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={it.qty}
                                  onChange={(e) =>
                                    updateItem(index, "qty", e.target.value)
                                  }
                                  className="border border-gray-200 rounded-lg px-2 py-1.5 w-20 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={it.price}
                                  onChange={(e) =>
                                    updateItem(index, "price", e.target.value)
                                  }
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
                  {editId ? "Update Sale" : "Save Sale"}
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
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Sale Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-base"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Sale Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Bill Number
                  </p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">
                    {viewData.bill_number}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(viewData.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Party
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewData.party_name}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Total Items
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewData.total_items}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Price (₹)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewData.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-gray-700">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            ₹{item.price}
                          </td>
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
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{viewData.subtotal}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-gray-600">
                      GST ({viewData.gst_percent}%):
                    </span>
                    <span className="text-green-600 font-semibold">
                      +₹{viewData.gst_amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-base font-semibold text-gray-900">
                      Total Amount:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      ₹{viewData.total_amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleViewInvoice(viewData)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Invoice
                </button>

                <button
                  onClick={() => handleDownloadInvoice(viewData)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Invoice
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
        defaultType="sundry_debtor"
      />
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";

// export default function Sales() {
//   const [showForm, setShowForm] = useState(false);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [viewData, setViewData] = useState(null);
//   const [sales, setSales] = useState([]);
//   const [items, setItems] = useState([]);
//   const [parties, setParties] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editId, setEditId] = useState(null);
//   const [formData, setFormData] = useState({
//     bill_number: "",
//     party: "",
//     date: "",
//     GST: 18,
//     TDS: 2,
//     itemsList: [],
//   });

//   // Generate bill number from settings
//   const generateBillNumber = () => {
//     const config = JSON.parse(
//       localStorage.getItem("billNumberConfig") ||
//         '{"prefix":"SB","nextNumber":1,"digits":4}'
//     );
//     return `${config.prefix}-${String(config.nextNumber).padStart(
//       config.digits,
//       "0"
//     )}`;
//   };

//   // Increment bill number in settings
//   const incrementBillNumber = () => {
//     const config = JSON.parse(
//       localStorage.getItem("billNumberConfig") ||
//         '{"prefix":"SB","nextNumber":1,"digits":4}'
//     );
//     config.nextNumber += 1;
//     localStorage.setItem("billNumberConfig", JSON.stringify(config));
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const fetchSales = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/sales", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         throw new Error(text || "Failed to fetch");
//       }

//       const data = await res.json();
//       console.log(data);
//       setSales(data.sales);
//     } catch (err) {
//       console.error("Fetch Sales Error:", err.message);
//     }
//   };

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

//   const fetchItems = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/items", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       setItems(data.items);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Fetch all data on component mount
//   useEffect(() => {
//     const fetchAllData = async () => {
//       setLoading(true);
//       try {
//         await Promise.all([
//           fetchSales(),
//           fetchParties(),
//           fetchItems()
//         ]);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAllData();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     console.log("form:", formData);

//     try {
//       const token = localStorage.getItem("token");

//       const method = editId ? "PUT" : "POST";

//       const res = await fetch("/api/sales", {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       // Only increment bill number for new sales (not edits)
//       if (!editId) {
//         incrementBillNumber();
//       }

//       setFormData({
//         bill_number: "",
//         party: "",
//         date: "",
//         GST: 18,
//         TDS: 2,
//         itemsList: [],
//       });

//       setEditId(null);
//       setShowForm(false);

//       fetchSales();
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure?")) return;

//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/sales", {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ id }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       fetchSales();
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const handleEdit = (s) => {
//     setFormData({
//       bill_number: s.bill_number || "",
//       party: s.party_id || "",
//       date: s.date ? s.date.split("T")[0] : "",
//       GST: s.gst_percent || 0,
//       TDS: s.tds_percent || 0,
//       itemsList:
//         s.items?.map((it) => ({
//           id: it.item_id,
//           name: it.name,
//           qty: it.quantity,
//           price: it.price,
//         })) || [],
//     });
//     setEditId(s.id);
//     setShowForm(true);
//   };

//   const handleView = (sale) => {
//     setViewData(sale);
//     setShowViewModal(true);
//   };

//   const handleViewInvoice = (sale) => {
//     // Open invoice in new tab
//     window.open(`/invoice/${sale.id}`, '_blank');
//   };

//   const handleDownloadInvoice = (sale) => {
//     // Trigger download
//     window.open(`/invoice/${sale.id}?download=true`, '_blank');
//   };

//   const addItem = (id) => {
//     const item = items.find((i) => i.id == id);
//     if (!item) return;

//     setFormData((prev) => ({
//       ...prev,
//       itemsList: [
//         ...(prev.itemsList || []),
//         { id: item.id, name: item.name, qty: 1, price: item.price },
//       ],
//     }));
//   };

//   const updateItem = (index, field, value) => {
//     const updated = [...formData.itemsList];
//     updated[index][field] = Number(value);

//     setFormData({ ...formData, itemsList: updated });
//   };

//   const removeItem = (index) => {
//     const updated = formData.itemsList.filter((_, i) => i !== index);
//     setFormData({ ...formData, itemsList: updated });
//   };

//   const calculateSubtotal = () => {
//     return (
//       formData.itemsList?.reduce((sum, i) => sum + i.qty * i.price, 0) || 0
//     ).toFixed(2);
//   };

//   const calculateGST = () => {
//     const subtotal = calculateSubtotal();
//     return ((subtotal * formData.GST) / 100 || 0).toFixed(2);
//   };

//   const calculateTDS = () => {
//     const subtotal = calculateSubtotal();
//     return ((subtotal * formData.TDS) / 100 || 0).toFixed(2);
//   };

//   const calculateTotal = () => {
//     const subtotal = Number(calculateSubtotal());
//     const gst = Number(calculateGST());
//     const tds = Number(calculateTDS());

//     return (subtotal + gst + tds).toFixed(2);
//   };

//   return (
//     <>
//       {/* Header */}
//       <div className="flex justify-between p-6 bg-zinc-50">
//         <h1 className="text-2xl font-bold">Sales</h1>
//         <button
//           onClick={() => {
//             setFormData({
//               bill_number: generateBillNumber(),
//               party: "",
//               date: "",
//               GST: 18,
//               TDS: 2,
//               itemsList: [],
//             });
//             setEditId(null);
//             setShowForm(true);
//           }}
//           className="bg-blue-600 text-white px-4 py-2 rounded"
//         >
//           + Add Sale
//         </button>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded shadow overflow-x-auto mx-6">
//         {loading ? (
//           <p className="p-4">Loading...</p>
//         ) : sales.length === 0 ? (
//           <p className="p-4">No Sales found</p>
//         ) : (
//           <table className="w-full">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 text-left">BILL NUMBER</th>
//                 <th className="p-3 text-left">PARTY</th>
//                 <th className="p-3 text-left">DATE</th>
//                 <th className="p-3 text-center">TOTAL ITEMS</th>
//                 <th className="p-3 text-right">GST</th>
//                 <th className="p-3 text-right">TDS</th>
//                 <th className="p-3 text-right">TOTAL AMOUNT</th>
//                 <th className="p-3 text-center">ACTION</th>
//               </tr>
//             </thead>

//             <tbody>
//               {sales.map((sale) => (
//                 <tr key={sale.id} className="border-t">
//                   <td className="p-3 text-left">{sale.bill_number}</td>
//                   <td className="p-3 text-left">{sale.party_name}</td>
//                   <td className="p-3 text-left">
//                     {new Date(sale.date).toLocaleDateString()}
//                   </td>
//                   <td className="p-3 text-center">{sale.total_items}</td>
//                   <td className="p-3 text-right">₹{sale.gst_amount}</td>
//                   <td className="p-3 text-right">₹{sale.tds_amount}</td>
//                   <td className="p-3 text-right">₹{sale.total_amount}</td>

//                   <td className="p-3">
//                     <div className="flex gap-2 justify-center">
//                       <button
//                         onClick={() => handleView(sale)}
//                         className="bg-blue-500 text-white px-3 py-1 rounded"
//                       >
//                         View
//                       </button>

//                       <button
//                         onClick={() => handleEdit(sale)}
//                         className="bg-yellow-500 text-white px-3 py-1 rounded"
//                       >
//                         Edit
//                       </button>

//                       <button
//                         onClick={() => handleDelete(sale.id)}
//                         className="bg-red-600 text-white px-3 py-1 rounded"
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
//         <div className="fixed inset-0 flex justify-center items-start bg-black/30 overflow-auto p-6">
//           <div className="bg-white p-6 rounded w-full max-w-4xl shadow-lg">
//             <h2 className="text-xl mb-4 font-semibold">
//               {editId ? "Edit Sale" : "Add Sale"}
//             </h2>

//             <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//               {/* 🔹 PART 1: SALE DETAILS */}
//               <div>
//                 <h3 className="font-semibold mb-2">Sale Details</h3>

//                 <div className="grid grid-cols-2 gap-4">
//                   {/* Party */}
//                   <select
//                     name="party"
//                     value={formData.party}
//                     onChange={handleChange}
//                     className="border p-2 rounded"
//                     required
//                   >
//                     <option value="">Select Party</option>
//                     {parties.map((p) => (
//                       <option key={p.id} value={p.id}>
//                         {p.name}
//                       </option>
//                     ))}
//                   </select>

//                   {/* Date */}
//                   <input
//                     type="date"
//                     name="date"
//                     value={formData.date}
//                     onChange={handleChange}
//                     className="border p-2 rounded"
//                     required
//                   />

//                   {/* Bill Number - Read Only */}
//                   <div className="col-span-2">
//                     <label className="block text-sm mb-1">Bill Number</label>
//                     <input
//                       name="bill_number"
//                       value={formData.bill_number}
//                       className="border p-2 rounded w-full bg-gray-100 cursor-not-allowed"
//                       readOnly
//                     />
//                     <p className="text-xs text-gray-500 mt-1">
//                       Auto-generated from settings
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* 🔹 PART 2: ITEMS */}
//               <div>
//                 <h3 className="font-semibold mb-2">Items</h3>

//                 <div className="flex gap-2 mb-3">
//                   <select
//                     onChange={(e) => addItem(e.target.value)}
//                     className="border p-2 rounded"
//                   >
//                     <option value="">Select Item</option>
//                     {items.map((item) => (
//                       <option key={item.id} value={item.id}>
//                         {item.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 {/* Items Table */}
//                 <table className="w-full border">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="p-2">Item</th>
//                       <th className="p-2">Qty</th>
//                       <th className="p-2">Price</th>
//                       <th className="p-2">Total</th>
//                       <th className="p-2">Action</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {formData.itemsList?.map((it, index) => (
//                       <tr key={index}>
//                         <td className="p-2">{it.name}</td>

//                         <td className="p-2">
//                           <input
//                             type="number"
//                             value={it.qty}
//                             onChange={(e) =>
//                               updateItem(index, "qty", e.target.value)
//                             }
//                             className="border p-1 w-16"
//                           />
//                         </td>

//                         <td className="p-2">
//                           <input
//                             type="number"
//                             value={it.price}
//                             onChange={(e) =>
//                               updateItem(index, "price", e.target.value)
//                             }
//                             className="border p-1 w-20"
//                           />
//                         </td>

//                         <td className="p-2">
//                           ₹{(it.qty * it.price || 0).toFixed(2)}
//                         </td>

//                         <td className="p-2">
//                           <button
//                             type="button"
//                             onClick={() => removeItem(index)}
//                             className="text-red-500"
//                           >
//                             X
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* 🔹 PART 3: SUMMARY */}
//               <div>
//                 <h3 className="font-semibold mb-2">Summary & Taxes</h3>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>Subtotal: ₹{calculateSubtotal()}</div>
//                   <div>Total Items: {formData.itemsList?.length || 0}</div>

//                   {/* GST */}
//                   <div>
//                     <label>Add GST (%)</label>
//                     <input
//                       type="number"
//                       name="GST"
//                       value={formData.GST}
//                       onChange={handleChange}
//                       className="border p-2 w-full"
//                     />
//                   </div>

//                   <div>GST Amount: ₹{calculateGST()}</div>

//                   {/* TDS */}
//                   <div>
//                     <label>Add TCS (%)</label>
//                     <input
//                       type="number"
//                       name="TDS"
//                       value={formData.TDS}
//                       onChange={handleChange}
//                       className="border p-2 w-full"
//                     />
//                   </div>

//                   <div>TDS Amount: ₹{calculateTDS()}</div>

//                   <div className="font-bold col-span-2">
//                     Total Amount: ₹{calculateTotal()}
//                   </div>
//                 </div>
//               </div>

//               {/* 🔹 BUTTONS */}
//               <div className="flex justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setShowForm(false)}
//                   className="border px-4 py-2 rounded"
//                 >
//                   Cancel
//                 </button>

//                 <button className="bg-green-600 text-white px-4 py-2 rounded">
//                   Save
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* View Modal */}
//       {showViewModal && viewData && (
//         <div className="fixed inset-0 flex justify-center items-start bg-black/30 overflow-auto p-6 z-50">
//           <div className="bg-white p-6 rounded w-full max-w-3xl shadow-lg">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">Sale Details</h2>
//               <button
//                 onClick={() => setShowViewModal(false)}
//                 className="text-gray-500 hover:text-gray-700 text-2xl"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="space-y-4">
//               {/* Sale Info */}
//               <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
//                 <div>
//                   <p className="text-sm text-gray-600">Bill Number</p>
//                   <p className="font-semibold">{viewData.bill_number}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Date</p>
//                   <p className="font-semibold">
//                     {new Date(viewData.date).toLocaleDateString()}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Party</p>
//                   <p className="font-semibold">{viewData.party_name}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">Total Items</p>
//                   <p className="font-semibold">{viewData.total_items}</p>
//                 </div>
//               </div>

//               {/* Items Table */}
//               <div>
//                 <h3 className="font-semibold mb-2">Items</h3>
//                 <table className="w-full border">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="p-2 text-left">Item</th>
//                       <th className="p-2 text-right">Qty</th>
//                       <th className="p-2 text-right">Price</th>
//                       <th className="p-2 text-right">Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {viewData.items?.map((item, index) => (
//                       <tr key={index} className="border-t">
//                         <td className="p-2">{item.name}</td>
//                         <td className="p-2 text-right">{item.quantity}</td>
//                         <td className="p-2 text-right">₹{item.price}</td>
//                         <td className="p-2 text-right">
//                           ₹{(item.quantity * item.price).toFixed(2)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {/* Summary */}
//               <div className="p-4 bg-gray-50 rounded space-y-2">
//                 <div className="flex justify-between">
//                   <span>Subtotal:</span>
//                   <span className="font-semibold">₹{viewData.subtotal}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>GST ({viewData.gst_percent}%):</span>
//                   <span className="font-semibold text-green-600">
//                     +₹{viewData.gst_amount}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>TDS ({viewData.tds_percent}%):</span>
//                   <span className="font-semibold text-red-600">
//                     -₹{viewData.tds_amount}
//                   </span>
//                 </div>
//                 <div className="flex justify-between text-lg font-bold border-t pt-2">
//                   <span>Total Amount:</span>
//                   <span>₹{viewData.total_amount}</span>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-2">
//                 <button
//                   onClick={() => handleViewInvoice(viewData)}
//                   className="bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                   View Invoice
//                 </button>

//                 <button
//                   onClick={() => handleDownloadInvoice(viewData)}
//                   className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//                   </svg>
//                   Download Invoice
//                 </button>

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
