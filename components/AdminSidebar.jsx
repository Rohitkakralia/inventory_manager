"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  LogOut,
  Shield,
} from "lucide-react";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menu = [
    { name: "Users", icon: Users, path: "/admin" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-5 h-screen sticky top-0">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2 mb-8">
          <Shield className="text-yellow-400" size={24} />
          <h2 className="text-2xl font-bold">ADMIN</h2>
        </div>

        {/* Menu */}
        <nav className="space-y-2">
          {menu.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`flex cursor-pointer items-center gap-3 w-full px-3 py-2 rounded transition ${
                  isActive
                    ? "bg-blue-600"
                    : "hover:bg-slate-800 text-gray-300"
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem("adminToken");
          router.push("/admin/adminLogin");
        }}
        className="flex items-center gap-2 text-red-400 hover:text-red-500"
      >
        <LogOut size={18} /> Logout
      </button>
    </aside>
  );
}
