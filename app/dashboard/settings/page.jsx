"use client";
import { useEffect, useState } from "react";

export default function Settings() {
  const [config, setConfig] = useState({
    prefix: "OK",
    nextNumber: 1006,
    digits: 4,
  });

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("billNumberConfig");
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: name === "digits" || name === "nextNumber" ? Number(value) : value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("billNumberConfig", JSON.stringify(config));
    alert("Bill number configuration saved successfully!");
  };

  const formatBillNumber = (num) => {
    return `${config.prefix}-${String(num).padStart(config.digits, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure your application preferences</p>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="max-w-3xl">
          {/* Bill Number Configuration Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Bill Number Configuration</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Customize how your bill numbers are generated</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Prefix */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Bill Number Prefix <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="prefix"
                    value={config.prefix}
                    onChange={handleChange}
                    placeholder='e.g., "DV", "INV", "SALE"'
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition font-mono"
                  />
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    The prefix that appears before the bill number
                  </p>
                </div>

                {/* Next Bill Number */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Next Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="nextNumber"
                    value={config.nextNumber}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                    min="1"
                  />
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    The next bill number that will be generated
                  </p>
                </div>

                {/* Number of Digits */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Number of Digits <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="digits"
                    value={config.digits}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Number of digits to use (with leading zeros)
                  </p>
                </div>

                {/* Preview Section */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <h3 className="font-semibold text-gray-900">Preview</h3>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Format</p>
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="text-sm text-gray-500">Example:</span>
                      <span className="text-2xl font-bold text-blue-600 font-mono tracking-wide">
                        {formatBillNumber(config.nextNumber)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Next Bills</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {formatBillNumber(config.nextNumber)}
                        </span>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {formatBillNumber(config.nextNumber + 1)}
                        </span>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          {formatBillNumber(config.nextNumber + 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings Section (Placeholder for future settings) */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden opacity-50">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-400">Additional Settings</h2>
                  <p className="text-sm text-gray-400 mt-0.5">More configuration options coming soon</p>
                </div>
              </div>
            </div>
            <div className="p-6 text-center text-gray-400">
              <p className="text-sm">Additional settings will be available in future updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";

// export default function Settings() {
//   const [config, setConfig] = useState({
//     prefix: "OK",
//     nextNumber: 1006,
//     digits: 4,
//   });

//   useEffect(() => {
//     // Load from localStorage on mount
//     const saved = localStorage.getItem("billNumberConfig");
//     if (saved) {
//       setConfig(JSON.parse(saved));
//     }
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setConfig((prev) => ({
//       ...prev,
//       [name]: name === "digits" || name === "nextNumber" ? Number(value) : value,
//     }));
//   };

//   const handleSave = () => {
//     localStorage.setItem("billNumberConfig", JSON.stringify(config));
//     alert("Bill number configuration saved successfully!");
//   };

//   const formatBillNumber = (num) => {
//     return `${config.prefix}-${String(num).padStart(config.digits, "0")}`;
//   };

//   return (
//     <>
//       {/* Header */}
//       <div className="p-6 bg-zinc-50">
//         <h1 className="text-2xl font-bold">Settings</h1>
//         <p className="text-gray-600">Configure your bill number format</p>
//       </div>

//       <div className="p-6">
//         <div className="bg-white rounded-lg shadow max-w-3xl">
//           <div className="p-6 border-b">
//             <h2 className="text-xl font-semibold">Bill Number Configuration</h2>
//           </div>

//           <div className="p-6">
//             <div className="space-y-6">
//               {/* Prefix */}
//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Bill Number Prefix <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   name="prefix"
//                   value={config.prefix}
//                   onChange={handleChange}
//                   placeholder='e.g., "DV", "INV", "SALE"'
//                   className="border p-3 rounded w-full"
//                 />
//                 <p className="text-gray-500 text-sm mt-1">
//                   The prefix that appears before the bill number (e.g., "DV", "INV", "SALE")
//                 </p>
//               </div>

//               {/* Next Bill Number */}
//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Next Bill Number <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="nextNumber"
//                   value={config.nextNumber}
//                   onChange={handleChange}
//                   className="border p-3 rounded w-full"
//                   min="1"
//                 />
//                 <p className="text-gray-500 text-sm mt-1">
//                   The next bill number that will be generated
//                 </p>
//               </div>

//               {/* Number of Digits */}
//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Number of Digits <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="digits"
//                   value={config.digits}
//                   onChange={handleChange}
//                   className="border p-3 rounded w-full"
//                   min="1"
//                   max="10"
//                 />
//                 <p className="text-gray-500 text-sm mt-1">
//                   How many digits to use (with leading zeros)
//                 </p>
//               </div>

//               {/* Preview */}
//               <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
//                 <h3 className="font-semibold mb-3">Preview</h3>
                
//                 <div className="mb-4">
//                   <p className="text-sm text-gray-600 mb-1">Current Format:</p>
//                   <p className="text-2xl font-bold text-blue-600">
//                     {formatBillNumber(config.nextNumber)}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-600 mb-2">Next bills:</p>
//                   <div className="space-y-1">
//                     <p className="text-lg font-semibold">
//                       {formatBillNumber(config.nextNumber)}
//                     </p>
//                     <p className="text-lg font-semibold">
//                       {formatBillNumber(config.nextNumber + 1)}
//                     </p>
//                     <p className="text-lg font-semibold">
//                       {formatBillNumber(config.nextNumber + 2)}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* Save Button */}
//               <div className="flex justify-end">
//                 <button
//                   onClick={handleSave}
//                   className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
//                 >
//                   Save Configuration
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
