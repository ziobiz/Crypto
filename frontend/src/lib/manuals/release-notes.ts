import type { PlatformReleaseNote } from './version';

/** 본사정책 → 운영관리 → 업데이트 내용 (PG 플랫폼 업데이트와 동일 형식) */
export const PLATFORM_RELEASE_NOTES: PlatformReleaseNote[] = [
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
