'use client'

import { useState, useEffect } from 'react'
import { createRoleAction, updateRoleAction } from '@/actions/roleActions'

export default function RoleFormModal({ isOpen, onClose, role, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    team: '',
    location: '',
    level: 'Senior',
    description: '',
    requirements: '',
    status: 'OPEN'
  })

  useEffect(() => {
    if (role) {
      // Split jd_text back into description and requirements
      const [description, ...requirementsParts] = role.jd_text.split('\n\nRequirements:\n')
      setFormData({
        title: role.title || '',
        team: role.team || '',
        location: role.location || '',
        level: role.level || 'Senior',
        description: description || '',
        requirements: requirementsParts.join('\n\nRequirements:\n') || '',
        status: role.status || 'OPEN'
      })
    } else {
      setFormData({
        title: '',
        team: '',
        location: '',
        level: 'Senior',
        description: '',
        requirements: '',
        status: 'OPEN'
      })
    }
    setError(null)
  }, [role, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const form = new FormData(e.target)
    
    try {
      let res
      if (role) {
        res = await updateRoleAction(role.id, form)
      } else {
        res = await createRoleAction(form)
      }

      if (res.success) {
        onSuccess(res.role)
      } else {
        setError(res.error)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{role ? 'Edit Role' : 'Create New Role'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define the parameters of the job opening.</p>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm italic">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Job Title</label>
              <input
                name="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Team</label>
              <input
                name="team"
                required
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="e.g. Product, Engineering"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Location</label>
              <input
                name="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="e.g. Remote (US), London"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Experience Level</label>
              <div className="relative">
                <select
                  name="level"
                  required
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Senior">Senior</option>
                  <option value="Mid">Mid</option>
                  <option value="Junior">Junior</option>
                  <option value="Intern">Intern</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">↓</div>
              </div>
            </div>
          </div>

          {role && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
              <div className="flex gap-4">
                {['OPEN', 'CLOSED'].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={formData.status === s}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="hidden"
                    />
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                      formData.status === s 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                        : 'bg-gray-50 text-gray-400 border border-gray-100'
                    }`}>
                      {s}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Job Description</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Key Requirements</label>
            <textarea
              name="requirements"
              required
              rows={4}
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
              placeholder="e.g. 5+ years React experience, SQL proficiency..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => e.currentTarget.closest('div').previousElementSibling.requestSubmit()}
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-2.5 text-sm font-semibold text-white shadow-xl shadow-indigo-100 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isLoading && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {role ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  )
}
