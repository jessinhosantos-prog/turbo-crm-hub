import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  contact_phone: string;
  contact_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  message_text: string;
  is_from_user: boolean;
  sentiment?: string;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export const useWhatsApp = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Buscar conversas
  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar conversas',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Buscar mensagens de uma conversa
  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar mensagens',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Buscar templates
  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async (conversationId: string, messageText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          message_text: messageText,
          is_from_user: true,
        });

      if (error) throw error;

      // Atualizar última mensagem da conversa
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Criar nova conversa
  const createConversation = async (contactPhone: string, contactName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .insert({
          user_id: user.id,
          contact_phone: contactPhone,
          contact_name: contactName,
        })
        .select()
        .single();

      if (error) throw error;

      setConversations([data, ...conversations]);
      setSelectedConversation(data.id);

      toast({
        title: 'Conversa criada',
        description: 'Nova conversa iniciada com sucesso.',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conversa',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Criar template
  const createTemplate = async (title: string, content: string, category?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('message_templates')
        .insert({
          user_id: user.id,
          title,
          content,
          category,
        });

      if (error) throw error;

      await fetchTemplates();

      toast({
        title: 'Template criado',
        description: 'Novo template salvo com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar template',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchConversations();
    fetchTemplates();

    const conversationsChannel = supabase
      .channel('whatsapp_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('whatsapp_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          if (
            selectedConversation &&
            payload.new.conversation_id === selectedConversation
          ) {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedConversation]);

  // Carregar mensagens quando seleção muda
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  return {
    conversations,
    messages,
    templates,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    createConversation,
    createTemplate,
    loading,
  };
};
