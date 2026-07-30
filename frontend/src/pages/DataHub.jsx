import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function DataHub() {
  const [sensorData, setSensorData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({
    temperature: '',
    water_level: '',
    power_stats: { voltage: '', current: '', wattage: '' },
    location: ''
  })
  const [editingId, setEditingId] = useState(null)

  const { user } = useAuth()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/api/sensor-data`)
      setSensorData(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetForm = () => {
    setForm({
      temperature: '',
      water_level: '',
      power_stats: { voltage: '', current: '', wattage: '' },
      location: ''
    })
    setEditingId(null)
  }

  const handleAddEntry = async (e) => {
    e?.preventDefault()
    setError(null)
    try {
      const payload = {
        temperature: Number(form.temperature),
        water_level: Number(form.water_level),
        power_stats: {
          voltage: Number(form.power_stats.voltage),
          current: Number(form.power_stats.current),
          wattage: Number(form.power_stats.wattage)
        },
        location: form.location || undefined
      }
      await axios.post(`${API_URL}/api/sensor-data`, payload)
      setShowAdd(false)
      resetForm()
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry')
    }
  }

  const startEdit = (item) => {
    setEditingId(item._id)
    setForm({
      temperature: item.temperature,
      water_level: item.water_level,
      power_stats: {
        voltage: item.power_stats.voltage,
        current: item.power_stats.current,
        wattage: item.power_stats.wattage
      },
      location: item.location
    })
    setShowEdit(true)
  }

  const handleEditEntry = async (e) => {
    e?.preventDefault()
    if (!editingId) return
    setError(null)
    try {
      const payload = {
        temperature: Number(form.temperature),
        water_level: Number(form.water_level),
        power_stats: {
          voltage: Number(form.power_stats.voltage),
          current: Number(form.power_stats.current),
          wattage: Number(form.power_stats.wattage)
        },
        location: form.location || undefined
      }
      await axios.put(`${API_URL}/api/sensor-data/${editingId}`, payload)
      setShowEdit(false)
      resetForm()
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update entry')
    }
  }

  const handleDeleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return
    try {
      await axios.delete(`${API_URL}/api/sensor-data/${id}`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete entry')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Data Hub</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor sensor data entries</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="group relative px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800/30 rounded-xl transition-all flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Add Entry</span>
          </button>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="group relative px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm font-medium">{showAll ? 'Show 5' : 'List All Queries'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
        </div>
      ) : sensorData.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-gray-600 dark:text-gray-400">No sensor data found. Click "Add Simulation Data" to create entries.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Temperature</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Water Level</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Voltage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Wattage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sensorData.slice(0, showAll ? sensorData.length : 5).map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                      {item._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                      {item.temperature}°C
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.water_level}L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.power_stats.voltage.toFixed(1)}V
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.power_stats.current.toFixed(2)}A
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.power_stats.wattage.toFixed(0)}W
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(item._id)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold">Add Entry</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddEntry} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Temperature (°C)</label>
                <input type="number" step="1" value={form.temperature} onChange={(e)=>setForm(f=>({...f,temperature:e.target.value}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Water Level (L)</label>
                <input type="number" step="1" value={form.water_level} onChange={(e)=>setForm(f=>({...f,water_level:e.target.value}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Voltage (V)</label>
                <input type="number" step="0.1" value={form.power_stats.voltage} onChange={(e)=>setForm(f=>({...f,power_stats:{...f.power_stats,voltage:e.target.value}}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Current (A)</label>
                <input type="number" step="0.01" value={form.power_stats.current} onChange={(e)=>setForm(f=>({...f,power_stats:{...f.power_stats,current:e.target.value}}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Wattage (W)</label>
                <input type="number" step="1" value={form.power_stats.wattage} onChange={(e)=>setForm(f=>({...f,power_stats:{...f.power_stats,wattage:e.target.value}}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e)=>setForm(f=>({...f,location:e.target.value}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="sensor-001"/>
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-4">
                <button type="button" onClick={()=>{setShowAdd(false); resetForm();}} className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-white font-semibold">Edit Entry</h3>
              <button onClick={() => { setShowEdit(false); resetForm(); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">✕</button>
            </div>
            <form onSubmit={handleEditEntry} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Temperature (°C)</label>
                <input type="number" step="1" value={form.temperature} onChange={(e)=>setForm(f=>({...f,temperature:e.target.value}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Water Level (L)</label>
                <input type="number" step="1" value={form.water_level} onChange={(e)=>setForm(f=>({...f,water_level:e.target.value}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Voltage (V)</label>
                <input type="number" step="0.1" value={form.power_stats.voltage} onChange={(e)=>setForm(f=>({...f,power_stats:{...f.power_stats,voltage:e.target.value}}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Current (A)</label>
                <input type="number" step="0.01" value={form.power_stats.current} onChange={(e)=>setForm(f=>({...f,power_stats:{...f.power_stats,current:e.target.value}}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Wattage (W)</label>
                <input type="number" step="1" value={form.power_stats.wattage} onChange={(e)=>setForm(f=>({...f,power_stats:{...f.power_stats,wattage:e.target.value}}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required/>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e)=>setForm(f=>({...f,location:e.target.value}))} className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="sensor-001"/>
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-4">
                <button type="button" onClick={()=>{setShowEdit(false); resetForm();}} className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
