import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function Dashboard() {
  const [{ data: tasks }, { data: interactions }, { data: contacts }] = await Promise.all([
    supabase.from('tasks').select('*, contacts(first_name, last_name)').eq('status', 'Open').order('due_date', { ascending: true }).limit(10),
    supabase.from('interactions').select('*, contacts(first_name, last_name)').order('date', { ascending: false }).limit(8),
    supabase.from('contacts').select('id'),
  ])

  const overdue = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date()) ?? []
  const upcoming = tasks?.filter(t => !t.due_date || new Date(t.due_date) >= new Date()) ?? []

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Contacten</p>
            <p className="text-3xl font-bold text-blue-700">{contacts?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Open taken</p>
            <p className="text-3xl font-bold text-blue-700">{tasks?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Verlopen taken</p>
            <p className="text-3xl font-bold text-red-600">{overdue.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Openstaande taken</h2>
            {upcoming.length === 0 && <p className="text-sm text-slate-400">Geen openstaande taken</p>}
            <ul className="space-y-2">
              {upcoming.map(t => (
                <li key={t.id} className="flex items-start justify-between gap-2 text-sm py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{t.title}</p>
                    {t.contacts && <p className="text-slate-500">{t.contacts.first_name} {t.contacts.last_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.due_date && <span className="text-xs text-slate-400">{new Date(t.due_date).toLocaleDateString('nl-NL')}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.priority === 'Hoog' ? 'bg-red-100 text-red-700' :
                      t.priority === 'Laag' ? 'bg-slate-100 text-slate-500' :
                      'bg-blue-100 text-blue-700'
                    }`}>{t.priority}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/taken" className="mt-3 inline-block text-xs text-blue-600 hover:underline">Alle taken →</Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Recente interacties</h2>
            {(!interactions || interactions.length === 0) && <p className="text-sm text-slate-400">Nog geen interacties</p>}
            <ul className="space-y-2">
              {interactions?.map(i => (
                <li key={i.id} className="text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i.type === 'Email' ? 'bg-blue-100 text-blue-700' :
                      i.type === 'Fyxer' ? 'bg-purple-100 text-purple-700' :
                      i.type === 'Gesprek' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{i.type}</span>
                    <span className="text-slate-400 text-xs">{new Date(i.date).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <p className="font-medium text-slate-800">{i.title}</p>
                  {i.contacts && <p className="text-slate-500 text-xs">{i.contacts.first_name} {i.contacts.last_name}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
