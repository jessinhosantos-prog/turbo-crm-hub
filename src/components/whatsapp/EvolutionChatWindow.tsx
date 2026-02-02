import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, Play, Pause, Download, FileText, Image as ImageIcon, Video, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EvolutionChat, EvolutionMessage } from '@/hooks/useEvolutionAPI';
import { cn } from '@/lib/utils';

interface EvolutionChatWindowProps {
  chat: EvolutionChat | null;
  onSendMessage: (number: string, text: string) => Promise<any>;
  fetchMessages: (remoteJid: string) => Promise<EvolutionMessage[]>;
}

// Audio player component
const AudioMessage = ({ url }: { url: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div className="flex-1">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs opacity-70">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

// Media message renderer
const MediaMessage = ({ message, messageType }: { message: any; messageType: string }) => {
  // Extract media URL based on message type
  const getMediaUrl = () => {
    if (message?.imageMessage?.url) return message.imageMessage.url;
    if (message?.videoMessage?.url) return message.videoMessage.url;
    if (message?.audioMessage?.url) return message.audioMessage.url;
    if (message?.documentMessage?.url) return message.documentMessage.url;
    if (message?.stickerMessage?.url) return message.stickerMessage.url;
    return null;
  };

  const mediaUrl = getMediaUrl();
  const caption = message?.imageMessage?.caption || 
                  message?.videoMessage?.caption || 
                  message?.documentMessage?.fileName ||
                  '';

  switch (messageType) {
    case 'imageMessage':
      return (
        <div className="space-y-1">
          {mediaUrl ? (
            <img 
              src={mediaUrl} 
              alt="Imagem" 
              className="max-w-[250px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm">📷 Imagem</span>
            </div>
          )}
          {caption && <p className="text-sm">{caption}</p>}
        </div>
      );

    case 'videoMessage':
      return (
        <div className="space-y-1">
          {mediaUrl ? (
            <video 
              src={mediaUrl} 
              controls 
              className="max-w-[250px] rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Video className="h-5 w-5" />
              <span className="text-sm">🎥 Vídeo</span>
            </div>
          )}
          {caption && <p className="text-sm">{caption}</p>}
        </div>
      );

    case 'audioMessage':
      return mediaUrl ? (
        <AudioMessage url={mediaUrl} />
      ) : (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg min-w-[150px]">
          <Mic className="h-5 w-5" />
          <span className="text-sm">🎵 Áudio</span>
        </div>
      );

    case 'documentMessage':
      const fileName = message?.documentMessage?.fileName || 'Documento';
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs opacity-70">Documento</p>
          </div>
          {mediaUrl && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      );

    case 'stickerMessage':
      return mediaUrl ? (
        <img 
          src={mediaUrl} 
          alt="Sticker" 
          className="w-24 h-24 object-contain"
        />
      ) : (
        <div className="flex items-center justify-center w-20 h-20 bg-muted/50 rounded-lg">
          <span className="text-2xl">🎨</span>
        </div>
      );

    case 'contactMessage':
      const displayName = message?.contactMessage?.displayName || 'Contato';
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs opacity-70">Contato compartilhado</p>
          </div>
        </div>
      );

    case 'locationMessage':
      const lat = message?.locationMessage?.degreesLatitude;
      const lng = message?.locationMessage?.degreesLongitude;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-sm font-medium">Localização</p>
              {lat && lng && (
                <a 
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Abrir no Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5" />
          <span className="text-sm">[Mídia não suportada]</span>
        </div>
      );
  }
};

export const EvolutionChatWindow = ({
  chat,
  onSendMessage,
  fetchMessages,
}: EvolutionChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chat]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const getMessageContent = (msg: any) => {
    const messageType = msg.messageType;
    const message = msg.message;

    // Text messages
    if (messageType === 'conversation' && message?.conversation) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.conversation}</p>;
    }

    if (messageType === 'extendedTextMessage' && message?.extendedTextMessage?.text) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.extendedTextMessage.text}</p>;
    }

    // Media messages
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage'];
    if (mediaTypes.includes(messageType)) {
      return <MediaMessage message={message} messageType={messageType} />;
    }

    // Fallback for text in message object
    if (message?.conversation) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.conversation}</p>;
    }

    if (message?.extendedTextMessage?.text) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.extendedTextMessage.text}</p>;
    }

    // Unknown message type
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span className="text-sm">[{messageType || 'Mensagem'}]</span>
      </div>
    );
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, msg) => {
    const date = formatDate(msg.messageTimestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(msg);
    return groups;
  }, {});

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 shrink-0">
        <h2 className="font-semibold">{chat.name || chat.remoteJid.split('@')[0]}</h2>
        <p className="text-sm text-muted-foreground">
          {chat.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')}
        </p>
      </div>

      {/* Messages - scrollable container */}
      <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : Object.keys(groupedMessages).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                    {date}
                  </span>
                </div>
                {/* Messages for this date */}
                <div className="space-y-2">
                  {msgs.map((msg: any) => (
                    <div
                      key={msg.key?.id || msg.id}
                      className={cn(
                        'max-w-[75%] p-3 rounded-lg',
                        msg.key?.fromMe
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {/* Sender name for groups */}
                      {!msg.key?.fromMe && msg.pushName && chat.remoteJid.includes('@g.us') && (
                        <p className="text-xs font-medium mb-1 opacity-80">{msg.pushName}</p>
                      )}
                      {getMessageContent(msg)}
                      <span className={cn(
                        'text-xs mt-1 block text-right',
                        msg.key?.fromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {formatTime(msg.messageTimestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhuma mensagem encontrada</p>
          </div>
        )}
      </div>

      {/* Input - fixed at bottom */}
      <div className="p-4 border-t shrink-0 bg-background">
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
