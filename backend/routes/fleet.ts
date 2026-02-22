import { FastifyInstance } from 'fastify'
import { db, redis } from '../server'

export async function fleetRoutes(app: FastifyInstance) {
  app.get('/', async (req, reply) => {
    const { entity_id, status } = req.query as any
    let where = 'WHERE 1=1'
    const params: any[] = []
    let p = 1
    if (entity_id) { where += ` AND a.entity_id = $${p++}`; params.push(entity_id) }
    if (status) { where += ` AND a.status = $${p++}`; params.push(status) }
    const rows = await db.query(`
      SELECT a.*, e.name AS entity_name,
        COUNT(l.id) AS total_actions,
        COUNT(l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '24h') AS actions_24h,
        SUM(l.amount) FILTER (WHERE l.action_type = 'expense' AND l.status = 'posted') AS total_spend
      FROM agents a
      LEFT JOIN entities e ON e.id = a.entity_id
      LEFT JOIN ledger_entries l ON l.agent_id = a.id
      ${where} GROUP BY a.id, e.name ORDER BY a.created_at DESC
    `, params)
    const summary = await db.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='active') AS active, COUNT(*) FILTER (WHERE status='idle') AS idle, COUNT(*) FILTER (WHERE status='suspended') AS suspended, COUNT(*) FILTER (WHERE status='provisioning') AS provisioning, SUM(monthly_cost_usd) AS total_monthly_cost FROM agents`)
    return reply.send({ agents: rows.rows, summary: summary.rows[0] })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as any
    const row = await db.query(`SELECT a.*, e.name AS entity_name FROM agents a LEFT JOIN entities e ON e.id = a.entity_id WHERE a.id = $1`, [id])
    if (!row.rows[0]) return reply.status(404).send({ error: 'Agent not found' })
    const recent = await db.query(`SELECT * FROM ledger_entries WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 10`, [id])
    return reply.send({ agent: row.rows[0], recent_actions: recent.rows })
  })

  app.patch('/:id/status', async (req, reply) => {
    const { id } = req.params as any
    const { status } = req.body as any
    const valid = ['active','idle','suspended','archived']
    if (!valid.includes(status)) return reply.status(400).send({ error: `status must be one of: ${valid.join(', ')}` })
    const row = await db.query(`UPDATE agents SET status = $1 WHERE id = $2 RETURNING *`, [status, id])
    if (!row.rows[0]) return reply.status(404).send({ error: 'Agent not found' })
    await redis.publish('fleet:status', JSON.stringify({ agent_id: id, status }))
    return reply.send(row.rows[0])
  })

  app.post('/:id/heartbeat', async (req, reply) => {
    const { id } = req.params as any
    const row = await db.query(`UPDATE agents SET last_heartbeat = NOW(), status = 'active' WHERE id = $1 RETURNING id, status, last_heartbeat`, [id])
    if (!row.rows[0]) return reply.status(404).send({ error: 'Agent not found' })
    return reply.send(row.rows[0])
  })
}