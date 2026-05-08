'use client'
import Link from 'next/link'
import Image from 'next/image'
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
    <nav style={{ backgroundColor: '#182f7c' }} className="px-6 py-3 flex items-center gap-8">
      <Link href="/" className="shrink-0">
        <Image
          src="https://cdn.prod.website-files.com/68551e06514f8af0a766b2c4/693ac94673f6a131e3a7f9f4_insito%20logo-8.png"
          alt="Insito Payroll"
          width={120}
          height={36}
          className="h-9 w-auto object-contain brightness-0 invert"
          unoptimized
        />
      </Link>
      <div className="flex gap-1">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
              pathname === l.href
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
