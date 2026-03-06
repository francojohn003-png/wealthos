import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// DATABASE TYPES
export type Profile = {
  id: string
  full_name: string | null
  phone_number: string | null
  currency: string
  monthly_income: number
  payday: number
  created_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: string
  monthly_budget: number
  is_default: boolean
  created_at: string
}

export type Transaction = {
  id: string
  user_id: string
  category_id: string | null
  transaction_date: string
  description: string
  amount: number
  type: string
  source: string
  mpesa_transaction_id: string | null
  needs_review: boolean
  confidence_score: number
  notes: string | null
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
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

export type LifeEvent = {
  id: string
  user_id: string
  name: string
  emoji: string
  event_date: string
  estimated_cost: number
  actual_cost: number | null
  type: string
  is_recurring: boolean
  is_paid: boolean
  notes: string | null
  created_at: string
}