import { supabase } from './supabase'

export async function verifyTurnstile(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'verify-turnstile',
      {
        body: { token },
      },
    )
    if (error) return false
    return data?.success === true
  } catch {
    return false
  }
}
