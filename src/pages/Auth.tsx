import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup() {
    setLoading(true)
    setError('')
    if (!fullName.trim()) {
      setError('Please enter your full name')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Account created! You can now log in.')
      setMode('login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex flex-col">

      {/* HERO TOP */}
      <div className="bg-gradient-to-br from-[#0F1F3D] via-[#142847] to-[#1A3A6C] px-6 pt-16 pb-12 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent" />
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-blue-900/40 mb-4">
            💰
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1">WealthOS</h1>
          <p className="text-white/50 text-sm text-center">Your Kenyan Financial Wellness Platform</p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="flex-1 px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/10 border border-gray-100 overflow-hidden">

          {/* TABS */}
          <div className="flex border-b border-gray-100">
            <button
              className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              onClick={() => { setMode('signup'); setError(''); setMessage(''); }}
            >
              Create Account
            </button>
          </div>

          <div className="p-6">

            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-green-700 text-sm font-medium">✅ {message}</p>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* FULL NAME - signup only */}
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Kamau"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            )}

            {/* EMAIL */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Your password'}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Please wait...' : mode === 'login' ? '→ Sign In to WealthOS' : '→ Create My Account'}
            </button>

            {/* SWITCH MODE */}
            <p className="text-center text-xs text-gray-400 mt-4">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span
                className="text-blue-600 font-bold cursor-pointer"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
              >
                {mode === 'login' ? 'Create one free' : 'Sign in'}
              </span>
            </p>

          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-6 grid grid-cols-3 gap-3 pb-8">
          {[
            { icon: '📱', text: 'M-PESA Import' },
            { icon: '🎯', text: 'Goal Tracking' },
            { icon: '💡', text: 'Smart Alerts' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
              <p className="text-2xl mb-1">{f.icon}</p>
              <p className="text-[10px] font-bold text-gray-500">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}