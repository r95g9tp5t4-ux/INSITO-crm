'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/contacten', label: 'Contacten' },
  { href: '/bedrijven', label: 'Bedrijven' },
  { href: '/taken', label: 'Taken' },
  { href: '/importeer', label: 'Importeren' },
  { href: '/opschonen', label: 'Opschonen' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-8">
      <span className="font-bold text-blue-700 text-lg tracking-tight">Insito CRM</span>
      <div className="flex gap-4">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
              pathname === l.href
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
