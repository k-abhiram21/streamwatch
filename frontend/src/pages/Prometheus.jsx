import React from 'react';

const Prometheus = () => {
    const openPrometheus = () => {
        window.open('http://localhost:9090', '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Prometheus Monitoring</h1>
                    <p className="text-slate-400 mt-1">Access advanced system metrics and querying</p>
                </div>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-semibold text-white mb-4">Prometheus Dashboard</h2>
                <p className="text-slate-400 max-w-lg mx-auto mb-8">
                    Access the full Prometheus dashboard to run PromQL queries, view targets, and analyze raw metrics data directly.
                </p>

                <button
                    onClick={openPrometheus}
                    className="group relative px-6 py-3 bg-gradient-to-r from-orange-600/20 to-red-600/20 hover:from-orange-600/30 hover:to-red-600/30 border border-orange-500/30 rounded-xl font-semibold shadow-lg transition-all backdrop-blur-xl flex items-center gap-2 mx-auto text-orange-300 hover:text-orange-200"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Prometheus
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                    <h3 className="text-lg font-semibold text-white mb-2">Targets</h3>
                    <p className="text-slate-400 text-sm mb-4">View status of all monitored targets and endpoints.</p>
                    <a href="http://localhost:9090/targets" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium transition-colors">View Targets &rarr;</a>
                </div>

                <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                    <h3 className="text-lg font-semibold text-white mb-2">Alerts</h3>
                    <p className="text-slate-400 text-sm mb-4">Check active alerts and firing rules configuration.</p>
                    <a href="http://localhost:9090/alerts" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium transition-colors">View Alerts &rarr;</a>
                </div>

                <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 hover:border-pink-500/50 transition-all">
                    <h3 className="text-lg font-semibold text-white mb-2">Configuration</h3>
                    <p className="text-slate-400 text-sm mb-4">Review the current Prometheus configuration file.</p>
                    <a href="http://localhost:9090/config" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300 text-sm font-medium transition-colors">View Config &rarr;</a>
                </div>
            </div>
        </div>
    );
};

export default Prometheus;
