import type { ManualLocale } from './version';

export type ManualSection = {
  id: string;
  title: Record<ManualLocale, string>;
  bodyHtml: Record<ManualLocale, string>;
};

export type ManualDoc = {
  id: string;
  coverTitle: Record<ManualLocale, string>;
  coverSubtitle: Record<ManualLocale, string>;
  sections: ManualSection[];
};

function L(
  kr: string,
  us: string,
  jp: string,
  ch = us,
  th = us,
): Record<ManualLocale, string> {
  return { KR: kr, US: us, JP: jp, CH: ch, TH: th };
}

export const HQ_OPS_MANUAL: ManualDoc = {
  id: 'hq-ops',
  coverTitle: L('총본사 운영 메뉴얼', 'HQ Operations Manual', '総本社運営マニュアル', '总部运营手册', 'คู่มือปฏิบัติการสำนักงานใหญ่'),
  coverSubtitle: L(
    '본사정책·수수료·결제·USDT·에스크로·사용자·버전 관리 — 총본사(슈퍼관리자) 가이드',
    'HQ policy, fees, payments, USDT, escrow, users & versioning — Super Admin guide',
    '本社ポリシー・手数料・決済・USDT・エスクロー・ユーザー・バージョン管理 — スーパー管理者向け',
    '总部策略、手续费、支付、USDT、托管、用户与版本 — 超级管理员指南',
    'นโยบาย HQ ค่าธรรมเนียม การชำระเงิน USDT เอสโครว์ ผู้ใช้ และเวอร์ชัน — คู่มือ Super Admin',
  ),
  sections: [
    {
      id: 's1',
      title: L('역할과 메뉴', 'Roles & menus', '役割とメニュー', '角色与菜单', 'บทบาทและเมนู'),
      bodyHtml: L(
        `<p>총본사(<strong>SUPER_ADMIN</strong>)는 좌측 메뉴의 모든 항목과 <strong>본사정책</strong>에 접근합니다.</p>
        <table><thead><tr><th>메뉴</th><th>설명</th></tr></thead><tbody>
        <tr><td>대시보드</td><td>시세·요약·빠른 신청</td></tr>
        <tr><td>USDT 매입</td><td>매입 티켓 조회·승인·송금</td></tr>
        <tr><td>무역 에스크로</td><td>에스크로 계약·상태 관리</td></tr>
        <tr><td>수수료 장부</td><td>조직 수수료 정산 내역</td></tr>
        <tr><td>사용자관리</td><td>계정·조직·권한</td></tr>
        <tr><td>본사정책</td><td>접근·조직항목·수수료·플랫폼·운영관리</td></tr>
        <tr><td>이용메뉴얼</td><td>본 문서 및 고객 메뉴얼</td></tr>
        </tbody></table>
        <div class="info-box">조직 스태프·고객은 본사정책에 접근할 수 없습니다. 필요 시 총본사에 요청하십시오.</div>`,
        `<p>HQ (<strong>SUPER_ADMIN</strong>) can access every left-nav item and <strong>HQ Policy</strong>.</p>
        <table><thead><tr><th>Menu</th><th>Description</th></tr></thead><tbody>
        <tr><td>Dashboard</td><td>Rates, summary, quick actions</td></tr>
        <tr><td>USDT purchase</td><td>Tickets, review, transfer</td></tr>
        <tr><td>Trade escrow</td><td>Contracts & status</td></tr>
        <tr><td>Ledger</td><td>Commission settlement</td></tr>
        <tr><td>Users</td><td>Accounts & orgs</td></tr>
        <tr><td>HQ Policy</td><td>Access, columns, fees, platform, ops</td></tr>
        <tr><td>Manuals</td><td>This document & customer guide</td></tr>
        </tbody></table>
        <div class="info-box">Org staff and customers cannot open HQ Policy. Ask HQ when needed.</div>`,
        `<p>総本社(<strong>SUPER_ADMIN</strong>)は左メニュー全項目と<strong>本社ポリシー</strong>にアクセスできます。</p>
        <div class="info-box">組織スタッフ・顧客は本社ポリシーに入れません。</div>`,
        `<p>总部（<strong>SUPER_ADMIN</strong>）可访问全部左侧菜单与<strong>总部策略</strong>。</p>`,
        `<p>สำนักงานใหญ่ (<strong>SUPER_ADMIN</strong>) เข้าเมนูซ้ายทั้งหมดและ <strong>HQ Policy</strong> ได้</p>`,
      ),
    },
    {
      id: 's2',
      title: L('본사정책 허브', 'HQ Policy hub', '本社ポリシーハブ', '总部策略中心', 'ศูนย์นโยบาย HQ'),
      bodyHtml: L(
        `<span class="menu-path">본사정책</span>
        <ul>
          <li><strong>접근·권한</strong> — 조직 단계별 메뉴 권한, 사용자 OTP·비밀번호</li>
          <li><strong>조직항목</strong> — 화면 컬럼·표시 순서</li>
          <li><strong>수수료·리스크</strong> — 시볼 수수료 구간, 한도, 조직 요율, 수수료율 노출</li>
          <li><strong>플랫폼 도메인·SSL</strong> — 브랜드·도메인·이메일·SSL</li>
          <li><strong>운영관리</strong> — 변경이력, 업데이트 내용/이력, 결제관리</li>
        </ul>
        <div class="warn-box">설정 저장 시 자동 업데이트 이력이 기록될 수 있습니다. 주요 변경은 V3.0처럼 정수 버전, 소소한 변경은 2.1·2.2처럼 소수로 관리합니다.</div>`,
        `<span class="menu-path">HQ Policy</span>
        <ul>
          <li><strong>Access</strong> — org menu permissions, OTP/password</li>
          <li><strong>Org columns</strong> — grid columns & order</li>
          <li><strong>Fees & risk</strong> — symbol tiers, limits, org rates, rate visibility</li>
          <li><strong>Platform</strong> — brand, domain, email, SSL</li>
          <li><strong>Ops</strong> — change log, release notes/history, payment</li>
        </ul>
        <div class="warn-box">Saves may auto-record release history. Major = 3.0; minor = 2.1, 2.2.</div>`,
        `<span class="menu-path">本社ポリシー</span>
        <div class="warn-box">主要変更は整数バージョン、軽微は小数(2.1, 2.2)で管理します。</div>`,
        `<span class="menu-path">总部策略</span>`,
        `<span class="menu-path">HQ Policy</span>`,
      ),
    },
    {
      id: 's3',
      title: L('수수료 정책 (% / 고정)', 'Fee policy (% / fixed)', '手数料ポリシー', '手续费政策', 'นโยบายค่าธรรมเนียม'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 수수료·리스크 → 시볼(티켓) 수수료</span>
        <p>FX·가스피·송금·기타 수수료마다 <strong>%</strong> 또는 <strong>고정(USDT)</strong>을 선택합니다. 선택한 방식만 계산·도식에 반영됩니다.</p>
        <div class="check-box"><strong>세팅된 수수료율 노출</strong> — 사용 시 도식에 수수료율 열 표시, 미사용 시 숨김.</div>
        <p>통화·금액 구간별로 행을 편집한 뒤 저장하십시오.</p>`,
        `<span class="menu-path">HQ Policy → Fees → Symbol fees</span>
        <p>Each of FX, gas, transfer, other can be <strong>%</strong> or <strong>fixed USDT</strong>. Only the selected mode applies.</p>
        <div class="check-box"><strong>Show fee rates</strong> — On shows the rate column; Off hides it.</div>`,
        `<span class="menu-path">本社ポリシー → 手数料</span>
        <p>各手数料を%または固定USDTで選択します。</p>`,
        `<p>各项手续费可选 % 或固定 USDT。</p>`,
        `<p>เลือก % หรือ USDT คงที่สำหรับแต่ละค่าธรรมเนียม</p>`,
      ),
    },
    {
      id: 's4',
      title: L('결제관리 · ICOPAY', 'Payment · ICOPAY', '決済・ICOPAY', '支付·ICOPAY', 'การชำระเงิน·ICOPAY'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 결제관리</span>
        <ol>
          <li>ICOPAY 연동: MID, Bracket Secret, API Base URL, 샌드박스</li>
          <li>카드 결제 사용 체크 → 저장(이중 확인)</li>
          <li>카드 수수료 %·통화별 최소/최대 한도</li>
        </ol>
        <div class="block-box">카드 결제를 끄면 고객 화면의 카드 버튼은 회색(비활성)으로 남고 숨기지 않습니다.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment</span>
        <ol>
          <li>ICOPAY: MID, Bracket Secret, API URL, sandbox</li>
          <li>Enable card payment → save (confirm)</li>
          <li>Card fee % and min/max per currency</li>
        </ol>
        <div class="block-box">When card is off, the customer card button stays gray (disabled), not hidden.</div>`,
        `<span class="menu-path">運営管理 → 決済管理</span>`,
        `<span class="menu-path">运营管理 → 支付管理</span>`,
        `<span class="menu-path">Ops → Payment</span>`,
      ),
    },
    {
      id: 's5',
      title: L('USDT 매입 운영', 'USDT purchase ops', 'USDT購入運用', 'USDT 采购运营', 'ปฏิบัติการซื้อ USDT'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입</span>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객 신청 (계좌 이체 또는 카드)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">입금 증빙 또는 카드 결제 완료</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">관리자 검토 → 송금 → TXID 등록</span></div>
        </div>
        <p>상세 화면에서 수수료 스냅샷·카드 결제 정보·김치/로컬 프리미엄을 확인합니다.</p>`,
        `<span class="menu-path">USDT purchase</span>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Customer applies (bank or card)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Deposit proof or card charged</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Review → transfer → TXID</span></div>
        </div>`,
        `<span class="menu-path">USDT購入</span>`,
        `<span class="menu-path">USDT 采购</span>`,
        `<span class="menu-path">USDT</span>`,
      ),
    },
    {
      id: 's6',
      title: L('버전 · 업데이트 내용', 'Version · release notes', 'バージョン・更新内容', '版本·更新内容', 'เวอร์ชัน·ประวัติอัปเดต'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 업데이트 내용</span>
        <p>라이브 버전은 표지·메뉴얼·업데이트 목록에 <strong>V{version}</strong>으로 표시됩니다.</p>
        <ul>
          <li><strong>주요 업데이트</strong> — 2.0, 3.0, 4.0 …</li>
          <li><strong>소소한 업데이트</strong> — 2.1, 2.2, 2.3 …</li>
        </ul>
        <div class="info-box">자동 배포·정책 저장에 따른 이력은 「업데이트 이력」탭에서도 확인할 수 있습니다.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Release notes</span>
        <p>Live version appears as <strong>V{version}</strong> on covers and lists.</p>
        <ul>
          <li><strong>Major</strong> — 2.0, 3.0, 4.0…</li>
          <li><strong>Minor</strong> — 2.1, 2.2, 2.3…</li>
        </ul>`,
        `<span class="menu-path">運営管理 → アップデート内容</span>`,
        `<span class="menu-path">运营管理 → 更新内容</span>`,
        `<span class="menu-path">Ops → Release notes</span>`,
      ),
    },
    {
      id: 's7',
      title: L('FAQ', 'FAQ', 'FAQ', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">카드 결제가 비활성인데 버튼이 보입니다.</div><div class="faq-a">의도된 동작입니다. 결제관리에서 사용으로 변경하면 활성화됩니다.</div></div>
        <div class="faq-item"><div class="faq-q">수수료율이 도식에 안 보입니다.</div><div class="faq-a">시볼 수수료의 「세팅된 수수료율 노출」이 미사용인지 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">메뉴얼 로고가 안 보입니다.</div><div class="faq-a">플랫폼 브랜딩에서 로고를 업로드했는지 확인하세요.</div></div>`,
        `<div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Enable card under Payment management.</div></div>
        <div class="faq-item"><div class="faq-q">Rates missing on diagram.</div><div class="faq-a">Turn on “Show configured fee rates”.</div></div>
        <div class="faq-item"><div class="faq-q">Manual logo missing.</div><div class="faq-a">Upload a logo under Platform branding.</div></div>`,
        `<div class="faq-item"><div class="faq-q">カードボタンが灰色です。</div><div class="faq-a">決済管理でカードを有効にしてください。</div></div>`,
        `<div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">请在支付管理中启用卡支付。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ปุ่มบัตรเป็นสีเทา</div><div class="faq-a">เปิดใช้งานบัตรใน Payment</div></div>`,
      ),
    },
  ],
};

export const ORG_OPS_MANUAL: ManualDoc = {
  id: 'org-ops',
  coverTitle: L('조직 운영 메뉴얼', 'Organization Ops Manual', '組織運営マニュアル', '组织运营手册', 'คู่มือปฏิบัติการองค์กร'),
  coverSubtitle: L(
    'USDT·에스크로·사용자·장부 — 조직 스태프 가이드',
    'USDT, escrow, users & ledger — org staff guide',
    'USDT・エスクロー・ユーザー・台帳 — 組織スタッフ向け',
    'USDT、托管、用户与台账 — 组织员工指南',
    'USDT เอสโครว์ ผู้ใช้ และบัญชี — คู่มือพนักงานองค์กร',
  ),
  sections: [
    {
      id: 'o1',
      title: L('접근 범위', 'Access scope', 'アクセス範囲', '访问范围', 'ขอบเขตการเข้าถึง'),
      bodyHtml: L(
        `<p>조직 스태프(<strong>ORG_STAFF</strong>)는 소속 조직 경로 하위 데이터를 조회·처리합니다. <strong>본사정책</strong>은 총본사 전용입니다.</p>
        <ul><li>USDT 매입 / 무역 에스크로 / 수수료 장부 / 사용자관리</li><li>이용메뉴얼 (조직·고객)</li></ul>`,
        `<p>Org staff (<strong>ORG_STAFF</strong>) work within their org path. <strong>HQ Policy</strong> is HQ-only.</p>`,
        `<p>組織スタッフは所属配下データを扱います。本社ポリシーは総本社専用です。</p>`,
        `<p>组织员工处理下属数据；总部策略仅总部可用。</p>`,
        `<p>พนักงานองค์กรจัดการข้อมูลในเส้นทางองค์กร; HQ Policy สำหรับสำนักงานใหญ่เท่านั้น</p>`,
      ),
    },
    {
      id: 'o2',
      title: L('일일 업무', 'Daily work', '日常業務', '日常工作', 'งานประจำวัน'),
      bodyHtml: L(
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT/에스크로 목록에서 대기 건 확인</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">증빙·상태 검토 후 다음 단계 처리</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">장부에서 수수료 배분 확인</span></div>
        </div>
        <div class="warn-box">카드 결제·수수료율 변경은 총본사 결제관리·수수료 정책에서만 가능합니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Check pending USDT/escrow</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Review proofs and advance status</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Verify ledger shares</span></div>
        </div>`,
        `<div class="warn-box">カード・手数料設定は総本社のみ変更できます。</div>`,
        `<div class="warn-box">卡支付与费率仅总部可改。</div>`,
        `<div class="warn-box">การตั้งค่าบัตร/ค่าธรรมเนียมแก้ได้ที่สำนักงานใหญ่เท่านั้น</div>`,
      ),
    },
  ],
};

export const CUSTOMER_MANUAL: ManualDoc = {
  id: 'customer',
  coverTitle: L('고객용 사용 메뉴얼', 'Customer User Manual', '顧客向け利用マニュアル', '客户使用手册', 'คู่มือผู้ใช้สำหรับลูกค้า'),
  coverSubtitle: L(
    '회원가입·지갑·USDT 매입·카드 결제·무역 에스크로',
    'Register, wallets, USDT purchase, card pay, trade escrow',
    '会員登録・ウォレット・USDT購入・カード決済・貿易エスクロー',
    '注册、钱包、USDT 采购、卡支付、贸易托管',
    'สมัคร กระเป๋า ซื้อ USDT ชำระบัตร และเอสโครว์การค้า',
  ),
  sections: [
    {
      id: 'c1',
      title: L('시작하기', 'Getting started', 'はじめに', '开始使用', 'เริ่มต้น'),
      bodyHtml: L(
        `<ol>
          <li>회원가입 (휴대폰·국가번호 필수) 후 로그인</li>
          <li><strong>내 지갑</strong>에서 TRC20 등 수령 주소 등록</li>
          <li>언어는 상단 언어 선택으로 변경</li>
        </ol>
        <div class="info-box">세션 유휴 시간이 지나면 자동 로그아웃됩니다.</div>`,
        `<ol>
          <li>Register (phone + country code) and sign in</li>
          <li>Add a receiving wallet under <strong>My wallets</strong></li>
          <li>Change language from the top bar</li>
        </ol>`,
        `<ol><li>会員登録(電話必須)→ログイン</li><li>ウォレット登録</li><li>言語切替</li></ol>`,
        `<ol><li>注册（手机必填）并登录</li><li>登记钱包</li><li>切换语言</li></ol>`,
        `<ol><li>สมัคร (ต้องมีโทรศัพท์) แล้วเข้าสู่ระบบ</li><li>เพิ่มกระเป๋า</li><li>เปลี่ยนภาษา</li></ol>`,
      ),
    },
    {
      id: 'c2',
      title: L('USDT 매입', 'USDT purchase', 'USDT購入', 'USDT 采购', 'ซื้อ USDT'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입 → + 신규신청</span>
        <p>희망 수령 USDT 또는 입금 금액을 입력하면 수수료·비용 도식이 표시됩니다.</p>
        <ul>
          <li><strong>계좌 이체</strong> — 안내 계좌 입금 후 2시간 내 증빙 제출</li>
          <li><strong>카드 결제</strong> — 카드 정보·환불 불가 동의 후 즉시 결제 (운영에서 활성화된 경우)</li>
        </ul>
        <div class="block-box">카드 결제는 완료 후 카드 취소·환불이 불가합니다. 동의 없이는 진행할 수 없습니다.</div>`,
        `<span class="menu-path">USDT → + New application</span>
        <p>Enter target USDT or fiat amount to see the fee diagram.</p>
        <ul>
          <li><strong>Bank transfer</strong> — deposit then upload proof within 2 hours</li>
          <li><strong>Card</strong> — pay after waiver (when enabled)</li>
        </ul>
        <div class="block-box">Card payments are non-refundable after charge.</div>`,
        `<span class="menu-path">USDT → +新規申請</span>
        <div class="block-box">カード決済後の返金はできません。</div>`,
        `<span class="menu-path">USDT → +新申请</span>
        <div class="block-box">卡支付完成后不可退款。</div>`,
        `<span class="menu-path">USDT → +สมัครใหม่</span>
        <div class="block-box">ชำระบัตรแล้วคืนเงินไม่ได้</div>`,
      ),
    },
    {
      id: 'c3',
      title: L('무역 에스크로', 'Trade escrow', '貿易エスクロー', '贸易托管', 'เอสโครว์การค้า'),
      bodyHtml: L(
        `<span class="menu-path">무역 에스크로 → + 신규 계약신청</span>
        <p>상대방 이메일·거래 조건을 입력합니다. 상대 수락 후 계약 확정 → 에스크로 진행입니다.</p>`,
        `<span class="menu-path">Trade escrow → + New contract application</span>
        <p>Enter counterparty email and terms. After accept & confirm, escrow proceeds.</p>`,
        `<span class="menu-path">貿易エスクロー → +新規契約申請</span>`,
        `<span class="menu-path">贸易托管 → +新合同申请</span>`,
        `<span class="menu-path">เอสโครว์ → +สมัครสัญญาใหม่</span>`,
      ),
    },
    {
      id: 'c4',
      title: L('FAQ', 'FAQ', 'FAQ', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">카드 버튼이 회색입니다.</div><div class="faq-a">현재 카드 결제가 비활성입니다. 계좌 이체를 이용하거나 운영자에게 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">예상 USDT와 실제가 다릅니다.</div><div class="faq-a">환율·가스비 변동으로 범위 내 차이가 날 수 있습니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Card pay is disabled; use bank transfer or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Received USDT differs.</div><div class="faq-a">Rate/gas variance may apply within the shown range.</div></div>`,
        `<div class="faq-item"><div class="faq-q">カードが灰色です。</div><div class="faq-a">カード決済が無効です。振込を利用してください。</div></div>`,
        `<div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">卡支付未启用，请用转账或联系客服。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ปุ่มบัตรเทา</div><div class="faq-a">บัตรปิดอยู่ ใช้โอนหรือติดต่อผู้ดูแล</div></div>`,
      ),
    },
  ],
};

export function getManualDoc(id: string): ManualDoc | null {
  if (id === 'hq-ops') return HQ_OPS_MANUAL;
  if (id === 'org-ops') return ORG_OPS_MANUAL;
  if (id === 'customer') return CUSTOMER_MANUAL;
  return null;
}
