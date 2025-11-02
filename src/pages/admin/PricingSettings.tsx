import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface PricingSettings {
  id: string;
  show_pricing_publicly: boolean;
  default_display_type: 'hidden' | 'starting_at' | 'range' | 'custom';
  default_cta_text: string;
  pricing_philosophy: string | null;
  quote_request_enabled: boolean;
  quote_request_redirect_url: string | null;
}

export default function PricingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as PricingSettings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settingsData: Partial<PricingSettings>) => {
      const { data, error } = await supabase
        .from('pricing_settings')
        .update(settingsData)
        .eq('id', settings!.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      toast({ title: 'Settings updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating settings', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const settingsData = {
      show_pricing_publicly: formData.get('show_pricing_publicly') === 'true',
      default_display_type: formData.get('default_display_type') as 'hidden' | 'starting_at' | 'range' | 'custom',
      default_cta_text: formData.get('default_cta_text')?.toString() || 'Get Custom Quote',
      pricing_philosophy: formData.get('pricing_philosophy')?.toString() || null,
      quote_request_enabled: formData.get('quote_request_enabled') === 'true',
      quote_request_redirect_url: formData.get('quote_request_redirect_url')?.toString() || null,
    };

    updateMutation.mutate(settingsData);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pricing Display Settings</h1>
        <p className="text-muted-foreground">Control how pricing appears on your website</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Public Pricing Display</CardTitle>
            <CardDescription>Choose whether to show pricing publicly on your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_pricing_publicly">Show Pricing Publicly</Label>
                <p className="text-sm text-muted-foreground">Display prices on the services page</p>
              </div>
              <Switch 
                id="show_pricing_publicly"
                name="show_pricing_publicly"
                defaultChecked={settings?.show_pricing_publicly}
                value={settings?.show_pricing_publicly ? 'true' : 'false'}
              />
            </div>

            <div>
              <Label htmlFor="default_display_type">Default Display Type</Label>
              <Select name="default_display_type" defaultValue={settings?.default_display_type || 'custom'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hidden">Hidden (Show CTA only)</SelectItem>
                  <SelectItem value="starting_at">Starting At (show base price)</SelectItem>
                  <SelectItem value="range">Range (show min-max)</SelectItem>
                  <SelectItem value="custom">Custom Messaging</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                How pricing should be displayed when enabled
              </p>
            </div>

            <div>
              <Label htmlFor="default_cta_text">Default CTA Text</Label>
              <Input 
                id="default_cta_text" 
                name="default_cta_text" 
                defaultValue={settings?.default_cta_text}
                placeholder="Get Custom Quote"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Philosophy</CardTitle>
            <CardDescription>Your approach to pricing and value</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              id="pricing_philosophy" 
              name="pricing_philosophy" 
              defaultValue={settings?.pricing_philosophy || ''}
              rows={4}
              placeholder="We believe in accessible, results-driven pricing..."
            />
            <p className="text-sm text-muted-foreground mt-2">
              This text will appear on your services page to explain your pricing approach
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Request Settings</CardTitle>
            <CardDescription>Manage quote request functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quote_request_enabled">Enable Quote Requests</Label>
                <p className="text-sm text-muted-foreground">Allow visitors to request custom quotes</p>
              </div>
              <Switch 
                id="quote_request_enabled"
                name="quote_request_enabled"
                defaultChecked={settings?.quote_request_enabled}
                value={settings?.quote_request_enabled ? 'true' : 'false'}
              />
            </div>

            <div>
              <Label htmlFor="quote_request_redirect_url">Redirect URL After Quote Request</Label>
              <Input 
                id="quote_request_redirect_url" 
                name="quote_request_redirect_url" 
                defaultValue={settings?.quote_request_redirect_url || ''}
                placeholder="/thank-you"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Optional: Where to redirect after submitting a quote request
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
