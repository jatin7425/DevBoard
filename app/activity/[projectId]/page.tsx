'use client'
import React from 'react'
import { ActivityView } from '@/components/activity/ActivityView'

interface ActivityPageProps {
  params: {
    projectId: string;
  };
}

export default function ActivityPage({ params }: ActivityPageProps) {
  return <ActivityView projectId={params.projectId} />;
}
