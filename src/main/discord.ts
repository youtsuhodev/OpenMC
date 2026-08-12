import { app } from 'electron';
import net from 'net';
import path from 'path';
import os from 'os';
import log from 'electron-log';
import { getSettings } from './settings';
import { DISCORD_CLIENT_ID } from '../shared/constants';

const OPC = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4,
} as const;

interface Activity {
  state?: string;
  details?: string;
  timestamps?: { start?: number; end?: number };
  assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string };
  buttons?: { label: string; url: string }[];
}

let socket: net.Socket | null = null;
let ready = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let heartbeat: NodeJS.Timeout | null = null;
let lastActivity: Activity | null = null;
let nextNonce = 1;
let clientId = '';

export function initDiscordRpc(): void {
  clientId = DISCORD_CLIENT_ID.trim();
  if (!/^\d{17,20}$/.test(clientId)) {
    log.info('Discord RPC désactivé : DISCORD_CLIENT_ID non configuré.');
    return;
  }
  void connect();
}

async function connect(): Promise<void> {
  if (socket) return;
  const pipe = await findPipe();
  if (!pipe) {
    scheduleReconnect();
    return;
  }

  const sock = net.connect(pipe);
  socket = sock;
  sock.setTimeout(10_000);

  sock.on('connect', () => {
    send(OPC.HANDSHAKE, { v: 1, client_id: clientId });
  });

  sock.on('data', (chunk) => {
    try {
      handleData(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    } catch (e) {
      log.error('Discord IPC erreur', e);
    }
  });

  sock.on('close', () => {
    cleanup();
    scheduleReconnect();
  });

  sock.on('error', (err) => {
    log.debug('Discord IPC erreur de connexion', err.message);
    cleanup();
    scheduleReconnect();
  });

  sock.on('timeout', () => sock.destroy());
}

function handleData(chunk: Buffer): void {
  if (chunk.length < 8) return;
  const op = chunk.readUInt32LE(0);
  const len = chunk.readUInt32LE(4);
  const payload = chunk.subarray(8, 8 + len).toString('utf-8');

  if (op === OPC.FRAME) {
    let json: { evt?: string; cmd?: string; data?: { user?: unknown } };
    try {
      json = JSON.parse(payload);
    } catch {
      return;
    }
    if (json.evt === 'READY') {
      ready = true;
      log.info('Connecté à Discord');
      startHeartbeat();
      if (lastActivity) setActivity(lastActivity);
    } else if (json.evt === 'ERROR') {
      log.warn('Discord a rejeté une requête:', payload);
    }
  } else if (op === OPC.PING) {
    send(OPC.PONG, {});
  }
}

function startHeartbeat(): void {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = setInterval(() => {
    send(OPC.FRAME, { cmd: 'PING' });
  }, 30_000);
}

function cleanup(): void {
  ready = false;
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  socket = null;
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (getSettings().discordRpc) connect();
  }, 15_000);
}

async function findPipe(): Promise<string | null> {
  const candidates: string[] = [];
  const suffix = 'discord-ipc';
  if (process.platform === 'win32') {
    for (let i = 0; i < 10; i++) candidates.push(`\\\\?\\pipe\\${suffix}-${i}`);
  } else {
    const base = process.env.XDG_RUNTIME_DIR ?? path.join(os.tmpdir(), 'discord-rpc');
    for (let i = 0; i < 10; i++) candidates.push(path.join(base, `${suffix}-${i}`));
  }
  for (const pipe of candidates) {
    const ok = await new Promise<boolean>((resolve) => {
      let settled = false;
      const s = net.connect(pipe);
      const done = (v: boolean): void => {
        if (settled) return;
        settled = true;
        s.destroy();
        resolve(v);
      };
      s.once('connect', () => done(true));
      s.once('error', () => done(false));
      setTimeout(() => done(false), 900);
    });
    if (ok) return pipe;
  }
  return null;
}

function send(op: number, payload: unknown): void {
  if (!socket || !socket.writable) return;
  const json = Buffer.from(JSON.stringify(payload), 'utf-8');
  const header = Buffer.alloc(8);
  header.writeUInt32LE(op, 0);
  header.writeUInt32LE(json.length, 4);
  socket.write(Buffer.concat([header, json]));
}

export function setActivity(activity: Activity): void {
  lastActivity = activity;
  if (!ready) return;
  const nonce = String(nextNonce++);
  send(OPC.FRAME, {
    cmd: 'SET_ACTIVITY',
    args: { pid: process.pid, activity },
    nonce,
  });
}

export function clearActivity(): void {
  lastActivity = null;
  if (ready) {
    send(OPC.FRAME, {
      cmd: 'SET_ACTIVITY',
      args: { pid: process.pid, activity: null },
      nonce: String(nextNonce++),
    });
  }
}

export function updatePresence(payload: { state: string; details: string; start: number }): void {
  if (!getSettings().discordRpc) return;
  setActivity({
    state: payload.state,
    details: payload.details,
    timestamps: { start: payload.start },
    assets: { large_image: 'mc', large_text: 'OpenMC' },
  });
}

export function shutdownDiscordRpc(): void {
  if (heartbeat) clearInterval(heartbeat);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  try {
    socket?.destroy();
  } catch {
    /* ignore */
  }
  socket = null;
}

app.on('will-quit', () => shutdownDiscordRpc());
