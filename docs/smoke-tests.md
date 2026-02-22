# Genii Platform — Integration Smoke Tests

## TC-01: Health Checks
```bash
curl $GENII_API/health       # {"status":"ok"}
curl $ERP/api/method/ping    # {"message":"pong"}
```

## TC-02: Provision Agent (<60s)
```bash
curl -X POST $GENII_API/api/agents/provision \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","role":"analyst","entity_id":"fbx","skills":["research"]}'
# Expect: 201, agent.status = "provisioning", n8n_triggered: true
# Within 60s: agent.status changes to "active" in GET /api/fleet/:id
```

## TC-03: Ledger Entry + GL Sync (<5s)
```bash
curl -X POST $GENII_API/api/ledger \
  -H "Content-Type: application/json" \
  -d '{"entity_id":"fbx","action_type":"expense","amount":250,"notes":"Office supplies"}'
# Expect: 201, status = "pending"
# Within 5s: ERPNext Journal Entry created, erp_doc_id populated
```

## TC-04: Approval Gate
```bash
curl -X POST $GENII_API/api/ledger \
  -d '{"entity_id":"homegenii","action_type":"expense","amount":1500}'
# Expect: status = "awaiting_approval", requires_approval = true
curl -X POST $GENII_API/api/ledger/$ID/decide \
  -d '{"decision":{"approved":true},"approved_by":"david"}'
# Expect: status = "approved"
```

## TC-05: Dashboard Load (<3s)
```bash
time curl $GENII_API/api/dashboard
# Expect: <3s, contains fleet + ledger + entities + alerts
```

## TC-06: Fleet Status Update
```bash
curl -X PATCH $GENII_API/api/fleet/$AGENT_ID/status \
  -d '{"status":"suspended"}'
# Expect: agent.status = "suspended", Redis event published
```

## TC-07: Entity P&L
```bash
curl "$GENII_API/api/dashboard/financials?period=30d"
# Expect: financials array with fbx, homegenii, genii entries
```

## TC-08: Immutability Guard
```bash
curl -X DELETE $GENII_API/api/ledger/$ENTRY_ID
# Expect: 405 or trigger error — ledger rows cannot be deleted
```

## Pass Criteria
- All 8 tests return expected status codes
- Provision completes in <60s
- Ledger->ERP sync in <5s
- Dashboard loads in <3s