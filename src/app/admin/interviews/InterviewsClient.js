'use client'

import { useState } from 'react'
import Link from 'next/link'
import InterviewResultsModal from './InterviewResultsModal'

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function InterviewsClient({ interviews }) {
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'completed'

  const filteredInterviews = interviews?.filter(int => {
    if (activeTab === 'upcoming') return int.status !== 'completed'
    return int.status === 'completed'
  }) || []

  return (
    <>
      {/* Tab Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'upcoming' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
              activeTab === 'completed' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Completed
          </button>
        </div>

        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {filteredInterviews.length} {activeTab} session{filteredInterviews.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Team</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Schedule</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!filteredInterviews || filteredInterviews.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                  No {activeTab} interviews found.
                </td>
              </tr>
            ) : (
              filteredInterviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {interview.candidate?.name?.[0]}
                      </div>
                      <Link href={`/admin/candidate/${interview.candidate?.id}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                        {interview.candidate?.name || 'Unknown Candidate'}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 font-medium">{interview.candidate?.role?.title || '—'}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{interview.candidate?.role?.team || 'General'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-600">{formatDateTime(interview.start_time)}</span>
                      <span className="text-[10px] text-gray-400 font-medium italic">45-minute window</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {interview.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100 uppercase tracking-wider">
                            <div className="h-1 w-1 rounded-full bg-green-500" /> Done
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase tracking-wider">
                            <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" /> Scheduled
                          </span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {interview.status === 'completed' ? (
                        <button
                          onClick={() => setSelectedInterview(interview)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0f] border border-[#2a2a35] px-3 py-1.5 text-[10px] font-black text-[#7c6ef0] uppercase tracking-widest hover:bg-[#12121a] hover:border-[#7c6ef0]/50 transition-all active:scale-95 shadow-sm"
                        >
                          Review Result
                        </button>
                      ) : (
                        <Link
                          href={`/interview/${interview.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                        >
                          Start Interview
                        </Link>
                      )}
                      
                      <a 
                        href={`mailto:${interview.candidate?.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-gray-50 transition-all active:scale-95"
                      >
                        Email ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Modal */}
      {selectedInterview && (
        <InterviewResultsModal 
          interview={selectedInterview} 
          onClose={() => setSelectedInterview(null)} 
        />
      )}
    </>
  )
}
