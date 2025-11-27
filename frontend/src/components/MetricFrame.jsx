export default function MetricFrame({ panelId, grafanaUrl }) {
  const panelUrl = `${grafanaUrl}/d-solo/streamwatch/stream-watch-dashboard?orgId=1&panelId=${panelId}&theme=light&kiosk=tv`

  return (
    <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden bg-white">
      <iframe
        src={panelUrl}
        className="w-full h-full"
        frameBorder="0"
        title={`Grafana Panel ${panelId}`}
      />
    </div>
  )
}

