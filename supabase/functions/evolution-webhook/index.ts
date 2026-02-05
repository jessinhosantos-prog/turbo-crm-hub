import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // === WEBHOOK AUTHENTICATION ===
        // Validate webhook secret to prevent unauthorized webhook calls
        const webhookSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET');
        if (webhookSecret) {
            const providedSecret = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret');
            if (providedSecret !== webhookSecret) {
                console.error('Webhook authentication failed: invalid secret');
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401
                })
            }
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let body: { event?: string; instance?: string; data?: unknown };
        try {
            body = await req.json()
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        console.log('Webhook received:', JSON.stringify(body, null, 2))

        const { event, instance, data } = body

        // Validate event type
        if (!event || typeof event !== 'string') {
            return new Response(JSON.stringify({ error: 'Missing or invalid event type' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // Validate instance name format (alphanumeric, underscore, hyphen only)
        if (instance && !/^[a-zA-Z0-9_-]{1,50}$/.test(instance)) {
            return new Response(JSON.stringify({ error: 'Invalid instance name format' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // Handle messages.upsert event
        if (event === 'messages.upsert') {
            const dataObj = data as { messages?: unknown[] } | undefined;
            const message = (dataObj?.messages?.[0] || data) as {
                key?: { remoteJid?: string; fromMe?: boolean };
                message?: { conversation?: string; extendedTextMessage?: { text?: string } };
                pushName?: string;
            } | undefined;

            if (!message) {
                return new Response(JSON.stringify({ error: 'No message data' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                })
            }

            const remoteJid = message.key?.remoteJid
            const fromMe = message.key?.fromMe === true

            // Validate remoteJid format
            if (!remoteJid) {
                return new Response(JSON.stringify({ error: 'No remoteJid' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                })
            }

            // Basic validation: remoteJid should look like a WhatsApp JID
            if (!remoteJid.includes('@s.whatsapp.net') && !remoteJid.includes('@g.us')) {
                return new Response(JSON.stringify({ error: 'Invalid remoteJid format' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                })
            }

            // Extract message text
            let messageText = ''
            if (message.message?.conversation) {
                messageText = message.message.conversation
            } else if (message.message?.extendedTextMessage?.text) {
                messageText = message.message.extendedTextMessage.text
            } else {
                messageText = '[Mídia]'
            }

            // Sanitize message text (limit length, remove control characters)
            messageText = messageText.substring(0, 5000).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

            // === USER MAPPING ===
            // Try to find the user_id associated with this instance
            let mappedUserId = '00000000-0000-0000-0000-000000000000'; // Default fallback
            
            if (instance) {
                // Look up user by instance_name in existing conversations
                const { data: existingUserConv } = await supabaseClient
                    .from('whatsapp_conversations')
                    .select('user_id')
                    .eq('instance_name', instance)
                    .not('user_id', 'eq', '00000000-0000-0000-0000-000000000000')
                    .limit(1)
                    .single();
                
                if (existingUserConv?.user_id) {
                    mappedUserId = existingUserConv.user_id;
                    console.log(`Mapped instance ${instance} to user ${mappedUserId}`);
                }
            }

            // Get or create conversation
            const { data: existingConv, error: fetchError } = await supabaseClient
                .from('whatsapp_conversations')
                .select('*')
                .eq('remote_jid', remoteJid)
                .eq('instance_name', instance || '')
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError)
            }

            if (existingConv) {
                // Update existing conversation
                const updates: any = {
                    last_message: messageText,
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }

                // 🔥 REGRA DE OURO: Incrementar unread_count apenas se:
                // 1. Mensagem NÃO é do usuário (fromMe === false)
                // 2. Chat NÃO está aberto (is_open === false)
                if (!fromMe && !existingConv.is_open) {
                    updates.unread_count = (existingConv.unread_count || 0) + 1
                }

                const { error: updateError } = await supabaseClient
                    .from('whatsapp_conversations')
                    .update(updates)
                    .eq('id', existingConv.id)

                if (updateError) {
                    console.error('Error updating conversation:', updateError)
                } else {
                    console.log('Conversation updated:', remoteJid, { fromMe, is_open: existingConv.is_open, new_unread: updates.unread_count })
                }
            } else {
                // Create new conversation (assuming user_id from auth or default)
                // For now, we'll use a service account approach
                const { error: insertError } = await supabaseClient
                    .from('whatsapp_conversations')
                    .insert({
                        remote_jid: remoteJid,
                        contact_phone: remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', ''),
                        contact_name: (message.pushName || '').substring(0, 255) || null,
                        last_message: messageText,
                        last_message_at: new Date().toISOString(),
                        unread_count: fromMe ? 0 : 1, // Only increment if not from me
                        is_open: false,
                        instance_name: instance,
                        user_id: mappedUserId,
                    })

                if (insertError) {
                    console.error('Error creating conversation:', insertError)
                } else {
                    console.log('Conversation created:', remoteJid)
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        console.error('Webhook error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
