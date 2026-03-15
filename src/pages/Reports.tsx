import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type MonthData = {
  month: string
  income: number
  expenses: number
  savings: number
}

type CategoryData = {
  name: string
  value: number
  color: string
  icon: string
}

type DayData = {
  day: string
  amount: number
}

export default function Reports() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [weeklyData, setWeeklyData] = useState<DayData[]>([])
  const [lastWeekData, setLastWeekData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [bestMonth, setBestMonth] = useState<MonthData | null>(null)
  const [worstMonth, setWorstMonth] = useState<MonthData | null>(null)
  const [totalStats, setTotalStats] = useState({ income: 0, expenses: 0, savings: 0 })

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

    // ── MONTHLY DATA ──────────────────────────────────
    const monthMap = new Map<string, MonthData>()
    transactions.forEach(tx => {
      const d = new Date(tx.transaction_date)
      const key = `${d.toLocaleString('en-KE', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`
      if (!monthMap.has(key)) monthMap.set(key, { month: key, income: 0, expenses: 0, savings: 0 })
      const m = monthMap.get(key)!
      if (tx.type === 'income') m.income += tx.amount
      else if (tx.type === 'expense') m.expenses += tx.amount
    })
    monthMap.forEach(m => { m.savings = m.income - m.expenses })
    const monthly = Array.from(monthMap.values())
    setMonthlyData(monthly)

    // Best and worst months
    if (monthly.length > 0) {
      setBestMonth(monthly.reduce((a, b) => a.savings > b.savings ? a : b))
      setWorstMonth(monthly.reduce((a, b) => a.savings < b.savings ? a : b))
    }

    // Total stats
    const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    setTotalStats({ income: inc, expenses: exp, savings: inc - exp })

    // ── CATEGORY DATA ─────────────────────────────────
    const catMap = new Map<string, CategoryData>()
    transactions.filter(t => t.type === 'expense').forEach(tx => {
      const name = tx.categories?.name || 'Other'
      const icon = tx.categories?.icon || '📦'
      const color = tx.categories?.color || '#94a3b8'
      if (!catMap.has(name)) catMap.set(name, { name, value: 0, color, icon })
      catMap.get(name)!.value += tx.amount
    })
    const cats = Array.from(catMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
    setCategoryData(cats)

    // ── WEEKLY DATA ───────────────────────────────────
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1)
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)

    const thisWeek: DayData[] = days.map(day => ({ day, amount: 0 }))
    const lastWeek: DayData[] = days.map(day => ({ day, amount: 0 }))

    transactions.filter(t => t.type === 'expense').forEach(tx => {
      const d = new Date(tx.transaction_date)
      const dayIdx = (d.getDay() + 6) % 7
      if (d >= thisWeekStart) thisWeek[dayIdx].amount += tx.amount
      else if (d >= lastWeekStart) lastWeek[dayIdx].amount += tx.amount
    })

    setWeeklyData(thisWeek)
    setLastWeekData(lastWeek)
    setLoading(false)
  }

  function fmt(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString('en-KE')
  }

  const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#f97316']

  return (
    <div className="pb-8">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] px-5 pt-5 pb-6">
        <h1 className="text-white text-xl font-extrabold mb-1">Reports</h1>
        <p className="text-white/40 text-xs mb-4">Your financial story in charts</p>

        {/* PERIOD FILTER */}
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${period === p ? 'bg-white text-[#0F1F3D]' : 'bg-white/10 text-white/60'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* SUMMARY */}
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
              <p className="text-white/40 text-[10px]">Saved</p>
              <p className={`font-extrabold text-sm ${totalStats.savings >= 0 ? 'text-white' : 'text-red-400'}`}>
                {totalStats.savings >= 0 ? '+' : ''}{fmt(totalStats.savings)}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-400 text-sm">Loading your data...</p>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-4">

          {/* INCOME VS EXPENSES LINE CHART */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-extrabold text-[#0F1F3D] mb-1">📈 Income vs Expenses</h2>
            <p className="text-xs text-gray-400 mb-4">Monthly trend</p>
            {monthlyData.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number | string | undefined) => [`KES ${fmt(Number(v ?? 0))}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} name="Expenses" />
                  <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Savings" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* BEST & WORST MONTH */}
          {bestMonth && worstMonth && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">🏆 Best Month</p>
                <p className="text-sm font-extrabold text-emerald-800">{bestMonth.month}</p>
                <p className="text-xs text-emerald-600 mt-1">Saved KES {fmt(bestMonth.savings)}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-1">⚠️ Worst Month</p>
                <p className="text-sm font-extrabold text-red-700">{worstMonth.month}</p>
                <p className="text-xs text-red-500 mt-1">
                  {worstMonth.savings < 0 ? `Overspent KES ${fmt(Math.abs(worstMonth.savings))}` : `Saved KES ${fmt(worstMonth.savings)}`}
                </p>
              </div>
            </div>
          )}

          {/* WEEKLY COMPARISON BAR CHART */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-extrabold text-[#0F1F3D] mb-1">📊 This Week vs Last Week</h2>
            <p className="text-xs text-gray-400 mb-4">Daily spending comparison</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData.map((d, i) => ({ ...d, lastWeek: lastWeekData[i]?.amount || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number | string | undefined) => [`KES ${fmt(Number(v ?? 0))}`, '']} />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="This Week" />
                <Bar dataKey="lastWeek" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Last Week" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CATEGORY PIE CHART */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-extrabold text-[#0F1F3D] mb-1">🥧 Spending by Category</h2>
            <p className="text-xs text-gray-400 mb-4">Where your money goes</p>
            {categoryData.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No expense data for this period</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number | string | undefined) => [`KES ${fmt(Number(v ?? 0))}`, '']} />
                  </PieChart>
                </ResponsiveContainer>

                {/* LEGEND */}
                <div className="space-y-2 mt-2">
                  {categoryData.map((cat, i) => {
                    const total = categoryData.reduce((s, c) => s + c.value, 0)
                    const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-gray-600 flex-1">{cat.icon} {cat.name}</span>
                        <span className="text-xs font-bold text-gray-800">KES {fmt(cat.value)}</span>
                        <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  )
}