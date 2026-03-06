import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import AddTransaction from './pages/AddTransaction'
import Transactions from './pages/Transactions'
import type { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [refreshTransactions, setRefreshTransactions] = useState(0)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  // LOADING SCREEN
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

  // NOT LOGGED IN - show auth page
  if (!session) {
    return <Auth />
  }

  // LOGGED IN - show main app
  const userName = session.user.user_metadata?.full_name || session.user.email || 'User'
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-['Sora',sans-serif]">

      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            💰
          </div>
          <span className="font-bold text-[#0F1F3D] text-lg tracking-tight">WealthOS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base cursor-pointer hover:bg-blue-50">
            🔔
          </div>
          <div
            onClick={handleSignOut}
            title="Sign out"
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer"
          >
            {userInitials}
          </div>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
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

      {/* PAGE CONTENT */}
      <div className="pb-24">
        {currentPage === 'dashboard' && <DashboardPage userName={userName} onAddTransaction={() => setShowAddTransaction(true)} />}
        {currentPage === 'budgeting' && <BudgetingPage />}
        {currentPage === 'transactions' && <Transactions onAddNew={() => setShowAddTransaction(true)} refresh={refreshTransactions} />}
        {currentPage === 'goals' && <GoalsPage />}
        {currentPage === 'suggestions' && <SuggestionsPage />}
        {currentPage === 'settings' && <SettingsPage onSignOut={handleSignOut} userName={userName} userEmail={session.user.email || ''} />}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pt-2 pb-1 flex items-start justify-around z-50 shadow-lg">
        <NavItem icon="📊" label="Home" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        <NavItem icon="💰" label="Budget" active={currentPage === 'budgeting'} onClick={() => setCurrentPage('budgeting')} />
        <div
          className="flex flex-col items-center -mt-5 cursor-pointer"
          onClick={() => setShowAddTransaction(true)}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
            ＋
          </div>
        </div>
        <NavItem icon="🎯" label="Goals" active={currentPage === 'goals'} onClick={() => setCurrentPage('goals')} />
        <NavItem icon="💳" label="Transactions" active={currentPage === 'transactions'} onClick={() => setCurrentPage('transactions')} />
        <NavItem icon="⚙️" label="Settings" active={currentPage === 'settings'} onClick={() => setCurrentPage('settings')} />
      </div>

    </div>
  )
}

/* ── BOTTOM NAV ITEM ──────────────────────────────── */
function NavItem({ icon, label, active, onClick }: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl cursor-pointer ${active ? 'text-blue-600' : 'text-gray-400'}`}
      onClick={onClick}
    >
      <span className="text-xl">{icon}</span>
      <span className={`text-[10px] ${active ? 'font-bold text-blue-600' : 'font-medium'}`}>{label}</span>
    </div>
  )
}

/* ── DASHBOARD PAGE ───────────────────────────────── */
function DashboardPage({ userName, onAddTransaction }: { userName: string, onAddTransaction: () => void }) {
  const firstName = userName.split(' ')[0]
  return (
    <div>
      {/* HERO */}
      <div className="bg-gradient-to-br from-[#0F1F3D] via-[#142847] to-[#1A3A6C] px-5 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
        <p className="text-white/50 text-sm font-medium relative">Good morning,</p>
        <h1 className="text-white text-xl font-bold relative mb-5">{firstName} 👋</h1>
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm relative">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Total Net Worth</p>
          <p className="text-white text-4xl font-extrabold tracking-tight">KES 0</p>
          <p className="text-white/40 text-xs font-medium mt-2">Add your accounts to see your net worth</p>
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
            {[
              { label: 'Savings', value: '0' },
              { label: 'Invested', value: '0' },
              { label: 'Debt', value: '0' },
              { label: 'M-PESA', value: '0' },
            ].map(chip => (
              <div key={chip.label} className="bg-white/8 border border-white/10 rounded-xl px-3 py-2 flex-shrink-0">
                <p className="text-white/40 text-[10px]">{chip.label}</p>
                <p className="text-white text-sm font-bold">KES {chip.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WELCOME MESSAGE */}
      <div className="mx-4 mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-[#0F1F3D] mb-1">🎉 Welcome to WealthOS!</p>
        <p className="text-xs text-gray-500 leading-relaxed">Your account is ready. Start by adding your first transaction or setting up a savings goal.</p>
        <div className="flex gap-2 mt-3">
          <button onClick={onAddTransaction} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">+ Add Transaction</button>
          <button className="bg-white border border-blue-200 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg">+ Set a Goal</button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl mb-2">💳</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Transactions</p>
          <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight mt-1">0</p>
          <p className="text-[10px] text-gray-400 mt-1">this month</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Goals</p>
          <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight mt-1">0</p>
          <p className="text-[10px] text-gray-400 mt-1">active goals</p>
        </div>
      </div>

      {/* GET STARTED STEPS */}
      <div className="mx-4 mt-4 mb-4">
        <h2 className="text-[15px] font-bold text-[#0F1F3D] mb-3">🚀 Get Started</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            { step: '1', title: 'Add your first transaction', desc: 'Track your income and expenses', done: false },
            { step: '2', title: 'Set a savings goal', desc: 'Car, house, emergency fund...', done: false },
            { step: '3', title: 'Connect an account', desc: 'M-PESA, bank, Sacco...', done: false },
            { step: '4', title: 'Import M-PESA statement', desc: 'Upload your PDF history', done: false },
          ].map((item, i, arr) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">{item.step}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-gray-200 text-lg">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── BUDGETING PAGE ───────────────────────────────── */
function BudgetingPage() {
  const categories = [
    { icon: '🏠', name: 'Rent', spent: 0, budget: 0, color: '#1A56DB' },
    { icon: '🍽️', name: 'Dining Out', spent: 0, budget: 0, color: '#EF4444' },
    { icon: '🚕', name: 'Transport', spent: 0, budget: 0, color: '#F59E0B' },
    { icon: '🛒', name: 'Groceries', spent: 0, budget: 0, color: '#059669' },
    { icon: '🤝', name: 'Parents Support', spent: 0, budget: 0, color: '#8B5CF6' },
  ]
  return (
    <div>
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] px-5 pt-5 pb-6">
        <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">This Month</p>
        <p className="text-white text-3xl font-extrabold tracking-tight">KES 0</p>
        <p className="text-white/50 text-xs mt-1 mb-4">No transactions yet</p>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full" />
        </div>
      </div>
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#0F1F3D]">Categories</h2>
          <button className="text-xs font-bold text-blue-600">+ Add Category</button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {categories.map((cat, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < categories.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-base">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                  <div className="h-full rounded-full w-0" style={{ backgroundColor: cat.color }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-400">KES 0</p>
                <p className="text-[10px] text-gray-300">no budget set</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── GOALS PAGE ───────────────────────────────────── */
function GoalsPage() {
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-[#0F1F3D]">My Goals</h1>
          <p className="text-xs text-gray-400 mt-0.5">No active goals yet</p>
        </div>
        <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">＋ New Goal</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-sm font-bold text-gray-700 mb-1">No goals yet</p>
        <p className="text-xs text-gray-400 mb-4">Set your first savings goal — car, house, emergency fund, or anything else.</p>
        <button className="bg-blue-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl">Create First Goal</button>
      </div>
    </div>
  )
}

/* ── SUGGESTIONS PAGE ─────────────────────────────── */
function SuggestionsPage() {
  return (
    <div className="px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-lg font-extrabold text-[#0F1F3D]">Smart Suggestions</h1>
        <p className="text-xs text-gray-400 mt-0.5">Add transactions to unlock insights</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-4xl mb-3">💡</p>
        <p className="text-sm font-bold text-gray-700 mb-1">No suggestions yet</p>
        <p className="text-xs text-gray-400">Once you add transactions and goals, WealthOS will generate personalized financial insights for you.</p>
      </div>
    </div>
  )
}

/* ── SETTINGS PAGE ────────────────────────────────── */
function SettingsPage({ onSignOut, userName, userEmail }: {
  onSignOut: () => void
  userName: string
  userEmail: string
}) {
  const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const [notifications, setNotifications] = useState({
    daily: true, overspend: true, milestones: true, weekly: false
  })
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
          { key: 'daily', label: 'Daily Mission', desc: '8:00 AM reminder' },
          { key: 'overspend', label: 'Overspend Alerts', desc: 'Instant push notification' },
          { key: 'milestones', label: 'Goal Milestones', desc: 'Celebrate your progress' },
          { key: 'weekly', label: 'Weekly Summary', desc: 'Every Sunday 7 PM' },
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
          { label: 'Currency', value: 'KES · Kenyan Shilling' },
          { label: 'Payday', value: 'Day 1 of every month' },
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

      {/* SIGN OUT */}
      <button
        onClick={onSignOut}
        className="w-full bg-red-50 border border-red-100 text-red-600 font-bold py-4 rounded-2xl text-sm mb-8"
      >
        Sign Out
      </button>
    </div>
  )
}

export default App