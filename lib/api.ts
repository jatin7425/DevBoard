'use client'

function getPin(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('devboard_pin') || ''
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-devboard-pin': getPin(),
      ...(options.headers || {}),
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('devboard_pin')
    window.location.href = '/'
  }
  return res
}
