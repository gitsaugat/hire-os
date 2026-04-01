'use client'

import { useState } from 'react'
import RoleFormModal from './RoleFormModal'
import { deleteRoleAction } from '@/actions/roleActions'
import Pagination from '@/components/admin/Pagination'

export default function RolesTable({ initialRoles }) {
  const [roles, setRoles] = useState(initialRoles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const handleCreate = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleEdit = (role) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleDelete = async (role) => {
    if (!confirm(`Are you sure you want to delete "${role.title}"? This action cannot be undone.`)) return

    setIsDeleting(true)
    setError(null)
    try {
      const res = await deleteRoleAction(role.id)
      if (res.success) {
        setRoles(roles.filter(r => r.id !== role.id))
      } else {
        setError(res.error)
      }
    } catch (err) {
      setError('Failed to delete role.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-in fade-in duration-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage job openings and role descriptions.</p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <span>+</span> Add Role
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Title & Team</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Location</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Level</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {roles.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((role) => (
              <tr key={role.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{role.title}</div>
                  <div className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mt-0.5">{role.team}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{role.location}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {role.level}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    role.status === 'OPEN' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${role.status === 'OPEN' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {role.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(role)}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={isDeleting}
                      className="text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm italic">
                  No roles found. Create your first opening.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage}
          totalCount={roles.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={editingRole}
        onSuccess={(updatedRole) => {
          if (editingRole) {
            setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r))
          } else {
            setRoles([updatedRole, ...roles])
          }
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}
