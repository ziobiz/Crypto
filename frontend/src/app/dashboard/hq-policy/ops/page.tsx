import { redirect } from 'next/navigation';

export default function HqOpsIndexPage() {
  redirect('/dashboard/hq-policy/ops/change-history');
}
