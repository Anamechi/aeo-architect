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
    
    console.log('Submitting contact to GHL:', { name, email, phone, service });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get GHL credentials from environment
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
    const ghlAccessToken = Deno.env.get('GHL_ACCESS_TOKEN');

    if (!ghlLocationId || !ghlAccessToken) {
      throw new Error('GHL credentials not configured');
    }
    
    // Extract request metadata
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '';

    // Prepare contact data for GHL
    const contactData = {
      firstName: name.split(' ')[0] || '',
      lastName: name.split(' ').slice(1).join(' ') || '',
      email: email,
      phone: phone || '',
      source: 'Website Contact Form',
      tags: ['website-lead', 'contact-form'],
      customFields: [
        {
          key: 'service_interest',
          value: service || 'General Inquiry'
        },
        {
          key: 'message',
          value: message || ''
        }
      ]
    };

    // Submit to GoHighLevel Contacts API
    const ghlResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghlAccessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      }
    );

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text();
      console.error('GHL API Error:', errorText);
      throw new Error(`GHL API error: ${ghlResponse.status} - ${errorText}`);
    }

    const ghlResult = await ghlResponse.json();
    console.log('Successfully created contact in GHL:', ghlResult.contact?.id);

    // Save submission to database for tracking
    const { error: dbError } = await supabaseClient
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        service: service || null,
        message: message || null,
        ghl_contact_id: ghlResult.contact?.id || null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      });

    if (dbError) {
      console.error('Error saving submission to database:', dbError);
      // Don't fail the request if DB save fails, GHL submission succeeded
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        contactId: ghlResult.contact?.id,
        message: 'Contact submitted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in submit-contact-to-ghl function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
