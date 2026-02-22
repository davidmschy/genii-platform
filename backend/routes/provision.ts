import { FastifyInstance } from 'fastify'
import { db, redis } from '../server'

export async function provisionRoutes(app: FastifyInstance) {
  app.post('/provision', async (req, reply) => {
    const { name, role, entity_id, skills = [], mcps = [], monthly_cost_usd = 0 } = req.body as any
    if (!name || !role || !entity_id) return reply.status(400).send({ error: 'name, role, and entity_id are required' })
    const agentRow = await db.query(`INSERT INTO agents (name, role, entity_id, skills, mcps, status, monthly_cost_usd) VALUES ($1,$2,$3,$4,$5,'provisioning',$6) RETURNING *`, [name, role, entity_id, skills, mcps, monthly_cost_usd])
    const agent = agentRow.rows[0]
    await db.query(`INSERT INTO system_events (event_type, entity_id, agent_id, payload, severity) VALUES ('provision',$1,$2,$3,'info')`, [entity_id, agent.id, JSON.stringify({ name, role, skills, mcps })])
    await db.query(`INSERT INTO ledger_entries (entity_id, agent_id, action_type, ai_recommendation, status, notes) VALUES ($1,$2,'provision',$3,'posted',$4)`, [entity_id, agent.id, JSON.stringify({ action: 'agent_provisioned', name, role }), `Agent "${name}" provisioned with role: ${role}`])
    fetch(`${process.env.N8N_WEBHOOK_URL}/webhook/provision-agent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agent.id, name, role, entity_id, skills, mcps }) }).catch(() => {})
    await redis.publish('fleet:provision', JSON.stringify(agent))
    return reply.status(201).send({ agent, message: `Agent "${name}" provisioning started. OpenClaw instance will be live in <60s.`, n8n_triggered: true })
  })

  app.get('/', async (req, reply) => {
    const { entity_id } = req.query as any
    const where = entity_id ? 'WHERE entity_id = $1' : ''
    const params = entity_id ? [entity_id] : []
    const rows = await db.query(`SELECT * FROM agents ${where} ORDER BY created_at DESC`, params)
    return reply.send({ agents: rows.rows, total: rows.rowCount })
  })

  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as any
    const { skills, mcps, monthly_cost_usd, openclaw_instance_id } = req.body as any
    const sets: string[] = []
    const params: any[] = []
    let p = 1
    if (skills) { sets.push(`skills = $${p++}`); params.push(skills) }
    if (mcps) { sets.push(`mcps = $${p++}`); params.push(mcps) }
    if (monthly_cost_usd != null) { sets.push(`monthly_cost_usd = $${p++}`); params.push(monthly_cost_usd) }
    if (openclaw_instance_id) { sets.push(`openclaw_instance_id = $${p++}`); params.push(openclaw_instance_id) }
    if (!sets.length) return reply.status(400).send({ error: 'No fields to update' })
    params.push(id)
    const row = await db.query(`UPDATE agents SET ${sets.join(', ')} WHERE id = $${p} RETURNING *`, params)
    if (!row.rows[0]) return reply.status(404).send({ error: 'Agent not found' })
    await redis.publish('fleet:updated', JSON.stringify(row.rows[0]))
    return reply.send(row.rows[0])
  })

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as any
    const row = await db.query(`UPDATE agents SET status = 'archived' WHERE id = $1 RETURNING *`, [id])
    if (!row.rows[0]) return reply.status(404).send({ error: 'Agent not found' })
    return reply.send({ archived: true, agent: row.rows[0] })
  })
}