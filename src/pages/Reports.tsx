import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

type MonthData = { month: string; income: number; expenses: number; savings: number; investment: number }
type CategoryData = { name: string; value: number; color: string; icon: string }
type DayData = { day: string; amount: number; lastWeek: number }

export default function Reports() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [weeklyData, setWeeklyData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [bestMonth, setBestMonth] = useState<MonthData | null>(null)
  const [worstMonth, setWorstMonth] = useState<MonthData | null>(null)
  const [totalStats, setTotalStats] = useState({ income: 0, expenses: 0, savings: 0, investment: 0, transactions: 0 })

  useEffect(() => { loadData() }, [period])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date()
    let startDate: Date
    if (period === 'week') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    else if (period === 'quarter') startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    else startDate = new Date(now.getFullYear(), 0, 1)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .eq('user_id', user.id)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true })

    if (!transactions) { setLoading(false); return }

    // Monthly data
    const monthMap = new Map<string, MonthData>()
    transactions.forEach(tx => {
      const d = new Date(tx.transaction_date)
      const key = `${d.toLocaleString('en-KE', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`
      if (!monthMap.has(key)) monthMap.set(key, { month: key, income: 0, expenses: 0, savings: 0, investment: 0 })
      const m = monthMap.get(key)!
      if (tx.type === 'income') m.income += tx.amount
      else if (tx.type === 'expense') m.expenses += tx.amount
      if (tx.categories?.name === 'Investment') m.investment += tx.amount
    })
    monthMap.forEach(m => { m.savings = m.income - m.expenses })
    const monthly = Array.from(monthMap.values())
    setMonthlyData(monthly)
    if (monthly.length > 0) {
      setBestMonth(monthly.reduce((a, b) => a.savings > b.savings ? a : b))
      setWorstMonth(monthly.reduce((a, b) => a.savings < b.savings ? a : b))
    }

    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const inv = transactions.filter(t => t.categories?.name === 'Investment').reduce((s, t) => s + t.amount, 0)
    setTotalStats({ income: inc, expenses: exp, savings: inc - exp, investment: inv, transactions: transactions.length })

    // Category data
    const catMap = new Map<string, CategoryData>()
    transactions.filter(t => t.type === 'expense').forEach(tx => {
      const name = tx.categories?.name || 'Other'
      const icon = tx.categories?.icon || '📦'
      const color = tx.categories?.color || '#94a3b8'
      if (!catMap.has(name)) catMap.set(name, { name, value: 0, color, icon })
      catMap.get(name)!.value += tx.amount
    })
    setCategoryData(Array.from(catMap.values()).sort((a, b) => b.value - a.value).slice(0, 8))

    // Weekly data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const tw = days.map(day => ({ day, amount: 0, lastWeek: 0 }))
    transactions.filter(t => t.type === 'expense').forEach(tx => {
      const d = new Date(tx.transaction_date)
      const idx = (d.getDay() + 6) % 7
      if (d >= thisWeekStart) tw[idx].amount += tx.amount
      else if (d >= lastWeekStart) tw[idx].lastWeek += tx.amount
    })
    setWeeklyData(tw)
    setLoading(false)
  }

  function fmt(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return Math.round(n).toLocaleString('en-KE')
  }

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#14b8a6', '#ec4899', '#f97316']

  const tooltipFormatter = (v: number | string | undefined) => [`KES ${fmt(Number(v ?? 0))}`, '']

  const needs50 = categoryData.filter(c => ['Rent', 'Utilities', 'Groceries', 'Transport', 'Healthcare', 'Airtime & Data', 'Lunch'].includes(c.name)).reduce((s, c) => s + c.value, 0)
  const wants30 = categoryData.filter(c => ['Entertainment', 'Dining Out', 'Social Life', 'Gifts & Dating', 'Clothing', 'Travel'].includes(c.name)).reduce((s, c) => s + c.value, 0)
  const rule5020Data = [
    { name: 'Needs 50%', spent: needs50, target: totalStats.income * 0.5 },
    { name: 'Wants 30%', spent: wants30, target: totalStats.income * 0.3 },
    { name: 'Savings 20%', spent: Math.max(totalStats.savings, 0), target: totalStats.income * 0.2 },
  ]

  return (
    <div className="bg-[#F0F4FF] min-h-screen pb-8">

      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] px-5 pt-5 pb-6">
        <h1 className="text-white text-xl font-extrabold mb-1">Reports</h1>
        <p className="text-white/40 text-xs mb-4">Your financial story in charts</p>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${period === p ? 'bg-white text-[#0F1F3D]' : 'bg-white/10 text-white/60'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {!loading && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white/40 text-[10px]">Income</p>
              <p className="text-emerald-400 font-extrabold text-sm">+{fmt(totalStats.income)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white/40 text-[10px]">Expenses</p>
              <p className="text-red-400 font-extrabold text-sm">-{fmt(totalStats.expenses)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white/40 text-[10px]">Invested</p>
              <p className="text-amber-400 font-extrabold text-sm">{fmt(totalStats.investment)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP TOPBAR ── */}
      <div className="hidden md:flex bg-white border-b border-gray-100 px-8 py-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F1F3D] flex items-center justify-center text-white text-sm">📈</div>
          <div>
            <p className="text-sm font-extrabold text-[#0F1F3D]">Financial Reports</p>
            <p className="text-[11px] text-gray-400">WealthOS · Kenya</p>
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['week', 'month', 'quarter', 'year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${period === p ? 'bg-white text-[#0F1F3D] shadow-sm' : 'text-gray-500'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400 text-sm">Loading your data...</p>
        </div>
      ) : (
        <>
          {/* ── DESKTOP KPI ROW ── */}
          <div className="hidden md:grid grid-cols-6 gap-3 px-8 pt-5">
            {[
              { label: 'Total income', value: `KES ${fmt(totalStats.income)}`, sub: 'This period', color: '#10b981', textColor: 'text-emerald-600' },
              { label: 'Total expenses', value: `KES ${fmt(totalStats.expenses)}`, sub: `${totalStats.income > 0 ? Math.round((totalStats.expenses / totalStats.income) * 100) : 0}% of income`, color: '#ef4444', textColor: 'text-red-500' },
              { label: 'Net balance', value: `${totalStats.savings >= 0 ? '+' : '-'}KES ${fmt(Math.abs(totalStats.savings))}`, sub: totalStats.savings >= 0 ? 'Positive' : 'Deficit', color: '#3b82f6', textColor: totalStats.savings >= 0 ? 'text-blue-600' : 'text-red-500' },
              { label: 'Invested', value: `KES ${fmt(totalStats.investment)}`, sub: 'Ziidi MMF', color: '#f59e0b', textColor: 'text-amber-600' },
              { label: 'Transactions', value: `${totalStats.transactions}`, sub: 'This period', color: '#14b8a6', textColor: 'text-teal-600' },
              { label: 'Savings rate', value: `${totalStats.income > 0 ? Math.round((totalStats.savings / totalStats.income) * 100) : 0}%`, sub: 'Target: 20%', color: '#8b5cf6', textColor: totalStats.savings / totalStats.income >= 0.2 ? 'text-purple-600' : 'text-red-500' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: kpi.color }} />
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{kpi.label}</p>
                <p className={`text-base font-extrabold ${kpi.textColor} mb-0.5`}>{kpi.value}</p>
                <p className="text-[10px] text-gray-400">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="px-4 md:px-8 mt-4 space-y-4">

            {/* ── MAIN LINE CHART ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">Income vs Expenses vs Investment</p>
              <p className="text-xs text-gray-400 mb-3">Green = income · Red = expenses · Blue dashed = net savings · Amber dashed = investment</p>
              <div className="flex gap-4 mb-3 flex-wrap">
                {[['#10b981','Income'],['#ef4444','Expenses'],['#3b82f6','Net savings'],['#f59e0b','Investment']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c as string }} />
                    {l}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}K`} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} name="Expenses" />
                  <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="6 4" name="Net savings" />
                  <Line type="monotone" dataKey="investment" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="3 3" name="Investment" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── TWO COLUMN ── */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* DONUT */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">Spending by category</p>
                <p className="text-xs text-gray-400 mb-3">Where your money went</p>
                {categoryData.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No expense data</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={tooltipFormatter} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {categoryData.map((cat, i) => {
                        const total = categoryData.reduce((s, c) => s + c.value, 0)
                        const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0
                        return (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-[11px] text-gray-600 truncate flex-1">{cat.icon} {cat.name}</span>
                            <span className="text-[11px] font-bold text-gray-700">{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* MONTHLY BAR */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">Monthly breakdown</p>
                <p className="text-xs text-gray-400 mb-3">Income vs expenses per month</p>
                <div className="flex gap-4 mb-3">
                  {[['#10b981','Income'],['#ef4444','Expenses'],['#f59e0b','Investment']].map(([c,l]) => (
                    <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c as string }} />{l}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}K`} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expenses" />
                    <Bar dataKey="investment" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Investment" />
                  </BarChart>
                </ResponsiveContainer>

                {bestMonth && worstMonth && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Best month</p>
                      <p className="text-sm font-extrabold text-emerald-800">{bestMonth.month}</p>
                      <p className="text-[11px] text-emerald-600">Saved KES {fmt(bestMonth.savings)}</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-wide mb-1">Worst month</p>
                      <p className="text-sm font-extrabold text-red-700">{worstMonth.month}</p>
                      <p className="text-[11px] text-red-500">
                        {worstMonth.savings < 0 ? `Deficit KES ${fmt(Math.abs(worstMonth.savings))}` : `Saved KES ${fmt(worstMonth.savings)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── THREE COLUMN ── */}
            <div className="grid md:grid-cols-3 gap-4">

              {/* WEEKLY */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">This week vs last week</p>
                <p className="text-xs text-gray-400 mb-3">Daily spending comparison</p>
                <div className="flex gap-3 mb-3">
                  {[['#3b82f6','This week'],['#e2e8f0','Last week']].map(([c,l]) => (
                    <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-sm border border-gray-200" style={{ background: c as string }} />{l}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}K`} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[3, 3, 0, 0]} name="This week" />
                    <Bar dataKey="lastWeek" fill="#e2e8f0" radius={[3, 3, 0, 0]} name="Last week" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 50/30/20 */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">50 / 30 / 20 rule</p>
                <p className="text-xs text-gray-400 mb-4">Budget framework progress</p>
                <div className="space-y-4">
                  {rule5020Data.map((rule, i) => {
                    const pct = rule.target > 0 ? Math.min(Math.round((rule.spent / rule.target) * 100), 100) : 0
                    const over = rule.spent > rule.target
                    const colors = ['#ef4444', '#10b981', '#3b82f6']
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{rule.name}</span>
                          <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-gray-500'}`}>{pct}% {over ? '⚠️' : ''}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#ef4444' : colors[i] }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[10px] text-gray-400">KES {fmt(rule.spent)}</span>
                          <span className="text-[10px] text-gray-400">Target: KES {fmt(rule.target)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* TOP CATEGORIES */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">Top spending categories</p>
                <p className="text-xs text-gray-400 mb-4">Ranked by amount spent</p>
                <div className="space-y-2">
                  {categoryData.slice(0, 6).map((cat, i) => {
                    const total = categoryData.reduce((s, c) => s + c.value, 0)
                    const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700 flex items-center gap-1">{cat.icon} {cat.name}</span>
                          <span className="text-xs font-bold text-gray-800">KES {fmt(cat.value)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── INSIGHTS ── */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '⚠️', bg: '#fef2f2', title: 'Rent is high vs income', desc: 'House rent consumes a large portion of real take-home pay. Consider negotiating or finding a cheaper option.' },
                { icon: '💡', bg: '#fefce8', title: 'Uncategorized transactions', desc: 'Some expenses are tagged as "Other". Use Contact Rules in Settings to unlock better insights and reports.' },
                { icon: '📈', bg: '#f0fdf4', title: 'Investment activity tracked', desc: `KES ${fmt(totalStats.investment)} invested in Ziidi MMF this period. Keep growing your liquid investment for better returns.` },
              ].map((ins, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: ins.bg }}>{ins.icon}</div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F1F3D] mb-1">{ins.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{ins.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </>
      )}
    </div>
  )
}