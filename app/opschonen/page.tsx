'use client'
import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_id: string | null
  companies?: { name: string } | { name: string }[]
}

type DuplicateGroup = {
  reason: string
  contacts: Contact[]
  keepId: string
}

function normalizePhone(phone: string | null) {
  if (!phone) return null
  return phone.replace(/[\s\-().+]/g, '').replace(/^00/, '').replace(/^0/, '31')
}

export default function OpschonenPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletedCount, setDeletedCount] = useState(0)

  async function scan() {
    setScanning(true)
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, company_id, companies(name)')
      .limit(1000)

    if (!data) { setScanning(false); return }

    const foundGroups: DuplicateGroup[] = []
    const seen = new Set<string>()

    // Group by exact email
    const byEmail = new Map<string, Contact[]>()
    for (const c of data) {
      if (!c.email) continue
      const key = c.email.toLowerCase().trim()
      if (!byEmail.has(key)) byEmail.set(key, [])
      byEmail.get(key)!.push(c)
    }
    for (const [email, group] of byEmail) {
      if (group.length < 2) continue
      const ids = group.map(c => c.id).sort().join(',')
      if (seen.has(ids)) continue
      seen.add(ids)
      foundGroups.push({ reason: `Zelfde e-mail: ${email}`, contacts: group, keepId: group[0].id })
    }

    // Group by full name
    const byName = new Map<string, Contact[]>()
    for (const c of data) {
      const key = `${c.first_name?.toLowerCase().trim()} ${c.last_name?.toLowerCase().trim()}`
      if (!byName.has(key)) byName.set(key, [])
      byName.get(key)!.push(c)
    }
    for (const [name, group] of byName) {
      if (group.length < 2) continue
      const ids = group.map(c => c.id).sort().join(',')
      if (seen.has(ids)) continue
      seen.add(ids)
      foundGroups.push({ reason: `Zelfde naam: ${name}`, contacts: group, keepId: group[0].id })
    }

    // Group by normalized phone
    const byPhone = new Map<string, Contact[]>()
    for (const c of data) {
      const phone = normalizePhone(c.phone)
      if (!phone || phone.length < 8) continue
      if (!byPhone.has(phone)) byPhone.set(phone, [])
      byPhone.get(phone)!.push(c)
    }
    for (const [phone, group] of byPhone) {
      if (group.length < 2) continue
      const ids = group.map(c => c.id).sort().join(',')
      if (seen.has(ids)) continue
      seen.add(ids)
      foundGroups.push({ reason: `Zelfde telefoonnummer: ${phone}`, contacts: group, keepId: group[0].id })
    }

    setGroups(foundGroups)
    setScanning(false)
    setScanned(true)
  }

  function setKeep(groupIndex: number, contactId: string) {
    setGroups(prev => prev.map((g, i) => i === groupIndex ? { ...g, keepId: contactId } : g))
  }

  function removeGroup(groupIndex: number) {
    setGroups(prev => prev.filter((_, i) => i !== groupIndex))
  }

  async function deleteSelected() {
    setDeleting(true)
    let count = 0
    for (const group of groups) {
      const toDelete = group.contacts.filter(c => c.id !== group.keepId)
      for (const c of toDelete) {
        await supabase.from('contacts').delete().eq('id', c.id)
        count++
      }
    }
    setDeletedCount(count)
    setGroups([])
    setDeleting(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Contacten opschonen</h1>
        <p className="text-sm text-slate-500 mb-6">Zoek dubbele contacten op basis van naam, e-mail of telefoonnummer en verwijder ze.</p>

        {!scanned && (
          <button
            onClick={scan}
            disabled={scanning}
            className="bg-[#0082f3] text-white px-6 py-3 rounded-lg hover:bg-[#0050bd] disabled:opacity-50 text-sm font-medium"
          >
            {scanning ? 'Bezig met scannen...' : 'Scan op dubbelen'}
          </button>
        )}

        {scanned && groups.length === 0 && deletedCount === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <p className="text-xl font-bold text-green-700 mb-1">Geen dubbelen gevonden</p>
            <p className="text-green-600 text-sm">Je contactenlijst is schoon.</p>
          </div>
        )}

        {deletedCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mb-6">
            <p className="text-xl font-bold text-green-700 mb-1">✓ {deletedCount} dubbele contacten verwijderd</p>
            <button onClick={() => { setScanned(false); setDeletedCount(0) }} className="mt-4 text-sm text-[#0082f3] hover:underline">Opnieuw scannen</button>
          </div>
        )}

        {groups.length > 0 && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="text-amber-800 font-medium">{groups.length} groep{groups.length > 1 ? 'en' : ''} met mogelijke dubbelen gevonden</p>
              <p className="text-amber-600 text-sm mt-0.5">Kies per groep welk contact je wil behouden. De rest wordt verwijderd.</p>
            </div>

            <div className="space-y-4 mb-6">
              {groups.map((group, gi) => (
                <div key={gi} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">{group.reason}</span>
                    <button onClick={() => removeGroup(gi)} className="text-xs text-slate-400 hover:text-slate-600">Negeren</button>
                  </div>
                  {group.contacts.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setKeep(gi, c.id)}
                      className={`flex items-center gap-4 px-4 py-3 border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${group.keepId === c.id ? 'bg-[#f0f7ff]' : 'hover:bg-slate-50'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${group.keepId === c.id ? 'border-blue-600 bg-[#0082f3]' : 'border-slate-300'}`}>
                        {group.keepId === c.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-slate-400">
                          {[(c as any).companies?.name, c.email, c.phone].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${group.keepId === c.id ? 'bg-[#b9d5fc] text-[#182f7c]' : 'bg-red-100 text-red-600'}`}>
                        {group.keepId === c.id ? 'Behouden' : 'Verwijderen'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              {deleting ? 'Bezig...' : `Verwijder dubbelen uit ${groups.length} groep${groups.length > 1 ? 'en' : ''}`}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

