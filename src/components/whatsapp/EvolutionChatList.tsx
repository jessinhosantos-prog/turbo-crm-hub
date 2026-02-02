import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(search.toLowerCase()) ||
      chat.remoteJid.includes(search)
  );

  const formatPhone = (jid: string) => {
    return jid.replace('@s.whatsapp.net', '').replace('@g.us', '');
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-wa-surface">
      {/* Header with search - fixed */}
      <div className="p-4 border-b border-wa-border space-y-3 shrink-0 bg-wa-bg-main">
        <h2 className="text-lg font-bold text-wa-text-main">Conversas</h2>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wa-text-muted" />
          <Input
            placeholder="Pesquisar por nome ou número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-wa-bg-main border-wa-border rounded-md text-sm placeholder:text-wa-text-muted"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === 'all'
                ? 'bg-wa-primary text-wa-primary-foreground'
                : 'bg-wa-surface text-wa-text-main hover:bg-wa-border'
            )}
          >
            Tudo
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === 'mine'
                ? 'bg-wa-primary text-wa-primary-foreground'
                : 'bg-wa-surface text-wa-text-main hover:bg-wa-border'
            )}
          >
            Minhas
          </button>
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
                'w-full px-4 py-3 flex items-center gap-3 border-b border-wa-border transition-colors text-left relative',
                selectedId === chat.id
                  ? 'bg-wa-bg-main border-l-4 border-l-wa-info'
                  : 'bg-wa-bg-main hover:bg-wa-surface'
              )}
            >
              {/* Avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  {chat.profilePicUrl && (
                    <AvatarImage src={chat.profilePicUrl} alt={chat.name} />
                  )}
                  <AvatarFallback className="bg-wa-primary text-wa-primary-foreground font-semibold">
                    {chat.name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-wa-info rounded-full border-2 border-wa-bg-main" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn(
                    'text-sm truncate text-wa-text-main',
                    chat.unreadCount && chat.unreadCount > 0 ? 'font-bold' : 'font-medium'
                  )}>
                    {chat.name || formatPhone(chat.remoteJid)}
                  </span>
                  <span className="text-xs text-wa-text-muted ml-2 flex-shrink-0">
                    {formatTimestamp(chat.lastMessageTimestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  {chat.lastMessage && (
                    <p className={cn(
                      'text-xs truncate',
                      chat.unreadCount && chat.unreadCount > 0 
                        ? 'text-wa-text-main font-medium' 
                        : 'text-wa-text-muted'
                    )}>
                      {chat.lastMessage}
                    </p>
                  )}
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="ml-2 flex-shrink-0 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-wa-primary text-wa-primary-foreground text-xs font-bold">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 text-center text-wa-text-muted">
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};
