'use client'
import Nav from '@/components/nav'
import { supabase, Contact } from '@/lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ContactenPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: '', notes: '' })

  useEffect(() => {
    supabase.from('contacts').select('*, companies(name)').order('last_name').then(({ data }) => setContacts(data ?? []))
  }, [])

  const filtered = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email ?? ''} ${(c as any).companies?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  async function save() {
    if (!form.first_name || !form.last_name) return
    const { data } = await supabase.from('contacts').insert([form]).select('*, companies(name)').single()
    if (data) setContacts(prev => [...prev, data])
    setForm({ first_name: '', last_name: '', email: '', phone: '', role: '', notes: '' })
    setShowForm(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Contacten</h1>
          <button onClick={() => setShowForm(true)} className="bg-[#0082f3] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#0050bd] transition-colors">
            + Nieuw contact
          </button>
        </div>

        <input
          type="text"
          placeholder="Zoek op naam, e-mail of bedrijf..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#0082f3] bg-white"
        />

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
            <h2 className="font-semibold text-slate-800 mb-4">Nieuw contact</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Voornaam *" value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]" />
              <input placeholder="Achternaam *" value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]" />
              <input placeholder="E-mailadres" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]" />
              <input placeholder="Telefoon" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]" />
              <input placeholder="Functie" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3] col-span-2" />
            </div>
            <textarea placeholder="Notities" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3] mb-3 h-20 resize-none" />
            <div className="flex gap-2">
              <button onClick={save} className="bg-[#0082f3] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#0050bd]">Opslaan</button>
              <button onClick={() => setShowForm(false)} className="text-slate-600 text-sm px-4 py-2 rounded-lg hover:bg-slate-100">Annuleren</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Naam</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Bedrijf</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">E-mail</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Telefoon</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Bron</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Geen contacten gevonden</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/contacten/${c.id}`} className="font-medium text-[#182f7c] hover:underline">
                      {c.first_name} {c.last_name}
                    </Link>
                    {c.role && <p className="text-slate-400 text-xs">{c.role}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(c as any).companies?.name ?? 'â€”'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email ?? 'â€”'}</td>
                  <td className=”px-4 py-3 text-slate-600”>{c.phone ?? '—'}</td>
                  <td className=”px-4 py-3”>
                    {(c as any).imported_by
                      ? <span className=”text-xs px-2 py-0.5 rounded-full bg-[#b9d5fc] text-[#182f7c] font-medium”>{(c as any).imported_by}</span>
                      : <span className=”text-xs text-slate-300”>—</span>}
                  </td>
                  <td className=”px-4 py-3”>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'Actief' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

