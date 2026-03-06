import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import GoalDetail from './GoalDetail'

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

type Props = {
  refresh: number
  onGoalUpdate: () => void
}

export default function Goals({ refresh, onGoalUpdate }: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

  useEffect(() => {
    loadGoals()
  }, [refresh])

  async function loadGoals() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) setGoals(data)
    setLoading(false)
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    loadGoals()
  }

  function formatAmount(amount: number) {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })
  }

  function daysRemaining(targetDate: string) {
    const today = new Date()
    const target = new Date(targetDate)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  function isOnTrack(goal: Goal) {
    if (goal.current_amount === 0) return true
    const days = daysRemaining(goal.target_date)
    const totalDays = Math.ceil((new Date(goal.target_date).getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = totalDays - days
    const expectedAmount = (goal.target_amount / totalDays) * daysElapsed
    return goal.current_amount >= expectedAmount * 0.9
  }

  // Show goal detail if selected
  if (selectedGoalId) {
    return (
      <GoalDetail
        goalId={selectedGoalId}
        onBack={() => setSelectedGoalId(null)}
        onUpdate={() => {
          onGoalUpdate()
          loadGoals()
        }}
      />
    )
  }

  return (
    <div>
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-[#0F1F3D]">My Goals</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {goals.length === 0 ? 'No active goals yet' : `${goals.length} active goal${goals.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            ＋ New Goal
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center py-16">
          <p className="text-gray-400 text-sm">Loading goals...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm font-bold text-gray-700 mb-1">No goals yet</p>
          <p className="text-xs text-gray-400 mb-4">Set your first savings goal — car, house, emergency fund, or anything you want to achieve.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl"
          >
            Create First Goal
          </button>
        </div>
      )}

      {/* GOALS LIST */}
      {!loading && goals.length > 0 && (
        <div className="px-4 pt-4">
          {goals.map(goal => {
            const pct = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
            const onTrack = isOnTrack(goal)
            const days = daysRemaining(goal.target_date)
            const remaining = goal.target_amount - goal.current_amount

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 cursor-pointer" onClick={() => setSelectedGoalId(goal.id)}>
                {/* TOP ROW */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold text-[#0F1F3D]">{goal.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{goal.description || `Target: ${new Date(goal.target_date).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}`}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${onTrack ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {onTrack ? '✅ On Track' : '⚠️ Behind'}
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: onTrack
                        ? 'linear-gradient(90deg,#059669,#34D399)'
                        : 'linear-gradient(90deg,#D97706,#FBBF24)'
                    }}
                  />
                </div>

                {/* AMOUNTS */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-xl font-extrabold text-[#0F1F3D] tracking-tight">
                      KES {formatAmount(goal.current_amount)}
                    </p>
                    <p className="text-xs text-gray-400">of KES {formatAmount(goal.target_amount)}</p>
                  </div>
                  <p className={`text-lg font-extrabold ${onTrack ? 'text-blue-600' : 'text-amber-500'}`}>
                    {pct}%
                  </p>
                </div>

                {/* STATS ROW */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Daily</p>
                    <p className="text-xs font-extrabold text-[#0F1F3D] mt-0.5">KES {formatAmount(Math.ceil(goal.daily_target))}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Remaining</p>
                    <p className="text-xs font-extrabold text-[#0F1F3D] mt-0.5">KES {formatAmount(remaining)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Days Left</p>
                    <p className={`text-xs font-extrabold mt-0.5 ${days < 30 ? 'text-red-600' : 'text-[#0F1F3D]'}`}>
                      {days > 0 ? days : 'Overdue'}
                    </p>
                  </div>
                </div>

                {/* DAILY TARGET CHIP */}
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${onTrack ? 'bg-blue-50 border-blue-100 text-[#0F1F3D]' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                    📅 Save KES {formatAmount(Math.ceil(goal.daily_target))} today
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-[10px] text-gray-300 hover:text-red-400"
                  >
                    delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD GOAL FORM */}
      {showForm && (
        <AddGoalForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadGoals()
          }}
        />
      )}

      <div className="h-32" />
    </div>
  )
}

/* ── ADD GOAL FORM ────────────────────────────────── */
function AddGoalForm({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  // Calculated targets
  const dailyTarget = targetAmount && targetDate
    ? Math.ceil((parseFloat(targetAmount) - parseFloat(currentAmount || '0')) / Math.max(1, Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))))
    : 0

  const weeklyTarget = dailyTarget * 7
  const monthlyTarget = dailyTarget * 30

  const emojis = ['🎯', '🚗', '🏠', '✈️', '📚', '💍', '🏦', '💳', '📈', '🎓', '👶', '🌍', '💻', '🏋️', '🎸']

  async function handleSubmit() {
    setError('')
    if (!name.trim()) { setError('Please enter a goal name'); return }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { setError('Please enter a target amount'); return }
    if (!targetDate) { setError('Please select a target date'); return }

    const target = new Date(targetDate)
    const today = new Date()
    if (target <= today) { setError('Target date must be in the future'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      name: name.trim(),
      emoji,
      description: description.trim() || null,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount || '0'),
      target_date: targetDate,
      status: 'active',
      daily_target: dailyTarget,
      weekly_target: weeklyTarget,
      monthly_target: monthlyTarget,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    onSuccess()
  }

  function formatAmount(amount: number) {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-[#0F1F3D]">
            {step === 1 ? 'New Goal' : step === 2 ? 'Set Target' : 'Review Plan'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex gap-1.5 px-5 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-100'}`} />
          ))}
        </div>

        <div className="px-5 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* STEP 1 — BASIC INFO */}
          {step === 1 && (
            <>
              <p className="text-sm font-bold text-gray-500 mb-3">Choose an icon</p>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {emojis.map(e => (
                  <div
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`h-12 rounded-xl flex items-center justify-center text-2xl cursor-pointer border-2 transition-all ${emoji === e ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    {e}
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Car Fund, House Deposit, Emergency Fund..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Toyota Corolla, 3BR in Ruaka..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                onClick={() => { if (!name.trim()) { setError('Please enter a goal name'); return; } setError(''); setStep(2); }}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm"
              >
                Next →
              </button>
            </>
          )}

          {/* STEP 2 — AMOUNTS & DATE */}
          {step === 2 && (
            <>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Target Amount (KES)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KES</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-14 pr-4 py-3.5 text-lg font-extrabold text-[#0F1F3D] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Already Saved (KES)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">KES</span>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-14 pr-4 py-3.5 text-lg font-extrabold text-[#0F1F3D] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm">← Back</button>
                <button
                  onClick={() => {
                    if (!targetAmount || parseFloat(targetAmount) <= 0) { setError('Please enter a target amount'); return }
                    if (!targetDate) { setError('Please select a target date'); return }
                    setError(''); setStep(3)
                  }}
                  className="flex-2 flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm"
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {/* STEP 3 — REVIEW */}
          {step === 3 && (
            <>
              <div className="bg-gradient-to-br from-[#0F1F3D] to-[#1A3A6C] rounded-2xl p-5 mb-5 text-center">
                <p className="text-4xl mb-2">{emoji}</p>
                <p className="text-white text-lg font-extrabold">{name}</p>
                {description && <p className="text-white/50 text-xs mt-1">{description}</p>}
                <p className="text-white/50 text-xs mt-3 mb-1 uppercase tracking-wide">Target</p>
                <p className="text-white text-2xl font-extrabold">KES {formatAmount(parseFloat(targetAmount))}</p>
              </div>

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Your Saving Plan</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Daily</p>
                  <p className="text-sm font-extrabold text-blue-700 mt-1">KES {formatAmount(dailyTarget)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Weekly</p>
                  <p className="text-sm font-extrabold text-blue-700 mt-1">KES {formatAmount(weeklyTarget)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Monthly</p>
                  <p className="text-sm font-extrabold text-blue-700 mt-1">KES {formatAmount(monthlyTarget)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl text-sm">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60"
                >
                  {loading ? '⏳ Saving...' : '🎯 Create Goal'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}