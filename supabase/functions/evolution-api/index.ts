import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed actions whitelist
const ALLOWED_ACTIONS = [
  'createInstance', 'getQrCode', 'getInstanceStatus', 'fetchInstances',
  'deleteInstance', 'getChats', 'getMessages', 'getBase64FromMediaMessage',
  'sendMessage', 'getProfilePic', 'fetchPresence', 'logout'
] as const;

type AllowedAction = typeof ALLOWED_ACTIONS[number];

// Validate instance name: alphanumeric, underscore, hyphen only, max 50 chars
const isValidInstanceName = (name: string): boolean => {
  return /^[a-zA-Z0-9_-]{1,50}$/.test(name);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION CHECK ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized', success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');

    if (!EVOLUTION_API_URL) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }
    if (!EVOLUTION_API_KEY) {
      throw new Error('EVOLUTION_API_KEY não configurada');
    }

    // Remove trailing slash if present
    const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '');

    // === INPUT VALIDATION ===
    let requestBody: { action?: string; instanceName?: string; data?: unknown };
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body', success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { action, instanceName, data } = requestBody;

    // Validate action
    if (!action || !ALLOWED_ACTIONS.includes(action as AllowedAction)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing action', success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Validate instance name if provided
    const instance = instanceName || 'crm-turbo';
    if (!isValidInstanceName(instance)) {
      return new Response(JSON.stringify({ error: 'Invalid instance name format', success: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Evolution API - Action: ${action}, Instance: ${instance}, User: ${userId}`);

    let endpoint = '';
    let method = 'GET';
    let body: string | null = null;

    switch (action) {
      case 'createInstance':
        endpoint = '/instance/create';
        method = 'POST';
        body = JSON.stringify({
          instanceName: instance,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: false,
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        });
        break;

      case 'getQrCode':
        endpoint = `/instance/connect/${instance}`;
        method = 'GET';
        break;

      case 'getInstanceStatus':
        endpoint = `/instance/connectionState/${instance}`;
        method = 'GET';
        break;

      case 'fetchInstances':
        endpoint = '/instance/fetchInstances';
        method = 'GET';
        break;

      case 'deleteInstance':
        endpoint = `/instance/delete/${instance}`;
        method = 'DELETE';
        break;

      case 'getChats':
        endpoint = `/chat/findChats/${instance}`;
        method = 'POST';
        body = JSON.stringify({});
        break;

      case 'getMessages':
        endpoint = `/chat/findMessages/${instance}`;
        method = 'POST';
        const msgData = data as { remoteJid?: string } | undefined;
        body = JSON.stringify({
          where: {
            key: {
              remoteJid: msgData?.remoteJid,
            },
          },
          limit: 50,
        });
        break;

      // Decrypt WhatsApp media (.enc) into Base64
      // Docs reference: /chat/getBase64FromMediaMessage/{instance}
      case 'getBase64FromMediaMessage':
        endpoint = `/chat/getBase64FromMediaMessage/${instance}`;
        method = 'POST';
        const mediaData = data as { message?: unknown; convertToMp4?: boolean } | undefined;
        body = JSON.stringify({
          message: mediaData?.message,
          convertToMp4: mediaData?.convertToMp4 ?? true,
        });
        break;

      case 'sendMessage':
        endpoint = `/message/sendText/${instance}`;
        method = 'POST';
        const sendData = data as { number?: string; text?: string } | undefined;
        body = JSON.stringify({
          number: sendData?.number,
          text: sendData?.text,
        });
        break;

      case 'getProfilePic':
        endpoint = `/chat/fetchProfilePictureUrl/${instance}`;
        method = 'POST';
        const picData = data as { number?: string } | undefined;
        body = JSON.stringify({
          number: picData?.number,
        });
        break;

      case 'fetchPresence':
        endpoint = `/chat/fetchPresence/${instance}`;
        method = 'POST';
        const presenceData = data as { number?: string } | undefined;
        body = JSON.stringify({
          number: presenceData?.number,
        });
        break;

      case 'logout':
        endpoint = `/instance/logout/${instance}`;
        method = 'DELETE';
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    const url = `${baseUrl}${endpoint}`;
    console.log(`Calling Evolution API: ${method} ${url}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = body;
      console.log(`Request body: ${body}`);
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();

    console.log(`Evolution API Response Status: ${response.status}`);
    console.log(`Evolution API Response: ${responseText.substring(0, 1000)}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Handle 404 specially - instance doesn't exist
    if (response.status === 404) {
      return new Response(JSON.stringify({
        error: 'INSTANCE_NOT_FOUND',
        message: 'Instância não encontrada',
        data: responseData,
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so frontend can handle gracefully
      });
    }

    // Handle 409 - instance already exists
    if (response.status === 409) {
      return new Response(JSON.stringify({
        error: 'INSTANCE_EXISTS',
        message: 'Instância já existe',
        data: responseData,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${responseText}`);
      return new Response(JSON.stringify({
        error: `API_ERROR_${response.status}`,
        message: responseData?.message || responseData?.response?.message || `Erro na API: ${response.status}`,
        data: responseData,
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so frontend handles it
      });
    }

    return new Response(JSON.stringify({
      ...responseData,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Evolution API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
