import { FileText, Image as ImageIcon, Video, Mic, Download, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';

interface MediaMessageProps {
  message: any;
  messageType: string;
  fromMe?: boolean;
}

export const MediaMessage = ({ message, messageType, fromMe = false }: MediaMessageProps) => {
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
        <div className="space-y-2">
          {mediaUrl ? (
            <img 
              src={mediaUrl} 
              alt="Imagem" 
              className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-wa-surface rounded-lg">
              <ImageIcon className="h-5 w-5 text-wa-text-muted" />
              <span className="text-sm text-wa-text-main">📷 Imagem</span>
            </div>
          )}
          {caption && <p className="text-sm">{caption}</p>}
        </div>
      );

    case 'videoMessage':
      return (
        <div className="space-y-2">
          {mediaUrl ? (
            <video 
              src={mediaUrl} 
              controls 
              className="max-w-[280px] rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 bg-wa-surface rounded-lg">
              <Video className="h-5 w-5 text-wa-text-muted" />
              <span className="text-sm text-wa-text-main">🎥 Vídeo</span>
            </div>
          )}
          {caption && <p className="text-sm">{caption}</p>}
        </div>
      );

    case 'audioMessage':
      return mediaUrl ? (
        <AudioPlayer url={mediaUrl} fromMe={fromMe} />
      ) : (
        <div className="flex items-center gap-2 p-3 bg-wa-primary rounded-lg min-w-[180px]">
          <Mic className="h-5 w-5 text-wa-primary-foreground" />
          <span className="text-sm text-wa-primary-foreground">🎵 Áudio</span>
        </div>
      );

    case 'documentMessage':
      const fileName = message?.documentMessage?.fileName || 'Documento';
      return (
        <div className="flex items-center gap-3 p-3 bg-wa-surface rounded-lg min-w-[200px]">
          <div className="h-10 w-10 rounded-lg bg-wa-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-wa-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-wa-text-main truncate">{fileName}</p>
            <p className="text-xs text-wa-text-muted">Documento</p>
          </div>
          {mediaUrl && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-wa-text-muted hover:text-wa-text-main" asChild>
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
          className="w-28 h-28 object-contain"
        />
      ) : (
        <div className="flex items-center justify-center w-24 h-24 bg-wa-surface rounded-lg">
          <span className="text-3xl">🎨</span>
        </div>
      );

    case 'contactMessage':
      const displayName = message?.contactMessage?.displayName || 'Contato';
      return (
        <div className="flex items-center gap-3 p-3 bg-wa-surface rounded-lg min-w-[180px]">
          <div className="h-12 w-12 rounded-full bg-wa-info/20 flex items-center justify-center">
            <User className="h-6 w-6 text-wa-info" />
          </div>
          <div>
            <p className="text-sm font-medium text-wa-text-main">{displayName}</p>
            <p className="text-xs text-wa-text-muted">Contato compartilhado</p>
          </div>
        </div>
      );

    case 'locationMessage':
      const lat = message?.locationMessage?.degreesLatitude;
      const lng = message?.locationMessage?.degreesLongitude;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-wa-surface rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-wa-danger/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-wa-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-wa-text-main">Localização</p>
              {lat && lng && (
                <a 
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-wa-info hover:underline"
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
        <div className="flex items-center gap-2 p-3 bg-wa-surface rounded-lg">
          <FileText className="h-5 w-5 text-wa-text-muted" />
          <span className="text-sm text-wa-text-main">[Mídia não suportada]</span>
        </div>
      );
  }
};
