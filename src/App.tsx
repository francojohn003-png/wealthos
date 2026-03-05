import { useState } from 'react'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-['Sora',sans-serif]">
      
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="font-bold text-[#0F1F3D] text-lg tracking-tight">WealthOS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base cursor-pointer hover:bg-blue-50">
            🔔
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            JK
          </div>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="pb-24">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'budgeting' && <BudgetingPage />}
        {currentPage === 'goals' && <GoalsPage />}
        {currentPage === 'suggestions' && <SuggestionsPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pt-2 pb-1 flex items-start justify-around z-50 shadow-lg">
        <NavItem icon="📊" label="Home" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        <NavItem icon="💰" label="Budget" active={currentPage === 'budgeting'} onClick={() => setCurrentPage('budgeting')} />
        <div
          className="flex flex-col items-center -mt-5 cursor-pointer"
          onClick={() => alert('Quick Add coming soon!')}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">
            ＋
          </div>
        </div>
        <NavItem icon="🎯" label="Goals" active={currentPage === 'goals'} onClick={() => setCurrentPage('goals')} />
        <NavItem icon="💡" label="More" active={currentPage === 'suggestions'} onClick={() => setCurrentPage('suggestions')} />
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
      <span className={`text-[10px] font-600 ${active ? 'font-bold text-blue-600' : 'font-medium'}`}>{label}</span>
    </div>
  )
}

/* ── DASHBOARD PAGE ───────────────────────────────── */
function DashboardPage() {
  return (
    <div>
      {/* HERO */}
      <div className="bg-gradient-to-br from-[#0F1F3D] via-[#142847] to-[#1A3A6C] px-5 pt-5 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
        <p className="text-white/50 text-sm font-medium relative">Good morning,</p>
        <h1 className="text-white text-xl font-bold relative mb-5">John Kamau 👋</h1>
        <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-sm relative">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Total Net Worth</p>
          <p className="text-white text-4xl font-extrabold tracking-tight">KES 1,247,830</p>
          <p className="text-emerald-400 text-xs font-semibold mt-2">▲ +12.4% · +KES 137,420 this month</p>
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
            {[
              { label: 'Savings', value: '350K' },
              { label: 'Invested', value: '750K' },
              { label: 'Debt', value: '-82K' },
              { label: 'M-PESA', value: '38K' },
            ].map(chip => (
              <div key={chip.label} className="bg-white/8 border border-white/10 rounded-xl px-3 py-2 flex-shrink-0">
                <p className="text-white/40 text-[10px]">{chip.label}</p>
                <p className="text-white text-sm font-bold">{chip.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALERT */}
      <div className="mx-4 mt-4 bg-red-50 border-l-4 border-red-400 rounded-xl p-4 flex gap-3">
        <span className="text-lg flex-shrink-0">🚨</span>
        <div>
          <p className="text-sm font-bold text-gray-800">Dining Out budget exceeded by KES 3,200</p>
          <p className="text-xs text-gray-500 mt-1">Spent KES 8,200 of KES 5,000. 18 days remaining.</p>
          <div className="flex gap-2 mt-2">
            <button className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Take Action</button>
            <button className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg">Dismiss</button>
          </div>
        </div>
      </div>

      {/* TODAY'S MISSION */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#0F1F3D]">🎯 Today's Mission</h2>
          <span className="text-xs font-semibold text-blue-600">1 of 2 done</span>
        </div>
        <div className="bg-[#F0F4FF] border border-blue-100 rounded-xl p-3 flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">Save KES 508 → Car Fund</p>
            <p className="text-xs text-gray-400 mt-0.5">36% complete · Dec 2026</p>
          </div>
          <button className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Done ✓</button>
        </div>
        <div className="bg-[#F0F4FF] border border-blue-100 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Send KES 2,000 → Mum</p>
            <p className="text-xs text-gray-400 mt-0.5">Monthly family obligation</p>
          </div>
          <button className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg">Pending</button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl mb-2">💸</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Monthly Spend</p>
          <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight mt-1">52.4K</p>
          <p className="text-[10px] text-gray-400 mt-1">of KES 65K budget</p>
          <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">On Track</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Goals</p>
          <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight mt-1">3 Active</p>
          <p className="text-[10px] text-gray-400 mt-1">45% avg progress</p>
          <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">2 on track</span>
        </div>
      </div>

      {/* UPCOMING */}
      <div className="mx-4 mt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#0F1F3D]">📅 This Week</h2>
          <span className="text-xs font-semibold text-blue-600 cursor-pointer">See All →</span>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {[
            { day: '8', month: 'Mar', name: "Mum's Birthday Gift", type: 'Family', amount: '3,000', urgent: false },
            { day: '15', month: 'Mar', name: 'School Fees Term 2', type: 'Education · Urgent', amount: '35,000', urgent: true },
          ].map((event, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 1 ? 'border-b border-gray-50' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border ${event.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`text-sm font-black leading-none ${event.urgent ? 'text-red-600' : 'text-[#0F1F3D]'}`}>{event.day}</span>
                <span className={`text-[8px] font-bold uppercase ${event.urgent ? 'text-red-400' : 'text-gray-400'}`}>{event.month}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{event.name}</p>
                <p className="text-xs text-gray-400">{event.type}</p>
              </div>
              <p className={`text-sm font-bold ${event.urgent ? 'text-red-600' : 'text-[#0F1F3D]'}`}>KES {event.amount}</p>
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
    { icon: '🏠', name: 'Rent', spent: 18000, budget: 18000, color: '#1A56DB' },
    { icon: '🍽️', name: 'Dining Out', spent: 8200, budget: 5000, color: '#EF4444' },
    { icon: '🚕', name: 'Transport', spent: 6200, budget: 8000, color: '#F59E0B' },
    { icon: '🛒', name: 'Groceries', spent: 4100, budget: 6000, color: '#059669' },
    { icon: '🤝', name: 'Parents Support', spent: 3000, budget: 4000, color: '#8B5CF6' },
    { icon: '👫', name: 'Siblings', spent: 2000, budget: 2000, color: '#0694A2' },
  ]
  return (
    <div>
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] px-5 pt-5 pb-6">
        <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">March 2025</p>
        <p className="text-white text-3xl font-extrabold tracking-tight">KES 52,400</p>
        <p className="text-white/50 text-xs mt-1 mb-4">of KES 85,000 · KES 32,600 remaining</p>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-[62%] bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full" />
        </div>
      </div>
      <div className="mx-4 mt-4">
        <h2 className="text-[15px] font-bold text-[#0F1F3D] mb-3">By Category</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {categories.map((cat, i) => {
            const pct = Math.min((cat.spent / cat.budget) * 100, 100)
            const over = cat.spent > cat.budget
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < categories.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className="text-base">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${over ? 'text-red-600' : 'text-gray-800'}`}>{cat.spent.toLocaleString()}</p>
                  <p className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-400'}`}>/ {cat.budget.toLocaleString()} {over ? '⚠️' : ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── GOALS PAGE ───────────────────────────────────── */
function GoalsPage() {
  const goals = [
    { emoji: '🚗', name: 'Car Fund', target: 'Toyota Corolla · Dec 2026', saved: 180000, total: 500000, daily: 508, status: 'on-track', streak: 2 },
    { emoji: '🏠', name: 'House Deposit', target: '3BR Ruaka · Dec 2028', saved: 320000, total: 1500000, daily: 820, status: 'behind', streak: 0 },
    { emoji: '🏦', name: 'Emergency Fund', target: '6 months buffer · Aug 2025', saved: 85000, total: 150000, daily: 390, status: 'on-track', streak: 7 },
  ]
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-[#0F1F3D]">My Goals</h1>
          <p className="text-xs text-gray-400 mt-0.5">KES 1,718 total daily target</p>
        </div>
        <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">＋ New</button>
      </div>
      {goals.map((goal, i) => {
        const pct = Math.round((goal.saved / goal.total) * 100)
        const onTrack = goal.status === 'on-track'
        return (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">{goal.emoji}</span>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#0F1F3D]">{goal.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{goal.target}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${onTrack ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {onTrack ? '✅ On Track' : '⚠️ Behind'}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: onTrack ? 'linear-gradient(90deg,#059669,#34D399)' : 'linear-gradient(90deg,#D97706,#FBBF24)'
                }}
              />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight">KES {goal.saved.toLocaleString()}</p>
                <p className="text-xs text-gray-400">of KES {goal.total.toLocaleString()}</p>
              </div>
              <p className={`text-lg font-extrabold ${onTrack ? 'text-blue-600' : 'text-amber-500'}`}>{pct}%</p>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${onTrack ? 'bg-blue-50 border-blue-100 text-[#0F1F3D]' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
              📅 KES {goal.daily} today
              {goal.streak > 0 && <span className="text-green-600 ml-1">🔥 {goal.streak} day streak</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── SUGGESTIONS PAGE ─────────────────────────────── */
function SuggestionsPage() {
  const suggestions = [
    { icon: '🔥', priority: 'HIGH', priorityColor: 'bg-red-100 text-red-700', border: 'border-l-red-400', title: 'Pay off Branch loan — losing KES 12K to interest', desc: '18% p.a. on KES 45,000. Extra KES 5K today saves KES 12,000 over 6 months.', btnColor: 'bg-red-500', btnText: 'Pay Extra Now' },
    { icon: '💰', priority: 'MEDIUM', priorityColor: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400', title: 'Move KES 48K from KCB to Ziidi MMF', desc: 'KCB pays 0.5%. Ziidi pays 9.2%. Extra earnings: KES 3,255 per year.', btnColor: 'bg-blue-600', btnText: 'Move Funds' },
    { icon: '🎯', priority: 'MEDIUM', priorityColor: 'bg-amber-100 text-amber-700', border: 'border-l-amber-400', title: 'House Deposit is 3 months behind schedule', desc: 'Add KES 4,740/month to get back on track by December 2028.', btnColor: 'bg-blue-600', btnText: 'Update Plan' },
    { icon: '🎉', priority: 'MILESTONE', priorityColor: 'bg-blue-100 text-blue-700', border: 'border-l-blue-400', title: 'Emergency Fund 57% complete!', desc: 'On track to be fully prepared by August 2025. 7-day streak 🔥', btnColor: 'bg-green-600', btnText: 'Keep Going' },
  ]
  return (
    <div className="px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-lg font-extrabold text-[#0F1F3D]">Smart Suggestions</h1>
        <p className="text-xs text-gray-400 mt-0.5">12 insights · 3 high priority</p>
      </div>
      {suggestions.map((s, i) => (
        <div key={i} className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${s.border} shadow-sm p-4 mb-3`}>
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">{s.icon}</span>
            <div className="flex-1">
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${s.priorityColor}`}>{s.priority}</span>
              <p className="text-sm font-bold text-gray-800 mb-1 leading-snug">{s.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              <div className="flex gap-2 mt-3">
                <button className={`${s.btnColor} text-white text-xs font-bold px-3 py-1.5 rounded-lg`}>{s.btnText}</button>
                <button className="bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── SETTINGS PAGE ────────────────────────────────── */
function SettingsPage() {
  const [notifications, setNotifications] = useState({
    daily: true, overspend: true, milestones: true, weekly: false
  })
  return (
    <div className="px-4 pt-4">
      <h1 className="text-lg font-extrabold text-[#0F1F3D] mb-4">Settings</h1>
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] rounded-2xl p-4 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-lg font-extrabold">JK</div>
        <div>
          <p className="text-white font-bold">John Kamau</p>
          <p className="text-white/50 text-xs mt-0.5">john.kamau@gmail.com</p>
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
    </div>
  )
}

export default App