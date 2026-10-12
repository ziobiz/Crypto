import { redirect } from 'next/navigation';

/** HQ 단독 메뉴 흡수 → 멤버십관리 허브 */
export default function HqPaidMembershipRedirectPage() {
  redirect('/dashboard/membership-admin/products');
}
