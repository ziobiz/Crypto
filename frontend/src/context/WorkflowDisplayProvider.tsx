'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type HqWorkflowDisplayConfig } from '@/lib/api';

const WorkflowDisplayContext = createContext<HqWorkflowDisplayConfig | null>(null);

export function WorkflowDisplayProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HqWorkflowDisplayConfig | null>(null);

  useEffect(() => {
    api.workflowDisplay().then(setConfig).catch(() => setConfig(null));
  }, []);

  return <WorkflowDisplayContext.Provider value={config}>{children}</WorkflowDisplayContext.Provider>;
}

export function useWorkflowDisplay() {
  return useContext(WorkflowDisplayContext);
}
