'use client'
import { useState } from 'react'

export default function EmailsClient({ initialLogs }) {
  const [logs] = useState(initialLogs)
  const [selectedEmail, setSelectedEmail] = useState(null)

  return (
    <div className="px-8 py-8 relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
          <p className="mt-1 text-sm text-gray-500">View all outbound system communications and delivery statuses.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm w-full">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 whitespace-nowrap">
            <tr>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Candidate</th>
              <th className="px-6 py-4 font-semibold">Recipient</th>
              <th className="px-6 py-4 font-semibold w-2/5">Subject & Preview</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  <span className="text-3xl block mb-2">📬</span>
                  No emails logged yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap" suppressHydrationWarning>
                    {new Date(log.created_at).toLocaleString('en-US', { 
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.candidate ? (
                      <div>
                        <div className="font-semibold text-gray-900">{log.candidate.name}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-widest">{log.candidate.role?.title}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 w-fit">
                      <span>✉️</span> {log.recipient}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 line-clamp-1">{log.subject}</div>
                    {log.body_preview && (
                      <div className="text-xs text-gray-400 font-normal line-clamp-2 mt-1 pr-4">
                        {log.body_preview}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        log.status === 'SENT' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {log.status === 'SENT' ? '✓ Delivered' : '⚠️ Failed'}
                      </span>
                      {log.error_message && (
                        <div className="text-[10px] text-red-500 truncate max-w-[150px]" title={log.error_message}>
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedEmail(log)}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Email Viewer Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate pr-4">{selectedEmail.subject}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-500"><strong>To:</strong> {selectedEmail.recipient}</span>
                  <span className="text-gray-500">
                    <strong>Sent:</strong> {new Date(selectedEmail.created_at).toLocaleString()}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedEmail.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedEmail.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)} 
                className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 shadow-sm hover:bg-gray-100 rounded-lg p-2 transition-all flex-shrink-0"
                title="Close Viewer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              {selectedEmail.body_html ? (
                <div 
                  className="email-content-viewer"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                />
              ) : (
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-gray-500 whitespace-pre-wrap font-mono text-sm">
                  {selectedEmail.body_preview || 'No email content available.'}
                </div>
              )}
            </div>
            
            {/* Required CSS to ensure the injected HTML styles itself relatively safely */}
            <style dangerouslySetInnerHTML={{__html: `
              .email-content-viewer * {
                max-width: 100%;
              }
              .email-content-viewer a {
                color: #4f46e5;
                text-decoration: underline;
              }
              .email-content-viewer p {
                margin-bottom: 1em;
                line-height: 1.6;
              }
            `}} />
          </div>
        </div>
      )}
    </div>
  )
}
