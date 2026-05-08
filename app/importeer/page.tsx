'use client'
import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

type MatchStatus = 'new' | 'duplicate' | 'maybe'

type ParsedContact = {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company: string | null
  matchStatus?: MatchStatus
  matchReason?: string
  selected?: boolean
}

function normalizePhone(phone: string | null) {
  if (!phone) return null
  return phone.replace(/[\s\-().+]/g, '').replace(/^00/, '').replace(/^0/, '31')
}

function parseVcf(text: string): ParsedContact[] {
  const contacts: ParsedContact[] = []
  const cards = text.split(/BEGIN:VCARD/i).filter(c => c.trim())
  for (const card of cards) {
    const get = (key: string) => {
      const match = card.match(new RegExp(`^${key}[^:]*:(.+)$`, 'im'))
      return match ? match[1].trim().replace(/\\n/g, ' ').replace(/\\,/g, ',') : null
    }
    const fnLine = get('FN') ?? ''
    const nLine = get('N') ?? ''
    let firstName = ''
    let lastName = ''
    if (nLine) {
      const parts = nLine.split(';')
      lastName = parts[0]?.trim() ?? ''
      firstName = parts[1]?.trim() ?? ''
    }
    if (!firstName && !lastName && fnLine) {
      const parts = fnLine.split(' ')
      firstName = parts[0] ?? ''
      lastName = parts.slice(1).join(' ')
    }
    const company = get('ORG') ?? null
    const email = card.match(/EMAIL[^:]*:(.+)/i)?.[1]?.trim() ?? null
    const phone = card.match(/TEL[^:]*:(.+)/i)?.[1]?.trim() ?? null
    if (firstName || lastName) {
      contacts.push({ first_name: firstName, last_name: lastName, email, phone, company })
    }
  }
  return contacts
}

export default function ImporteerPage() {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [importedBy, setImportedBy] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('payroll')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const all = parseVcf(text)
      const keyword = filterKeyword.trim().toLowerCase()
      const payroll = keyword
        ? all.filter(c => c.company?.toLowerCase().includes(keyword))
        : all

      const { data: existing } = await supabase.from('contacts').select('first_name, last_name, email, phone').limit(1000)

      const existingEmails = new Set(existing?.map(c => c.email?.toLowerCase().trim()).filter(Boolean))
      const existingNames = new Set(existing?.map(c => `${c.first_name?.toLowerCase().trim()} ${c.last_name?.toLowerCase().trim()}`))
      const existingLastFirstLetter = new Set(existing?.map(c => `${c.last_name?.toLowerCase().trim()} ${c.first_name?.[0]?.toLowerCase() ?? ''}`))
      const existingPhones = new Set(existing?.map(c => normalizePhone(c.phone)).filter(Boolean))

      const result = payroll.map(c => {
        const emailMatch = c.email && existingEmails.has(c.email.toLowerCase().trim())
        const nameMatch = existingNames.has(`${c.first_name.toLowerCase().trim()} ${c.last_name.toLowerCase().trim()}`)
        const lastFirstMatch = c.last_name && existingLastFirstLetter.has(`${c.last_name.toLowerCase().trim()} ${c.first_name?.[0]?.toLowerCase() ?? ''}`)
        const phoneMatch = normalizePhone(c.phone) && existingPhones.has(normalizePhone(c.phone))

        if (emailMatch || nameMatch) {
          return { ...c, matchStatus: 'duplicate' as MatchStatus, matchReason: emailMatch ? 'Zelfde e-mail' : 'Zelfde naam', selected: false }
        } else if (lastFirstMatch || phoneMatch) {
          return { ...c, matchStatus: 'maybe' as MatchStatus, matchReason: phoneMatch ? 'Zelfde telefoonnummer' : 'Zelfde achternaam + initiaal', selected: false }
        } else {
          return { ...c, matchStatus: 'new' as MatchStatus, selected: true }
        }
      })

      setContacts(result)
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  function toggleContact(index: number) {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c))
  }

  async function importContacts() {
    setImporting(true)
    let count = 0
    let skipped = 0
    for (const c of contacts) {
      if (!c.selected) { skipped++; continue }
      try {
        await supabase.from('contacts').insert([{
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          notes: c.company ? `Bedrijf telefoon: ${c.company}` : null,
          status: 'Actief',
          imported_by: importedBy.trim() || null
        }])
        count++
      } catch {}
    }
    setImportedCount(count)
    setSkippedCount(skipped)
    setImporting(false)
    setStep('done')
  }

  const newOnes = contacts.filter(c => c.matchStatus === 'new')
  const maybeOnes = contacts.filter(c => c.matchStatus === 'maybe')
  const duplicateOnes = contacts.filter(c => c.matchStatus === 'duplicate')
  const selectedCount = contacts.filter(c => c.selected).length

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Contacten importeren</h1>
        <p className="text-sm text-slate-500 mb-6">Importeer contacten uit je telefoon waar &quot;payroll&quot; in de bedrijfsnaam staat.</p>

        {step === ‘upload’ && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jouw naam <span className="text-red-500">*</span></label>
                <input
                  placeholder="Bijv. Hjalmar"
                  value={importedBy}
                  onChange={e => setImportedBy(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]"
                />
                <p className="text-xs text-slate-400 mt-1">Wordt opgeslagen bij elk geïmporteerd contact</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter op bedrijfsnaam</label>
                <input
                  placeholder="Bijv. payroll (leeg = alles)"
                  value={filterKeyword}
                  onChange={e => setFilterKeyword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0082f3]"
                />
                <p className="text-xs text-slate-400 mt-1">Laat leeg om alle contacten te importeren</p>
              </div>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
              <p className="text-slate-600 mb-2 font-medium">Exporteer je contacten als .vcf bestand</p>
              <p className="text-sm text-slate-400 mb-5">
                iPhone: iCloud.com → Contacten → Selecteer alles → Exporteer vCard<br />
                Android: Contacten-app → Menu → Exporteren → .vcf
              </p>
              <label className={`cursor-pointer text-white px-6 py-3 rounded-lg transition-colors text-sm font-medium ${!importedBy.trim() ? ‘bg-slate-300 cursor-not-allowed’ : ‘bg-[#0082f3] hover:bg-[#0050bd]’}`}>
                Kies .vcf bestand
                <input type="file" accept=".vcf" onChange={handleFile} disabled={!importedBy.trim()} className="hidden" />
              </label>
              {!importedBy.trim() && <p className="text-xs text-slate-400 mt-3">Vul eerst je naam in</p>}
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{newOnes.length}</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">Nieuw</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{maybeOnes.length}</p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">Mogelijk aanwezig</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-500">{duplicateOnes.length}</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Overgeslagen</p>
              </div>
            </div>

            {contacts.length === 0 ? (
              <p className="text-slate-400 text-sm bg-white border border-slate-200 rounded-xl p-6 text-center">Geen contacten gevonden met &quot;payroll&quot; in de bedrijfsnaam.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-8"></th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Naam</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">E-mail / Tel</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c, i) => (
                      <tr key={i} className={`border-b border-slate-100 last:border-0 ${c.matchStatus === 'duplicate' ? 'opacity-35' : ''}`}>
                        <td className="px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={c.selected ?? false}
                            disabled={c.matchStatus === 'duplicate'}
                            onChange={() => toggleContact(i)}
                            className="h-4 w-4 accent-[#0082f3] cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-800">{c.first_name} {c.last_name}</p>
                          {c.company && <p className="text-xs text-slate-400">{c.company}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">
                          {c.email && <p>{c.email}</p>}
                          {c.phone && <p>{c.phone}</p>}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.matchStatus === 'new' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Nieuw</span>}
                          {c.matchStatus === 'duplicate' && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium" title={c.matchReason}>Al aanwezig</span>}
                          {c.matchStatus === 'maybe' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium" title={c.matchReason}>
                              Mogelijk? ({c.matchReason})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3 items-center">
              {selectedCount > 0 && (
                <button onClick={importContacts} disabled={importing} className="bg-[#0082f3] text-white px-6 py-2.5 rounded-lg hover:bg-[#0050bd] disabled:opacity-50 text-sm font-medium">
                  {importing ? 'Bezig...' : `Importeer ${selectedCount} contacten`}
                </button>
              )}
              <button onClick={() => setStep('upload')} className="text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100 text-sm">
                Ander bestand
              </button>
              {maybeOnes.length > 0 && <p className="text-xs text-slate-400">Vink de oranje contacten aan als ze nieuw zijn</p>}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <p className="text-2xl font-bold text-green-700 mb-1">âœ“ {importedCount} contacten geÃ¯mporteerd</p>
            {skippedCount > 0 && <p className="text-amber-600 text-sm mb-4">{skippedCount} contacten overgeslagen</p>}
            <a href="/contacten" className="bg-[#0082f3] text-white px-6 py-2.5 rounded-lg hover:bg-[#0050bd] text-sm font-medium">
              Bekijk contacten â†’
            </a>
          </div>
        )}
      </main>
    </div>
  )
}

