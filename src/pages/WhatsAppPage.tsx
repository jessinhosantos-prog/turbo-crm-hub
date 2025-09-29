import { useState } from 'react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatWindow } from '@/components/whatsapp/ChatWindow';
import { TemplatePanel } from '@/components/whatsapp/TemplatePanel';
import { NewConversationDialog } from '@/components/whatsapp/NewConversationDialog';

export default function WhatsAppPage() {
  const {
    conversations,
    messages,
    templates,
    selectedConversation,
    setSelectedConversation,
    sendMessage,
    createConversation,
    createTemplate,
    loading,
  } = useWhatsApp();

  const [showNewConversation, setShowNewConversation] = useState(false);

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  const handleSendMessage = (text: string) => {
    if (selectedConversation) {
      sendMessage(selectedConversation, text);
    }
  };

  const handleUseTemplate = (content: string) => {
    if (selectedConversation) {
      sendMessage(selectedConversation, content);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
          onNewConversation={() => setShowNewConversation(true)}
        />
        <ChatWindow
          conversation={currentConversation || null}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        <TemplatePanel
          templates={templates}
          onCreateTemplate={createTemplate}
          onUseTemplate={handleUseTemplate}
        />
      </div>

      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onCreateConversation={createConversation}
      />
    </>
  );
}