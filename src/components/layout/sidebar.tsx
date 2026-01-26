'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * Éléments de navigation pour les fiduciaires
 */
const navItems = [
  { href: '/fiduciary/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/fiduciary/clients', icon: Users, label: 'Clients' },
  { href: '/fiduciary/settings', icon: Settings, label: 'Paramètres' },
]

/**
 * Barre latérale pour les fiduciaires (desktop)
 */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

/**
 * Navigation mobile pour les fiduciaires
 */
export function FiduciaryMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
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
