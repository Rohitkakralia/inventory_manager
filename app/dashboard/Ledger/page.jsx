"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PartyLedger() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchParties = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/parties", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Get transaction counts for each party
      const partiesWithCounts = await Promise.all(
        data.parties
          .filter(party => party.party_type === "sundry_debtor" || party.party_type === "sundry_creditor") // Only show actual parties, not banks/cash
          .map(async (party) => {
          try {
            const ledgerRes = await fetch(
              `/api/ledger?party_id=${party.id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const ledgerData = await ledgerRes.json();
            return {
              ...party,
              totalEntries: ledgerData.ledger?.length || 0,
            };
          } catch (err) {
            return { ...party, totalEntries: 0 };
          }
        })
      );

      // Remove duplicates based on party ID
      const uniqueParties = partiesWithCounts.filter((party, index, self) => 
        index === self.findIndex(p => p.id === party.id)
      );

      setParties(uniqueParties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const viewLedger = (partyId) => {
    router.push(`/dashboard/Ledger/${partyId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Party Ledger</h1>
          <p className="text-sm text-gray-400 mt-0.5">View detailed ledger for each party</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-8 mt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-gray-400">Dashboard</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Ledger</span>
        </div>
      </div>

      {/* Party Cards Grid */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-100 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-24" />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
                  <div className="h-8 bg-gray-100 rounded w-16" />
                </div>
                <div className="h-10 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : parties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📒</span>
            <p className="text-base font-medium text-gray-500">No parties found</p>
            <p className="text-sm mt-1">Add parties to view their ledgers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parties.map((party, index) => (
              <div
                key={`party-${party.id}-${index}`}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-gray-300"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${
                      party.gst_status === 'GST' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    } text-white shadow-sm`}>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {party.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-500">{party.city || 'No city'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Total Entries</p>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-2xl font-bold text-gray-900">
                          {party.totalEntries || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => viewLedger(party.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Ledger
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Row count */}
        {!loading && parties.length > 0 && (
          <p className="text-xs text-gray-400 mt-6 px-1">
            {parties.length} part{parties.length !== 1 ? "ies" : "y"} total
          </p>
        )}
      </div>
    </div>
  );
}

// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function PartyLedger() {
//   const [parties, setParties] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   const fetchParties = async () => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await fetch("/api/parties", {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message);

//       // Get transaction counts for each party
//       const partiesWithCounts = await Promise.all(
//         data.parties.map(async (party) => {
//           try {
//             const ledgerRes = await fetch(
//               `/api/ledger?party_id=${party.id}`,
//               { headers: { Authorization: `Bearer ${token}` } }
//             );
//             const ledgerData = await ledgerRes.json();
//             return {
//               ...party,
//               totalEntries: ledgerData.ledger?.length || 0,
//             };
//           } catch (err) {
//             return { ...party, totalEntries: 0 };
//           }
//         })
//       );

//       setParties(partiesWithCounts);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchParties();
//   }, []);

//   const viewLedger = (partyId) => {
//     router.push(`/dashboard/Ledger/${partyId}`);
//   };

//   return (
//     <>
//       {/* Header */}
//       <div className="p-6 bg-zinc-50">
//         <h1 className="text-3xl font-bold mb-2">Party Ledger</h1>
//         <p className="text-gray-600">
//           <span className="text-blue-600 cursor-pointer">Dashboard</span> / Ledger
//         </p>
//       </div>

//       {/* Party Cards Grid */}
//       <div className="p-6">
//         {loading ? (
//           <p>Loading...</p>
//         ) : parties.length === 0 ? (
//           <p>No parties found</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {parties.map((party) => (
//               <div
//                 key={party.id}
//                 className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
//               >
//                 <div className="flex items-start gap-3 mb-4">
//                   <div className="bg-gray-200 p-3 rounded-full">
//                     <svg
//                       className="w-6 h-6"
//                       fill="currentColor"
//                       viewBox="0 0 20 20"
//                     >
//                       <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
//                     </svg>
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-bold text-gray-800">
//                       {party.name}
//                     </h3>
//                     <p className="text-gray-500 text-sm">{party.city}</p>
//                   </div>
//                 </div>

//                 <div className="mb-4">
//                   <p className="text-gray-600 text-sm">Total Entries</p>
//                   <p className="text-2xl font-bold">
//                     {party.totalEntries || 0}
//                   </p>
//                 </div>

//                 <button
//                   onClick={() => viewLedger(party.id)}
//                   className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
//                 >
//                   <svg
//                     className="w-5 h-5"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
//                     <path
//                       fillRule="evenodd"
//                       d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                   View Ledger
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </>
//   );
// }
