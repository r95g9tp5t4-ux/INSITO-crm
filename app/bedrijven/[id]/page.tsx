'use client'
import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function BedrijfDetail() {
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [relations, setRelations] = useState<any[]>([])
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [showRelationForm, setShowRelationForm] = useState(false)
  const [relForm, setRelForm] = useState({ company_b_id: '', relation_type: 'Gerelateerd' })

  useEffect(() => {
    supabase.from('companies').select('*').eq('id', id).single().then(({ data }) => setCompany(data))
    supabase.from('contacts').select('*').eq('company_id', id).order('last_name').then(({ data }) => setContacts(data ?? []))
    supabase.from('company_relations').select('*, company_b:company_b_id(id, name, type)').eq('company_a_id', id).then(({ data }) => setRelations(data ?? []))
    supabase.from('companies').select('id, name').order('name').then(({ data }) => setAllCompanies(data ?? []))
  }, [id])

  async function saveRelation() {
    if (!relForm.company_b_id) return
    const { data } = await supabase.from('company_relations').insert([{ ...relForm, company_a_id: id }]).select('*, company_b:company_b_id(id, name, type)').single()
    if (data) setRelations(prev => [...prev, data])
    setRelForm({ company_b_id: '', relation_type: 'Gerelateerd' })
    setShowRelationForm(false)
  }

  if (!company) return <div className="min-h-screen flex flex-col"><Nav /><main className="p-6 text-slate-400">Laden...</main></div>

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/bedrijven" className="text-sm text-slate-400 hover:text-slate-600">← Terug naar bedrijven</Link>
          <div className="flex items-start justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              <div className="flex gap-3 mt-1 text-sm text-slate-500">
                {company.type && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${company.type === 'Klant' ? 'bg-green-100 text-green-700' : company.type === 'Prospect' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{company.type}</span>}
                {company.sector && <span>{company.sector}</span>}
                {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{company.website}</a>}
              </div>
              {company.notes && <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">{company.notes}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">Contactpersonen ({contacts.length})</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {contacts.length === 0 && <p className="text-sm text-slate-400 p-4">Geen contactpersonen</p>}
              {contacts.map(c => (
                <Link key={c.id} href={`/contacten/${c.id}`} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-blue-700 text-sm">{c.first_name} {c.last_name}</p>
                    {c.role && <p className="text-xs text-slate-400">{c.role}</p>}
                  </div>
                  {c.email && <span className="text-xs text-slate-400">{c.email}</span>}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Gekoppelde bedrijven</h2>
              <button onClick={() => setShowRelationForm(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">+ Koppelen</button>
            </div>

            {showRelationForm && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
                <select value={relForm.company_b_id} onChange={e => setRelForm(p => ({...p, company_b_id: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Kies bedrijf...</option>
                  {allCompanies.filter(c => c.id !== id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="Relatietype (bijv. Moeder, Dochter, Partner)" value={relForm.relation_type} onChange={e => setRelForm(p => ({...p, relation_type: e.target.value}))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button onClick={saveRelation} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">Opslaan</button>
                  <button onClick={() => setShowRelationForm(false)} className="text-slate-600 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100">Annuleren</button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {relations.length === 0 && <p className="text-sm text-slate-400 p-4">Geen gekoppelde bedrijven</p>}
              {relations.map(r => (
                <Link key={r.id} href={`/bedrijven/${r.company_b?.id}`} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <p className="font-medium text-blue-700 text-sm">{r.company_b?.name}</p>
                  <span className="text-xs text-slate-400">{r.relation_type}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
