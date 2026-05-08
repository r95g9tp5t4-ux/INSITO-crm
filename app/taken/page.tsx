'use client'
import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function TakenPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [filter, setFilter] = useState<'Open' | 'Afgerond' | 'Alles'>('Open')

  useEffect(() => {
    supabase.from('tasks').select('*, contacts(id, first_name, last_name), companies(id, name)')
      .order('due_date', { ascending: true })
      .then(({ data }) => setTasks(data ?? []))
  }, [])

  const filtered = tasks.filter(t => filter === 'Alles' ? true : t.status === filter)

  async function toggle(id: string, current: string) {
    const newStatus = current === 'Afgerond' ? 'Open' : 'Afgerond'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  const overdue = filtered.filter(t => t.status === 'Open' && t.due_date && new Date(t.due_date) < new Date())

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Taken</h1>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['Open', 'Afgerond', 'Alles'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-sm px-3 py-1.5 rounded-md transition-colors ${filter === f ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
            ))}
          </div>
        </div>

        {overdue.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-sm font-semibold text-red-700 mb-2">Verlopen taken ({overdue.length})</p>
            <ul className="space-y-1">
              {overdue.map(t => (
                <li key={t.id} className="flex items-center gap-2 text-sm text-red-700">
                  <input type="checkbox" onChange={() => toggle(t.id, t.status)} className="h-4 w-4 accent-red-600 cursor-pointer" />
                  <span>{t.title}</span>
                  {t.contacts && <Link href={`/contacten/${t.contacts.id}`} className="text-red-500 hover:underline text-xs">({t.contacts.first_name} {t.contacts.last_name})</Link>}
                  <span className="text-xs ml-auto">{new Date(t.due_date).toLocaleDateString('nl-NL')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          {filtered.filter(t => !overdue.includes(t)).length === 0 && overdue.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">Geen taken</div>
          )}
          {filtered.filter(t => !overdue.includes(t)).map(t => (
            <div key={t.id} className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${t.status === 'Afgerond' ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
              <input type="checkbox" checked={t.status === 'Afgerond'} onChange={() => toggle(t.id, t.status)} className="h-4 w-4 accent-[#0082f3] cursor-pointer shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'Afgerond' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {t.contacts && <Link href={`/contacten/${t.contacts.id}`} className="text-xs text-[#0082f3] hover:underline">{t.contacts.first_name} {t.contacts.last_name}</Link>}
                  {t.companies && <Link href={`/bedrijven/${t.companies.id}`} className="text-xs text-slate-400 hover:underline">{t.companies.name}</Link>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.due_date && <span className="text-xs text-slate-400">{new Date(t.due_date).toLocaleDateString('nl-NL')}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.priority === 'Hoog' ? 'bg-red-100 text-red-700' : t.priority === 'Laag' ? 'bg-slate-100 text-slate-500' : 'bg-[#b9d5fc] text-[#182f7c]'}`}>{t.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

