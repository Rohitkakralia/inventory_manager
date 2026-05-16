"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function Invoice() {
  const params = useParams();
  const searchParams = useSearchParams();
  const saleId = params.id;
  const shouldDownload = searchParams.get("download") === "true";

  const [saleData, setSaleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaleData();
  }, [saleId]);

  useEffect(() => {
    if (saleData && shouldDownload) {
      setTimeout(() => window.print(), 500);
    }
  }, [saleData, shouldDownload]);

  const fetchSaleData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/sales", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sale = data.sales.find((s) => s.id === parseInt(saleId));
      setSaleData(sale);
      console.log("sale Data:", sale);
    } catch (err) {
      alert("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  const toWords = (amount) => {
    // Basic placeholder — replace with a proper library like `number-to-words`
    return `₹ ${Number(amount).toLocaleString("en-IN")} Only`;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading invoice...</p>
      </div>
    );

  if (!saleData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Invoice not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:bg-white print:p-0">

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-container { box-shadow: none !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm print-container">

        {/* ── HEADER ── */}
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex flex-col items-center justify-center leading-tight">
              {/* <span className="text-white text-xs font-medium">OK</span>
              <span className="text-blue-200 text-[10px]">LDH</span> */}
            </div>
            <div>
              <p className="text-gray-900 font-medium text-lg leading-none">OK LDH</p>
              <p className="text-gray-400 text-xs mt-0.5">Ludhiana, Punjab</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-blue-600 font-medium text-xl tracking-wide">TAX INVOICE</p>
            <p className="text-gray-400 text-xs mt-0.5">Computer generated document</p>
          </div>
        </div>

        {/* ── INVOICE META ── */}
        <div className="grid grid-cols-2 border-b border-gray-200">
          <div className="px-8 py-4 border-r border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Invoice No</p>
            <p className="text-gray-900 font-medium text-base">{saleData.bill_number}</p>
          </div>
          <div className="px-8 py-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Date</p>
            <p className="text-gray-900 font-medium text-base">
              {new Date(saleData.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* ── BILL TO ── */}
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
          <p className="text-gray-900 font-medium text-base">{saleData.party_name}</p>
          <p className="text-gray-400 text-sm mt-0.5">
            Ludhiana, Punjab &nbsp;·&nbsp; {saleData.party_mobile}
          </p>
          {saleData.party_gst && (
            <p className="text-gray-600 text-sm mt-1">
              <span className="text-gray-400">GST No:</span> {saleData.party_gst}
            </p>
          )}
        </div>

        {/* ── ITEMS TABLE ── */}
        <div className="px-8 py-6">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">
            Services / Products
          </p>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-50 text-blue-800">
                <tr>
                  <th className="px-4 py-3 text-center font-medium w-10">#</th>
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-center font-medium w-24">Qty</th>
                  <th className="px-4 py-3 text-right font-medium w-28">Rate</th>
                  <th className="px-4 py-3 text-right font-medium w-20">Tax</th>
                  <th className="px-4 py-3 text-right font-medium w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {saleData.items?.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-center text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">Product description</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {item.quantity} each
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      ₹ {Number(item.price).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">—</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ₹ {(item.quantity * item.price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TERMS + TOTALS ── */}
        <div className="grid grid-cols-2 border-t border-gray-200 px-8 pb-6 gap-0">

          {/* Terms */}
          <div className="pr-8 pt-6 border-r border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">
              Terms & Conditions
            </p>
            <ol className="text-sm text-gray-500 list-decimal ml-4 space-y-1">
              <li>Goods once sold will not be taken back.</li>
              <li>Subject to Ludhiana jurisdiction.</li>
            </ol>
          </div>

          {/* Totals */}
          <div className="pl-8 pt-6">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">Summary</p>

            <div className="space-y-0 divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800">₹ {Number(saleData.subtotal).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">GST ({saleData.gst_percent}%)</span>
                <span className="text-green-700">+ ₹ {Number(saleData.gst_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-500">TDS ({saleData.tds_percent}%)</span>
                <span className="text-red-600">− ₹ {Number(saleData.tds_amount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-3 rounded-lg mt-3 font-medium text-sm">
              <span>Total Amount</span>
              <span>₹ {Number(saleData.total_amount).toLocaleString("en-IN")}</span>
            </div>

            {/* Received */}
            <div className="flex justify-between px-4 py-2 text-sm mt-1">
              <span className="text-gray-500">Received</span>
              <span className="text-green-700 font-medium">
                ₹ {Number(saleData.total_amount).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* ── AMOUNT IN WORDS ── */}
        <div className="mx-8 mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <span className="font-medium text-amber-900">Total in words: </span>
          <span className="text-amber-700">{toWords(saleData.total_amount)}</span>
        </div>

        {/* ── FOOTER ── */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Thank you for your business!</p>
          <p className="text-xs text-gray-400">
            This is a computer-generated invoice · No signature required
          </p>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="no-print flex justify-end gap-3 px-8 py-4 border-t border-gray-200">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg transition-colors"
          >
            Print / Download
          </button>
          <button
            onClick={() => window.close()}
            className="border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm px-5 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}