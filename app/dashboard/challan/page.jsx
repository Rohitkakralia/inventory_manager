"use client";
import { useEffect, useState } from "react";
import QuickAddItemModal from "@/components/QuickAddItemModal";
import QuickAddPartyModal from "@/components/QuickAddPartyModal";
import ChallanModal from "@/components/ChallanModal";

export default function Challans() {
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [challans, setChallans] = useState([]);
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);
  const [showQuickAddParty, setShowQuickAddParty] = useState(false);

  const fetchChallans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/challan", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch");
      }
      const data = await res.json();
      setChallans(data.challans);
    } catch (err) {
      console.error("Fetch Challans Error:", err.message);
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

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchChallans(), fetchParties(), fetchItems()]);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const handleItemAdded = (newItem) => {
    setItems((prev) => [...prev, newItem]);
  };

  const handlePartyAdded = (newParty) => {
    setParties((prev) => [...prev, newParty]);
  };

  const handleSubmit = async (formData) => {
    const token = localStorage.getItem("token");
    const method = editId ? "PUT" : "POST";
    const res = await fetch("/api/challan", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    setEditId(null);
    fetchChallans();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this challan?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/challan", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchChallans();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (c) => {
    setEditData(c);
    setEditId(c.id);
    setShowForm(true);
  };

  const handleView = (challan) => {
    setViewData(challan);
    setShowViewModal(true);
  };

  const handleViewChallan = (challan) => {
    window.open(`/challan/${challan.id}`, "_blank");
  };

  const handleDownloadChallan = (challan) => {
    window.open(`/challan/${challan.id}?download=true`, "_blank");
  };

  const openAddForm = () => {
    setEditData(null);
    setEditId(null);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Challans</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your delivery challan records & PDFs</p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add Challan
        </button>
      </div>

      {/* Table Card */}
      <div className="mx-8 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-28 ml-auto" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : challans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">📋</span>
              <p className="text-base font-medium text-gray-500">No challans yet</p>
              <p className="text-sm mt-1">Click "Add Challan" to create your first challan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {challans.map((challan) => (
                    <tr key={challan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-700 font-medium">{challan.party_name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {challan.total_items ?? challan.items?.length ?? 0} items
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{challan.amount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(challan)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleViewChallan(challan)}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => handleEdit(challan)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(challan.id)}
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

        {!loading && challans.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {challans.length} challan{challans.length !== 1 ? "s" : ""} total
          </p>
        )}
      </div>

      {/* Challan Modal */}
      <ChallanModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        editData={editData}
        parties={parties}
        items={items}
        onQuickAddParty={() => setShowQuickAddParty(true)}
        onQuickAddItem={() => setShowQuickAddItem(true)}
      />

      {/* View Modal */}
      {showViewModal && viewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm overflow-y-auto p-6"
          onClick={(e) => e.target === e.currentTarget && setShowViewModal(false)}
        >
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Challan Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Party</p>
                  <p className="text-base font-semibold text-gray-900">{viewData.party_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-base font-semibold text-blue-600">₹{viewData.amount}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewData.items?.length > 0 ? (
                        viewData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-gray-700">{item.name}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="px-4 py-6 text-center text-gray-400">No items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleViewChallan(viewData)}
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
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  View Challan
                </button>

                <button
                  onClick={() => handleDownloadChallan(viewData)}
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
                  Download Challan
                </button>

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