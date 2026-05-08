'use client'
import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const INTERACTION_TYPES = ['Email', 'Gesprek', 'Fyxer', 'Notitie']

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const [contact, setContact] = useState<any>(null)
  const [interactions, setInteractions] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [iForm, setIForm] = useState({ type: 'Email', title: '', content: '', fyxer_summary: '', direction: 'Inkomend', date: new Date().toISOString().slice(0, 10) })
  const [tForm, setTForm] = useState({ title: '', description: '', due_date: '', priority: 'Normaal' })

  useEffect(() => {
    supabase.from('contacts').select('*, companies(name)').eq('id', id).single().then(({ data }) => setContact(data))
    supabase.from('interactions').select('*').eq('contact_id', id).order('date', { ascending: false }).then(({ data }) => setInteractions(data ?? []))
    supabase.from('tasks').select('*').eq('contact_id', id).order('due_date', { ascending: true }).then(({ data }) => setTasks(data ?? []))
  }, [id])

  async function saveInteraction() {
    if (!iForm.title) return
    const { data } = await supabase.from('interactions').insert([{ ...iForm, contact_id: id }]).select().single()
    if (data) setInteractions(prev => [data, ...prev])
    setIForm({ type: 'Email', title: '', content: '', fyxer_summary: '', direction: 'Inkomend', date: new Date().toISOString().slice(0, 10) })
    setShowInteractionForm(false)
  }

  async function saveTask() {
    if (!tForm.title) return
    const { data } = await supabase.from('tasks').insert([{ ...tForm, contact_id: id }]).select().single()
    if (data) setTasks(prev => [...prev, data])
    setTForm({ title: '', description: '', due_date: '', priority: 'Normaal' })
    setShowTaskForm(false)
  }

  async function toggleTask(taskId: string, current: string) {
    const newStatus = current === 'Afgerond' ? 'Open' : 'Afgerond'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  if (!contact) return <div className="min-h-screen flex flex-col"><Nav /><main className="p-6 text-slate-400">Laden...</main></div>

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/contacten" className="text-sm text-slate-400 hover:text-slate-600">← Terug naar contacten</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{contact.first_name} {contact.last_name}</h1>
          <div className="flex gap-4 mt-1 text-sm text-slate-500">
            {contact.role && <span>{contact.role}</span>}
            {contact.companies && <span>· {contact.companies.name}</span>}
            {contact.email && <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">· {contact.email}</a>}
            {contact.phone && <span>· {contact.phone}</span>}
          </div>
          {contact.notes && <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">{contact.notes}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Interacties</h2>
              <button onClick={() => setShowInteractionForm(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">+ Toevoegen</button>
            </div>

            {showInteractionForm && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select value={iForm.type} onChange={e => setIForm(p => ({...p, type: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {INTERACTION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={iForm.direction} onChange={e => setIForm(p => ({...p, direction: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Inkomend</option><option>Uitgaand</option>
                  </select>
                  <input type="date" value={iForm.date} onChange={e => setIForm(p => ({...p, date: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input placeholder="Onderwerp / titel *" value={iForm.title} onChange={e => setIForm(p => ({...p, title: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <textarea placeholder="Inhoud" value={iForm.content} onChange={e => setIForm(p => ({...p, content: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-20 resize-none" />
                {iForm.type === 'Fyxer' && <textarea placeholder="Fyxer samenvatting" value={iForm.fyxer_summary} onChange={e => setIForm(p => ({...p, fyxer_summary: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16 resize-none" />}
                <div className="flex gap-2">
                  <button onClick={saveInteraction} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">Opslaan</button>
                  <button onClick={() => setShowInteractionForm(false)} className="text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-100">Annuleren</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {interactions.length === 0 && <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-xl p-4">Nog geen interacties</p>}
              {interactions.map(i => (
                <div key={i.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i.type === 'Email' ? 'bg-blue-100 text-blue-700' :
                      i.type === 'Fyxer' ? 'bg-purple-100 text-purple-700' :
                      i.type === 'Gesprek' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{i.type}</span>
                    {i.direction && <span className="text-xs text-slate-400">{i.direction}</span>}
                    <span className="text-xs text-slate-400 ml-auto">{new Date(i.date).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <p className="font-medium text-slate-800 text-sm">{i.title}</p>
                  {i.content && <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{i.content}</p>}
                  {i.fyxer_summary && <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-800"><span className="font-semibold">Fyxer samenvatting:</span> {i.fyxer_summary}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Taken</h2>
              <button onClick={() => setShowTaskForm(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">+ Toevoegen</button>
            </div>

            {showTaskForm && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
                <input placeholder="Taak *" value={tForm.title} onChange={e => setTForm(p => ({...p, title: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="date" value={tForm.due_date} onChange={e => setTForm(p => ({...p, due_date: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={tForm.priority} onChange={e => setTForm(p => ({...p, priority: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Hoog</option><option>Normaal</option><option>Laag</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={saveTask} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">Opslaan</button>
                  <button onClick={() => setShowTaskForm(false)} className="text-slate-600 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100">Annuleren</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {tasks.length === 0 && <p className="text-sm text-slate-400 bg-white border border-slate-200 rounded-xl p-4">Geen taken</p>}
              {tasks.map(t => (
                <div key={t.id} className={`bg-white border rounded-xl p-3 flex items-start gap-3 ${t.status === 'Afgerond' ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
                  <input type="checkbox" checked={t.status === 'Afgerond'} onChange={() => toggleTask(t.id, t.status)} className="mt-0.5 h-4 w-4 accent-blue-600 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'Afgerond' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.due_date && <span className="text-xs text-slate-400">{new Date(t.due_date).toLocaleDateString('nl-NL')}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.priority === 'Hoog' ? 'bg-red-100 text-red-700' : t.priority === 'Laag' ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>{t.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
