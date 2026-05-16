"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LedgerDetails() {
  const params = useParams();
  const router = useRouter();
  const partyId = params.id;

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    
    // Validate party ID
    if (!partyId || partyId === 'undefined' || partyId === 'null') {
      setError("Invalid party ID");
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      console.log("Fetching ledger for party:", partyId, "year:", year);

      const res = await fetch(
        `/api/ledger?party_id=${partyId}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Response status:", res.status);

      if (!res.ok) {
        let errorMessage = "Failed to fetch ledger";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, try text
          try {
            errorMessage = await res.text();
          } catch {
            // Keep default message if both fail
          }
        }
        console.error("Error response:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("Ledger data:", data);
      setLedgerData(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partyId) {
      fetchLedger();
    }
  }, [partyId, year]);

  const handleApplyFilters = () => {
    fetchLedger();
  };

  const handleClearFilters = () => {
    setYear(new Date().getFullYear());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-100 rounded w-64" />
            <div className="h-4 bg-gray-100 rounded w-96" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-100 rounded-lg" />
              <div className="h-32 bg-gray-100 rounded-lg" />
              <div className="h-32 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-96 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isPartyNotFound = error.includes("Party not found");
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800">
                {isPartyNotFound ? "Party Not Found" : "Error Loading Ledger"}
              </h3>
            </div>
            <p className="text-red-700 mb-4">
              {isPartyNotFound 
                ? "The requested party could not be found. It may have been deleted or the URL is incorrect."
                : error
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/dashboard/Ledger")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Ledger
              </button>
              {isPartyNotFound && (
                <button
                  onClick={() => router.push("/dashboard/parties")}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  View All Parties
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ledgerData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="text-5xl mb-4">📊</span>
          <p className="text-base font-medium text-gray-500">No data found</p>
        </div>
      </div>
    );
  }

  const { party, ledger, summary } = ledgerData;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => router.push("/dashboard/Ledger")}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">Back to Ledger</span>
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {party.name} - Ledger
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {party.city && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>{party.city}</span>
              </div>
            )}
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{ledger.length} Total Entries</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition w-full"
                placeholder="2024"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Apply Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{summary.openingBalance.toFixed(2)}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <span className="inline-block mt-3 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
              Debit Balance
            </span>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Debit</p>
                <p className="text-2xl font-bold text-green-600 mt-1">₹{summary.totalDebit.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Credit</p>
                <p className="text-2xl font-bold text-red-600 mt-1">₹{summary.totalCredit.toFixed(2)}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-4">📋</span>
              <p className="text-base font-medium text-gray-500">No transactions found</p>
              <p className="text-sm mt-1">No transactions recorded for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Debit</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Credit</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledger.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{entry.description}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-medium">
                        {Number(entry.debit) > 0 ? `₹${Number(entry.debit).toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 font-medium">
                        {Number(entry.credit) > 0 ? `₹${Number(entry.credit).toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₹{Number(entry.balance).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* Closing Balance Row */}
                  <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                    <td className="px-6 py-4" colSpan="2">
                      <span className="text-gray-900">Closing Balance</span>
                    </td>
                    <td className="px-6 py-4 text-right text-green-600">
                      ₹{summary.totalDebit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      ₹{summary.totalCredit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-gray-900">₹{summary.closingBalance.toFixed(2)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          summary.closingBalance >= 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {summary.closingBalance >= 0 ? "Debit" : "Credit"}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";

// export default function LedgerDetails() {
//   const params = useParams();
//   const router = useRouter();
//   const partyId = params.id;

//   const [ledgerData, setLedgerData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [year, setYear] = useState(new Date().getFullYear());

//   const fetchLedger = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const token = localStorage.getItem("token");

//       console.log("Fetching ledger for party:", partyId, "year:", year);

//       const res = await fetch(
//         `/api/ledger?party_id=${partyId}&year=${year}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       console.log("Response status:", res.status);

//       if (!res.ok) {
//         const errorText = await res.text();
//         console.error("Error response:", errorText);
//         throw new Error(errorText || "Failed to fetch ledger");
//       }

//       const data = await res.json();
//       console.log("Ledger data:", data);
//       setLedgerData(data);
//     } catch (err) {
//       console.error("Fetch error:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (partyId) {
//       fetchLedger();
//     }
//   }, [partyId, year]);

//   const handleApplyFilters = () => {
//     fetchLedger();
//   };

//   const handleClearFilters = () => {
//     setYear(new Date().getFullYear());
//   };

//   if (loading) {
//     return <div className="p-6">Loading...</div>;
//   }

//   if (error) {
//     return (
//       <div className="p-6">
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//           <p className="font-bold">Error</p>
//           <p>{error}</p>
//         </div>
//         <button
//           onClick={() => router.push("/dashboard/ledger")}
//           className="mt-4 text-blue-600 hover:underline"
//         >
//           ← Back to Ledger
//         </button>
//       </div>
//     );
//   }

//   if (!ledgerData) {
//     return <div className="p-6">No data found</div>;
//   }

//   const { party, ledger, summary } = ledgerData;

//   return (
//     <>
//       {/* Header */}
//       <div className="p-6 bg-zinc-50">
//         <div className="flex items-center gap-2 mb-4">
//           <button
//             onClick={() => router.push("/dashboard/Ledger")}
//             className="text-blue-600 hover:underline"
//           >
//             ← Back to Ledger
//           </button>
//         </div>
//         <h1 className="text-3xl font-bold mb-2">
//           {party.name} - Ledger
//         </h1>
//         <p className="text-gray-600">
//           {party.city} • {ledger.length} Total Entries
//         </p>
//       </div>

//       <div className="p-6">
//         {/* Filters */}
//         <div className="bg-white p-6 rounded-lg shadow mb-6">
//           <h3 className="font-semibold mb-4">Filters</h3>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm mb-1">Year</label>
//               <input
//                 type="number"
//                 value={year}
//                 onChange={(e) => setYear(e.target.value)}
//                 className="border p-2 rounded w-full"
//                 placeholder="2024"
//               />
//             </div>
//           </div>
//           <div className="flex gap-2 mt-4">
//             <button
//               onClick={handleApplyFilters}
//               className="bg-blue-600 text-white px-6 py-2 rounded"
//             >
//               Apply Filters
//             </button>
//             <button
//               onClick={handleClearFilters}
//               className="bg-gray-500 text-white px-6 py-2 rounded"
//             >
//               Clear
//             </button>
//           </div>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="bg-blue-50 p-6 rounded-lg">
//             <p className="text-sm text-gray-600 mb-1">Opening Balance</p>
//             <p className="text-2xl font-bold">
//               ₹{summary.openingBalance.toFixed(2)}
//             </p>
//             <span className="inline-block mt-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
//               Debit
//             </span>
//           </div>

//           <div className="bg-green-50 p-6 rounded-lg">
//             <p className="text-sm text-gray-600 mb-1">Total Debit</p>
//             <p className="text-2xl font-bold text-green-600">
//               ₹{summary.totalDebit.toFixed(2)}
//             </p>
//           </div>

//           <div className="bg-red-50 p-6 rounded-lg">
//             <p className="text-sm text-gray-600 mb-1">Total Credit</p>
//             <p className="text-2xl font-bold text-red-600">
//               ₹{summary.totalCredit.toFixed(2)}
//             </p>
//           </div>
//         </div>

//         {/* Ledger Table */}
//         <div className="bg-white rounded-lg shadow overflow-x-auto">
//           {ledger.length === 0 ? (
//             <p className="p-6">No transactions found</p>
//           ) : (
//             <table className="w-full">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="p-3 text-left">DATE</th>
//                   <th className="p-3 text-left">DESCRIPTION</th>
//                   <th className="p-3 text-right">DEBIT</th>
//                   <th className="p-3 text-right">CREDIT</th>
//                   <th className="p-3 text-right">BALANCE</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {ledger.map((entry, index) => (
//                   <tr key={index} className="border-t hover:bg-gray-50">
//                     <td className="p-3">
//                       {new Date(entry.date).toLocaleDateString("en-GB", {
//                         day: "2-digit",
//                         month: "short",
//                         year: "numeric",
//                       })}
//                     </td>
//                     <td className="p-3">{entry.description}</td>
//                     <td className="p-3 text-right text-green-600">
//                       {Number(entry.debit) > 0 ? `₹${Number(entry.debit).toFixed(2)}` : "-"}
//                     </td>
//                     <td className="p-3 text-right text-red-600">
//                       {Number(entry.credit) > 0 ? `₹${Number(entry.credit).toFixed(2)}` : "-"}
//                     </td>
//                     <td className="p-3 text-right font-semibold">
//                       ₹{Number(entry.balance).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}

//                 {/* Closing Balance Row */}
//                 <tr className="bg-gray-200 font-bold">
//                   <td className="p-3" colSpan="2">
//                     Closing Balance
//                   </td>
//                   <td className="p-3 text-right">
//                     ₹{summary.totalDebit.toFixed(2)}
//                   </td>
//                   <td className="p-3 text-right">
//                     ₹{summary.totalCredit.toFixed(2)}
//                   </td>
//                   <td className="p-3 text-right">
//                     ₹{summary.closingBalance.toFixed(2)}
//                     <span
//                       className={`ml-2 inline-block text-xs px-2 py-1 rounded ${
//                         summary.closingBalance >= 0
//                           ? "bg-green-600 text-white"
//                           : "bg-red-600 text-white"
//                       }`}
//                     >
//                       {summary.closingBalance >= 0 ? "Debit" : "Credit"}
//                     </span>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }
