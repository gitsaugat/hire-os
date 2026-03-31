import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await req.json()
    const { salary, equity, start_date, expiration_date, notes } = body

    const { data, error } = await supabaseAdmin
      .from('offers')
      .update({
        salary: parseFloat(salary),
        equity,
        start_date,
        expiration_date,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, offer: data })
  } catch (error) {
    console.error('[UpdateOfferAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
