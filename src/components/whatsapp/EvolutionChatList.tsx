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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search & Filters */}
      <div className="shrink-0 p-3 space-y-2 border-b border-wa-border bg-wa-bg-main">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wa-text-muted" />
          <Input
            placeholder="Pesquisar por nome ou número"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-wa-surface border-wa-border rounded-md text-sm placeholder:text-wa-text-muted"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filter === 'all'
                ? 'bg-wa-text-main text-wa-bg-main'
                : 'bg-wa-surface text-wa-text-main hover:bg-wa-border'
            )}
          >
            Tudo
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              filter === 'mine'
                ? 'bg-wa-text-main text-wa-bg-main'
                : 'bg-wa-surface text-wa-text-main hover:bg-wa-border'
            )}
          >
            Minhas
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={cn(
                'w-full px-3 py-2.5 flex items-center gap-3 border-b border-wa-border/50 transition-colors text-left',
                selectedId === chat.id
                  ? 'bg-wa-surface'
                  : 'bg-wa-bg-main hover:bg-wa-surface/50'
              )}
            >
              <Avatar className="h-10 w-10 shrink-0">
                {chat.profilePicUrl && (
                  <AvatarImage src={chat.profilePicUrl} alt={chat.name} />
                )}
                <AvatarFallback className="bg-wa-surface text-wa-text-main font-medium text-sm">
                  {chat.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-sm truncate text-wa-text-main',
                    chat.unreadCount && chat.unreadCount > 0 ? 'font-bold' : 'font-medium'
                  )}>
                    {chat.name || formatPhone(chat.remoteJid)}
                  </span>
                  <span className="text-[11px] text-wa-text-muted ml-2 shrink-0">
                    {formatTimestamp(chat.lastMessageTimestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={cn(
                    'text-xs truncate max-w-[180px]',
                    chat.unreadCount && chat.unreadCount > 0 
                      ? 'text-wa-text-main' 
                      : 'text-wa-text-muted'
                  )}>
                    {chat.lastMessage || '\u00A0'}
                  </p>
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <span className="ml-2 shrink-0 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-wa-primary text-wa-primary-foreground text-[10px] font-bold">
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
