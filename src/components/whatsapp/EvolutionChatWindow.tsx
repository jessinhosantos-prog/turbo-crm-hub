import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EvolutionChat, EvolutionMessage } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';

interface EvolutionChatWindowProps {
  chat: EvolutionChat | null;
  onSendMessage: (number: string, text: string) => Promise<any>;
  fetchMessages: (remoteJid: string) => Promise<EvolutionMessage[]>;
}

export const EvolutionChatWindow = ({
  chat,
  onSendMessage,
  fetchMessages,
}: EvolutionChatWindowProps) => {
  const [messages, setMessages] = useState<EvolutionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chat]);

  const loadMessages = async () => {
    if (!chat) return;
    
    setLoading(true);
    try {
      const msgs = await fetchMessages(chat.remoteJid);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !chat) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const number = chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      await onSendMessage(number, text);
      
      // Reload messages after sending
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getMessageText = (msg: EvolutionMessage) => {
    return msg.message?.conversation || 
           msg.message?.extendedTextMessage?.text || 
           '[Mídia não suportada]';
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Selecione uma conversa</h3>
        <p className="text-sm">Escolha uma conversa para visualizar as mensagens</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h2 className="font-semibold">{chat.name || chat.remoteJid.split('@')[0]}</h2>
        <p className="text-sm text-muted-foreground">
          {chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.key.id}
                className={cn(
                  'max-w-[70%] p-3 rounded-lg',
                  msg.key.fromMe
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{getMessageText(msg)}</p>
                <span className={cn(
                  'text-xs mt-1 block',
                  msg.key.fromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}>
                  {formatTime(msg.messageTimestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhuma mensagem encontrada</p>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Digite uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
