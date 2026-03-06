import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Category = {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

type Props = {
  onClose: () => void
  onSuccess: () => void
}

export default function AddTransaction({ onClose, onSuccess }: Props) {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (data && data.length > 0) {
      setCategories(data)
    } else {
      // Create default categories if none exist
      await createDefaultCategories(user.id)
    }
  }

  async function createDefaultCategories(userId: string) {
    const defaults = [
      { name: 'Salary', icon: '💼', color: '#059669', type: 'income' },
      { name: 'Business Income', icon: '💰', color: '#059669', type: 'income' },
      { name: 'Rent', icon: '🏠', color: '#1A56DB', type: 'fixed' },
      { name: 'Groceries', icon: '🛒', color: '#059669', type: 'essential' },
      { name: 'Transport', icon: '🚕', color: '#F59E0B', type: 'essential' },
      { name: 'Dining Out', icon: '🍽️', color: '#EF4444', type: 'enrichment' },
      { name: 'Utilities', icon: '💡', color: '#6366F1', type: 'fixed' },
      { name: 'Airtime & Data', icon: '📱', color: '#8B5CF6', type: 'essential' },
      { name: 'Parents Support', icon: '🤝', color: '#8B5CF6', type: 'life_responsibility' },
      { name: 'Siblings Support', icon: '👫', color: '#0694A2', type: 'life_responsibility' },
      { name: 'Chama', icon: '👥', color: '#D97706', type: 'life_responsibility' },
      { name: 'Entertainment', icon: '🎬', color: '#EC4899', type: 'enrichment' },
      { name: 'Healthcare', icon: '🏥', color: '#EF4444', type: 'essential' },
      { name: 'Clothing', icon: '👔', color: '#6366F1', type: 'enrichment' },
      { name: 'Savings Transfer', icon: '🏦', color: '#1A56DB', type: 'aspirational' },
      { name: 'Investment', icon: '📈', color: '#059669', type: 'aspirational' },
      { name: 'Other', icon: '📦', color: '#64748B', type: 'essential' },
    ]

    const { data } = await supabase
      .from('categories')
      .insert(defaults.map(c => ({ ...c, user_id: userId })))
      .select()

    if (data) setCategories(data)
  }

  async function handleSubmit() {
    setError('')
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        transaction_date: date,
        category_id: categoryId || null,
        source: 'manual',
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type !== 'income')

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* SHEET */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* HANDLE */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-[#0F1F3D]">Add Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">

          {/* TYPE SELECTOR */}
          <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-2xl">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${type === t ? 'bg-white shadow text-[#0F1F3D]' : 'text-gray-400'}`}
              >
                {t === 'expense' ? '💸 Expense' : t === 'income' ? '💰 Income' : '🔄 Transfer'}
              </button>
            ))}
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* AMOUNT */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Amount (KES)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KES</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-14 pr-4 py-3.5 text-lg font-extrabold text-[#0F1F3D] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Naivas Supermarket, Salary, Rent..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* DATE */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* CATEGORY */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-all ${categoryId === cat.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 disabled:opacity-60 mb-32"
          >
            {loading ? '⏳ Saving...' : `Save ${type === 'income' ? 'Income' : type === 'transfer' ? 'Transfer' : 'Expense'}`}
          </button>

        </div>
      </div>
    </div>
  )
}