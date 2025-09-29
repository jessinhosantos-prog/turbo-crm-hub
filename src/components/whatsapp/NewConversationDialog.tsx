import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (phone: string, name?: string) => void;
}

export const NewConversationDialog = ({
  open,
  onOpenChange,
  onCreateConversation,
}: NewConversationDialogProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (phone.trim()) {
      onCreateConversation(phone, name || undefined);
      setPhone('');
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Inicie uma nova conversa com um contato
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome (opcional)</label>
            <Input
              placeholder="Nome do contato"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!phone.trim()}>
            Criar Conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
