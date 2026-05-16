"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    
    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: form.email,
                password: form.password,
            }),
        });

        const data = await res.json();

        console.log("response :", data);
        if (res.ok) {
            localStorage.setItem("token", data.token);
            router.push("/dashboard");
            // redirect to dashboard
        } else {
            alert(data.message);
        }
    };

    const inputClass =
        "w-full bg-transparent text-sm text-[#1a1a1a] placeholder-gray-300 pl-9 pr-4 py-2.5 outline-none rounded-xl";

    return (
        <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center px-4 py-10 font-sans">
            <div className="w-full max-w-md bg-white border border-[#e0ddd6] rounded-2xl p-8 shadow-sm">

                {/* Brand */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        F
                    </div>
                    <span className="text-[#1a1a1a] font-semibold text-sm">Forma</span>
                </div>

                <h1 className="text-xl font-semibold text-[#1a1a1a] tracking-tight mb-1">
                    Welcome back
                </h1>
                <p className="text-sm text-gray-400 mb-8">
                    Sign in to continue to your dashboard
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Email */}
                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                            Email Address
                        </label>
                        <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-[#1a1a1a] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                            <Mail className="absolute left-3 w-4 h-4 text-gray-300" />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@company.com"
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
                        <div className="relative flex items-center border border-[#e0ddd6] rounded-xl bg-[#fafaf8] focus-within:border-[#1a1a1a] focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                            <Lock className="absolute left-3 w-4 h-4 text-gray-300" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                className="w-full bg-transparent text-sm text-[#1a1a1a] placeholder-gray-300 pl-9 pr-10 py-2.5 outline-none rounded-xl"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 text-gray-300 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <a href="#" className="text-xs text-[#1a1a1a] hover:underline font-medium">
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${submitted
                                ? "bg-emerald-600 text-white"
                                : "bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-[0.99]"
                            }`}
                    >
                        {loading ? (
                            "Signing in..."
                        ) : submitted ? (
                            "✓ Signed in successfully"
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                {/* Info */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    Need an account? Contact your administrator.
                </p>
            </div>
        </div>
    );
}