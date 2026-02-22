import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import { Pool } from 'pg'
import Redis from 'ioredis'
import { ledgerRoutes } from './routes/ledger'
import { fleetRoutes } from './routes/fleet'
import { dashboardRoutes } from './routes/dashboard'
import { provisionRoutes } from './routes/provision'

export const db = new Pool({ connectionString: process.env.DATABASE_URL, max: 20, idleTimeoutMillis: 30000 })
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const app = Fastify({ logger: { level: process.env.NODE_ENV === 'production' ? 'warn' : 'info' } })

async function bootstrap() {
  await app.register(cors, { origin: true, credentials: true })
  await app.register(jwt, { secret: process.env.JWT_SECRET! })
  await app.register(websocket)
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))
  await app.register(ledgerRoutes, { prefix: '/api/ledger' })
  await app.register(fleetRoutes, { prefix: '/api/fleet' })
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' })
  await app.register(provisionRoutes, { prefix: '/api/agents' })
  app.get('/ws', { websocket: true }, (socket) => {
    socket.on('message', (msg) => {
      app.websocketServer.clients.forEach((client) => { if (client.readyState === 1) client.send(msg.toString()) })
    })
  })
  await app.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' })
}

bootstrap().catch((err) => { console.error(err); process.exit(1) })