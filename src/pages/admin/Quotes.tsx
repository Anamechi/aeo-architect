import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface CustomQuote {
  id: string;
  client_name: string;
  client_email: string;
  client_business: string | null;
  client_revenue_range: string | null;
  package_id: string | null;
  line_items: Array<{ description: string; amount: number }>;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  notes: string | null;
  expiration_date: string | null;
  created_at: string;
}

export default function Quotes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingQuote, setViewingQuote] = useState<CustomQuote | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['custom-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['service-packages-for-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('id, name')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (quoteData: any) => {
      const { data, error } = await supabase
        .from('custom_quotes')
        .insert([quoteData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-quotes'] });
      toast({ title: 'Quote created successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating quote', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const lineItemsText = formData.get('line_items')?.toString() || '';
    const lineItems = lineItemsText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [description, amount] = line.split('|');
        return {
          description: description?.trim() || '',
          amount: parseFloat(amount?.trim() || '0')
        };
      });

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const discountPercent = parseFloat(formData.get('discount_percent')?.toString() || '0');
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal - discountAmount;

    const quoteData = {
      client_name: formData.get('client_name')?.toString() || '',
      client_email: formData.get('client_email')?.toString() || '',
      client_business: formData.get('client_business')?.toString() || null,
      client_revenue_range: formData.get('client_revenue_range')?.toString() || null,
      package_id: formData.get('package_id')?.toString() || null,
      line_items: lineItems,
      subtotal,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      total,
      status: 'draft' as const,
      notes: formData.get('notes')?.toString() || null,
      expiration_date: formData.get('expiration_date')?.toString() || null,
    };

    createMutation.mutate(quoteData);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'secondary',
      sent: 'default',
      viewed: 'default',
      accepted: 'default',
      declined: 'destructive',
      expired: 'secondary'
    };
    return colors[status as keyof typeof colors] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Custom Quotes</h1>
          <p className="text-muted-foreground">Create and manage client quotes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Quote</DialogTitle>
              <DialogDescription>Generate a personalized quote for your client</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input id="client_name" name="client_name" required />
                </div>
                <div>
                  <Label htmlFor="client_email">Client Email *</Label>
                  <Input id="client_email" name="client_email" type="email" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_business">Business Name</Label>
                  <Input id="client_business" name="client_business" />
                </div>
                <div>
                  <Label htmlFor="client_revenue_range">Revenue Range</Label>
                  <Select name="client_revenue_range">
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-50k">$0 - $50K</SelectItem>
                      <SelectItem value="50k-100k">$50K - $100K</SelectItem>
                      <SelectItem value="100k-250k">$100K - $250K</SelectItem>
                      <SelectItem value="250k+">$250K+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="package_id">Base Package (Optional)</Label>
                <Select name="package_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="line_items">Line Items (format: Description | Amount, one per line)</Label>
                <Textarea 
                  id="line_items" 
                  name="line_items" 
                  rows={6}
                  placeholder="Custom Funnel Setup | 5000&#10;Monthly Management | 2100&#10;Ad Campaign Setup | 1500"
                />
              </div>

              <div>
                <Label htmlFor="discount_percent">Discount (%)</Label>
                <Input 
                  id="discount_percent" 
                  name="discount_percent" 
                  type="number" 
                  step="0.01"
                  defaultValue="0"
                />
              </div>

              <div>
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input 
                  id="expiration_date" 
                  name="expiration_date" 
                  type="date"
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Quote</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading quotes...</div>
      ) : (
        <div className="grid gap-4">
          {quotes?.map((quote) => (
            <Card key={quote.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{quote.client_name}</CardTitle>
                    <CardDescription>{quote.client_email}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(quote.status) as any}>
                    {quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">Created:</span> {format(new Date(quote.created_at), 'MMM d, yyyy')}
                    </div>
                    {quote.expiration_date && (
                      <div>
                        <span className="font-semibold">Expires:</span> {format(new Date(quote.expiration_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Quote Value</p>
                        <p className="text-2xl font-bold">${quote.total.toLocaleString()}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setViewingQuote(quote)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewingQuote} onOpenChange={() => setViewingQuote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          {viewingQuote && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Client Information</h3>
                <p><span className="font-medium">Name:</span> {viewingQuote.client_name}</p>
                <p><span className="font-medium">Email:</span> {viewingQuote.client_email}</p>
                {viewingQuote.client_business && <p><span className="font-medium">Business:</span> {viewingQuote.client_business}</p>}
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Line Items</h3>
                <div className="space-y-2">
                  {viewingQuote.line_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span className="font-medium">${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${viewingQuote.subtotal.toLocaleString()}</span>
                </div>
                {viewingQuote.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Discount ({viewingQuote.discount_percent}%):</span>
                    <span>-${viewingQuote.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${viewingQuote.total.toLocaleString()}</span>
                </div>
              </div>

              {viewingQuote.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{viewingQuote.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
