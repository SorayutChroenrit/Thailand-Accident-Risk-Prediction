import { Link } from '@tanstack/react-router'
import {
  MapPin,
  Menu,
  X,
  Globe,
  LayoutDashboard,
  Map,
  History,
  FileText,
  Settings,
  Info,
  Crosshair
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { useLanguage } from '~/hooks/useLanguage'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t, language, toggleLanguage } = useLanguage()

  const navItems = [
    { href: '/map', label: t('nav.map'), icon: Map },
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/predict', label: t('nav.predict'), icon: Crosshair },
    { href: '/history', label: t('nav.history'), icon: History },
    { href: '/reports', label: t('nav.reports'), icon: FileText },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold">{t('common.appName')}</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'TH'}</span>
          </Button>

          {/* Settings & About (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-t my-2" />
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="h-4 w-4" />
              {t('nav.settings')}
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              <Info className="h-4 w-4" />
              {t('nav.about')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
