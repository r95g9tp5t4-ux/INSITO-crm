'use client'
import Nav from '@/components/nav'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

type ParsedContact = {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company: string | null
  isDuplicate?: boolean
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
    const phone = card.match(/TEL[^:]*:(.+)/i)?.[1]?.trim().replace(/\s/g, '') ?? null

    if (firstName || lastName) {
      contacts.push({ first_name: firstName, last_name: lastName, email, phone, company })
    }
  }
  return contacts
}

export default function ImporteerPage() {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [filtered, setFiltered] = useState<ParsedContact[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      const all = parseVcf(text)
      const payrollContacts = all.filter(c =>
        c.company?.toLowerCase().includes('payroll')
      )

      // Fetch all existing contacts to check for duplicates
      const { data: existing } = await supabase
        .from('contacts')
        .select('first_name, last_name, email')
        .limit(1000)

      const existingEmails = new Set(existing?.map(c => c.email?.toLowerCase()).filter(Boolean))
      const existingNames = new Set(existing?.map(c => `${c.first_name?.toLowerCase()} ${c.last_name?.toLowerCase()}`))

      const withDuplicateInfo = payrollContacts.map(c => {
        const emailMatch = c.email && existingEmails.has(c.email.toLowerCase())
        const nameMatch = existingNames.has(`${c.first_name.toLowerCase()} ${c.last_name.toLowerCase()}`)
        return { ...c, isDuplicate: emailMatch || nameMatch }
      })

      setFiltered(withDuplicateInfo)
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function importContacts() {
    setImporting(true)
    let count = 0
    let skipped = 0
    for (const c of filtered) {
      if (c.isDuplicate) { skipped++; continue }
      try {
        await supabase.from('contacts').insert([{
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          notes: c.company ? `Bedrijf telefoon: ${c.company}` : null,
          status: 'Actief'
        }])
        count++
      } catch {}
    }
    setImportedCount(count)
    setSkippedCount(skipped)
    setImporting(false)
    setStep('done')
  }

  const newContacts = filtered.filter(c => !c.isDuplicate)
  const duplicates = filtered.filter(c => c.isDuplicate)

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Contacten importeren</h1>
        <p className="text-sm text-slate-500 mb-6">Importeer contacten uit je telefoon waar &quot;payroll&quot; in de bedrijfsnaam staat.</p>

        {step === 'upload' && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
            <p className="text-slate-600 mb-2 font-medium">Exporteer je contacten als .vcf bestand</p>
            <p className="text-sm text-slate-400 mb-6">
              iPhone: iCloud.com → Contacten → Selecteer alles → Exporteer vCard<br />
              Android: Contacten-app → Menu → Exporteren → .vcf
            </p>
            <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Kies .vcf bestand
              <input type="file" accept=".vcf" onChange={handleFile} className="hidden" />
            </label>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-700">{newContacts.length}</p>
                <p className="text-sm text-green-600">Nieuwe contacten</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-700">{duplicates.length}</p>
                <p className="text-sm text-amber-600">Al aanwezig, worden overgeslagen</p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="text-slate-400 text-sm bg-white border border-slate-200 rounded-xl p-6 text-center">
                Geen contacten gevonden met &quot;payroll&quot; in de bedrijfsnaam.
              </p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Naam</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Bedrijf</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">E-mail</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={i} className={`border-b border-slate-100 last:border-0 ${c.isDuplicate ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{c.first_name} {c.last_name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{c.company ?? '—'}</td>
                        <td className="px-4 py-2.5 text-slate-600">{c.email ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {c.isDuplicate
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Al aanwezig</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Nieuw</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3">
              {newContacts.length > 0 && (
                <button onClick={importContacts} disabled={importing} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {importing ? 'Bezig...' : `Importeer ${newContacts.length} nieuwe contacten`}
                </button>
              )}
              <button onClick={() => setStep('upload')} className="text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100 text-sm">
                Ander bestand kiezen
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <p className="text-2xl font-bold text-green-700 mb-1">✓ {importedCount} contacten geïmporteerd</p>
            {skippedCount > 0 && <p className="text-amber-600 text-sm mb-4">{skippedCount} al bestaande contacten overgeslagen</p>}
            <p className="text-green-600 text-sm mb-6">De nieuwe contacten staan nu in je CRM</p>
            <a href="/contacten" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
              Bekijk contacten →
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
