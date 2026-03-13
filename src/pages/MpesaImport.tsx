import { useState, useRef } from 'react'
import { parseMpesaPDF, type MpesaTransaction } from '../lib/mpesaParser'
import { supabase } from '../lib/supabase'

type Step = 'upload' | 'preview' | 'saving' | 'done'

const CATEGORY_OPTIONS = [
  '💰 Income', '💼 Income', '📈 Investment', '💡 Utilities',
  '📡 Internet', '📱 Airtime', '💻 Subscriptions', '🎬 Entertainment',
  '🛒 Groceries', '🍽️ Dining', '🚗 Transport', '🏦 Banking',
  '🌍 Transfer', '👤 Send Money', '🏪 Buy Goods', '📄 Bills', '❓ Other',
]

const CATEGORY_MAP: Record<string, string> = {
  'Salary':           'c226f0fe-3f69-43d0-8145-cebe9ad072a0',
  'Business Income':  '46e0aef5-a13b-4a78-9d5c-6e714ecf614e',
  'Transport':        '234c973f-cd76-4126-a35e-91efc9d3cf66',
  'Dining Out':       '87454b7a-f628-423a-8a2b-d2545dc61b4b',
  'Utilities':        '84529fe3-031f-450b-8bf7-6d77ca50ab95',
  'Airtime & Data':   '075ecbb9-2f8e-41b4-9afe-fa98fc12e470',
  'Entertainment':      'ef01ecd2-f6b7-4a9a-9ab9-27b770f3180e',
  'Personal Growth':    'a5d0b611-7df9-4c35-a103-238f7e07d2f9',
  'Healthcare':       '0fdbcb80-44d3-4252-9fcf-463b68d05310',
  'Savings Transfer': '272e1203-fa0c-4a69-a3de-e255ff1d7416',
  'Investment':       '82280669-8991-499f-924d-0821b9117e90',
  'Other':            '21fd9c1b-4dc6-4c97-ae17-9cb2e05d928d',
  'Rent':             '46581d44-8d82-4410-b7c7-8578a36823d8',
  'Groceries':        'b86aa2d5-be87-4548-b4b2-043c7dee0eae',
}

function getCategoryId(tx: MpesaTransaction): string {
  const isIncome = tx.paid_in > 0
  const d = tx.details.toLowerCase()

  if (isIncome) {
    if (/b2c|absa|equity|kcb|salary|business payment/.test(d)) return CATEGORY_MAP['Salary']
    if (/unit trust|unitrust/.test(d))                          return CATEGORY_MAP['Investment']
    return CATEGORY_MAP['Business Income']
  }

  if (/unit trust|unitrust/.test(d))                                   return CATEGORY_MAP['Investment']
  if (/kplc|kenya power/.test(d))                                       return CATEGORY_MAP['Utilities']
  if (/nairobi water|nawasco/.test(d))                                  return CATEGORY_MAP['Utilities']
  if (/zuku|faiba|mtaa yangu|safaricom home/.test(d))                   return CATEGORY_MAP['Utilities']
  if (/safaricom offers|bundle purchase|airtime purchase/.test(d))      return CATEGORY_MAP['Airtime & Data']
  if (/globalpay|claude|pesa globalpay/.test(d))                        return CATEGORY_MAP['Entertainment']
  if (/netflix|showmax|dstv|spotify|direct pay|pesapal/.test(d))        return CATEGORY_MAP['Entertainment']
  if (/naivas|kahawa west|clean shelf|quickmart|carrefour/.test(d))     return CATEGORY_MAP['Groceries']
  if (/butchery|samosa|java house|kfc|restaurant|royal ventures/.test(d)) return CATEGORY_MAP['Dining Out']
  if (/uber|bolt|little cab/.test(d))                                   return CATEGORY_MAP['Transport']
  if (/standard chartered|c2b|co-op|onafriq/.test(d))                  return CATEGORY_MAP['Savings Transfer']

  const cat = tx.category.toLowerCase()
  if (cat.includes('investment'))    return CATEGORY_MAP['Investment']
  if (cat.includes('groceries'))     return CATEGORY_MAP['Groceries']
  if (cat.includes('dining'))        return CATEGORY_MAP['Dining Out']
  if (cat.includes('airtime'))       return CATEGORY_MAP['Airtime & Data']
  if (cat.includes('utilities'))     return CATEGORY_MAP['Utilities']
  if (cat.includes('transport'))     return CATEGORY_MAP['Transport']
  if (cat.includes('entertainment')) return CATEGORY_MAP['Entertainment']

  return CATEGORY_MAP['Other']
}

function fmt(n: number) {
  return n.toLocaleString('en-KE', { minimumFractionDigits: 2 })
}

export default function MpesaImport({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<Step>('upload')
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a PDF file')
      return
    }
    setError('')
    setParsing(true)
    try {
      const txns = await parseMpesaPDF(file)
      const clean = txns.filter(t => !t.is_charge)
      setTransactions(clean)
      setSelected(new Set(clean.map((_, i) => i)))
      setStep('preview')
    } catch (e) {
      console.error(e)
      setError('Could not read this PDF. Make sure it is a Safaricom M-PESA statement.')
    }
    setParsing(false)
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function updateCategory(i: number, cat: string) {
    setTransactions(prev => prev.map((t, idx) => idx === i ? { ...t, category: cat } : t))
  }

  async function handleImport() {
    setStep('saving')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const toImport = transactions.filter((_, i) => selected.has(i))
    let saved = 0

    for (const tx of toImport) {
      const isIncome = tx.paid_in > 0
      const dbType = isIncome ? 'income' : 'expense'
      const amount = isIncome ? tx.paid_in : tx.true_cost
      const categoryId = getCategoryId(tx)

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: dbType,
        amount,
        category_id: categoryId,
        description: tx.merchant || tx.details.slice(0, 80),
        transaction_date: tx.date,
        mpesa_transaction_id: tx.receipt_no,
        mpesa_balance: tx.balance,
        notes: tx.fee > 0 ? `Fee KES ${tx.fee}` : null,
        source: 'mpesa_import',
        needs_review: tx.category === '❓ Other',
        confidence_score: tx.category === '❓ Other' ? 0.3 : 0.9,
      })

      saved++
      setProgress(Math.round((saved / toImport.length) * 100))
    }

    setStep('done')
    setTimeout(() => onSuccess(), 1500)
  }

  if (step === 'upload') {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end md:items-center md:justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md p-6">
          <div className="flex justify-center mb-4 md:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F1F3D]">Import M-PESA</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upload your Safaricom statement PDF</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-100 transition-all mb-4"
          >
            {parsing ? (
              <>
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <p className="text-sm font-bold text-blue-600">Reading your statement...</p>
                <p className="text-xs text-blue-400 mt-1">This takes a few seconds</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">📄</div>
                <p className="text-sm font-bold text-[#0F1F3D]">Tap to upload PDF</p>
                <p className="text-xs text-gray-400 mt-1">Safaricom M-PESA Full Statement</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-red-600 text-xs font-medium">⚠️ {error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">How to get your statement</p>
            <div className="space-y-1.5">
              {['Open MySafaricom app', 'Go to M-PESA → Statements', 'Select date range → Download PDF', 'Upload the PDF here'].map((s, i) => (
                <p key={i} className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                  {s}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'preview') {
    const sel = transactions.filter((_, i) => selected.has(i))
    const totalIn  = sel.filter(t => t.paid_in > 0).reduce((s, t) => s + t.paid_in, 0)
    const totalOut = sel.filter(t => t.withdrawal > 0).reduce((s, t) => s + t.true_cost, 0)

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-white md:items-center md:justify-center md:bg-black/50 md:backdrop-blur-sm">
        <div className="w-full h-full flex flex-col md:max-w-2xl md:h-[90vh] md:rounded-3xl md:overflow-hidden md:bg-white md:shadow-2xl">

          <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setStep('upload')} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">←</button>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-[#0F1F3D]">Review Transactions</p>
              <p className="text-xs text-gray-400">{selected.size} of {transactions.length} selected</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
          </div>

          <div className="bg-gradient-to-r from-[#0F1F3D] to-[#1A3A6C] px-4 py-3 grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="text-center">
              <p className="text-white/40 text-[10px] uppercase tracking-wide">Selected</p>
              <p className="text-white font-extrabold text-sm">{selected.size} txns</p>
            </div>
            <div className="text-center">
              <p className="text-emerald-400/70 text-[10px] uppercase tracking-wide">Total In</p>
              <p className="text-emerald-400 font-extrabold text-sm">+{fmt(totalIn)}</p>
            </div>
            <div className="text-center">
              <p className="text-red-400/70 text-[10px] uppercase tracking-wide">Total Out</p>
              <p className="text-red-400 font-extrabold text-sm">-{fmt(totalOut)}</p>
            </div>
          </div>

          <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-400">Tap row to deselect. Tap category to edit.</p>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set(transactions.map((_, i) => i)))} className="text-xs font-bold text-blue-600">All</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setSelected(new Set())} className="text-xs font-bold text-gray-400">None</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {transactions.map((tx, i) => {
              const isSelected = selected.has(i)
              const isEditing = editingIdx === i
              const isIncome = tx.paid_in > 0
              return (
                <div key={i} className={`px-4 py-3 border-b border-gray-50 transition-all ${isSelected ? 'bg-white' : 'bg-gray-50 opacity-50'}`}>
                  <div className="flex items-start gap-3" onClick={() => toggleSelect(i)}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#0F1F3D] truncate leading-tight">{tx.merchant}</p>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-[13px] font-extrabold ${isIncome ? 'text-emerald-600' : 'text-[#0F1F3D]'}`}>
                            {isIncome ? '+' : '-'}KES {fmt(isIncome ? tx.paid_in : tx.true_cost)}
                          </p>
                          {tx.fee > 0 && <p className="text-[10px] text-red-400">incl. KES {tx.fee} fee</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-gray-400">{tx.date} · {tx.time.slice(0, 5)}</p>
                        <span className="text-gray-200">·</span>
                        <p className="text-[10px] text-gray-400 font-mono">{tx.receipt_no}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-8 mt-1.5">
                    {isEditing ? (
                      <select
                        autoFocus
                        value={tx.category}
                        onChange={e => { updateCategory(i, e.target.value); setEditingIdx(null) }}
                        onBlur={() => setEditingIdx(null)}
                        className="text-xs border border-blue-300 rounded-lg px-2 py-1 bg-white text-[#0F1F3D] font-semibold outline-none"
                      >
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setEditingIdx(i) }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        {tx.category} ✏️
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-4 border-t border-gray-100 bg-white flex-shrink-0">
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-40 shadow-lg shadow-blue-200"
            >
              ✅ Import {selected.size} Transactions
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'saving') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 w-72 text-center shadow-2xl">
          <div className="text-5xl mb-4 animate-bounce">⏳</div>
          <p className="text-base font-extrabold text-[#0F1F3D] mb-1">Importing...</p>
          <p className="text-xs text-gray-400 mb-4">Saving your transactions</p>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{progress}% complete</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-72 text-center shadow-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-base font-extrabold text-[#0F1F3D] mb-1">Import Complete!</p>
        <p className="text-xs text-gray-400">Your transactions are now in WealthOS</p>
      </div>
    </div>
  )
}