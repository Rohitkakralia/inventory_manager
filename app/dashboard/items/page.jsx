"use client";
import { useEffect, useState } from "react";

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [companyType, setCompanyType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    price: "",
    stock: "",
    HSN_code: "9988",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCompanyType(payload.companyType);
      } catch (err) {
        console.error("Invalid token");
      }
    }
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/items", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFormData({ name: "", unit: "kg", price: "", stock: "", HSN_code: "9988" });
      setEditId(null);
      setShowForm(false);
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      unit: item.unit,
      price: item.price,
      stock: item.stock,
      HSN_code: item.HSN_code || "9988",
    });
    setEditId(item.id);
    setShowForm(true);
  };

  const openAddForm = () => {
    setFormData({ name: "", unit: "kg", price: "", stock: "", HSN_code: "9988" });
    setShowForm(true);
    setEditId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Items</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your inventory & catalogue</p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add Item
        </button>
      </div>

      {/* Table Card */}
      <div className="mx-8 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {loading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-20 ml-auto" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">📦</span>
              <p className="text-base font-medium text-gray-500">No items yet</p>
              <p className="text-sm mt-1">Click "Add Item" to create your first item.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">HSN Code</th>
                  {companyType !== "Sales" && (
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  )}
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      ₹{item.price}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                        {item.HSN_code || "9988"}
                      </span>
                    </td>
                    {companyType !== "Sales" && (
                      <td className="px-6 py-4 text-center font-medium text-gray-700">
                        {item.stock}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
          )}
        </div>

        {/* Row count */}
        {!loading && items.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">
            {items.length} item{items.length !== 1 ? "s" : ""} total
          </p>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editId ? "Edit Item" : "Add New Item"}
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
              <div className="px-6 py-5 flex flex-col gap-4">

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Item Name
                  </label>
                  <input
                    name="name"
                    placeholder="e.g. Basmati Rice"
                    value={formData.name}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Unit */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="piece">Piece</option>
                    <option value="liter">Liter</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price (₹)
                  </label>
                  <input
                    name="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                    required
                  />
                </div>

                {/* HSN Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    HSN Code
                    {formData.unit === "service" && (
                      <span className="text-blue-400 font-normal normal-case tracking-normal text-xs">optional</span>
                    )}
                  </label>
                  <input
                    name="HSN_code"
                    placeholder="e.g. 9988"
                    value={formData.HSN_code}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition font-mono"
                    required={formData.unit !== "service"}
                  />
                  <p className="text-xs text-gray-400">
                    {formData.unit === "service"
                      ? "HSN code is optional for services."
                      : "Required for all product types."}
                  </p>
                </div>

                {/* Stock */}
                {companyType !== "Sales" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Stock Quantity
                    </label>
                    <input
                      name="stock"
                      type="number"
                      placeholder="0"
                      value={formData.stock}
                      onChange={handleChange}
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                )}

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
                  {editId ? "Update Item" : "Save Item"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";

// export default function Items() {
//   const [showForm, setShowForm] = useState(false);
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editId, setEditId] = useState(null);
//   const [companyType, setCompanyType] = useState(null); // Track company type
//   const [formData, setFormData] = useState({
//     name: "",
//     unit: "kg",
//     price: "",
//     stock: "",
//     HSN_code: "9988", // Default HSN code
//   });

//   // Get company type from token
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         setCompanyType(payload.companyType);
//       } catch (err) {
//         console.error("Invalid token");
//       }
//     }
//   }, []);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // 🔹 Fetch Items
//   const fetchItems = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/items", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);
//       console.log("items:", data);
      
//       setItems(data.items);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchItems();
//   }, []);

//   // 🔹 ADD / UPDATE
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const token = localStorage.getItem("token");

//       const method = editId ? "PUT" : "POST";
//       console.log("item form:", formData);
      
//       const res = await fetch("/api/items", {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(editId ? { ...formData, id: editId } : formData),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       // ✅ Reset
//       setFormData({
//         name: "",
//         unit: "kg",
//         price: "",
//         stock: "",
//         HSN_code: "9988",
//       });
//       setEditId(null);
//       setShowForm(false);

//       fetchItems(); // 🔥 refresh table
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   // 🔹 DELETE
//   const handleDelete = async (id) => {
//     if (!confirm("Are you sure?")) return;

//     try {
//       const token = localStorage.getItem("token");
//       console.log("delete item:", JSON.stringify({ id }));
//       const res = await fetch("/api/items", {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ id }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       fetchItems(); // refresh
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   // 🔹 EDIT
//   const handleEdit = (item) => {
//     setFormData({
//       name: item.name,
//       unit: item.unit,
//       price: item.price,
//       stock: item.stock,
//       HSN_code: item.HSN_code || "9988",
//     });
//     setEditId(item.id);
//     setShowForm(true);
//   };

//   return (
//     <>
//       {/* Header */}
//       <div className="flex justify-between p-6 bg-zinc-50">
//         <h1 className="text-2xl font-bold">Items</h1>
//         <button
//           onClick={() => {
//             setFormData({
//               name: "",
//               unit: "kg",
//               price: "",
//               stock: "",
//               HSN_code: "9988",
//             });
//             setShowForm(true);
//             setEditId(null);
//           }}
//           className="bg-blue-600 text-white px-4 py-2 rounded"
//         >
//           + Add Item
//         </button>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded shadow overflow-x-auto mx-6">
//         {loading ? (
//           <p className="p-4">Loading...</p>
//         ) : items.length === 0 ? (
//           <p className="p-4">No items found</p>
//         ) : (
//           <table className="w-full">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="p-3 text-left">Name</th>
//                 <th className="p-3 text-left">Unit</th>
//                 <th className="p-3 text-right">Price</th>
//                 <th className="p-3 text-center">HSN Code</th>
//                 {companyType !== "Sales" && (
//                   <th className="p-3 text-center">Stock</th>
//                 )}
//                 <th className="p-3 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {items.map((item) => (
//                 <tr key={item.id} className="border-t">
//                   <td className="p-3 text-left">{item.name}</td>
//                   <td className="p-3 text-left">{item.unit}</td>
//                   <td className="p-3 text-right">₹{item.price}</td>
//                   <td className="p-3 text-center">{item.HSN_code || "9988"}</td>
//                   {companyType !== "Sales" && (
//                     <td className="p-3 text-center">{item.stock}</td>
//                   )}

//                   {/* ⭐ ACTION BUTTONS */}
//                   <td className="p-3">
//                     <div className="flex gap-2 justify-center">
//                       <button
//                         onClick={() => handleEdit(item)}
//                         className="bg-yellow-500 text-white px-3 py-1 rounded"
//                       >
//                         Edit
//                       </button>

//                       <button
//                         onClick={() => handleDelete(item.id)}
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
//         <div className="fixed inset-0 flex justify-center items-center">
//           <div className="bg-white p-6 rounded w-96 shadow-lg">
//             <h2 className="text-xl mb-4">
//               {editId ? "Edit Item" : "Add Item"}
//             </h2>

//             <form onSubmit={handleSubmit} className="flex flex-col gap-3">
//               <input
//                 name="name"
//                 placeholder="Name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="border p-2 rounded"
//                 required
//               />

//               <select
//                 name="unit"
//                 value={formData.unit}
//                 onChange={handleChange}
//                 className="border p-2 rounded"
//               >
//                 <option value="kg">Kg</option>
//                 <option value="piece">Piece</option>
//                 <option value="liter">Liter</option>
//                 <option value="service">Service</option>
//               </select>

//               <input
//                 name="price"
//                 type="number"
//                 placeholder="Price"
//                 value={formData.price}
//                 onChange={handleChange}
//                 className="border p-2 rounded"
//                 required
//               />

//               <input
//                 name="HSN_code"
//                 placeholder="HSN Code"
//                 value={formData.HSN_code}
//                 onChange={handleChange}
//                 className="border p-2 rounded"
//                 required={formData.unit !== "service"}
//                 title={
//                   formData.unit === "service"
//                     ? "HSN Code is optional for services"
//                     : "HSN Code is required for products"
//                 }
//               />
//               {formData.unit === "service" && (
//                 <p className="text-sm text-gray-600">
//                   HSN Code is optional for services
//                 </p>
//               )}
//               {formData.unit !== "service" && (
//                 <p className="text-sm text-gray-600">
//                   HSN Code is required for products
//                 </p>
//               )}

//               {/* Only show stock field for Production companies */}
//               {companyType !== "Sales" && (
//                 <input
//                   name="stock"
//                   type="number"
//                   placeholder="Stock"
//                   value={formData.stock}
//                   onChange={handleChange}
//                   className="border p-2 rounded"
//                 />
//               )}

//               <div className="flex justify-end gap-2">
//                 <button onClick={() => setShowForm(false)}>Cancel</button>

//                 <button className="bg-green-600 text-white px-4 py-2 rounded">
//                   {editId ? "Update" : "Save"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
