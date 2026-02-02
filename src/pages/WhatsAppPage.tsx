import { useState } from 'react';
import { useEvolutionAPI, EvolutionChat } from '@/hooks/useEvolutionAPI';
import { QRCodeConnection } from '@/components/whatsapp/QRCodeConnection';
import { EvolutionChatList } from '@/components/whatsapp/EvolutionChatList';
import { EvolutionChatWindow } from '@/components/whatsapp/EvolutionChatWindow';
import { InstanceSelector } from '@/components/whatsapp/InstanceSelector';
import { Loader2, RefreshCw, Settings, Bell, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Count total unread messages
  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-wa-bg-main">
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
      <div className="flex items-center justify-center h-full p-6 bg-wa-bg-main">
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
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-wa-bg-main">
      {/* Main Content - Two Column Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Contact List */}
        <aside className="w-80 min-h-0 border-r border-wa-border flex flex-col bg-wa-bg-main">
          {/* Sidebar Header with Profile */}
          <div className="px-3 py-2.5 border-b border-wa-border flex items-center justify-between bg-wa-bg-main">
            <button
              type="button"
              className="flex items-center gap-2 max-w-[210px] rounded-md border border-wa-border bg-wa-surface px-3 py-1.5 text-sm text-wa-text-main"
            >
              <Smartphone className="h-4 w-4 text-wa-text-muted" />
              <span className="truncate">
                {currentInstance?.profileName || currentInstance?.name}
              </span>
            </button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchChats}
                className="h-8 w-8 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {/* Notification bell with badge */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 relative text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
              >
                <Bell className="h-4 w-4" />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-wa-primary text-wa-primary-foreground text-[9px] font-bold">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-wa-text-muted hover:text-wa-text-main hover:bg-wa-surface"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat List - takes remaining space */}
          <EvolutionChatList
            chats={chats}
            selectedId={selectedChat?.id || null}
            onSelect={setSelectedChat}
          />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
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
