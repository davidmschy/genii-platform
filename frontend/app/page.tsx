"use client";

import { useState, useEffect } from 'react';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function Dashboard() {
  const [revenue, setRevenue] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionResult, setActionResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const revRes = await fetch(`${API_BASE}/revenue/dashboard`);
      const revData = await revRes.json();
      setRevenue(revData);

      const salesRes = await fetch(`${API_BASE}/revenue/sales`);
      const salesData = await salesRes.json();
      setSales(salesData.sales || []);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordSale = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/revenue/record-sale?product=Genii+Pro&tier=pro&customer_email=demo@example.com&amount=299`, {
        method: 'POST'
      });
      const data = await res.json();
      setActionResult(data);
      fetchData();
    } catch (err) {
      setActionResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const simulateSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/revenue/simulate`, { method: 'POST' });
      const data = await res.json();
      setActionResult(data);
    } catch (err) {
      setActionResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setActionResult(data);
    } catch (err) {
      setActionResult({ error: 'API not reachable' });
    }
  };

  if (loading && !revenue) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading Genii Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <Head>
        <title>Genii ERP Dashboard</title>
      </Head>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-8">
        <h1 className="text-4xl font-bold mb-2">????? Genii Enterprise ERP</h1>
        <p className="text-purple-100">AI-Native Workforce Platform</p>
        <div className="mt-4 flex gap-4">
          <button onClick={checkHealth} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
            Check Health
          </button>
          <a href={`${API_BASE}/docs`} target="_blank" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
            API Docs
          </a>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Total Revenue (30d)</h3>
          <div className="text-3xl font-bold text-green-400">
            ${revenue?.summary?.total_revenue_30d?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Monthly Recurring</h3>
          <div className="text-3xl font-bold text-blue-400">
            ${revenue?.summary?.subscription_mrr?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Affiliate Earnings</h3>
          <div className="text-3xl font-bold text-purple-400">
            ${revenue?.summary?.affiliate_earnings?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-gray-400 text-sm mb-2">Total Sales</h3>
          <div className="text-3xl font-bold text-orange-400">
            {sales.length}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={recordSale}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-semibold transition"
          >
            {loading ? 'Processing...' : '?? Record Sale'}
          </button>
          <button
            onClick={simulateSales}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-4 rounded-lg font-semibold transition"
          >
            ?? Simulate Sales
          </button>
          <a
            href={`${API_BASE}/marketplace/tiers`}
            target="_blank"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-lg font-semibold transition text-center"
          >
            ??? View Pricing
          </a>
          <a
            href={`${API_BASE}/sales/leads`}
            target="_blank"
            className="bg-orange-600 hover:bg-orange-700 px-6 py-4 rounded-lg font-semibold transition text-center"
          >
            ?? Hot Leads
          </a>
        </div>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h3 className="text-lg font-bold mb-2">Last Action Result</h3>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(actionResult, null, 2)}
          </pre>
          <button
            onClick={() => setActionResult(null)}
            className="mt-2 text-sm text-gray-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Sales History */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
        {sales.length === 0 ? (
          <p className="text-gray-400">No sales recorded yet. Click "Record Sale" to add one.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2">ID</th>
                <th className="pb-2">Product</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(-5).map((sale) => (
                <tr key={sale.id} className="border-b border-gray-700">
                  <td className="py-3 font-mono text-sm">{sale.id?.slice(0, 8)}...</td>
                  <td className="py-3">{sale.product}</td>
                  <td className="py-3 text-green-400">${sale.amount}</td>
                  <td className="py-3 text-gray-400">{new Date(sale.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Genii Enterprise ERP v2.0.1 | API: {API_BASE}</p>
      </div>
    </div>
  );
}
