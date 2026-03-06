import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Goal = {
  id: string
  name: string
  emoji: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string
  status: string
  daily_target: number
  weekly_target: number
  monthly_target: number
  created_at: string
}

type Contribution = {
  id: string
  amount: number
  contribution_date: string
  notes: string | null
  created_at: string
}

type Props = {
  goalId: string
  onBack: () => void
  onUpdate: () => void
}

export default function GoalDetail({ goalId, onBack, onUpdate }: Props) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGoal()
    loadContributions()
  }, [goalId])

  async function loadGoal() {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single()
    if (data) setGoal(data)
    setLoading(false)
  }

  async function loadContributions() {
    const { data } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('contribution_date', { ascending: false })
    if (data) setContributions(data)
  }

  async function handleAddContribution() {
    setError('')
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !goal) return

    const contributionAmount = parseFloat(amount)
    const newAmount = goal.current_amount + contributionAmount

    // Save contribution
    const { error: contribError } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        amount: contributionAmount,
        contribution_date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || null,
      })

    if (contribError) {
      setError(contribError.message)
      setSaving(false)
      return
    }

    // Update goal current amount
    const { error: goalError } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goalId)

    if (goalError) {
      setError(goalError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setAmount('')
    setNotes('')
    setShowAddForm(false)
    loadGoal()
    loadContributions()
    onUpdate()
  }

  function formatAmount(amount: number) {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })
  }

  function daysRemaining(targetDate: string) {
    const today = new Date()
    const target = new Date(targetDate)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  if (loading || !goal) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-gray-400 text-sm">Loading goal...</p>
      </div>
    )
  }

  const pct = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
  const days = daysRemaining(goal.target_date)
  const remaining = goal.target_amount - goal.current_amount

  return (
    <div>
      {/* HERO */}
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] px-5 pt-4 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/50 text-xs font-semibold mb-4"
        >
          ← Back to Goals
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{goal.emoji}</span>
          <div>
            <p className="text-white text-xl font-extrabold">{goal.name}</p>
            {goal.description && <p className="text-white/50 text-xs mt-0.5">{goal.description}</p>}
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-3 bg-white/15 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #34D399, #3B82F6)'
            }}
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-white text-2xl font-extrabold">KES {formatAmount(goal.current_amount)}</p>
          <p className="text-white/50 text-sm">of KES {formatAmount(goal.target_amount)}</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Progress</p>
          <p className="text-lg font-extrabold text-blue-600 mt-1">{pct}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Remaining</p>
          <p className="text-sm font-extrabold text-[#0F1F3D] mt-1">KES {formatAmount(remaining)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Days Left</p>
          <p className={`text-lg font-extrabold mt-1 ${days < 30 ? 'text-red-600' : 'text-[#0F1F3D]'}`}>
            {days > 0 ? days : 'Due!'}
          </p>
        </div>
      </div>

      {/* DAILY TARGET */}
      <div className="mx-4 mt-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Daily Target</p>
            <p className="text-xl font-extrabold text-blue-700 mt-1">KES {formatAmount(Math.ceil(goal.daily_target))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Monthly</p>
            <p className="text-sm font-extrabold text-blue-600 mt-1">KES {formatAmount(Math.ceil(goal.monthly_target))}</p>
          </div>
        </div>
      </div>

      {/* ADD CONTRIBUTION BUTTON */}
      <div className="mx-4 mt-3">
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-blue-200"
        >
          💰 Add Money to This Goal
        </button>
      </div>

      {/* CONTRIBUTION HISTORY */}
      <div className="mx-4 mt-4 mb-4">
        <h2 className="text-[15px] font-bold text-[#0F1F3D] mb-3">
          📋 Contribution History ({contributions.length})
        </h2>
        {contributions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No contributions yet. Add your first one!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {contributions.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < contributions.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg flex-shrink-0">
                  💰
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {c.notes || 'Contribution'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.contribution_date)}</p>
                </div>
                <p className="text-sm font-bold text-green-600">
                  +KES {formatAmount(c.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD CONTRIBUTION FORM */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          />
          <div className="relative bg-white rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-lg font-extrabold text-[#0F1F3D]">Add Money — {goal.name}</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
                </div>
              )}
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
                {/* QUICK AMOUNTS */}
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map(q => (
                    <button
                      key={q}
                      onClick={() => setAmount(q.toString())}
                      className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-1.5 rounded-lg"
                    >
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Monthly savings, Bonus..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={handleAddContribution}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 disabled:opacity-60 mb-4"
              >
                {saving ? '⏳ Saving...' : '💰 Add to Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}