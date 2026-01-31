import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');

    if (!EVOLUTION_API_URL) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }
    if (!EVOLUTION_API_KEY) {
      throw new Error('EVOLUTION_API_KEY não configurada');
    }

    const { action, instanceName, data } = await req.json();
    console.log(`Evolution API - Action: ${action}, Instance: ${instanceName}`);

    let endpoint = '';
    let method = 'GET';
    let body = null;

    switch (action) {
      case 'createInstance':
        endpoint = '/instance/create';
        method = 'POST';
        body = JSON.stringify({
          instanceName: instanceName || 'crm-turbo',
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        });
        break;

      case 'getQrCode':
        endpoint = `/instance/connect/${instanceName || 'crm-turbo'}`;
        method = 'GET';
        break;

      case 'getInstanceStatus':
        endpoint = `/instance/connectionState/${instanceName || 'crm-turbo'}`;
        method = 'GET';
        break;

      case 'fetchInstances':
        endpoint = '/instance/fetchInstances';
        method = 'GET';
        break;

      case 'getChats':
        endpoint = `/chat/findChats/${instanceName || 'crm-turbo'}`;
        method = 'POST';
        body = JSON.stringify({});
        break;

      case 'getMessages':
        endpoint = `/chat/findMessages/${instanceName || 'crm-turbo'}`;
        method = 'POST';
        body = JSON.stringify({
          where: {
            key: {
              remoteJid: data?.remoteJid,
            },
          },
          limit: 50,
        });
        break;

      case 'sendMessage':
        endpoint = `/message/sendText/${instanceName || 'crm-turbo'}`;
        method = 'POST';
        body = JSON.stringify({
          number: data?.number,
          text: data?.text,
        });
        break;

      case 'logout':
        endpoint = `/instance/logout/${instanceName || 'crm-turbo'}`;
        method = 'DELETE';
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    const url = `${EVOLUTION_API_URL}${endpoint}`;
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
    }

    const response = await fetch(url, fetchOptions);
    const responseData = await response.json();

    console.log(`Evolution API Response Status: ${response.status}`);
    console.log(`Evolution API Response:`, JSON.stringify(responseData).substring(0, 500));

    if (!response.ok) {
      throw new Error(responseData.message || `Erro na API: ${response.status}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Evolution API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
