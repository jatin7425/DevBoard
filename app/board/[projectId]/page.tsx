'use client'
import React from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { useAppLayout } from '@/components/AppLayout'

interface BoardPageProps {
  params: {
    projectId: string;
  };
}

export default function BoardPage({ params }: BoardPageProps) {
  const { openTask, moduleId, pending, clearPending } = useAppLayout();
  
  return (
    <KanbanBoard 
      projectId={params.projectId} 
      moduleId={moduleId} 
      onOpenTask={openTask} 
      pendingNewTask={pending.newTask} 
      clearPending={() => clearPending('newTask')} 
    />
  );
}
