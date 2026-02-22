# ERPNext 3-Company Setup Guide
**Genii AI Platform — v15**

## Step 1: Create Companies

Run in ERPNext > Setup > Company > New:

### FBX Homes LLC
- Company Name: FBX Homes LLC
- Abbreviation: FBX
- Default Currency: USD
- Country: United States
- Chart of Accounts: Standard with US Taxes

### HomeGenii Inc
- Company Name: HomeGenii Inc
- Abbreviation: HGI
- Default Currency: USD
- Country: United States
- Chart of Accounts: Standard with US Taxes

### Genii AI Corporation
- Company Name: Genii AI Corporation
- Abbreviation: GAII
- Default Currency: USD
- Country: United States
- Chart of Accounts: Standard with US Taxes

## Step 2: Webhook Config

In ERPNext > Settings > Webhooks, create:
- URL: https://api.genii.ai/api/erp/webhook
- Events: Journal Entry (submit), Payment Entry (submit)
- Secret: match ERPNEXT_WEBHOOK_SECRET in .env

## Step 3: API Keys

ERPNext > Settings > API Access > Generate Keys for the genii-bot user.
Copy API Key + Secret to .env as ERPNEXT_API_KEY and ERPNEXT_API_SECRET.