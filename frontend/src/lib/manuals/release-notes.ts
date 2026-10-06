import type { PlatformReleaseNote } from './version';

/** 본사정책 → 검증관리 → 업데이트 내용 (PG 플랫폼 업데이트와 동일 형식) */
export const PLATFORM_RELEASE_NOTES: PlatformReleaseNote[] = [
  {
    version: '2.6.205',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: [
        '카드결제: 희망 USDT=시볼+카드수수료 역산 안내 강화. 구매자 영문 성/이름 분리·파스텔 블루 카드. 전화번호는 폼 입력 우선(프로필 미등록 오류 수정). 카드번호는 ICOPAY에서 입력.',
      ],
      US: [
        'Card pay: clearer target-USDT reverse quote (symbol+card fees). English first/last name, pastel-blue buyer card. Phone from form (fixes profile-missing error). PAN on ICOPAY only.',
      ],
      JP: [
        'カード決済: 希望USDTはシンボル+カード手数料を逆算と明示。英字名・姓分離・パステル青カード。電話はフォーム優先。カード番号はICOPAYのみ。',
      ],
      CH: [
        '卡支付：希望到账 USDT 明确含交易对+卡费反算。英文名/姓分栏、淡蓝信息卡。电话优先表单。卡号仅在 ICOPAY 输入。',
      ],
      TH: [
        'ชำระบัตร: เป้าหมาย USDT รวมค่าสัญลักษณ์+ค่าบัตร แยกชื่อ·นามสกุลอังกฤษ การ์ดฟ้าพาสเทล โทรจากฟอร์ม เลขบัตรที่ ICOPAY เท่านั้น',
      ],
    },
  },
  {
    version: '2.6.204',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: [
        '기준가 exchangerate_api: USD→법정통화 × USDT/USD로 보정. EUR·CNY·USD에서 USDT 디페그 시 과지급(손실) 방지. 김프/로컬 프리미엄 이론가는 FX 원본 유지.',
      ],
      US: [
        'exchangerate_api base rate: FX × USDT/USD. Prevents over-delivering USDT on EUR/CNY/USD when USDT depegs. Local-premium fair rate still uses raw FX.',
      ],
      JP: [
        '基準価 exchangerate_api: FX×USDT/USDで補正。EUR・CNY・USDでUSDT乖離時の過交付(損失)を防止。ローカルプレミアム理論値はFX原値を維持。',
      ],
      CH: [
        '基准价 exchangerate_api：FX×USDT/USD 校正。EUR/CNY/USD 在 USDT 脱锚时防过量交付。本地溢价理论价仍用原始 FX。',
      ],
      TH: [
        'อัตรา exchangerate_api: FX×USDT/USD กันจ่าย USDT เกินเมื่อหลุดเป็ก EUR/CNY/USD ทฤษฎีพรีเมียมท้องถิ่นยังใช้ FX ดิบ',
      ],
    },
  },
  {
    version: '2.6.203',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: [
        '서비스관리: 「이용 가능 서비스」 그룹 헤더 제거. 통화·이체·송금·카드를 한 줄 헤더로 정리.',
      ],
      US: [
        'Service management: Removed “Available services” group header. Single header row: Currency · Transfer · Remittance · Card.',
      ],
      JP: [
        'サービス管理: 「利用可能サービス」グループ見出しを削除。通貨・振込・送金・カードを1行ヘッダーに整理。',
      ],
      CH: [
        '服务管理：移除「可用服务」分组表头。币种·转账·汇款·卡单行表头。',
      ],
      TH: [
        'จัดการบริการ: ลบหัวกลุ่ม「บริการที่ใช้ได้」 หัวแถวเดียว: สกุลเงิน·โอน·โอนเงิน·บัตร',
      ],
    },
  },
  {
    version: '2.6.202',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: [
        '서비스관리 UI: 개인/법인 제목을 테이블 밖 왼쪽에 표시(배경 없음). 표준 pg-table 칸선·교차 행 배경. 헤더 굵기 통일.',
      ],
      US: [
        'Service management UI: Individual/Corporate titles outside the table (no background). Standard pg-table cell borders and zebra rows. Unified header weight.',
      ],
      JP: [
        'サービス管理UI: 個人/法人タイトルを表外左に表示（背景なし）。標準pg-tableの罫線・交互行。ヘッダー太さ統一。',
      ],
      CH: [
        '服务管理 UI：个人/企业标题在表外左侧（无底色）。标准 pg-table 格线与斑马行。表头字重统一。',
      ],
      TH: [
        'UI จัดการบริการ: หัวข้อบุคคล/นิตินอกตารางซ้าย (ไม่มีพื้น) เส้นช่อง·แถวสลับแบบ pg-table น้ำหนักหัวตารางเท่ากัน',
      ],
    },
  },
  {
    version: '2.6.201',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: [
        '서비스관리: 개인·법인을 한 화면 좌우 배치. 활성/비활성 드롭다운, 활성=파스텔 빨강. 「이용 가능 서비스」·열 순서 이체→송금→카드.',
      ],
      US: [
        'Service management: Individual and Corporate side by side. Active/Inactive dropdowns; Active = pastel red. “Available services”; order transfer → remittance → card.',
      ],
      JP: [
        'サービス管理: 個人・法人を同一画面左右配置。有効/無効ドロップダウン、有効=パステル赤。「利用可能サービス」、列順は振込→送金→カード。',
      ],
      CH: [
        '服务管理：个人与企业同屏左右排列。启用/停用下拉，启用=粉红底。「可用服务」；列序为转账→汇款→卡。',
      ],
      TH: [
        'จัดการบริการ: บุคคล·นิติซ้ายขวาในหน้าเดียว ดรอปดาวน์เปิด/ปิด เปิดใช้=แดงพาสเทล 「บริการที่ใช้ได้」 ลำดับโอน→โอนเงิน→บัตร',
      ],
    },
  },
  {
    version: '2.6.200',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: ['고객관리 목록 테이블 헤더를 축소해 한 줄로 표시합니다.'],
      US: ['Customer list table headers are compacted to stay on one line.'],
      JP: ['顧客管理一覧のヘッダーを縮小し1行表示にします。'],
      CH: ['客户管理列表表头缩小为单行显示。'],
      TH: ['ย่อหัวตารางรายชื่อลูกค้าให้แสดงบรรทัดเดียว'],
    },
  },
  {
    version: '2.6.199',
    kind: 'minor',
    date: '2026-10-06',
    items: {
      KR: [
        '본사정책 「서비스관리」 추가: 개인/법인 탭 × 통화별 이체·카드·송금. 계좌관리에서 서비스 체크 분리. FOLLOW_HQ는 이 표 기준. 송금은 USD·EUR만.',
      ],
      US: [
        'HQ Policy “Service management”: Individual/Corporate tabs × transfer/card/remittance by currency. Removed service toggles from Accounts. FOLLOW_HQ uses this table. Remittance USD/EUR only.',
      ],
      JP: [
        '本社ポリシー「サービス管理」追加: 個人/法人タブ×通貨別振込・カード・送金。口座管理からサービス切替を分離。FOLLOW_HQはこの表。送金はUSD/EURのみ。',
      ],
      CH: [
        '总部策略新增「服务管理」：个人/企业页签×按币种转账·卡·汇款。账户管理去掉服务开关。FOLLOW_HQ 按此表。汇款仅 USD/EUR。',
      ],
      TH: [
        'เพิ่ม「จัดการบริการ」ใน HQ: แท็บบุคคล/นิติ × โอน·บัตร·โอนเงินรายสกุล แยกจากจัดการบัญชี FOLLOW_HQ ตามตาราง โอนเงินเฉพาะ USD/EUR',
      ],
    },
  },
  {
    version: '2.6.198',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '매뉴얼(결제관리): 카드 수수료 구조 안내 추가 — 이체=시볼, 카드=시볼+카드% 별도 가산. ICOPAY 청구=카드 결제 총액(표시 통화).',
      ],
      US: [
        'Manuals (Payment): added card fee structure — bank = symbol fees; card = symbol fees + separate card %. ICOPAY charge = card total (display currency).',
      ],
      JP: [
        'マニュアル（決済管理）: カード手数料構造を追加 — 振込=シンボル、カード=シンボル+カード%別加算。ICOPAY請求=カード決済総額（表示通貨）。',
      ],
      CH: [
        '手册（支付管理）：补充卡手续费结构 — 转账=交易对手续费；卡=交易对+卡手续费(%)。ICOPAY 扣款=卡支付总额（显示货币）。',
      ],
      TH: [
        'คู่มือ (Payment): เพิ่มโครงสร้างค่าบัตร — โอน=ค่าสัญลักษณ์ บัตร=ค่าสัญลักษณ์+ค่าบัตร(%) แยก ICOPAY=ยอดบัตรรวม (สกุลที่แสดง)',
      ],
    },
  },
  {
    version: '2.6.197',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '카드 결제 수수료: 이체와 동일 시볼 수수료 + 카드 수수료(%) 별도 가산·노출. ICOPAY 청구는 카드 결제 총액·표시 통화 그대로. HQ 카드 수수료 기본값 3.5%.',
      ],
      US: [
        'Card fees: same symbol fees as bank transfer, plus a separate card % surcharge shown in the preview. ICOPAY charge equals the card total in the display currency. HQ default card fee 3.5%.',
      ],
      JP: [
        'カード手数料: 振込と同じシンボル手数料＋カード手数料(%)を別途加算・表示。ICOPAY請求はカード決済総額・表示通貨のまま。HQカード手数料既定値3.5%。',
      ],
      CH: [
        '卡手续费：与转账相同的交易对手续费，另加卡手续费(%)并单独展示。ICOPAY 扣款等于卡支付总额（页面显示货币）。总部默认卡费率 3.5%。',
      ],
      TH: [
        'ค่าธรรมเนียมบัตร: ค่าสัญลักษณ์เหมือนโอน + ค่าบัตร(%) แยกคิดและแสดง ICOPAY เรียกเก็บเท่ากับยอดบัตรรวมตามสกุลที่แสดง ค่าเริ่มต้น HQ 3.5%',
      ],
    },
  },
  {
    version: '2.6.196',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '카드 결제: ICOPAY 청구는 표시 통화·금액 그대로(예: JPY→JPY). 카드 경로는 번들 수수료만 적용하고 시볼 구매 수수료는 적용하지 않습니다.',
      ],
      US: [
        'Card pay: ICOPAY is charged in the same display currency/amount (e.g. JPY). Card path applies the bundle fee only; symbol purchase fees are skipped.',
      ],
      JP: [
        'カード決済: ICOPAY請求は表示通貨・金額のまま（例: JPY）。カード経路はバンドル手数料のみ、シンボル購入手数料は適用しません。',
      ],
      CH: [
        '卡支付：ICOPAY 按页面同一货币与金额扣款（如 JPY）。卡路径仅收打包手续费，不收交易对采购手续费。',
      ],
      TH: [
        'ชำระบัตร: ICOPAY เรียกเก็บสกุล·ยอดเดียวกับที่แสดง (เช่น JPY) เส้นทางบัตรใช้ค่าธรรมเนียมรวมเท่านั้น ไม่คิดค่าซื้อสัญลักษณ์',
      ],
    },
  },
  {
    version: '2.6.195',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '본사정책 「수수료·리스크」를 「수수료관리」와 「리스크관리」메뉴로 분리했습니다. 수수료 티어·도식·가스·EXPRESS는 수수료관리, 거래한도·USDT 리스크·환율·견적은 리스크관리에서 설정합니다.',
      ],
      US: [
        'HQ Policy “Fees & risk” is split into Fee management and Risk management. Fee tiers, diagrams, gas, and EXPRESS stay under Fees; transaction limits, USDT risk tiers, FX sources, and quote timers move to Risk.',
      ],
      JP: [
        '本社ポリシー「手数料・リスク」を「手数料管理」と「リスク管理」に分離。手数料段階・図式・ガス・EXPRESSは手数料管理、取引限度・USDTリスク・為替・見積はリスク管理。',
      ],
      CH: [
        '总部策略「手续费·风险」拆分为「手续费管理」与「风险管理」。手续费档位、图示、燃气、EXPRESS 在手续费管理；交易限额、USDT 风险、汇率、报价在风险管理。',
      ],
      TH: [
        'แยกนโยบาย HQ「ค่าธรรมเนียม·ความเสี่ยง」เป็น「จัดการค่าธรรมเนียม」กับ「จัดการความเสี่ยง」 ชั้นค่าธรรมเนียม·แผนภาพ·แก๊ส·EXPRESS อยู่ค่าธรรมเนียม วงเงิน·ความเสี่ยง USDT·อัตรา·ใบเสนอราคาอยู่ความเสี่ยง',
      ],
    },
  },
  {
    version: '2.6.194',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '결제관리에 「카드 결제 한도」 전용 카드를 분리했습니다. 이체·송금 한도와 별도이며 개인·법인 공통입니다. TINPASS 선검증 + ICOPAY 최종 한도 안내를 추가했습니다.',
      ],
      US: [
        'Payment management now has a dedicated Card payment limits card. Limits are separate from bank/remittance and shared by individual and corporate. TINPASS validates first; ICOPAY enforces the final limit.',
      ],
      JP: [
        '決済管理に「カード決済限度」専用カードを分離。振込・送金限度と別で個人・法人共通。TINPASSが先に検証しICOPAYが最終限度を適用する案内を追加。',
      ],
      CH: [
        '支付管理新增独立「卡支付限额」卡片。与转账/汇款限额分开，个人与企业共用。TINPASS 先校验，ICOPAY 为最终限额。',
      ],
      TH: [
        'แยกการ์ด「วงเงินชำระบัตร」ในจัดการชำระเงิน แยกจากโอน/ธุรกรรมโอน ใช้ร่วมบุคคล·นิติ TINPASS ตรวจก่อน ICOPAY เป็นขีดจำกัดสุดท้าย',
      ],
    },
  },
  {
    version: '2.6.193',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        'ICOPAY 라이브 Unified Checkout 연동: prepare→결제페이지→Webhook/Status로 확정. 카드번호는 ICOPAY에서 입력. Webhook https://api.tinpass.com/api/webhooks/icopay',
      ],
      US: [
        'ICOPAY LIVE Unified Checkout: prepare → hosted pay page → Webhook/Status confirm. Card data entered on ICOPAY. Webhook https://api.tinpass.com/api/webhooks/icopay',
      ],
      JP: [
        'ICOPAY LIVE Unified Checkout連携: prepare→決済ページ→Webhook/Statusで確定。カード番号はICOPAYで入力。Webhook https://api.tinpass.com/api/webhooks/icopay',
      ],
      CH: [
        'ICOPAY 正式 Unified Checkout：prepare→支付页→Webhook/Status 确认。卡号在 ICOPAY 输入。Webhook https://api.tinpass.com/api/webhooks/icopay',
      ],
      TH: [
        'เชื่อม ICOPAY LIVE Unified Checkout: prepare→หน้าชำระ→Webhook/Status ยืนยัน กรอกบัตรที่ ICOPAY Webhook https://api.tinpass.com/api/webhooks/icopay',
      ],
    },
  },
  {
    version: '2.6.192',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 이용 메뉴얼을 개인용·기업용으로 분리했습니다. 고객은 본인 유형 메뉴얼만, 총본사·조직은 둘 다 열 수 있습니다. 가입·승인·결제수단·지갑·인보이스 등 최신 기능을 간편 가이드로 반영했습니다(KR/US/JP/CH/TH).',
      ],
      US: [
        'Customer manuals are split into Individual and Corporate. Customers open only their type; HQ/org can open both. Quick guides cover signup, approval, pay methods, wallets, invoices, and more (KR/US/JP/CH/TH).',
      ],
      JP: [
        '顧客マニュアルを個人用・法人用に分離しました。顧客は自分のタイプのみ、総本社・組織は両方を開けます。登録・承認・決済手段・ウォレット・インボイスなど最新機能をかんたんガイドに反映(KR/US/JP/CH/TH)。',
      ],
      CH: [
        '客户手册已拆分为个人版与企业版。客户仅能打开本类型手册，总部/组织可打开两者。简易指南已纳入注册、批准、支付方式、钱包、发票等最新功能（KR/US/JP/CH/TH）。',
      ],
      TH: [
        'แยกคู่มือลูกค้าเป็นบุคคลและนิติบุคคล ลูกค้าเปิดได้เฉพาะประเภทตน HQ/องค์กรเปิดได้ทั้งสอง คู่มือง่ายครอบคลุมสมัคร อนุมัติ ช่องทางชำระ กระเป๋า ใบแจ้งหนี้ ฯลฯ (KR/US/JP/CH/TH)',
      ],
    },
  },
  {
    version: '2.6.191',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '인보이스 목록에 PDF 미리보기를 두고, 삭제 전에 확인할 수 있게 했습니다. 삭제는 2단계 확인 후 Invoice 서비스에서도 함께 삭제됩니다.',
      ],
      US: [
        'Invoice lists now have a PDF preview before download and delete. Delete uses a two-step confirm and also removes the invoice from the Invoice service.',
      ],
      JP: [
        'インボイス一覧にPDFプレビューを追加し、削除前に確認できます。削除は2段階確認後、Invoiceサービスからも削除されます。',
      ],
      CH: [
        '发票列表增加 PDF 预览，可在删除前确认。删除需两步确认，并会从 Invoice 服务一并删除。',
      ],
      TH: [
        'รายการใบแจ้งหนี้มีดูตัวอย่าง PDF ก่อนดาวน์โหลดและลบ การลบยืนยัน 2 ขั้น และลบจากบริการ Invoice ด้วย',
      ],
    },
  },
  {
    version: '2.6.190',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 상세에 크립토 매입 결제수단(계좌이체·송금거래·카드) on/off를 둡니다. 본사설정따름 기본은 기업=이체+송금, 개인=송금만입니다.',
      ],
      US: [
        'Customer detail has on/off for crypto purchase methods (bank transfer, remittance, card). Follow HQ defaults: corporate = transfer + remittance; individual = remittance only.',
      ],
      JP: [
        '顧客詳細にクリプト購入の決済手段（口座振替・送金・カード）のON/OFFを追加。本社に従う既定は法人＝振替+送金、個人＝送金のみです。',
      ],
      CH: [
        '客户详情可开关加密货币采购支付方式（转账、汇款、卡）。跟随总部默认：企业＝转账+汇款，个人＝仅汇款。',
      ],
      TH: [
        'หน้ารายละเอียดลูกค้าเปิด/ปิดช่องทางซื้อคริปโตได้ (โอนบัญชี ธุรกรรมโอน บัตร) ค่าตาม HQ: นิติ=โอน+ธุรกรรมโอน บุคคล=ธุรกรรมโอนอย่างเดียว',
      ],
    },
  },
  {
    version: '2.6.189',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '이메일은 전역으로 한 번만 쓸 수 있고, 전화번호는 개인·기업에 각각 한 번까지 쓸 수 있습니다. 같은 전화로 검색되면 개인/기업 표시로 구분합니다.',
      ],
      US: [
        'Email is unique globally. A phone number may be used once for individual and once for corporate. When the same phone appears in search, individual/corporate is shown.',
      ],
      JP: [
        'メールは全体で1回のみ、電話番号は個人・法人に各1回まで使えます。同じ電話で検索された場合は個人/法人表示で区別します。',
      ],
      CH: [
        '邮箱全局唯一；电话可在个人与企业各用一次。同一电话出现在搜索结果时会显示个人/企业。',
      ],
      TH: [
        'อีเมลใช้ได้ครั้งเดียวทั้งระบบ เบอร์ใช้ได้บุคคลและนิติบุคคลอย่างละครั้ง หากค้นด้วยเบอร์เดียวกันจะแสดงประเภทบุคคล/นิติบุคคล',
      ],
    },
  },
  {
    version: '2.6.188',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 상세에서 개인·기업 유형을 회원등급 위 드롭다운으로 변경·저장할 수 있습니다. 공개 가입은 개인만, 기업은 관리자 등록 또는 이 화면에서 지정합니다.',
      ],
      US: [
        'On the customer detail page, individual or corporate type can be changed and saved with a dropdown above member grade. Public signup is individual only; corporate accounts are set by an admin or on this screen.',
      ],
      JP: [
        '顧客詳細で個人・法人タイプを会員等級の上のドロップダウンから変更・保存できます。公開登録は個人のみで、法人は管理者登録またはこの画面で指定します。',
      ],
      CH: [
        '客户详情页可在会员等级上方的下拉菜单中更改并保存个人/企业类型。公开注册仅限个人；企业由管理员注册或在此页面指定。',
      ],
      TH: [
        'หน้ารายละเอียดลูกค้าเปลี่ยนและบันทึกประเภทบุคคล/นิติบุคคลได้ด้วยเมนูเหนือระดับสมาชิก สมัครสาธารณะได้เฉพาะบุคคล นิติบุคคลให้ผู้ดูแลลงทะเบียนหรือกำหนดที่หน้านี้',
      ],
    },
  },
  {
    version: '2.6.187',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '추천자는 영업점 이상 조직만 됩니다. 가맹점 연락처로 찾으면 그 가맹점의 유치 조직으로 연결되고, 조직 화면에는 소개 가맹점이 표시됩니다. 조직이 켜 두면 소개로 들어온 가맹점의 완료 거래에 대해 완료 USDT × 비율 + 고정 USDT를 조직만 계산해 봅니다. 플랫폼은 지급하지 않으며 가맹점 화면에는 실적과 금액이 나오지 않습니다.',
      ],
      US: [
        'Only a sales office or higher can be a referrer. A merchant contact connects the signup to that merchant’s recruiting organization, and the organization can see the introducing merchant. If the organization turns it on, completed trades show completed USDT × percent + fixed USDT on the organization screen only. The platform does not pay it, and merchants never see the volume or the amount.',
      ],
      JP: [
        '紹介者は営業所以上の組織だけです。加盟店の連絡先で探すと、その加盟店を獲得した組織へ接続され、組織画面に紹介加盟店が表示されます。組織がオンにすると、紹介で入った加盟店の完了取引について完了USDT × 割合 + 固定USDTを組織だけが計算します。プラットフォームは支払わず、加盟店画面に実績と金額は出ません。',
      ],
      CH: [
        '只有营业点及以上组织可以成为推荐人。用商户联系方式查找时，会连接到招揽该商户的组织，组织画面会显示介绍商户。组织开启后，仅在组织画面按已完成USDT × 比例 + 固定USDT计算介绍商户的已完成交易。平台不支付，商户画面不会出现业绩和金额。',
      ],
      TH: [
        'ผู้แนะนำได้เฉพาะองค์กรระดับสำนักงานขายขึ้นไป การค้นด้วยข้อมูลร้านค้าจะเชื่อมไปยังองค์กรที่รับร้านค้านั้น และองค์กรเห็นร้านค้าผู้แนะนำ หากองค์กรเปิดใช้ จะคำนวณ USDT ที่เสร็จ × เปอร์เซ็นต์ + USDT คงที่ เฉพาะหน้าองค์กร แพลตฟอร์มไม่จ่าย และร้านค้าไม่เห็นผลงานหรือจำนวนเงิน',
      ],
    },
  },
  {
    version: '2.6.186',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '한 번 등록된 이메일과 전화번호는 개인·기업을 가리지 않고 다시 가입할 수 없습니다. 둘 다 같으면 이미 등록된 이메일과 전화번호라는 경고를, 한쪽만 같으면 해당 항목 경고를 띄웁니다.',
      ],
      US: [
        'An email or phone that is already registered cannot be used again, for either an individual or a business. If both match, a warning says the email and phone are already registered. If only one matches, the warning names that item.',
      ],
      JP: [
        '一度登録されたメールと電話番号は、個人・法人を問わず再登録できません。両方が一致すると登録済みのメールと電話番号である警告を、片方だけならその項目の警告を出します。',
      ],
      CH: [
        '已注册的邮箱和电话不能再次注册，个人和企业同样适用。两者都相同会提示邮箱和电话已注册，只有一项相同则提示该项。',
      ],
      TH: [
        'อีเมลหรือเบอร์ที่ลงทะเบียนแล้วใช้สมัครซ้ำไม่ได้ ทั้งบุคคลและนิติบุคคล ถ้าตรงทั้งคู่จะเตือนว่าอีเมลและเบอร์ลงทะเบียนแล้ว ถ้าตรงอย่างเดียวจะเตือนรายการนั้น',
      ],
    },
  },
  {
    version: '2.6.185',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '추천자는 이메일 또는 국가번호+전화번호로만 검색합니다. 이름은 이*선처럼 가운데를 가립니다. 전화번호는 국제 표기(E.164)로 앞자리 0을 빼고 저장하며 +82010·+8210·+82(0)10은 같은 번호로 찾습니다.',
      ],
      US: [
        'Referrers are found only by email or country code plus phone. Names show with the middle hidden, such as 이*선. Phones are stored in E.164 without the trunk 0, so +82010, +8210, and +82(0)10 match.',
      ],
      JP: [
        '紹介者はメール、または国番号+電話番号でのみ検索します。氏名は中央を隠します。電話番号は国際形式(E.164)で先頭0を除いて保存し、+82010・+8210・+82(0)10は同一番号として検索します。',
      ],
      CH: [
        '推荐人只能用邮箱或国家号加电话搜索。姓名中间会隐藏。电话按国际格式(E.164)去掉国内前缀0保存，+82010、+8210、+82(0)10视为同一号码。',
      ],
      TH: [
        'ค้นผู้แนะนำได้เฉพาะอีเมล หรือรหัสประเทศกับเบอร์โทร ชื่อถูกปิดตรงกลาง เบอร์เก็บบนรูปแบบสากล (E.164) โดยตัด 0 นำหน้า และ +82010 +8210 +82(0)10 คือเบอร์เดียวกัน',
      ],
    },
  },
  {
    version: '2.6.184',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '빠른송금: 송금자 성명은 계정 이름을 쓰고, 국가·이메일은 계정 정보를 가져온 뒤 수정할 수 있습니다. 국가 목록은 한도 국가가 맨 위이고, 크립토 거래 불가 국가는 빠집니다.',
      ],
      US: [
        'Fast remittance: sender name follows the account name. Country and email are copied from the account and can be edited. The limit country is listed first; countries where crypto trading is unavailable are omitted.',
      ],
      JP: [
        'クイック送金: 送金者氏名はアカウント名を使います。国とメールはアカウント情報を取り込み、修正できます。限度国が先頭で、暗号資産取引ができない国は一覧から外れます。',
      ],
      CH: [
        '快速汇款：汇款人姓名使用账户姓名。国家和邮箱从账户信息带入并可修改。限额国家排在最前，无法进行加密货币交易的国家不在列表中。',
      ],
      TH: [
        'โอนด่วน: ชื่อผู้ส่งใช้ชื่อบัญชี ประเทศและอีเมลดึงจากบัญชีแล้วแก้ไขได้ ประเทศวงเงินอยู่บนสุด และประเทศที่ซื้อขายคริปโตไม่ได้จะไม่อยู่ในรายการ',
      ],
    },
  },
  {
    version: '2.6.183',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '지갑은 최대 5개. 등록·주소 변경·삭제 요청은 OTP와 두 번 확인. 삭제는 본사 승인 후. 새 주소는 본사 승인, 예전 승인 주소는 재승인 없음. 거래에는 신청 당시 주소만 남고 진행 중에는 그 지갑을 바꿀 수 없음.',
      ],
      US: [
        'Up to 5 wallets. Register, address change, and deletion request need OTP and two confirmations. Deletion waits for HQ. New addresses need approval; previously approved addresses do not. A trade keeps the address chosen at apply time, and an in-progress trade blocks changing that wallet.',
      ],
      JP: [
        'ウォレットは最大5件。登録・アドレス変更・削除依頼はOTPと2回確認。削除は本社承認後。新しいアドレスは本社承認、以前承認したアドレスは再承認不要。取引には申請時のアドレスだけが残り、進行中はそのウォレットを変更できません。',
      ],
      CH: [
        '钱包最多 5 个。登记、改地址、申请删除需要 OTP 和两次确认。删除须总部批准。新地址需批准，曾批准的地址无需再批。交易只保留申请时的地址，进行中不能修改该钱包。',
      ],
      TH: [
        'กระเป๋าสูงสุด 5 ใบ ลงทะเบียน เปลี่ยนที่อยู่ ขอลบ ต้อง OTP และยืนยันสองครั้ง การลบต้องให้ HQ อนุมัติ ที่อยู่ใหม่ต้องอนุมัติ ที่อยู่ที่เคยอนุมัติไม่ต้องซ้ำ รายการเก็บบันทึกที่อยู่ตอนสมัคร และรายการที่กำลังทำเปลี่ยนกระเป๋านั้นไม่ได้',
      ],
    },
  },
  {
    version: '2.6.182',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '개인 가입: 인증번호 발송 후 「이메일 인증 확인」에서 5분 안에 번호를 입력·확인해야 나머지 가입이 진행됩니다.',
      ],
      US: [
        'Individual signup: after the code is sent, confirm it within 5 minutes on Email verification before the rest of the form opens.',
      ],
      JP: [
        '個人登録: 認証番号送信後、「メール認証の確認」で5分以内に入力・確認すると残りの登録に進めます。',
      ],
      CH: [
        '个人注册：发送验证码后，须在「确认邮箱验证」中于5分钟内输入并确认，才能继续填写其余资料。',
      ],
      TH: [
        'สมัครบุคคล: หลังส่งรหัส ต้องยืนยันใน「ยืนยันรหัสอีเมล」ภายใน 5 นาที จึงกรอกข้อมูลที่เหลือต่อได้',
      ],
    },
  },
  {
    version: '2.6.181',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '개인 가입: 예금주 자동입력 저장, 빠른 송금 기본은 미사용. 신청은 등록 통장 통화 계좌이체가 기본이며 한도·이력 문구는 화면 언어를 따릅니다.',
      ],
      US: [
        'Individual signup saves the prefilled account holder and leaves fast remittance off. Apply defaults to bank transfer in the registered currency; limit and history text follow the UI language.',
      ],
      JP: [
        '個人登録: 自動入力の口座名義を保存し、高速送金は初期オフ。申請は登録口座の通貨の銀行振込が初期値。限度・履歴文言は画面言語に従います。',
      ],
      CH: [
        '个人注册会保存自动填入的户名，快速汇款默认关闭。申请默认使用已登记账户币种的银行转账；限额与记录文字跟随界面语言。',
      ],
      TH: [
        'สมัครบุคคล: บันทึกชื่อบัญชีที่เติมให้อัตโนมัติ และปิดการโอนด่วนเป็นค่าเริ่มต้น การสมัครเปิดที่โอนธนาคารตามสกุลที่ลงทะเบียน ข้อความวงเงินและประวัติตามภาษาหน้าจอ',
      ],
    },
  },
  {
    version: '2.6.180',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '수수료·리스크에 「한도 설정」카드를 분리. 통화별 1회·일·월 한도가 USDT 매입 신청 금액에 직접 연동.',
      ],
      US: [
        'Fee & Risk: dedicated Limit settings card. Per-currency min/max links directly to USDT purchase apply amounts.',
      ],
      JP: [
        '手数料・リスクに「限度設定」カードを分離。通貨別1回・日・月限度がUSDT買付申請金額に直接連動。',
      ],
      CH: [
        '手续费·风险新增独立「限额设置」卡片；各币种单笔/日/月限额直接联动 USDT 申购金额。',
      ],
      TH: [
        'แยกการ์ด「ตั้งค่าวงเงิน」ในค่าธรรมเนียม·ความเสี่ยง วงเงินต่อสกุลผูกกับจำนวนสมัครซื้อ USDT โดยตรง',
      ],
    },
  },
  {
    version: '2.6.179',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '개인 LIVE 매입: 법인용 USDT 최소(예: 1만) 대신 한도 국가·통화 기준(약 1만 USD 이하) 적용. 가입 시 국가 선택·전화·IP로 국가 추적.',
      ],
      US: [
        'Individual LIVE purchase: use country/currency caps (~≤USD 10k) instead of corporate USDT minimums. Track country via signup select, phone, IP.',
      ],
      JP: [
        '個人LIVE申込: 法人向けUSDT下限の代わりに限度国・通貨基準（約1万USD以下）を適用。登録時の国選択・電話・IPで国を追跡。',
      ],
      CH: [
        '个人 LIVE 申购：不以企业 USDT 下限为准，而按限额国家/货币（约 ≤1 万 USD）执行；注册国家选择、电话、IP 追踪。',
      ],
      TH: [
        'ซื้อ LIVE บุคคล: ใช้วงเงินตามประเทศ/สกุล (ราว ≤10,000 USD) แทนขั้นต่ำนิติบุคคล ติดตามประเทศจากเลือกตอนสมัคร โทรศัพท์ IP',
      ],
    },
  },
  {
    version: '2.6.178',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 목록: 가입승인→가입. 고객 열은 기업/개인만 표시하고, 회원등급(ST 등)은 「등록」열로 분리.',
      ],
      US: [
        'Customer list: Join column short label; Customer shows Corporate/Individual only; member grade (ST…) in separate Tier column.',
      ],
      JP: [
        '顧客一覧: 加入列を短縮。顧客列は企業/個人のみ、会員等級(ST等)は「会員」列に分離。',
      ],
      CH: [
        '客户列表：注册列缩短；客户列仅显示企业/个人；会员等级(ST等)单独「会员」列。',
      ],
      TH: [
        'รายการลูกค้า: คอลัมน์สมัครสั้นลง ลูกค้าแสดงนิติ/บุคคลเท่านั้น ระดับสมาชิก (ST…) แยกคอลัมน์ทะเบียน',
      ],
    },
  },
  {
    version: '2.6.177',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '개인 DIRECT: 송금거래(USD/EUR)와 계좌이체(JPY 등)가 동시에 노출되도록 결제수단 로직 수정.',
        '고객 시뮬레이터는 LIVE 매입 한도가 아닌 시뮬레이터 한도표를 적용. 화면에서 1회 min/max 안내.',
      ],
      US: [
        'Individual DIRECT: remittance (USD/EUR) and bank transfer (e.g. JPY) can both appear as payment methods.',
        'Customer simulator uses simulator risk tiers (not live purchase limits) and shows per-trade min/max.',
      ],
      JP: [
        '個人DIRECT: 送金取引(USD/EUR)と銀行振込(JPY等)が同時に選べるよう決済手段ロジックを修正。',
        '顧客シミュレーターはLIVE申込限度ではなくシミュレーター限度表を適用。1回min/maxを表示。',
      ],
      CH: [
        '个人 DIRECT：汇款交易（USD/EUR）与银行转账（如 JPY）可同时显示为支付方式。',
        '客户模拟器使用模拟限额表（非实际申购限额），并显示单笔上下限。',
      ],
      TH: [
        'บุคคล DIRECT: แสดงทั้งโอนเงินต่างประเทศ (USD/EUR) และโอนธนาคาร (เช่น JPY) ได้พร้อมกัน',
        'ตัวจำลองลูกค้าใช้ตารางวงเงินจำลอง (ไม่ใช่วงเงินซื้อจริง) และแสดง min/max ต่อครั้ง',
      ],
    },
  },
  {
    version: '2.6.176',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 목록: 고객·등급을 한 열에 표시(예: 기업/ST). 청구방식→방식, 본사설정→본사로 축약.',
      ],
      US: [
        'Customer list: merge type+grade in one column (e.g. Corporate/ST). Billing header→Method; HQ setting→HQ.',
      ],
      JP: [
        '顧客一覧: 顧客種別と等級を1列表示（例: 企業/ST）。請求方式→方式、本社設定→本社に短縮。',
      ],
      CH: [
        '客户列表：客户类型与等级合并一列（如 企业/ST）。计费方式→方式，总部设置→总部。',
      ],
      TH: [
        'รายการลูกค้า: รวมประเภท+ระดับในคอลัมน์เดียว (เช่น นิติ/ST) หัวข้อวิธีเรียกเก็บ→วิธี และ HQ setting→HQ',
      ],
    },
  },
  {
    version: '2.6.175',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 목록 테이블에 회원등급 열 추가. ST/PR/VI/VV/PR/BL 2글자·등급별 색상으로 표시.',
      ],
      US: [
        'Customer list shows member grade column as 2-letter codes ST/PR/VI/VV/PR/BL with grade colors.',
      ],
      JP: [
        '顧客一覧に会員等級列を追加。ST/PR/VI/VV/PR/BLの2文字・等級色で表示。',
      ],
      CH: [
        '客户列表新增会员等级列，以 ST/PR/VI/VV/PR/BL 两字及等级配色显示。',
      ],
      TH: [
        'เพิ่มคอลัมน์ระดับสมาชิกในรายการลูกค้า แสดงรหัส 2 ตัวอักษร ST/PR/VI/VV/PR/BL พร้อมสีตามระดับ',
      ],
    },
  },
  {
    version: '2.6.174',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '고객 상세(고객정보)에 회원등급 카드 추가·저장. Standard~Black 등급별 색상 배지/카드로 표시.',
      ],
      US: [
        'Add member-grade card on customer detail with save. Color-coded badges/cards for Standard–Black.',
      ],
      JP: [
        '顧客詳細に会員等級カードを追加・保存。Standard〜Blackを等級別カラーで表示。',
      ],
      CH: [
        '客户详情新增会员等级卡片并可保存。Standard–Black 按等级配色显示。',
      ],
      TH: [
        'เพิ่มการ์ดระดับสมาชิกในรายละเอียดลูกค้า พร้อมบันทึก และแสดงสีตามระดับ Standard–Black',
      ],
    },
  },
  {
    version: '2.6.173',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        'EXPRESS 등급별 「관리」드롭다운(사용/미사용) 추가. EXPRESS 전체 활성과 별도로 특정 등급만 숨길 수 있으며, 미사용 시에도 수수료 숫자는 유지.',
      ],
      US: [
        'Per-tier EXPRESS Manage dropdown (Use/Unused). Hide specific tiers even when EXPRESS is enabled; unused tiers keep their fee values.',
      ],
      JP: [
        'EXPRESS等級ごとに「管理」ドロップダウン（使用/未使用）を追加。全体有効でも特定等級を非表示でき、未使用でも料金数値は保持。',
      ],
      CH: [
        'EXPRESS 各等级新增「管理」下拉（使用/未使用）。整体启用时也可隐藏特定等级；未使用仍保留费用数值。',
      ],
      TH: [
        'เพิ่ม「จัดการ」รายระดับ EXPRESS (ใช้/ไม่ใช้) ซ่อนบางระดับได้แม้เปิด EXPRESS ทั้งชุด และคงตัวเลขค่าธรรมเนียมไว้',
      ],
    },
  },
  {
    version: '2.6.172',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        'EXPRESS 수수료 UI를 기존 좌우(법인·개인) 표로 복원. 회원등급 EXPRESS 추가 수수료는 기존 매트릭스 표를 유지하되 법인 표 위·개인 표 아래로 배치.',
      ],
      US: [
        'Restore EXPRESS fee UI to side-by-side Corporate/Individual tables. Member-grade EXPRESS keeps the matrix table, stacked Corporate above Individual.',
      ],
      JP: [
        'EXPRESS手数料UIを従来の左右（法人・個人）表に復元。会員等級EXPRESSは従来のマトリクス表のまま法人上・個人下に配置。',
      ],
      CH: [
        'EXPRESS 手续费 UI 恢复为左右（法人·个人）表。会员等级 EXPRESS 保持原矩阵表，法人在上、个人在下。',
      ],
      TH: [
        'คืน UI ค่า EXPRESS เป็นตารางซ้าย-ขวา (นิติ/บุคคล) ค่าธรรมเนียมเพิ่มตามระดับสมาชิกใช้ตารางเดิม นิติบน บุคคลล่าง',
      ],
    },
  },
  {
    version: '2.6.171',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '회원등급 EXPRESS 추가 수수료 1차 보수안 적용: Standard 0%·Premium 3%·VIP 5%·VVIP 8%·Prestige 12%·Black 15%+1USDT(ULTRA 0). 법인·개인 동일.',
      ],
      US: [
        'Applied conservative member-grade EXPRESS add-on fees: Standard 0%, Premium 3%, VIP 5%, VVIP 8%, Prestige 12%, Black 15%+1 USDT (ULTRA 0). Same for Corporate/Individual.',
      ],
      JP: [
        '会員等級EXPRESS追加手数料の1次保守案を適用: Standard 0%・Premium 3%・VIP 5%・VVIP 8%・Prestige 12%・Black 15%+1USDT(ULTRA 0)。法人・個人同一。',
      ],
      CH: [
        '已套用会员等级 EXPRESS 附加手续费保守方案：Standard 0%·Premium 3%·VIP 5%·VVIP 8%·Prestige 12%·Black 15%+1USDT(ULTRA 0)。法人/个人相同。',
      ],
      TH: [
        'ใช้ค่าธรรมเนียมเพิ่ม EXPRESS ตามระดับสมาชิกแบบอนุรักษ์: Standard 0% Premium 3% VIP 5% VVIP 8% Prestige 12% Black 15%+1USDT (ULTRA 0) นิติ/บุคคลเหมือนกัน',
      ],
    },
  },
  {
    version: '2.6.170',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        'EXPRESS·회원등급 EXPRESS UI를 법인/개인 위·아래 나열로 변경하고, 가로 스크롤 없이 편집되도록 표 구성을 정리.',
      ],
      US: [
        'Stack Corporate/Individual EXPRESS and member-grade EXPRESS editors vertically; layout avoids horizontal scrolling.',
      ],
      JP: [
        'EXPRESS・会員等級EXPRESSの法人/個人を上下配置に変更し、横スクロールなしで編集できる表構成に整理。',
      ],
      CH: [
        'EXPRESS 与会员等级 EXPRESS 的法人/个人改为上下排列，并调整表格布局以避免横向滚动。',
      ],
      TH: [
        'จัด EXPRESS และค่าธรรมเนียมเพิ่มตามระดับสมาชิก นิติ/บุคคล ซ้อนแนวตั้ง ไม่มีแถบเลื่อนแนวนอน',
      ],
    },
  },
  {
    version: '2.6.169',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '명칭 정리: EXPRESS 수수료 / 회원등급 EXPRESS 추가 수수료. 회원등급 EXPRESS 추가 수수료를 법인·개인으로 분리 설정·적용.',
      ],
      US: [
        'Rename: EXPRESS fee / member-grade EXPRESS add-on fee. Member-grade EXPRESS add-on fees now configure separately for Corporate and Individual.',
      ],
      JP: [
        '名称整理: EXPRESS手数料 / 会員等級 EXPRESS追加手数料。会員等級 EXPRESS追加手数料を法人・個人で分離設定・適用。',
      ],
      CH: [
        '名称整理：EXPRESS 手续费 / 会员等级 EXPRESS 附加手续费。会员等级 EXPRESS 附加手续费按法人·个人分别设置与适用。',
      ],
      TH: [
        'ปรับชื่อ: ค่าธรรมเนียม EXPRESS / ค่าธรรมเนียมเพิ่ม EXPRESS ตามระดับสมาชิก และแยกตั้งค่า นิติ/บุคคล',
      ],
    },
  },
  {
    version: '2.6.168',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        'EXPRESS 추가 수수료에 고정(USDT)과 함께 %(gross) 지원. HQ·고객 CUSTOM·회원등급 지정/%, 견적·신청·SLA 정산에 반영.',
      ],
      US: [
        'EXPRESS add-on fees support fixed USDT and % of gross. HQ, customer CUSTOM, member-grade overrides; quotes/apply/SLA settlement included.',
      ],
      JP: [
        'EXPRESS追加手数料に固定(USDT)と%(gross)を追加。HQ・顧客CUSTOM・会員等級指定/%、見積・申請・SLA精算に反映。',
      ],
      CH: [
        'EXPRESS 附加手续费支持固定(USDT)与%(gross)。总部/客户 CUSTOM/会员等级指定/%，报价·申请·SLA 结算一并生效。',
      ],
      TH: [
        'ค่า EXPRESS รองรับทั้งคงที่(USDT) และ %(gross) ที่ HQ/CUSTOM/ระดับสมาชิก รวมใบเสนอราคา สมัคร และ SLA',
      ],
    },
  },
  {
    version: '2.6.167',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '운영 안정화: 수수료 도식에 EXPRESS 표시, 고객 CUSTOM EXPRESS 표 편집, SLA 정산 환급 과다 방지, 회원등급 기본값 정리(BLACK 자동 ULTRA 무료 제거), 신청 티어 자동 보정.',
      ],
      US: [
        'Ops hardening: show EXPRESS in fee diagram; CUSTOM EXPRESS table on customers; safer SLA refund; clean member-grade defaults; clamp apply tier to available options.',
      ],
      JP: [
        '運用安定化: 手数料図にEXPRESS表示、顧客CUSTOM EXPRESS表編集、SLA精算の過剰返還防止、会員等級既定整理、申請等級の自動補正。',
      ],
      CH: [
        '运营加固：费用图显示 EXPRESS；客户 CUSTOM EXPRESS 表可编辑；SLA 结算防超额退费；会员等级默认清理；申请档位自动校正。',
      ],
      TH: [
        'เสถียรภาพ: แสดง EXPRESS ในแผนภาพค่าธรรมเนียม แก้ CUSTOM EXPRESS ที่ลูกค้า ป้องกันคืนเงินเกิน SLA ล้างค่าเริ่มระดับสมาชิก ปรับระดับสมัครอัตโนมัติ',
      ],
    },
  },
  {
    version: '2.6.166',
    kind: 'minor',
    date: '2026-10-05',
    items: {
      KR: [
        '회원등급 EXPRESS 혜택: Standard~Black을 한 표에서 지정가·할인%·할인 USDT를 일괄 조회·수정·저장.',
        'EXPRESS 추가 수수료: 법인·개인 각각 활성/비활성 드롭다운으로 분리 설정, 수수료 표도 나란히 표시.',
      ],
      US: [
        'Member-grade EXPRESS benefits: one table for Standard–Black override fees, discount %, and discount USDT.',
        'EXPRESS fees: separate Enabled/Disabled dropdowns for Corporate and Individual, with side-by-side fee tables.',
      ],
      JP: [
        '会員等級EXPRESS特典: Standard〜Blackを1表で指定料金・割引%・割引USDTを一括確認・編集・保存。',
        'EXPRESS追加手数料: 法人・個人をそれぞれ有効/無効ドロップダウンで設定。手数料表も並べて表示。',
      ],
      CH: [
        '会员等级 EXPRESS 优惠：一张表统一查看/编辑/保存 Standard–Black 指定价、折扣%与折扣 USDT。',
        'EXPRESS 附加手续费：法人/个人分别用启用/停用下拉设置，费用表并排显示。',
      ],
      TH: [
        'สิทธิ์ EXPRESS ตามระดับสมาชิก: ตารางเดียวดู/แก้/บันทึก Standard–Black ค่าพิเศษ ส่วนลด% และ USDT',
        'ค่าธรรมเนียม EXPRESS: แยกดรอปดาวน์เปิด/ปิดนิติและบุคคล พร้อมตารางค่าด้านข้าง',
      ],
    },
  },
  {
    version: '2.6.165',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        'EXPRESS 추가 수수료: 비활성 상태에서도 등급별 수수료 표를 항상 표시. 활성 체크 안내 문구 추가(본사 수수료·리스크).',
      ],
      US: [
        'EXPRESS fees: tier fee table always visible even when disabled; clearer enable hint on HQ Commission.',
      ],
      JP: [
        'EXPRESS手数料: 無効時も等級別手数料表を常時表示。有効化の案内を追加（本社手数料・リスク）。',
      ],
      CH: [
        'EXPRESS 手续费：停用时仍始终显示各等级费用表；总部手续费·风险页增加启用说明。',
      ],
      TH: [
        'ค่าธรรมเนียม EXPRESS: แสดงตารางค่าระดับแม้ปิดใช้ พร้อมคำอธิบายเปิดใช้ที่ HQ ค่าธรรมเนียม',
      ],
    },
  },
  {
    version: '2.6.164',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '회원등급(Standard~Black): 본사에서 개인·법인 공통 지정. 등급별 EXPRESS 지정가·%/USDT 할인(보너스). 고객관리에서 등급 지정, 신청·정산에 스냅샷 반영. BLACK 기본 ULTRA 0 USDT 예시.',
      ],
      US: [
        'Member grades (Standard–Black): HQ assigns same for Individual/Corporate. Per-grade EXPRESS override fees and %/USDT discounts. Set on customer; snapshotted on apply/settle. BLACK default example: ULTRA 0 USDT.',
      ],
      JP: [
        '会員等級(Standard〜Black): 本社で個人・法人共通指定。等級別EXPRESS指定料金・%/USDT割引。顧客管理で等級指定、申請・精算にスナップショット。BLACK既定例: ULTRA 0 USDT。',
      ],
      CH: [
        '会员等级(Standard–Black)：总部对个人/法人统一指定。按等级设置 EXPRESS 指定价与%/USDT 折扣。客户管理指定等级，申请/结算快照。BLACK 默认示例：ULTRA 0 USDT。',
      ],
      TH: [
        'ระดับสมาชิก (Standard–Black): HQ กำหนดร่วมบุคคล/นิติ ค่า EXPRESS ตามระดับ + ส่วนลด %/USDT ตั้งที่ลูกค้า เก็บ snapshot ตอนสมัคร/ชำระ BLACK ค่าเริ่ม ULTRA 0 USDT',
      ],
    },
  },
  {
    version: '2.6.163',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        'EXPRESS 추가 수수료: 본사 개인/법인 활성·7등급(ULTRA~BASIC) 설정, 고객 FOLLOW_HQ/개별/비활성. 신청 시 선택(기본 BASIC), 완료 시 SLA 미이행이면 실제 시간으로 수수료 재계산·복원 표시.',
      ],
      US: [
        'EXPRESS add-on fee: HQ Individual/Corporate ON + 7 tiers (ULTRA–BASIC); customer Follow HQ / custom / off. Apply defaults to BASIC; on complete, missed SLA recalculates and restores fee.',
      ],
      JP: [
        'EXPRESS追加手数料: 本社で個人/法人の有効と7等級設定、顧客は本社従属/個別/無効。申請はBASIC既定、完了時SLA未達なら実時間で再計算・復元表示。',
      ],
      CH: [
        'EXPRESS 附加手续费：总部按个人/法人启用并设 7 级；客户跟随总部/单独/停用。申请默认 BASIC；完成时未达 SLA 则按实际时间重算并恢复费用。',
      ],
      TH: [
        'ค่าธรรมเนียม EXPRESS: HQ เปิดใช้บุคคล/นิติ + 7 ระดับ ลูกค้าตาม HQ/ตั้งเอง/ปิด สมัครค่าเริ่ม BASIC เสร็จแล้วไม่ทัน SLA จะคำนวณคืนตามเวลาจริง',
      ],
    },
  },
  {
    version: '2.6.162',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '수수료 구간을 개인·법인으로 분리. HQ에서 유형별 편집·저장, 견적·신청 시 고객 유형에 맞는 구간 적용. 개인 USD/EUR 송금은 FX 없이 송금·기타 수수료 중심으로 설정 안내.',
      ],
      US: [
        'Split fee tiers for Individual vs Corporate. HQ edits/saves per type; quotes and applications use the matching tiers. Individual USD/EUR remittance guidance: FX usually 0.',
      ],
      JP: [
        '手数料区間を個人・法人で分離。HQでタイプ別編集・保存、見積・申請は顧客タイプの区間を適用。個人USD/EUR送金はFXなしで送金・その他中心の案内。',
      ],
      CH: [
        '手续费区间按个人/法人分离。总部可按类型编辑保存；报价与申请按客户类型适用。个人 USD/EUR 汇款指引：FX 通常为 0。',
      ],
      TH: [
        'แยกช่วงค่าธรรมเนียมบุคคล/นิติ HQ แก้ไขตามประเภท ใบเสนอราคา/สมัครใช้ช่วงตามประเภทลูกค้า แนะนำโอนบุคคล USD/EUR ให้ FX=0',
      ],
    },
  },
  {
    version: '2.6.161',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        'USDT 결제수단에 송금거래 추가(개인 기본). USD/EUR 금액 그대로 입력·한도 적용(환율 환산 없음). 개인 최대 송금액은 수수료·리스크 거래한도 USD/EUR.',
      ],
      US: [
        'Add Remittance trade payment method (default for individuals). Enter USD/EUR as-is with limits in that currency (no FX). Caps under Commission → Transaction limits.',
      ],
      JP: [
        'USDT決済に送金取引を追加（個人既定）。USD/EURをそのまま入力・限度適用（FXなし）。個人上限は手数料・リスク取引限度のUSD/EUR。',
      ],
      CH: [
        'USDT 新增汇款交易支付方式（个人默认）。按 USD/EUR 原值输入与限额（无汇率换算）。个人上限在手续费·风险交易限额 USD/EUR。',
      ],
      TH: [
        'เพิ่มช่องทางธุรกรรมโอนใน USDT (ค่าเริ่มต้นบุคคล) ใส่ USD/EUR ตามจริงพร้อมวงเงินสกุลนั้น (ไม่แปลง FX) ตั้งที่วงเงินธุรกรรม',
      ],
    },
  },
  {
    version: '2.6.160',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '상단 세션: 접속시간은 시계 아이콘, 사용자 아이콘은 개인(하늘색)·법인(빨강) 및 총본사·조직권한별 모양·파스텔톤으로 구분.',
      ],
      US: [
        'Session bar: clock icon for access time; user icon varies by individual (sky) / corporate (rose) and HQ/org role with pastel tones.',
      ],
      JP: [
        'セッションバー: 接続時間は時計アイコン、ユーザーは個人(水色)・法人(赤)および本社・組織権限別に形とパステル色で区別。',
      ],
      CH: [
        '会话栏：访问时间为时钟图标；用户图标按个人(天蓝)/法人(红)及总部·组织权限区分形状与粉彩色。',
      ],
      TH: [
        'แถบเซสชัน: เวลาเข้าใช้เป็นไอคอนนาฬิกา ไอคอนผู้ใช้แยกบุคคล(ฟ้า)/นิติ(แดง) และตามสิทธิ์ HQ/องค์กรโทนพาสเทล',
      ],
    },
  },
  {
    version: '2.6.159',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '본사정책「계좌관리」신설: 기업/개인 입금계좌 기본값 분리, 송금계좌(舊 직접송금) 명칭, 통화별 송금거래 on/off. 고객 본사따름은 유형별 HQ 기본값을 따름.',
      ],
      US: [
        'New HQ Account management: separate corporate/individual collection defaults, rename to Remittance account, per-currency Remittance trade toggle. Follow HQ uses type-specific defaults.',
      ],
      JP: [
        '本社ポリシー「口座管理」新設。企業/個人の入金口座既定を分離、送金口座へ改称、通貨別送金取引ON/OFF。本社従いは類型別HQ既定を適用。',
      ],
      CH: [
        '新增总部「账户管理」：企业/个人入金默认分离，更名为汇款账户，币种级汇款交易开关；跟随总部按类型使用 HQ 默认。',
      ],
      TH: [
        'เพิ่มเมนูจัดการบัญชี HQ: แยกค่าเริ่มต้นนิติ/บุคคล เปลี่ยนชื่อเป็นบัญชีโอน สวิตช์ธุรกรรมโอนรายสกุล ตาม HQ ใช้ค่าตามประเภทลูกค้า',
      ],
    },
  },
  {
    version: '2.6.158',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '입금계좌 방식에 직접송금(DIRECT) 추가: HQ가 적용 통화(USD/EUR, 추후 THB 등)를 지정하고, 고객·개인도 직접송금으로 거래 가능. CURFEX와 별도로 플랫폼 수취계좌 사용.',
      ],
      US: [
        'Add Direct remittance (DIRECT) collection mode: HQ picks currencies (USD/EUR, later THB+); customers can trade via platform deposit accounts, separate from CURFEX.',
      ],
      JP: [
        '入金口座方式に直接送金(DIRECT)を追加。HQが適用通貨(USD/EUR、将来THB等)を指定し、顧客も直接送金で取引可能。CURFEXとは別のプラットフォーム受取口座を使用。',
      ],
      CH: [
        '新增直接汇款(DIRECT)入金方式：HQ 指定适用币种（USD/EUR，后续 THB 等），客户可经平台收款账户交易，与 CURFEX 分开。',
      ],
      TH: [
        'เพิ่มโหมดโอนตรง (DIRECT): HQ เลือกสกุล (USD/EUR และ THB ในภายหลัง) ลูกค้าเทรดผ่านบัญชีรับเงินแพลตฟอร์ม แยกจาก CURFEX',
      ],
    },
  },
  {
    version: '2.6.157',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '개인고객 USDT 이체는 USD ACH·EUR SEPA 직접송금만 허용(CURFEX·로컬 고정계좌 제외).',
      ],
      US: [
        'Individual bank-transfer USDT limited to USD ACH / EUR SEPA direct remittance (no CURFEX/local fixed).',
      ],
      JP: [
        '個人のUSDT振込はUSD ACH・EUR SEPA直接送金のみ（CURFEX・現地固定口座なし）。',
      ],
      CH: [
        '个人客户银行转账 USDT 仅限 USD ACH / EUR SEPA 直接汇款（不含 CURFEX/本地固定账户）。',
      ],
      TH: [
        'ลูกค้าบุคคลโอน USDT ได้เฉพาะ USD ACH / EUR SEPA (ไม่ใช้ CURFEX/บัญชีคงที่ท้องถิ่น)',
      ],
    },
  },
  {
    version: '2.6.156',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        'USD ACH에 Routing number(101019644), EUR SEPA에 BIC(CFTEMTM1) 필드·기본값 추가.',
      ],
      US: [
        'Add USD ACH Routing number (101019644) and EUR SEPA BIC (CFTEMTM1) fields and defaults.',
      ],
      JP: [
        'USD ACHにRouting number(101019644)、EUR SEPAにBIC(CFTEMTM1)フィールド・既定値を追加。',
      ],
      CH: [
        'USD ACH 增加 Routing number(101019644)，EUR SEPA 增加 BIC(CFTEMTM1) 字段与默认值。',
      ],
      TH: [
        'เพิ่ม Routing number (101019644) สำหรับ USD ACH และ BIC (CFTEMTM1) สำหรับ EUR SEPA',
      ],
    },
  },
  {
    version: '2.6.155',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '수취 계좌: USD=ACH·EUR=SEPA 입력 필드로 분리. 표시명 EURO→EUR. ONTHELINE ACH/SEPA 기본값.',
      ],
      US: [
        'Receiving accounts: USD=ACH and EUR=SEPA field sets. Label EURO→EUR. Seed ONTHELINE ACH/SEPA defaults.',
      ],
      JP: [
        '受取口座: USD=ACH・EUR=SEPA入力に分離。表示EURO→EUR。ONTHELINE ACH/SEPA既定値。',
      ],
      CH: [
        '收款账户：USD=ACH、EUR=SEPA 字段分离；EURO→EUR；写入 ONTHELINE ACH/SEPA 默认值。',
      ],
      TH: [
        'บัญชีรับ: USD=ACH / EUR=SEPA แยกฟิลด์ เปลี่ยน EURO→EUR ใส่ค่าเริ่มต้น ONTHELINE',
      ],
    },
  },
  {
    version: '2.6.154',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '로그인 사칭 피해 주의 안내(폐사…)를 KR 기준으로 US·JP·CH·TH 동일 내용 번역 반영.',
      ],
      US: [
        'Login impersonation advisory aligned to Korean source text for US/JP/CH/TH.',
      ],
      JP: [
        'ログインなりすまし注意案内を韓国語原文基準で US・JP・CH・TH に同内容翻訳。',
      ],
      CH: [
        '登录冒充诈骗注意告知按韩语原文同步翻译至 US/JP/CH/TH。',
      ],
      TH: [
        'ปรับข้อความเตือนแอบอ้างหน้าล็อกอินให้ตรงต้นฉบับเกาหลีครบ US/JP/CH/TH',
      ],
    },
  },
  {
    version: '2.6.153',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '로그인 사칭 안내 문구 간소화(폐사…). 비밀번호/OTP 초기화 로그인 노출 ON/OFF. OTP 찾기→OTP 초기화.',
      ],
      US: [
        'Shorten login fraud notice. Separate ON/OFF for Password/OTP reset on login. Rename OTP find → OTP reset.',
      ],
      JP: [
        'ログインなりすまし案内を短縮。パスワード/OTP初期化の表示ON/OFF。OTP探す→OTP初期化。',
      ],
      CH: [
        '精简登录防冒充提示。登录页密码/OTP重置独立开关。OTP找回→OTP重置。',
      ],
      TH: [
        'ย่อข้อความเตือนแอบอ้างที่ล็อกอิน เปิด/ปิดแสดงรีเซ็ตรหัสผ่าน/OTP แยก เปลี่ยนชื่อเป็นรีเซ็ต OTP',
      ],
    },
  },
  {
    version: '2.6.152',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: ['수취 계좌·통화 표시명을 USD / EURO로 통일.'],
      US: ['Receiving-account currency labels shown as USD / EURO.'],
      JP: ['受取口座の通貨表示を USD / EURO に統一。'],
      CH: ['收款账户币种显示统一为 USD / EURO。'],
      TH: ['ป้ายสกุลบัญชีรับแสดงเป็น USD / EURO'],
    },
  },
  {
    version: '2.6.151',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '플랫폼: 고객 입금 수취 계좌(USD·EURO 포함)를 도메인·SSL 바로 위 독립 섹션으로 분리. 가입 시 동일 유형 이메일·전화 중복 차단, 기업→개인(및 반대) 동일 연락처 가입 허용.',
      ],
      US: [
        'Platform: deposit accounts (incl. USD/EURO) as a section above Domain · SSL. Block same-type email/phone duplicates; allow corporate↔individual signup with the same contact.',
      ],
      JP: [
        'プラットフォーム: 入金受取口座(USD·EURO含む)をドメイン·SSL直上の独立セクションへ。同一種別のメール·電話重複を禁止し、企業↔個人の同一連絡先登録を許可。',
      ],
      CH: [
        '平台：收款账户（含 USD/EURO）独立分区置于域名·SSL 上方。同类型邮箱/手机不可重复；允许企业↔个人使用同一联系方式注册。',
      ],
      TH: [
        'แพลตฟอร์ม: แยกบัญชีรับเงิน(รวม USD/EURO)ไว้เหนือโดเมน·SSL บล็อกอีเมล/โทรซ้ำประเภทเดียวกัน อนุญาตองค์กร↔บุคคลใช้ติดต่อเดียวกัน',
      ],
    },
  },
  {
    version: '2.6.150',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '로그인 가입 안내 마침표 제거. 고객관리 청구방식 「본사설정수정합니다」→「본사설정」.',
      ],
      US: [
        'Remove trailing period from login signup notice. Customer billing method label: “Modify HQ setting” → “HQ setting”.',
      ],
      JP: [
        'ログイン登録案内の句点を削除。顧客の請求方式ラベル「本社設定を修正」→「本社設定」。',
      ],
      CH: [
        '登录注册说明去掉句号。客户计费方式标签「修改总部设置」→「总部设置」。',
      ],
      TH: [
        'ลบจุดท้ายข้อความสมัครที่ล็อกอิน เปลี่ยนป้ายวิธีเรียกเก็บในลูกค้าเป็น「การตั้งค่า HQ」',
      ],
    },
  },
  {
    version: '2.6.149',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '본사정책→플랫폼: 고객 입금 수취 계좌에 USD(USDT)·EURO(EURC) 추가. 개인고객 직접송금·USDT 매입 통화로 선택·안내 가능.',
      ],
      US: [
        'HQ Policy → Platform: add USD (USDT) and EURO (EURC) receiving accounts for individual direct remittance and USDT purchase.',
      ],
      JP: [
        '本社ポリシー→プラットフォーム: 顧客入金受取口座にUSD（USDT）・EURO（EURC）を追加。個人の直接送金・USDT購入で選択・案内可能。',
      ],
      CH: [
        '总部策略→平台：客户入金收款账户新增 USD（USDT）与 EURO（EURC），供个人直接汇款与 USDT 采购选择展示。',
      ],
      TH: [
        'นโยบาย HQ→แพลตฟอร์ม: เพิ่มบัญชีรับ USD (USDT) และ EURO (EURC) สำหรับลูกค้าบุคคลโอนตรงและซื้อ USDT',
      ],
    },
  },
  {
    version: '2.6.148',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: ['로그인 가입 안내를 「개인회원전용 / 기업고객 가입불가.」만 남기고 나머지 문구 제거.'],
      US: ['Login signup notice shortened to “Individuals only / No corporate signup.”'],
      JP: ['ログインの登録案内を「個人会員専用 / 企業顧客は登録不可。」のみに簡素化。'],
      CH: ['登录注册说明精简为「仅限个人会员 / 企业客户不可注册。」'],
      TH: ['ข้อความสมัครที่ล็อกอินเหลือแค่「สำหรับบุคคลเท่านั้น / องค์กรสมัครไม่ได้」'],
    },
  },
  {
    version: '2.6.147',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '빠른송금 기본=사용, 플레이스홀더「서비스 선택」. 관리자 빈 화면: 구빌드 청크 정리·HTML no-cache·청크오류 자동복구·대시보드 오류경계 보강.',
      ],
      US: [
        'Fast remittance defaults to Use; placeholder “Select a service”. Admin blank screen: clean stale chunks, HTML no-cache, chunk-error auto-recovery, dashboard error boundary.',
      ],
      JP: [
        'クイック送金の既定=使用、プレースホルダ「サービスを選択」。管理画面空白: 旧チャンク削除・HTML no-cache・チャンクエラー自動復旧・エラー境界強化。',
      ],
      CH: [
        '快速汇款默认「使用」，占位改为「选择服务」。管理端空白页：清理旧构建、HTML 禁止缓存、块加载失败自动恢复、仪表盘错误边界。',
      ],
      TH: [
        'โอนด่วนเริ่มต้น=ใช้ ข้อความเลือก「เลือกบริการ」 แก้หน้าผู้ดูแลว่าง: ล้างชิ้นส่วนเก่า, no-cache HTML, กู้คืนเมื่อโหลดชิ้นส่วนพลาด, error boundary',
      ],
    },
  },
  {
    version: '2.6.146',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: ['로그인: 「비밀번호 / OTP 찾기」 안내문 제거, 로그인 버튼과 동일 크기의 파스텔 그레이 메뉴로 표시.'],
      US: ['Login: remove recover hint text; show Password / OTP recovery as a pastel-gray control matching login button size.'],
      JP: ['ログイン: 「パスワード / OTP を探す」説明文を削除し、ログインボタンと同サイズのパステルグレーメニューに。'],
      CH: ['登录：移除「密码 / OTP 找回」说明文字，改为与登录按钮同尺寸的灰粉菜单。'],
      TH: ['ล็อกอิน: ลบข้อความอธิบายค้นหารหัสผ่าน/OTP แสดงเมนูเทาพาสเทลขนาดเดียวกับปุ่มเข้าสู่ระบบ'],
    },
  },
  {
    version: '2.6.145',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '인증번호 발송: 확인 창 후 실제 SMTP 발송. 발송 실패 시 오류 표시. 가입/복구 이메일 정규화.',
      ],
      US: [
        'Verification email: confirm dialog then real SMTP send; surface send failures; normalize signup/recovery emails.',
      ],
      JP: [
        '認証番号送信: 確認ダイアログ後に実SMTP送信。失敗時はエラー表示。登録/復旧メール正規化。',
      ],
      CH: [
        '验证码发送：确认后通过 SMTP 实际发送；失败时显示错误；注册/恢复邮箱规范化。',
      ],
      TH: [
        'ส่งรหัสยืนยัน: ยืนยันก่อนแล้วส่ง SMTP จริง แสดงข้อผิดพลาดเมื่อส่งไม่ได้ ปรับอีเมลสมัคร/กู้คืน',
      ],
    },
  },
  {
    version: '2.6.144',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '가입: 빠른송금 회사 드롭다운(Wise·Remitly 등·Other). 언어별 기본 국가번호. 한도에 미국·중국 추가(태국 33만 바트). 공개모집 OFF 시 비밀번호/OTP 찾기 비활성·로그인 회색 메뉴화.',
      ],
      US: [
        'Signup: fast-remittance company dropdown (Wise, Remitly, …, Other); locale default dial code; US/CN limits (THB 330k); recover gated when public signup OFF and gray menu on login.',
      ],
      JP: [
        '登録: クイック送金会社ドロップダウン（Wise・Remitly等・Other）。言語別既定国番号。米・中限度追加（タイ33万バーツ）。公開募集OFF時はパスワード/OTP復旧を無効・ログインに灰色メニュー。',
      ],
      CH: [
        '注册：快速汇款公司下拉（Wise、Remitly 等、Other）；按语言默认国家区号；增加美/中限额（泰国33万铢）；公开招募关闭时禁用密码/OTP找回并在登录页灰色菜单展示。',
      ],
      TH: [
        'สมัคร: ดรอปดาวน์บริษัทโอนด่วน (Wise·Remitly ฯลฯ·Other) รหัสประเทศตามภาษา เพิ่มวงเงินสหรัฐ/จีน (ไทย 3.3 แสนบาท) ปิดรับสมัครสาธารณะแล้วปิดค้นหารหัสผ่าน/OTP และเมนูเทาที่ล็อกอิน',
      ],
    },
  },
  {
    version: '2.6.143',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '가입 제목 「개인 회원가입」·안내 문구 수정. 로고 여백 확대. 추천자 기본=없음(본사). 조직관리에서 추천·가입 담당 이메일 지정.',
      ],
      US: [
        'Signup title “Individual sign up” and copy update; more logo spacing; referrer default=No (HQ). Org settings: choose referral/invite staff email.',
      ],
      JP: [
        '登録タイトル「個人会員登録」・案内文修正。ロゴ余白拡大。紹介者既定=なし（本社）。組織管理で紹介・登録担当メール指定。',
      ],
      CH: [
        '注册标题改为「个人注册」并更新说明；加大 Logo 间距；推荐人默认「无」（总部）。组织管理可指定推荐/注册负责邮箱。',
      ],
      TH: [
        'หัวข้อสมัคร「สมัครบุคคล」แก้ข้อความ เพิ่มระยะโลโก้ ผู้แนะนำเริ่มต้น=ไม่มี (HQ) ตั้งอีเมลผู้ดูแลแนะนำได้ที่จัดการองค์กร',
      ],
    },
  },
  {
    version: '2.6.142',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '가입: 입금통장 위 WISE 송금 유무·송금자 정보. 통장 안내 아래 반송 계좌 빨간 경고. 통화 배치 KRW·THB / JPY·CNY.',
      ],
      US: [
        'Signup: WISE yes/no and sender details above bank accounts; red refund-same-account warning; currency grid KRW·THB / JPY·CNY.',
      ],
      JP: [
        '登録: 入金口座の上にWISE有無・送金者情報。口座案内下に返送口座の赤警告。通貨配置 KRW·THB / JPY·CNY。',
      ],
      CH: [
        '注册：入金账户上方增加 WISE 有无与汇款人信息；账户说明下红色退款同账户警告；币种排列 KRW·THB / JPY·CNY。',
      ],
      TH: [
        'สมัคร: ด้านบนบัญชีฝากมี WISE มี/ไม่มีและข้อมูลผู้ส่ง คำเตือนแดงคืนเงินบัญชีเดิม จัดสกุล KRW·THB / JPY·CNY',
      ],
    },
  },
  {
    version: '2.6.141',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '본사정책 「개인고객 공개 회원가입」ON=일반 공개가입, OFF=조직 개인가입 링크(?org/?ref)만 허용. 로그인 공개 버튼도 동일 정책에 연동.',
      ],
      US: [
        'HQ “Allow individual public signup”: ON = open self-signup; OFF = organization invite links (?org/?ref) only. Login signup CTA follows the same policy.',
      ],
      JP: [
        '本社「個人公開登録」ON=一般公開登録、OFF=組織の個人登録リンク(?org/?ref)のみ。ログインの登録ボタンも同ポリシー連動。',
      ],
      CH: [
        '总部「允许个人公开注册」ON=公开自助注册，OFF=仅组织个人注册链接(?org/?ref)。登录页注册按钮同步该策略。',
      ],
      TH: [
        'นโยบาย HQ 「อนุญาตสมัครสาธารณะบุคคล」ON=สมัครเปิด, OFF=เฉพาะลิงก์องค์กร (?org/?ref) ปุ่มสมัครหน้าเข้าสู่ระบบตามนโยบายเดียวกัน',
      ],
    },
  },
  {
    version: '2.6.140',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '회원가입 왼쪽 이미지를 로그인 배경과 분리. 미등록 시 미표시, 본사정책→플랫폼 브랜드에서 전용 이미지 업로드(권장 720×1280). 「추천자 없음」괄호 문구 제거.',
      ],
      US: [
        'Signup left image is separate from login background; hidden when unset. Upload under HQ policy → Platform brand (recommended 720×1280). Removed parenthetical from “No referrer”.',
      ],
      JP: [
        '会員登録の左画像をログイン背景と分離。未設定時は非表示。本社ポリシー→プラットフォームで専用画像アップロード（推奨720×1280）。「紹介者なし」の括弧表記を削除。',
      ],
      CH: [
        '注册页左侧图与登录背景分离；未上传则不显示。可在总部政策→平台品牌上传专用图（建议720×1280）。去掉「无推荐人」括号说明。',
      ],
      TH: [
        'แยกรูปซ้ายหน้าสมัครจากพื้นหลังเข้าสู่ระบบ ไม่แสดงถ้าไม่อัปโหลด อัปโหลดได้ที่นโยบาย HQ→แพลตฟอร์ม (แนะนำ 720×1280) ลบข้อความในวงเล็บของ「ไม่มีผู้แนะนำ」',
      ],
    },
  },
  {
    version: '2.6.139',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '개인 회원가입을 넓은 가입창(다단 배치)으로 전환. 계정·추천·입금통장·지갑을 구역별로 배치해 우측 한 줄 스크롤을 해소.',
      ],
      US: [
        'Individual signup uses a wide multi-column form. Account, referrer, bank, and wallet are sectioned to avoid the narrow right-panel scroll.',
      ],
      JP: [
        '個人会員登録を広い複数カラムの登録画面に変更。口座・紹介・入金口座・ウォレットを区画配置し、右狭パネルの縦長スクロールを解消。',
      ],
      CH: [
        '个人注册改为宽版多列表单。账户、推荐人、入金账户、钱包分区排列，避免右侧窄栏单列滚动。',
      ],
      TH: [
        'หน้าสมัครบุคคลเป็นฟอร์มกว้างหลายคอลัมน์ จัดกลุ่มบัญชี ผู้แนะนำ บัญชีฝาก กระเป๋า ลดการเลื่อนแนวตั้งในแผงขวาแคบ',
      ],
    },
  },
  {
    version: '2.6.138',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '로그인 첫화면에 개인고객 가입 버튼·경고 노출. 가입 안내(기업가입 불가·국가별 1회 한도)는 본사정책→플랫폼 「개인고객 정책」에서 다국어 수정. 비밀번호·OTP 찾기는 기업·개인 동일.',
      ],
      US: [
        'Login shows individual signup CTA and warning. Signup notice (no corporate signup; country per-tx caps) is editable under HQ policy → Platform → Individual customer policy. Password/OTP recovery works for corporate and individual alike.',
      ],
      JP: [
        'ログイン画面に個人登録ボタン・警告を表示。登録案内（法人不可・国別1回限度）は本社ポリシー→プラットフォーム「個人顧客ポリシー」で多言語編集。パスワード・OTP復旧は法人・個人共通。',
      ],
      CH: [
        '登录页显示个人注册按钮与警告。注册须知（企业不可注册、各国单笔限额）可在总部政策→平台「个人客户政策」多语言编辑。密码/OTP找回对企业与个人相同。',
      ],
      TH: [
        'หน้าเข้าสู่ระบบแสดงปุ่มสมัครบุคคลและคำเตือน ประกาศสมัคร (องค์กรสมัครไม่ได้ วงเงินตามประเทศ) แก้ได้ที่นโยบาย HQ → แพลตฟอร์ม นโยบายลูกค้าบุคคล กู้รหัสผ่าน/OTP ใช้ได้ทั้งองค์กรและบุคคล',
      ],
    },
  },
  {
    version: '2.6.137',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '공개 가입은 개인만 가능(기업은 관리자 등록). 조직별 개인가입 링크로 추천·유치 자동 지정. 청구방식 「본사설정수정합니다」. 데모명 「데모/샌드박스」.',
      ],
      US: [
        'Public signup is individual-only (corporate via admin). Org invite links auto-set referral/recruiting. Billing label “Modify HQ setting”. Demo name “Demo/Sandbox”.',
      ],
      JP: [
        '公開登録は個人のみ（企業は管理者）。組織別個人登録リンクで紹介・獲得を自動指定。請求「本社設定を修正」。デモ名「デモ/サンドボックス」。',
      ],
      CH: [
        '公开注册仅限个人（企业由管理员）。各组织个人注册链接自动指定推荐归属。账单方式「修改总部设置」。演示名「演示/沙箱」。',
      ],
      TH: [
        'สมัครสาธารณะเฉพาะบุคคล (องค์กรผ่านแอดมิน) ลิงก์สมัครองค์กรกำหนดผู้แนะนำอัตโนมัติ ป้ายเรียกเก็บ「แก้ไขการตั้งค่า HQ」 ชื่อเดโม「เดโม/แซนด์บ็อกซ์」',
      ],
    },
  },
  {
    version: '2.6.136',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '공개 가입: 추천자를 이메일·업체명(개인=성명)으로 검색·확인 후 가입. 조직 유형 비표시. 추천 없으면 본사 직속. 관리자 수동 등록은 유지.',
      ],
      US: [
        'Public signup: search and confirm referrer by email or business/personal name (no org type shown). No referrer → HQ direct. Admin manual registration unchanged.',
      ],
      JP: [
        '公開登録: 紹介者をメール・事業者名（個人は氏名）で検索確認後に登録。組織種別は非表示。紹介なしは本社直属。管理者手動登録は維持。',
      ],
      CH: [
        '公开注册：按邮箱或公司名/姓名搜索确认推荐人后注册，不显示组织类型；无推荐人则总部直属。管理员手动注册保持不变。',
      ],
      TH: [
        'สมัครสาธารณะ: ค้นหา/ยืนยันผู้แนะนำด้วยอีเมลหรือชื่อกิจการ/ชื่อบุคคล (ไม่แสดงประเภทองค์กร) ไม่มีผู้แนะนำ=สำนักงานใหญ่ แอดมินเพิ่มลูกค้าเองยังใช้ได้',
      ],
    },
  },
  {
    version: '2.6.135',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '로그인에 비밀번호·OTP 찾기 추가. 이메일 인증번호로 비밀번호 재설정 또는 Google OTP 초기화 후 재등록.',
      ],
      US: [
        'Added Forgot password/OTP on login. Email code resets password or clears Google OTP for re-enrollment.',
      ],
      JP: [
        'ログインにパスワード・OTP復旧を追加。メール認証でパスワード再設定、または Google OTP 初期化後の再登録。',
      ],
      CH: [
        '登录页增加忘记密码/OTP。邮箱验证码可重置密码或清除 Google OTP 以便重新注册。',
      ],
      TH: [
        'เพิ่มลืมรหัสผ่าน/OTP ที่หน้าเข้าสู่ระบบ รีเซ็ตรหัสผ่านหรือล้าง Google OTP ด้วยรหัสอีเมลแล้วลงทะเบียนใหม่',
      ],
    },
  },
  {
    version: '2.6.134',
    kind: 'minor',
    date: '2026-10-04',
    items: {
      KR: [
        '메뉴 「크립토 매입」으로 명칭 변경. 개인 자기가입은 관리자 승인 전까지 조회만 가능. 고객 상세에서 가입 승인·거절, 목록 필터 추가.',
      ],
      US: [
        'Renamed menu to Crypto purchase. Self-registered individuals are view-only until admin approval. Approve/reject on customer detail; list filter added.',
      ],
      JP: [
        'メニュー名を「クリプト購入」に変更。自己登録の個人は管理者承認まで閲覧のみ。顧客詳細で承認・拒否、一覧フィルタ追加。',
      ],
      CH: [
        '菜单更名为「加密货币采购」。自行注册个人在管理员批准前仅可查看。客户详情可批准/拒绝，并增加列表筛选。',
      ],
      TH: [
        'เปลี่ยนเมนูเป็นซื้อคริปโต ลูกค้าบุคคลสมัครเองดูได้อย่างเดียวจนกว่าแอดมินอนุมัติ มีปุ่มอนุมัติ/ปฏิเสธและตัวกรองในรายการ',
      ],
    },
  },
  {
    version: '2.6.133',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '예상완료 등급을 계좌이체·카드결제로 분리. 본사 T+N 표 2종, 가맹점 등록 시 각각 필수 설정. 티켓은 결제수단에 맞는 등급으로 예상완료일 계산.',
      ],
      US: [
        'Split expected-completion tiers for bank transfer vs card. Two HQ T+N tables; both required on merchant registration. Tickets use the matching channel.',
      ],
      JP: [
        '完了予定等級を口座振替とカード決済で分離。本社T+N表を2種、加盟店登録でそれぞれ必須。チケットは決済手段に応じて計算。',
      ],
      CH: [
        '预计完成等级按银行转账与卡支付分离。总部两套 T+N 表，商户注册均必填。工单按支付方式计算。',
      ],
      TH: [
        'แยกระดับกำหนดเสร็จโอนบัญชีกับชำระบัตร มีตาราง T+N สองชุดใน HQ บังคับทั้งคู่ตอนลงทะเบียน และคำนวณตามช่องทางชำระเงิน',
      ],
    },
  },
  {
    version: '2.6.132',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '가맹점 예상완료 등급(REGULAR/PLUS/PRIME/ELITE/SIGNATURE·직접입력 T+1~10) 추가. 본사 진행상태·처리시한에서 등급별 T+N 설정, 고객 등록 시 필수 「예상완료설정」 반영.',
      ],
      US: [
        'Added merchant expected-completion tiers (REGULAR/PLUS/PRIME/ELITE/SIGNATURE and custom T+1–10). HQ Status & SLA sets T+N per tier; required on customer registration.',
      ],
      JP: [
        '加盟店の完了予定等級（REGULAR/PLUS/PRIME/ELITE/SIGNATURE・直接入力T+1〜10）を追加。本社の進行状態・処理期限で等級別T+Nを設定し、顧客登録時に必須化。',
      ],
      CH: [
        '新增商户预计完成等级（REGULAR/PLUS/PRIME/ELITE/SIGNATURE 与自定义 T+1～10）。总部进度与处理时限可设各等级 T+N，客户注册时必填。',
      ],
      TH: [
        'เพิ่มระดับกำหนดเสร็จของร้าน (REGULAR/PLUS/PRIME/ELITE/SIGNATURE และกำหนดเอง T+1–10) ตั้ง T+N ต่อระดับในสถานะและ SLA ของ HQ และบังคับตอนลงทะเบียนลูกค้า',
      ],
    },
  },
  {
    version: '2.6.131',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '거래명세: 발송(활성/비활성/본사만)과 보기·PDF 노출을 분리. 플랫폼·가맹점에 관리자 노출·가맹점 노출 설정 추가.',
      ],
      US: [
        'Trade receipt: split send mode from View/PDF visibility. Added admin and merchant visibility settings on Platform and merchant screens.',
      ],
      JP: [
        '取引明細: 送信設定と閲覧・PDF表示を分離。プラットフォーム・加盟店に管理者/加盟店表示設定を追加。',
      ],
      CH: [
        '交易明细：发送模式与查看/PDF 显示分离。平台与商户增加管理员/商户显示设置。',
      ],
      TH: [
        'ใบเสร็จ: แยกโหมดส่งกับการแสดงดู/PDF เพิ่มตั้งค่าการแสดงแอดมิน/ร้านในแพลตฟอร์มและร้าน',
      ],
    },
  },
  {
    version: '2.6.130',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '거래명세 보기·PDF·이메일: 한국어·영어·일본어·중국어·태국어 5개국어로 표기.',
      ],
      US: [
        'Trade receipt View/PDF/email now includes all five languages: Korean, English, Japanese, Chinese, Thai.',
      ],
      JP: [
        '取引明細の閲覧・PDF・メールを韓・英・日・中・タイの5言語で表示。',
      ],
      CH: [
        '交易明细查看/PDF/邮件现以韩、英、日、中、泰五种语言显示。',
      ],
      TH: [
        'ใบเสร็จดู/PDF/อีเมลแสดงครบ 5 ภาษา: เกาหลี อังกฤษ ญี่ปุ่น จีน ไทย',
      ],
    },
  },
  {
    version: '2.6.129',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '본사정책 > 플랫폼: 「기본 거래명세서 설정」카드를 도메인·SSL과 이메일·OTP 사이에 분리. 전용 저장 버튼 추가.',
      ],
      US: [
        'HQ Policy > Platform: split 「Default trade receipt settings」 into its own card between Domain/SSL and Email/OTP, with a dedicated save button.',
      ],
      JP: [
        '本社ポリシー > プラットフォーム: 「基本取引明細書設定」をドメイン・SSLとメール・OTPの間の独立カードに分離。専用保存ボタン追加。',
      ],
      CH: [
        '总部政策 > 平台：将「默认交易明细设置」单独成卡片，放在域名·SSL 与邮箱·OTP 之间，并增加专用保存。',
      ],
      TH: [
        'นโยบาย HQ > แพลตฟอร์ม: แยกการ์ด「ตั้งค่าใบเสร็จเริ่มต้น」ไว้ระหว่าง Domain/SSL กับ Email/OTP พร้อมปุ่มบันทึกเฉพาะ',
      ],
    },
  },
  {
    version: '2.6.128',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        'USDT 완료 거래명세 「보기」: 팝업이 비어 보이던 문제 수정(Blob URL). 본사만 모드에서는 본사 보기·PDF만, 가맹점에는 미표시. 이메일 발송 안내는 실제 발송 시에만 표시.',
      ],
      US: [
        'USDT complete receipt View: fixed blank popup (Blob URL). HQ-only shows HQ View/PDF; hidden for merchants. Sent notice only when email was actually enabled.',
      ],
      JP: [
        'USDT完了の取引明細「見る」: 空のポップアップを修正(Blob URL)。本社のみでは本社の閲覧・PDFのみ、加盟店には非表示。送信案内は実際にメール有効時のみ。',
      ],
      CH: [
        'USDT 完成明细「查看」：修复空白弹窗(Blob URL)。仅总部模式下总部可看/PDF，商户不显示。发送提示仅在实际发邮件时显示。',
      ],
      TH: [
        'ใบเสร็จ USDT ปุ่มดู: แก้ป๊อปอัปว่าง (Blob URL) โหมดเฉพาะ HQ เห็นแค่ HQ ร้านไม่เห็น ข้อความส่งอีเมลแสดงเมื่อเปิดส่งจริงเท่านั้น',
      ],
    },
  },
  {
    version: '2.6.127',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '본사정책 > 플랫폼: 사이트 이름 기준(text-xs)으로 로고·파비콘·배경·미리보기·입금계좌·이메일 등 라벨·제목 글자 크기 통일.',
      ],
      US: [
        'HQ Policy > Platform: unified label/title font size to match Site name (text-xs) across logos, favicon, background, preview, deposit accounts, and email.',
      ],
      JP: [
        '本社ポリシー > プラットフォーム: サイト名基準(text-xs)でロゴ・ファビコン・背景・プレビュー・入金口座・メール等のラベル・見出しサイズを統一。',
      ],
      CH: [
        '总部政策 > 平台：按站点名称字号(text-xs)统一Logo、图标、背景、预览、入金账户、邮件等标签与标题。',
      ],
      TH: [
        'นโยบาย HQ > แพลตฟอร์ม: รวมขนาดตัวอักษรป้าย/หัวข้อให้เท่าชื่อไซต์ (text-xs) ทั้งโลโก้ ฟาวิคอน พื้นหลัง พรีวิว บัญชีฝาก และอีเมล',
      ],
    },
  },
  {
    version: '2.6.126',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '가맹점 고객정보·등록/수정에 거래명세 이메일(본사설정따름/활성/비활성/본사만) 카드 표시.',
        'USDT 완료 카드: 「거래 명세서 보기·PDF」를 위로, 발송 안내 문구를 아래로 배치.',
        '샌드박스 완료도 본사·가맹점 설정에 따라 거래명세(보관/이메일)가 동일하게 발생.',
      ],
      US: [
        'Trade receipt email (Follow HQ/Enabled/Disabled/HQ only) on merchant detail and create/edit.',
        'USDT complete card: View/PDF above, sent notice below.',
        'Sandbox completion also creates trade receipts per HQ/merchant settings.',
      ],
      JP: [
        '加盟店の顧客情報・登録/修正に取引明細メール（本社設定に従う/有効/無効/本社のみ）を表示。',
        'USDT完了カード: 閲覧・PDFを上、送信案内を下に配置。',
        'サンドボックス完了でも本社・加盟店設定に従い取引明細が発生。',
      ],
      CH: [
        '商户客户信息与注册/修改中显示交易明细邮件（跟随总部/启用/停用/仅总部）。',
        'USDT 完成卡片：查看/PDF 在上，发送提示在下。',
        '沙盒完成也按总部/商户设置生成交易明细。',
      ],
      TH: [
        'แสดงอีเมลใบเสร็จบนหน้าร้านและลงทะเบียน/แก้ไข (ตาม HQ/เปิด/ปิด/เฉพาะ HQ)',
        'การ์ดจบ USDT: ดู/PDF อยู่บน ข้อความแจ้งส่งอยู่ล่าง',
        'จบแซนด์บ็อกซ์ก็สร้างใบเสร็จตามตั้งค่า HQ/ร้าน',
      ],
    },
  },
  {
    version: '2.6.125',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '거래명세 본사 기본값을 「본사만」으로 변경. 가맹점 등록 기본은 「본사설정따름」 유지.',
      ],
      US: [
        'HQ trade-receipt default is now HQ only. Merchant registration still defaults to Follow HQ.',
      ],
      JP: [
        '取引明細の本社既定を「本社のみ」に変更。加盟店登録の既定は「本社設定に従う」のまま。',
      ],
      CH: [
        '总部交易明细默认改为「仅总部」。商户注册默认仍为「跟随总部」。',
      ],
      TH: [
        'ค่าเริ่ม HQ ของใบเสร็จเป็นเฉพาะ HQ แล้ว ค่าเริ่มร้านยังตาม HQ',
      ],
    },
  },
  {
    version: '2.6.124',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '거래명세: 본사 활성/비활성/본사만, 가맹점 본사설정따름/활성/비활성/본사만. 보기·PDF는 본사만, 가맹점 활성은 안내 문구만. 비활성은 카드·이메일·본사 보관 없음.',
      ],
      US: [
        'Trade receipt: HQ Enabled/Disabled/HQ only; merchant Follow HQ/Enabled/Disabled/HQ only. View and PDF are HQ-only. Merchants on Enabled see the notice only.',
      ],
      JP: [
        '取引明細: 本社は有効/無効/本社のみ、加盟店は本社設定に従う/有効/無効/本社のみ。閲覧・PDFは本社のみ。有効の加盟店は案内文だけ。',
      ],
      CH: [
        '交易明细：总部启用/停用/仅总部，商户跟随总部/启用/停用/仅总部。查看与PDF仅总部可见。商户启用时只显示提示。',
      ],
      TH: [
        'ใบเสร็จ: HQ เปิด/ปิด/เฉพาะ HQ ร้านตาม HQ/เปิด/ปิด/เฉพาะ HQ ปุ่มดูและ PDF เห็นแค่ HQ ร้านที่เปิดเห็นแค่ข้อความ',
      ],
    },
  },
  {
    version: '2.6.123',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        'USDT 완료 안내: 「거래 명세서 보기」는 새 창, 옆의 PDF는 명세서 파일 다운로드.',
      ],
      US: [
        'USDT completion: View trade receipt opens a new window; PDF downloads the statement.',
      ],
      JP: [
        'USDT完了案内: 「取引明細書を見る」は新しいウィンドウ、PDFは明細書をダウンロード。',
      ],
      CH: [
        'USDT完成提示：「查看交易明细」新窗口打开，旁边的 PDF 下载明细文件。',
      ],
      TH: [
        'เมื่อจบ USDT: ดูใบเสร็จเปิดหน้าต่างใหม่ และ PDF ดาวน์โหลดไฟล์',
      ],
    },
  },
  {
    version: '2.6.122',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '운영관리 > 명세서관리: 거래명세 이메일 발송 이력(성공·실패·스킵)·본문 조회. USDT·무역 완료 시 발송·기록. 가맹점별 본사설정따름/활성/비활성, 본사 플랫폼 기본 발송 설정.',
      ],
      US: [
        'Ops > Trade receipts: send history (sent/failed/skipped) with body view. USDT & escrow completion logging. Per-merchant Follow HQ/Enabled/Disabled; HQ platform default remains.',
      ],
      JP: [
        '運営管理>明細書管理: 取引明細メール履歴(成功・失敗・スキップ)と本文確認。USDT・貿易完了で送信記録。加盟店は本社設定に従う/有効/無効、本社プラットフォーム既定あり。',
      ],
      CH: [
        '运营管理>明细管理：交易明细邮件履历（成功/失败/跳过）与正文。USDT与贸易完成时发送并记录。商户可跟随总部/启用/停用，总部平台有默认开关。',
      ],
      TH: [
        'ปฏิบัติการ>จัดการใบเสร็จ: ประวัติส่งอีเมล (สำเร็จ/ล้มเหลว/ข้าม) และเนื้อหา ส่งและบันทึกเมื่อจบ USDT/เอสโครว์ ร้านตั้งตาม HQ/เปิด/ปิด HQ มีค่าเริ่มที่แพลตฟอร์ม',
      ],
    },
  },
  {
    version: '2.6.121',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '상태 이력에서 [SANDBOX] 표기 제거(본사·가맹점 공통). 완료 시에도 이력 메모에 샌드박스 문구를 넣지 않음.',
      ],
      US: [
        'Hide [SANDBOX] from status history for HQ and merchants. Completion no longer writes sandbox text into history notes.',
      ],
      JP: [
        '状態履歴から[SANDBOX]表示を削除（本社・加盟店共通）。完了時も履歴メモにサンドボックス文言を入れない。',
      ],
      CH: [
        '状态履历中对总部与商户均隐藏[SANDBOX]。完成时也不再写入沙箱备注。',
      ],
      TH: [
        'ซ่อน [SANDBOX] ในประวัติสถานะทั้ง HQ และร้าน ไม่เขียนข้อความ sandbox ตอนจบแล้ว',
      ],
    },
  },
  {
    version: '2.6.120',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: ['USDT 비고: 완료 전 지연은 레드 파스텔, 완료·취소 후 지연은 그레이.'],
      US: ['USDT Note: active delay uses red pastel; completed/cancelled delay stays gray.'],
      JP: ['USDT備考: 完了前の遅延はレッドパステル、完了・取消後はグレー。'],
      CH: ['USDT备注：完成前延期为红色粉彩，完成/取消后为灰色。'],
      TH: ['หมายเหตุ USDT: ก่อนจบใช้แดงพาสเทล หลังจบ/ยกเลิกเป็นเทา'],
    },
  },
  {
    version: '2.6.119',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '상태 이력에 완료일 지연 표시. USDT 비고: 진행 중 지연은 강조, 완료·취소 후 지연은 그레이. 라이브 완료 시 [SANDBOX] 자동 부착 제거.',
      ],
      US: [
        'Status history shows schedule delays. USDT Note: active delay highlighted; past delay on completed tickets is gray. Live completion no longer auto-tags [SANDBOX].',
      ],
      JP: [
        '状態履歴に完了日遅延を表示。USDT備考: 進行中遅延は強調、完了後はグレー。ライブ完了で[SANDBOX]自動付与を停止。',
      ],
      CH: [
        '状态履历显示完成日延期。USDT备注：进行中延期高亮，完成后灰色。实盘完成不再自动加[SANDBOX]。',
      ],
      TH: [
        'ประวัติสถานะแสดงการเลื่อนวันเสร็จ หมายเหตุ USDT: กำลังเลื่อนเน้นสี หลังจบเป็นเทา ปิดแท็ก [SANDBOX] อัตโนมัติตอนจบไลฟ์',
      ],
    },
  },
  {
    version: '2.6.118',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        'USDT 매입 목록: 상태와 예상완료일 사이에 「비고」열 추가. 일정 지연 시 「지연」, 그 외 「유지」 표시.',
      ],
      US: [
        'USDT list: add Note column between Status and Expected complete — Delayed if schedule extended, otherwise On schedule.',
      ],
      JP: [
        'USDT購入一覧: 状態と予定完了日の間に「備考」列。遅延時は「遅延」、それ以外は「維持」。',
      ],
      CH: [
        'USDT采购列表：在状态与预计完成日之间新增「备注」列；延期显示「延迟」，否则「维持」。',
      ],
      TH: [
        'รายการซื้อ USDT: เพิ่มคอลัมน์หมายเหตุระหว่างสถานะกับวันคาดเสร็จ — ล่าช้า/ตามกำหนด',
      ],
    },
  },
  {
    version: '2.6.117',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '예상지연일: 날짜 위 +시간 배지 제거. 본사는 사유 줄에 +시간·등록자 유지, 가맹점은 사유만 표시.',
      ],
      US: [
        'Delayed ETA: remove top +hours badge. HQ still shows +hours/operator in the reason line; merchants see reason only.',
      ],
      JP: [
        '予定遅延日: 日付上の+時間バッジを削除。本社は理由行に+時間・登録者を維持、加盟店は理由のみ。',
      ],
      CH: [
        '预计延期日：去掉日期上方的+小时角标。总部仍在原因行显示+小时/登记人，商户端仅显示原因。',
      ],
      TH: [
        'วันเลื่อนคาด: เอาแบดจ์ +ชม. บนวันที่ออก HQ ยังโชว์ +ชม./ผู้บันทึกในบรรทัดเหตุผล ร้านเห็นแค่เหตุผล',
      ],
    },
  },
  {
    version: '2.6.116',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '일정·고객: 일자 왼쪽 정렬(신청일과 동일). 가맹점 화면에서는 +시간·등록자 숨김, 지연일·사유만 표시.',
      ],
      US: [
        'Schedule card: left-align dates like Applied. Merchants see delayed date + reason only (no +hours / operator name).',
      ],
      JP: [
        '日程・顧客: 日付を申請日と同じ左寄せ。加盟店画面は遅延日・理由のみ（+時間・登録者非表示）。',
      ],
      CH: [
        '日程·客户：日期左对齐与申请日一致。商户端仅显示延期日与原因（不显示+小时/登记人）。',
      ],
      TH: [
        'กำหนด·ลูกค้า: ชิดซ้ายเหมือนวันสมัคร ฝั่งร้านเห็นแค่วันเลื่อน+เหตุผล (ไม่โชว์ +ชม./ชื่อผู้บันทึก)',
      ],
    },
  },
  {
    version: '2.6.115',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        '일정·고객: 고객·신청일·예상완료일(초기)·예상지연일·완료일 행 구조. 지연 시 상태 이력에 「완료일 지연」 기록.',
      ],
      US: [
        'Schedule card: Customer / Applied / Expected (base) / Delayed expected / Completed rows. Delays logged in status history.',
      ],
      JP: [
        '日程・顧客: 顧客・申請日・予定完了(初期)・予定遅延・完了の行表示。遅延は状態履歴に記録。',
      ],
      CH: [
        '日程·客户：客户/申请日/预计完成(初始)/预计延期/完成日分行。延期写入状态履历。',
      ],
      TH: [
        'กำหนด·ลูกค้า: แถวลูกค้า/วันสมัคร/วันคาด(เริ่ม)/วันเลื่อน/วันเสร็จ และบันทึกการเลื่อนในประวัติสถานะ',
      ],
    },
  },
  {
    version: '2.6.114',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        'USDT·에스크로: 완료일 지연(12~96시간)+사유 추가. 완료 시 실제 완료일 표시. 고객정보에 지갑 QR.',
        '고객 상세 위치: 운영관리 > 고객관리 > 고객정보.',
      ],
      US: [
        'USDT/Escrow: add completion delay (12–96h)+reason; show actual completed time. Wallet QR on customer info.',
        'Customer detail breadcrumb: Ops > Customers > Customer info.',
      ],
      JP: [
        'USDT・エスクロー: 完了遅延(12〜96h)+理由。実績完了日表示。顧客情報にウォレットQR。',
        '顧客詳細パンくず: 運営管理 > 顧客管理 > 顧客情報。',
      ],
      CH: [
        'USDT/托管：完成延期(12–96小时)+原因；显示实际完成时间。客户信息显示钱包二维码。',
        '客户详情面包屑：运营管理 > 客户管理 > 客户信息。',
      ],
      TH: [
        'USDT/เอสโครว์: เลื่อนวันเสร็จ(12–96 ชม.)+เหตุผล แสดงวันเสร็จจริง และ QR กระเป๋าในข้อมูลลูกค้า',
        'เส้นทาง: ปฏิบัติการ > ลูกค้า > ข้อมูลลูกค้า',
      ],
    },
  },
  {
    version: '2.6.113',
    kind: 'minor',
    date: '2026-10-01',
    items: {
      KR: [
        'USDT 정산: 수령 지갑을 QR·주소(COPY)·네트워크 배지로 분리. QR은 등록 주소 문자열만 인코딩.',
      ],
      US: [
        'USDT settlement: receiving wallet shows QR, address with COPY, and network badge. QR encodes address only.',
      ],
      JP: [
        'USDT精算: 受取ウォレットをQR・住所(COPY)・ネットワークバッジに分離。QRは登録住所のみ。',
      ],
      CH: [
        'USDT结算：收款钱包分为二维码、地址(COPY)、网络徽章。二维码仅编码登记地址。',
      ],
      TH: [
        'USDT ชำระ: แยกกระเป๋ารับเป็น QR / ที่อยู่(COPY) / ป้ายเครือข่าย QR เข้ารหัสที่อยู่เท่านั้น',
      ],
    },
  },
  {
    version: '2.6.112',
    kind: 'minor',
    date: '2026-09-30',
    items: {
      KR: [
        '본사권한: 대시보드·USDT·에스크로·장부를 「메인」 카드로 통합. 대메뉴 제목 배경을 파스텔 회색으로 구분.',
      ],
      US: [
        'HQ permissions: Dashboard/USDT/Escrow/Ledger grouped under Main card. Pastel gray card titles for clearer sections.',
      ],
      JP: [
        '本社権限: ダッシュボード・USDT・エスクロー・台帳を「メイン」カードに統合。大メニュー見出しをパステルグレーに。',
      ],
      CH: [
        '总部权限：仪表盘/USDT/托管/账本合并为「主菜单」卡片。大菜单标题改为柔和灰底以便区分。',
      ],
      TH: [
        'สิทธิ์ HQ: รวมแดชบอร์ด/USDT/เอสโครว์/บัญชีเป็นบัตร「เมนูหลัก」 และหัวบัตรสีเทาพาสเทลให้อ่านง่าย',
      ],
    },
  },
  {
    version: '2.6.111',
    kind: 'minor',
    date: '2026-09-30',
    items: {
      KR: [
        '본사권한·사용자설정: 좌측 대메뉴(운영관리·본사정책·인보이스 등)와 같이 카드별로 화면 권한을 구분 표시.',
      ],
      US: [
        'HQ permissions / User settings: page access grouped into cards by top-level sidebar menus (Ops, HQ Policy, Invoices, etc.).',
      ],
      JP: [
        '本社権限・ユーザー設定: 左サイド大メニュー（運営管理・本社ポリシー・インボイス等）ごとにカードで権限表示。',
      ],
      CH: [
        '总部权限/用户设置：按侧栏大菜单（运营管理、总部政策、发票等）分卡片展示页面权限。',
      ],
      TH: [
        'สิทธิ์ HQ/ตั้งค่าผู้ใช้: จัดกลุ่มสิทธิ์หน้าเป็นการ์ดตามเมนูหลักด้านซ้าย (ปฏิบัติการ นโยบาย HQ ใบแจ้งหนี้ ฯลฯ)',
      ],
    },
  },
  {
    version: '2.6.110',
    kind: 'minor',
    date: '2026-09-30',
    items: {
      KR: [
        '본사정책 → 접근·권한: 「사용자설정」에서 관리자별 페이지 접근 설정. 기존 「사용자설정」은 「보안설정」으로 변경.',
        '본사권한 NONE/VIEW/MODIFY/DELETE 선택 배경을 파스텔 톤으로 구분. 가맹점 대표는 운영자별 페이지 권한 설정 가능.',
      ],
      US: [
        'HQ Access: per-admin page access under User settings; former User settings renamed Security settings.',
        'Pastel colors for NONE/VIEW/MODIFY/DELETE. Merchant admins can set page access per operator.',
      ],
      JP: [
        '本社ポリシー→アクセス: 「ユーザー設定」で管理者別ページ権限。旧ユーザー設定は「セキュリティ設定」に改称。',
        'NONE/VIEW/MODIFY/DELETEをパステル色で区別。加盟店代表は運営者ごとにページ権限を設定可能。',
      ],
      CH: [
        '总部政策→访问：在「用户设置」按管理员配置页面权限；原「用户设置」改为「安全设置」。',
        'NONE/VIEW/MODIFY/DELETE 使用柔和底色区分。商户管理员可为运营者设置页面权限。',
      ],
      TH: [
        'นโยบาย HQ→การเข้าถึง: ตั้งค่าหน้าต่อผู้ดูแลใน「ตั้งค่าผู้ใช้」 และเปลี่ยนชื่อเดิมเป็น「ตั้งค่าความปลอดภัย」',
        'สีพาสเทลแยก NONE/VIEW/MODIFY/DELETE ผู้ดูแลร้านตั้งสิทธิ์หน้าต่อผู้ดำเนินการได้',
      ],
    },
  },
  {
    version: '2.6.109',
    kind: 'minor',
    date: '2026-09-30',
    items: {
      KR: [
        '로그인·OTP 후 세션이 풀리던 문제 수정: /me 일시 실패 시 토큰 유지·재시도.',
        '사이드 메뉴는 전체 이동으로 배포 직후 메뉴 클릭 오류 방지. PM2 메모리 한도 상향.',
      ],
      US: [
        'Fixed session drop after login/OTP: keep token and retry when /me fails briefly.',
        'Sidebar uses full navigation to avoid post-deploy menu errors. Raised PM2 memory limit.',
      ],
      JP: [
        'ログイン/OTP後にセッションが切れる問題を修正。/me一時失敗時はトークン維持・再試行。',
        'サイドメニューはフル遷移でデプロイ直後のクリック障害を防止。PM2メモリ上限を引上げ。',
      ],
      CH: [
        '修复登录/OTP后会话丢失：/me 短暂失败时保留令牌并重试。',
        '侧栏改为整页跳转，避免部署后菜单异常。提高 PM2 内存上限。',
      ],
      TH: [
        'แก้เซสชันหลุดหลังล็อกอิน/OTP: คงโทเคนและลองใหม่เมื่อ /me ล้มชั่วคราว',
        'เมนูด้านข้างใช้การนำทางเต็มหน้า กันปัญหาหลังดีพลอย และเพิ่มขีดจำกัดหน่วยความจำ PM2',
      ],
    },
  },
  {
    version: '2.6.108',
    kind: 'minor',
    date: '2026-09-30',
    items: {
      KR: [
        '본사·조직 관리자 메뉴를 총괄관리자 트리로 통일. 역할·접근권한으로 항목 표시.',
        '대시보드 시세 안내 문구 다국어화. 인보이스 From/To 기본값을 1주 전~오늘로 표시.',
      ],
      US: [
        'HQ/org staff menus unified to Super Admin tree; items filtered by role/page access.',
        'Dashboard rate disclaimer localized. Invoice From/To defaults to last week–today.',
      ],
      JP: [
        '本社・組織管理者メニューを総括管理者ツリーに統一。役割・権限で表示。',
        'ダッシュボード相場注記を多言語化。インボイス From/To 既定を1週間前〜今日に。',
      ],
      CH: [
        '总部/组织管理员菜单统一为总管理员树，按角色与权限显示。',
        '仪表盘汇率提示多语言化。发票 From/To 默认为一周前至今天。',
      ],
      TH: [
        'เมนูผู้ดูแล HQ/องค์กรใช้โครงสร้างเดียวกับผู้ดูแลสูงสุด กรองตามบทบาท/สิทธิ์',
        'ข้อความอัตราแลกเปลี่ยนบนแดชบอร์ดรองรับหลายภาษา และ From/To ของใบแจ้งหนี้เริ่มต้นเป็น 1 สัปดาห์ก่อนถึงวันนี้',
      ],
    },
  },
  {
    version: '2.6.107',
    kind: 'minor',
    date: '2026-09-21',
    items: {
      KR: ['운영관리(수수료·조직·사용자·기록) 목록 글자 크기를 고객관리와 동일하게 맞춤.'],
      US: ['Operations lists (fees, organizations, users, records) use the same type size as Customers.'],
      JP: ['運営管理（手数料・組織・ユーザー・記録）一覧の文字サイズを顧客管理と同じに揃えました。'],
      CH: ['运营管理（手续费、组织、用户、记录）列表字号与客户管理一致。'],
      TH: ['รายการในจัดการปฏิบัติการ (ค่าธรรมเนียม องค์กร ผู้ใช้ บันทึก) ใช้ขนาดตัวอักษรเดียวกับรายการลูกค้า'],
    },
  },
  {
    version: '2.6.106',
    kind: 'minor',
    date: '2026-09-21',
    items: {
      KR: [
        '고객관리 목록: 인증패스는 인증, 비밀번호 초기화는 비밀번호, OTP 초기화는 OTP로 표시.',
        '고객관리 목록 글자 크기를 한 단계 줄임.',
      ],
      US: [
        'Customer list: Verified pass shows as Verified; reset actions show as Password and OTP.',
        'Customer list type is one step smaller.',
      ],
      JP: [
        '顧客一覧: 認証パスは認証、パスワード初期化はパスワード、OTP初期化はOTPと表示。',
        '顧客一覧の文字サイズを一段階縮小。',
      ],
      CH: [
        '客户列表：认证通过显示为认证，密码初始化显示为密码，OTP初始化显示为OTP。',
        '客户列表字号缩小一档。',
      ],
      TH: [
        'รายการลูกค้า: สถานะผ่านการยืนยันแสดงเป็นยืนยัน ปุ่มรีเซ็ตแสดงเป็นรหัสผ่านและ OTP',
        'ขนาดตัวอักษรในรายการลูกค้าเล็กลงหนึ่งขั้น',
      ],
    },
  },
  {
    version: '2.6.105',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '고객관리 목록에 등록일(YYYY.MM.DD) 표시.',
        '조직관리 목록에 등록일·수정일(YYYY.MM.DD) 표시.',
      ],
      US: [
        'Customer list: registration date (YYYY.MM.DD).',
        'Organization list: registered and updated dates (YYYY.MM.DD).',
      ],
      JP: [
        '顧客管理一覧に登録日(YYYY.MM.DD)を表示。',
        '組織管理一覧に登録日・更新日(YYYY.MM.DD)を表示。',
      ],
      CH: [
        '客户管理列表显示注册日（YYYY.MM.DD）。',
        '组织管理列表显示注册日、修改日（YYYY.MM.DD）。',
      ],
      TH: [
        'รายการลูกค้าแสดงวันที่ลงทะเบียน (YYYY.MM.DD)',
        'รายการองค์กรแสดงวันที่ลงทะเบียนและวันที่แก้ไข (YYYY.MM.DD)',
      ],
    },
  },
  {
    version: '2.6.104',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        'USDT 견적 자동 확정 대기: 1·3·5분 옵션 추가 (본사 수수료 설정).',
        '고객 상세: 견적 응답 본사따름/자동/수동/미사용 개별 설정. 기본은 본사설정따름.',
      ],
      US: [
        'USDT quote auto-confirm delays: added 1 / 3 / 5 minutes (HQ fees).',
        'Customer detail: per-customer quote response Follow HQ / Auto / Manual / Off (default Follow HQ).',
      ],
      JP: [
        'USDT見積の自動確定待機に1・3・5分を追加(本社手数料)。',
        '顧客詳細: 見積応答を本社に従う/自動/手動/未使用で個別設定。既定は本社に従う。',
      ],
      CH: [
        'USDT 报价自动确认等待新增 1/3/5 分钟（总部手续费）。',
        '客户详情：报价响应可按客户设跟随总部/自动/手动/关闭，默认跟随总部。',
      ],
      TH: [
        'หน่วงยืนยันใบเสนอราคาอัตโนมัติเพิ่ม 1/3/5 นาที (ค่าธรรมเนียม HQ)',
        'รายละเอียดลูกค้า: ตั้งใบเสนอราคาตาม HQ/อัตโนมัติ/ด้วยมือ/ปิด ต่อลูกค้า ค่าเริ่มต้นตาม HQ',
      ],
    },
  },
  {
    version: '2.6.103',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '비활성 로그인 안내: API가 다국어 문구 맵을 함께 반환. 로그인 화면에서 언어 전환 시 안내가 즉시 바뀜.',
        '프리셋(또는 동일 본문) 저장 건은 KR/US/JP/CH/TH로 전환. 커스텀 문구는 작성 언어 그대로 유지.',
      ],
      US: [
        'Inactive login notice: API returns a multilingual message map; switching language on the login page updates the notice immediately.',
        'Preset (or matching body) notices switch KR/US/JP/CH/TH; custom text stays as written.',
      ],
      JP: [
        '無効ログイン案内: APIが多言語マップを返却。ログイン画面の言語切替で案内が即時更新。',
        'プリセット(または同一本文)はKR/US/JP/CH/TH切替。カスタム文は作成言語のまま。',
      ],
      CH: [
        '停用登录提示：API 返回多语言文案；登录页切换语言时提示立即更新。',
        '预设（或相同正文）可切换 KR/US/JP/CH/TH；自定义文案保持原样。',
      ],
      TH: [
        'ข้อความเข้าสู่ระบบบัญชีปิด: API ส่งแผนที่หลายภาษา สลับภาษาในหน้าเข้าสู่ระบบแล้วข้อความเปลี่ยนทันที',
        'พรีเซ็ต (หรือข้อความตรงกัน) สลับ KR/US/JP/CH/TH ข้อความกำหนดเองคงภาษาเดิม',
      ],
    },
  },
  {
    version: '2.6.102',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '활성/비활성: 변경사유(내부 기록)와 안내문구(로그인 노출) 분리. 안내문구 비우면 HQ 기본/프리셋 안내.',
        '고객 상세·사용자/고객 모달에 프리셋은 안내문구용으로 적용.',
      ],
      US: [
        'Activate/deactivate: split internal change reason vs login notice. Empty notice uses HQ default/preset.',
        'Presets fill the login notice on customer detail and user/customer modals.',
      ],
      JP: [
        '有効/無効: 変更理由(内部)と案内文(ログイン表示)を分離。案内文空欄時は本社既定/プリセット。',
        '顧客詳細・ユーザー/顧客モーダルでプリセットは案内文用。',
      ],
      CH: [
        '启用/停用：变更原因（内部）与登录提示分离；提示留空则用总部默认/预设。',
        '客户详情与用户/客户弹窗中预设用于提示文案。',
      ],
      TH: [
        'เปิด/ปิด: แยกเหตุผลภายในกับข้อความเข้าสู่ระบบ เว้นว่างใช้ข้อความเริ่มต้น/พรีเซ็ต HQ',
        'พรีเซ็ตใช้กับข้อความแจ้งเตือนในหน้ารายละเอียดลูกค้าและโมดอล',
      ],
    },
  },
  {
    version: '2.6.101',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '비활성 안내 프리셋 BASIC·INCONVENIENCE·WARNING 기본 저장. HQ 사용자설정에서 다국어 편집.',
        '사용자/고객 비활성 시 프리셋 빠른 선택 또는 직접 작성. 프리셋은 로그인 시 다국어 노출.',
      ],
      US: [
        'Inactive notice presets BASIC / INCONVENIENCE / WARNING preloaded; editable in HQ user settings (i18n).',
        'On deactivate: quick-pick preset or custom text; presets show multilingual copy at login.',
      ],
      JP: [
        '無効案内プリセット BASIC・INCONVENIENCE・WARNING を既定保存。本社ユーザー設定で多言語編集。',
        '無効化時にプリセット選択または直接入力。プリセットはログイン時に多言語表示。',
      ],
      CH: [
        '停用提示预设 BASIC / INCONVENIENCE / WARNING 预置；总部用户设置可多语言编辑。',
        '停用时可快速选预设或直接填写；预设登录时按语言显示。',
      ],
      TH: [
        'พรีเซ็ตปิดใช้งาน BASIC / INCONVENIENCE / WARNING บันทึกเริ่มต้น แก้ได้ในตั้งค่าผู้ใช้ HQ',
        'ตอนปิดใช้งานเลือกพรีเซ็ตหรือพิมพ์เอง พรีเซ็ตแสดงหลายภาษาตอนเข้าสู่ระบบ',
      ],
    },
  },
  {
    version: '2.6.100',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '은행이체(고정·CURFEX) 견적 흐름 통일: 신청→견적대기→확정. CURFEX 가상계좌는 견적 확정 후 발급.',
        '카드 결제는 기존 즉시 PG 흐름 유지. 견적 대기 중에는 입금 계좌 미표시.',
      ],
      US: [
        'Unified bank-transfer quote flow (fixed + CURFEX): apply → quote pending → confirm. CURFEX VA issued after quote confirm.',
        'Card keeps immediate PG flow. Deposit account hidden while quote is pending.',
      ],
      JP: [
        '銀行振込(固定・CURFEX)の見積フロー統一: 申請→見積待ち→確定。CURFEX仮想口座は見積確定後に発行。',
        'カードは従来の即時PG。見積待ち中は入金口座非表示。',
      ],
      CH: [
        '银行转账（固定与 CURFEX）报价流程统一：申请→待报价→确认。CURFEX 虚拟账户在报价确认后签发。',
        '卡支付保持即时 PG。待报价期间不显示入金账户。',
      ],
      TH: [
        'รวมขั้นตอนใบเสนอราคาโอนธนาคาร (คงที่+CURFEX): สมัคร→รอ→ยืนยัน บัญชีเสมือน CURFEX ออกหลังยืนยัน',
        'การ์ดยังชำระ PG ทันที ซ่อนบัญชีฝากระหว่างรอใบเสนอราคา',
      ],
    },
  },
  {
    version: '2.6.99',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '계정 활성/비활성·주요 설정 저장에 2단계 확인(취소 가능) 적용.',
        '비활성 계정 로그인 시 Invalid 대신 비활성 사유(없으면 본사 사용자설정의 다국어 기본 안내) 표시.',
      ],
      US: [
        'Two-step confirm (with cancel) for activate/deactivate and major setting saves.',
        'Inactive login shows deactivation reason (or HQ user-settings multilingual default) instead of Invalid credentials.',
      ],
      JP: [
        '有効/無効・主要設定保存に2段階確認(キャンセル可)。',
        '無効アカウントログインはInvalidの代わりに理由(なければ本社ユーザー設定の多言語既定案内)を表示。',
      ],
      CH: [
        '启用/停用与主要设置保存增加两步确认（可取消）。',
        '停用账户登录不再显示 Invalid，改为显示停用原因或总部用户设置中的多语言默认提示。',
      ],
      TH: [
        'เปิด/ปิดบัญชีและบันทึกการตั้งค่าสำคัญใช้ยืนยัน 2 ขั้น (ยกเลิกได้)',
        'เข้าสู่ระบบบัญชีปิดใช้งาน แสดงเหตุผลหรือข้อความเริ่มต้นจากตั้งค่าผู้ใช้ HQ แทน Invalid',
      ],
    },
  },
  {
    version: '2.6.98',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        'USDT 고정계좌: 신청하기→견적대기→확정 입금액→송금·거래하기. 실거래에서 ±8% 범위 노출 제거.',
        '본사정책 수수료: 견적 응답(자동/수동·대기시간·활성화). 관리자 견적 확정·자동 확정 잡.',
      ],
      US: [
        'USDT fixed account: Apply → quote pending → confirmed deposit → remit & trade. Removed ±8% range from live trades.',
        'HQ fees: quote response (auto/manual, delay, enable). Admin confirm + auto-confirm job.',
      ],
      JP: [
        'USDT固定口座: 申請→見積待ち→確定入金→送金・取引。実取引の±8%範囲表示を削除。',
        '本社手数料: 見積応答(自動/手動・待機・有効)。管理者確定と自動確定ジョブ。',
      ],
      CH: [
        'USDT 固定账户：申请→待报价→确认入金→汇款交易。实交易去掉±8%区间显示。',
        '总部手续费：报价响应（自动/手动、等待、开关）。管理员确认与自动确认任务。',
      ],
      TH: [
        'USDT บัญชีคงที่: สมัคร→รอใบเสนอราคา→จำนวนฝากยืนยัน→โอนและทำรายการ ลบช่วง±8% จากธุรกรรมจริง',
        'ค่าธรรมเนียม HQ: ตอบใบเสนอราคา (อัตโนมัติ/ด้วยมือ หน่วงเวลา เปิดใช้) ยืนยันโดยแอดมินและจ็อบอัตโนมัติ',
      ],
    },
  },
  {
    version: '2.6.97',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '좌측 메뉴: 운영관리·본사정책 등 하위 펼침은 한 번에 하나만. 본사정책으로 이동·펼치면 운영관리가 접힘.',
      ],
      US: [
        'Left nav: only one expandable group (Operations / HQ Policy) open at a time; opening HQ Policy collapses Operations.',
      ],
      JP: [
        '左メニュー: 運営管理・本社ポリシーなど下位展開は同時に1つ。本社ポリシーへ移動/展開すると運営管理が閉じる。',
      ],
      CH: [
        '左侧菜单：运营管理与总部政策等展开组同时仅一组；进入或展开总部政策时运营管理收起。',
      ],
      TH: [
        'เมนูซ้าย: กลุ่มขยาย (การดำเนินงาน/นโยบาย HQ) เปิดได้ทีละกลุ่ม เมื่อไปหรือขยายนโยบาย HQ การดำเนินงานจะพับ',
      ],
    },
  },
  {
    version: '2.6.96',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '세팅된 수수료율 노출: 고객용·본사용 분리. 본사는 LIVE/Sandbox 기본 모두 사용(ON), 고객용은 기존 설정 유지.',
        '고객 등록/수정·상세에 USDT 한도(LR~SR/ML) 설정 구간을 명확히 표시.',
      ],
      US: [
        'Fee-rate display: split customer vs HQ. HQ defaults LIVE/Sandbox On; customer keeps current settings.',
        'Clear USDT limit (LR~SR/ML) controls on customer create/edit and detail.',
      ],
      JP: [
        '手数料率表示: 顧客用と本社用を分離。本社はLIVE/Sandbox既定ON、顧客用は既存設定を維持。',
        '顧客登録/編集・詳細にUSDT限度(LR~SR/ML)設定を明示。',
      ],
      CH: [
        '费率显示：客户用与总部用分离。总部默认 LIVE/Sandbox 开启；客户保留原设置。',
        '客户注册/编辑与详情明确显示 USDT 额度（LR~SR/ML）。',
      ],
      TH: [
        'แสดงอัตรา: แยกลูกค้ากับ HQ HQ ค่าเริ่ม LIVE/Sandbox เป็นเปิด ลูกค้าคงค่าเดิม',
        'หน้าสมัคร/แก้ไข/รายละเอียดลูกค้ามีตั้งวงเงิน USDT (LR~SR/ML) ชัดเจน',
      ],
    },
  },
  {
    version: '2.6.95',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '시뮬레이터 금액 표시: ±5% 문구 제거. 범위와 참고금액을 동일 크기·색으로 두 줄 표시.',
      ],
      US: [
        'Simulator amounts: removed ±5% label. Range and reference amount shown on two lines with the same size and color.',
      ],
      JP: [
        'シミュレータ金額表示: ±5%表記を削除。範囲と参考金額を同じ大きさ・色で2行表示。',
      ],
      CH: [
        '模拟器金额显示：去掉±5%字样。区间与参考金额同字号同色两行显示。',
      ],
      TH: [
        'การแสดงจำนวนตัวจำลอง: ลบข้อความ ±5% แสดงช่วงและจำนวนอ้างอิงสองบรรทัด ขนาดและสีเดียวกัน',
      ],
    },
  },
  {
    version: '2.6.94',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '시뮬레이터(LIVE/Sandbox): 금액 입력 자동계산 제거 → 「시뮬레이션 하기」버튼으로 실행. 고객만 1회 USDT 한도 적용, 본사·운영자는 한도 제외.',
        '필요 입금액을 수령 USDT와 같은 큰 글씨·파란색으로 강조. 고객은 ±5% 참고범위, 본사는 정확 금액 표시.',
      ],
      US: [
        'Simulator (LIVE/Sandbox): no auto-calc on input — use Run simulation. Per-ticket USDT limits apply to customers only; HQ/ops are exempt.',
        'Required deposit shown large in blue like received USDT. Customers get ±5% reference; HQ sees exact amounts.',
      ],
      JP: [
        'シミュレータ(LIVE/Sandbox): 入力だけでは自動計算せず「シミュレーションする」で実行。USDT1回限度は顧客のみ、本社・運営は除外。',
        '必要入金額を受取USDTと同じ大きさの青字で強調。顧客は±5%参考、本社は正確額。',
      ],
      CH: [
        '模拟器(LIVE/Sandbox)：输入不自动计算，需点「开始模拟」。单笔USDT限额仅对客户；总部/运营免限。',
        '所需入金以蓝色大字与到账 USDT 同级强调。客户±5%参考，总部显示精确金额。',
      ],
      TH: [
        'ตัวจำลอง (LIVE/Sandbox): ไม่คำนวณอัตโนมัติเมื่อกรอก กด「จำลอง」 วงเงิน USDT ต่อครั้งใช้กับลูกค้าเท่านั้น HQ/ผู้ปฏิบัติงานยกเว้น',
        'ยอดฝากที่ต้องใช้เป็นตัวอักษรใหญ่สีน้ำเงินเหมือน USDT ที่รับ ลูกค้าช่วง ±5% HQ แสดงจำนวนตรง',
      ],
    },
  },
  {
    version: '2.6.93',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        'USDT 1회 한도: 본사 LR/MR/HR/XR/SR 기본값 + 고객 선택(또는 ML 직접입력). 시뮬·LIVE·카드 모두 USDT 기준 한도 미만/초과 시 진행 차단.',
        'USDT 신규신청: 금액 입력만으로 수수료 자동계산 금지. 「거래하기」에서 한도 확인 후 ±8% 참고 범위 견적 → 신청 확정.',
        '시뮬레이터: 입금·수령 금액을 ±5% 범위 + 참고 정확금액 병기. 고객목록 한도열·고객/영업점 컬럼명 정리.',
      ],
      US: [
        'Per-ticket USDT limits: HQ LR/MR/HR/XR/SR defaults + per-customer pick (or ML manual). Blocks simulator, LIVE, and card below/above the USDT band.',
        'USDT apply: no auto fee calc on amount input. Trade checks limits, shows ±8% reference range, then confirm.',
        'Simulator: deposit/receive as ±5% range plus exact reference. Customer list Limit column; Customer/Branch headers.',
      ],
      JP: [
        'USDT 1回限度: 本社 LR/MR/HR/XR/SR 既定＋顧客選択（または ML 手動）。シミュ・LIVE・カードでUSDT基準の範囲外は遮断。',
        'USDT新規: 金額入力だけでは手数料を自動計算しない。「取引する」で限度確認→±8%参考見積→申請確定。',
        'シミュレータ: 入金・受取を±5%範囲＋参考正確額。顧客一覧に限度列、顧客/営業店見出し。',
      ],
      CH: [
        'USDT单笔限额：总部 LR/MR/HR/XR/SR 默认 + 客户选择（或 ML 手工）。模拟、LIVE、卡支付低于/高于限额均拦截。',
        'USDT申请：仅输入金额不自动算费。「交易」校验限额并显示±8%参考区间后再确认申请。',
        '模拟器：入金/到账以±5%区间+参考精确金额。客户列表额度列与客户/营业点列名。',
      ],
      TH: [
        'วงเงิน USDT ต่อครั้ง: ค่าเริ่มต้น HQ LR/MR/HR/XR/SR + เลือกลูกค้า (หรือ ML กำหนดเอง) บล็อกจำลอง/LIVE/บัตรนอกช่วง',
        'สมัคร USDT: ไม่คำนวณอัตโนมัติตอนกรอก กดทำรายการตรวจวงเงิน แสดงช่วง ±8% แล้วยืนยัน',
        'จำลอง: ยอดฝาก/รับเป็นช่วง ±5% พร้อมจำนวนอ้างอิง รายการลูกค้าคอลัมน์วงเงิน และชื่อลูกค้า/สาขา',
      ],
    },
  },
  {
    version: '2.6.92',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '총 수수료 노출 제한: 본사 기본(시볼 수수료 카드) + 고객별 본사설정따름/노출/숨김. 숨김 시 LIVE·Sandbox 시뮬·USDT 도식에서 합계·항목 수수료를 숨기고 수령·입금·환율만 표시.',
      ],
      US: [
        'Total-fee display control: HQ default on Symbol fees card + per-customer Follow HQ / Show / Hide. When hidden, LIVE & Sandbox simulator and USDT diagrams hide fee amounts; net, deposit, and rate remain.',
      ],
      JP: [
        '合計手数料表示の制限: 本社既定（シンボル手数料カード）＋顧客別「本社に従う/表示/非表示」。非表示時はLIVE・Sandboxのシミュ・図式で手数料金額を隠し、受取・入金・レートのみ表示。',
      ],
      CH: [
        '总手续费显示限制：总部默认（交易对手续费卡片）+ 客户「跟随总部/显示/隐藏」。隐藏时 LIVE·Sandbox 模拟器与图示不显示手续费金额，仅保留到账、入金与汇率。',
      ],
      TH: [
        'จำกัดการแสดงค่าธรรมเนียมรวม: ค่าเริ่มต้น HQ + ลูกค้าตาม HQ/แสดง/ซ่อน เมื่อซ่อนจะไม่โชวยอดค่าธรรมเนียมใน LIVE·Sandbox เหลือเฉพาะรับได้ จำนวนฝาก และอัตรา',
      ],
    },
  },
  {
    version: '2.6.91',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '세팅된 수수료율 노출 카드 하단에 「수수료율 노출 저장」버튼을 추가해 해당 설정만 바로 저장할 수 있습니다.',
      ],
      US: [
        'Added “Save fee-rate display” under the configured fee-rates card so LIVE/Sandbox settings can be saved in place.',
      ],
      JP: [
        '設定手数料率の表示カード下に「手数料率表示を保存」を追加し、その場で保存できるようにしました。',
      ],
      CH: [
        '在「显示已设费率」卡片下方增加「保存费率显示」按钮，可就地保存 LIVE/Sandbox 设置。',
      ],
      TH: [
        'เพิ่มปุ่ม「บันทึกการแสดงอัตรา」ใต้การ์ดแสดงอัตราค่าธรรมเนียมที่ตั้งไว้ เพื่อบันทึกทันที',
      ],
    },
  },
  {
    version: '2.6.90',
    kind: 'minor',
    date: '2026-09-18',
    items: {
      KR: [
        '좌측 「운영관리」아이콘을 본사정책(톱니)과 구분(클립보드). 본사정책 하위 「운영관리」명칭을 「검증관리」로 변경. 로그인 후 항상 대시보드로 이동.',
      ],
      US: [
        'Distinct clipboard icon for left Operations vs HQ Policy gear. HQ submenu renamed Operations → Verification Mgmt. Login always opens Dashboard.',
      ],
      JP: [
        '左「運営管理」アイコンを本社ポリシーと区別。本社配下「運営管理」を「検証管理」に改称。ログイン後は常にダッシュボードへ。',
      ],
      CH: [
        '左侧「运营管理」改用剪贴板图标以区别总部政策。总部子菜单「运营管理」改为「验证管理」。登录后始终进入仪表盘。',
      ],
      TH: [
        'เปลี่ยนไอคอนการจัดการปฏิบัติการด้านซ้ายให้ต่างจากนโยบาย HQ เปลี่ยนชื่อเมนูย่อยเป็น การจัดการตรวจสอบ และหลังล็อกอินไปแดชบอร์ดเสมอ',
      ],
    },
  },
  {
    version: '2.6.89',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '세팅된 수수료율 노출·본사 기본 청구방식을 LIVE(실거래)와 Sandbox(시뮬레이터)로 분리. 각각 사용/미사용·청구방식을 저장하며, 시뮬레이터는 Sandbox 설정을 따름.',
      ],
      US: [
        'Show configured fee rates and HQ default billing are split for LIVE vs Sandbox. Each env has its own on/off and billing method; the simulator uses Sandbox.',
      ],
      JP: [
        '設定手数料率の表示・本社既定請求方式をLIVEとSandboxで分離。各環境で使用可否・請求方式を保存。シミュレーターはSandbox設定に従う。',
      ],
      CH: [
        '已设费率显示与总部默认计费方式按 LIVE / Sandbox 分别设置。模拟器使用 Sandbox 配置。',
      ],
      TH: [
        'แยกการแสดงอัตราค่าธรรมเนียมและการเรียกเก็บเริ่มต้น HQ เป็น LIVE กับ Sandbox ตัวจำลองใช้การตั้งค่า Sandbox',
      ],
    },
  },
  {
    version: '2.6.88',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '시뮬레이터 Sandbox 저장 버튼 명칭을 「설정 수수료 저장하기」로 변경(「Sandbox 기본 수수료 저장」오해 해소). 안내 문구도 동일 명칭으로 통일.',
      ],
      US: [
        'Simulator Sandbox save button renamed to “Save configured fees” (avoids confusion with LIVE default fees). Hints updated.',
      ],
      JP: [
        'シミュレーターSandbox保存ボタンを「設定手数料を保存する」に変更（LIVE基本との誤解を解消）。案内文も統一。',
      ],
      CH: [
        '模拟器 Sandbox 保存按钮改为「保存已设手续费」，避免与 LIVE 默认手续费混淆。提示文同步。',
      ],
      TH: [
        'เปลี่ยนปุ่มบันทึก Sandbox เป็น「บันทึกค่าธรรมเนียมที่ตั้งไว้」เพื่อไม่สับสนกับค่าเริ่มต้น LIVE และปรับข้อความแนะนำ',
      ],
    },
  },
  {
    version: '2.6.87',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '시뮬레이터 Sandbox: 「LIVE 기본 수수료 적용」추가(0 초기화 옆). 네트워크 가스피도 LIVE 기본 가스 적용/0 초기화. 본사 LIVE 변경 후 가맹점·본사 SAND 테스트 가능.',
      ],
      US: [
        'Simulator Sandbox: added Apply LIVE default fees beside reset-to-0. Same for network gas add-on. Merchants/HQ can SAND-test after HQ LIVE fee changes.',
      ],
      JP: [
        'シミュレーターSandboxに「LIVE基本手数料を適用」を追加（0リセット横）。ネットワークガスも同様。本社LIVE変更後の加盟店・本社SANDテスト用。',
      ],
      CH: [
        '模拟器 Sandbox 新增「应用 LIVE 默认手续费」（重置为 0 旁）。网络 gas 同样支持。总部改 LIVE 后可供加盟店/总部 SAND 测试。',
      ],
      TH: [
        'ตัวจำลอง Sandbox: เพิ่มปุ่มใช้ค่าเริ่มต้น LIVE ข้างรีเซ็ต 0 และ gas ตามเครือข่ายเช่นกัน ร้านค้า/HQ ทดสอบ SAND หลัง HQ แก้ LIVE ได้',
      ],
    },
  },
  {
    version: '2.6.86',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        'UI 액센트·수수료 도식을 파스텔 빨강(rose) 톤으로 조정. 전용계좌 신청 시 송금증 필수 첨부(자금원천 목록에 송금증 명시). 가상계좌는 송금증 불필요. 매뉴얼 동기화.',
      ],
      US: [
        'UI accent and fee diagram shifted to pastel rose. Dedicated-account apply requires a remittance slip (listed under source-of-funds). Virtual account needs none. Manuals updated.',
      ],
      JP: [
        'UIアクセント・手数料図式をパステル赤(rose)に調整。専用口座申請時は送金証必須（原資証憑に送金証を明記）。バーチャル口座は不要。マニュアル同期。',
      ],
      CH: [
        'UI 强调色与手续费图示改为粉红(pastel rose)。专用账户申请须附汇款凭证（资金来源列表含汇款凭证）。虚拟账户无需。手册同步。',
      ],
      TH: [
        'ปรับโทน UI และแผนภาพค่าธรรมเนียมเป็นพาสเทลแดง บัญชีเฉพาะต้องแนบสลิปโอนตอนสมัคร บัญชีเสมือนไม่ต้อง อัปเดตคู่มือ',
      ],
    },
  },
  {
    version: '2.6.85',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        'USDT 수취방식 표기를 「전용계좌」「가상계좌」로 통일(TINPASS 접두어 제거). 운영·사용자 매뉴얼 안내 문구 동기화.',
      ],
      US: [
        'USDT receipt method labels unified to Dedicated account / Virtual account (no TINPASS prefix). Ops and customer manuals updated.',
      ],
      JP: [
        'USDT受取方式の表示を「専用口座」「バーチャル口座」に統一（TINPASS接頭辞を削除）。運営・利用者マニュアルを同期。',
      ],
      CH: [
        'USDT 收款方式统一为「专用账户」「虚拟账户」（去掉 TINPASS 前缀）。运营与用户手册同步更新。',
      ],
      TH: [
        'ปรับป้ายวิธีรับ USDT เป็นบัญชีเฉพาะ / บัญชีเสมือน (ตัดคำนำหน้า TINPASS) และอัปเดตคู่มือปฏิบัติการ/ผู้ใช้',
      ],
    },
  },
  {
    version: '2.6.84',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '내 지갑 주소 COPY 추가. USDT 고정·TINPASS 가상계좌 상세/신청 미리보기에 계좌번호·수취인명 등 COPY(참조번호·은행코드 포함).',
      ],
      US: [
        'Copy on My Wallets address. USDT fixed/TINPASS VA ticket and apply preview: copy account number, beneficiary, bank codes, and VA reference.',
      ],
      JP: [
        'マイウォレット住所のコピー追加。USDT固定・TINPASSバーチャル口座の詳細/申請プレビューで口座番号・受取人名などをコピー（参照番号・銀行コード含む）。',
      ],
      CH: [
        '我的钱包地址支持复制。USDT 固定/TINPASS 虚拟账户详情与申请预览可复制账号、收款人、银行代码及参考号。',
      ],
      TH: [
        'เพิ่มคัดลอกที่อยู่กระเป๋าของฉัน และคัดลอกเลขบัญชี ชื่อผู้รับ รหัสธนาคาร/อ้างอิงในบัญชีคงที่และเสมือน TINPASS',
      ],
    },
  },
  {
    version: '2.6.83',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '고객 등록·수정에 입금계좌 방식 패널을 분리 표시. 고객 목록에 인증과 수수료 유형 사이 「계좌」열(본사/고정/가상) 추가. 고객 상세에서도 설정 가능.',
      ],
      US: [
        'Separated deposit-account mode on customer create/edit. Added Account column (HQ/Fixed/VA) between KYC and fee type. Editable on customer detail too.',
      ],
      JP: [
        '顧客登録・修正で入金口座方式パネルを分離表示。一覧の認証と手数料タイプの間に「口座」列（本社/固定/仮想）。詳細でも設定可。',
      ],
      CH: [
        '客户注册/修改单独显示入金账户方式。列表在认证与手续费类型之间新增「账户」列（总部/固定/虚拟）。详情页亦可设置。',
      ],
      TH: [
        'แยกแผงโหมดบัญชีฝากในสร้าง/แก้ไขลูกค้า เพิ่มคอลัมน์บัญชี (HQ/คงที่/เสมือน) ระหว่างยืนยันกับประเภทค่าธรรมเนียม ตั้งค่าในหน้ารายละเอียดได้',
      ],
    },
  },
  {
    version: '2.6.82',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '좌측 「운영관리」 펼침 메뉴 추가: 고객관리·수수료관리·조직관리·사용자관리·기록관리(구 운영기록관리).',
      ],
      US: [
        'Added left-nav Operations group: Customers, Fee management, Organizations, Users, Records (renamed from Operation history).',
      ],
      JP: [
        '左メニューに「運営管理」を追加。顧客・手数料・組織・ユーザー・記録管理（旧運営記録管理）を下位に配置。',
      ],
      CH: [
        '左侧新增「运营管理」展开菜单：客户管理、手续费管理、组织管理、用户管理、记录管理（原运营记录管理）。',
      ],
      TH: [
        'เพิ่มเมนูซ้าย「การจัดการปฏิบัติการ」: จัดการลูกค้า ค่าธรรมเนียม องค์กร ผู้ใช้ และจัดการบันทึก (เดิมประวัติการดำเนินงาน)',
      ],
    },
  },
  {
    version: '2.6.81',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '본사정책 좌측 메뉴: 한 번 누르면 펼침·다시 누르면 접힘. 하위 메뉴 앞 세로줄 제거, 「본사정책」글자와 정렬. 운영 매뉴얼에 안내 추가.',
      ],
      US: [
        'HQ Policy left nav: click once to expand, again to collapse. Removed the child vertical rule and aligned labels under HQ Policy. Ops manual updated.',
      ],
      JP: [
        '本社ポリシー左メニュー: 1回で展開・再クリックで折りたたみ。下位の縦線を削除し本社ポリシー文言に揃える。運営マニュアル追記。',
      ],
      CH: [
        '总部政策左侧菜单：点一次展开、再点收起。去掉子项竖线并与「总部政策」文字对齐。运营手册已补充说明。',
      ],
      TH: [
        'เมนูซ้ายนโยบาย HQ: คลิกขยาย คลิกอีกครั้งพับ ลบเส้นแนวตั้งของเมนูย่อยและจัดข้อความใต้ชื่อ HQ อัปเดตคู่มือปฏิบัติการ',
      ],
    },
  },
  {
    version: '2.6.80',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '고객사별 입금계좌 방식(본사따름·고정·TINPASS 가상계좌)과 본사 기본값 추가. USDT 상세 수수료가 통합/항목별/하이브리드 청구방식을 따름. 본사정책을 좌측 메뉴에서 PG형으로 펼침.',
      ],
      US: [
        'Per-customer deposit account mode (follow HQ / fixed / TINPASS VA) plus HQ default. USDT detail fees honor integrated / itemized / hybrid billing. HQ Policy expands in the left nav like PG.',
      ],
      JP: [
        '顧客ごとの入金口座方式（本社に従う・固定・TINPASSバーチャル）と本社既定値を追加。USDT詳細手数料が統合/項目別/ハイブリッド請求に従う。本社ポリシーを左メニューでPG型に展開。',
      ],
      CH: [
        '新增按客户入金账户方式（跟随总部/固定/TINPASS虚拟账户）及总部默认值。USDT 详情手续费遵循合并/分项/混合计费。总部政策在左侧菜单按 PG 方式展开。',
      ],
      TH: [
        'เพิ่มโหมดบัญชีฝากรายลูกค้า (ตาม HQ / คงที่ / เสมือน TINPASS) และค่าเริ่มต้น HQ ค่าธรรมเนียมรายละเอียด USDT ตามวิธีเรียกเก็บ รวม/แยก/ไฮบริด ขยายนโยบาย HQ ในเมนูซ้ายแบบ PG',
      ],
    },
  },
  {
    version: '2.6.79',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        '고객 매뉴얼에 「간편사용하기 · USDT 입금 순서」 추가. 고정 수취계좌와 TINPASS 가상계좌 업무 순서를 구분 안내(고객 화면에서 CURFEX 명칭 미노출).',
      ],
      US: [
        'Added Quick start · USDT deposit steps to the customer manual. Clarifies fixed account vs TINPASS virtual account flows (no vendor name on customer UI).',
      ],
      JP: [
        '顧客マニュアルに「かんたん利用 · USDT入金の順番」を追加。固定受取口座とTINPASSバーチャル口座の手順を整理（顧客画面にベンダー名を出さない）。',
      ],
      CH: [
        '客户手册新增「简易使用 · USDT 入金顺序」。区分固定收款账户与 TINPASS 虚拟账户流程（客户界面不展示供应商名称）。',
      ],
      TH: [
        'เพิ่ม「ใช้งานง่าย · ลำดับฝาก USDT」ในคู่มือลูกค้า แยกขั้นตอนบัญชีคงที่กับบัญชีเสมือน TINPASS (ไม่โชว์ชื่อผู้ให้บริการบนหน้าลูกค้า)',
      ],
    },
  },
  {
    version: '2.6.78',
    kind: 'minor',
    date: '2026-09-17',
    items: {
      KR: [
        'USDT 고정계좌: 신청 시 입금증을 받지 않고 수취계좌를 미리 표시. 제출 후 상세에서 송금·입금증 업로드로 다음 단계 진행.',
      ],
      US: [
        'USDT fixed account: no deposit receipt at apply; preview receiving account on the form. After submit, transfer and upload the receipt on the ticket detail to proceed.',
      ],
      JP: [
        'USDT固定口座: 申請時は入金証憑なしで受取口座を事前表示。提出後、詳細で送金・入金証憑アップロードして次工程へ。',
      ],
      CH: [
        'USDT 固定账户：申请时不收入金凭证并预览收款账户。提交后在详情转账并上传入金凭证以进入下一步。',
      ],
      TH: [
        'USDT บัญชีคงที่: ตอนสมัครไม่รับสลิปและแสดงบัญชีรับล่วงหน้า หลังส่งโอนและอัปโหลดสลิปที่รายละเอียดเพื่อไปขั้นถัดไป',
      ],
    },
  },
  {
    version: '2.6.77',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: ['브랜드 카드 항목명 「왼쪽 배경 브랜드 문구」를 「배경 브랜드 문구」로 변경.'],
      US: ['Renamed brand card label from “Left background brand text” to “Background brand text”.'],
      JP: ['ブランドカード項目名を「左背景ブランド文言」から「背景ブランド文言」に変更。'],
      CH: ['品牌卡片项目名由「左侧背景品牌文案」改为「背景品牌文案」。'],
      TH: ['เปลี่ยนชื่อรายการการ์ดแบรนด์จากข้อความแบรนด์พื้นหลังซ้าย เป็น ข้อความแบรนด์พื้นหลัง'],
    },
  },
  {
    version: '2.6.76',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '링크 미리보기 제목·설명에 왼쪽 배경 브랜드 문구를 함께 넣어 LINE 카드에 바로 보이게 함. 캐시 무효화 강화.',
      ],
      US: [
        'Put the left background brand text into both link-preview title and description so LINE shows it. Stronger cache busting.',
      ],
      JP: [
        '左背景ブランド文言をリンクプレビューのタイトルと説明の両方に入れ、LINEカードにすぐ出す。キャッシュ無効化を強化。',
      ],
      CH: [
        '将左侧背景品牌文案同时写入链接预览标题与说明，便于 LINE 卡片显示。加强缓存失效。',
      ],
      TH: [
        'ใส่ข้อความแบรนด์พื้นหลังซ้ายทั้งหัวข้อและคำอธิบายพรีวิวลิงก์ให้เห็นบน LINE และบังคับล้างแคชแรงขึ้น',
      ],
    },
  },
  {
    version: '2.6.75',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '링크 미리보기 이미지 화면 표시를 약 1/3로 축소. 브랜드 저장 시마다 미리보기 버전을 올려 재입력한 제목·설명이 바로 반영되게 함.',
      ],
      US: [
        'Link preview image shown at about 1/3 size. Each brand save bumps the preview version so rewritten title/description apply immediately.',
      ],
      JP: [
        'リンクプレビュー画像の表示を約1/3に縮小。ブランド保存のたびにプレビュー版を上げ、再入力したタイトル・説明がすぐ反映されるようにした。',
      ],
      CH: [
        '链接预览图显示缩小为约 1/3。每次保存品牌都会提升预览版本，使重新填写的标题和说明立即生效。',
      ],
      TH: [
        'ลดขนาดแสดงรูปพรีวิวลิงก์เหลือประมาณ 1/3 และเพิ่มเวอร์ชันพรีวิวทุกครั้งที่บันทึกแบรนด์ ให้ข้อความที่กรอกใหม่สะท้อนทันที',
      ],
    },
  },
  {
    version: '2.6.74',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '링크 미리보기를 하나로 통합. 제목=사이트 이름, 설명=왼쪽 배경 브랜드 문구. 고객/관리자 이중 설정 제거.',
      ],
      US: [
        'Unified link preview into one set. Title = site name, description = left background brand text. Removed separate customer/admin OG settings.',
      ],
      JP: [
        'リンクプレビューを1つに統合。タイトル=サイト名、説明=左背景ブランド文言。顧客/管理者の二重設定を削除。',
      ],
      CH: [
        '链接预览合并为一套。标题=站点名，说明=左侧背景品牌文案。移除客户/管理员双重设置。',
      ],
      TH: [
        'รวมพรีวิวลิงก์เป็นชุดเดียว หัวข้อ=ชื่อไซต์ คำอธิบาย=ข้อความแบรนด์พื้นหลังซ้าย ลบการตั้งค่าแยกลูกค้า/ผู้ดูแล',
      ],
    },
  },
  {
    version: '2.6.73',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        'LINE·WhatsApp URL 미리보기를 고객 페이지와 관리자 페이지로 분리. 본사정책→플랫폼에서 제목·설명·이미지를 따로 저장하며, 서버가 첫 HTML에 설정값을 넣는다.',
      ],
      US: [
        'Split LINE/WhatsApp URL previews into customer vs admin. HQ Policy → Platform stores separate title, description, and image; the server puts those values in the first HTML.',
      ],
      JP: [
        'LINE・WhatsApp のURLプレビューを顧客ページと管理者ページで分離。本社ポリシー→プラットフォームでタイトル・説明・画像を別保存し、サーバーが最初のHTMLに設定値を入れる。',
      ],
      CH: [
        '将 LINE/WhatsApp 的 URL 预览按客户页与管理员页分开。总部策略→平台分别保存标题、说明、图片，由服务器写入首份 HTML。',
      ],
      TH: [
        'แยกพรีวิว URL ใน LINE/WhatsApp เป็นหน้าลูกค้ากับหน้าผู้ดูแล ตั้งค่าหัวข้อ คำอธิบาย รูปที่ HQ Policy → แพลตฟอร์ม และเซิร์ฟเวอร์ใส่ค่าใน HTML แรก',
      ],
    },
  },
  {
    version: '2.6.72',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '로그인 Cloudflare 위젯 배너를 숨기고 「로봇 접근을 확인 중입니다. 잠시 대기해 주세요.」 문구로 대체.',
      ],
      US: [
        'Login: hide the Cloudflare widget banner and show a waiting message while robot access is checked.',
      ],
      JP: [
        'ログインの Cloudflare ウィジェットを隠し、「ロボットアクセスを確認しています」の案内に置き換え。',
      ],
      CH: [
        '登录隐藏 Cloudflare 组件横幅，改为显示正在确认机器人访问的等待文案。',
      ],
      TH: [
        'หน้าเข้าสู่ระบบซ่อนแบนเนอร์วิดเจ็ต Cloudflare และแสดงข้อความรอตรวจหุ่นยนต์แทน',
      ],
    },
  },
  {
    version: '2.6.71',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '로그인 후 메뉴 이동 시 주소창에는 도메인만 표시. 경로를 숨겨 직접 URL 노출을 줄임.',
      ],
      US: [
        'After sign-in, the address bar shows only the domain. Page paths are hidden.',
      ],
      JP: [
        'ログイン後のメニュー移動ではアドレスバーにドメインのみ表示。パスは出さない。',
      ],
      CH: [
        '登录后切换菜单时地址栏只显示域名，不显示页面路径。',
      ],
      TH: [
        'หลังเข้าสู่ระบบ แถบที่อยู่แสดงเฉพาะโดเมน ไม่แสดงพาธหน้า',
      ],
    },
  },
  {
    version: '2.6.70',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '2단계 인증: 「6자리」 안내와 000000 자리 표시를 없애 코드 길이가 보이지 않게 함.',
      ],
      US: [
        '2FA: drop the “6-digit” hint and 000000 placeholder so the code length is not shown.',
      ],
      JP: [
        '二段階認証: 「6桁」案内と000000表示をやめ、桁数が分からないようにした。',
      ],
      CH: [
        '两步验证：去掉「6位」说明和 000000 占位，不再露出位数。',
      ],
      TH: [
        'ยืนยันสองขั้นตอน: ตัดข้อความ 6 หลักและช่อง 000000 เพื่อไม่ให้เห็นความยาวรหัส',
      ],
    },
  },
  {
    version: '2.6.69',
    kind: 'minor',
    date: '2026-09-16',
    items: {
      KR: [
        '대시보드 직접 URL은 세션 쿠키가 없으면 로그인으로 보냄. 토큰은 브라우저를 닫으면 사라지며, 대시보드 HTML은 캐시하지 않음.',
      ],
      US: [
        'Dashboard URLs redirect to login without a session cookie. The token is session-only, and dashboard HTML is not cached.',
      ],
      JP: [
        'ダッシュボード直リンクはセッションCookieがなければログインへ。トークンはブラウザ終了で消え、ダッシュボードHTMLはキャッシュしない。',
      ],
      CH: [
        '无会话 Cookie 时，仪表板直链会跳到登录。令牌仅在会话内有效，仪表板页面不缓存。',
      ],
      TH: [
        'ลิงก์แดชบอร์ดส่งไปหน้าเข้าสู่ระบบหากไม่มีคุกกี้เซสชัน โทเคนหมดเมื่อปิดเบราว์เซอร์ และไม่แคชหน้าแดชบอร์ด',
      ],
    },
  },
  {
    version: '2.6.68',
    kind: 'minor',
    date: '2026-09-15',
    items: {
      KR: [
        '로그인에 Cloudflare Turnstile 보안 확인을 적용. 위젯을 통과한 뒤에만 로그인됩니다.',
      ],
      US: [
        'Cloudflare Turnstile on login. Sign-in proceeds only after the security check.',
      ],
      JP: [
        'ログインに Cloudflare Turnstile を適用。セキュリティ確認後にログインできます。',
      ],
      CH: [
        '登录增加 Cloudflare Turnstile 安全验证，通过后才能登录。',
      ],
      TH: [
        'ใส่ Cloudflare Turnstile ที่หน้าเข้าสู่ระบบ ต้องผ่านการตรวจความปลอดภัยก่อนเข้าสู่ระบบ',
      ],
    },
  },
  {
    version: '2.6.67',
    kind: 'minor',
    date: '2026-09-15',
    items: {
      KR: [
        'USDT 매입·무역 에스크로 필터: 일자 줄과 검색 줄 사이 여백을 늘리고, 입력창(신청일·날짜·전체 등) 글자를 한 치수 축소.',
      ],
      US: [
        'USDT/escrow filters: more space between the date row and search row; input text (Apply date, dates, All, etc.) is one size smaller.',
      ],
      JP: [
        'USDT・エスクローフィルタ: 日付行と検索行の余白を広げ、入力文字（申請日・日付・すべて等）を一段階小さく。',
      ],
      CH: [
        'USDT/托管筛选：日期行与搜索行之间加大间距，输入框文字（申请日、日期、全部等）缩小一号。',
      ],
      TH: [
        'ตัวกรอง USDT/เอสโครว์: เพิ่มช่องว่างระหว่างแถววันที่กับแถวค้นหา ตัวอักษรในช่องกรอก (วันสมัคร วันที่ ทั้งหมด) เล็กลงหนึ่งขั้น',
      ],
    },
  },
  {
    version: '2.6.66',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '고객목록: 인증·수수료유형 앞에 「수수료」 열 추가. 수수료 노출의 활성/비활성을 표시.',
      ],
      US: [
        'Customer list: Fees column before Verification and Fee type, showing Fee display Active/Inactive.',
      ],
      JP: [
        '顧客一覧: 認証・手数料類型の前に「手数料」列。手数料表示の有効/無効を表示。',
      ],
      CH: [
        '客户列表：在认证、手续费类型前增加「手续费」列，显示手续费显示的启用/停用。',
      ],
      TH: [
        'รายการลูกค้า: คอลัมน์ค่าธรรมเนียมก่อนการยืนยันและประเภทค่าธรรมเนียม แสดงเปิด/ปิดการแสดงค่าธรรมเนียม',
      ],
    },
  },
  {
    version: '2.6.65',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '본사·고객 이용메뉴얼 반영: 수수료 노출(본사설정에따름), 민감작업 OTP 유지시간·6자리 자동확인, 목록 날짜 기본(1주 전~오늘), 가맹점 사용자관리와 본사 사용자관리 구분.',
      ],
      US: [
        'HQ and customer manuals: Fee display (Follow HQ settings), sensitive OTP duration and 6-digit auto-verify, list dates default to 1 week ago–today, merchant Users vs HQ Users.',
      ],
      JP: [
        '本社・顧客マニュアル更新: 手数料表示（本社設定に従う）、機密OTP維持時間・6桁自動確認、一覧日付既定（1週間前〜今日）、加盟店ユーザー管理と本社ユーザー管理の区別。',
      ],
      CH: [
        '总部与客户手册更新：手续费显示（遵循总部设置）、敏感 OTP 保持时间与 6 位自动确认、列表日期默认一周前至今天、加盟商用户管理与总部用户管理区分。',
      ],
      TH: [
        'อัปเดตคู่มือ HQ และลูกค้า: แสดงค่าธรรมเนียม (ตามการตั้งค่า HQ) ระยะเวลา OTP งานสำคัญและยืนยัน 6 หลักอัตโนมัติ วันที่รายการเริ่มต้น 1 สัปดาห์ก่อน–วันนี้ แยกจัดการผู้ใช้ร้านกับ HQ',
      ],
    },
  },
  {
    version: '2.6.64',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        'USDT·에스크로 시작일 기본값을 1주 전, 종료일을 오늘로 표시.',
        '본사설정 드롭다운 높이를 새로고침·내림차순과 동일하게. 글자가 길면 폰트만 축소.',
        '가맹점 USDT 목록 헤더 글자 크기를 본사(13px)와 동일하게.',
        '고객관리에 수수료 노출 카드 추가. 비활성이면 내 지갑 수수료에 「본사설정에따름」만 표시.',
      ],
      US: [
        'USDT/escrow date filter defaults to 1 week ago through today.',
        'HQ settings dropdown height matches Refresh/Sort. Long labels use a smaller font.',
        'Merchant USDT table headers use the same 13px size as HQ.',
        'Customer detail: Fee display card. When inactive, My wallets shows Follow HQ settings.',
      ],
      JP: [
        'USDT・エスクローの開始日を1週間前、終了日を今日に。',
        '本社設定ドロップダウンの高さを更新・降順と同じに。文字が長い場合はフォントのみ縮小。',
        '加盟店USDT一覧ヘッダーを本社と同じ13pxに。',
        '顧客管理に手数料表示カード。無効時はマイウォレット手数料が「本社設定に従う」。',
      ],
      CH: [
        'USDT/托管筛选默认开始日为一周前、结束日为今天。',
        '总部设置下拉高度与刷新/降序相同，字太长只缩小字号。',
        '商户 USDT 列表表头与总部同为 13px。',
        '客户管理增加手续费显示卡片。停用时我的钱包手续费只显示遵循总部设置。',
      ],
      TH: [
        'ตัวกรอง USDT/เอสโครว์เริ่มต้นวันเริ่มเป็น 1 สัปดาห์ก่อน วันสิ้นสุดเป็นวันนี้',
        'รายการ HQ สูงเท่าปุ่มรีเฟรช/เรียง ถ้าข้อความยาวลดขนาดตัวอักษร',
        'หัวตาราง USDT ของร้านเท่า HQ (13px)',
        'หน้ารายละเอียดลูกค้าเพิ่มการ์ดแสดงค่าธรรมเนียม ถ้าปิด กระเป๋าจะแสดงตามการตั้งค่า HQ',
      ],
    },
  },
  {
    version: '2.6.63',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: ['내 지갑: 상태 열(기본·본사 등록 등)을 좌우·상하 가운데 정렬.'],
      US: ['My wallets: status column (Default, HQ-registered, etc.) is centered horizontally and vertically.'],
      JP: ['マイウォレット: 状態列（基本・本社登録など）を上下左右中央揃え。'],
      CH: ['我的钱包：状态列（默认、总部登记等）改为水平垂直居中。'],
      TH: ['กระเป๋าของฉัน: คอลัมน์สถานะ (ค่าเริ่มต้น, HQ ลงทะเบียน) จัดกึ่งกลางทั้งแนวนอนและแนวตั้ง'],
    },
  },
  {
    version: '2.6.62',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '가맹점 메뉴 「운영자관리」를 「사용자관리」로 표기. 목록은 OTP 없이 바로 보이며, 등록·중지·활성화만 관리자 Google OTP.',
        '가맹점 관리자 OTP가 「인증번호가 올바르지 않습니다」로 거절되던 문제를 수정. 6자리 입력 시 자동 확인. OTP 유지시간은 본사정책 → 플랫폼에서 설정(기본 10분).',
      ],
      US: [
        'Merchant menu Operators renamed to Users. The list is visible without OTP; Google OTP is required only to register, suspend, or reactivate.',
        'Fixed merchant-admin OTP being rejected as invalid. Six digits auto-verify. OTP duration is set in HQ Policy → Platform (default 10 minutes).',
      ],
      JP: [
        '加盟店メニュー「運営者管理」を「ユーザー管理」に。一覧はOTPなしで表示し、登録・停止・再有効のみ管理者Google OTP。',
        '加盟店管理者OTPが無効扱いになっていた不具合を修正。6桁入力で自動確認。維持時間は本社ポリシー→プラットフォーム(既定10分)。',
      ],
      CH: [
        '加盟商菜单「运营者管理」改为「用户管理」。列表无需 OTP，仅登记/停用/启用时需管理员 Google OTP。',
        '修复管理员 OTP 被判无效。输入 6 位自动确认。保持时间在总部政策→平台设置（默认 10 分钟）。',
      ],
      TH: [
        'เมนูร้านค้าเปลี่ยนจากจัดการผู้ดำเนินการเป็นจัดการผู้ใช้ ดูรายการได้โดยไม่ต้อง OTP ต้อง OTP เฉพาะตอนลงทะเบียน/หยุด/เปิดใช้',
        'แก้ OTP ของแอดมินร้านถูกปฏิเสธ กรอก 6 หลักแล้วยืนยันอัตโนมัติ ระยะเวลาตั้งที่นโยบาย HQ → แพลตฟอร์ม (ค่าเริ่ม 10 นาที)',
      ],
    },
  },
  {
    version: '2.6.61',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '고객 인증: USDT 시뮬레이터를 LIVE/SAND·활성/비활성 드롭다운 2개로 저장. 상단 고객 인증 제목과 고객 목록·수수료관리 탭 복원.',
      ],
      US: [
        'Customer verification: simulator uses LIVE/SAND and Active/Inactive dropdowns. Restored page title and Customer list / Fee management tabs.',
      ],
      JP: [
        '顧客認証: シミュレーターをLIVE/SANDと有効/無効の2ドロップダウンに。ページタイトルと顧客一覧・手数料管理タブを復元。',
      ],
      CH: [
        '客户认证：模拟器改为 LIVE/SAND 与启用/停用两个下拉。恢复页面标题及客户列表、手续费管理页签。',
      ],
      TH: [
        'หน้ารายละเอียดลูกค้า: ตัวจำลองเลือก LIVE/SAND และเปิด/ปิดจากรายการ กลับหัวข้อและแท็บรายชื่อลูกค้า/ค่าธรรมเนียม',
      ],
    },
  },
  {
    version: '2.6.60',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '고객 인증: USDT 시뮬레이터와 멀티 사용자를 카드 2장으로 분리하고 각각 설정 저장. 멀티는 활성/비활성 드롭다운.',
        '고객 목록: 시뮬레이터와 인증 사이에 「멀티」 열(활성/비활성). 상세 화면의 중복 제목·탭·뒤로가기를 제거.',
      ],
      US: [
        'Customer verification: split USDT simulator and multi-user into two cards, each with Save settings. Multi-user uses Active/Inactive dropdown.',
        'Customer list: Multi column (Active/Inactive) between Simulator and Verification. Removed duplicate title/tabs/back link on the detail page.',
      ],
      JP: [
        '顧客認証: USDTシミュレーターとマルチユーザーを2カードに分離し、それぞれ設定保存。マルチは有効/無効ドロップダウン。',
        '顧客一覧: シミュレーターと認証の間に「マルチ」列。詳細の重複タイトル・タブ・戻るリンクを削除。',
      ],
      CH: [
        '客户认证：USDT 模拟器与多用户分成两张卡片，各自保存设置。多用户用启用/停用下拉。',
        '客户列表：模拟器与认证之间增加「多用户」列。去掉详情页重复标题、页签与返回链接。',
      ],
      TH: [
        'หน้ารายละเอียดลูกค้า: แยกตัวจำลอง USDT กับหลายผู้ใช้เป็น 2 การ์ด แต่ละใบมีปุ่มบันทึก หลายผู้ใช้เลือกเปิด/ปิดจากรายการ',
        'รายชื่อลูกค้า: คอลัมน์หลายผู้ใช้ระหว่างตัวจำลองกับการยืนยัน ตัดหัวข้อ/แท็บ/ปุ่มกลับที่ซ้ำ',
      ],
    },
  },
  {
    version: '2.6.59',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '가맹점 이용메뉴얼: 관리자·운영자(최대 2명, 삭제 없음), 본사 등록 지갑·추가 지갑 승인, 운영자관리, 운영기록관리를 반영. 운영자 계정도 고객 메뉴얼을 볼 수 있음.',
        '총본사 운영 메뉴얼 고객관리: 멀티 사용자 허용·추가 지갑 승인 안내를 보강.',
      ],
      US: [
        'Customer manual: admin/operators (max 2, suspend only), HQ-locked wallets and extra-wallet approval, Operator management, Operation history. Operators can open the customer manual.',
        'HQ ops manual Customers: notes for Allow multi-user and extra-wallet approval.',
      ],
      JP: [
        '顧客マニュアル: 管理者・運営者(最大2名・削除なし)、本社登録ウォレットと追加承認、運営者管理、運営記録。運営者も顧客マニュアルを閲覧可能。',
        '総本社マニュアル顧客管理: マルチユーザー許可・追加ウォレット承認の案内を追加。',
      ],
      CH: [
        '客户手册：管理员/操作员(最多2名、不可删除)、总部锁定钱包与额外钱包批准、操作员管理、运营记录。操作员也可查看客户手册。',
        '总部运营手册客户管理：补充允许多用户与额外钱包批准说明。',
      ],
      TH: [
        'คู่มือลูกค้า: แอดมิน/ผู้ปฏิบัติงาน (สูงสุด 2 คน ไม่ลบ), กระเป๋า HQ และการอนุมัติกระเป๋าเพิ่ม, จัดการผู้ปฏิบัติงาน, ประวัติการดำเนินงาน ผู้ปฏิบัติงานดูคู่มือลูกค้าได้',
        'คู่มือ HQ จัดการลูกค้า: เพิ่มคำอธิบายอนุญาตหลายผู้ใช้และอนุมัติกระเป๋าเพิ่ม',
      ],
    },
  },
  {
    version: '2.6.58',
    kind: 'minor',
    date: '2026-09-14',
    items: {
      KR: [
        '가맹점 멀티계정: 관리자 1명 + 운영자 최대 2명. 본사에서 가맹점별 허용 시에만 활성화. 운영자는 생성·중지(삭제 없음)이며 지갑 메뉴는 관리자만 사용.',
        '내 지갑: 본사 등록 기본 지갑 주소는 변경 불가. 추가 지갑은 본사 승인 후 사용. 기본 지갑은 승인된 지갑 중 전환.',
        '상단 탭: 사용자별로 저장하고, 허용 메뉴가 아닌 탭은 제거. 로그아웃 시 대시보드만 남김.',
        '운영기록관리: 가맹점 주요 업무를 기록하고, 삭제는 총본사만 가능.',
      ],
      US: [
        'Merchant multi-user: 1 admin + up to 2 operators, enabled per merchant by HQ. Operators can be suspended (not deleted) and cannot open Wallets.',
        'Wallets: HQ-registered default address cannot be changed. Extra wallets need HQ approval. Default can switch among approved wallets.',
        'Top tabs are stored per user and filtered to allowed menus. Logout keeps Dashboard only.',
        'Operation history logs merchant actions; only HQ can delete.',
      ],
      JP: [
        '加盟店マルチアカウント: 管理者1＋運営者最大2。本社が加盟店ごとに許可した場合のみ有効。運営者は停止のみ（削除なし）、ウォレットは管理者のみ。',
        'ウォレット: 本社登録の基本アドレスは変更不可。追加は本社承認後。デフォルトは承認済みから切替。',
        '上部タブはユーザー別に保存し、許可メニュー以外は除去。ログアウト時はダッシュボードのみ。',
        '運営記録管理: 加盟店の主要業務を記録。削除は総本社のみ。',
      ],
      CH: [
        '商户多用户：管理员1 + 运营者最多2名，需总部按商户开通。运营者仅可停用（不可删除），钱包仅管理员可见。',
        '钱包：总部登记的默认地址不可改。额外钱包需总部批准。默认钱包仅可在已批准钱包中切换。',
        '顶栏标签按用户保存并过滤未授权菜单。退出后仅保留仪表盘。',
        '运营记录：记录商户主要操作，仅总部可删除。',
      ],
      TH: [
        'บัญชีร้านค้าหลายผู้ใช้: ผู้ดูแล 1 + ผู้ดำเนินการสูงสุด 2 คน ต้องให้ HQ เปิดต่อร้าน ผู้ดำเนินการหยุดได้แต่ลบไม่ได้ และไม่มีเมนูกระเป๋า',
        'กระเป๋า: ที่อยู่ที่ HQ ลงทะเบียนแก้ไม่ได้ กระเป๋าเพิ่มต้อง HQ อนุมัติ สลับกระเป๋าหลักได้เฉพาะที่อนุมัติแล้ว',
        'แท็บด้านบนเก็บแยกตามผู้ใช้ และตัดเมนูที่ไม่มีสิทธิ์ ออกจากระบบแล้วเหลือแดชบอร์ด',
        'ประวัติการดำเนินงาน บันทึกงานร้านค้า ลบได้เฉพาะ HQ',
      ],
    },
  },
  {
    version: '2.6.57',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        'USDT 매입·무역 에스크로: 일자구분·시작/종료일·검색구분·상태구분 입력 높이를 당일/당월 등 퀵 버튼과 동일하게 맞춤.',
      ],
      US: [
        'USDT Purchase & Trade Escrow: date/search/status field heights match Today/This-month quick buttons.',
      ],
      JP: [
        'USDT購入・貿易エスクロー: 日付区分・開始/終了日・検索区分・状態区分の高さを当日/当月などクイックボタンと同一に。',
      ],
      CH: [
        'USDT买入与贸易托管：日期类型/起止日/搜索类型/状态输入高度与当日/当月等快捷按钮一致。',
      ],
      TH: [
        'USDT Purchase และ Trade Escrow: ความสูงช่องวันที่/ค้นหา/สถานะให้เท่าปุ่มลัด วันนี้/เดือนนี้',
      ],
    },
  },
  {
    version: '2.6.56',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        'USDT 매입·무역 에스크로: 「본사설정」 드롭다운 높·글자 크기를 새로고침/정렬/엑셀 버튼과 동일하게 맞춤.',
      ],
      US: [
        'USDT Purchase & Trade Escrow: HQ settings dropdown height/type size matches Refresh/Sort/Excel buttons.',
      ],
      JP: [
        'USDT購入・貿易エスクロー: 「本社設定」ドロップダウンの高さ・文字サイズを更新/並び替え/Excelボタンと同一に。',
      ],
      CH: [
        'USDT买入与贸易托管：「总部设置」下拉高度与字号与刷新/排序/Excel按钮一致。',
      ],
      TH: [
        'USDT Purchase และ Trade Escrow: ขนาด/ความสูงดรอปดาวน์ตั้งค่า HQ ให้เท่าปุ่มรีเฟรช/เรียง/Excel',
      ],
    },
  },
  {
    version: '2.6.55',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        'USDT 매입·무역 에스크로: 필터 글자 크기(13px)는 유지하고, 레이아웃을 기존 세로 배치(필터→집계→버튼)로 복구.',
      ],
      US: [
        'USDT Purchase & Trade Escrow: keep 13px filter type size; restore original vertical layout (filter → summary → actions).',
      ],
      JP: [
        'USDT購入・貿易エスクロー: フィルタ文字サイズ(13px)は維持し、レイアウトを従来の縦配置に復元。',
      ],
      CH: [
        'USDT买入与贸易托管：保留筛选字号(13px)，恢复原纵向布局（筛选→汇总→按钮）。',
      ],
      TH: [
        'USDT Purchase และ Trade Escrow: คงขนาดตัวอักษร 13px และคืนเลย์เอาต์แนวตั้งเดิม',
      ],
    },
  },
  {
    version: '2.6.54',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        'USDT 매입·무역 에스크로: 필터/본사설정 등 글자 크기를 페이지 제목(13px)과 통일. 시작·종료일 기본값을 오늘 날짜로 표시(브라우저 연도-월-일 플레이스홀더 제거).',
      ],
      US: [
        'USDT Purchase & Trade Escrow: filter/HQ-settings font size matches page title (13px). Start/end dates default to today (no browser year-month-day placeholder).',
      ],
      JP: [
        'USDT購入・貿易エスクロー: フィルタ/本社設定などの文字サイズをページタイトル(13px)に統一。開始・終了日の初期値を本日に設定。',
      ],
      CH: [
        'USDT买入与贸易托管：筛选/总部设置等字号与页标题(13px)统一；起止日期默认今天。',
      ],
      TH: [
        'USDT Purchase และ Trade Escrow: ขนาดตัวอักษรตัวกรอง/ตั้งค่า HQ ให้เท่าหัวข้อหน้า (13px); วันเริ่ม-สิ้นสุดค่าเริ่มต้นเป็นวันนี้',
      ],
    },
  },
  {
    version: '2.6.53',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        '고객 UI 글자 크기 통일: 사이드/하단 메뉴·표 헤더를 「USDT 매입」페이지 제목(13px)과 동일하게 맞춤.',
      ],
      US: [
        'Customer UI type size unified: side/bottom nav and table headers match the USDT Purchase page title (13px).',
      ],
      JP: [
        '顧客UIの文字サイズ統一: サイド/下部メニュー・表ヘッダーを「USDT購入」ページタイトル(13px)に合わせる。',
      ],
      CH: [
        '客户端字号统一：侧栏/底栏菜单与表头与「USDT买入」页标题（13px）一致。',
      ],
      TH: [
        'รวมขนาดตัวอักษร UI ลูกค้า: เมนูข้าง/ล่าง และหัวตารางให้เท่าหัวข้อหน้า USDT Purchase (13px)',
      ],
    },
  },
  {
    version: '2.6.52',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        '수수료 유형명(기본 수수료 등)을 UI 언어(KR/US/JP/CH/TH)에 맞게 표시. 고객·조직 이름 등 DB 저장값은 그대로 유지.',
      ],
      US: [
        'System fee type labels (e.g. Default fee) follow UI locale (KR/US/JP/CH/TH). Customer/org names stay as stored.',
      ],
      JP: [
        '手数料タイプ名（基本手数料など）をUI言語(KR/US/JP/CH/TH)に合わせて表示。顧客・組織名などDB保存値はそのまま。',
      ],
      CH: [
        '手续费类型名（默认手续费等）按界面语言(KR/US/JP/CH/TH)显示；客户/组织等数据库名称保持原样。',
      ],
      TH: [
        'ชื่อประเภทค่าธรรมเนียมระบบ (เช่น ค่าธรรมเนียมเริ่มต้น) ตามภาษา UI; ชื่อลูกค้า/องค์กรคงตามที่บันทึก',
      ],
    },
  },
  {
    version: '2.6.51',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        '이용메뉴얼(총본사·조직·고객) 업데이트: 플랫폼 고정 수취계좌 필드·다국어 안내, 계좌 이체 입금 시 수취인명(半角カタカナ) 복사 필수 주의사항 추가.',
      ],
      US: [
        'Manuals (HQ/org/customer) updated: fixed deposit account fields, multilingual notices, required beneficiary copy (half-width katakana) precautions.',
      ],
      JP: [
        '利用マニュアル(総本社・組織・顧客)更新: 固定受取口座項目・多言語案内、口座振込時の受取人名(半角カタカナ)コピー必須注意を追加。',
      ],
      CH: [
        '使用手册（总部/组织/客户）更新：固定收款账户字段、多语言提示、银行转账须精确复制半角片假名收款人注意事项。',
      ],
      TH: [
        'อัปเดตคู่มือ (HQ/องค์กร/ลูกค้า): บัญชีรับคงที่ ข้อความหลายภาษา และข้อควรระวังคัดลอกชื่อผู้รับคาตาคานะ',
      ],
    },
  },
  {
    version: '2.6.50',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        '고정 입금 안내 문구 다국어(KR/US/JP/CH/TH) 지원. 수취인명(半角カタカナ)은 언어와 무관하게 원문 유지.',
        '고객 상세 USDT 시뮬레이터: LIVE/SAND 선택 UI 정리, 설정 저장 버튼 추가.',
      ],
      US: [
        'Fixed-deposit beneficiary notice is multilingual; beneficiary name stays Japanese half-width katakana.',
        'Customer detail simulator: compact LIVE/SAND control and explicit Save button.',
      ],
      JP: [
        '固定入金案内の多言語化。受取人名は半角カタカナ原文のまま。',
        '顧客詳細のシミュレーターでLIVE/SAND UI整理と保存ボタン追加。',
      ],
      CH: [
        '固定入金提示支持多语言；收款人姓名保持日语半角片假名原文。',
        '客户详情模拟器：精简 LIVE/SAND 选择并增加保存按钮。',
      ],
      TH: [
        'ข้อความบัญชีฝากคงที่รองรับหลายภาษา ชื่อผู้รับคงคาตาคานะญี่ปุ่น',
        'หน้าลูกค้า: ปรับ UI LIVE/SAND และเพิ่มปุ่มบันทึกตัวจำลอง',
      ],
    },
  },
  {
    version: '2.6.49',
    kind: 'minor',
    date: '2026-09-12',
    items: {
      KR: [
        '본사정책→플랫폼: 고정 입금 수취계좌에 은행주소·은행/지점코드·계좌유형·중요안내(수취인명 정확 복사) 필드 추가. JPY Payoneer(MUFG) 기본값 채우기 버튼.',
        'USDT 매입 상세: 고정/CURFEX 입금계좌를 항목별로 표시하고 수취인명 복사 버튼·경고 문구 강조.',
      ],
      US: [
        'HQ Platform: fixed deposit accounts now include bank address, codes, account type, and beneficiary-copy notice; JPY Payoneer (MUFG) fill button.',
        'USDT ticket detail shows structured deposit fields with copy beneficiary and strong warning.',
      ],
      JP: [
        '本社プラットフォームの固定入金口座に住所・銀行/支店コード・口座種別・受取人名コピー注意を追加。JPY Payoneer(MUFG) 一括入力。',
        'USDT詳細で入金口座を項目表示し、受取人名コピーと警告を強調。',
      ],
      CH: [
        '总部平台固定入金账户增加地址、银行/分行代码、账户类型与收款人精确复制提示；JPY Payoneer(MUFG) 一键填充。',
        'USDT 详情结构化展示入金信息并强调复制收款人。',
      ],
      TH: [
        'บัญชีฝากคงที่ในแพลตฟอร์ม HQ เพิ่มที่อยู่ รหัสธนาคาร/สาขา ประเภทบัญชี และคำเตือนคัดลอกชื่อผู้รับ พร้อมปุ่ม JPY Payoneer(MUFG)',
        'หน้ารายละเอียด USDT แสดงบัญชีแบบรายการพร้อมปุ่มคัดลอกและคำเตือน',
      ],
    },
  },
  {
    version: '2.6.48',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '본사정책 수수료·리스크: 통화별 법정화폐 소수점·반올림/절상/버림 설정 UI 추가. 시뮬·USDT 매입 입금액에 적용(JPY/KRW 기본 0자리).',
      ],
      US: [
        'HQ commission risk: per-currency fiat decimals and round/ceil/floor settings; applied to simulator and USDT purchase deposits.',
      ],
      JP: [
        '本社手数料リスクに通貨別小数・端数処理設定を追加。シミュ・USDT購入の入金額に適用。',
      ],
      CH: [
        '总部手续费风险增加按货币小数与舍入设置，应用于模拟器与 USDT 购买入金。',
      ],
      TH: [
        'เพิ่มการตั้งทศนิยม/ปัดเงินรายสกุลในความเสี่ยงค่าธรรมเนียม HQ ใช้กับซิมและซื้อ USDT',
      ],
    },
  },
  {
    version: '2.6.47',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '고객 등록·수정에 수수료 청구방식(본사설정따름/통합/개별/하이브리드) 추가. 고객목록에 청구방식 열 표시.',
        '본사 수수료리스크: 세팅된 수수료율 카드에 본사 기본 청구방식 설정. 도식은 청구방식에 따라 합산·항목별·둘 다 표시.',
      ],
      US: [
        'Customer fee billing method (Follow HQ / Integrated / Itemized / Hybrid) on register/edit and list.',
        'HQ commission risk: default billing method next to fee-rate settings; diagram shows combined, itemized, or both.',
      ],
      JP: [
        '顧客に請求方式（本社準拠/統合/個別/ハイブリッド）を追加。一覧に表示。',
        '本社手数料リスクに既定請求方式。図は合計・明細・両方を表示。',
      ],
      CH: [
        '客户增加计费方式（跟随总部/合并/明细/混合），列表显示。',
        '总部风险政策增加默认计费方式；费用图按方式显示合计、明细或两者。',
      ],
      TH: [
        'เพิ่มวิธีเรียกเก็บค่าธรรมเนียมลูกค้า (ตาม HQ/รวม/แยก/ไฮบริด) และคอลัมน์ในรายการ',
        'ตั้งค่าวิธีเริ่มต้นที่ HQ และแสดงแผนภาพตามโหมด',
      ],
    },
  },
  {
    version: '2.6.46',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '수수료리스크: 세팅된 수수료율·수수료·비용 도식 표시 바로 아래에 「리스크 정책 저장」을 추가해 바로 반영할 수 있습니다.',
      ],
      US: [
        'Commission risk: add Save risk policy directly under fee-rate / fee-diagram visibility settings.',
      ],
      JP: [
        '手数料リスク: 料率・図表示設定の直下に「リスク政策保存」を追加。',
      ],
      CH: [
        '手续费风险：在费率/费用图显示设置正下方增加「风险政策保存」。',
      ],
      TH: [
        'ความเสี่ยงค่าธรรมเนียม: เพิ่มปุ่มบันทึกนโยบายความเสี่ยงใต้การตั้งค่าอัตรา/แผนภาพทันที',
      ],
    },
  },
  {
    version: '2.6.45',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '시뮬레이터 수수료(Sandbox): 기타 수수료 옆에 운영수수료(총본사 기본수수료)를 자동 표시. LIVE·SAND 시뮬레이션에 동일 적용.',
        '수수료·비용 도식: 「운영 수수료」표시 기본 켜짐. 「세팅된 수수료율 노출」은 %열만 제어함을 안내 문구로 명확화.',
      ],
      US: [
        'Sandbox simulator fees: show operating fee from HQ default fee type next to other fees; applied to LIVE and SAND.',
        'Fee diagram: operating fee visible by default; clarify that fee-rate toggle only controls the % column.',
      ],
      JP: [
        'Sandbox手数料に運営手数料（本社基本タイプ）を自動表示。LIVE/SAND共通適用。',
        '手数料図の運営手数料を既定表示。料率表示は%列のみ制御と明記。',
      ],
      CH: [
        'Sandbox 手续费旁自动显示运营手续费（总部默认类型），LIVE/SAND 共用。',
        '费用图默认显示运营手续费；说明「费率显示」仅控制百分比列。',
      ],
      TH: [
        'แสดงค่าธรรมเนียมดำเนินงานจากประเภทเริ่มต้นข้าง Other ใน Sandbox และใช้กับ LIVE/SAND',
        'แผนภาพค่าธรรมเนียมแสดง Operating เป็นค่าเริ่มต้น และชี้ว่าการแสดงอัตราควบคุมเฉพาะคอลัมน์ %',
      ],
    },
  },
  {
    version: '2.6.44',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '수수료관리: 고객명 아래에 로그인 아이디(이메일)를 함께 표시합니다.',
      ],
      US: [
        'Fee management: show login id (email) under the customer name.',
      ],
      JP: [
        '手数料管理: 顧客名の下にログインID（メール）を表示。',
      ],
      CH: [
        '手续费管理：在客户名下方显示登录账号（邮箱）。',
      ],
      TH: [
        'จัดการค่าธรรมเนียม: แสดงอีเมล (รหัสเข้าใช้) ใต้ชื่อลูกค้า',
      ],
    },
  },
  {
    version: '2.6.43',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '고객목록: 행 더블클릭 시 수정이 아니라 고객 상세(서류·인증)를 엽니다. 수정은 관리의 수정 버튼만 사용합니다.',
      ],
      US: [
        'Customer list: double-click opens customer detail (docs/KYC), not edit. Edit only via the Edit action.',
      ],
      JP: [
        '顧客一覧: ダブルクリックは詳細（書類・認証）。修正は管理の修正ボタンのみ。',
      ],
      CH: [
        '客户列表：双击打开客户详情（文件/认证），不打开修改；修改仅通过管理中的修改按钮。',
      ],
      TH: [
        'รายชื่อลูกค้า: ดับเบิลคลิกเปิดรายละเอียด (เอกสาร/KYC) ไม่ใช่แก้ไข — แก้ไขเฉพาะปุ่มแก้ไข',
      ],
    },
  },
  {
    version: '2.6.42',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '수수료관리: 고객명을 매입·무역 한 세트로 합치고, 세트 단위로 기존 표 줄무늬 색톤을 번갈아 표시합니다.',
      ],
      US: [
        'Fee management: merge customer name across buy/trade rows; alternate table stripe tones by customer set.',
      ],
      JP: [
        '手数料管理: 顧客名を買取・貿易のセットで結合し、セット単位で既存の縞色を交互表示。',
      ],
      CH: [
        '手续费管理：客户名跨买入/贸易合并为一组，按组交替使用现有表格条纹色。',
      ],
      TH: [
        'จัดการค่าธรรมเนียม: รวมชื่อลูกค้าข้ามแถวซื้อ/ค้า และสลับสีแถบตารางตามชุดลูกค้า',
      ],
    },
  },
  {
    version: '2.6.41',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '총본사 수수료 타입: 생성창을 맨 위에 두고, USDT/무역을 종류별로 분리. 선택한 종류 표에만 타입이 추가됩니다.',
      ],
      US: [
        'HQ fee types: single create bar at top; USDT and trade types are separate — create adds only to the selected kind.',
      ],
      JP: [
        '手数料タイプ作成欄を最上段に。USDT/貿易は別タイプ。選択した種類の表にのみ追加。',
      ],
      CH: [
        '手续费类型创建栏移到最上方；USDT 与贸易类型分开，仅添加到所选种类。',
      ],
      TH: [
        'ย้ายช่องสร้างประเภทขึ้นบนสุด แยกประเภท USDT/ค้า และเพิ่มเฉพาะชนิดที่เลือก',
      ],
    },
  },
  {
    version: '2.6.40',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '수수료관리: 고객·거래(매입/무역)·수수료유형·단계별 %/건당·운영수수료합계를 한 표로 표시. 기본 유형은 하늘색.',
        '고객목록 더블클릭 시 상세가 아니라 수정 화면을 엽니다.',
      ],
      US: [
        'Fee management: one table with customer, trade (buy/trade), fee type, org %/fixed, and operating fee total; default type rows in sky blue.',
        'Customer list double-click opens edit (not detail).',
      ],
      JP: [
        '手数料管理を顧客・取引・類型・段階配分の一表に。既定タイプは水色。顧客一覧ダブルクリックは修正。',
      ],
      CH: [
        '手续费管理改为客户·交易·类型·分层分成一表；默认类型天蓝色。客户列表双击打开修改。',
      ],
      TH: [
        'จัดการค่าธรรมเนียมเป็นตารางเดียว (ลูกค้า/ธุรกรรม/ประเภท/ส่วนแบ่ง) ดับเบิลคลิกรายชื่อลูกค้าเปิดแก้ไข',
      ],
    },
  },
  {
    version: '2.6.39',
    kind: 'minor',
    date: '2026-09-08',
    items: {
      KR: [
        '총본사 수수료 배분·수수료관리 버튼 크기를 수수료·리스크 「수정」과 동일(text-xs)로 통일.',
        '사이드바 「조직관리」 붙여쓰기. 고객목록 인증·관리 사이에 수수료유형(USDT/무역) 열 추가.',
      ],
      US: [
        'Unified HQ fee-share / fee-management action buttons to the same text-xs size as risk-policy Edit.',
        'Nav label Organizations compacted in KR; customer list adds Fee type between Verification and Actions.',
      ],
      JP: [
        '手数料配分・手数料管理ボタンサイズをリスク政策の修正と同じに統一。',
        '顧客一覧の認証と管理の間に手数料類型列を追加。',
      ],
      CH: [
        '统一总部手续费分配/管理按钮尺寸；客户列表在认证与管理之间增加手续费类型列。',
      ],
      TH: [
        'ปรับขนาดปุ่มค่าธรรมเนียมให้เท่ากัน และเพิ่มคอลัมน์ประเภทค่าธรรมเนียมในรายชื่อลูกค้า',
      ],
    },
  },
  {
    version: '2.6.38',
    kind: 'minor',
    date: '2026-09-07',
    items: {
      KR: [
        '수수료 타입: 표마다 종류(USDT/무역)·이름·생성하기. 기본 타입은 하늘색 행, 타입 열은 이름만 표시.',
        '운영수수료 = 합계% + 합계 건당을 거래금액에 부과·정산. 수수료 도식에 「운영 수수료」표시 옵션 추가(기본 숨김, 정산은 항상 적용).',
      ],
      US: [
        'Fee types: per-table kind (USDT/trade) + name + Create. Default row highlighted in sky blue; type column shows name only.',
        'Operating fee = total % + fixed on trade amount (always settled). Fee diagram adds an Operating fee visibility toggle (hidden by default).',
      ],
      JP: [
        '手数料タイプ: 表ごとに種類・名前・作成。既定行は水色、タイプ列は名前のみ。',
        '運営手数料＝合計%＋件当を取引額に課金・精算。手数料内訳に運営手数料表示オプション（既定は非表示、精算は常時）。',
      ],
      CH: [
        '手续费类型：每表可选种类+名称+创建；默认行天蓝色，类型列仅显示名称。',
        '运营手续费=合计%+按笔固定，始终从交易额计费结算。手续费明细增加运营手续费显示开关（默认隐藏）。',
      ],
      TH: [
        'ประเภทค่าธรรมเนียม: แต่ละตารางเลือกชนิด+ชื่อ+สร้าง แถวค่าเริ่มต้นสีฟ้าอ่อน คอลัมน์แสดงเฉพาะชื่อ',
        'ค่าธรรมเนียมดำเนินงาน=%รวม+คงที่ คิดจากยอดเสมอ แผนภาพมีตัวเลือกแสดง (ค่าเริ่มต้นซ่อน)',
      ],
    },
  },
  {
    version: '2.6.37',
    kind: 'minor',
    date: '2026-09-07',
    items: {
      KR: [
        '본사·고객 수수료 배분 표: %와 건당 컬럼을 분리하고, 글꼴을 섹션 제목과 같은 크기로 줄였습니다. 관리 버튼은 가운데 정렬합니다.',
      ],
      US: [
        'HQ and customer fee tables: split % and per-ticket columns, match section-head font size, and center manage actions.',
      ],
      JP: [
        '本社・顧客手数料表: %と件当を列分離し、フォントをセクション見出しと同じ大きさに。管理ボタンは中央揃え。',
      ],
      CH: [
        '总部与客户手续费表：% 与按笔分列，字号与区块标题一致，管理按钮居中。',
      ],
      TH: [
        'ตารางค่าธรรมเนียม HQ/ลูกค้า: แยกคอลัมน์ % กับต่อรายการ ลดขนาดตัวอักษรให้เท่าหัวข้อ และจัดปุ่มจัดการกึ่งกลาง',
      ],
    },
  },
  {
    version: '2.6.36',
    kind: 'minor',
    date: '2026-09-07',
    items: {
      KR: [
        '총본사 수수료 타입: USDT 매입·무역 에스크로 표를 분리했습니다. 합계 %는 운영수수료율(거래금액 × 합계%)이며, 단계 열은 그 수수료 배분입니다.',
      ],
      US: [
        'HQ fee types: separate USDT purchase and trade escrow tables. Total % is the operating fee rate (trade amount × total %); level columns split that fee.',
      ],
      JP: [
        '手数料タイプ: USDT購入と貿易エスクローを別表に。合計%は運営手数料率（取引金額×合計%）で、段階列はその配分です。',
      ],
      CH: [
        '手续费类型：USDT 采购与贸易托管分表。合计 % 为运营手续费率（交易金额×合计%），各级列为其分成。',
      ],
      TH: [
        'ประเภทค่าธรรมเนียม: แยกตารางซื้อ USDT และการค้า รวม % คืออัตราค่าธรรมเนียมดำเนินงาน (ยอด×รวม %) คอลัมน์ขั้นคือการแบ่งส่วน',
      ],
    },
  },
  {
    version: '2.6.35',
    kind: 'minor',
    date: '2026-09-07',
    items: {
      KR: [
        '총본사 기본 고정 수수료 배분을 표형으로 단순화했습니다. 타입 추가 후 행에서 %·건당을 수정·저장하며, USDT 매입과 무역거래가 동일합니다.',
      ],
      US: [
        'HQ default fee share is a simple grid: add a type, then edit/save % and per-ticket values. Same table for USDT purchase and trade escrow.',
      ],
      JP: [
        '総本社の基本手数料配分を表形式に簡素化。タイプ追加後、行で%・件当を修正・保存。USDT購入と貿易は同じ表です。',
      ],
      CH: [
        '总部默认手续费分成改为表格：添加类型后在行内修改/保存 % 与按笔金额。USDT 采购与贸易同一表。',
      ],
      TH: [
        'ส่วนแบ่งค่าธรรมเนียมเริ่มต้นของ HQ เป็นตารางง่าย: เพิ่มประเภทแล้วแก้/บันทึก % และต่อรายการ ซื้อ USDT และการค้าใช้ตารางเดียวกัน',
      ],
    },
  },
  {
    version: '2.6.34',
    kind: 'minor',
    date: '2026-09-07',
    items: {
      KR: [
        '고객 등록 시 USDT 매입·무역거래 수수료 타입을 각각 선택합니다. 선택하지 않으면 본사 기본 타입이 적용됩니다.',
      ],
      US: [
        'When registering a customer, choose fee types for USDT purchase and trade escrow. If unset, the HQ default type is applied.',
      ],
      JP: [
        '顧客登録時にUSDT購入・貿易取引の手数料タイプをそれぞれ選択します。未選択なら本社の既定タイプが適用されます。',
      ],
      CH: [
        '登记客户时可分别选择 USDT 采购与贸易交易手续费类型。未选择则套用总部默认类型。',
      ],
      TH: [
        'ตอนลงทะเบียนลูกค้า เลือกประเภทค่าธรรมเนียมซื้อ USDT และการค้าได้ หากไม่เลือกจะใช้ประเภทเริ่มต้นของ HQ',
      ],
    },
  },
  {
    version: '2.6.33',
    kind: 'minor',
    date: '2026-09-07',
    items: {
      KR: [
        '본사정책에서 수수료 타입을 여러 개 만들고 기본 타입을 지정합니다.',
        '고객관리 > 수수료관리에서 USDT 매입·무역 수수료를 타입 선택·%+고정·적용시작일·이력으로 관리합니다. 숫자를 바꾸면 Manual로 바뀌며 정산에 최우선 적용됩니다.',
        '신규 고객 등록 시 수수료를 건드리지 않으며 기본 타입이 자동 부여됩니다.',
      ],
      US: [
        'Create multiple HQ fee types and mark one as the default.',
        'Customer management > Fee management: USDT purchase and trade escrow fees with type, % + fixed, start date, and history. Editing values switches to Manual and takes priority at settlement.',
        'New customers are registered with the default type; fee edits happen only in Fee management.',
      ],
      JP: [
        '本社ポリシーで複数の手数料タイプを作成し、既定タイプを指定します。',
        '顧客管理 > 手数料管理でUSDT購入・貿易手数料をタイプ選択・%+固定・適用開始日・履歴で管理。数値変更時はManualになり精算で最優先です。',
        '新規顧客登録では手数料を編集せず、既定タイプが自動付与されます。',
      ],
      CH: [
        '在总部政策中创建多种手续费类型并指定默认类型。',
        '客户管理 > 手续费管理：USDT采购与贸易手续费支持类型、%+固定、适用开始日与变更记录。改数字会变为 Manual，结算时优先。',
        '新客户登记不编辑手续费，自动套用默认类型。',
      ],
      TH: [
        'สร้างประเภทค่าธรรมเนียมหลายแบบที่นโยบาย HQ และตั้งค่าเริ่มต้น',
        'จัดการลูกค้า > จัดการค่าธรรมเนียม: ค่าธรรมเนียมซื้อ USDT และการค้า พร้อมประเภท %+คงที่ วันเริ่มใช้ และประวัติ แก้ตัวเลขจะเป็น Manual และมีสิทธิ์สูงสุดตอนชำระ',
        'ลูกค้าใหม่ไม่แก้ค่าธรรมเนียมตอนลงทะเบียน ได้ประเภทเริ่มต้นอัตโนมัติ',
      ],
    },
  },
  {
    version: '2.6.26',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        'USDT 거래 완료: 실제 송금 USDT가 예상 범위를 크게 벗어나면 재확인 모달(더블 확인) 필수',
        '서버에서도 확인 없이 범위 밖 금액 완료 차단',
      ],
      US: [
        'USDT trade completion: double-confirm modal when actual USDT is far outside expected range',
        'Server blocks out-of-range completion without operator acknowledgment',
      ],
      JP: [
        'USDT取引完了: 実際送金USDTが予想範囲を大きく外れる場合は再確認モーダル必須',
        'サーバーでも確認なしの範囲外完了をブロック',
      ],
      CH: [
        'USDT完成交易：实际 USDT 明显超出预期范围时须二次确认',
        '服务端阻止未经确认的越界金额完成',
      ],
      TH: [
        'เสร็จสิ้นซื้อ USDT: ต้องยืนยันซ้ำเมื่อ USDT จริงห่างจากช่วงที่คาด',
        'เซิร์ฟเวอร์บล็อกการเสร็จสิ้นนอกช่วงโดยไม่ยืนยัน',
      ],
    },
  },
  {
    version: '2.6.25',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        '이용메뉴얼: USDT 입금확인중/결제확인중 vs KYC 심사중 용어 분리 반영',
        '이용메뉴얼: 전용계좌 증빙 파일 영역·입금 영수증 안내 추가 (5개 언어)',
      ],
      US: [
        'Usage manuals: deposit/payment verifying vs KYC under review terminology',
        'Usage manuals: fixed-account proof files section guidance (5 locales)',
      ],
      JP: [
        '利用マニュアル: USDT入金確認中/決済確認中とKYC審査中の用語分離を反映',
        '利用マニュアル: 固定口座の証憑ファイル欄・入金領収書案内を追加',
      ],
      CH: [
        '使用手册：USDT入金确认中/支付确认中与KYC审核中用语分离',
        '使用手册：固定账户凭证文件区域与入金回单说明',
      ],
      TH: [
        'คู่มือใช้งาน: แยกคำว่าตรวจฝาก/ตรวจชำระ USDT กับตรวจ KYC',
        'คู่มือใช้งาน: คำแนะนำไฟล์หลักฐานบัญชีคงที่และสลิปฝาก',
      ],
    },
  },
  {
    version: '2.6.24',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        'USDT 입금 확인 상태를 "입금확인중"으로 분리 — "심사중"은 KYC·서류 심사 전용',
        '전용계좌 이체 상세: 증빙 파일 영역 항상 표시, 미첨부 시 안내·테스트 시드 구분',
      ],
      US: [
        'USDT deposit verification label split from KYC "Under review"',
        'Dedicated bank transfer detail: attachments section always visible with empty-state guidance',
      ],
      JP: [
        'USDT入金確認「入金確認中」をKYC審査と分離',
        '専用口座振込詳細: 証憑欄を常時表示、未添付時の案内',
      ],
      CH: [
        'USDT入金确认与KYC审核状态分离',
        '专用账户转账详情：凭证区域始终显示，未上传时提示',
      ],
      TH: [
        'แยกสถานะตรวจสอบการฝาก USDT จากการตรวจ KYC',
        'รายละเอียดโอนบัญชีเฉพาะ: แสดงไฟล์หลักฐานเสมอ พร้อมคำแนะนำเมื่อไม่มีไฟล์',
      ],
    },
  },
  {
    version: '2.6.23',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        '상단 breadcrumb(예: USDT 매입 > 상세) — 상위 메뉴 클릭 시 목록으로 이동, 전 페이지 공통',
      ],
      US: [
        'Breadcrumb links on all detail/sub pages — click parent menu to return to list',
      ],
      JP: [
        'パンくず(例: USDT購入 > 詳細) — 上位メニューをクリックで一覧へ、全ページ共通',
      ],
      CH: [
        '面包屑导航(如 USDT采购 > 详情)— 点击上级菜单返回列表，全页面统一',
      ],
      TH: [
        'breadcrumb (เช่น ซื้อ USDT > รายละเอียด) — คลิกเมนูระดับบนกลับรายการ ทุกหน้า',
      ],
    },
  },
  {
    version: '2.6.22',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        'USDT 매입 상세: 섹션별 한눈에 보기(요약·결제·금액·수수료·입금·정산·일정), 모바일 반응형',
        '수수료 장부: 고객·거래내용(JPY→USDT)·신청일·상태·상세 링크 컬럼 추가',
      ],
      US: [
        'USDT purchase detail: grouped sections + hero summary, mobile responsive',
        'Commission ledger: customer, trade summary, applied date, status, detail links',
      ],
      JP: [
        'USDT購入詳細: セクション別サマリー・モバイル対応レイアウト',
        '手数料台帳: 顧客・取引内容・申請日・状態・詳細リンク列を追加',
      ],
      CH: [
        'USDT 购入详情：分区摘要布局，移动端响应式',
        '手续费账本：新增客户、交易摘要、申请日、状态、详情链接',
      ],
      TH: [
        'รายละเอียด USDT: สรุปแยกส่วน รองรับมือถือ',
        'บัญชีค่าธรรมเนียม: เพิ่มลูกค้า สรุปธุรกรรม วันที่สมัคร สถานะ ลิงก์รายละเอียด',
      ],
    },
  },
  {
    version: '2.6.21',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        '카드 USDT 매입: 수금방식이 전용계좌(FIXED)로 잘못 표시되던 문제 수정 → 해당없음',
        'USDT/무역에스크로 Round-2 시나리오 테스트 데이터·직렬화 검증 보강',
      ],
      US: [
        'Card USDT purchase: collection no longer mislabelled as FIXED → N/A',
        'USDT/trade-escrow Round-2 scenario seed and serialize checks',
      ],
      JP: [
        'カードUSDT購入: 回収方法が固定口座(FIXED)と誤表示される不具合を修正 → 該当なし',
        'USDT/エスクロー Round-2 シナリオ検証を補強',
      ],
      CH: [
        '卡片 USDT 购入：收款方式误显示为专用账户(FIXED) → 不适用',
        'USDT/贸易托管 Round-2 场景测试与序列化校验',
      ],
      TH: [
        'บัตร USDT: วิธีรับเงินไม่แสดงผิดเป็นบัญชีเฉพาะ(FIXED) → ไม่มี',
        'เสริมการทดสอบสถานการณ์ Round-2 ของ USDT/เอสโครว์',
      ],
    },
  },
  {
    version: '2.6.20',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        'UI 표기: CURFEX → 가상계좌서비스(CURFEX) (목록·상세·결제관리, 5개 언어)',
        '무역 에스크로: 수락 기한 경과 시 불발 사유 문구를 실제 로직(기한 경과)에 맞게 수정',
      ],
      US: [
        'UI labels: CURFEX → Virtual Account Service (CURFEX) (list/detail/payment, 5 locales)',
        'Trade escrow: void reason text matches acceptance-deadline logic',
      ],
      JP: [
        'UI表記: CURFEX → バーチャル口座サービス(CURFEX)（一覧・詳細・決済、5言語）',
        'エスクロー: 受諾期限超過時の不成立文言を実際のロジックに合わせて修正',
      ],
      CH: [
        '界面文案：CURFEX → 虚拟账户服务(CURFEX)（列表/详情/支付，5语言）',
        '贸易托管：未接受到期作废说明与实际逻辑一致',
      ],
      TH: [
        'ข้อความ UI: CURFEX → บริการบัญชีเสมือน(CURFEX) (5 ภาษา)',
        'เอสโครว์: ข้อความยกเลิกเมื่อหมดเวลายอมรับ ให้ตรงกับ logic',
      ],
    },
  },
  {
    version: '2.6.19',
    kind: 'minor',
    date: '2026-08-31',
    items: {
      KR: [
        '이용메뉴얼 전수 다국어 통일 — JP/CH/TH를 한국어 기준으로 보완',
        'CURFEX 표기 → 가상계좌서비스(CURFEX)로 전 언어 통일',
      ],
      US: [
        'Usage manuals: full JP/CH/TH parity with Korean source',
        'CURFEX wording → Virtual Account Service (CURFEX) in all locales',
      ],
      JP: [
        '利用マニュアル全言語統一 — JP/CH/THを韓国語基準で補完',
        'CURFEX表記 → バーチャル口座サービス(CURFEX)に統一',
      ],
      CH: [
        '使用手册全语言统一 — 以韩语为基准补全 JP/CH/TH',
        'CURFEX 改称 → 虚拟账户服务(CURFEX)',
      ],
      TH: [
        'คู่มือครบทุกภาษา — เติม JP/CH/TH ตามต้นฉบับเกาหลี',
        'เปลี่ยนคำ CURFEX → บริการบัญชีเสมือน(CURFEX)',
      ],
    },
  },
  {
    version: '2.6.18',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: [
        '이용메뉴얼(총본사·조직·고객) 전 언어 — 시뮬레이터·고객관리·Sandbox 수수료 반영',
        '고객용: 시뮬레이터 사용법·참고용(비확정) 주의 문구 강화',
      ],
      US: [
        'Usage manuals (HQ, org, customer) — all languages: simulator, customer admin, Sandbox fees',
        'Customer manual: simulator how-to + stronger reference-only disclaimer',
      ],
      JP: [
        '利用マニュアル(総本社・組織・顧客)全言語 — シミュレーター・顧客管理・Sandbox手数料を反映',
        '顧客向け: シミュレーター使い方と参考用(非確定)注意を強化',
      ],
      CH: [
        '使用手册(总部/组织/客户)全语言 — 模拟器、客户管理、Sandbox 手续费',
        '客户手册：模拟器用法与仅供参考说明加强',
      ],
      TH: [
        'คู่มือ (HQ/องค์กร/ลูกค้า) ครบทุกภาษา — ตัวจำลอง จัดการลูกค้า ค่าธรรมเนียม Sandbox',
        'ลูกค้า: วิธีใช้ตัวจำลองและคำเตือนอ้างอิงเท่านั้น',
      ],
    },
  },
  {
    version: '2.6.17',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: ['고객관리: 수정·비밀번호 초기화·OTP 초기화 (사용자관리와 동일)'],
      US: ['Customer management: edit, password reset, OTP reset (same as user admin)'],
      JP: ['顧客管理: 修正・パスワード初期化・OTP初期化（ユーザー管理と同様）'],
      CH: ['客户管理：编辑、密码初始化、OTP 初始化（与用户管理相同）'],
      TH: ['จัดการลูกค้า: แก้ไข รีเซ็ตรหัสผ่าน OTP (เหมือนผู้ใช้)'],
    },
  },
  {
    version: '2.6.16',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: [
        'Sandbox 수수료: LIVE 구간+가스피에 기본 수수료 가산, 합계 (LIVE) 표시',
        'Sandbox 구간 표는 LIVE 미러(읽기 전용), 계산은 합산값 적용',
      ],
      US: [
        'Sandbox fees: LIVE tiers + basic add-on; display combined (LIVE)',
        'Sandbox tier table mirrors LIVE (read-only)',
      ],
      JP: [
        'Sandbox手数料: LIVE段階+ガスに基本加算、合計 (LIVE) 表示',
      ],
      CH: [
        'Sandbox 手续费：LIVE 档位+gas 叠加基本费，显示合计 (LIVE)',
      ],
      TH: [
        'Sandbox: บวกค่าพื้นฐานกับ LIVE แสดงผลรวม (LIVE)',
      ],
    },
  },
  {
    version: '2.6.15',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: ['고객·조직 S RATE: LIVE(청록)/SAND(주황) 파스텔 배지로 구분'],
      US: ['Customer/org S RATE: distinct pastel badges for LIVE (teal) vs SAND (orange)'],
      JP: ['顧客・組織 S RATE: LIVE(ティール)/SAND(オレンジ)バッジで区別'],
      CH: ['客户/组织 S RATE：LIVE(青绿)/SAND(橙) 徽章区分'],
      TH: ['S RATE ลูกค้า/องค์กร: ป้าย LIVE(เขียวน้ำทะเล)/SAND(ส้ม) แยกสี'],
    },
  },
  {
    version: '2.6.14',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: [
        '시뮬레이터 Sandbox: KRW/JPY/THB/CNY/USD 통화별 구간 수수료 편집 UI 추가',
      ],
      US: [
        'Simulator Sandbox: currency tier fee editor (KRW/JPY/THB/CNY/USD)',
      ],
      JP: [
        'シミュレーターSandbox: 通貨別段階手数料編集UI追加',
      ],
      CH: [
        '模拟器 Sandbox：按货币档位手续费编辑界面',
      ],
      TH: [
        'Sandbox ตัวจำลอง: แก้ไขค่าธรรมเนียมตามชั้นแยกสกุลเงิน',
      ],
    },
  },
  {
    version: '2.6.13',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: [
        '시뮬레이터 Sandbox 수수료: 파스텔 톤 입력칸·가운데 정렬·수수료별 색 구분',
      ],
      US: [
        'Simulator Sandbox fees: pastel input boxes, center-aligned, color per fee type',
      ],
      JP: [
        'シミュレーターSandbox手数料: パステル入力欄・中央揃え・手数料別色',
      ],
      CH: [
        '模拟器 Sandbox 手续费：粉彩输入框、居中、按费用类型分色',
      ],
      TH: [
        'ค่าธรรมเนียม Sandbox: ช่องป้อนพาสเทล จัดกึ่งกลาง แยกสีตามประเภท',
      ],
    },
  },
  {
    version: '2.6.12',
    kind: 'minor',
    date: '2026-08-28',
    items: {
      KR: [
        '수취방식: 전용계좌(빨강 파스텔), CURFEX→가상계좌 명칭 통일',
        '시뮬레이터 전용 수수료 체계(본사설정) + 고객·조직 S RATE(LIVE/SAND)',
        '본사 USDT 시뮬레이터 LIVE/SANDBOX 탭, 고객용 가상 시뮬 안내',
      ],
      US: [
        'Collection: dedicated account (red pastel), virtual account label (no brand)',
        'Simulator-only fee policy in HQ + customer/org S RATE (LIVE/SAND)',
        'HQ simulator LIVE/SANDBOX tabs; virtual simulation disclaimer for customers',
      ],
      JP: [
        '受取方式: 専用口座(赤パステル)、仮想口座表記に統一',
        'シミュレーター専用手数料(HQ) + 顧客・組織 S RATE(LIVE/SAND)',
        '本社シミュレーター LIVE/SANDBOX タブ',
      ],
      CH: [
        '收款方式：专用账户(红 pastel)、虚拟账户统一名称',
        '模拟器专用手续费(HQ)+客户/组织 S RATE',
        '总部模拟器 LIVE/SANDBOX 标签',
      ],
      TH: [
        'วิธีรับเงิน: บัญชีเฉพาะ(แดงพาสเทล) ชื่อบัญชีเสมือน',
        'ค่าธรรมเนียมตัวจำลอง(HQ)+S RATE ลูกค้า/องค์กร',
        'แท็บ LIVE/SANDBOX ตัวจำลอง HQ',
      ],
    },
  },
  {
    version: '2.6.11',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'USDT·에스크로: 본사설정 드롭다운을 새로고침과 동일 크기·높이로 수정 (깨짐 방지)',
        '본사설정은 새로고침 왼쪽 한 줄에 표시',
      ],
      US: [
        'USDT & escrow: HQ settings dropdown sized like Refresh (fix crush)',
        'HQ settings stays left of Refresh on one row',
      ],
      JP: [
        'USDT・エスクロー: 本社設定ドロップダウンを更新と同じサイズに修正',
        '本社設定は更新の左・同一行',
      ],
      CH: [
        'USDT/托管：总部设置下拉与刷新同尺寸（修复挤压）',
        '总部设置仍在刷新左侧同一行',
      ],
      TH: [
        'USDT/เอสโครว์: ปรับดรอปดาวน์ตั้งค่า HQ ให้ขนาดเท่าปุ่มรีเฟรช',
        'ตั้งค่า HQ อยู่ซ้ายรีเฟรชในแถวเดียว',
      ],
    },
  },
  {
    version: '2.6.10',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'USDT·에스크로: 집계 바 위 · 본사설정·새로고침·정렬·엑셀은 한 줄 오른쪽 정렬',
        '검색어 입력창 확대 (검색구분·상태구분과 유사 폭)',
      ],
      US: [
        'USDT & escrow: summary bar above · HQ settings/refresh/sort/Excel one right-aligned row',
        'Wider keyword search field',
      ],
      JP: [
        'USDT・エスクロー: 集計バー上 · 本社設定・更新・並び・Excelを1行右寄せ',
        '検索語入力を拡大',
      ],
      CH: [
        'USDT/托管：汇总条在上 · 总部设置/刷新/排序/Excel 单行右对齐',
        '加宽搜索词输入框',
      ],
      TH: [
        'USDT/เอสโครว์: แถบสรุปอยู่บน · ตั้งค่า HQ/รีเฟรช/เรียง/Excel แถวเดียวชิดขวา',
        'ขยายช่องค้นหาคำ',
      ],
    },
  },
  {
    version: '2.6.9',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        '고객관리: 고객별 USDT 시뮬레이터 허용/차단 (본사 페이지권한보다 우선)',
        '차단 시 고객 메뉴·API만 제한 — 본사 「기록 시뮬레이터」 조회는 유지',
      ],
      US: [
        'Customer admin: per-customer USDT simulator allow/block (overrides HQ page access)',
        'Block limits customer menu/API only — HQ Record simulator viewing unchanged',
      ],
      JP: [
        '顧客管理: 顧客別USDTシミュレーター許可/遮断（本社ページ権限より優先）',
        '遮断は顧客メニュー・APIのみ — 本社の記録シミュレーター照会は維持',
      ],
      CH: [
        '客户管理：按客户允许/屏蔽 USDT 模拟器（优先于总部页面权限）',
        '屏蔽仅限制客户菜单/API — 总部记录模拟器查询不变',
      ],
      TH: [
        'จัดการลูกค้า: อนุญาต/ปิดตัวจำลอง USDT รายลูกค้า (เหนือสิทธิ์หน้า HQ)',
        'ปิดเฉพาะเมนู/API ลูกค้า — การดูบันทึกตัวจำลองของ HQ คงเดิม',
      ],
    },
  },
  {
    version: '2.6.8',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'USDT·에스크로: 신청일·예상완료일 이중표시(상단 기준시간 / 하단 서비스기준시간)',
        '본사설정은 새로고침 왼쪽 · 페이지 번호 가운데 정렬',
      ],
      US: [
        'USDT & escrow: dual dates (base time top / service time bottom)',
        'HQ settings left of Refresh · page numbers centered',
      ],
      JP: [
        'USDT・エスクロー: 申請日・完了予定を二重表示（上=基準 / 下=サービス）',
        '本社設定は更新の左 · ページ番号を中央揃え',
      ],
      CH: [
        'USDT/托管：申请日·预计完成双时区（上基准/下服务）',
        '总部设置在刷新左侧 · 页码居中',
      ],
      TH: [
        'USDT/เอสโครว์: วันที่สมัคร·คาดเสร็จ 2 โซน (บนอ้างอิง/ล่างบริการ)',
        'ตั้งค่า HQ ซ้ายของรีเฟรช · เลขหน้าอยู่กลาง',
      ],
    },
  },
  {
    version: '2.6.7',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        '플랫폼 도메인·SSL: 기준시간·서비스기준시간 설정 추가',
        'USDT·에스크로·고객 신청: 두 시계 표시 + 본사설정(국가)으로 서비스기준시간 변경',
      ],
      US: [
        'Platform Domain·SSL: base time & service time settings',
        'USDT, escrow, customer apply: dual clocks + HQ settings country override',
      ],
      JP: [
        'プラットフォーム ドメイン・SSL: 基準時間・サービス基準時間を追加',
        'USDT・エスクロー・顧客申請: 2時計表示＋本社設定（国）でサービス時間変更',
      ],
      CH: [
        '平台 域名·SSL：新增基准时间与服务基准时间',
        'USDT/托管/客户申请：双时钟 + 总部设置（国家）切换服务时间',
      ],
      TH: [
        'แพลตฟอร์มโดเมน·SSL: เพิ่มเวลาอ้างอิงและเวลาอ้างอิงบริการ',
        'USDT/เอสโครว์/สมัครลูกค้า: นาฬิกา 2 แบบ + ตั้งค่า HQ (ประเทศ) เปลี่ยนเวลาบริการ',
      ],
    },
  },
  {
    version: '2.6.6',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'USDT·에스크로 집계 바: 건수|총거래|실패|수수료|추정결산 (PG형)',
        '고객 표시 이름/이메일 · 검색어 입력 축소 · 엑셀다운로드',
      ],
      US: [
        'USDT & escrow summary bar: count|total|failed|fees|settlement (PG style)',
        'Customer as name/email · shorter keyword field · Excel download',
      ],
      JP: [
        'USDT・エスクロー集計バー: 件数|総取引|失敗|手数料|推定決算',
        '顧客を名前/メール表示・検索語縮小・Excelダウンロード',
      ],
      CH: [
        'USDT/托管汇总条：件数|总交易|失败|手续费|估算结算',
        '客户显示为 姓名/邮箱 · 缩短搜索框 · Excel 下载',
      ],
      TH: [
        'แถบสรุป USDT/เอสโครว์: จำนวน|ยอดรวม|ล้มเหลว|ค่าธรรมเนียม|ประมาณการ',
        'ลูกค้าแบบ ชื่อ/อีเมล · ช่องค้นหาสั้นลง · ดาวน์โหลด Excel',
      ],
    },
  },
  {
    version: '2.6.5',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'USDT·에스크로 목록: PG형 검색(신청일/예상완료일, 당일·당월·전일·1주·2주·전월, 상태·검색구분)',
        '한 번에 보기 옆에 페이지 번호(1 2 3… ›) 항상 표시 + 상태별 파스텔 집계',
      ],
      US: [
        'USDT & escrow lists: PG-style filters (applied/expected date, today/month/week presets, status)',
        'Page numbers (1 2 3… ›) always beside view-at-once + pastel status summary',
      ],
      JP: [
        'USDT・エスクロー: PG型検索（申請日/予定完了日、当日・当月・週など）',
        '一度に表示の横にページ番号を常時表示＋状態別集計',
      ],
      CH: [
        'USDT/托管列表：PG 式筛选（申请日/预计完成日、当日当月等快捷）',
        '一次查看旁始终显示页码 + 状态汇总色块',
      ],
      TH: [
        'รายการ USDT/เอสโครว์: ตัวกรองแบบ PG (วันสมัคร/วันคาดเสร็จ ปุ่มช่วงวัน)',
        'แสดงหมายเลขหน้า (1 2 3…) ข้างดูครั้งละเสมอ + สรุปสถานะ',
      ],
    },
  },
  {
    version: '2.6.4',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'USDT 매입·무역에스크로 목록: 검색·정렬·한 번에 보기(50~1000/모두) — PG 결제내역형',
        '관리자 목록에 고객·첨부·고정/CURFEX·통화·결제수단·입력방식 표시',
        'USDT 상세: 라벨 파스텔 칩 구분 + 결제수단·입력방식·수수료 항목 보강',
      ],
      US: [
        'USDT & escrow lists: search, sort, view-at-once (50–1000/All) like PG payment history',
        'Admin columns: customer, attachments, fixed/CURFEX, currency, payment method, input mode',
        'USDT detail: pastel label chips + payment/input mode and fee breakdown',
      ],
      JP: [
        'USDT・エスクロー一覧: 検索・並び替え・一度に表示（50〜1000/すべて）',
        '管理者列: 顧客・添付・固定/CURFEX・通貨・決済手段・入力方式',
        'USDT詳細: パステルラベル＋決済手段・入力方式・手数料',
      ],
      CH: [
        'USDT / 托管列表：搜索、排序、一次查看（50–1000/全部）',
        '管理员列：客户、附件、固定/CURFEX、货币、支付方式、输入方式',
        'USDT 详情：粉彩标签 + 支付/输入方式与手续费明细',
      ],
      TH: [
        'รายการ USDT และเอสโครว์: ค้นหา เรียงลำดับ ดูครั้งละ (50–1000/ทั้งหมด)',
        'คอลัมน์แอดมิน: ลูกค้า ไฟล์แนบ คงที่/CURFEX สกุลเงิน วิธีชำระ วิธีป้อน',
        'รายละเอียด USDT: ป้ายพาสเทล + วิธีชำระ/ป้อน และค่าธรรมเนียม',
      ],
    },
  },
  {
    version: '2.6.3',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'CURFEX 적용 통화 선택(JPY/KRW/THB/CNY) — 본사정책 → 결제관리',
        '미선택 통화는 CURFEX ON이어도 고정계좌 + 입금 영수증 (예외 조항)',
      ],
      US: [
        'CURFEX currency multi-select (JPY/KRW/THB/CNY) in HQ Payment',
        'Unselected currencies stay on fixed accounts + deposit receipt even when CURFEX is on',
      ],
      JP: [
        'CURFEX適用通貨の選択（JPY/KRW/THB/CNY）を決済管理に追加',
        '未選択通貨はCURFEX ONでも固定口座＋入金領収書',
      ],
      CH: [
        'CURFEX 适用货币多选（JPY/KRW/THB/CNY）— 总部支付管理',
        '未选货币即使开启 CURFEX 仍用固定账户 + 入金收据',
      ],
      TH: [
        'เลือกสกุลเงิน CURFEX (JPY/KRW/THB/CNY) ใน Payment ของ HQ',
        'สกุลที่ไม่ได้เลือกใช้บัญชีคงที่ + ใบเสร็จฝาก แม้เปิด CURFEX',
      ],
    },
  },
  {
    version: '2.6.2',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'CURFEX 신청 시 입금 영수증 필드 제거 — 신청서·자금 원천만 업로드',
        '첨부 파일명 영문 자동 변경(Certificate of Service Source_ / Deposit Receipt_) + 한글 깨짐 방지',
        'USDT 매입 상세 라벨 메뉴화·카드 내 글자 크기 통일(text-xs)',
      ],
      US: [
        'CURFEX apply: no deposit receipt field — application/source-of-funds only',
        'Auto English attachment names (Certificate of Service Source_ / Deposit Receipt_) + fix mojibake',
        'USDT detail labels as menu keys; unify card text size (text-xs)',
      ],
      JP: [
        'CURFEX申請で入金領収書欄を削除 — 申請書・資金原資のみ',
        '添付ファイル名を英語で自動命名 + 文字化け防止',
        'USDT詳細ラベルのメニュー化・カード内文字サイズ統一',
      ],
      CH: [
        'CURFEX 申请取消入金收据栏 — 仅申请书/资金来源',
        '附件文件名自动英文化 + 修复乱码',
        'USDT 详情标签菜单化、卡片内字号统一',
      ],
      TH: [
        'CURFEX ไม่ต้องแนบใบเสร็จฝาก — อัปโหลดเฉพาะคำขอ/แหล่งเงิน',
        'เปลี่ยนชื่อไฟล์เป็นภาษาอังกฤษอัตโนมัติ + แก้ชื่อภาษาไทย/เกาหลีเพี้ยน',
        'ป้ายกำกับรายละเอียด USDT เป็นเมนู และขนาดตัวอักษรในบัตรให้เท่ากัน',
      ],
    },
  },
  {
    version: '2.6.1',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        '이용메뉴얼 V2.6.1 — CURFEX 입금 자동감지 전 언어 상세 반영',
        '총본사·조직·고객 메뉴얼에 CURFEX vs 고정계좌 흐름·FAQ 추가',
      ],
      US: [
        'Usage manuals V2.6.1 — full CURFEX auto-deposit docs (all languages)',
        'HQ, org, and customer manuals: CURFEX vs fixed account flow and FAQ',
      ],
      JP: [
        '利用マニュアル V2.6.1 — CURFEX入金自動検知を全言語で詳細化',
        '総本社・組織・顧客マニュアルにCURFEX/固定口座の流れとFAQ',
      ],
      CH: [
        '使用手册 V2.6.1 — CURFEX 入金自动检测全语言详细说明',
        '总部·组织·客户手册补充 CURFEX 与固定账户流程及 FAQ',
      ],
      TH: [
        'คู่มือ V2.6.1 — เอกสาร CURFEX ตรวจเงินเข้าอัตโนมัติครบทุกภาษา',
        'คู่มือ HQ องค์กร ลูกค้า: ขั้นตอน CURFEX vs บัญชีคงที่ และ FAQ',
      ],
    },
  },
  {
    version: '2.6',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'CURFEX 입금 자동 감지(웹훅·폴링) — 증빙 업로드 없이 관리자 확인 단계로 전환',
        '고정 수취계좌는 기존처럼 수동 증빙. CURFEX만 자동화',
        '샌드박스 입금 시뮬레이션·HMAC 웹훅 Secret·다국어 안내',
      ],
      US: [
        'CURFEX auto deposit detection (webhook/poll) — skip proof upload to admin review',
        'Fixed accounts stay manual; automation only when CURFEX is on',
        'Sandbox deposit simulation, HMAC webhook secret, multilingual UI',
      ],
      JP: [
        'CURFEX入金の自動検知（Webhook/ポーリング）— 証憑なしで管理者確認へ',
        '固定口座は手動のまま。CURFEX有効時のみ自動化',
        'サンドボックス入金シミュレーション・HMAC Secret・多言語',
      ],
      CH: [
        'CURFEX 入金自动检测（Webhook/轮询）— 无需凭证即可进入管理员确认',
        '固定账户仍手动；仅 CURFEX 开启时自动化',
        '沙盒入金模拟、HMAC Secret、多语言',
      ],
      TH: [
        'ตรวจจับเงินเข้า CURFEX อัตโนมัติ (webhook/poll) — ข้ามอัปโหลดหลักฐาน',
        'บัญชีคงที่ยังยืนยันด้วยมือ อัตโนมัติเฉพาะเมื่อเปิด CURFEX',
        'จำลองฝากแซนด์บ็อกซ์ HMAC Secret และหลายภาษา',
      ],
    },
  },
  {
    version: '2.5',
    kind: 'minor',
    date: '2026-08-27',
    items: {
      KR: [
        'CURFEX Collection(일본 이체 수취) 추가 옵션 — 끄면 고정 수취계좌, 켜면 JPY 이체 시 건별 계좌 발급',
        '본사정책 → 운영관리 → 결제관리에서 Client ID/Secret·샌드박스 설정. 샌드박스로 테스트 계좌 발급 가능',
        '이용메뉴얼에 CURFEX 설정·사용·테스트 절차 반영 (V2.5)',
      ],
      US: [
        'Optional CURFEX Collection for Japan bank transfer — off = fixed accounts, on = per-ticket JPY account',
        'Configure Client ID/Secret and sandbox under HQ Policy → Ops → Payment. Sandbox can issue test accounts',
        'Usage manuals updated with CURFEX setup and test steps (V2.5)',
      ],
      JP: [
        'CURFEX Collection（日本振込受取）を追加オプション — OFF=固定口座、ON=JPY振込で取引ごと口座発行',
        '本社ポリシー→運営管理→決済管理でClient ID/Secret・サンドボックス設定。サンドボックスでテスト口座発行可',
        '利用マニュアルにCURFEX設定・利用・テスト手順を反映（V2.5）',
      ],
      CH: [
        '新增 CURFEX Collection（日本转账收款）可选功能 — 关闭=固定账户，开启=JPY 按单开户',
        '在总部策略→运营管理→支付管理配置 Client ID/Secret 与沙盒。沙盒可开测试账户',
        '使用手册补充 CURFEX 设置与测试步骤（V2.5）',
      ],
      TH: [
        'เพิ่ม CURFEX Collection (รับโอนญี่ปุ่น) เป็นตัวเลือก — ปิด=บัญชีคงที่ เปิด=ออกบัญชี JPY รายตั๋ว',
        'ตั้งค่า Client ID/Secret และแซนด์บ็อกซ์ที่ HQ Policy → Ops → Payment ทดสอบด้วยบัญชีแซนด์บ็อกซ์ได้',
        'อัปเดตคู่มือขั้นตอนตั้งค่าและทดสอบ CURFEX (V2.5)',
      ],
    },
  },
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
