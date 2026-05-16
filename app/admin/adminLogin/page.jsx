"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/adminLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("adminToken", data.token);
      router.push("/admin");
    } else {
      alert(data.message);
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent text-sm text-[#1a1a1a] placeholder-gray-300 pl-9 pr-4 py-2.5 outline-none rounded-xl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md bg-white border border-yellow-200 rounded-2xl p-8 shadow-2xl">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#1a1a1a] tracking-tight mb-1">
          Admin Portal
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Secure access for administrators only
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Admin Email
            </label>
            <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-yellow-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all">
              <Mail className="absolute left-3 w-4 h-4 text-gray-300" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@company.com"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-yellow-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-yellow-500/20 transition-all">
              <Lock className="absolute left-3 w-4 h-4 text-gray-300" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                required
                autoComplete="current-password"
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-yellow-500 text-white hover:bg-yellow-600 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In as Admin"}
          </button>
        </form>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            <Shield className="inline w-3 h-3 mr-1" />
            This is a restricted area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
