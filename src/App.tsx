// WealthOS v2.0 - Phase 7 M-PESA Import
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import AddTransaction from './pages/AddTransaction'
import Transactions from './pages/Transactions'
import Goals from './pages/Goals'
import Budgeting from './pages/Budgeting'
import MpesaImport from './pages/MpesaImport'
import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showMpesaImport, setShowMpesaImport] = useState(false)
  const [refreshTransactions, setRefreshTransactions] = useState(0)
  const [refreshGoals] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-3xl mb-4 shadow-xl shadow-blue-200">
          💰
        </div>
        <p className="text-[#0F1F3D] font-bold text-lg">WealthOS</p>
        <p className="text-gray-400 text-sm mt-1">Loading your finances...</p>
      </div>
    )
  }

  if (!session) return <Auth />

  const userName = session.user.user_metadata?.full_name || session.user.email || 'User'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const userEmail = session.user.email || ''
  const firstName = userName.split(' ')[0]

  const navItems = [
    { icon: '📊', label: 'Home',         page: 'dashboard' },
    { icon: '💰', label: 'Budget',       page: 'budgeting' },
    { icon: '🎯', label: 'Goals',        page: 'goals' },
    { icon: '💳', label: 'Transactions', page: 'transactions' },
    { icon: '⚙️', label: 'Settings',     page: 'settings' },
  ]

  const pageContent = (
    <>
      {currentPage === 'dashboard'    && (
        <DashboardPage
          userName={userName}
          onAddTransaction={() => setShowAddTransaction(true)}
          onImportMpesa={() => setShowMpesaImport(true)}
        />
      )}
      {currentPage === 'budgeting'    && <Budgeting />}
      {currentPage === 'transactions' && <Transactions onAddNew={() => setShowAddTransaction(true)} refresh={refreshTransactions} />}
      {currentPage === 'goals'        && <Goals refresh={refreshGoals} onGoalUpdate={() => setRefreshTransactions(r => r + 1)} />}
      {currentPage === 'suggestions'  && <SuggestionsPage />}
      {currentPage === 'settings'     && <SettingsPage onSignOut={handleSignOut} userName={userName} userEmail={userEmail} />}
    </>
  )

  return (
    <div className="font-['Sora',sans-serif]">

      {/* ═══════════════════════════════════════
          DESKTOP LAYOUT  (md and above)
      ═══════════════════════════════════════ */}
      <div className="hidden md:flex h-screen bg-[#F0F4FF] overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-[240px] flex-shrink-0 flex flex-col h-full"
          style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0d2240 55%, #0a3350 100%)' }}>

          {/* Logo */}
          <div className="px-6 pt-7 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-lg shadow-lg">
                💰
              </div>
              <div>
                <p className="text-white font-extrabold text-[17px] tracking-tight leading-none">WealthOS</p>
                <p className="text-white/30 text-[10px] font-medium mt-0.5 tracking-widest uppercase">Kenya</p>
              </div>
            </div>
          </div>

          <div className="mx-6 mb-5 h-px bg-white/8" />

          {/* User Profile */}
          <div className="mx-4 mb-6">
            <div className="rounded-2xl px-3 py-3 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate">{firstName}</p>
                <p className="text-white/35 text-[11px] truncate mt-0.5">{userEmail}</p>
              </div>
            </div>
          </div>

          <p className="px-6 text-[9px] font-bold text-white/20 uppercase tracking-[0.18em] mb-1.5">Menu</p>

          {/* Nav Items */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map(item => {
              const active = currentPage === item.page
              return (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative"
                  style={active ? {
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.85) 0%, rgba(20,184,166,0.75) 100%)',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
                  } : {}}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-white/60" />}
                  <span className="text-lg leading-none w-6 text-center">{item.icon}</span>
                  <span className={`text-sm font-semibold flex-1 ${active ? 'text-white' : 'text-white/50 group-hover:text-white/80'} transition-colors`}>
                    {item.label}
                  </span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />}
                </button>
              )
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="px-4 py-5 space-y-2">
            <div className="h-px bg-white/8 mb-4" />
            <button
              onClick={() => setShowAddTransaction(true)}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #14b8a6)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}
            >
              ＋ Add Transaction
            </button>
            <button
              onClick={() => setShowMpesaImport(true)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 border border-white/8 hover:border-white/20 transition-all flex items-center justify-center gap-1.5"
            >
              📄 Import M-PESA
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-2 text-[11px] font-medium text-white/20 hover:text-white/40 transition-colors"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white/60 backdrop-blur-xl border-b border-black/5 px-8 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 shadow-sm shadow-blue-300" />
              <p className="text-[#0F1F3D] font-extrabold text-[15px]">
                {navItems.find(n => n.page === currentPage)?.label || 'Dashboard'}
              </p>
              <span className="text-gray-300 text-sm">/</span>
              <p className="text-gray-400 text-[12px]">
                {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="w-9 h-9 rounded-xl bg-gray-100/80 hover:bg-blue-50 flex items-center justify-center text-base transition-colors">🔔</button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-xs font-extrabold cursor-pointer shadow-md" title={`Signed in as ${userName}`}>
                {userInitials}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">{pageContent}</div>
        </main>
      </div>

      {/* ═══════════════════════════════════════
          MOBILE LAYOUT  (unchanged)
      ═══════════════════════════════════════ */}
      <div className="md:hidden min-h-screen bg-[#F0F4FF]">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">💰</div>
            <span className="font-bold text-[#0F1F3D] text-lg tracking-tight">WealthOS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base cursor-pointer hover:bg-blue-50">🔔</div>
            <div onClick={handleSignOut} title="Sign out" className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {userInitials}
            </div>
          </div>
        </div>

        <div className="pb-28">{pageContent}</div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pt-2 pb-1 flex items-start justify-around z-50 shadow-lg">
          <NavItem icon="📊" label="Home"         active={currentPage === 'dashboard'}    onClick={() => setCurrentPage('dashboard')} />
          <NavItem icon="💰" label="Budget"       active={currentPage === 'budgeting'}    onClick={() => setCurrentPage('budgeting')} />
          <div className="flex flex-col items-center -mt-5 cursor-pointer" onClick={() => setShowAddTransaction(true)}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">＋</div>
          </div>
          <NavItem icon="🎯" label="Goals"        active={currentPage === 'goals'}        onClick={() => setCurrentPage('goals')} />
          <NavItem icon="💳" label="Transactions" active={currentPage === 'transactions'} onClick={() => setCurrentPage('transactions')} />
          <NavItem icon="⚙️" label="Settings"     active={currentPage === 'settings'}     onClick={() => setCurrentPage('settings')} />
        </div>
      </div>

      {/* ── SHARED MODALS ── */}
      {showAddTransaction && (
        <AddTransaction
          onClose={() => setShowAddTransaction(false)}
          onSuccess={() => {
            setShowAddTransaction(false)
            setRefreshTransactions(r => r + 1)
            setCurrentPage('transactions')
          }}
        />
      )}

      {showMpesaImport && (
        <MpesaImport
          onClose={() => setShowMpesaImport(false)}
          onSuccess={() => {
            setShowMpesaImport(false)
            setRefreshTransactions(r => r + 1)
            setCurrentPage('transactions')
          }}
        />
      )}

    </div>
  )
}

/* ── BOTTOM NAV ITEM ──────────────────────────────── */
function NavItem({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void
}) {
  return (
    <div className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl cursor-pointer ${active ? 'text-blue-600' : 'text-gray-400'}`} onClick={onClick}>
      <span className="text-xl">{icon}</span>
      <span className={`text-[10px] ${active ? 'font-bold text-blue-600' : 'font-medium'}`}>{label}</span>
    </div>
  )
}

/* ── DASHBOARD PAGE ───────────────────────────────── */
function DashboardPage({ userName, onAddTransaction, onImportMpesa }: {
  userName: string
  onAddTransaction: () => void
  onImportMpesa: () => void
}) {
  const firstName = userName.split(' ')[0]
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0, goalCount: 0, totalSaved: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [userName])

  async function loadStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { data: transactions } = await supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('transaction_date', startOfMonth.toISOString().split('T')[0])
    const { data: goals } = await supabase.from('goals').select('current_amount').eq('user_id', user.id).eq('status', 'active')
    if (transactions) {
      const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      setStats({ totalIncome: income, totalExpense: expense, balance: income - expense, transactionCount: transactions.length, goalCount: goals?.length || 0, totalSaved: goals?.reduce((s, g) => s + g.current_amount, 0) || 0 })
    }
    setLoading(false)
  }

  function fmt(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString('en-KE')
  }

  return (
    <div>
      {/* HERO */}
      <div className="bg-gradient-to-br from-[#0F1F3D] via-[#142847] to-[#1A3A6C] px-5 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
        <p className="text-white/50 text-sm font-medium relative">Good morning,</p>
        <h1 className="text-white text-xl font-bold relative mb-5">{firstName} 👋</h1>
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm relative">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">This Month's Balance</p>
          <p className="text-white text-4xl font-extrabold tracking-tight">{loading ? '...' : `KES ${fmt(stats.balance)}`}</p>
          <p className={`text-xs font-semibold mt-2 ${stats.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {!loading && (stats.balance >= 0 ? '▲ Positive balance this month' : '▼ Spending more than earning')}
          </p>
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
            {[
              { label: 'Income',   value: `KES ${fmt(stats.totalIncome)}` },
              { label: 'Expenses', value: `KES ${fmt(stats.totalExpense)}` },
              { label: 'Saved',    value: `KES ${fmt(stats.totalSaved)}` },
              { label: 'Goals',    value: `${stats.goalCount} active` },
            ].map(chip => (
              <div key={chip.label} className="bg-white/8 border border-white/10 rounded-xl px-3 py-2 flex-shrink-0">
                <p className="text-white/40 text-[10px]">{chip.label}</p>
                <p className="text-white text-sm font-bold">{loading ? '...' : chip.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="mx-4 mt-4">
        <div className="flex gap-2">
          <button
            onClick={onAddTransaction}
            className="flex-1 bg-blue-600 text-white text-xs font-bold px-3 py-3 rounded-xl flex items-center justify-center gap-1.5"
          >
            <span>💸</span> Add Transaction
          </button>
          <button
            onClick={onImportMpesa}
            className="flex-1 bg-white border border-gray-100 shadow-sm text-[#0F1F3D] text-xs font-bold px-3 py-3 rounded-xl flex items-center justify-center gap-1.5"
          >
            <span>📄</span> Import M-PESA
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl mb-2">💸</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Monthly Spend</p>
          <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight mt-1">{loading ? '...' : `KES ${fmt(stats.totalExpense)}`}</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.transactionCount} transactions</p>
          <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.totalExpense === 0 ? 'bg-gray-100 text-gray-500' : stats.balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {stats.totalExpense === 0 ? 'No data yet' : stats.balance >= 0 ? 'On Track' : 'Over Budget'}
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Goals</p>
          <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight mt-1">{loading ? '...' : `${stats.goalCount} Active`}</p>
          <p className="text-[10px] text-gray-400 mt-1">{!loading && `KES ${fmt(stats.totalSaved)} saved`}</p>
          <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {stats.goalCount === 0 ? 'Set a goal' : 'In progress'}
          </span>
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="mx-4 mt-4 mb-4">
        <h2 className="text-[15px] font-bold text-[#0F1F3D] mb-3">🚀 Quick Actions</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            { step: '💳', title: 'View Transactions', desc: 'See all your income and expenses' },
            { step: '🎯', title: 'Manage Goals',      desc: 'Track your savings goals' },
            { step: '💰', title: 'View Budget',       desc: 'Check spending by category' },
          ].map((item, i, arr) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''} cursor-pointer active:bg-gray-50`}>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-lg">{item.step}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SUGGESTIONS PAGE ─────────────────────────────── */
function SuggestionsPage() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-lg font-extrabold text-[#0F1F3D] mb-1">Smart Suggestions</h1>
      <p className="text-xs text-gray-400 mb-4">Add transactions to unlock insights</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-4xl mb-3">💡</p>
        <p className="text-sm font-bold text-gray-700 mb-1">No suggestions yet</p>
        <p className="text-xs text-gray-400">Once you add transactions and goals, WealthOS will generate personalized financial insights.</p>
      </div>
    </div>
  )
}

/* ── SETTINGS PAGE ────────────────────────────────── */
function SettingsPage({ onSignOut, userName, userEmail }: { onSignOut: () => void; userName: string; userEmail: string }) {
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const [notifications, setNotifications] = useState({ daily: true, overspend: true, milestones: true, weekly: false })
  return (
    <div className="px-4 pt-4">
      <h1 className="text-lg font-extrabold text-[#0F1F3D] mb-4">Settings</h1>
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] rounded-2xl p-4 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-lg font-extrabold">{initials}</div>
        <div className="flex-1">
          <p className="text-white font-bold">{userName}</p>
          <p className="text-white/50 text-xs mt-0.5">{userEmail}</p>
        </div>
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notifications</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {[
          { key: 'daily',      label: 'Daily Mission',    desc: '8:00 AM reminder' },
          { key: 'overspend',  label: 'Overspend Alerts', desc: 'Instant push notification' },
          { key: 'milestones', label: 'Goal Milestones',  desc: 'Celebrate your progress' },
          { key: 'weekly',     label: 'Weekly Summary',   desc: 'Every Sunday 7 PM' },
        ].map((item, i, arr) => (
          <div key={item.key} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <div
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifications] }))}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preferences</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {[
          { label: 'Currency',    value: 'KES · Kenyan Shilling' },
          { label: 'Payday',      value: 'Day 1 of every month' },
          { label: 'Export Data', value: 'CSV or PDF' },
        ].map((item, i, arr) => (
          <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.value}</p>
            </div>
            <span className="text-xs font-semibold text-blue-600">Change ›</span>
          </div>
        ))}
      </div>
      <ContactRules />
      <button onClick={onSignOut} className="w-full bg-red-50 border border-red-100 text-red-600 font-bold py-4 rounded-2xl text-sm mb-8">
        Sign Out
      </button>
    </div>
  )
}

/* ── CONTACT RULES ────────────────────────────────── */
function ContactRules() {
  const [rules, setRules] = useState<any[]>([])
  const [uncategorized, setUncategorized] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: rulesData }, { count }, { data: catsData }] = await Promise.all([
      supabase.from('contact_rules').select('*, categories(name, icon)').eq('user_id', user.id).order('times_seen', { ascending: false }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('needs_review', true),
      supabase.from('categories').select('id, name, icon').order('name'),
    ])

    setRules(rulesData || [])
    setUncategorized(count || 0)
    setCategories(catsData || [])
    setLoading(false)
  }

  async function updateRule(id: string, categoryId: string) {
    await supabase.from('contact_rules').update({ category_id: categoryId }).eq('id', id)
    setEditingId(null)
    loadData()
  }

  async function deleteRule(id: string) {
    await supabase.from('contact_rules').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Rules</p>

      {uncategorized > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">{uncategorized} transactions need review</p>
            <p className="text-xs text-amber-600 mt-0.5">Add contact rules below to auto-categorize future imports</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-bold text-gray-700 mb-1">No contact rules yet</p>
          <p className="text-xs text-gray-400">Rules are created automatically when you categorize unknown M-PESA transactions</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {rules.map((rule, i) => (
            <div key={rule.id} className={`px-4 py-3 ${i < rules.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F1F3D] truncate">{rule.contact_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Seen {rule.times_seen}x</p>
                </div>
                {editingId === rule.id ? (
                  <select
                    autoFocus
                    defaultValue={rule.category_id}
                    onChange={e => updateRule(rule.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    className="text-xs border border-blue-300 rounded-lg px-2 py-1 bg-white outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(rule.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {rule.categories?.icon} {rule.categories?.name || 'Other'} ✏️
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default App