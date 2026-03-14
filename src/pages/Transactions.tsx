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
  notes: string | null
  categories: {
    name: string
    icon: string
    color: string
  } | null
}

type Category = {
  id: string
  name: string
  icon: string
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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => { loadTransactions() }, [refresh])

  async function loadTransactions() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data }, { data: cats }] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name, icon').order('name').limit(100),
    ])

    if (data) {
      setTransactions(data)
      setTotalIncome(data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))
      setTotalExpense(data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
    }
    setCategories(cats || [])
    setLoading(false)
  }

  async function deleteTransaction(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    loadTransactions()
  }

  async function saveEdit() {
    if (!editingTx) return
    await supabase.from('transactions').update({
      description: editingTx.description,
      amount: editingTx.amount,
      type: editingTx.type,
      transaction_date: editingTx.transaction_date,
      notes: editingTx.notes,
    }).eq('id', editingTx.id)
    setEditingTx(null)
    loadTransactions()
  }

  async function saveCategory(txId: string, categoryId: string) {
    await supabase.from('transactions').update({
      category_id: categoryId,
      needs_review: false,
    }).eq('id', txId)
    loadTransactions()
  }

  const filtered = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  const grouped: { [date: string]: Transaction[] } = {}
  filtered.forEach(t => {
    if (!grouped[t.transaction_date]) grouped[t.transaction_date] = []
    grouped[t.transaction_date].push(t)
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

  const needsReviewCount = transactions.filter(t => t.needs_review).length

  return (
    <div>
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold text-[#0F1F3D]">Transactions</h1>
            <p className="text-xs text-gray-400 mt-0.5">{transactions.length} total transactions</p>
          </div>
          <button onClick={onAddNew} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
            ＋ Add
          </button>
        </div>

        {/* NEEDS REVIEW BANNER */}
        {needsReviewCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            <p className="text-xs font-semibold text-amber-800 flex-1">
              {needsReviewCount} transactions need categorizing
            </p>
            <button
              onClick={() => setFilter('all')}
              className="text-xs font-bold text-amber-700 underline"
            >
              Review
            </button>
          </div>
        )}

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
          <p className="text-xs text-gray-400 mb-4">Add your first income or expense to start tracking.</p>
          <button onClick={onAddNew} className="bg-blue-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl">
            Add First Transaction
          </button>
        </div>
      )}

      {/* TRANSACTION LIST */}
      {!loading && Object.keys(grouped).map(date => (
        <div key={date}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{formatDate(date)}</p>
          </div>
          <div className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-2">
            {grouped[date].map((tx, i) => (
              <div key={tx.id} className={`${i < grouped[date].length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* ICON */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${tx.type === 'income' ? 'bg-green-50' : tx.type === 'transfer' ? 'bg-blue-50' : 'bg-red-50'}`}>
                    {tx.categories?.icon || (tx.type === 'income' ? '💰' : tx.type === 'transfer' ? '🔄' : '💸')}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {tx.needs_review ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          ⚠️ Needs category
                        </span>
                      ) : (
                        <p className="text-xs text-gray-400">
                          {tx.categories?.name || 'Uncategorized'}
                          {tx.source === 'manual' ? ' · Manual' : ' · M-PESA'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AMOUNT + ACTIONS */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : tx.type === 'transfer' ? 'text-blue-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}KES {formatAmount(tx.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="text-[10px] text-blue-400 hover:text-blue-600 font-semibold"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-[10px] text-gray-300 hover:text-red-400"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* INLINE CATEGORY PICKER for needs_review */}
                {tx.needs_review && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px] text-gray-400 mb-1.5">Tap to categorize:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.slice(0, 8).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => saveCategory(tx.id, cat.id)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                        >
                          {cat.icon} {cat.name}
                        </button>
                      ))}
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-500"
                      >
                        More ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="h-6" />

      {/* EDIT MODAL */}
      {editingTx && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingTx(null)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md p-6">
            <div className="flex justify-center mb-4 md:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-extrabold text-[#0F1F3D]">Edit Transaction</h2>
              <button onClick={() => setEditingTx(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
              <input
                value={editingTx.description}
                onChange={e => setEditingTx({ ...editingTx, description: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#0F1F3D] outline-none focus:border-blue-400"
              />
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Amount (KES)</label>
              <input
                type="number"
                value={editingTx.amount}
                onChange={e => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#0F1F3D] outline-none focus:border-blue-400"
              />
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Type</label>
              <div className="flex gap-2">
                {['income', 'expense', 'transfer'].map(t => (
                  <button
                    key={t}
                    onClick={() => setEditingTx({ ...editingTx, type: t })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${editingTx.type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Category</label>
              <select
                onChange={e => saveCategory(editingTx.id, e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#0F1F3D] outline-none focus:border-blue-400"
                defaultValue=""
              >
                <option value="" disabled>
                  {editingTx.categories ? `${editingTx.categories.icon} ${editingTx.categories.name}` : 'Select category'}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Date</label>
              <input
                type="date"
                value={editingTx.transaction_date}
                onChange={e => setEditingTx({ ...editingTx, transaction_date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#0F1F3D] outline-none focus:border-blue-400"
              />
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
              <input
                value={editingTx.notes || ''}
                onChange={e => setEditingTx({ ...editingTx, notes: e.target.value })}
                placeholder="Optional note..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#0F1F3D] outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingTx(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold shadow-lg shadow-blue-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}