import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin-stats`);
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
          <p className="mt-4 text-slate-400">Loading admin stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time monitoring and statistics</p>
        </div>
        <button
          onClick={fetchStats}
          className="group relative px-5 py-2.5 bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 hover:from-fuchsia-600/30 hover:to-pink-600/30 border border-fuchsia-500/30 rounded-xl transition-all backdrop-blur-xl flex items-center gap-2 text-fuchsia-300 hover:text-fuchsia-200"
        >
          <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400">Active Users</span>
            </div>
            <div className="text-4xl font-bold text-white">{stats?.users?.length || 0}</div>
          </div>
        </div>

        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400">Total Queries</span>
            </div>
            <div className="text-4xl font-bold text-white">{stats?.totalQueries || 0}</div>
          </div>
        </div>

        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400">Packets Sent</span>
            </div>
            <div className="text-4xl font-bold text-white">{(stats?.totalPacketsSent || 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6 hover:border-orange-500/50 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400">Packets Received</span>
            </div>
            <div className="text-4xl font-bold text-white">{(stats?.totalPacketsReceived || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query History */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
            <svg className="w-6 h-6 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Query History (Latest 50)</h2>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {stats?.queries?.slice(-50).reverse().map((q, idx) => (
              <div key={idx} className="backdrop-blur-xl bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-fuchsia-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      q.queryType === 'AI_Query' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                      q.queryType === 'CREATE' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' :
                      q.queryType === 'UPDATE' ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' :
                      q.queryType === 'DELETE' ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                      'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                    }`}>
                      {q.queryType}
                    </span>
                    <span className="font-semibold text-white">{q.username}</span>
                    <span className="text-sm text-slate-400">({q.clientIP})</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(q.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-slate-300 mb-2">
                  <strong className="text-slate-400">Query:</strong> {q.question || 'N/A'}
                </div>
                {q.mongoQuery && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-slate-400 mb-2">MongoDB Query:</div>
                    <pre className="bg-black/50 border border-slate-700/50 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                      {q.mongoQuery}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Users Table */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Active Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Queries</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users?.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-white border-b border-slate-700/30">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700/30">{u.ip}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700/30">{u.queriesCount}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 border-b border-slate-700/30">{new Date(u.lastSeen).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packet Statistics Table */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">Packet Statistics</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 border-b border-slate-700/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users?.sort((a, b) => (b.packetsSent + b.packetsReceived) - (a.packetsSent + a.packetsReceived)).map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-white border-b border-slate-700/30">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700/30">{u.packetsSent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 border-b border-slate-700/30">{u.packetsReceived.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white border-b border-slate-700/30">{(u.packetsSent + u.packetsReceived).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
