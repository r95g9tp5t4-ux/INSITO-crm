'use client'
import Nav from '@/components/nav'
import { supabase, Company } from '@/lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const TYPES = ['Klant', 'Prospect', 'Partner', 'Leverancier']

export default function BedrijvenPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'Klant', sector: '', website: '', notes: '' })

  useEffect(() => {
    supabase.from('companies').select('*').order('name').then(({ data }) => setCompanies(data ?? []))
  }, [])

  const filtered = companies.filter(c =>
    `${c.name} ${c.sector ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  async function save() {
    if (!form.name) return
    const { data } = await supabase.from('companies').insert([form]).select().single()
    if (data) setCompanies(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setForm({ name: '', type: 'Klant', sector: '', website: '', notes: '' })
    setShowForm(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Bedrijven</h1>
          <button onClick={() => setShowForm(true)} className="bg-[#0082f3] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#0050bd] transition-colors">
            + Nieuw bedrijf
          </button>
        </div>

        <input
          type="text"
          placeholder="Zoek op naam of sector..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-[#0082f3] bg-white"
        />

        {showForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
            <h2 className="font-semibold text-slate-800 mb-4">Nieuw bedrijf</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Bedrijfsnaam *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3] col-span-2" />
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input placeholder="Sector" value={form.sector} onChange={e => setForm(p => ({...p, sector: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]" />
              <input placeholder="Website" value={form.website} onChange={e => setForm(p => ({...p, website: e.target.value}))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3] col-span-2" />
            </div>
            <textarea placeholder="Notities" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3] mb-3 h-16 resize-none" />
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
                <th className="text-left px-4 py-3 font-medium text-slate-600">Bedrijf</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Sector</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Website</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Geen bedrijven gevonden</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/bedrijven/${c.id}`} className="font-medium text-[#182f7c] hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.type === 'Klant' ? 'bg-green-100 text-green-700' :
                      c.type === 'Prospect' ? 'bg-[#b9d5fc] text-[#182f7c]' :
                      c.type === 'Partner' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{c.type ?? 'â€”'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.sector ?? 'â€”'}</td>
                  <td className="px-4 py-3">
                    {c.website ? <a href={c.website} target="_blank" rel="noreferrer" className="text-[#0082f3] hover:underline">{c.website}</a> : 'â€”'}
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

