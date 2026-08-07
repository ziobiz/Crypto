import type { PlatformReleaseNote } from './version';

/** 본사정책 → 운영관리 → 업데이트 내용 (PG 플랫폼 업데이트와 동일 형식) */
export const PLATFORM_RELEASE_NOTES: PlatformReleaseNote[] = [
  {
    version: '2.0',
    kind: 'major',
    date: '2026-07-08',
    items: {
      KR: [
        'USDT 카드 결제(ICOPAY) 연동 — 계좌 이체와 함께 카드 결제 선택, 환불 불가 동의·카드 수수료 적용',
        '운영관리 → 결제관리에서 카드 결제 사용/한도·ICOPAY MID·Bracket Secret 설정',
        '시볼(티켓) 수수료 정책: FX·가스피·송금·기타 수수료를 % 또는 고정(USDT)으로 개별 선택',
        '수수료·비용 도식에서 세팅된 수수료율 노출 사용/미사용 선택',
        '이용메뉴얼(총본사 운영·고객 사용) V2.0 및 버전 관리 체계 도입',
        'USDT/에스크로 목록 CTA: + 신규신청 / + 신규 계약신청 (다국어)',
      ],
      US: [
        'USDT card payment via ICOPAY — bank transfer or card, no-refund waiver, card fee',
        'Ops → Payment: enable card, limits, ICOPAY MID & Bracket Secret',
        'Symbol fee tiers: FX/gas/transfer/other each as % or fixed USDT',
        'Fee diagram: show/hide configured fee rates',
        'Usage manuals (HQ ops & customer) V2.0 with versioning',
        'USDT/escrow CTAs: + New application / + New contract application (i18n)',
      ],
      JP: [
        'USDTカード決済(ICOPAY)連携 — 振込/カード選択、返金不可同意・カード手数料',
        '運営管理→決済管理でカード利用・限度・ICOPAY MID/Bracket Secret設定',
        'シンボル手数料: FX・ガス・送金・その他を%または固定USDTで選択',
        '手数料図の手数料率表示 使用/未使用',
        '利用マニュアル(総本社運営・顧客) V2.0 とバージョン管理',
        'USDT/エスクローCTA: +新規申請 / +新規契約申請（多言語）',
      ],
      CH: [
        'USDT 卡支付（ICOPAY）— 转账/刷卡、不可退款同意、卡费',
        '运营管理→支付管理：开关/限额/ICOPAY MID 与 Bracket Secret',
        '票种手续费：FX/Gas/汇款/其他可选 % 或固定 USDT',
        '手续费图示可开关费率列',
        '使用手册（总部运营·客户）V2.0 与版本管理',
        'USDT/托管 CTA：+新申请 / +新合同申请（多语言）',
      ],
      TH: [
        'ชำระ USDT ด้วยบัตร (ICOPAY) — โอน/บัตร, ยอมรับไม่คืนเงิน, ค่าธรรมเนียมบัตร',
        'Ops → Payment: เปิดบัตร, วงเงิน, MID และ Bracket Secret',
        'ค่าธรรมเนียมตั๋ว: FX/แก๊ส/โอน/อื่นๆ เลือก % หรือ USDT คงที่',
        'แผนภาพค่าธรรมเนียม: แสดง/ซ่อนอัตรา',
        'คู่มือใช้งาน (สำนักงานใหญ่·ลูกค้า) V2.0 และการจัดการเวอร์ชัน',
        'ปุ่ม USDT/เอสโครว์: +สมัครใหม่ / +สมัครสัญญาใหม่ (หลายภาษา)',
      ],
    },
  },
];
