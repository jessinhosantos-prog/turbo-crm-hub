import { useState } from 'react';
import { useEvolutionAPI, EvolutionChat } from '@/hooks/useEvolutionAPI';
import { QRCodeConnection } from '@/components/whatsapp/QRCodeConnection';
import { EvolutionChatList } from '@/components/whatsapp/EvolutionChatList';
import { EvolutionChatWindow } from '@/components/whatsapp/EvolutionChatWindow';
import { Loader2 } from 'lucide-react';

export default function WhatsAppPage() {
  const {
    isConnected,
    isConnecting,
    qrCode,
    chats,
    loading,
    connect,
    disconnect,
    fetchMessages,
    sendMessage,
  } = useEvolutionAPI();

  const [selectedChat, setSelectedChat] = useState<EvolutionChat | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não está conectado, mostra a tela de conexão
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-md">
          <QRCodeConnection
            isConnected={isConnected}
            isConnecting={isConnecting}
            qrCode={qrCode}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </div>
    );
  }

  // Conectado - mostra a interface de chat
  return (
    <div className="h-full flex overflow-hidden rounded-lg border bg-card">
      <div className="w-80 border-r flex-shrink-0">
        <EvolutionChatList
          chats={chats}
          selectedId={selectedChat?.id || null}
          onSelect={setSelectedChat}
        />
      </div>
      <div className="flex-1">
        <EvolutionChatWindow
          chat={selectedChat}
          onSendMessage={sendMessage}
          fetchMessages={fetchMessages}
        />
      </div>
    </div>
  );
}
