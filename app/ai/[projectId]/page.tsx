'use client'
import React from 'react'
import { AIView } from '@/components/ai/AIView'

interface AIPageProps {
  params: {
    projectId: string;
  };
}

export default function AIPage({ params }: AIPageProps) {
  return <AIView projectId={params.projectId} />;
}
