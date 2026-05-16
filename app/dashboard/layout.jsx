"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <div className="p-6 bg-gray-100 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}