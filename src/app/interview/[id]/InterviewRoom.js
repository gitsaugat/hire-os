'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NotesFeed from './NotesFeed'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function AvatarPanel({ name, role, initials, colorClass, isSpeaking }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-[#2a2a35] relative">
      <div className="relative mb-6">
        {/* Pulsing rings when speaking */}
        {isSpeaking && (
          <>
            <div className={`absolute inset-0 rounded-full ${colorClass} opacity-20 animate-ping`} style={{ animationDuration: '2s' }} />
            <div className={`absolute -inset-4 rounded-full border-2 ${colorClass.replace('bg-', 'border-')} opacity-40 animate-pulse`} />
          </>
        )}
        <div className={`w-32 h-32 rounded-full ${colorClass} flex items-center justify-center text-5xl font-bold text-white shadow-2xl relative z-10`}>
          {initials}
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
      <p className="text-sm text-gray-400">{role}</p>

      {/* Speaking Indicator */}
      <div className={`absolute bottom-8 transition-opacity duration-300 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-1.5 bg-[#1e1e2d] px-3 py-1.5 rounded-full border border-[#2a2a35]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export default function InterviewRoom({ interview, candidate, interviewerName }) {
  const router = useRouter()
  
  // State
  const [isLoaded, setIsLoaded] = useState(false)
  const [allNotes, setAllNotes] = useState([])
  const [revealedNotes, setRevealedNotes] = useState([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(true)

  // Simulation State
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false)
  const [candidateSpeaking, setCandidateSpeaking] = useState(false)

  const timerRef = useRef(null)
  const startedAtRef = useRef(null)

  const isCompletedRef = useRef(false)
  const lastSyncedNotesRef = useRef(0)

  // Initialization & SessionStorage
  useEffect(() => {
    const initRoom = async () => {
      const sessionKey = `interview_${interview.id}`
      const saved = sessionStorage.getItem(sessionKey)
      
      let state = saved ? JSON.parse(saved) : null
      
      if (!state) {
        // First load
        state = {
          interviewId: interview.id,
          startedAt: Date.now(),
          revealedNotes: [],
          allNotes: [],
          isMuted: false,
          isCameraOff: false,
          status: 'in_progress',
          isAutoCompleted: false
        }
        
        // Fetch generated notes from Claude
        try {
          const res = await fetch('/api/interviews/generate-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              candidate: {
                name: candidate.name,
                role: candidate.role?.title || 'Candidate',
                skills: candidate.skills || [],
                screening_summary: candidate.screening_summary || ''
              }
            })
          })
          const data = await res.json()
          state.allNotes = data.notes || []
          setIsAnalyzing(false)
        } catch (e) {
          console.error("Failed to generate notes", e)
          setIsAnalyzing(false)
        }
        
        sessionStorage.setItem(sessionKey, JSON.stringify(state))
      } else {
        setIsAnalyzing(false)
        if (state.isAutoCompleted) isCompletedRef.current = true
      }

      startedAtRef.current = state.startedAt
      setAllNotes(state.allNotes)
      setRevealedNotes(state.revealedNotes)
      setIsMuted(state.isMuted)
      setIsCameraOff(state.isCameraOff)
      setIsLoaded(true)
    }

    initRoom()

    // Tab Closure Handling
    const handleBeforeUnload = (e) => {
      if (isCompletedRef.current) return
      e.preventDefault()
      e.returnValue = 'Interview in progress. Closing this tab will attempt to save your progress and complete the interview.'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [interview.id, candidate])

  // Timer, Note Revealing & periodic Sync
  useEffect(() => {
    if (!isLoaded || isEnding) return

    const sessionKey = `interview_${interview.id}`
    
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const diffSeconds = Math.floor((now - startedAtRef.current) / 1000)
      setElapsedSeconds(diffSeconds)

      // Random speaking simulation
      if (Math.random() < 0.05 && !interviewerSpeaking && !candidateSpeaking) {
        if (Math.random() < 0.4) {
          setInterviewerSpeaking(true)
          setTimeout(() => setInterviewerSpeaking(false), 3000 + Math.random() * 2000)
        } else {
          setCandidateSpeaking(true)
          setTimeout(() => setCandidateSpeaking(false), 5000 + Math.random() * 5000)
        }
      }

      // Check for new notes to reveal
      const newRevealed = allNotes.filter(n => Math.floor(n.delay) <= diffSeconds)
      
      if (newRevealed.length > revealedNotes.length) {
        const mapped = newRevealed.map(n => ({
          ...n,
          timestamp: formatTime(n.delay)
        }))
        setRevealedNotes(mapped)
        
        const state = JSON.parse(sessionStorage.getItem(sessionKey))
        state.revealedNotes = mapped
        sessionStorage.setItem(sessionKey, JSON.stringify(state))

        // Periodic Sync to DB (every 3 notes or significant progress)
        if (mapped.length >= lastSyncedNotesRef.current + 3) {
          lastSyncedNotesRef.current = mapped.length
          fetch('/api/interviews/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              interview_id: interview.id,
              candidate: candidate,
              notes: mapped.map(m => m.text),
              isPartial: true // Optional flag if we want to distinguish
            }),
            keepalive: true
          }).catch(err => console.error("Auto-sync failed", err))
        }
      }

    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isLoaded, allNotes, revealedNotes.length, isEnding, interviewerSpeaking, candidateSpeaking, interview.id, candidate])

  // Actions
  const handleToggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    updateSession({ isMuted: next })
  }

  const handleToggleCamera = () => {
    const next = !isCameraOff
    setIsCameraOff(next)
    updateSession({ isCameraOff: next })
  }

  const updateSession = (changes) => {
    const sessionKey = `interview_${interview.id}`
    const saved = sessionStorage.getItem(sessionKey)
    if (saved) {
      sessionStorage.setItem(sessionKey, JSON.stringify({ ...JSON.parse(saved), ...changes }))
    }
  }

  const handleEndInterview = async () => {
    isCompletedRef.current = true
    setIsEnding(true)
    setShowConfirm(false)
    clearInterval(timerRef.current)

    try {
      const res = await fetch('/api/interviews/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interview_id: interview.id,
          candidate: candidate, // passed to help generate transcript
          notes: revealedNotes.map(n => n.text)
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        sessionStorage.removeItem(`interview_${interview.id}`)
        router.push('/admin/interviews')
      } else {
        alert("Failed to complete interview: " + data.error)
        setIsEnding(false)
      }
    } catch (e) {
      alert("Error ending interview: " + e.message)
      setIsEnding(false)
    }
  }

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Initializing Room...</div>

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      
      {/* 3-Column Main Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Interviewer */}
        <AvatarPanel 
          name={interviewerName}
          role="Hiring Manager"
          initials={interviewerName.substring(0, 2).toUpperCase()}
          colorClass="bg-[#7c6ef0]"
          isSpeaking={interviewerSpeaking}
        />

        {/* Center: Candidate */}
        <AvatarPanel 
          name={candidate.name}
          role={candidate.role?.title || 'Candidate'}
          initials={candidate.name.substring(0, 2).toUpperCase()}
          colorClass="bg-[#4b5563]"
          isSpeaking={candidateSpeaking}
        />

        {/* Right: AI Notetaker */}
        <NotesFeed 
          notes={revealedNotes} 
          noteCount={revealedNotes.length} 
          isAnalyzing={isAnalyzing}
        />

      </div>

      {/* Bottom Control Bar */}
      <div className="h-[80px] bg-[#12121a] border-t border-[#2a2a35] flex items-center justify-between px-8 shrink-0">
        
        <div className="flex items-center gap-4 w-[200px]">
          <span className="font-mono text-xl text-gray-300 bg-[#1e1e2d] px-4 py-1.5 rounded-lg border border-[#2a2a35] tracking-wider">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2a2a35] hover:bg-[#3a3a45] text-white'
            }`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          
          <button 
            onClick={handleToggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isCameraOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-[#2a2a35] hover:bg-[#3a3a45] text-white'
            }`}
          >
            {isCameraOff ? '🚫' : '📷'}
          </button>
        </div>

        <div className="w-[200px] flex justify-end">
          <button 
            onClick={() => setShowConfirm(true)}
            disabled={isEnding}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            {isEnding ? 'Ending...' : 'End Interview'}
          </button>
        </div>

      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#12121a] border border-[#2a2a35] p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">End Interview?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will officially end the session and generate the AI transcript and bias report.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 font-medium text-gray-300 hover:bg-[#2a2a35] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEndInterview}
                className="px-4 py-2 font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                End & Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
