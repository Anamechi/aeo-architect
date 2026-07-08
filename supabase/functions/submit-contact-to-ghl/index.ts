import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, service, message } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Capturing contact:', { name, email, phone, service });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    // Capture the lead in our own database FIRST so it can never be lost,
    // even if the CRM handoff fails.
    const { data: saved, error: dbError } = await supabaseClient
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        service: service || null,
        message: message || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Error saving submission to database:', dbError);
    }

    // Hand off to GoHighLevel (best effort; lead is already captured above)
    let ghlContactId: string | null = null;
    let ghlDelivered = false;
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
    const ghlAccessToken = Deno.env.get('GHL_ACCESS_TOKEN');

    if (ghlLocationId && ghlAccessToken) {
      try {
        const contactData = {
          locationId: ghlLocationId,
          firstName: name.split(' ')[0] || '',
          lastName: name.split(' ').slice(1).join(' ') || '',
          email: email,
          phone: phone || '',
          source: 'Website Contact Form',
          tags: ['website-lead', 'contact-form'],
          customFields: [
            { key: 'service_interest', value: service || 'General Inquiry' },
            { key: 'message', value: message || '' }
          ]
        };

        const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlAccessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        });

        if (ghlResponse.ok) {
          const ghlResult = await ghlResponse.json();
          ghlContactId = ghlResult.contact?.id || null;
          ghlDelivered = true;
          console.log('Successfully created contact in GHL:', ghlContactId);
          if (saved?.id && ghlContactId) {
            await supabaseClient
              .from('contact_submissions')
              .update({ ghl_contact_id: ghlContactId })
              .eq('id', saved.id);
          }
        } else {
          const errorText = await ghlResponse.text();
          console.error('GHL API Error (lead still captured in DB):', ghlResponse.status, errorText);
        }
      } catch (ghlError) {
        console.error('GHL handoff failed (lead still captured in DB):', ghlError);
      }
    } else {
      console.error('GHL credentials not configured (lead still captured in DB)');
    }

    return new Response(
      JSON.stringify({
        success: true,
        contactId: ghlContactId,
        ghlDelivered,
        message: 'Contact submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in submit-contact-to-ghl function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
