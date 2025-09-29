import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/hooks/useWhatsApp';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
}: ConversationListProps) => {
  const [search, setSearch] = useState('');

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.contact_phone.includes(search)
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Conversas</h2>
          <Button size="icon" variant="ghost" onClick={onNewConversation}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contatos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              'w-full p-4 flex items-start gap-3 border-b hover:bg-accent transition-colors text-left',
              selectedId === conversation.id && 'bg-accent'
            )}
          >
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {conversation.contact_name?.[0]?.toUpperCase() ||
                  conversation.contact_phone[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate">
                  {conversation.contact_name || conversation.contact_phone}
                </span>
                {conversation.unread_count > 0 && (
                  <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.last_message || 'Sem mensagens'}
                </p>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatTime(conversation.last_message_at)}
                </span>
              </div>
            </div>
          </button>
        ))}

        {filteredConversations.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhuma conversa encontrada</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
