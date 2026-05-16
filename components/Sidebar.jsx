"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Receipt,
  Wallet,
  BookOpen,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  Truck
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menu = [
  {
    items: [
      { 
        name: "Dashboard", 
        icon: LayoutDashboard, 
        path: "/dashboard",
        iconColor: "text-blue-400"
      },
    ]
  },
  {
    section: "Master Data",
    items: [
      { 
        name: "Products (Items)", 
        icon: ShoppingBag, 
        path: "/dashboard/items",
        iconColor: "text-emerald-400"
      },
      { 
        name: "Parties", 
        icon: Users, 
        path: "/dashboard/parties",
        iconColor: "text-purple-400"
      },
    ]
  },
  {
    section: "Transactions",
    items: [
      { 
        name: "Purchases", 
        icon: TrendingDown, 
        path: "/dashboard/purchases",
        iconColor: "text-orange-400"
      },
      { 
        name: "Sales", 
        icon: TrendingUp, 
        path: "/dashboard/sales",
        iconColor: "text-green-400"
      },
      { 
        name: "Payments", 
        icon: CreditCard, 
        path: "/dashboard/payments",
        iconColor: "text-cyan-400"
      },
      { 
        name: "Bank Voucher", 
        icon: Landmark, 
        path: "/dashboard/bank-voucher",
        iconColor: "text-cyan-400"
      },
      { 
        name: "Expenses", 
        icon: Wallet, 
        path: "/dashboard/expenses",
        iconColor: "text-red-400"
      },
      { 
        name: "Challan", 
        icon: Truck, 
        path: "/dashboard/challan",
        iconColor: "text-yellow-400"
      },
    ]
  },
  {
    section: "Reports",
    items: [
      { 
       name: "Ledger", icon: BookOpen, path: "/dashboard/Ledger", iconColor: "text-indigo-400"
      },
    ]
  },
  {
    section: "Other",
    items: [
      { 
        name: "Settings", 
        icon: Settings, 
        path: "/dashboard/settings",
        iconColor: "text-gray-400"
      },
    ]
  }
];

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <aside className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 h-screen sticky top-0 shadow-xl ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      
      {/* Logo Section */}
      <div className={`px-4 py-6 border-b border-slate-700/50 ${isCollapsed ? 'text-center' : ''}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  SALES
                </h2>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg inline-block">
            <Receipt className="w-6 h-6 text-white" />
          </div>
        )}
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-8 left-100 translate-x-1/2 bg-slate-700 hover:bg-slate-600 rounded-full p-1.5 transition-all duration-200 shadow-lg ${
            isCollapsed ? 'rotate-180' : ''
          }`}
        >
          <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Menu Section */}
      <div className="flex-1 overflow-y-auto py-6 scrollbar-hide">
  <div className="space-y-4 px-3">
    {menu.map((section, sIndex) => (
      <div key={sIndex}>
        
        {/* Section Heading */}
        {!isCollapsed && (
          <p className="text-xs font-bold text-gray-500 uppercase px-3 mb-2">
            {section.section}
          </p>
        )}

        {/* Section Items */}
        <div className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          {section.items.map((item, index) => {
            const isActive = pathname === item.path;

            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`
                  group relative cursor-pointer flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : ""}
              >
                <item.icon 
                  size={20} 
                  className={`${isActive ? 'text-white' : item.iconColor} transition-transform group-hover:scale-110`}
                />

                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}

                {/* Active Indicator */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}

                {/* Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </div>
</div>

      {/* User Section */}
      <div className="border-t border-slate-700/50 pt-4 pb-6">
        <div className={`px-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200
              text-red-400 hover:text-red-300 hover:bg-red-500/10
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} className="transition-transform group-hover:scale-110" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

// "use client";

// import { useRouter, usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   ShoppingBag,
//   Users,
//   Settings,
//   LogOut,
// } from "lucide-react";

// export default function Sidebar() {
//   const router = useRouter();
//   const pathname = usePathname();

//   const menu = [
//     { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
//     { name: "Items", icon: ShoppingBag, path: "/dashboard/items" },
//     { name: "Parties", icon: Users, path: "/dashboard/parties" },
//     { name: "Purchases", icon: Users, path: "/dashboard/purchases" },
//     { name: "Sales", icon: Users, path: "/dashboard/sales" },
//     { name: "Payments", icon: Users, path: "/dashboard/payments" },
//     { name: "Ledger", icon: Users, path: "/dashboard/Ledger" },
//     { name: "Settings", icon: Settings, path: "/dashboard/settings" },
//   ];

//   return (
//     <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-5 h-screen sticky top-0">
//       {/* Logo */}
//       <div>
//         <h2 className="text-2xl font-bold mb-8">SALES</h2>

//         {/* Menu */}
//         <nav className="space-y-2">
//           {menu.map((item, index) => {
//             const isActive = pathname === item.path;

//             return (
//               <button
//                 key={index}
//                 onClick={() => router.push(item.path)}
//                 className={`flex cursor-pointer items-center gap-3 w-full px-3 py-2 rounded transition ${
//                   isActive
//                     ? "bg-blue-600"
//                     : "hover:bg-slate-800 text-gray-300"
//                 }`}
//               >
//                 <item.icon size={18} />
//                 {item.name}
//               </button>
//             );
//           })}
//         </nav>
//       </div>

//       {/* Logout */}
//       <button
//         onClick={() => {
//           localStorage.removeItem("token");
//           router.push("/login");
//         }}
//         className="flex items-center gap-2 text-red-400 hover:text-red-500"
//       >
//         <LogOut size={18} /> Logout
//       </button>
//     </aside>
//   );
// }