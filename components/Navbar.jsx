"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch (err) {
        console.error("Invalid token");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleSettings = () => {
    router.push("/dashboard/settings");
    setShowDropdown(false);
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.profile-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="flex justify-between items-center px-8 py-4">
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-gray-500">Welcome back, {user?.email?.split('@')[0] || 'User'}</p>
          </div>
        </div>

        {/* Right User Info with Dropdown */}
        <div className="relative profile-dropdown">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 px-3 py-2"
          >
            

            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            {/* Dropdown Arrow */}
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block ${showDropdown ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              {/* User Info Section */}
              <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold text-base shadow-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500">User ID: {user?.userId || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Role: {user?.companyType || 'User'}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                
                {/* Settings Option */}
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>

                {/* Divider */}
                <div className="border-t border-gray-100 my-2"></div>

                {/* Logout Option */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";

// export default function Navbar() {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       try {
//         const payload = JSON.parse(atob(token.split(".")[1]));
//         setUser(payload);
//       } catch (err) {
//         console.error("Invalid token");
//       }
//     }
//   }, []);

//   return (
//     <div className="flex justify-between items-center bg-white shadow px-6 py-4">
//       {/* Left Title */}
//       <h1 className="text-xl font-semibold">Dashboard</h1>

//       {/* Right User Info */}
//       <div className="flex items-center gap-4">
//         <div className="text-right">
//           <p className="text-sm font-medium">{user?.email}</p>
//           <p className="text-xs text-gray-500">
//             ID: {user?.userId}
//           </p>
//         </div>

//         {/* Avatar */}
//         <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
//           {user?.email?.charAt(0).toUpperCase()}
//         </div>
//       </div>
//     </div>
//   );
// }