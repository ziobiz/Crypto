import { prisma } from '../lib/prisma';
import {
  HQ_CONFIG_KEYS,
  computeExpectedCompleteAt,
  defaultWorkflowDisplay,
  normalizeWorkflowDisplay,
  type HqWorkflowDisplayConfig,
} from '../constants/hq-policy';

export async function getWorkflowDisplay(): Promise<HqWorkflowDisplayConfig> {
  const row = await prisma.systemConfig.findUnique({
    where: { key: HQ_CONFIG_KEYS.workflowDisplay },
  });
  return normalizeWorkflowDisplay((row?.value as HqWorkflowDisplayConfig | null) ?? null);
}

export async function expectedCompleteIso(createdAt: Date): Promise<string> {
  const cfg = await getWorkflowDisplay();
  return computeExpectedCompleteAt(createdAt, cfg.sla).toISOString();
}
