import React, { useState, useEffect } from 'react';
import { TikTokAccountInfo } from '../types';
import { X, ShieldCheck, Lock, Radio, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface TikTokLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const TikTokLoginModal: React.FC<TikTokLoginModalProps> = ({
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const [accountInfo, setAccountInfo] = useState<TikTokAccountInfo | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAccount = async () => {
    try {
      const res = await fetch('/api/tiktok/account');
      if (res.ok) {
        const data = await res.json();
        setAccountInfo(data);
      }
    } catch {
      // Handled silently
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccount();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/tiktok/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'rainz878',
          sessionId: sessionId.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Configuração salva no servidor com sucesso!',
        });
        setSessionId('');
        setApiKey('');
        await fetchAccount();
        onStatusUpdated();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Falha ao salvar configuração.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Erro de conexão com o servidor.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatusNow = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tiktok/status');
      if (res.ok) {
        await fetchAccount();
        onStatusUpdated();
        setMessage({
          type: 'success',
          text: 'Status da LIVE consultado em tempo real.',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Não foi possível verificar o status agora.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="tiktok-login-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="tiktok-login-modal-dialog"
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
            📱
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Conexão TikTok:</span>
              <span className="text-emerald-400 font-mono">@rainz878</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Gerenciamento seguro da conta alvo para recepção de eventos da LIVE.
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 mb-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/60">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status da Conexão</span>
            </span>
            <button
              type="button"
              onClick={handleCheckStatusNow}
              disabled={isLoading}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Verificar Agora</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Conta Alvo:</span>
              <span className="font-bold text-white font-mono">@rainz878</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Status da LIVE:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  accountInfo?.status === 'live'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : accountInfo?.isConfigured
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {accountInfo?.statusMessage || 'Consultando...'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Variável TIKTOK_TARGET:</span>
              <span className="font-mono text-zinc-300">rainz878</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Variável TIKTOK_SESSION:</span>
              <span className="font-mono text-xs text-zinc-400">
                {accountInfo?.sessionConfigured ? '[SECRET_CONFIGURED]' : '[NOT_CONFIGURED]'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Variável TIKTOK_API_KEY:</span>
              <span className="font-mono text-xs text-zinc-400">
                {accountInfo?.apiKeyConfigured ? '[SECRET_CONFIGURED]' : '[NOT_CONFIGURED]'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Disclosure (Requirement 4) */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-xs flex items-start gap-2.5 mb-5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-white font-semibold">Segurança Máxima:</strong> Todas as credenciais e sessões
            são processadas exclusivamente no backend. Nenhum token, cookie ou chave privada é exposto no navegador ou
            nos logs públicos.
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sessão do TikTok (TIKTOK_SESSION)</span>
            </label>
            <input
              type="password"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder={accountInfo?.sessionConfigured ? '•••••••••••• (configurada)' : 'Insira o Session ID'}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoComplete="off"
            />
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Armazenado com segurança no servidor para autenticar eventos de @rainz878.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>Chave de API Opcional (TIKTOK_API_KEY)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={accountInfo?.apiKeyConfigured ? '•••••••••••• (configurada)' : 'Insira a API Key (opcional)'}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isLoading || (!sessionId.trim() && !apiKey.trim())}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-950"
            >
              {isLoading ? 'Conectando...' : 'Salvar / Conectar Sessão'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-all"
            >
              Fechar
            </button>
          </div>
        </form>

        {/* Webhook Endpoint Info */}
        <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex flex-col gap-1">
          <span className="font-semibold text-zinc-400">Endpoint de Webhook em Tempo Real:</span>
          <code className="bg-zinc-900 px-2 py-1 rounded border border-zinc-800 text-emerald-400/90 font-mono text-[10px]">
            POST /api/tiktok/webhook
          </code>
          <span>Eventos são validados com idempotência rigorosa contra duplicações.</span>
        </div>
      </div>
    </div>
  );
};
