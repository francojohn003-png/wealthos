import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type CategorySpend = {
  id: string
  name: string
  icon: string
  color: string
  type: string
  monthly_budget: number
  spent: number
}

export default function Budgeting() {
  const [categories, setCategories] = useState<CategorySpend[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [editingCategory, setEditingCategory] = useState<CategorySpend | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBudgetData()
  }, [selectedMonth])

  async function loadBudgetData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)

    // Load categories
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    // Load transactions for this month
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, category_id')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
      .lte('transaction_date', endOfMonth.toISOString().split('T')[0])

    // Load income for this month
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'income')
      .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
      .lte('transaction_date', endOfMonth.toISOString().split('T')[0])

    if (cats && transactions) {
      // Calculate spending per category
      const spendMap: { [key: string]: number } = {}
      transactions.forEach(t => {
        if (t.category_id) {
          spendMap[t.category_id] = (spendMap[t.category_id] || 0) + t.amount
        }
      })

      const categorySpends = cats
        .filter(c => c.type !== 'income')
        .map(c => ({
          ...c,
          spent: spendMap[c.id] || 0
        }))
        .sort((a, b) => b.spent - a.spent)

      setCategories(categorySpends)
      setTotalSpent(transactions.reduce((sum, t) => sum + t.amount, 0))
      setTotalIncome(incomeData ? incomeData.reduce((sum, t) => sum + t.amount, 0) : 0)
    }
    setLoading(false)
  }

  async function saveBudget() {
    if (!editingCategory || !budgetInput) return
    setSaving(true)

    await supabase
      .from('categories')
      .update({ monthly_budget: parseFloat(budgetInput) })
      .eq('id', editingCategory.id)

    setSaving(false)
    setEditingCategory(null)
    setBudgetInput('')
    loadBudgetData()
  }

  function formatAmount(amount: number) {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`
    return amount.toLocaleString('en-KE')
  }

  function getMonthName(date: Date) {
    return date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
  }

  function prevMonth() {
    setSelectedMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  function nextMonth() {
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    if (next <= new Date()) setSelectedMonth(next)
  }

  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0

  return (
    <div>
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] px-5 pt-5 pb-6">
        {/* MONTH SELECTOR */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-lg">‹</button>
          <p className="text-white font-bold text-sm">{getMonthName(selectedMonth)}</p>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-lg">›</button>
        </div>

        {/* TOTALS */}
        <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">Total Spent</p>
        <p className="text-white text-3xl font-extrabold tracking-tight">KES {formatAmount(totalSpent)}</p>
        <p className="text-white/50 text-xs mt-1 mb-4">
          of KES {formatAmount(totalIncome)} income · {savingsRate}% savings rate
        </p>

        {/* PROGRESS BAR */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0}%`,
              background: totalSpent > totalIncome
                ? 'linear-gradient(90deg,#EF4444,#F87171)'
                : 'linear-gradient(90deg,#34D399,#3B82F6)'
            }}
          />
        </div>

        {/* SUMMARY CHIPS */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 bg-white/10 rounded-xl p-2 text-center">
            <p className="text-white/40 text-[10px]">Income</p>
            <p className="text-white text-sm font-bold">KES {formatAmount(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-2 text-center">
            <p className="text-white/40 text-[10px]">Spent</p>
            <p className="text-white text-sm font-bold">KES {formatAmount(totalSpent)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-2 text-center">
            <p className="text-white/40 text-[10px]">Remaining</p>
            <p className={`text-sm font-bold ${totalIncome - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              KES {formatAmount(totalIncome - totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* 50/30/20 RULE */}
      <div className="mx-4 mt-4">
        <h2 className="text-[15px] font-bold text-[#0F1F3D] mb-3">📊 50/30/20 Rule</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          {[
            { label: 'Needs (50%)', target: totalIncome * 0.5, types: ['essential', 'fixed'] },
            { label: 'Wants (30%)', target: totalIncome * 0.3, types: ['enrichment'] },
            { label: 'Savings (20%)', target: totalIncome * 0.2, types: ['aspirational'] },
          ].map((rule, i) => {
            const spent = categories
              .filter(c => rule.types.includes(c.type))
              .reduce((sum, c) => sum + c.spent, 0)
            const pct = rule.target > 0 ? Math.min(Math.round((spent / rule.target) * 100), 100) : 0
            const over = spent > rule.target
            return (
              <div key={i} className={i < 2 ? 'mb-4' : ''}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">{rule.label}</span>
                  <span className={`text-xs font-bold ${over ? 'text-red-600' : 'text-gray-500'}`}>
                    {pct}% {over ? '⚠️' : ''}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: over
                        ? 'linear-gradient(90deg,#EF4444,#F87171)'
                        : 'linear-gradient(90deg,#059669,#34D399)'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">KES {formatAmount(spent)} spent</span>
                  <span className="text-[10px] text-gray-400">Target: KES {formatAmount(rule.target)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="mx-4 mt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[#0F1F3D]">By Category</h2>
          <p className="text-xs text-gray-400">Tap to set budget</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {categories.filter(c => c.spent > 0 || c.monthly_budget > 0).length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm">No spending data yet this month.</p>
                <p className="text-gray-300 text-xs mt-1">Add transactions to see your budget breakdown.</p>
              </div>
            ) : (
              categories
                .filter(c => c.spent > 0 || c.monthly_budget > 0)
                .map((cat, i, arr) => {
                  const pct = cat.monthly_budget > 0
                    ? Math.min(Math.round((cat.spent / cat.monthly_budget) * 100), 100)
                    : 0
                  const over = cat.monthly_budget > 0 && cat.spent > cat.monthly_budget
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-gray-50 ${i < arr.length - 1 ? 'border-b border-gray-50' : ''}`}
                      onClick={() => { setEditingCategory(cat); setBudgetInput(cat.monthly_budget.toString()) }}
                    >
                      <span className="text-xl flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                        {cat.monthly_budget > 0 ? (
                          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: over ? '#EF4444' : cat.color
                              }}
                            />
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-300 mt-0.5">Tap to set budget</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${over ? 'text-red-600' : 'text-gray-800'}`}>
                          KES {formatAmount(cat.spent)}
                        </p>
                        {cat.monthly_budget > 0 && (
                          <p className={`text-[10px] ${over ? 'text-red-400' : 'text-gray-400'}`}>
                            / {formatAmount(cat.monthly_budget)} {over ? '⚠️' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        )}
      </div>

      {/* SET BUDGET MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingCategory(null)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0F1F3D]">
                {editingCategory.icon} Set Budget — {editingCategory.name}
              </h2>
              <button onClick={() => setEditingCategory(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>
            <div className="px-5 py-4">
              <div className="bg-gray-50 rounded-xl p-3 mb-4 flex justify-between">
                <span className="text-sm text-gray-500">This month spent</span>
                <span className="text-sm font-bold text-gray-800">KES {formatAmount(editingCategory.spent)}</span>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Monthly Budget (KES)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KES</span>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={e => setBudgetInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-14 pr-4 py-3.5 text-lg font-extrabold text-[#0F1F3D] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[2000, 5000, 10000, 20000].map(q => (
                    <button key={q} onClick={() => setBudgetInput(q.toString())} className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-1.5 rounded-lg">
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={saveBudget}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 disabled:opacity-60 mb-4"
              >
                {saving ? '⏳ Saving...' : '💾 Save Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}