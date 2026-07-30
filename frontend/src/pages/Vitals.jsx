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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">System Vitals</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor system metrics via Grafana panels</p>
        </div>
      </div>

      {/* Grafana URL Configuration */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <label htmlFor="grafana-url" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Grafana Server URL
        </label>
        <input
          id="grafana-url"
          type="text"
          value={grafanaUrl}
          onChange={handleUrlChange}
          placeholder="http://localhost:3000"
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
        />
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Configure the Grafana server URL. Panels will be displayed in kiosk mode.
        </p>
      </div>

      {/* Grafana Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Panel 1 - Client Query Traffic</h3>
          <div className="h-96">
            <MetricFrame panelId={1} grafanaUrl={grafanaUrl} />
          </div>
        </div>

        {/* Panel 2 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Panel 2 - Packet Size Distribution</h3>
          <div className="h-96">
            <MetricFrame panelId={2} grafanaUrl={grafanaUrl} />
          </div>
        </div>

        {/* Panel 3 - System Metrics */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Panel 3 - System Metrics</h3>
          <div className="h-96">
            <MetricFrame panelId={3} grafanaUrl={grafanaUrl} />
          </div>
        </div>

        {/* Panel 4 - User Queries */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Panel 4 - User Queries & MongoDB Queries</h3>
          <div className="h-96">
            <MetricFrame panelId={4} grafanaUrl={grafanaUrl} />
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>Note:</strong> Make sure Grafana is running and the dashboard is configured with the panel IDs (1, 2, 3, 4).
          Panel 4 displays user queries and MongoDB queries. The panels will be displayed in kiosk mode. If panels don't load, verify the Grafana URL and dashboard configuration.
        </p>
      </div>
    </div>
  )
}
