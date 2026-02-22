'use client'
import { FleetView } from '@/components/dashboard/FleetView'
import { LedgerFeed } from '@/components/dashboard/LedgerFeed'
import { EntityFinancials } from '@/components/dashboard/EntityFinancials'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { data, loading, refresh } = useDashboard()

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading Genii Platform...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardHeader pendingApprovals={data?.ledger?.pending_approvals ?? 0} activeAgents={data?.fleet?.active ?? 0} onRefresh={refresh} />
      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Agents', value: data?.fleet?.total_agents ?? 0, color: 'text-white' },
            { label: 'Active', value: data?.fleet?.active ?? 0, color: 'text-green-400' },
            { label: 'Idle', value: data?.fleet?.idle ?? 0, color: 'text-yellow-400' },
            { label: 'Provisioning', value: data?.fleet?.provisioning ?? 0, color: 'text-blue-400' },
            { label: 'Monthly Cost', value: `$${parseFloat(data?.fleet?.monthly_cost ?? 0).toFixed(0)}`, color: 'text-purple-400' },
          ].map((c) => (
            <div key={c.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><FleetView agents={data?.entities ?? []} /></div>
          <div><AlertsPanel approvals={data?.alerts?.pending_approvals ?? []} anomalies={data?.alerts?.anomalies ?? []} /></div>
        </div>
        <EntityFinancials entities={data?.entities ?? []} />
        <LedgerFeed />
      </main>
    </div>
  )
}