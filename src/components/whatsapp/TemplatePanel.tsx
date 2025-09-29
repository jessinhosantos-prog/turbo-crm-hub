import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageTemplate } from '@/hooks/useWhatsApp';
import { Badge } from '@/components/ui/badge';

interface TemplatePanelProps {
  templates: MessageTemplate[];
  onCreateTemplate: (title: string, content: string, category?: string) => void;
  onUseTemplate: (content: string) => void;
}

export const TemplatePanel = ({
  templates,
  onCreateTemplate,
  onUseTemplate,
}: TemplatePanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const handleCreate = () => {
    if (title.trim() && content.trim()) {
      onCreateTemplate(title, content, category || undefined);
      setTitle('');
      setContent('');
      setCategory('');
      setIsOpen(false);
    }
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Template</DialogTitle>
                <DialogDescription>
                  Crie um template de mensagem para reutilizar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Ex: Boas-vindas"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    placeholder="Ex: Vendas, Suporte"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem</label>
                  <Textarea
                    placeholder="Digite o conteúdo do template..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Criar Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onUseTemplate(template.content)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    {template.title}
                  </CardTitle>
                </div>
                {template.category && (
                  <Badge variant="secondary" className="w-fit text-xs mt-1">
                    {template.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.content}
                </p>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum template criado</p>
              <p className="text-xs mt-1">Clique em + para criar</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
