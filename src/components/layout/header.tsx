'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  userName?: string | null
  userRole?: 'fiduciary' | 'client'
}

/**
 * En-tête de l'application avec menu utilisateur
 */
export function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={userRole === 'fiduciary' ? '/fiduciary/dashboard' : '/client/dashboard'}
          className="text-xl font-bold text-slate-900"
        >
          FiduDocs
        </Link>

        {/* Menu desktop */}
        <div className="hidden items-center gap-4 md:flex">
          {userName && (
            <span className="text-sm text-slate-600">
              <User className="mr-1 inline h-4 w-4" />
              {userName}
            </span>
          )}
          <Button onClick={handleLogout} variant="ghost" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>

        {/* Menu mobile toggle */}
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          variant="ghost"
          size="icon"
          className="md:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          {userName && (
            <p className="mb-4 text-sm text-slate-600">
              <User className="mr-1 inline h-4 w-4" />
              {userName}
            </p>
          )}
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      )}
    </header>
  )
}
