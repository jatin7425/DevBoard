'use client'
export function usePin() {
  const getPin   = () => typeof window !== 'undefined' ? localStorage.getItem('devboard_pin') : null
  const setPin   = (pin: string) => localStorage.setItem('devboard_pin', pin)
  const clearPin = () => localStorage.removeItem('devboard_pin')
  const hasPin   = () => !!getPin()
  return { getPin, setPin, clearPin, hasPin }
}
