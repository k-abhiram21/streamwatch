import { useState } from 'react'
import MetricFrame from '../components/MetricFrame'

export default function Vitals() {
  const [grafanaUrl, setGrafanaUrl] = useState(
    localStorage.getItem('grafanaUrl') || 'http://localhost:3000'
  )

  const handleUrlChange = (e) => {
    const newUrl = e.target.value
    setGrafanaUrl(newUrl)
    localStorage.setItem('grafanaUrl', newUrl)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Vitals</h1>
          <p className="text-slate-400 mt-1">Monitor system metrics via Grafana panels</p>
        </div>
      </div>

      {/* Grafana URL Configuration */}
      <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
        <label htmlFor="grafana-url" className="block text-sm font-medium text-slate-300 mb-2">
          Grafana Server URL
        </label>
        <input
          id="grafana-url"
          type="text"
          value={grafanaUrl}
          onChange={handleUrlChange}
          placeholder="http://localhost:3000"
          className="w-full max-w-md px-4 py-2 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none bg-slate-800/50 text-white placeholder-slate-500"
        />
        <p className="mt-2 text-xs text-slate-400">
          Configure the Grafana server URL. Panels will be displayed in kiosk mode.
        </p>
      </div>

      {/* Grafana Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1 */}
        <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Panel 1 - Client Query Traffic</h3>
          <div className="h-96">
            <MetricFrame panelId={1} grafanaUrl={grafanaUrl} />
          </div>
        </div>

        {/* Panel 2 */}
        <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Panel 2 - Packet Size Distribution</h3>
          <div className="h-96">
            <MetricFrame panelId={2} grafanaUrl={grafanaUrl} />
          </div>
        </div>

        {/* Panel 3 - System Metrics */}
        <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Panel 3 - System Metrics</h3>
          <div className="h-96">
            <MetricFrame panelId={3} grafanaUrl={grafanaUrl} />
          </div>
        </div>

        {/* Panel 4 - User Queries */}
        <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Panel 4 - User Queries & MongoDB Queries</h3>
          <div className="h-96">
            <MetricFrame panelId={4} grafanaUrl={grafanaUrl} />
          </div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
        <p className="text-sm text-yellow-300">
          <strong>Note:</strong> Make sure Grafana is running and the dashboard is configured with the panel IDs (1, 2, 3, 4).
          Panel 4 displays user queries and MongoDB queries. The panels will be displayed in kiosk mode. If panels don't load, verify the Grafana URL and dashboard configuration.
        </p>
      </div>
    </div>
  )
}
