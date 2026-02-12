import { useState } from 'react';
import { Activity, RotateCcw, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppDiagnosticProps {
  instanceName: string;
  onInstanceReset?: () => void;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export const WhatsAppDiagnostic = ({ instanceName, onInstanceReset }: WhatsAppDiagnosticProps) => {
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setTestStatus('loading');
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'getInstanceStatus', instanceName },
      });

      if (error) throw error;

      if (data?.error === 'INSTANCE_NOT_FOUND') {
        setTestStatus('error');
        setTestResult('Instância não encontrada. Tente resetar.');
        return;
      }

      const state = data?.instance?.state || data?.state || 'desconhecido';
      if (state === 'open') {
        setTestStatus('success');
        setTestResult(`Conectado (${state})`);
      } else {
        setTestStatus('error');
        setTestResult(`Estado: ${state}`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestResult(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const handleResetInstance = async () => {
    setResetting(true);
    try {
      // 1. Delete existing instance
      await supabase.functions.invoke('evolution-api', {
        body: { action: 'deleteInstance', instanceName },
      });

      // 2. Recreate instance
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'createInstance', instanceName },
      });

      if (error) throw error;

      toast({
        title: 'Instância resetada',
        description: 'A instância foi recriada. Gere um novo QR Code para conectar.',
      });

      onInstanceReset?.();
    } catch (err) {
      toast({
        title: 'Erro ao resetar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  const statusIcon = {
    idle: null,
    loading: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  }[testStatus];

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Diagnóstico
        </CardTitle>
        <CardDescription className="text-xs">
          Teste a conexão ou resete a instância se houver problemas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Test result */}
        {testResult && (
          <div className="flex items-center gap-2 text-sm rounded-md bg-muted px-3 py-2">
            {statusIcon}
            <span>{testResult}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testStatus === 'loading' || resetting}
            className="flex-1"
          >
            {testStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-1" />
            )}
            Testar Conexão
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleResetInstance}
            disabled={resetting || testStatus === 'loading'}
            className="flex-1"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-1" />
            )}
            Resetar Instância
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
