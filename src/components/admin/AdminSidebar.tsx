import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  FileText, 
  MessageSquare, 
  Image, 
  Network,
  Users,
  Link as LinkIcon,
  Calendar,
  Settings,
  Building,
  LogOut,
  Package,
  FileText as Quote,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  TrendingUp,
  Sparkles,
  ImagePlus,
  ShieldCheck,
  Layers,
  HeartPulse,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const sections = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Points Checker', href: '/admin/points-checker', icon: ShieldCheck },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Clusters', href: '/admin/clusters', icon: Layers },
      { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
      { name: 'Blog Audit', href: '/admin/blog/audit', icon: Sparkles },
      { name: 'QA Generator', href: '/admin/qa-generator', icon: MessageSquare },
      { name: 'FAQ Manager', href: '/admin/faq-manager', icon: HelpCircle },
      { name: 'FAQ Analytics', href: '/admin/faq-analytics', icon: TrendingUp },
      { name: 'Authors', href: '/admin/authors', icon: Users },
    ],
  },
  {
    label: 'SEO & Quality',
    items: [
      { name: 'Citations', href: '/admin/citations', icon: LinkIcon },
      { name: 'Citation Health', href: '/admin/citation-health', icon: CheckCircle },
      { name: 'Image Alt Text', href: '/admin/image-alt-text', icon: ImagePlus },
      { name: 'Content Updates', href: '/admin/content-updates', icon: Calendar },
    ],
  },
  {
    label: 'Media',
    items: [
      { name: 'Image Generator', href: '/admin/images', icon: Image },
      { name: 'Image Health', href: '/admin/image-health', icon: HeartPulse },
      { name: 'Diagram Generator', href: '/admin/diagrams', icon: Network },
    ],
  },
  {
    label: 'AI & Tools',
    items: [
      { name: 'AI Tools', href: '/admin/ai-tools', icon: Wrench },
      { name: 'Master Prompts', href: '/admin/master-prompts', icon: Lightbulb },
      { name: 'Referral Tracking', href: '/admin/referral-tracking', icon: TrendingUp },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Site Settings', href: '/admin/site-settings', icon: Globe },
      { name: 'Service Packages', href: '/admin/packages', icon: Package },
      { name: 'Custom Quotes', href: '/admin/quotes', icon: Quote },
      { name: 'Pricing Settings', href: '/admin/pricing-settings', icon: Settings },
      { name: 'Business Settings', href: '/admin/business-settings', icon: Building },
      { name: 'SEO Settings', href: '/admin/seo-settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center border-b border-border px-6">
        <img 
          src="/anamechi-logo.svg"
          alt="ANAMECHI Logo"
          className="h-6 w-6 mr-2"
        />
        <h2 className="text-xl font-bold text-foreground">ANAMECHI Admin</h2>
      </div>
      
      <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
        {sections.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Button 
          onClick={() => signOut()}
          variant="ghost" 
          className="w-full justify-start"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
