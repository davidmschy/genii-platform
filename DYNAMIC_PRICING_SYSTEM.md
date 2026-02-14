DYNAMIC PRICING & BUDGET PLANNING SYSTEM
=========================================

CORE CONCEPT
------------
Pricing adapts to usage and outcomes:
- Base platform fee (scales with usage)
- Outcome fees (percentage of results)
- Integration costs (API usage based)
- Transparent budget planning upfront

ONBOARDING BUDGET CALCULATOR
----------------------------

class BudgetCalculator:
    """Calculates total cost of ownership and ROI"""
    
    # Current market rates for tools
    TOOL_COSTS = {
        'openai': {'min': 20, 'typical': 100, 'high': 500, 'unit': 'month'},
        'twilio': {'min': 10, 'typical': 50, 'high': 300, 'unit': 'month'},
        'google_workspace': {'min': 6, 'typical': 12, 'high': 25, 'unit': 'user/month'},
        'notion': {'min': 0, 'typical': 8, 'high': 15, 'unit': 'user/month'},
        'obsidian': {'min': 0, 'typical': 0, 'high': 8, 'unit': 'one_time'},
        'cloudflare': {'min': 0, 'typical': 20, 'high': 200, 'unit': 'month'},
        'stripe': {'min': 0, 'typical': 0, 'high': 0, 'unit': 'transaction'},
        'make_zapier': {'min': 0, 'typical': 20, 'high': 100, 'unit': 'month'},
    }
    
    def calculate_current_spend(self, user_data):
        """Calculate what user currently spends on tools"""
        current_tools = user_data.get('current_tools', [])
        team_size = user_data.get('team_size', 1)
        
        current_spend = 0
        for tool in current_tools:
            if tool in self.TOOL_COSTS:
                cost = self.TOOL_COSTS[tool]
                if cost['unit'] == 'user/month':
                    current_spend += cost['typical'] * team_size
                else:
                    current_spend += cost['typical']
        
        return current_spend
    
    def calculate_genii_cost(self, usage_profile):
        """Calculate dynamic Genii pricing based on usage"""
        
        # Usage tiers
        agent_count = usage_profile.get('agents', 10)
        contacts = usage_profile.get('contacts', 1000)
        monthly_revenue = usage_profile.get('monthly_revenue', 10000)
        api_calls = usage_profile.get('api_calls', 10000)
        
        # Base platform fee (dynamic)
        if agent_count <= 5:
            base_fee = 49
        elif agent_count <= 15:
            base_fee = 97
        elif agent_count <= 47:
            base_fee = 197
        else:
            base_fee = 297 + ((agent_count - 47) // 10) * 49
        
        # Outcome fee (5% of AI-generated revenue)
        ai_generated_revenue = monthly_revenue * 0.3  # Assume AI helps generate 30%
        outcome_fee = ai_generated_revenue * 0.05
        
        # API/Integration costs (pass-through + small markup)
        estimated_api_cost = self._estimate_api_costs(api_calls)
        
        total_monthly = base_fee + outcome_fee + estimated_api_cost
        
        return {
            'base_fee': base_fee,
            'outcome_fee': outcome_fee,
            'api_costs': estimated_api_cost,
            'total': total_monthly,
            'ai_generated_revenue': ai_generated_revenue
        }
    
    def _estimate_api_costs(self, api_calls):
        """Estimate API costs based on usage"""
        # OpenAI: ~$0.002 per 1K tokens, assume 500 tokens per call
        openai_cost = (api_calls * 500 / 1000) * 0.002
        
        # Twilio: ~$0.0075 per SMS
        sms_cost = api_calls * 0.01 * 0.0075  # Assume 1% SMS rate
        
        return openai_cost + sms_cost
    
    def generate_budget_plan(self, user_data):
        """Generate complete budget plan for user"""
        
        current_spend = self.calculate_current_spend(user_data)
        current_revenue = user_data.get('monthly_revenue', 10000)
        
        # Month 1-3: Setup phase (lower usage)
        phase1_usage = {
            'agents': 10,
            'contacts': 1000,
            'monthly_revenue': current_revenue,
            'api_calls': 5000
        }
        phase1_cost = self.calculate_genii_cost(phase1_usage)
        
        # Month 4-6: Growth phase
        phase2_usage = {
            'agents': 25,
            'contacts': 5000,
            'monthly_revenue': current_revenue * 1.3,  # 30% growth
            'api_calls': 15000
        }
        phase2_cost = self.calculate_genii_cost(phase2_usage)
        
        # Month 7-12: Scale phase
        phase3_usage = {
            'agents': 47,
            'contacts': 20000,
            'monthly_revenue': current_revenue * 1.8,  # 80% growth
            'api_calls': 40000
        }
        phase3_cost = self.calculate_genii_cost(phase3_usage)
        
        return {
            'current_state': {
                'monthly_spend': current_spend,
                'monthly_revenue': current_revenue,
                'profit_margin': current_revenue - current_spend
            },
            'phase_1_setup': {
                'month': '1-3',
                'total_cost': phase1_cost['total'],
                'breakdown': phase1_cost,
                'projected_revenue': current_revenue * 1.1,
                'roi': ((current_revenue * 1.1) - phase1_cost['total']) / phase1_cost['total'] * 100
            },
            'phase_2_growth': {
                'month': '4-6',
                'total_cost': phase2_cost['total'],
                'breakdown': phase2_cost,
                'projected_revenue': phase2_usage['monthly_revenue'],
                'roi': ((phase2_usage['monthly_revenue']) - phase2_cost['total']) / phase2_cost['total'] * 100
            },
            'phase_3_scale': {
                'month': '7-12',
                'total_cost': phase3_cost['total'],
                'breakdown': phase3_cost,
                'projected_revenue': phase3_usage['monthly_revenue'],
                'roi': ((phase3_usage['monthly_revenue']) - phase3_cost['total']) / phase3_cost['total'] * 100
            },
            'savings_vs_hiring': self._calculate_hiring_savings(user_data)
        }
    
    def _calculate_hiring_savings(self, user_data):
        """Calculate savings vs hiring human team"""
        team_size_needed = user_data.get('team_size', 1)
        
        # Cost of human team
        human_costs = {
            'executive_assistant': 4500,
            'marketing_manager': 6000,
            'sales_rep': 5000,
            'bookkeeper': 3500,
            'developer': 8000,
            'customer_support': 3500
        }
        
        # Match to AI agents
        ai_equivalent_cost = sum([
            human_costs['executive_assistant'],
            human_costs['marketing_manager'],
            human_costs['sales_rep'],
            human_costs['bookkeeper']
        ])
        
        genii_cost = 297 + 1000  # Base + estimated outcome
        
        return {
            'human_team_cost': ai_equivalent_cost,
            'genii_cost': genii_cost,
            'monthly_savings': ai_equivalent_cost - genii_cost,
            'annual_savings': (ai_equivalent_cost - genii_cost) * 12
        }

DYNAMIC PRICING TIERS
---------------------

Usage-Based Pricing:

AGENTS:
- 1-5 agents: $49/month base
- 6-15 agents: $97/month base
- 16-47 agents: $197/month base
- 48-100 agents: $297/month base + $49 per 10 additional

CONTACTS (CRM):
- 0-1,000: Included
- 1,001-5,000: +$29/month
- 5,001-20,000: +$79/month
- 20,001-100,000: +$149/month
- 100,000+: Custom

API USAGE:
- 0-10K calls: Included
- 10K-50K calls: +$0.001 per call
- 50K-200K calls: +$0.0008 per call
- 200K+ calls: Custom

OUTCOME FEES:
- 0-5K revenue: 5%
- 5K-25K revenue: 4%
- 25K-100K revenue: 3%
- 100K+ revenue: 2%

EXAMPLE DYNAMIC PRICING
-----------------------

Customer A (Small):
- 5 agents, 500 contacts, $5K revenue
- Base: $49
- Outcome (5% of $5K): $250
- API: $10
- Total: $309/month

Customer B (Medium):
- 25 agents, 8K contacts, $50K revenue
- Base: $197
- Contacts (+$29): $29
- Outcome (4% of $50K): $2,000
- API: $150
- Total: $2,376/month

Customer C (Large):
- 60 agents, 50K contacts, $200K revenue
- Base: $297 + $65 = $362
- Contacts (+$79): $79
- Outcome (3% of $200K): $6,000
- API: $500
- Total: $6,941/month

ONBOARDING BUDGET FLOW
----------------------

Step 1: Current State Assessment
"What's your current monthly revenue?"
"What tools do you currently pay for?"
"How many people on your team?"
"What's your biggest bottleneck?"

Step 2: Tool Audit
System scans current spend:
- "You're paying $X for these tools"
- "We can consolidate/replace these"
- "Estimated savings: $Y/month"

Step 3: Growth Projection
"Based on your industry and size:"
- Month 1-3: Setup, minimal growth
- Month 4-6: 20-30% revenue increase
- Month 7-12: 50-80% revenue increase

Step 4: Budget Plan
Shows:
- Current monthly spend: $____
- Genii cost (Month 1): $____
- Genii cost (Month 6): $____
- Genii cost (Month 12): $____
- Projected ROI: ____%

Step 5: Start Recommendation
"Based on your budget, we recommend starting with [PLAN]"
"You can upgrade anytime as you grow"

TRANSPARENCY FEATURES
---------------------

Real-Time Cost Dashboard:
- Current month spend
- Projected end-of-month
- Usage breakdown by agent
- API costs by service
- Outcome fees by revenue source

Budget Alerts:
- "You're at 80% of projected spend"
- "Outcome fees trending higher than expected"
- Recommendation: Upgrade plan or adjust usage

Annual Planning:
- "Based on your growth, your Year 2 budget will be: $____"
- "Consider annual billing to save $____"
