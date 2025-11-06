import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Building, Mail, Phone, MapPin, Clock, Link as LinkIcon } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function BusinessSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  // Business Info
  const [businessName, setBusinessName] = useState('ANAMECHI Marketing');
  const [email, setEmail] = useState('info@anamechimarketing.com');
  const [phoneTollFree, setPhoneTollFree] = useState('866-752-7370');
  const [phoneLocal, setPhoneLocal] = useState('215-709-2159');
  
  // Address
  const [addressStreet, setAddressStreet] = useState('101 Lindenwood Dr STE 225');
  const [addressCity, setAddressCity] = useState('Malvern');
  const [addressState, setAddressState] = useState('PA');
  const [addressZip, setAddressZip] = useState('19355');
  const [timezone, setTimezone] = useState('America/New_York');
  
  // Hours
  const [hoursMonFri, setHoursMonFri] = useState('9:00 AM - 6:00 PM EST');
  const [hoursSat, setHoursSat] = useState('9:00 AM - 6:00 PM EST');
  const [hoursSun, setHoursSun] = useState('Closed');
  
  // Social Links
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettingsId(data.id);
        setBusinessName(data.business_name || '');
        setEmail(data.email || '');
        setPhoneTollFree(data.phone_toll_free || '');
        setPhoneLocal(data.phone_local || '');
        setAddressStreet(data.address_street || '');
        setAddressCity(data.address_city || '');
        setAddressState(data.address_state || '');
        setAddressZip(data.address_zip || '');
        setTimezone(data.timezone || 'America/New_York');
        setHoursMonFri(data.hours_monday_friday || '');
        setHoursSat(data.hours_saturday || '');
        setHoursSun(data.hours_sunday || '');
        setLinkedinUrl(data.linkedin_url || '');
        setTwitterUrl(data.twitter_url || '');
        setYoutubeUrl(data.youtube_url || '');
        setFacebookUrl(data.facebook_url || '');
        setInstagramUrl(data.instagram_url || '');
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const settingsData = {
        business_name: businessName,
        email,
        phone_toll_free: phoneTollFree,
        phone_local: phoneLocal,
        address_street: addressStreet,
        address_city: addressCity,
        address_state: addressState,
        address_zip: addressZip,
        timezone,
        hours_monday_friday: hoursMonFri,
        hours_saturday: hoursSat,
        hours_sunday: hoursSun,
        linkedin_url: linkedinUrl || null,
        twitter_url: twitterUrl || null,
        youtube_url: youtubeUrl || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        updated_by: user?.id
      };

      if (settingsId) {
        // Update existing
        const { error } = await supabase
          .from('business_settings')
          .update(settingsData)
          .eq('id', settingsId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('business_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingsId(data.id);
      }

      toast.success('Business settings updated successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save business settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Breadcrumbs 
        items={[
          { name: 'Dashboard', href: '/admin/dashboard' },
          { name: 'Business Settings', href: '/admin/business-settings' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Building className="h-10 w-10 text-primary" />
          Business Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your business contact information, hours, and social links. Changes update across the entire site.
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Basic business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="ANAMECHI Marketing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Email and phone numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@anamechimarketing.com"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneTollFree">Toll-Free Number</Label>
                <Input
                  id="phoneTollFree"
                  value={phoneTollFree}
                  onChange={(e) => setPhoneTollFree(e.target.value)}
                  placeholder="866-752-7370"
                />
              </div>
              <div>
                <Label htmlFor="phoneLocal">Local Number</Label>
                <Input
                  id="phoneLocal"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  placeholder="215-709-2159"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Business Address
            </CardTitle>
            <CardDescription>Physical location and timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="addressStreet">Street Address</Label>
              <Input
                id="addressStreet"
                value={addressStreet}
                onChange={(e) => setAddressStreet(e.target.value)}
                placeholder="101 Lindenwood Dr STE 225"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="addressCity">City</Label>
                <Input
                  id="addressCity"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  placeholder="Malvern"
                />
              </div>
              <div>
                <Label htmlFor="addressState">State</Label>
                <Input
                  id="addressState"
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  placeholder="PA"
                />
              </div>
              <div>
                <Label htmlFor="addressZip">ZIP Code</Label>
                <Input
                  id="addressZip"
                  value={addressZip}
                  onChange={(e) => setAddressZip(e.target.value)}
                  placeholder="19355"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="America/New_York"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for displaying times in EST throughout the site
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
            </CardTitle>
            <CardDescription>Operating hours (EST)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hoursMonFri">Monday - Friday</Label>
              <Input
                id="hoursMonFri"
                value={hoursMonFri}
                onChange={(e) => setHoursMonFri(e.target.value)}
                placeholder="9:00 AM - 6:00 PM EST"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoursSat">Saturday</Label>
                <Input
                  id="hoursSat"
                  value={hoursSat}
                  onChange={(e) => setHoursSat(e.target.value)}
                  placeholder="9:00 AM - 6:00 PM EST"
                />
              </div>
              <div>
                <Label htmlFor="hoursSun">Sunday</Label>
                <Input
                  id="hoursSun"
                  value={hoursSun}
                  onChange={(e) => setHoursSun(e.target.value)}
                  placeholder="Closed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>Your social media profiles (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/company/anamechi-marketing"
              />
            </div>
            <div>
              <Label htmlFor="twitterUrl">Twitter/X URL</Label>
              <Input
                id="twitterUrl"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/anamechimarketing"
              />
            </div>
            <div>
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/@ANAMECHI"
              />
            </div>
            <div>
              <Label htmlFor="facebookUrl">Facebook URL</Label>
              <Input
                id="facebookUrl"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://www.facebook.com/anamechimarketing"
              />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram URL</Label>
              <Input
                id="instagramUrl"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/anamechimarketing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" disabled={loading} className="shadow-lg">
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
