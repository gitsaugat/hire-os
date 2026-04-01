import { supabaseAdmin } from '@/lib/supabase-admin'
import RolesTable from './RolesTable'

export const metadata = {
  title: 'Roles Management – HireOS Admin',
}

export default async function AdminRolesPage() {
  const { data: roles, error } = await supabaseAdmin
    .from('roles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          <p className="font-bold">Error loading roles</p>
          <p className="text-sm opacity-80">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <RolesTable initialRoles={roles || []} />
    </div>
  )
}
