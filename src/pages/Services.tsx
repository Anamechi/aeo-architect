import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Bot, 
  Search, 
  Zap, 
  Target, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const Services = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://anamechi.com/services/" }
    ]
  };

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ['service-packages-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['pricing-settings-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const getPriceDisplay = (pkg: any) => {
    if (!settings?.show_pricing_publicly || pkg.display_type === 'hidden') {
      return null;
    }

    switch (pkg.display_type) {
      case 'starting_at':
        return pkg.base_price ? `Starting at $${pkg.base_price.toLocaleString()}` : null;
      case 'range':
        return pkg.price_range_min && pkg.price_range_max 
          ? `$${pkg.price_range_min.toLocaleString()} - $${pkg.price_range_max.toLocaleString()}` 
          : null;
      case 'custom':
        return 'Investment varies based on your goals';
      default:
        return null;
    }
  };

  const corePackages = packages?.filter(pkg => !pkg.is_addon) || [];
  const addons = packages?.filter(pkg => pkg.is_addon) || [];

  // Default icon mapping
  const iconMap: { [key: string]: any } = {
    'AEO': Bot,
    'SEO': Search,
    'Automation': Zap,
    'Visibility': Target,
  };

  const getIcon = (category: string) => {
    return iconMap[category] || CheckCircle2;
  };

  return (
    <>
      <SEO 
        title="AI-Powered Marketing Services | ANAMECHI Marketing"
        description="Transform your business with AI Engine Optimization, SEO, marketing automation, and brand visibility services. Customized strategies for ambitious entrepreneurs."
        type="website"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs items={[{ name: 'Services', href: '/services' }]} />
        </div>
        
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <Badge className="mb-4" variant="outline">Services</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Transform Your Marketing with AI-Powered Solutions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Leverage cutting-edge AI technology, automation, and strategic visibility to scale your business and free your time
          </p>
        </section>

        {/* Pricing Philosophy */}
        {settings?.pricing_philosophy && (
          <section className="container mx-auto px-4 pb-12">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardContent className="p-6 text-center">
                <p className="text-lg text-muted-foreground">{settings.pricing_philosophy}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Core Services */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Core Services</h2>
          {packagesLoading ? (
            <div className="text-center py-12">Loading services...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {corePackages.map((service, index) => {
                const Icon = getIcon(service.category || '');
                const priceDisplay = getPriceDisplay(service);
                
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        {priceDisplay && (
                          <Badge variant="outline" className="text-sm">
                            {priceDisplay}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl mb-2">{service.name}</CardTitle>
                      <CardDescription className="text-base">{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {Array.isArray(service.features) && service.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to={service.cta_link || '/contact'}>
                        <Button className="w-full group">
                          {service.cta_text}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Add-ons */}
        {addons.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Enhance Your Package</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {addons.map((addon, index) => {
                const priceDisplay = getPriceDisplay(addon);
                
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{addon.name}</CardTitle>
                      {priceDisplay && (
                        <Badge variant="secondary" className="w-fit mt-2">
                          {priceDisplay}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                      {addon.features && Array.isArray(addon.features) && addon.features.length > 0 && (
                        <ul className="space-y-2">
                          {addon.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Industries Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Industries We Serve</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              "Coaching & Consulting",
              "Digital Products",
              "Professional Services",
              "Nonprofits & Social Impact"
            ].map((industry, index) => (
              <Card key={index} className="p-6 hover:border-primary transition-colors">
                <p className="font-medium">{industry}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="text-center p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Scale Your Business?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Let's create a customized strategy that fits your goals, timeline, and budget
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button size="lg" className="min-w-[200px]">
                    Book Free Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="min-w-[200px]">
                    Request Custom Quote
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default Services;
