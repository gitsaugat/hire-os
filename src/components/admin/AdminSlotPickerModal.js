'use client'

import { useState, useEffect } from 'react'
import { fetchRawSlotsAction, reviewSchedulingRequestAction } from '@/actions/schedulingActions'
import { useRouter } from 'next/navigation'

export default function AdminSlotPickerModal({ req, onClose }) {
  const [slots, setSlots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlots, setSelectedSlots] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function getSlots() {
      try {
        const available = await fetchRawSlotsAction(req.candidate_id)
        setSlots(available)
      } catch (err) {
        alert('Failed to fetch slots: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }
    getSlots()
  }, [req.candidate_id])

  const toggleSlot = (slot) => {
    const exists = selectedSlots.find(s => s.start === slot.start)
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => s.start !== slot.start))
    } else {
      if (selectedSlots.length >= 5) return alert('You can only select up to 5 slots.')
      setSelectedSlots([...selectedSlots, slot])
    }
  }

  const handleApprove = async () => {
    if (selectedSlots.length === 0) return alert('Please select at least 1 slot to offer.')
    setIsSubmitting(true)
    const result = await reviewSchedulingRequestAction(req.id, req.candidate_id, 'APPROVED', '', selectedSlots)
    if (result.success) {
      router.refresh()
      onClose()
    } else {
      alert('Error: ' + result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden scale-in-95 duration-200 flex flex-col max-h-[90vh]">
        <header className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-gray-900 tracking-tight text-lg">Approve Reschedule: Select Slots</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">Select up to 5 timeslots to offer {req.candidate?.name?.split(' ')[0]}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-3xl font-light focus:outline-none transition-colors">&times;</button>
        </header>
        
        <div className="p-6 overflow-y-auto bg-[#fafafa] flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Scanning Availability...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl mb-4 block">🗓️</span>
              <p className="text-gray-900 font-bold mb-1">No availability found.</p>
              <p className="text-gray-500 text-sm">There are no generated slots in the next 5 business days.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slots.map((slot, index) => {
                const start = new Date(slot.start)
                const isSelected = selectedSlots.some(s => s.start === slot.start)
                
                return (
                  <button
                    key={index}
                    onClick={() => toggleSlot(slot)}
                    className={`flex flex-col p-4 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200/50 scale-[1.02]' 
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                       <div className="absolute top-3 right-3 h-5 w-5 bg-white rounded-full flex items-center justify-center animate-in zoom-in">
                          <span className="text-indigo-600 text-xs font-black">✓</span>
                       </div>
                    )}
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {start.toLocaleDateString(undefined, { weekday: 'long' })}
                    </div>
                    <div className="text-sm font-bold tracking-tight mb-0.5 opacity-90">
                      {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={`text-xl font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        
        <footer className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            {selectedSlots.length} / 5 Selected
          </span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none"
            >
              Cancel
            </button>
            <button 
              onClick={handleApprove}
              disabled={isSubmitting || selectedSlots.length === 0}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none focus:outline-none"
            >
              {isSubmitting ? 'Approving...' : 'Lock Slots & Approve'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
