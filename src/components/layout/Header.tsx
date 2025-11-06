import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, Settings, FileText, Users, Image, HelpCircle } from "lucide-react";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const location = useLocation();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navigation = [
    { name: "Services", href: "/services" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/faq" },
    { name: "AI Tools", href: "/ai-tools" },
  ];

  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: Shield },
    { name: "Blog Posts", href: "/admin/blog-posts", icon: FileText },
    { name: "FAQ Manager", href: "/admin/faq-manager", icon: HelpCircle },
    { name: "Images", href: "/admin/images", icon: Image },
    { name: "Settings", href: "/admin/business-settings", icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    setClickCount(clickCountRef.current);

    // Clear existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    // If triple-clicked, open admin menu
    if (clickCountRef.current === 3) {
      setAdminMenuOpen(true);
      clickCountRef.current = 0;
      setClickCount(0);
    } else {
      // Reset counter after 1 second
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
        setClickCount(0);
      }, 1000);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2" onClick={handleLogoClick}>
          <div className="flex items-center space-x-2 relative">
            <img 
              src="/anamechi-logo.svg"
              alt="ANAMECHI Marketing"
              className={`h-8 w-8 transition-all duration-200 ${
                clickCount === 1 ? 'scale-110 drop-shadow-md' : 
                clickCount === 2 ? 'scale-125 drop-shadow-lg animate-pulse' : 
                clickCount >= 3 ? 'scale-110 drop-shadow-xl' : ''
              }`}
            />
            {clickCount > 0 && (
              <div className="absolute -top-1 -right-1 flex gap-0.5">
                {[...Array(clickCount)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary animate-scale-in"
                  />
                ))}
              </div>
            )}
            <span className="text-xl font-bold text-foreground">ANAMECHI</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
          <Button asChild size="sm" className="bg-gradient-primary">
            <Link to="/contact">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-secondary ${
                  isActive(item.href) ? "text-primary" : "text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Button asChild className="w-full bg-gradient-primary mt-4">
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Admin Quick Access Menu */}
      <Dialog open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Quick Access
            </DialogTitle>
            <DialogDescription>
              Access admin dashboard and management tools
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {adminLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setAdminMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-secondary hover:border-primary"
              >
                <link.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
