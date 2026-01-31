import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EvolutionChat {
  id: string;
  remoteJid: string;
  name?: string;
  profilePicUrl?: string;
  lastMessage?: string;
  unreadCount?: number;
}

export interface EvolutionMessage {
  id: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text?: string;
    };
  };
  messageTimestamp?: number;
}

interface InstanceStatus {
  state: 'open' | 'close' | 'connecting';
  connected: boolean;
}

export const useEvolutionAPI = (instanceName = 'crm-turbo') => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [chats, setChats] = useState<EvolutionChat[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const callEvolutionAPI = useCallback(async (action: string, data?: any) => {
    try {
      const { data: response, error } = await supabase.functions.invoke('evolution-api', {
        body: { action, instanceName, data },
      });

      if (error) throw error;
      return response;
    } catch (error: any) {
      console.error(`Evolution API Error (${action}):`, error);
      throw error;
    }
  }, [instanceName]);

  const checkStatus = useCallback(async () => {
    try {
      const response = await callEvolutionAPI('getInstanceStatus');
      const state = response?.instance?.state || response?.state;
      
      if (state === 'open') {
        setIsConnected(true);
        setQrCode(null);
        setIsConnecting(false);
        return true;
      } else {
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.log('Instance may not exist yet');
      setIsConnected(false);
      return false;
    }
  }, [callEvolutionAPI]);

  const createInstance = useCallback(async () => {
    try {
      setIsConnecting(true);
      const response = await callEvolutionAPI('createInstance');
      
      if (response?.qrcode?.base64) {
        setQrCode(response.qrcode.base64);
      }
      
      toast({
        title: 'Instância criada',
        description: 'Escaneie o QR Code para conectar',
      });
      
      return response;
    } catch (error: any) {
      // Se já existe, tenta obter o QR Code
      if (error.message?.includes('already') || error.message?.includes('existe')) {
        return getQrCode();
      }
      toast({
        title: 'Erro ao criar instância',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [callEvolutionAPI, toast]);

  const getQrCode = useCallback(async () => {
    try {
      setIsConnecting(true);
      const response = await callEvolutionAPI('getQrCode');
      
      if (response?.base64 || response?.qrcode?.base64) {
        const qr = response.base64 || response.qrcode.base64;
        setQrCode(qr);
      }
      
      return response;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }, [callEvolutionAPI]);

  const connect = useCallback(async () => {
    try {
      const connected = await checkStatus();
      if (connected) {
        toast({
          title: 'Já conectado',
          description: 'WhatsApp já está conectado',
        });
        return;
      }
      
      // Try to get existing instance or create new
      try {
        await getQrCode();
      } catch {
        await createInstance();
      }
    } catch (error: any) {
      setIsConnecting(false);
      toast({
        title: 'Erro ao conectar',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [checkStatus, getQrCode, createInstance, toast]);

  const disconnect = useCallback(async () => {
    try {
      await callEvolutionAPI('logout');
      setIsConnected(false);
      setQrCode(null);
      toast({
        title: 'Desconectado',
        description: 'WhatsApp desconectado com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao desconectar',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [callEvolutionAPI, toast]);

  const fetchChats = useCallback(async () => {
    if (!isConnected) return [];
    
    try {
      const response = await callEvolutionAPI('getChats');
      const chatList = Array.isArray(response) ? response : [];
      
      const formattedChats: EvolutionChat[] = chatList.map((chat: any) => ({
        id: chat.id || chat.remoteJid,
        remoteJid: chat.remoteJid || chat.id,
        name: chat.name || chat.pushName || chat.remoteJid?.split('@')[0],
        profilePicUrl: chat.profilePicUrl,
        lastMessage: chat.lastMessage?.message?.conversation || 
                     chat.lastMessage?.message?.extendedTextMessage?.text,
        unreadCount: chat.unreadCount || 0,
      }));
      
      setChats(formattedChats);
      return formattedChats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }, [isConnected, callEvolutionAPI]);

  const fetchMessages = useCallback(async (remoteJid: string) => {
    if (!isConnected) return [];
    
    try {
      const response = await callEvolutionAPI('getMessages', { remoteJid });
      return Array.isArray(response) ? response : response?.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }, [isConnected, callEvolutionAPI]);

  const sendMessage = useCallback(async (number: string, text: string) => {
    try {
      const response = await callEvolutionAPI('sendMessage', { number, text });
      toast({
        title: 'Mensagem enviada',
        description: 'Mensagem enviada com sucesso',
      });
      return response;
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [callEvolutionAPI, toast]);

  // Check status on mount and periodically when connecting
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkStatus();
      setLoading(false);
    };
    
    init();
  }, []);

  // Poll for connection status when showing QR code
  useEffect(() => {
    if (!isConnecting || !qrCode) return;
    
    const interval = setInterval(async () => {
      const connected = await checkStatus();
      if (connected) {
        setIsConnecting(false);
        toast({
          title: 'Conectado!',
          description: 'WhatsApp conectado com sucesso',
        });
        fetchChats();
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isConnecting, qrCode, checkStatus, fetchChats, toast]);

  // Fetch chats when connected
  useEffect(() => {
    if (isConnected) {
      fetchChats();
    }
  }, [isConnected, fetchChats]);

  return {
    isConnected,
    isConnecting,
    qrCode,
    chats,
    loading,
    connect,
    disconnect,
    fetchChats,
    fetchMessages,
    sendMessage,
  };
};
