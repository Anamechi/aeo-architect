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
import { Plus, Edit, Archive, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  base_price: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  status: 'active' | 'archived' | 'draft';
  display_type: 'hidden' | 'starting_at' | 'range' | 'custom';
  cta_text: string;
  cta_link: string | null;
  category: string | null;
  sort_order: number;
  is_addon: boolean;
}

export default function Packages() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as ServicePackage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (packageData: any) => {
      const { data, error } = await supabase
        .from('service_packages')
        .insert([packageData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages'] });
      toast({ title: 'Package created successfully' });
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating package', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...packageData }: any) => {
      const { data, error } = await supabase
        .from('service_packages')
        .update(packageData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages'] });
      toast({ title: 'Package updated successfully' });
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating package', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const features = formData.get('features')?.toString().split('\n').filter(f => f.trim()) || [];
    
    const packageData = {
      name: formData.get('name')?.toString() || '',
      description: formData.get('description')?.toString() || null,
      features,
      base_price: formData.get('base_price') ? parseFloat(formData.get('base_price')?.toString() || '0') : null,
      price_range_min: formData.get('price_range_min') ? parseFloat(formData.get('price_range_min')?.toString() || '0') : null,
      price_range_max: formData.get('price_range_max') ? parseFloat(formData.get('price_range_max')?.toString() || '0') : null,
      status: formData.get('status') as 'active' | 'archived' | 'draft',
      display_type: formData.get('display_type') as 'hidden' | 'starting_at' | 'range' | 'custom',
      cta_text: formData.get('cta_text')?.toString() || 'Get Custom Quote',
      cta_link: formData.get('cta_link')?.toString() || null,
      category: formData.get('category')?.toString() || null,
      is_addon: formData.get('is_addon') === 'true',
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, ...packageData });
    } else {
      createMutation.mutate(packageData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Packages</h1>
          <p className="text-muted-foreground">Manage your service offerings and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPackage(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
              <DialogDescription>
                {editingPackage ? 'Update package details' : 'Add a new service package'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Package Name *</Label>
                <Input id="name" name="name" defaultValue={editingPackage?.name} required />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingPackage?.description || ''} rows={3} />
              </div>

              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea 
                  id="features" 
                  name="features" 
                  defaultValue={editingPackage?.features?.join('\n') || ''} 
                  rows={5}
                  placeholder="Custom marketing funnels&#10;Automation setup&#10;Monthly support"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price ($)</Label>
                  <Input 
                    id="base_price" 
                    name="base_price" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingPackage?.base_price || ''} 
                  />
                </div>
                <div>
                  <Label htmlFor="price_range_min">Min Range ($)</Label>
                  <Input 
                    id="price_range_min" 
                    name="price_range_min" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingPackage?.price_range_min || ''} 
                  />
                </div>
                <div>
                  <Label htmlFor="price_range_max">Max Range ($)</Label>
                  <Input 
                    id="price_range_max" 
                    name="price_range_max" 
                    type="number" 
                    step="0.01"
                    defaultValue={editingPackage?.price_range_max || ''} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingPackage?.status || 'draft'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="display_type">Display Type</Label>
                  <Select name="display_type" defaultValue={editingPackage?.display_type || 'custom'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hidden">Hidden</SelectItem>
                      <SelectItem value="starting_at">Starting At</SelectItem>
                      <SelectItem value="range">Range</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" defaultValue={editingPackage?.category || ''} placeholder="e.g., Core Services, Add-ons" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cta_text">CTA Text</Label>
                  <Input id="cta_text" name="cta_text" defaultValue={editingPackage?.cta_text || 'Get Custom Quote'} />
                </div>
                <div>
                  <Label htmlFor="cta_link">CTA Link</Label>
                  <Input id="cta_link" name="cta_link" defaultValue={editingPackage?.cta_link || ''} placeholder="/contact" />
                </div>
              </div>

              <div>
                <Label htmlFor="is_addon">Package Type</Label>
                <Select name="is_addon" defaultValue={editingPackage?.is_addon ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Core Service</SelectItem>
                    <SelectItem value="true">Add-on</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPackage ? 'Update' : 'Create'} Package
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading packages...</div>
      ) : (
        <div className="grid gap-4">
          {packages?.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                      {pkg.status}
                    </Badge>
                    {pkg.is_addon && <Badge variant="outline">Add-on</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pkg.features && pkg.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Features:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex gap-4 text-sm">
                    {pkg.base_price && (
                      <div>
                        <span className="font-semibold">Base Price:</span> ${pkg.base_price}
                      </div>
                    )}
                    {pkg.price_range_min && pkg.price_range_max && (
                      <div>
                        <span className="font-semibold">Range:</span> ${pkg.price_range_min} - ${pkg.price_range_max}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Display:</span> {pkg.display_type}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
