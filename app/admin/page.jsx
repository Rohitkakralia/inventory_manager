"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Phone, Building2 } from "lucide-react";

const COMPANY_TYPES = [
  { value: "Service", icon: "🏪" },
  { value: "Product", icon: "🏭" },
];

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳" },
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+61", flag: "🇦🇺" },
  { code: "+971", flag: "🇦🇪" },
];

export default function AdminPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    companyType: "Service",
    companyName: "",
    email: "",
    countryCode: "+91",
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/adminLogin");
      return;
    }
    fetchUsers();
  }, [router]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        router.push("/admin/adminLogin");
        return;
      }

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("adminToken");
        router.push("/admin/adminLogin");
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users:", data.message);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.companyName,
          company_type: form.companyType,
          email: form.email,
          mobile: form.countryCode + form.mobile,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("User created successfully!");
        setForm({
          companyType: "Service",
          companyName: "",
          email: "",
          countryCode: "+91",
          mobile: "",
          password: "",
        });
        setShowForm(false);
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to create user");
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This will also delete their database and all data.")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const getStrength = (pw) => {
    if (!pw) return 0;
    if (pw.length < 6) return 1;
    if (pw.length < 10) return 2;
    if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) return 3;
    return 2;
  };

  const strength = getStrength(form.password);
  const strengthColors = [
    "bg-gray-200",
    "bg-amber-400",
    "bg-blue-500",
    "bg-emerald-600",
  ];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  const inputClass =
    "w-full bg-transparent text-sm text-[#1a1a1a] placeholder-gray-300 pl-9 pr-4 py-2.5 outline-none rounded-xl";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between p-6 bg-zinc-50">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Create and manage user accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded shadow overflow-x-auto mx-6">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">No users found</p>
            <p className="text-sm text-gray-400">Click "Create User" to add your first user</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">COMPANY NAME</th>
                <th className="p-3 text-left">TYPE</th>
                <th className="p-3 text-left">EMAIL</th>
                <th className="p-3 text-left">MOBILE</th>
                <th className="p-3 text-left">CREATED</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.id}</td>
                  <td className="p-3">{user.company_name}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {user.company_type==="Production"?"Product":user.company_type}
                    </span>
                  </td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.mobile}</td>
                  <td className="p-3">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/30 overflow-auto p-6 z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-lg border border-[#e0ddd6]">
            <h2 className="text-xl font-semibold text-[#1a1a1a] tracking-tight mb-1">
              Create New User
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Fill in the business details to create a new account
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Type */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Company Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_TYPES.map(({ value, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, companyType: value })}
                      className={`border rounded-xl py-2.5 px-2 text-center transition-all duration-150 ${
                        form.companyType === value
                          ? "border-[#1a1a1a] bg-[#1a1a1a]"
                          : "border-[#e0ddd6] bg-[#fafaf8] hover:border-gray-400"
                      }`}
                    >
                      <span className="block text-lg mb-0.5">{icon}</span>
                      <span
                        className={`text-[10px] font-medium ${
                          form.companyType === value
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {value}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Company Name
                </label>
                <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-[#1a1a1a] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <Building2 className="absolute left-3 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Acme Corp."
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-[#1a1a1a] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-300" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="user@company.com"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Mobile
                </label>
                <div className="flex border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-[#1a1a1a] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all overflow-hidden">
                  <select
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className="bg-transparent text-[12px] text-gray-500 border-r border-[#e8e5df] pl-2 pr-1 py-2.5 outline-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map(({ code, flag }) => (
                      <option key={code} value={code}>
                        {flag} {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    required
                    className="bg-transparent text-sm text-[#1a1a1a] placeholder-gray-300 px-2 py-2.5 outline-none flex-1 min-w-0"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-[#1a1a1a] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <Lock className="absolute left-3 w-4 h-4 text-gray-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                    className="w-full bg-transparent text-sm text-[#1a1a1a] placeholder-gray-300 pl-9 pr-10 py-2.5 outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength
                            ? strengthColors[strength]
                            : "bg-[#ede9e3]"
                        }`}
                      />
                    ))}
                    <span className="text-[11px] text-gray-400 ml-1 font-mono">
                      {strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#1a1a1a] text-white hover:bg-[#333]"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
