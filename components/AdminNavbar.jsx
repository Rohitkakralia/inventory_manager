"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export default function AdminNavbar() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAdmin(payload);
      } catch (err) {
        console.error("Invalid token");
      }
    }
  }, []);

  return (
    <div className="flex justify-between items-center bg-white shadow px-6 py-4">
      {/* Left Title */}
      <div className="flex items-center gap-2">
        <Shield className="text-yellow-500" size={20} />
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>

      {/* Right User Info */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{admin?.email || "Admin"}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-yellow-600 text-white flex items-center justify-center">
          <Shield size={20} />
        </div>
      </div>
    </div>
  );
}
