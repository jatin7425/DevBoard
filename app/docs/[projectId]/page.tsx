'use client'
import React from 'react'
import { DocsView } from '@/components/docs/DocsView'
import { useAppLayout } from '@/components/AppLayout'

interface DocsPageProps {
  params: {
    projectId: string;
  };
}

export default function DocsPage({ params }: DocsPageProps) {
  const { pending, clearPending } = useAppLayout();
  return (
    <DocsView 
      projectId={params.projectId} 
      pendingNewDoc={pending.newDoc}
      clearPending={() => clearPending('newDoc')}
    />
  );
}
