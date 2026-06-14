'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { usePin } from '@/lib/hooks/usePin'

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hasPin } = usePin()
  useEffect(() => { if (!hasPin()) router.replace('/') }, [hasPin, router])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
