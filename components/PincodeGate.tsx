'use client'
import { useRef, useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { usePin } from '@/lib/hooks/usePin'

export function PincodeGate() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { setPin } = usePin()

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    setError(false)
    if (value && index < 5) refs.current[index + 1]?.focus()
    if (newDigits.every(d => d !== '') && value) submit(newDigits.join(''))
  }

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
  }

  const submit = async (pin: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (res.ok) { setPin(pin); router.push('/projects') }
      else {
        setError(true); setShake(true)
        setDigits(['', '', '', '', '', ''])
        refs.current[0]?.focus()
        setTimeout(() => setShake(false), 500)
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">D</div>
          <span className="text-white font-bold text-2xl tracking-tight">DevBoard</span>
        </div>

        <p className="text-gray-500 text-sm mb-8">Enter your 6-digit pincode</p>

        <div className={`flex gap-3 justify-center mb-6 ${shake ? 'animate-pulse' : ''}`}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-white/5 text-white outline-none transition-all
                ${error ? 'border-red-500 bg-red-500/10' : digit ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 focus:border-indigo-500'}`}
              autoFocus={i === 0}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg">
            Wrong pincode. Try again.
          </div>
        )}
        {loading && <p className="text-gray-600 text-sm mt-3">Verifying...</p>}
      </div>
    </div>
  )
}
