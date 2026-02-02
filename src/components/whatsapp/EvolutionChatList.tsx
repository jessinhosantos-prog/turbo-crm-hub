import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { EvolutionChat } from '@/hooks/useEvolutionAPI';

interface EvolutionChatListProps {
  chats: EvolutionChat[];
  selectedId: string | null;
  onSelect: (chat: EvolutionChat) => void;
}

export const EvolutionChatList = ({
  chats,
  selectedId,
  onSelect,
}: EvolutionChatListProps) => {
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(search.toLowerCase()) ||
      chat.remoteJid.includes(search)
  );

  const formatPhone = (jid: string) => {
    return jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with search - fixed */}
      <div className="p-4 border-b space-y-3 shrink-0">
        <h2 className="text-lg font-semibold">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Scrollable chat list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={cn(
                'w-full p-4 flex items-start gap-3 border-b hover:bg-accent transition-colors text-left',
                selectedId === chat.id && 'bg-accent'
              )}
            >
              <Avatar className="h-12 w-12 flex-shrink-0">
                {chat.profilePicUrl && (
                  <AvatarImage src={chat.profilePicUrl} alt={chat.name} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {chat.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">
                    {chat.name || formatPhone(chat.remoteJid)}
                  </span>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};
