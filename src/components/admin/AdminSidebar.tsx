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
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Master Prompts', href: '/admin/master-prompts', icon: Lightbulb },
  { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
  { name: 'QA Generator', href: '/admin/qa-generator', icon: MessageSquare },
  { name: 'FAQ Manager', href: '/admin/faq-manager', icon: HelpCircle },
  { name: 'Authors', href: '/admin/authors', icon: Users },
  { name: 'Citations', href: '/admin/citations', icon: LinkIcon },
  { name: 'Citation Health', href: '/admin/citation-health', icon: CheckCircle },
  { name: 'AI Tools', href: '/admin/ai-tools', icon: Wrench },
  { name: 'Referral Tracking', href: '/admin/referral-tracking', icon: TrendingUp },
  { name: 'Service Packages', href: '/admin/packages', icon: Package },
  { name: 'Custom Quotes', href: '/admin/quotes', icon: Quote },
  { name: 'Image Generator', href: '/admin/images', icon: Image },
  { name: 'Diagram Generator', href: '/admin/diagrams', icon: Network },
  { name: 'Content Updates', href: '/admin/content-updates', icon: Calendar },
  { name: 'SEO Settings', href: '/admin/seo-settings', icon: Settings },
  { name: 'Pricing Settings', href: '/admin/pricing-settings', icon: Settings },
  { name: 'Business Settings', href: '/admin/business-settings', icon: Building },
];

export default function AdminSidebar() {
  const { signOut } = useAuth();

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h2 className="text-xl font-bold text-foreground">ANAMECHI Admin</h2>
      </div>
      
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => (
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
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
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
