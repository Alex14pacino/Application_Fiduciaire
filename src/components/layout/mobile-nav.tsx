'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * Éléments de navigation pour les clients
 */
const navItems = [
  { href: '/client/dashboard', icon: Home, label: 'Accueil' },
  { href: '/client/documents', icon: FileText, label: 'Documents' },
  { href: '/client/profile', icon: User, label: 'Profil' },
]

/**
 * Navigation mobile en bas de l'écran
 * Affichée uniquement sur les écrans mobiles pour les clients
 */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-2',
                'text-slate-500 transition-colors',
                isActive && 'text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="mt-1 text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
