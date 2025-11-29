import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Menu,
  X,
  Globe,
  LayoutDashboard,
  Map,
  FileText,
  Settings,
  Info,
  Crosshair,
  Route,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useLanguage } from "~/contexts/LanguageContext";
import { useAuth } from "~/contexts/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    {
      href: "/map",
      label: t("nav.liveEvents"),
      icon: Map,
    },
    { href: "/predict", label: t("nav.predict"), icon: Crosshair },
    {
      href: "/route-analysis",
      label: language === "en" ? "Route" : "เส้นทาง",
      icon: Route,
    },
    { href: "/records", label: t("nav.records"), icon: FileText },
    {
      href: "/approvals",
      label: language === "en" ? "Approvals" : "อนุมัติ",
      icon: ShieldCheck,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold">{t("common.appName")}</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              activeProps={{
                className:
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-accent rounded-md border-b-2 border-primary",
              }}
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
            <span className="hidden sm:inline">
              {language === "en" ? "EN" : "TH"}
            </span>
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

          {/* Auth Button */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline text-sm">
                  {language === "en" ? "Logout" : "ออกจากระบบ"}
                </span>
              </Button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block ml-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>{language === "en" ? "Login" : "เข้าสู่ระบบ"}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
                activeProps={{
                  className:
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground bg-accent rounded-md border-l-4 border-primary",
                }}
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
              {t("nav.settings")}
            </Link>
            <Link
              to="/about"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              <Info className="h-4 w-4" />
              {t("nav.about")}
            </Link>
            <div className="border-t my-2" />
            {isAuthenticated ? (
              <div className="px-3 py-2">
                <div className="flex items-center gap-3 mb-3">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {language === "en" ? "Logout" : "ออกจากระบบ"}
                </Button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                {language === "en" ? "Login" : "เข้าสู่ระบบ"}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
