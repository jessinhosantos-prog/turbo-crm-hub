import { useState } from 'react';
import { useEvolutionAPI, EvolutionChat } from '@/hooks/useEvolutionAPI';
import { QRCodeConnection } from '@/components/whatsapp/QRCodeConnection';
import { EvolutionChatList } from '@/components/whatsapp/EvolutionChatList';
import { EvolutionChatWindow } from '@/components/whatsapp/EvolutionChatWindow';
import { InstanceSelector } from '@/components/whatsapp/InstanceSelector';
import { Loader2, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function WhatsAppPage() {
  const {
    isConnected,
    isConnecting,
    instances,
    currentInstance,
    qrCode,
    chats,
    loading,
    connect,
    disconnect,
    fetchChats,
    fetchMessages,
    sendMessage,
    selectInstance,
    fetchInstances,
  } = useEvolutionAPI();

  const [selectedChat, setSelectedChat] = useState<EvolutionChat | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-wa-bg-subtle">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-wa-primary mx-auto" />
          <p className="text-wa-text-muted">Carregando instâncias...</p>
        </div>
      </div>
    );
  }

  // If not connected, show connection screen
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full p-6 bg-wa-bg-subtle">
        <div className="w-full max-w-lg space-y-6">
          {instances.length > 0 && (
            <InstanceSelector
              instances={instances}
              currentInstance={currentInstance}
              onSelect={selectInstance}
              onRefresh={fetchInstances}
            />
          )}
          
          <QRCodeConnection
            isConnected={isConnected}
            isConnecting={isConnecting}
            qrCode={qrCode}
            onConnect={() => connect()}
            onDisconnect={disconnect}
          />
        </div>
      </div>
    );
  }

  // Connected - show chat interface
  return (
    <div className="h-full flex flex-col overflow-hidden bg-wa-bg-main">
      {/* Main Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-wa-border bg-wa-bg-main shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {currentInstance?.profilePicUrl && (
              <AvatarImage src={currentInstance.profilePicUrl} alt="Profile" />
            )}
            <AvatarFallback className="bg-wa-primary text-wa-primary-foreground text-sm font-semibold">
              {currentInstance?.profileName?.[0]?.toUpperCase() || 'W'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm text-wa-text-main">
              {currentInstance?.profileName || currentInstance?.name}
            </p>
            <p className="text-xs text-wa-text-muted">
              {currentInstance?._count?.Chat || 0} conversas • {currentInstance?._count?.Message || 0} mensagens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchChats}
            className="h-9 w-9 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={disconnect}
            className="ml-2 text-wa-danger border-wa-danger/30 hover:bg-wa-danger/10 hover:text-wa-danger"
          >
            Desconectar
          </Button>
        </div>
      </header>
      
      {/* Chat Interface - Two Column Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Contact List (320px fixed) */}
        <aside className="w-80 border-r border-wa-border flex-shrink-0 h-full overflow-hidden">
          <EvolutionChatList
            chats={chats}
            selectedId={selectedChat?.id || null}
            onSelect={setSelectedChat}
          />
        </aside>

        {/* Main Chat Area (Flex) */}
        <main className="flex-1 h-full overflow-hidden">
          <EvolutionChatWindow
            chat={selectedChat}
            onSendMessage={sendMessage}
            fetchMessages={fetchMessages}
          />
        </main>
      </div>
    </div>
  );
}
