// src/lib/mpesaParser.ts
// M-PESA Statement Parser for WealthOS
// Handles real Safaricom PDF statement format

import * as pdfjsLib from 'pdfjs-dist'

// Point to the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

export type MpesaTransaction = {
  receipt_no: string
  date: string          // YYYY-MM-DD
  time: string          // HH:MM:SS
  details: string       // raw details text
  status: string
  paid_in: number
  withdrawal: number
  balance: number
  fee: number           // merged from charge line
  true_cost: number     // withdrawal + fee
  category: string      // auto-detected
  subcategory: string
  type: 'income' | 'expense' | 'investment' | 'transfer'
  merchant: string      // cleaned merchant name
  is_charge: boolean    // true if this is a fee line (hidden from UI)
}

// ── AUTO-CATEGORIZATION RULES ─────────────────────
// Based on Francis's real M-PESA statement patterns
const CATEGORY_RULES: { pattern: RegExp; category: string; subcategory: string; type: MpesaTransaction['type'] }[] = [
  // INVESTMENTS — must come before income catch-alls
  { pattern: /unit trust invest/i,             category: '📈 Investment',   subcategory: 'Ziidi Deposit',     type: 'investment' },
  { pattern: /unit trust withdraw/i,           category: '📈 Investment',   subcategory: 'Ziidi Withdrawal',  type: 'investment' },
  { pattern: /ziidi/i,                         category: '📈 Investment',   subcategory: 'Ziidi MMF',         type: 'investment' },

  // INCOME
  { pattern: /funds received from/i,           category: '💰 Income',       subcategory: 'Received Money',    type: 'income' },
  { pattern: /b2c payment/i,                   category: '💼 Income',       subcategory: 'Salary / Business', type: 'income' },
  { pattern: /business payment from/i,         category: '💼 Income',       subcategory: 'Salary / Business', type: 'income' },

  // UTILITIES & BILLS
  { pattern: /kplc/i,                          category: '💡 Utilities',    subcategory: 'Electricity',       type: 'expense' },
  { pattern: /nairobi water/i,                 category: '💧 Utilities',    subcategory: 'Water',             type: 'expense' },
  { pattern: /nawasco/i,                       category: '💧 Utilities',    subcategory: 'Water',             type: 'expense' },
  { pattern: /zuku/i,                          category: '📡 Internet',     subcategory: 'Zuku WiFi',         type: 'expense' },
  { pattern: /faiba/i,                         category: '📡 Internet',     subcategory: 'Faiba Internet',    type: 'expense' },
  { pattern: /mtaa yangu/i,                    category: '📡 Internet',     subcategory: 'Local Internet',    type: 'expense' },
  { pattern: /safaricom home/i,                category: '📡 Internet',     subcategory: 'Safaricom Home',    type: 'expense' },

  // DATA & AIRTIME
  { pattern: /bundle purchase/i,               category: '📱 Airtime',      subcategory: 'Data Bundles',      type: 'expense' },
  { pattern: /airtime purchase/i,              category: '📱 Airtime',      subcategory: 'Airtime',           type: 'expense' },
  { pattern: /safaricom offers/i,              category: '📱 Airtime',      subcategory: 'Bundles / Offers',  type: 'expense' },

  // SUBSCRIPTIONS
  { pattern: /claude\.ai/i,                    category: '💻 Subscriptions', subcategory: 'Claude AI',        type: 'expense' },
  { pattern: /globalpay/i,                     category: '💻 Subscriptions', subcategory: 'Online Payment',   type: 'expense' },
  { pattern: /direct pay/i,                    category: '💻 Subscriptions', subcategory: 'Online Payment',   type: 'expense' },
  { pattern: /pesapal/i,                       category: '💻 Subscriptions', subcategory: 'Online Payment',   type: 'expense' },
  { pattern: /netflix/i,                       category: '🎬 Entertainment', subcategory: 'Netflix',          type: 'expense' },
  { pattern: /showmax/i,                       category: '🎬 Entertainment', subcategory: 'Showmax',          type: 'expense' },
  { pattern: /dstv/i,                          category: '🎬 Entertainment', subcategory: 'DStv',             type: 'expense' },
  { pattern: /spotify/i,                       category: '🎬 Entertainment', subcategory: 'Spotify',          type: 'expense' },

  // GROCERIES & SUPERMARKETS
  { pattern: /naivas/i,                        category: '🛒 Groceries',    subcategory: 'Naivas',            type: 'expense' },
  { pattern: /clean shelf/i,                   category: '🛒 Groceries',    subcategory: 'Clean Shelf',       type: 'expense' },
  { pattern: /kahawa west/i,                   category: '🛒 Groceries',    subcategory: 'Clean Shelf',       type: 'expense' },
  { pattern: /quickmart/i,                     category: '🛒 Groceries',    subcategory: 'Quickmart',         type: 'expense' },
  { pattern: /carrefour/i,                     category: '🛒 Groceries',    subcategory: 'Carrefour',         type: 'expense' },
  { pattern: /chandarana/i,                    category: '🛒 Groceries',    subcategory: 'Chandarana',        type: 'expense' },
  { pattern: /supermarket/i,                   category: '🛒 Groceries',    subcategory: 'Supermarket',       type: 'expense' },

  // FOOD & DINING
  { pattern: /java house/i,                    category: '🍽️ Dining',       subcategory: 'Java House',        type: 'expense' },
  { pattern: /kfc/i,                           category: '🍽️ Dining',       subcategory: 'KFC',               type: 'expense' },
  { pattern: /chicken inn/i,                   category: '🍽️ Dining',       subcategory: 'Chicken Inn',       type: 'expense' },
  { pattern: /butchery/i,                      category: '🍽️ Dining',       subcategory: 'Butchery',          type: 'expense' },
  { pattern: /samosa/i,                        category: '🍽️ Dining',       subcategory: 'Food',              type: 'expense' },
  { pattern: /restaurant/i,                    category: '🍽️ Dining',       subcategory: 'Restaurant',        type: 'expense' },
  { pattern: /royal ventures/i,                category: '🍽️ Dining',       subcategory: 'Food & Drinks',     type: 'expense' },

  // TRANSPORT
  { pattern: /uber/i,                          category: '🚗 Transport',    subcategory: 'Uber',              type: 'expense' },
  { pattern: /bolt/i,                          category: '🚗 Transport',    subcategory: 'Bolt',              type: 'expense' },
  { pattern: /little cab/i,                    category: '🚗 Transport',    subcategory: 'Little Cab',        type: 'expense' },

  // BANK TRANSFERS
  { pattern: /co-operative bank|co operative/i, category: '🏦 Banking',    subcategory: 'Co-op Bank',        type: 'transfer' },
  { pattern: /standard chartered/i,            category: '🏦 Banking',      subcategory: 'Stanchart',         type: 'transfer' },
  { pattern: /equity bank/i,                   category: '🏦 Banking',      subcategory: 'Equity Bank',       type: 'transfer' },
  { pattern: /kcb/i,                           category: '🏦 Banking',      subcategory: 'KCB',               type: 'transfer' },
  { pattern: /absa/i,                          category: '🏦 Banking',      subcategory: 'Absa Bank',         type: 'transfer' },
  { pattern: /ncba/i,                          category: '🏦 Banking',      subcategory: 'NCBA',              type: 'transfer' },
  { pattern: /chabrin/i,                       category: '🏦 Banking',      subcategory: 'Bank Transfer',     type: 'transfer' },
  { pattern: /onafriq/i,                       category: '🌍 Transfer',     subcategory: 'International',     type: 'transfer' },
  { pattern: /c2b/i,                           category: '🏦 Banking',      subcategory: 'Bank Transfer',     type: 'transfer' },

  // DEBT REPAYMENT
  { pattern: /fuliza/i,                        category: '💳 Debt',         subcategory: 'Fuliza Repayment',  type: 'expense' },
  { pattern: /kcb mpesa/i,                     category: '💳 Debt',         subcategory: 'KCB M-PESA Loan',  type: 'expense' },

  // SEND MONEY — catch-alls at the end
  { pattern: /customer transfer to/i,          category: '👤 Send Money',   subcategory: 'Person Transfer',   type: 'expense' },
  { pattern: /customer payment to small business/i, category: '🏪 Buy Goods', subcategory: 'Small Business', type: 'expense' },
  { pattern: /merchant payment/i,              category: '🏪 Buy Goods',    subcategory: 'Merchant',          type: 'expense' },
  { pattern: /pay bill/i,                      category: '📄 Bills',        subcategory: 'Bill Payment',      type: 'expense' },
]

// Charge/fee line patterns
const CHARGE_PATTERNS = [
  /customer transfer of funds charge/i,
  /pay bill charge/i,
  /withdrawal charge/i,
  /transaction cost/i,
  /charge/i,
]

function isChargeLine(details: string): boolean {
  return CHARGE_PATTERNS.some(p => p.test(details))
}

function categorize(details: string): Pick<MpesaTransaction, 'category' | 'subcategory' | 'type'> {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(details)) {
      return { category: rule.category, subcategory: rule.subcategory, type: rule.type }
    }
  }
  return { category: '❓ Other', subcategory: 'Uncategorized', type: 'expense' }
}

function extractMerchant(details: string): string {
  // "Pay Bill Online to 888880 - KPLC PREPAID Acc. 22010324501" → "KPLC PREPAID"
  // "Merchant Payment Online to 867318 - CLEAN SHELF SUPERMARKETS" → "CLEAN SHELF SUPERMARKETS"
  // "Customer Transfer to 254702***251 - DAVID NJOROGE NJUGUNA" → "DAVID NJOROGE NJUGUNA"
  // "Funds received from 0794***675 - FRANCIS MUTUA MUSEMBI" → "FRANCIS MUTUA MUSEMBI"

  const dashMatch = details.match(/[-–]\s*([A-Z0-9][^-\n]+?)(?:\s+Acc\..*)?$/i)
  if (dashMatch) return dashMatch[1].trim()

  if (/airtime purchase/i.test(details)) return 'Airtime'
  if (/bundle purchase/i.test(details)) return 'Data Bundle'
  if (/unit trust/i.test(details)) return 'Ziidi MMF'

  return details.slice(0, 40)
}

function parseAmount(val: string): number {
  return parseFloat(val.replace(/,/g, '').trim()) || 0
}


// ── MAIN PARSER FUNCTION ──────────────────────────
export async function parseMpesaPDF(file: File): Promise<MpesaTransaction[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  // Extract all text from all pages
  const allLines: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item: any) => item.str).join(' ')
    allLines.push(pageText)
  }

  const fullText = allLines.join(' ')

  // Split into tokens and reconstruct rows
  // M-PESA receipt numbers start with U followed by alphanumeric chars
  const receiptPattern = /\b(U[A-Z0-9]{9,12})\b/g
  const receipts: string[] = []
  let match
  while ((match = receiptPattern.exec(fullText)) !== null) {
    receipts.push(match[1])
  }

  // Parse rows by splitting on receipt number boundaries
  const rows: MpesaTransaction[] = []
  const rawRows = fullText.split(/(?=\bU[A-Z0-9]{9,12}\b)/).filter(s => s.trim().length > 10)

  for (const row of rawRows) {
    const receiptMatch = row.match(/^(U[A-Z0-9]{9,12})/)
    if (!receiptMatch) continue

    const receipt_no = receiptMatch[1]

    // Extract datetime: pattern "2026-01-18 21:38:40"
    const dtMatch = row.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/)
    if (!dtMatch) continue
    const date = dtMatch[1]
    const time = dtMatch[2]

    // Extract status
    const statusMatch = row.match(/COMPLETED|FAILED|CANCELLED/i)
    const status = statusMatch ? statusMatch[0] : 'COMPLETED'

    // Extract numbers — last 3 numbers in the row are paid_in, withdrawal, balance
    const numbers = row.match(/[\d,]+\.\d{2}/g) || []
    if (numbers.length < 3) continue

    const balance  = parseAmount(numbers[numbers.length - 1])
    const withdrawal = parseAmount(numbers[numbers.length - 2])
    const paid_in  = parseAmount(numbers[numbers.length - 3])

    // Extract details — text between datetime and COMPLETED/status
    const detailsMatch = row.match(/\d{2}:\d{2}:\d{2}\s+(.+?)\s+(?:COMPLETED|FAILED|CANCELLED)/i)
    const details = detailsMatch ? detailsMatch[1].trim() : row.slice(20, 80).trim()

    const is_charge = isChargeLine(details)
    const { category, subcategory, type } = categorize(details)
    const merchant = extractMerchant(details)

    rows.push({
      receipt_no, date, time, details, status,
      paid_in, withdrawal, balance,
      fee: 0, true_cost: withdrawal,
      category, subcategory, type,
      merchant, is_charge,
    })
  }

  // ── MERGE FEES into parent transactions ──────────
  // Group by receipt_no, then attach charge lines to main lines
  const grouped = new Map<string, MpesaTransaction[]>()
  for (const row of rows) {
    if (!grouped.has(row.receipt_no)) grouped.set(row.receipt_no, [])
    grouped.get(row.receipt_no)!.push(row)
  }

  const merged: MpesaTransaction[] = []
  for (const [, group] of grouped) {
    const chargeLines = group.filter(r => r.is_charge)
    const mainLines   = group.filter(r => !r.is_charge)

    const totalFee = chargeLines.reduce((s, r) => s + r.withdrawal, 0)

    for (const main of mainLines) {
      main.fee = totalFee
      main.true_cost = main.withdrawal + totalFee
      merged.push(main)
    }

    // If ALL lines in group are charges (edge case), keep them
    if (mainLines.length === 0) {
      for (const c of chargeLines) merged.push(c)
    }
  }

  // Sort by date descending
  merged.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))

  return merged
}