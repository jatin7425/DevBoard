'use client'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { useAppLayout } from '@/components/AppLayout'

export default function Home() {
  const { openTask, openProject, nav } = useAppLayout();
  return (
    <DashboardView 
      onOpenTask={openTask} 
      onOpenProject={openProject} 
      onNav={(v: string) => nav(v, { project: "all" })} 
    />
  );
}
