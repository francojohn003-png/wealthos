import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Transaction = {
  id: string
  description: string
  amount: number
  type: string
  transaction_date: string
  source: string
  needs_review: boolean
  categories: {
    name: string
    icon: string
    color: string
  } | null
}

type Props = {
  onAddNew: () => void
  refresh: number
}

export default function Transactions({ onAddNew, refresh }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)

  useEffect(() => {
    loadTransactions()
  }, [refresh])

  async function loadTransactions() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data)
      setTotalIncome(
        data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      )
      setTotalExpense(
        data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      )
    }
    setLoading(false)
  }

  async function deleteTransaction(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    loadTransactions()
  }

  const filtered = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  // Group by date
  const grouped: { [date: string]: Transaction[] } = {}
  filtered.forEach(t => {
    const date = t.transaction_date
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(t)
  })

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatAmount(amount: number) {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })
  }

  return (
    <div>
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-[#0F1F3D]">Transactions</h1>
            <p className="text-xs text-gray-400 mt-0.5">{transactions.length} total transactions</p>
          </div>
          <button
            onClick={onAddNew}
            className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            ＋ Add
          </button>
        </div>

        {/* SUMMARY CHIPS */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Income</p>
            <p className="text-sm font-extrabold text-green-700">KES {formatAmount(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Expenses</p>
            <p className="text-sm font-extrabold text-red-600">KES {formatAmount(totalExpense)}</p>
          </div>
          <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Balance</p>
            <p className={`text-sm font-extrabold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
              KES {formatAmount(totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-3">
          {['all', 'income', 'expense', 'transfer'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              {f === 'all' ? `All (${transactions.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-400 text-sm">Loading transactions...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm font-bold text-gray-700 mb-1">No transactions yet</p>
          <p className="text-xs text-gray-400 mb-4">Add your first income or expense to start tracking your finances.</p>
          <button
            onClick={onAddNew}
            className="bg-blue-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
          >
            Add First Transaction
          </button>
        </div>
      )}

      {/* TRANSACTION LIST */}
      {!loading && Object.keys(grouped).map(date => (
        <div key={date}>
          {/* DATE HEADER */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {formatDate(date)}
            </p>
          </div>

          {/* TRANSACTIONS FOR THIS DATE */}
          <div className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-2">
            {grouped[date].map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < grouped[date].length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                {/* ICON */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${tx.type === 'income' ? 'bg-green-50' : tx.type === 'transfer' ? 'bg-blue-50' : 'bg-red-50'}`}>
                  {tx.categories?.icon || (tx.type === 'income' ? '💰' : tx.type === 'transfer' ? '🔄' : '💸')}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tx.categories?.name || 'Uncategorized'}
                    {tx.source === 'manual' ? ' · Manual' : ' · M-PESA'}
                  </p>
                </div>

                {/* AMOUNT */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : tx.type === 'transfer' ? 'text-blue-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}KES {formatAmount(tx.amount)}
                  </p>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="text-[10px] text-gray-300 hover:text-red-400 mt-0.5"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="h-6" />
    </div>
  )
}