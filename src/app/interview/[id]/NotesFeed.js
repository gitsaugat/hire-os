'use client'

import { useEffect, useRef } from 'react'

export default function NotesFeed({ notes, noteCount, isAnalyzing }) {
  const scrollRef = useRef(null)

  // Auto-scroll to bottom when new notes arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [notes, isAnalyzing])

  return (
    <div className="flex flex-col h-full bg-[#12121a] border-l border-[#2a2a35] w-[320px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a35] bg-[#0a0a0f]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-sm font-bold text-white tracking-widest uppercase">Read.ai Bot</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-medium bg-[#1e1e2d] px-2 py-0.5 rounded-full">
            {noteCount} Note{noteCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Feed Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth min-h-0"
      >
        {notes.length === 0 && !isAnalyzing ? (
          <div className="text-center mt-10 text-gray-500 text-xs">
            Awaiting meeting start...
          </div>
        ) : null}

        {notes.map((note, index) => {
          let borderClass = 'border-l-4 border-transparent'
          let bgClass = 'bg-[#1e1e2d]'
          
          if (note.type === 'highlight') {
            borderClass = 'border-l-4 border-[#7c6ef0]'
            bgClass = 'bg-[#1e1e2d]/80'
          } else if (note.type === 'flag') {
            borderClass = 'border-l-4 border-amber-500'
            bgClass = 'bg-amber-500/10'
          }

          return (
            <div 
              key={index} 
              className={`p-3 rounded-r-lg ${bgClass} ${borderClass} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 font-mono font-medium">
                  {note.timestamp || '0:00'}
                </span>
                {note.type === 'highlight' && <span className="text-[10px] text-[#7c6ef0] font-bold uppercase tracking-wider">Highlight</span>}
                {note.type === 'flag' && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Review Flag</span>}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {note.text}
              </p>
            </div>
          )
        })}

        {/* Live Analyzing Shimmer */}
        {isAnalyzing && (
          <div className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-[#1e1e2d]/50 animate-pulse">
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7c6ef0] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#7c6ef0] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#7c6ef0] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400 italic">AI is analyzing context...</span>
          </div>
        )}
      </div>
    </div>
  )
}
