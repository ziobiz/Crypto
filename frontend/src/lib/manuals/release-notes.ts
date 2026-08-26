import type { PlatformReleaseNote } from './version';

/** 본사정책 → 운영관리 → 업데이트 내용 (PG 플랫폼 업데이트와 동일 형식) */
export const PLATFORM_RELEASE_NOTES: PlatformReleaseNote[] = [
  {
    version: '2.4',
    kind: 'minor',
    date: '2026-08-15',
    items: {
      KR: [
        '브라우저 탭 이름: 로그인·로그인 후 모두 브랜드 카드 사이트 이름 사용. 별도 「브라우저 탭 이름」을 적으면 그 값이 표시',
        '고객 입금 수취 계좌: 통화별 이체거래·카드결제를 따로 켜고 끔. 끄면 해당 통화의 USDT 매입을 그 방식으로 진행할 수 없음',
        '사용자관리 비밀번호 초기화: 이메일 아이디+1! 임시 비밀번호, 다음 로그인 시 새 비밀번호 설정. OTP 초기화는 시크릿을 지워 다음 로그인에서 OTP를 다시 등록',
        '이용메뉴얼(총본사·조직·고객) V2.4',
      ],
      US: [
        'Browser tab: login and post-login use the brand site name. Optional tab-title field overrides it',
        'Deposit accounts: enable/disable bank transfer and card payment per currency. Disabled currencies cannot be used for that USDT method',
        'User password reset: temporary password = email ID + 1!; next login requires a new password. OTP reset clears the secret so the user re-enrolls at next login',
        'Usage manuals V2.4 (HQ, org, customer)',
      ],
      JP: [
        'ブラウザタブ: ログイン前後ともブランドのサイト名。任意のタブ名を入れるとその値を表示',
        '入金受取口座: 通貨ごとに振込とカード決済を個別ON/OFF。OFFの通貨では当該方法のUSDT購入不可',
        'パスワード初期化: メールID+1! の仮パスワード。次回ログインで新パスワード設定。OTP初期化は秘密鍵を消し次回に再登録',
        '利用マニュアル V2.4',
      ],
      CH: [
        '浏览器标签：登录前后均使用品牌站点名称。可另填标签名称覆盖',
        '入金收款账户：按币种分别开关转账与卡支付。关闭后无法用该方式购买该币种 USDT',
        '密码初始化：临时密码为邮箱ID+1!，下次登录须设新密码。OTP 初始化会清除密钥，下次登录需重新绑定',
        '使用手册 V2.4',
      ],
      TH: [
        'แท็บเบราว์เซอร์: ก่อน/หลังเข้าสู่ระบบใช้ชื่อไซต์บนการ์ดแบรนด์ ใส่ชื่อแท็บแยกได้',
        'บัญชีรับเงิน: เปิด/ปิดโอนและบัตรแยกตามสกุล ปิดแล้วซื้อ USDT วิธีนั้นในสกุลนั้นไม่ได้',
        'รีเซ็ตรหัสผ่าน: รหัสชั่วคราว = ID อีเมล+1! เข้าสู่ระบบครั้งถัดไปต้องตั้งรหัสใหม่ รีเซ็ต OTP ลบรหัสลับ ต้องลงทะเบียนใหม่',
        'คู่มือใช้งาน V2.4',
      ],
    },
  },
  {
    version: '2.3',
    kind: 'minor',
    date: '2026-08-15',
    items: {
      KR: [
        '고객 업무 시작 순서: 회원가입 → 인증센터 서류 → 인증패스 → 지갑 → USDT 시뮬레이터 → 매입·에스크로',
        'USDT 시뮬레이터: 네트워크 필수, 최근 결과 3건(대시보드 미리보기는 2건). 본사는 본사정책 아래 시뮬레이터·기록 시뮬레이터',
        '거래분석(구 원가분석)·수익분석 추가. 중계 입금·수령 USDT 수기, 매입 건 중계 USDT와 예상 USDT 비교',
        '사용자 역할: 총본사 관리자·일반관리자·Organizer·정산관리자. Organizer는 지정 admin만 부여. 거래·수익 메뉴는 OTP 추가 확인',
        '이용메뉴얼(총본사·조직·고객) V2.3',
      ],
      US: [
        'Customer start order: register → Verification docs → pass → wallet → USDT simulator → purchase/escrow',
        'USDT simulator: network required, last 3 results (dashboard preview shows 2). HQ menus sit under HQ Policy',
        'Trade analysis and profit analysis: manual broker deposit/received USDT; compare broker USDT vs expected USDT per ticket',
        'Staff roles: HQ admin, general admin, Organizer, settlement admin. Only the designated HQ admin can assign Organizer. Extra OTP for trade/profit menus',
        'Usage manuals V2.3 (HQ, org, customer)',
      ],
      JP: [
        '顧客の開始順: 会員登録→認証センター提出→認証パス→ウォレット→USDTシミュレーター→購入・エスクロー',
        'シミュレーター: ネットワーク必須、直近3件（ダッシュボードは2件）。総本社は本社ポリシー配下',
        '取引分析・収益分析を追加。仲介入金・受取USDTは手入力。購入件の仲介USDTと予想USDTを比較',
        '役割: 総本社管理者・一般管理者・Organizer・精算管理者。Organizerは指定adminのみ付与。取引・収益は追加OTP',
        '利用マニュアル V2.3',
      ],
      CH: [
        '客户开工顺序：注册 → 认证中心交件 → 认证通过 → 钱包 → USDT 模拟器 → 采购/托管',
        '模拟器：必须选网络，最近 3 条（仪表盘预览 2 条）。总部菜单位于总部策略下',
        '新增交易分析与收益分析：中介入金与收到的 USDT 手工录入；按票比较中介 USDT 与预计 USDT',
        '角色：总部管理员、普通管理员、Organizer、结算管理员。仅指定总部管理员可授予 Organizer。交易/收益需额外 OTP',
        '使用手册 V2.3',
      ],
      TH: [
        'ลำดับเริ่มงานลูกค้า: สมัคร → ส่งเอกสารศูนย์ยืนยัน → ผ่านการยืนยัน → กระเป๋า → ตัวจำลอง USDT → ซื้อ/เอสโครว์',
        'ตัวจำลอง: ต้องเลือกเครือข่าย ผลล่าสุด 3 รายการ (แดชบอร์ดโชว์ 2) เมนู HQ อยู่ใต้นโยบาย HQ',
        'เพิ่มวิเคราะห์ธุรกรรมและกำไร กรอกยอดโอนให้ตัวกลางและ USDT ที่ได้รับเอง เปรียบเทียบ USDT ตัวกลางกับที่คาดต่อตั๋ว',
        'บทบาท: ผู้ดูแล HQ, ผู้ดูแลทั่วไป, Organizer, ผู้ดูแลการชำระ เฉพาะแอดมินที่กำหนดมอบ Organizer ได้ เมนูวิเคราะห์ต้อง OTP เพิ่ม',
        'คู่มือใช้งาน V2.3',
      ],
    },
  },
  {
    version: '2.2',
    kind: 'minor',
    date: '2026-08-15',
    items: {
      KR: [
        '이용메뉴얼에 6개월 거래 예정 보고서·USDT 신청 체크리스트 양식 첨부',
        '고객·조직(총본사 포함)이 선택한 언어로 엑셀 양식을 내려받을 수 있음',
      ],
      US: [
        'Usage manuals now include the 6-month forecast and USDT application checklist templates',
        'Customers and organizations (including HQ) can download Excel files in the selected language',
      ],
      JP: [
        '利用マニュアルに6か月取引予定報告書・USDT申請チェックリストを添付',
        '顧客・組織（総本社含む）が選択言語のExcel様式をダウンロード可能',
      ],
      CH: [
        '使用手册现可下载 6 个月预估报告与 USDT 申请清单模板',
        '客户与组织（含总部）可按当前语言下载 Excel',
      ],
      TH: [
        'คู่มือใช้งานแนบแบบฟอร์มรายงานคาดการณ์ 6 เดือนและรายการตรวจสอบคำขอ USDT',
        'ลูกค้าและองค์กร (รวม HQ) ดาวน์โหลดไฟล์ Excel ตามภาษาที่เลือกได้',
      ],
    },
  },
  {
    version: '2.1',
    kind: 'minor',
    date: '2026-08-15',
    items: {
      KR: [
        '사용자관리와 고객관리 분리 — 사용자관리는 조직 직원만, 고객관리는 이용 회원',
        '총본사 고객관리에서 업로드 서류 확인 후 인증패스·반려 처리 (인증센터 본사 심사와 통합)',
        '고객 인증 상태 표시: 인증패스 / 비인증 / 심사중 / 반려, 계정 활성·비활성과 함께 관리',
        '인증패스 전에는 USDT 매입·무역 에스크로 신청 불가. 고객은 인증센터에서 서류 1회 제출',
        '이용메뉴얼(총본사·조직·고객)에 고객관리·인증 절차 반영, 라이브 V2.1',
      ],
      US: [
        'Split Users vs Customers — Users = org staff; Customers = end members',
        'HQ Customer management: review uploaded documents then grant verification pass or reject (merged with HQ verification center)',
        'Customer verification states: verified pass / unverified / under review / rejected, plus active/inactive',
        'USDT purchase and trade escrow require verification pass. Customers submit documents once in Verification',
        'HQ, org, and customer manuals updated; live V2.1',
      ],
      JP: [
        'ユーザー管理と顧客管理を分離 — ユーザー管理は組織スタッフ、顧客管理は利用会員',
        '総本社の顧客管理で提出書類を確認し認証パスまたは差戻し（認証センター審査と統合）',
        '認証状態: 認証パス / 未認証 / 審査中 / 差戻し。アカウント有効・無効とあわせて管理',
        '認証パス前はUSDT購入・貿易エスクロー申請不可。顧客は認証センターで書類を1回提出',
        '利用マニュアル（総本社・組織・顧客）に反映、ライブ V2.1',
      ],
      CH: [
        '用户管理与客户管理分开 — 用户管理仅组织员工，客户管理为终端会员',
        '总部客户管理中查看上传文件后给予认证通过或退回（与总部认证中心合并）',
        '认证状态：认证通过 / 未认证 / 审核中 / 已退回，并与启用/停用一并管理',
        '未认证通过前不可申请 USDT 采购与贸易托管。客户在认证中心一次性提交文件',
        '总部、组织、客户手册已更新，直播版本 V2.1',
      ],
      TH: [
        'แยกจัดการผู้ใช้กับจัดการลูกค้า — ผู้ใช้คือพนักงานองค์กร ลูกค้าคือสมาชิกผู้ใช้บริการ',
        'HQ จัดการลูกค้า: เปิดเอกสารที่อัปโหลดแล้วให้ผ่านการยืนยันหรือปฏิเสธ (รวมศูนย์ยืนยันของ HQ)',
        'สถานะยืนยัน: ผ่าน / ยังไม่ยืนยัน / กำลังตรวจสอบ / ถูกปฏิเสธ พร้อมใช้งาน/ปิดใช้งาน',
        'ก่อนผ่านการยืนยันสมัครซื้อ USDT และเอสโครว์ไม่ได้ ลูกค้าส่งเอกสารครั้งเดียวที่ศูนย์ยืนยัน',
        'อัปเดตคู่มือ HQ องค์กร ลูกค้า ไลฟ์ V2.1',
      ],
    },
  },
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
