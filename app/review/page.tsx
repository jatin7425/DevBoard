'use client'
import React from 'react'
import { ReviewView } from '@/components/review/ReviewView'
import { useAppLayout } from '@/components/AppLayout'

export default function ReviewPage() {
  const { openTask } = useAppLayout();
  return <ReviewView onOpenTask={openTask} />;
}
