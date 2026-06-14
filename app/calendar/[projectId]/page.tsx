'use client'
import React from 'react'
import { CalendarView } from '@/components/calendar/CalendarView'
import { useAppLayout } from '@/components/AppLayout'

interface CalendarPageProps {
  params: {
    projectId: string;
  };
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const { openTask } = useAppLayout();
  return <CalendarView projectId={params.projectId} onOpenTask={openTask} />;
}
