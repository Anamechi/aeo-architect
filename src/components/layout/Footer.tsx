import { Link } from "react-router-dom";
import { Linkedin, Twitter, Youtube, MapPin, Mail, Clock, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessSettings {
  business_name: string;
  email: string;
  phone_toll_free: string;
  phone_local: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  hours_monday_friday: string;
  hours_saturday: string;
  hours_sunday: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
}

export const Footer = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error loading business settings:', error);
    }
  };

  // Dynamic values from settings or defaults
  const businessName = settings?.business_name || 'ANAMECHI Marketing';
  const email = settings?.email || 'info@anamechimarketing.com';
  const phoneTollFree = settings?.phone_toll_free || '866-752-7370';
  const phoneLocal = settings?.phone_local || '215-709-2159';
  const address = settings ? `${settings.address_street}, ${settings.address_city}, ${settings.address_state} ${settings.address_zip}` : '101 Lindenwood Dr STE 225, Malvern, PA 19355';
  const hoursDisplay = settings?.hours_monday_friday || '9:00 AM - 6:00 PM EST';
  const footerLinks = {
    company: [
      { name: "About", href: "/about" },
      { name: "Services", href: "/services" },
      { name: "Case Studies", href: "/case-studies" },
      { name: "Contact", href: "/contact" },
    ],
    resources: [
      { name: "Blog", href: "/blog" },
      { name: "FAQ", href: "/faq" },
      { name: "AI Tools", href: "/ai-tools" },
      { name: "Content Updates", href: "/updates" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Editorial Standards", href: "/editorial-standards" },
    ],
  };

  // Dynamic social links from settings
  const socialLinks = [
    ...(settings?.linkedin_url ? [{ name: "LinkedIn", href: settings.linkedin_url, icon: Linkedin }] : []),
    ...(settings?.twitter_url ? [{ name: "Twitter", href: settings.twitter_url, icon: Twitter }] : []),
    ...(settings?.youtube_url ? [{ name: "YouTube", href: settings.youtube_url, icon: Youtube }] : []),
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img 
                src="/anamechi-logo.svg"
                alt="ANAMECHI Marketing Logo"
                className="h-8 w-8"
              />
              <span className="text-xl font-bold text-foreground">{businessName}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Empowering entrepreneurs to automate smarter, market confidently, and scale with systems — not stress.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors">
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <div className="flex flex-col">
                  <a href={`tel:${phoneTollFree.replace(/[^0-9]/g, '')}`} className="hover:text-primary transition-colors">
                    {phoneTollFree}
                  </a>
                  <a href={`tel:${phoneLocal.replace(/[^0-9]/g, '')}`} className="hover:text-primary transition-colors text-xs">
                    {phoneLocal} (Local)
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Mon-Sat: {hoursDisplay}</span>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {businessName}. All rights reserved.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Made with ❤️ in Malvern, Pennsylvania
          </p>
        </div>
      </div>
    </footer>
  );
};
