import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AIAnalyst() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const username = localStorage.getItem('username')

  useEffect(() => {
    loadQueryHistory()
  }, [])

  const loadQueryHistory = async () => {
    try {
      setLoadingHistory(true)
      const result = await axios.get(`${API_URL}/api/ai-query-history/${username}?limit=10`)
      setHistory(result.data.history || [])
    } catch (err) {
      console.error('Error loading query history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const result = await axios.post(
        `${API_URL}/api/ai-query`,
        { question: question.trim(), username },
        {
          headers: {
            'x-username': username,
            'Content-Type': 'application/json'
          }
        }
      )

      setResponse(result.data)
      setQuestion('')
      loadQueryHistory()
    } catch (err) {
      const errorData = err.response?.data
      if (errorData?.blocked) {
        setError({
          message: errorData.error,
          reason: errorData.reason,
          blocked: true
        })
      } else {
        setError({
          message: errorData?.error || 'Failed to process query',
          blocked: false
        })
      }
      console.error('Error processing AI query:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleHistoryClick = (historyItem) => {
    if (!historyItem.blocked) {
      setQuestion(historyItem.question)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Analyst</h1>
          <p className="text-slate-400 mt-1">Natural language database queries with intelligent insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Ask a Question
            </h2>
              
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: Show me all sensors where temperature is greater than 50 degrees"
                className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none resize-none bg-slate-800/50 text-white placeholder-slate-500 backdrop-blur-xl"
                rows="4"
                disabled={loading}
              />
              
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="w-full bg-gradient-to-r from-fuchsia-600/20 to-pink-600/20 hover:from-fuchsia-600/30 hover:to-pink-600/30 border border-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-fuchsia-300 font-medium py-3 rounded-xl transition-all backdrop-blur-xl"
              >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Query...
                    </span>
                  ) : 'Execute Query'}
                </button>
              </form>

            {error && (
              <div className={`mt-4 p-4 rounded-xl border backdrop-blur-xl ${error.blocked ? 'bg-red-500/10 border-red-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                <div className="flex items-start">
                  <svg className={`w-5 h-5 mr-3 mt-0.5 ${error.blocked ? 'text-red-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className={`font-semibold ${error.blocked ? 'text-red-300' : 'text-yellow-300'}`}>
                      {error.blocked ? 'Query Blocked' : 'Error'}
                    </p>
                    <p className={`text-sm mt-1 ${error.blocked ? 'text-red-400' : 'text-yellow-400'}`}>
                      {error.message}
                    </p>
                    {error.reason && (
                      <p className="text-sm mt-2 font-medium text-red-400">
                        Reason: {error.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>

          {response && (
            <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Query Results
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Answer</h3>
                  <div className="p-4 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl backdrop-blur-xl">
                    <p className="text-sm text-white">{response.naturalAnswer}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Generated Query</h3>
                  <div className="p-4 bg-black/50 border border-slate-700/50 rounded-xl overflow-x-auto">
                    <div className="text-xs text-slate-400 mb-2">Type: <span className="text-green-400">{response.mongoQuery.type}</span></div>
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {JSON.stringify(response.mongoQuery.query, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">
                    Data ({Array.isArray(response.result) ? response.result.length : 1} records)
                  </h3>
                  <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl max-h-96 overflow-y-auto custom-scrollbar">
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(response.result, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

        <div className="lg:col-span-1">
          <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Queries
              </span>
              <button onClick={loadQueryHistory} className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors" title="Refresh">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </h2>
              
            {loadingHistory ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto custom-scrollbar">
                {history.map((item, idx) => (
                  <div
                    key={item._id || idx}
                    onClick={() => handleHistoryClick(item)}
                    className={`p-3 rounded-xl border transition-all backdrop-blur-xl ${item.blocked ? 'bg-red-500/10 border-red-500/50 cursor-not-allowed opacity-75' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs font-medium ${item.blocked ? 'text-red-400' : 'text-fuchsia-400'}`}>
                        {item.blocked ? 'Blocked' : 'Success'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {item.question}
                    </p>
                    {item.blocked && item.blockReason && (
                      <p className="text-xs text-red-400 mt-1">
                        {item.blockReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                No query history yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
