import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Get GHL credentials from environment
    const ghlLocationId = Deno.env.get('GHL_LOCATION_ID');
    const ghlAccessToken = Deno.env.get('GHL_ACCESS_TOKEN');

    if (!ghlLocationId || !ghlAccessToken) {
      throw new Error('GHL credentials not configured');
    }

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
