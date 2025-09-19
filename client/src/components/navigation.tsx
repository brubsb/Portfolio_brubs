import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { LoginModal } from "@/components/login-modal";
import { authManager } from "@/lib/auth";
import { Moon, Sun, Menu, X } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const isAuthenticated = authManager.isAuthenticated();
  const user = authManager.getUser();
  const isAdmin = authManager.isAdmin();

  const handleLogout = () => {
    authManager.logout();
    window.location.reload();
  };

  const navLinks = [
    { href: "/#home", label: "Início" },
    { href: "/projects", label: "Projetos" },
    { href: "/certifications", label: "Certificações" },
    { href: "/#about", label: "Sobre" },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 glass-morphism" data-testid="main-navigation">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={user?.avatar || "https://pixabay.com/get/gaf7556b18311c7bcd4c78af8631e112568cbec9efc9becb562cbc2b63cbd8c2fe56ff024095ec614d1e960f37d904961a0b81e834895950ec0d05a1f19559698_1280.jpg"}
                alt="Bruna Barboza Sofia"
                className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                data-testid="profile-image"
              />
              <Link href="/">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="site-title">
                  Bruna Barboza Sofia
                </h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors"
                  data-testid={`nav-link-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80"
                  data-testid="theme-toggle"
                >
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    {user?.avatar && (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                        data-testid="user-avatar"
                      />
                    )}
                    <span className="text-sm" data-testid="user-name">{user?.name}</span>
                    {isAdmin && (
                      <Link href="/admin/dashboard">
                        <Button variant="outline" size="sm" data-testid="admin-dashboard-link">
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      data-testid="logout-button"
                    >
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                    data-testid="login-button"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              data-testid="mobile-menu-button"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t border-border/20" data-testid="mobile-menu">
              <div className="flex flex-col space-y-3 mt-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setShowMobileMenu(false)}
                    data-testid={`mobile-nav-link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex items-center justify-between pt-4 border-t border-border/20">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    data-testid="mobile-theme-toggle"
                  >
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                  
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-2">
                      {isAdmin && (
                        <Link href="/admin/dashboard">
                          <Button variant="outline" size="sm" data-testid="mobile-admin-dashboard-link">
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        data-testid="mobile-logout-button"
                      >
                        Sair
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowLoginModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      data-testid="mobile-login-button"
                    >
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}
