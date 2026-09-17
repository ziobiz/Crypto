import type { PlatformReleaseNote } from './version';

/** 본사정책 → 운영관리 → 업데이트 내용 (PG 플랫폼 업데이트와 동일 형식) */
export const PLATFORM_RELEASE_NOTES: PlatformReleaseNote[] = [
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
