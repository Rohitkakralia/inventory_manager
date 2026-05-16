"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <AdminNavbar />
        <div className="p-6 bg-gray-100 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
