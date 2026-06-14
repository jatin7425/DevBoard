'use client'
import React from 'react'
import { SprintView } from '@/components/sprint/SprintView'
import { useAppLayout } from '@/components/AppLayout'

interface SprintPageProps {
  params: {
    projectId: string;
  };
}

export default function SprintPage({ params }: SprintPageProps) {
  const { openTask } = useAppLayout();
  return <SprintView projectId={params.projectId} onOpenTask={openTask} />;
}
