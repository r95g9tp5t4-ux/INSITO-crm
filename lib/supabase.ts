import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Company = {
  id: string
  name: string
  type: string | null
  sector: string | null
  website: string | null
  notes: string | null
  created_at: string
}

export type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string | null
  status: string
  company_id: string | null
  notes: string | null
  created_at: string
  companies?: Company
}

export type Interaction = {
  id: string
  contact_id: string
  type: string
  title: string
  content: string | null
  fyxer_summary: string | null
  direction: string | null
  date: string
  created_at: string
  contacts?: Contact
}

export type Task = {
  id: string
  contact_id: string | null
  company_id: string | null
  title: string
  description: string | null
  due_date: string | null
  status: string
  priority: string
  created_at: string
  contacts?: Contact
  companies?: Company
}
