import express from 'express';
import http from 'http';
import crypto from 'crypto';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { TikTokLiveService } from './server/tiktokLiveService';

dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '256kb' }));

const tiktokService = new TikTokLiveService();

// WebSocket Server attached to same HTTP server at /ws
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('Erro ao enviar mensagem para cliente WebSocket:', err);
      }
    }
  }
}

wss.on('connection', (ws) => {
  clients.add(ws);

  // Send initial connection and live status immediately
  try {
    ws.send(JSON.stringify({
      type: 'connection_status',
      data: { connected: true, target: tiktokService.getTargetUsername() },
      timestamp: Date.now(),
    }));
  } catch {
    // Handled
  }

  tiktokService.checkLiveStatus().then((status) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'live_status', data: status, timestamp: Date.now() }));
      } catch {
        // Handled
      }
    }
  });

  ws.on('message', (messageRaw) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {
      // Ignore non-json frames
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

// Periodic heartbeat ping to keep connections alive through proxies and iframes
const heartbeatInterval = setInterval(() => {
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.ping();
      } catch {
        clients.delete(ws);
      }
    } else {
      clients.delete(ws);
    }
  }
}, 25000);

heartbeatInterval.unref();

// ================= API ENDPOINTS ================= //

// Health check (no sensitive data)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    targetUser: tiktokService.getTargetUsername(),
    connectedClients: clients.size,
    uptime: Math.floor(process.uptime()),
  });
});

// Current TikTok account integration info (masked, zero secrets exposed)
app.get('/api/tiktok/account', (req, res) => {
  try {
    const accountInfo = tiktokService.getAccountInfo();
    res.json(accountInfo);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao consultar conta TikTok' });
  }
});

// Get current TikTok LIVE status
app.get('/api/tiktok/status', async (req, res) => {
  try {
    const status = await tiktokService.checkLiveStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao verificar status da LIVE',
      message: error?.message || 'Erro desconhecido',
    });
  }
});

// TikTok Login Kit OAuth. Secrets stay server-side.
app.get('/api/tiktok/auth', (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !redirectUri) return res.status(503).json({ error: 'TikTok Login Kit não configurado' });
  const state = crypto.randomUUID();
  res.cookie?.('tiktok_oauth_state', state, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 600000 });
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.searchParams.set('client_key', clientKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'user.info.basic');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

app.get('/api/tiktok/callback', async (req, res) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) return res.status(400).send('Código OAuth ausente.');
    await tiktokService.exchangeCode(code);
    const status = await tiktokService.checkLiveStatus();
    broadcast('live_status', status);
    res.redirect('/?tiktok=connected');
  } catch (error: any) {
    console.error('TikTok OAuth:', error?.message || error);
    res.redirect('/?tiktok=error');
  }
});

// Real TikTok Live Webhook with strict idempotency validation
app.post('/api/tiktok/webhook', (req, res) => {
  const rawEvent = req.body;
  const result = tiktokService.validateAndProcessEvent(rawEvent);

  if (result.ignored) {
    return res.status(200).json({
      received: true,
      processed: false,
      reason: result.reason,
    });
  }

  // Broadcast verified gift event to all connected clients
  broadcast('gift_received', result.payload);
  return res.status(200).json({
    received: true,
    processed: true,
    eventId: result.payload?.eventId,
  });
});

// ================= VITE / STATIC SERVING ================= //

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Snake LIVE server running on http://0.0.0.0:${PORT}`);
    console.log(`Monitorando conta TikTok: @${tiktokService.getTargetUsername()}`);
  });
}

start();
