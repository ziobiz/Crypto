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
    '본사정책·시뮬레이터·거래분석·수수료·USDT·에스크로·사용자·고객관리·인증패스 — 총본사 가이드',
    'HQ policy, simulator, trade analysis, fees, USDT, escrow, staff, customer verification — Super Admin guide',
    '本社ポリシー・シミュレーター・取引分析・手数料・USDT・エスクロー・顧客管理 — 総本社ガイド',
    '总部策略、模拟器、交易分析、手续费、USDT、托管、客户认证 — 总部指南',
    'นโยบาย HQ ตัวจำลอง วิเคราะห์ธุรกรรม ค่าธรรมเนียม USDT เอสโครว์ และการยืนยันลูกค้า — คู่มือ HQ',
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
        <tr><td>사용자관리</td><td>조직 직원(총본사·조직) 계정만</td></tr>
        <tr><td>고객관리</td><td>이용 회원 · 활성 상태 · 인증패스/비인증 · 서류 확인</td></tr>
        <tr><td>조직 관리</td><td>본사·총판·지사·대리점·영업점 생성</td></tr>
        <tr><td>본사정책</td><td>접근·조직항목·수수료·플랫폼·운영관리</td></tr>
        <tr><td>USDT 시뮬레이터</td><td>입금액/받을 USDT·네트워크·수수료 미리 계산 (본사정책 아래)</td></tr>
        <tr><td>기록 시뮬레이터</td><td>고객 시뮬레이터 사용 분석(위)과 목록(아래)</td></tr>
        <tr><td>거래분석</td><td>중계 입금·지갑 수령 USDT 수기 입력, 환율 자동, 수수료 역산</td></tr>
        <tr><td>수익분석</td><td>USDT 매입 건의 예상 USDT와 중계 USDT 비교</td></tr>
        <tr><td>이용메뉴얼</td><td>본 문서 및 조직·고객 메뉴얼</td></tr>
        </tbody></table>
        <div class="info-box">총본사·본사·총판 등 조직은 <strong>조직 관리</strong>에서 만듭니다. 사용자 등록의 「신규 조직 등록」으로도 만들 수 있습니다.</div>`,
        `<p>HQ (<strong>SUPER_ADMIN</strong>) can access every left-nav item and <strong>HQ Policy</strong>.</p>
        <table><thead><tr><th>Menu</th><th>Description</th></tr></thead><tbody>
        <tr><td>Dashboard</td><td>Rates, summary, quick actions</td></tr>
        <tr><td>USDT purchase</td><td>Tickets, review, transfer</td></tr>
        <tr><td>Trade escrow</td><td>Contracts & status</td></tr>
        <tr><td>Ledger</td><td>Commission settlement</td></tr>
        <tr><td>Users</td><td>Organization staff accounts only</td></tr>
        <tr><td>Customers</td><td>End members, active status, verification pass / unverified, documents</td></tr>
        <tr><td>Organizations</td><td>Create HQ, distributors, branches, agencies, sales offices</td></tr>
        <tr><td>HQ Policy</td><td>Access, columns, fees, platform, ops</td></tr>
        <tr><td>USDT simulator</td><td>Preview deposit / receive USDT, network, fees (under HQ Policy)</td></tr>
        <tr><td>Record simulator</td><td>Usage analysis on top, customer run list below</td></tr>
        <tr><td>Trade analysis</td><td>Manual broker deposit & received USDT; auto rate; reverse fee</td></tr>
        <tr><td>Profit analysis</td><td>Compare expected USDT vs broker USDT per purchase ticket</td></tr>
        <tr><td>Manuals</td><td>This document & org/customer guides</td></tr>
        </tbody></table>
        <div class="info-box">Org staff and customers cannot open HQ Policy. Ask HQ when needed.</div>`,
        `<p>総本社(<strong>SUPER_ADMIN</strong>)は左メニュー全項目と<strong>本社ポリシー</strong>にアクセスできます。</p>
        <table><thead><tr><th>メニュー</th><th>説明</th></tr></thead><tbody>
        <tr><td>ユーザー管理</td><td>組織スタッフのみ</td></tr>
        <tr><td>顧客管理</td><td>利用会員・有効状態・認証パス/未認証・書類確認</td></tr>
        </tbody></table>
        <div class="info-box">組織スタッフ・顧客は本社ポリシーに入れません。</div>`,
        `<p>总部（<strong>SUPER_ADMIN</strong>）可访问全部左侧菜单与<strong>总部策略</strong>。</p>
        <table><thead><tr><th>菜单</th><th>说明</th></tr></thead><tbody>
        <tr><td>用户管理</td><td>仅组织员工</td></tr>
        <tr><td>客户管理</td><td>终端会员、启用状态、认证通过/未认证、文件核对</td></tr>
        </tbody></table>`,
        `<p>สำนักงานใหญ่ (<strong>SUPER_ADMIN</strong>) เข้าเมนูซ้ายทั้งหมดและ <strong>HQ Policy</strong> ได้</p>
        <table><thead><tr><th>เมนู</th><th>คำอธิบาย</th></tr></thead><tbody>
        <tr><td>จัดการผู้ใช้</td><td>เฉพาะพนักงานองค์กร</td></tr>
        <tr><td>จัดการลูกค้า</td><td>สมาชิกผู้ใช้บริการ สถานะใช้งาน การยืนยัน และเอกสาร</td></tr>
        </tbody></table>`,
      ),
    },
    {
      id: 'hq-customers',
      title: L('고객관리 · 인증패스', 'Customers · verification pass', '顧客管理・認証パス', '客户管理·认证通过', 'จัดการลูกค้า·ผ่านการยืนยัน'),
      bodyHtml: L(
        `<span class="menu-path">고객관리</span>
        <p>이용 고객(회원)은 <strong>사용자관리가 아니라 고객관리</strong>에서 다룹니다. 예전 본사 인증센터 심사는 이 화면으로 합쳤습니다.</p>
        <table><thead><tr><th>구분</th><th>내용</th></tr></thead><tbody>
        <tr><td>사용자관리</td><td>총본사·조직 직원 계정만 등록·수정</td></tr>
        <tr><td>고객관리</td><td>이용 회원 목록, 활성/비활성, 인증 상태, S RATE·시뮬레이터, 계정 관리</td></tr>
        </tbody></table>
        <p>목록·계정 관리</p>
        <ul>
          <li>목록에 <strong>S RATE</strong>(청록=LIVE / 주황=SAND)와 <strong>시뮬레이터</strong>(사용/미사용) 열이 있습니다.</li>
          <li><strong>수정</strong> — 이름·휴대폰·모집 영업점·시뮬레이터 사용·S RATE·활성 상태·(선택) 새 비밀번호. 행을 더블클릭해도 수정 창이 열립니다.</li>
          <li><strong>비밀번호 초기화</strong> · <strong>OTP 초기화</strong> — 사용자관리와 동일 규칙(아래 「비밀번호·OTP 초기화」).</li>
        </ul>
        <p>인증 상태</p>
        <ul>
          <li><strong>인증패스</strong> — 서비스 이용 가능 (USDT 매입·무역 에스크로)</li>
          <li><strong>비인증</strong> — 서류 미제출 또는 미승인</li>
          <li><strong>심사중</strong> — 고객이 인증센터에서 서류를 제출함</li>
          <li><strong>반려</strong> — 사유를 남기고 재제출 요청</li>
        </ul>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객관리에서 해당 고객을 연다</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">업로드 서류(6개월 거래 예정 보고서, 법인은 세무·등기 증빙)를 확인한다</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">총본사만 <strong>인증패스</strong> 또는 <strong>반려</strong>를 처리한다</span></div>
        </div>
        <div class="warn-box">인증패스는 총본사(SUPER_ADMIN)만 가능합니다. 조직 스태프는 목록·서류를 볼 수 있으나 승인 버튼은 총본사 전용입니다.</div>
        <div class="check-box">인증패스가 없으면 해당 고객은 USDT 매입·무역 에스크로를 신청할 수 없습니다. 양식은 <strong>이용메뉴얼</strong>에서 내려받습니다.</div>`,
        `<span class="menu-path">Customers</span>
        <p>End members are managed under <strong>Customers, not Users</strong>. HQ verification review is merged into this screen.</p>
        <table><thead><tr><th>Area</th><th>What it is</th></tr></thead><tbody>
        <tr><td>Users</td><td>HQ and org staff accounts only</td></tr>
        <tr><td>Customers</td><td>Members, active/inactive, verification, S RATE & simulator, account actions</td></tr>
        </tbody></table>
        <p>List & account actions</p>
        <ul>
          <li>The list shows <strong>S RATE</strong> (teal = LIVE / orange = SAND) and <strong>simulator</strong> (on/off).</li>
          <li><strong>Edit</strong> — name, phone, recruiting office, simulator, S RATE, active status, optional new password. Double-click a row to open edit.</li>
          <li><strong>Password reset</strong> · <strong>OTP reset</strong> — same rules as Users (see “Password & OTP reset” below).</li>
        </ul>
        <ul>
          <li><strong>Verified pass</strong> — may use USDT purchase and trade escrow</li>
          <li><strong>Unverified</strong> — no documents or not yet approved</li>
          <li><strong>Under review</strong> — customer submitted files in Verification</li>
          <li><strong>Rejected</strong> — reason recorded; customer may resubmit</li>
        </ul>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Open the customer in Customers</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Review uploaded files (6-month forecast; corporates also tax/registry docs)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">HQ only: grant <strong>verification pass</strong> or <strong>reject</strong></span></div>
        </div>
        <div class="warn-box">Only SUPER_ADMIN can grant a pass. Org staff can view the list and files.</div>
        <div class="check-box">Without a pass the customer cannot apply for USDT purchase or escrow.</div>`,
        `<span class="menu-path">顧客管理</span>
        <p>利用顧客は<strong>ユーザー管理ではなく顧客管理</strong>で扱います。総本社の認証センター審査はこの画面に統合しました。</p>
        <ul>
          <li>一覧に<strong>S RATE</strong>(ティール=LIVE / オレンジ=SAND)と<strong>シミュレーター</strong>(使用/未使用)があります。</li>
          <li><strong>修正</strong> — 名前・電話・募集営業店・シミュレーター・S RATE・有効状態・(任意)新パスワード。行ダブルクリックでも開きます。</li>
          <li><strong>パスワード初期化</strong> · <strong>OTP初期化</strong> — ユーザー管理と同じ(下記参照)。</li>
          <li><strong>認証パス</strong> — USDT購入・貿易エスクロー利用可</li>
          <li><strong>未認証</strong> — 未提出または未承認</li>
          <li><strong>審査中</strong> — 顧客が認証センターで提出済み</li>
          <li><strong>差戻し</strong> — 理由を残し再提出</li>
        </ul>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">顧客管理で対象顧客を開く</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">アップロード書類を確認する</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">総本社のみ認証パスまたは差戻し</span></div>
        </div>
        <div class="warn-box">認証パスは総本社(SUPER_ADMIN)のみです。組織スタッフは一覧・書類の閲覧が可能です。</div>
        <div class="check-box">認証パスがなければUSDT購入・エスクローを申請できません。</div>`,
        `<span class="menu-path">客户管理</span>
        <p>终端客户在<strong>客户管理</strong>中处理，不在用户管理。总部认证审核已并入此页。</p>
        <ul>
          <li>列表含<strong>S RATE</strong>(青绿=LIVE / 橙=SAND)与<strong>模拟器</strong>(开/关)。</li>
          <li><strong>编辑</strong> — 姓名、手机、招募营业点、模拟器、S RATE、启用状态、(可选)新密码。双击行可打开编辑。</li>
          <li><strong>密码初始化</strong> · <strong>OTP 初始化</strong> — 与用户管理相同(见下文)。</li>
          <li><strong>认证通过</strong> — 可使用 USDT 采购与贸易托管</li>
          <li><strong>未认证</strong> — 未提交或未批准</li>
          <li><strong>审核中</strong> — 客户已在认证中心提交</li>
          <li><strong>已退回</strong> — 填写原因后客户可再提交</li>
        </ul>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">在客户管理中打开该客户</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">核对上传文件（6个月预估；法人另含税务/登记）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">仅总部可认证通过或退回</span></div>
        </div>
        <div class="warn-box">认证通过仅总部 SUPER_ADMIN。组织员工可查看名单与文件。</div>
        <div class="check-box">未通过认证则无法申请 USDT 采购或托管。</div>`,
        `<span class="menu-path">จัดการลูกค้า</span>
        <p>ลูกค้าผู้ใช้บริการจัดการที่ <strong>จัดการลูกค้า ไม่ใช่จัดการผู้ใช้</strong> การตรวจสอบของ HQ รวมไว้ที่หน้านี้แล้ว</p>
        <ul>
          <li>รายการมี <strong>S RATE</strong> (เขียวน้ำทะเล=LIVE / ส้ม=SAND) และ <strong>ตัวจำลอง</strong> (เปิด/ปิด)</li>
          <li><strong>แก้ไข</strong> — ชื่อ โทรศัพท์ สำนักงานรับสมัคร ตัวจำลอง S RATE สถานะใช้งาน (ไม่บังคับ) รหัสใหม่ ดับเบิลคลิกแถวเพื่อแก้ไข</li>
          <li><strong>รีเซ็ตรหัสผ่าน</strong> · <strong>รีเซ็ต OTP</strong> — กฎเดียวกับจัดการผู้ใช้ (ดูด้านล่าง)</li>
          <li><strong>ผ่านการยืนยัน</strong> — ใช้ซื้อ USDT และเอสโครว์ได้</li>
          <li><strong>ยังไม่ยืนยัน</strong> — ยังไม่ส่งหรือยังไม่อนุมัติ</li>
          <li><strong>กำลังตรวจสอบ</strong> — ลูกค้าส่งเอกสารที่ศูนย์ยืนยันแล้ว</li>
          <li><strong>ถูกปฏิเสธ</strong> — บันทึกเหตุผลให้ส่งใหม่</li>
        </ul>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">เปิดลูกค้าในจัดการลูกค้า</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ตรวจเอกสารที่อัปโหลด</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">เฉพาะ HQ ให้ผ่านการยืนยันหรือปฏิเสธ</span></div>
        </div>
        <div class="warn-box">ให้ผ่านได้เฉพาะ SUPER_ADMIN พนักงานองค์กรดูรายการและเอกสารได้</div>
        <div class="check-box">ยังไม่ผ่านจะสมัครซื้อ USDT หรือเอสโครว์ไม่ได้</div>`,
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
          <li><strong>플랫폼 도메인·SSL</strong> — 브랜드(사이트 이름·브라우저 탭)·입금 수취 계좌(통화별 이체/카드)·도메인·이메일·SSL</li>
          <li><strong>운영관리</strong> — 변경이력, 업데이트 내용/이력, 결제관리</li>
          <li><strong>USDT 시뮬레이터 / 기록 시뮬레이터</strong> — 본사정책 탭 아래. 기록은 사용 분석이 목록 위</li>
          <li><strong>거래분석 / 수익분석</strong> — 총본사 관리자·Organizer만. 진입 시 Google OTP 추가 확인. Organizer는 지정 admin만 부여</li>
        </ul>
        <div class="warn-box">설정 저장 시 자동 업데이트 이력이 기록될 수 있습니다. 주요 변경은 V3.0처럼 정수 버전, 소소한 변경은 2.1·2.2·2.4처럼 소수로 관리합니다.</div>`,
        `<span class="menu-path">HQ Policy</span>
        <ul>
          <li><strong>Access</strong> — org menu permissions, OTP/password</li>
          <li><strong>Org columns</strong> — grid columns & order</li>
          <li><strong>Fees & risk</strong> — symbol tiers, limits, org rates, rate visibility</li>
          <li><strong>Platform</strong> — brand (site name, browser tab), deposit accounts (transfer/card per currency), domain, email, SSL</li>
          <li><strong>Ops</strong> — change log, release notes/history, payment</li>
          <li><strong>USDT simulator / Record simulator</strong> — HQ Policy tabs. Analysis sits above the log list</li>
          <li><strong>Trade analysis / Profit analysis</strong> — HQ admin and Organizer only; extra Google OTP. Only the designated HQ admin can assign Organizer</li>
        </ul>
        <div class="warn-box">Saves may auto-record release history. Major = 3.0; minor = 2.1, 2.2, 2.4.</div>`,
        `<span class="menu-path">本社ポリシー</span>
        <div class="warn-box">主要変更は整数バージョン、軽微は小数(2.1, 2.2, 2.4)で管理します。</div>`,
        `<span class="menu-path">总部策略</span>
        <div class="warn-box">主要变更为整数版本，小改为小数（2.1、2.2、2.4）。</div>`,
        `<span class="menu-path">HQ Policy</span>
        <div class="warn-box">การเปลี่ยนหลักเป็นเลขจำนวนเต็ม การเปลี่ยนย่อยเป็นทศนิยม (2.1, 2.2, 2.4)</div>`,
      ),
    },
    {
      id: 'hq-brand',
      title: L('브랜드 · 브라우저 탭', 'Brand · browser tab', 'ブランド・タブ名', '品牌·浏览器标签', 'แบรนด์·แท็บเบราว์เซอร์'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 플랫폼 → 브랜드 카드</span>
        <ul>
          <li><strong>사이트 이름</strong> — 로그인 화면·로그인 후 메뉴에 표시됩니다.</li>
          <li><strong>브라우저 탭 이름</strong> — 비우면 사이트 이름을 탭에 씁니다. 따로 적으면 로그인 전후 모든 페이지 탭에 그 값이 나갑니다.</li>
        </ul>
        <div class="info-box">로그인만 사이트 이름이 보이고 로그인 후 Crypto Workflow로 바뀌던 문제를 사이트 이름(또는 탭 이름)으로 통일했습니다. 저장 후 브랜드 설정을 저장하세요.</div>`,
        `<span class="menu-path">HQ Policy → Platform → Brand card</span>
        <ul>
          <li><strong>Site name</strong> — shown on login and in the menu after login.</li>
          <li><strong>Browser tab title</strong> — if empty, the site name is used. If filled, that text is the tab title on every page before and after login.</li>
        </ul>
        <div class="info-box">The tab no longer falls back to “Crypto Workflow” after login. Save brand settings after editing.</div>`,
        `<span class="menu-path">本社ポリシー → プラットフォーム → ブランドカード</span>
        <ul>
          <li><strong>サイト名</strong> — ログイン画面とログイン後メニュー。</li>
          <li><strong>ブラウザタブ名</strong> — 空欄ならサイト名。入力すればログイン前後すべてのタブに表示。</li>
        </ul>`,
        `<span class="menu-path">总部策略 → 平台 → 品牌卡片</span>
        <ul>
          <li><strong>站点名称</strong> — 登录页与登录后菜单。</li>
          <li><strong>浏览器标签名称</strong> — 留空则用站点名称；填写后登录前后所有标签均显示该名称。</li>
        </ul>`,
        `<span class="menu-path">HQ Policy → แพลตฟอร์ม → การ์ดแบรนด์</span>
        <ul>
          <li><strong>ชื่อไซต์</strong> — หน้าเข้าสู่ระบบและเมนูหลังเข้าสู่ระบบ</li>
          <li><strong>ชื่อแท็บ</strong> — ว่างแล้วใช้ชื่อไซต์ ใส่แล้วแสดงทุกหน้าก่อน/หลังเข้าสู่ระบบ</li>
        </ul>`,
      ),
    },
    {
      id: 'hq-fiat',
      title: L('통화별 이체·카드 활성화', 'Per-currency transfer & card', '通貨別 振込・カード', '按币种开关转账与卡', 'เปิด/ปิดโอนและบัตรตามสกุล'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 플랫폼 → 고객 입금 수취 계좌 (통화별)</span>
        <p>KRW·JPY·THB·CNY마다 수취 계좌를 적고, <strong>이체거래</strong>와 <strong>카드결제</strong>를 따로 켭니다.</p>
        <ul>
          <li>이체를 끄면 고객이 그 통화로 <strong>계좌 이체 USDT 매입</strong>을 할 수 없습니다.</li>
          <li>카드를 끄면 그 통화로 <strong>카드 USDT 매입</strong>을 할 수 없습니다. (운영관리 카드 결제 전체 ON과 별개입니다.)</li>
          <li>고객 신청 화면에는 켜진 통화만 목록에 나옵니다. API에서도 막힙니다.</li>
        </ul>
        <div class="check-box">브랜드 설정 저장으로 함께 저장됩니다. 기존 값은 둘 다 켜진 상태입니다.</div>`,
        `<span class="menu-path">HQ Policy → Platform → Customer deposit accounts</span>
        <p>For KRW, JPY, THB, CNY enter the receiving account and toggle <strong>bank transfer</strong> and <strong>card payment</strong> separately.</p>
        <ul>
          <li>Transfer off → customers cannot buy USDT by bank transfer in that currency.</li>
          <li>Card off → customers cannot buy USDT by card in that currency (independent of the global card switch under Ops → Payment).</li>
          <li>The application screen lists only enabled currencies; the API also blocks disabled ones.</li>
        </ul>
        <div class="check-box">Saved with brand settings. Existing accounts default to both ON.</div>`,
        `<span class="menu-path">本社ポリシー → プラットフォーム → 顧客入金受取口座</span>
        <p>通貨ごとに振込取引とカード決済を個別にON/OFFします。OFFの通貨では当該方法のUSDT購入はできません。</p>`,
        `<span class="menu-path">总部策略 → 平台 → 客户入金收款账户</span>
        <p>按币种分别开关转账与卡支付。关闭后客户无法用该方式购买该币种 USDT。</p>`,
        `<span class="menu-path">HQ Policy → แพลตฟอร์ม → บัญชีรับเงินลูกค้า</span>
        <p>เปิด/ปิดการโอนและบัตรแยกตามสกุล ปิดแล้วลูกค้าซื้อ USDT วิธีนั้นในสกุลนั้นไม่ได้</p>`,
      ),
    },
    {
      id: 'hq-users-reset',
      title: L('비밀번호·OTP 초기화', 'Password & OTP reset', 'パスワード・OTP初期化', '密码与 OTP 初始化', 'รีเซ็ตรหัสผ่านและ OTP'),
      bodyHtml: L(
        `<span class="menu-path">사용자관리 · 고객관리</span>
        <p>조직 직원 계정은 <strong>사용자관리</strong>, 이용 회원(고객)은 <strong>고객관리</strong>에서 동일하게 처리합니다.</p>
        <ul>
          <li><strong>비밀번호 초기화</strong> — 임시 비밀번호는 <strong>이메일 @ 앞 아이디 + 1!</strong> 입니다. (예: name@mail.com → name1!) 화면 메시지에 임시 비밀번호가 표시됩니다. 다음 로그인에서는 대시보드 전에 <strong>새 비밀번호를 설정</strong>해야 합니다. 초기 규칙 비밀번호(아이디+1!)는 새 비밀번호로 쓸 수 없습니다.</li>
          <li><strong>OTP 초기화</strong> — 등록된 Google OTP 비밀키를 지웁니다. 비밀번호 초기화와는 별개입니다. 본사정책에서 OTP가 켜져 있으면 다음 로그인에서 <strong>OTP를 처음부터 다시 등록</strong>합니다.</li>
        </ul>
        <div class="warn-box">비밀번호 초기화 확인 문구에 OTP 해제가 적혀 있어도, OTP를 끄려면 OTP 초기화를 따로 눌러야 합니다.</div>`,
        `<span class="menu-path">Users · Customers</span>
        <p>Staff accounts under <strong>Users</strong>; end members under <strong>Customers</strong> — same reset rules.</p>
        <ul>
          <li><strong>Password reset</strong> — temporary password is <strong>email local-part + 1!</strong> (e.g. name@mail.com → name1!). The UI shows it. Next login requires setting a <strong>new password</strong> before the dashboard. The initial pattern cannot be reused as the new password.</li>
          <li><strong>OTP reset</strong> — clears the Google Authenticator secret. Separate from password reset. If OTP is enabled in HQ Policy, the user must <strong>enroll OTP again</strong> at next login.</li>
        </ul>
        <div class="warn-box">The password-reset confirm text may mention OTP, but OTP is only cleared by the OTP reset button.</div>`,
        `<span class="menu-path">ユーザー管理 · 顧客管理</span>
        <p>組織スタッフは<strong>ユーザー管理</strong>、利用会員は<strong>顧客管理</strong>で同様に処理します。</p>
        <ul>
          <li><strong>パスワード初期化</strong> — 仮パスワードはメールID+1!。次回ログインで新パスワード設定が必要。</li>
          <li><strong>OTP初期化</strong> — 秘密鍵を削除。次回ログインでOTP再登録。</li>
        </ul>
        <div class="warn-box">パスワード初期化だけではOTPは解除されません。</div>`,
        `<span class="menu-path">用户管理 · 客户管理</span>
        <p>组织员工在<strong>用户管理</strong>，终端客户在<strong>客户管理</strong>，规则相同。</p>
        <ul>
          <li><strong>密码初始化</strong> — 临时密码为邮箱ID+1!。下次登录须设置新密码。</li>
          <li><strong>OTP 初始化</strong> — 清除密钥。下次登录需重新绑定 OTP。</li>
        </ul>
        <div class="warn-box">仅初始化密码不会关闭 OTP。</div>`,
        `<span class="menu-path">จัดการผู้ใช้ · จัดการลูกค้า</span>
        <p>พนักงานองค์กรที่ <strong>จัดการผู้ใช้</strong> ลูกค้าที่ <strong>จัดการลูกค้า</strong> — กฎเดียวกัน</p>
        <ul>
          <li><strong>รีเซ็ตรหัสผ่าน</strong> — รหัสชั่วคราวคือ ID อีเมล+1! เข้าสู่ระบบครั้งถัดไปต้องตั้งรหัสใหม่</li>
          <li><strong>รีเซ็ต OTP</strong> — ลบรหัสลับ เข้าสู่ระบบครั้งถัดไปต้องลงทะเบียน OTP ใหม่</li>
        </ul>
        <div class="warn-box">รีเซ็ตรหัสผ่านอย่างเดียวไม่ปิด OTP</div>`,
      ),
    },
    {
      id: 's3',
      title: L('수수료 정책 (% / 고정)', 'Fee policy (% / fixed)', '手数料ポリシー', '手续费政策', 'นโยบายค่าธรรมเนียม'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 수수료·리스크 → 시볼(티켓) 수수료</span>
        <p>FX·가스피·송금·기타 수수료마다 <strong>%</strong> 또는 <strong>고정(USDT)</strong>을 선택합니다. 선택한 방식만 계산·도식에 반영됩니다.</p>
        <div class="check-box"><strong>세팅된 수수료율 노출</strong> — 사용 시 도식에 수수료율 열 표시, 미사용 시 숨김.</div>
        <p>통화·금액 구간별로 행을 편집한 뒤 저장하십시오.</p>
        <p class="mt-2"><strong>시뮬레이터 Sandbox 수수료</strong> (<span class="menu-path">본사정책 → 수수료·리스크 → 시뮬레이터용 수수료</span>, Sandbox 탭)</p>
        <ul>
          <li><strong>LIVE</strong> 구간·가스는 실거래(시볼) 수수료와 동일합니다.</li>
          <li><strong>Sandbox</strong>는 LIVE에 <strong>추가 기본 수수료</strong>(FX %, 가스/송금/기타 USDT)만 더합니다. 구간 표는 LIVE 미러(읽기 전용), 화면에는 <strong>합계 (LIVE)</strong>로 표시됩니다.</li>
          <li>「Sandbox 추가 수수료 0으로 초기화」로 Sandbox 가산만 0으로 되돌립니다.</li>
        </ul>`,
        `<span class="menu-path">HQ Policy → Fees → Symbol fees</span>
        <p>Each of FX, gas, transfer, other can be <strong>%</strong> or <strong>fixed USDT</strong>. Only the selected mode applies.</p>
        <div class="check-box"><strong>Show fee rates</strong> — On shows the rate column; Off hides it.</div>
        <p class="mt-2"><strong>Simulator Sandbox fees</strong> (<span class="menu-path">HQ Policy → Fees → Simulator fees</span>, Sandbox tab)</p>
        <ul>
          <li><strong>LIVE</strong> tiers and gas match live (symbol) fees.</li>
          <li><strong>Sandbox</strong> adds only <strong>basic fees</strong> (FX %, gas/transfer/other USDT) on top of LIVE. The tier table mirrors LIVE (read-only); the UI shows <strong>combined (LIVE)</strong>.</li>
          <li>“Reset Sandbox add-on fees to zero” clears only the Sandbox add-on.</li>
        </ul>`,
        `<span class="menu-path">本社ポリシー → 手数料</span>
        <p>各手数料を%または固定USDTで選択します。</p>
        <p class="mt-2"><strong>シミュレーターSandbox手数料</strong> — LIVE段階+基本加算。段階表はLIVEミラー(読取専用)。<strong>合計 (LIVE)</strong>表示。</p>`,
        `<span class="menu-path">总部策略 → 手续费</span>
        <p>各项手续费可选 % 或固定 USDT。</p>
        <p class="mt-2"><strong>模拟器 Sandbox 手续费</strong> — LIVE 档位之上叠加基本费；档位表为 LIVE 镜像(只读)；显示<strong>合计 (LIVE)</strong>。</p>`,
        `<span class="menu-path">HQ Policy → ค่าธรรมเนียม</span>
        <p>เลือก % หรือ USDT คงที่สำหรับแต่ละค่าธรรมเนียม</p>
        <p class="mt-2"><strong>Sandbox ตัวจำลอง</strong> — บวกค่าพื้นฐานกับ LIVE ตารางชั้นเป็น LIVE (อ่านอย่างเดียว) แสดง<strong>รวม (LIVE)</strong></p>`,
      ),
    },
    {
      id: 's4',
      title: L('결제관리 · ICOPAY · CURFEX', 'Payment · ICOPAY · CURFEX', '決済・ICOPAY・CURFEX', '支付·ICOPAY·CURFEX', 'การชำระเงิน·ICOPAY·CURFEX'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 결제관리</span>
        <p><strong>ICOPAY (카드)</strong></p>
        <ol>
          <li>ICOPAY 연동: MID, Bracket Secret, API Base URL, 샌드박스</li>
          <li>카드 결제 사용 체크 → 저장(이중 확인)</li>
          <li>카드 수수료 %·통화별 최소/최대 한도</li>
        </ol>
        <div class="block-box">카드 결제를 끄면 고객 화면의 카드 버튼은 회색(비활성)으로 남고 숨기지 않습니다. 통화별 카드 ON/OFF는 플랫폼 입금 수취 계좌에서 따로 설정합니다.</div>
        <p class="mt-3"><strong>CURFEX Collection (일본 JPY 이체 수취) — 추가 기능</strong></p>
        <p>기본은 <strong>꺼짐</strong>입니다. 꺼져 있으면 플랫폼의 <strong>전용 수취 계좌</strong>를 안내합니다. 켜면 JPY 계좌이체 USDT 매입 시 CURFEX가 <strong>건별 수취 계좌</strong>를 발급합니다. 전용 계좌 설정은 삭제되지 않습니다.</p>
        <ol>
          <li>결제관리 하단 <strong>CURFEX Collection</strong>에서 「CURFEX Collection 사용」을 켭니다.</li>
          <li><strong>샌드박스 모드</strong>를 ON으로 두면 Client ID/Secret 없이도 테스트용 계좌가 발급됩니다. (실 API 호출 없음)</li>
          <li>실연동 시: 샌드박스 OFF → CURFEX에서 받은 Client ID / Client Secret 입력 → API Base URL(UAT: <code>https://fcol-dashboard-uat1.curfex.com</code> 또는 운영 URL) → Wallet Name(선택) → 저장</li>
          <li>플랫폼에서 JPY <strong>이체거래</strong>가 켜져 있는지 확인합니다.</li>
          <li>고객 계정으로 JPY·계좌이체 USDT 매입을 신청하면 티켓 상세에 「CURFEX 발급」계좌·참조번호가 표시됩니다.</li>
        </ol>
        <div class="info-box">샌드박스 테스트: 사용 ON + 샌드박스 ON + 저장 → 고객으로 JPY 이체 신청 → 상세에 Sandbox Ginko 등 테스트 계좌가 보이면 정상입니다. 실입금 웹훅은 없습니다. 「샌드박스 입금 시뮬레이션」버튼을 누르면 입금 확인과 동일하게 상태가 <strong>관리자 확인(심사중)</strong>으로 바뀝니다.</div>
        <p class="mt-2"><strong>입금 자동 감지 (CURFEX ON 시)</strong></p>
        <ul>
          <li>신청 시 <strong>신청서·자금 원천 증빙만</strong> 업로드 (입금 영수증 불필요)</li>
          <li>웹훅 URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — CURFEX 포털 등록 + HMAC Secret</li>
          <li>실운영: 입금 감지 시 자동으로 <strong>관리자 확인(심사중)</strong> — 관리자는 USDT 매입 상세에서 「송금 처리 시작」</li>
          <li>샌드박스: 웹훅 없음 → 「샌드박스 입금 시뮬레이션」으로 동일 상태 전환 테스트</li>
          <li>고정 수취계좌(CURFEX OFF)는 기존처럼 수동 증빙</li>
        </ul>
        <div class="warn-box">CURFEX는 JPY 이체 수취용입니다. 카드결제는 ICOPAY, KRW/THB/CNY 전용계좌는 기존 방식을 그대로 씁니다.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment</span>
        <p><strong>ICOPAY (card)</strong></p>
        <ol>
          <li>ICOPAY: MID, Bracket Secret, API URL, sandbox</li>
          <li>Enable card payment → save (confirm)</li>
          <li>Card fee % and min/max per currency</li>
        </ol>
        <div class="block-box">When card is off, the customer card button stays gray (disabled), not hidden. Per-currency card on/off is set on Platform deposit accounts.</div>
        <p><strong>CURFEX Collection (JPY bank transfer) — additive</strong></p>
        <p>Default is <strong>OFF</strong>: customers see <strong>fixed</strong> HQ deposit accounts. When ON, JPY bank-transfer USDT purchases get a <strong>per-ticket</strong> CURFEX account. Fixed accounts are kept.</p>
        <ol>
          <li>Open <strong>CURFEX Collection</strong> on the Payment page and enable it.</li>
          <li><strong>Sandbox ON</strong> issues test accounts without calling the live API (Client ID/Secret not required for this test mode).</li>
          <li>Production: Sandbox OFF → enter Client ID / Secret → API Base URL (UAT: <code>https://fcol-dashboard-uat1.curfex.com</code> or prod) → optional Wallet Name → Save.</li>
          <li>Ensure JPY <strong>bank transfer</strong> is enabled under Platform deposit accounts.</li>
          <li>As a customer, apply for JPY bank-transfer USDT — ticket detail shows the CURFEX-issued account and reference.</li>
        </ol>
        <div class="info-box">Sandbox test: Enable + Sandbox ON → customer JPY transfer apply → test account on ticket. No real deposit webhook in sandbox — press “Simulate sandbox deposit” to move status to <strong>Admin reviewing</strong>.</div>
        <p><strong>Auto deposit detection (when CURFEX ON)</strong></p>
        <ul>
          <li>At apply: upload <strong>application / source-of-funds only</strong> (no deposit receipt)</li>
          <li>Webhook URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — register in CURFEX portal + HMAC Secret</li>
          <li>Live: deposit → auto <strong>Admin reviewing</strong> — admin starts remittance on ticket detail</li>
          <li>Sandbox: no webhook → “Simulate sandbox deposit” for the same transition</li>
          <li>Fixed accounts (CURFEX OFF) still require manual proof</li>
        </ul>
        <div class="warn-box">CURFEX is for JPY collection only. Cards stay on ICOPAY; other fiat fixed accounts are unchanged.</div>`,
        `<span class="menu-path">運営管理 → 決済管理</span>
        <p><strong>CURFEX Collection（JPY振込）</strong> — OFF=固定口座・手動証憑 / ON=取引ごと口座・入金自動検知。</p>
        <ol>
          <li>決済管理でCURFEXを有効化</li>
          <li>サンドボックスONでテスト / 本番はOFF＋Client ID/Secret</li>
          <li>Webhook <code>https://api.tinpass.com/api/webhooks/curfex</code> をCURFEXに登録</li>
          <li>顧客でJPY振込USDT申請→CURFEX口座表示→入金後は証憑不要で管理者確認へ</li>
        </ol>
        <div class="check-box">サンドボックス: 有効+サンドボックスON→申請→「サンドボックス入金シミュレーション」で自動検知を確認。</div>`,
        `<span class="menu-path">运营管理 → 支付管理</span>
        <p><strong>CURFEX Collection</strong> — 关闭=固定账户+手动凭证 / 开启=按单开户+入金自动检测。</p>
        <ol>
          <li>在支付管理启用 CURFEX</li>
          <li>沙盒 ON 测试 / 正式：沙盒 OFF + Client ID/Secret</li>
          <li>在 CURFEX 注册 Webhook <code>https://api.tinpass.com/api/webhooks/curfex</code></li>
          <li>客户 JPY 转账 USDT → 显示 CURFEX 账户 → 入金后无需凭证</li>
        </ol>
        <div class="check-box">沙盒：启用+沙盒 ON → 申请 → 点击「沙盒入金模拟」验证自动检测。</div>`,
        `<span class="menu-path">Ops → Payment</span>
        <p><strong>CURFEX Collection</strong> — ปิด=บัญชีคงที่+หลักฐานด้วยมือ / เปิด=บัญชีรายตั๋ว+ตรวจเงินเข้าอัตโนมัติ</p>
        <ol>
          <li>เปิด CURFEX ใน Payment</li>
          <li>Sandbox ON ทดสอบ / ปิดแล้วใส่ Client ID/Secret</li>
          <li>ลงทะเบียน Webhook <code>https://api.tinpass.com/api/webhooks/curfex</code></li>
          <li>ลูกค้าโอน JPY → แสดงบัญชี CURFEX → ไม่ต้องอัปโหลดสลิป</li>
        </ol>
        <div class="check-box">แซนด์บ็อกซ์: เปิดใช้+Sandbox ON → สมัคร → 「จำลองฝากแซนด์บ็อกซ์」เพื่อทดสอบ</div>`,
      ),
    },
    {
      id: 'hq-curfex',
      title: L('CURFEX 설정·입금 자동감지', 'CURFEX setup & auto-detect', 'CURFEX設定・入金自動検知', 'CURFEX 设置与自动检测', 'ตั้งค่า CURFEX และการตรวจอัตโนมัติ'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 결제관리 → CURFEX Collection</span>
        <table><thead><tr><th>항목</th><th>설명</th></tr></thead><tbody>
        <tr><td>사용 ON/OFF</td><td>OFF(기본)=모든 통화 고정 수취계좌·수동 증빙 / ON=선택 통화만 CURFEX</td></tr>
        <tr><td>적용 통화</td><td>JPY/KRW/THB/CNY 중 선택. 기본 JPY. 미선택 통화는 전용계좌 + 입금 영수증</td></tr>
        <tr><td>Client ID / Secret</td><td>CURFEX(Fukugu) 발급. 샌드박스만 테스트 시 비워도 됨</td></tr>
        <tr><td>웹훅 URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code> — CURFEX 포털에 등록</td></tr>
        <tr><td>HMAC Secret</td><td>「HMAC Secret 생성」후 CURFEX에 동일 값 등록</td></tr>
        <tr><td>자동 APPROVE</td><td>입금 금액이 신청액과 일치하면 decision APPROVE 자동 호출</td></tr>
        <tr><td>샌드박스</td><td>ON=테스트 계좌 + 「샌드박스 입금 시뮬레이션」으로 자동감지 흐름 검증</td></tr>
        </tbody></table>
        <p class="mt-2"><strong>CURFEX ON 업무 순서</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객 JPY 이체 신청 → 건별 계좌·참조번호 발급</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">고객이 안내 계좌로 입금 (증빙 업로드 없음)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">웹훅 또는 1분 폴링으로 입금 감지 → 관리자 확인</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">운영자가 USDT 송금·완료 (기존과 동일)</span></div>
        </div>
        <div class="warn-box">예외: CURFEX ON이어도 적용 통화에 없는 화폐(예: KRW)는 고정 수취계좌 + 입금 영수증이 필요합니다.</div>
        <div class="check-box">샌드박스: 사용 ON + 샌드박스 ON → 신청 → 티켓에서 「샌드박스 입금 시뮬레이션」→ 관리자 확인으로 넘어가면 성공.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment → CURFEX Collection</span>
        <table><thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>
        <tr><td>Enable</td><td>OFF=all currencies fixed + manual proof / ON=CURFEX only for selected currencies</td></tr>
        <tr><td>Currencies</td><td>Select JPY/KRW/THB/CNY. Default JPY. Unselected → fixed account + deposit receipt</td></tr>
        <tr><td>Client ID / Secret</td><td>From CURFEX (Fukugu). Optional for sandbox-only tests</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code></td></tr>
        <tr><td>HMAC Secret</td><td>Generate in TINPASS → register same value in CURFEX portal</td></tr>
        <tr><td>Auto APPROVE</td><td>When deposited amount matches application, call CURFEX decision APPROVE</td></tr>
        <tr><td>Sandbox</td><td>Test account + “Simulate sandbox deposit” on ticket</td></tr>
        </tbody></table>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Customer JPY transfer apply → per-ticket account</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Customer deposits (no proof upload)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook or 1-min poll → admin review</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Operator sends USDT and completes</span></div>
        </div>
        <div class="warn-box">Exception: even with CURFEX ON, currencies not in the list (e.g. KRW) use fixed accounts + deposit receipt.</div>`,
        `<span class="menu-path">決済管理 → CURFEX Collection</span>
        <table><thead><tr><th>項目</th><th>説明</th></tr></thead><tbody>
        <tr><td>使用ON/OFF</td><td>OFF=全通貨固定・手動 / ON=選択通貨のみCURFEX</td></tr>
        <tr><td>適用通貨</td><td>JPY/KRW/THB/CNY。既定JPY。未選択は固定口座＋領収書</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code></td></tr>
        <tr><td>HMAC Secret</td><td>生成後CURFEXに同値登録</td></tr>
        </tbody></table>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">JPY振込USDT申請→口座発行</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">入金（証憑不要）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook/ポーリング→管理者確認</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">USDT送金・完了</span></div>
        </div>`,
        `<span class="menu-path">支付管理 → CURFEX Collection</span>
        <table><thead><tr><th>项</th><th>说明</th></tr></thead><tbody>
        <tr><td>启用</td><td>关闭=固定账户+手动 / 开启=按单开户+自动检测</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code></td></tr>
        <tr><td>HMAC Secret</td><td>生成后在 CURFEX 登记相同值</td></tr>
        </tbody></table>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">JPY 转账申请 → 开立账户</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">入金（无需凭证）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook/轮询 → 管理员确认</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">USDT 发送与完成</span></div>
        </div>`,
        `<span class="menu-path">Payment → CURFEX Collection</span>
        <table><thead><tr><th>รายการ</th><th>ความหมาย</th></tr></thead><tbody>
        <tr><td>เปิดใช้</td><td>ปิด=บัญชีคงที่+ด้วยมือ / เปิด=บัญชีรายตั๋ว+อัตโนมัติ</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code></td></tr>
        <tr><td>HMAC Secret</td><td>สร้างใน TINPASS แล้วลงทะเบียนที่ CURFEX</td></tr>
        </tbody></table>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">สมัครโอน JPY → ออกบัญชี</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ฝากเงิน (ไม่ต้องอัปโหลดสลิป)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook/poll → ตรวจของผู้ดูแล</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ส่ง USDT และปิดงาน</span></div>
        </div>`,
      ),
    },
    {
      id: 's5',
      title: L('USDT 매입 운영', 'USDT purchase ops', 'USDT購入運用', 'USDT 采购运营', 'ปฏิบัติการซื้อ USDT'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입</span>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객 신청 (계좌 이체 또는 카드)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">전용계좌: 입금 증빙 / CURFEX: 자동 입금감지 / 카드: 결제 완료</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">관리자 검토 → 송금 → TXID 등록</span></div>
        </div>
        <p>상세 화면에서 수수료 스냅샷·카드 결제 정보·김치/로컬 프리미엄을 확인합니다. 중계에서 받은 USDT는 <strong>중계 USDT</strong>로 수기 입력하면 수익분석에 반영됩니다.</p>
        <p class="mt-2"><strong>CURFEX JPY 건 (입금 자동감지 ON)</strong></p>
        <ul>
          <li>티켓에 「입금 계좌 (CURFEX 발급)」·참조번호가 표시됩니다.</li>
          <li>입금 후 웹훅/폴링으로 <strong>관리자 확인</strong>으로 자동 전환 — 증빙 검토 불필요.</li>
          <li>금액 불일치 시 관리자 메모에 기록됩니다. 「입금 상태 확인」으로 CURFEX 상태를 수동 동기화할 수 있습니다.</li>
          <li>샌드박스: 「샌드박스 입금 시뮬레이션」으로 테스트.</li>
        </ul>`,
        `<span class="menu-path">USDT purchase</span>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Customer applies (bank or card)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Fixed account: deposit proof / CURFEX: auto detect / Card: charged</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Review → transfer → TXID</span></div>
        </div>
        <p>Enter <strong>broker USDT</strong> on the ticket for profit analysis.</p>
        <p><strong>CURFEX JPY tickets:</strong> CURFEX-issued account on detail. After deposit, webhook/poll moves to admin review — no proof review. Use “Check deposit status” to sync. Sandbox: “Simulate sandbox deposit”.</p>`,
        `<span class="menu-path">USDT購入</span>
        <p>固定口座=証憑確認 / CURFEX=入金自動検知で管理者確認へ / カード=決済完了。</p>
        <p>CURFEXチケットは「入金状態を確認」で同期。サンドボックスは入金シミュレーション。</p>`,
        `<span class="menu-path">USDT 采购</span>
        <p>固定账户=凭证确认 / CURFEX=自动检测入金 / 卡=支付完成。</p>
        <p>CURFEX 单据显示 CURFEX 账户；入金后自动进入管理员确认。沙盒可用「沙盒入金模拟」。</p>`,
        `<span class="menu-path">USDT</span>
        <p>บัญชีคงที่=ตรวจหลักฐาน / CURFEX=ตรวจอัตโนมัติ / บัตร=ชำระแล้ว</p>
        <p>ตั๋ว CURFEX แสดงบัญชี CURFEX หลังฝากจะไปขั้นตรวจของผู้ดูแลอัตโนมัติ ทดสอบด้วยจำลองฝากแซนด์บ็อกซ์</p>`,
      ),
    },
    {
      id: 'hq-sim',
      title: L('USDT 시뮬레이터 · 기록', 'USDT simulator · records', 'USDTシミュレーター・記録', 'USDT 模拟器·记录', 'ตัวจำลอง USDT · บันทึก'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → USDT 시뮬레이터 / 기록 시뮬레이터</span>
        <p>총본사 메뉴는 본사정책 아래에 있습니다. 고객·조직은 업무 메뉴의 시뮬레이터를 씁니다.</p>
        <ul>
          <li>출금 <strong>네트워크를 반드시 선택</strong>한 뒤 입금액 또는 받을 USDT로 계산합니다.</li>
          <li>고객 화면에는 최근 시뮬레이션이 <strong>최대 3건</strong> 남습니다. 대시보드 미리보기는 <strong>2건</strong>입니다.</li>
          <li>기록 시뮬레이터는 <strong>사용 분석이 위</strong>, 목록이 아래입니다. 보관 기간은 본사정책 → 플랫폼에서 바꿉니다.</li>
        </ul>
        <p><strong>고객·조직 시뮬레이터 설정</strong></p>
        <ul>
          <li><span class="menu-path">고객관리</span> · <span class="menu-path">조직 관리</span> — 시뮬레이터 사용 ON/OFF, S RATE(LIVE/SAND). SAND는 Sandbox 수수료 체계로 계산됩니다.</li>
          <li>S RATE는 목록에서 청록(LIVE)·주황(SAND) 배지로 구분됩니다.</li>
          <li>고객별 시뮬레이터 OFF는 본사 CUSTOMER 메뉴 권한보다 우선해 메뉴를 막습니다.</li>
        </ul>
        <p><strong>본사 시뮬레이터 LIVE / Sandbox 탭</strong></p>
        <ul>
          <li><strong>LIVE</strong> — 실거래(시볼) 수수료·환율로 계산합니다.</li>
          <li><strong>Sandbox</strong> — LIVE 구간·가스에 Sandbox 추가 기본 수수료를 더합니다. 구간 표는 LIVE 미러(읽기 전용), 값은 <strong>합계 (LIVE)</strong>로 표시됩니다.</li>
        </ul>
        <div class="info-box">Sandbox 수수료 편집은 <span class="menu-path">수수료·리스크 → 시뮬레이터용 수수료</span>에서 합니다(「수수료 정책」 참고).</div>`,
        `<span class="menu-path">HQ Policy → USDT simulator / Record simulator</span>
        <p>HQ menus sit under HQ Policy. Customers and orgs use the work-menu simulator.</p>
        <ul>
          <li>Choose a withdrawal <strong>network</strong>, then calculate from deposit or target USDT.</li>
          <li>The customer page keeps up to <strong>3</strong> recent runs. Dashboard preview shows <strong>2</strong>.</li>
          <li>Record simulator: <strong>usage analysis on top</strong>, list below. Retention is under HQ Policy → Platform.</li>
        </ul>
        <p><strong>Customer & org simulator settings</strong></p>
        <ul>
          <li><span class="menu-path">Customers</span> · <span class="menu-path">Organizations</span> — simulator on/off, S RATE (LIVE/SAND). SAND uses the Sandbox fee stack.</li>
          <li>S RATE appears as teal (LIVE) or orange (SAND) badges in the list.</li>
          <li>Per-customer simulator OFF overrides the HQ CUSTOMER menu matrix.</li>
        </ul>
        <p><strong>HQ simulator LIVE / Sandbox tabs</strong></p>
        <ul>
          <li><strong>LIVE</strong> — live (symbol) fees and rates.</li>
          <li><strong>Sandbox</strong> — LIVE tiers + gas plus Sandbox basic add-ons. Tier table mirrors LIVE (read-only); values show as <strong>combined (LIVE)</strong>.</li>
        </ul>
        <div class="info-box">Edit Sandbox fees under <span class="menu-path">Fees → Simulator fees</span> (see “Fee policy”).</div>`,
        `<span class="menu-path">本社ポリシー → USDTシミュレーター / 記録シミュレーター</span>
        <ul>
          <li>出金ネットワーク必須。入金額または受取USDTで計算。</li>
          <li>顧客画面は直近最大3件。ダッシュボードは2件。</li>
          <li>記録画面は利用分析が上、一覧が下。</li>
          <li><strong>顧客管理</strong>・<strong>組織管理</strong> — シミュレーターON/OFF、S RATE(LIVE/SAND)。SANDはSandbox手数料。</li>
          <li>本社シミュレーター LIVE/Sandbox タブ — SandboxはLIVE+追加基本手数料。段階表はLIVEミラー。</li>
        </ul>`,
        `<span class="menu-path">总部策略 → USDT 模拟器 / 记录模拟器</span>
        <ul>
          <li>必须选择提现网络，再按入金或目标 USDT 计算。</li>
          <li>客户页最多保留 3 条；仪表盘预览 2 条。</li>
          <li>记录页：使用分析在上，列表在下。</li>
          <li><strong>客户管理</strong>·<strong>组织管理</strong> — 模拟器开/关、S RATE(LIVE/SAND)。SAND 用 Sandbox 手续费。</li>
          <li>总部模拟器 LIVE/Sandbox 标签 — Sandbox 在 LIVE 上叠加基本费；档位表为 LIVE 镜像。</li>
        </ul>`,
        `<span class="menu-path">HQ Policy → ตัวจำลอง USDT / ตัวจำลองบันทึก</span>
        <ul>
          <li>ต้องเลือกเครือข่ายถอน แล้วคำนวณจากยอดฝากหรือ USDT ที่จะรับ</li>
          <li>หน้าลูกค้าเก็บได้สูงสุด 3 รายการ แดชบอร์ดโชว์ 2</li>
          <li>หน้าบันทึก: วิเคราะห์การใช้งานอยู่บน รายการอยู่ล่าง</li>
          <li><strong>จัดการลูกค้า</strong> · <strong>จัดการองค์กร</strong> — เปิด/ปิดตัวจำลอง S RATE (LIVE/SAND) SAND ใช้ค่าธรรมเนียม Sandbox</li>
          <li>แท็บ LIVE/Sandbox ที่ HQ — Sandbox บวกค่าพื้นฐานกับ LIVE ตารางชั้นเป็น LIVE (อ่านอย่างเดียว)</li>
        </ul>`,
      ),
    },
    {
      id: 'hq-trade',
      title: L('거래분석 · 수익분석', 'Trade analysis · profit', '取引分析・収益分析', '交易分析·收益分析', 'วิเคราะห์ธุรกรรม·กำไร'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 거래분석 / 수익분석</span>
        <p>두 메뉴 모두 <strong>수기 입력</strong>입니다. 원가 기록과 매입 건을 시스템이 자동 짝짓지 않습니다.</p>
        <ul>
          <li><strong>거래분석</strong> — 중계에 입금한 금액 + 지갑 수령 USDT. 본사 동일 환율 자동. 보정값·가스피 수기. 수수료 역산 후 목록 저장.</li>
          <li><strong>수익분석</strong> — USDT 매입 티켓의 예상 USDT와 수기 <strong>중계 USDT</strong>를 비교. 수익 = 중계 − 예상.</li>
        </ul>
        <div class="warn-box">총본사 관리자와 Organizer만 접근합니다. 들어갈 때 Google OTP를 다시 입력합니다. Organizer 역할은 지정된 총본사 admin만 부여할 수 있습니다.</div>`,
        `<span class="menu-path">HQ Policy → Trade analysis / Profit analysis</span>
        <p>Both menus are <strong>manual entry</strong>. The system does not auto-match cost rows to purchase tickets.</p>
        <ul>
          <li><strong>Trade analysis</strong> — amount sent to the broker + USDT received. Same HQ rate auto-applied. Correction and gas are typed. Fee is reverse-calculated and saved as a list.</li>
          <li><strong>Profit analysis</strong> — compare expected USDT on a purchase ticket with typed <strong>broker USDT</strong>. Profit = broker − expected.</li>
        </ul>
        <div class="warn-box">HQ admin and Organizer only. Extra Google OTP on entry. Only the designated HQ admin can assign Organizer.</div>`,
        `<span class="menu-path">本社ポリシー → 取引分析 / 収益分析</span>
        <p>どちらも手入力です。原価記録と購入件の自動突合はしません。</p>
        <ul>
          <li><strong>取引分析</strong> — 仲介入金と受取USDT。同一為替自動。補正・ガスは手入力。手数料を逆算して保存。</li>
          <li><strong>収益分析</strong> — 予想USDTと仲介USDTを同一チケットで比較。</li>
        </ul>
        <div class="warn-box">総本社管理者とOrganizerのみ。入場時にGoogle OTP。Organizer付与は指定adminのみ。</div>`,
        `<span class="menu-path">总部策略 → 交易分析 / 收益分析</span>
        <p>两项均为手工录入，系统不会把交易分析记录自动对到采购单。</p>
        <ul>
          <li><strong>交易分析</strong> — 打给中介的金额 + 钱包收到的 USDT。自动同一汇率。校正与燃气手填。反算手续费并保存列表。</li>
          <li><strong>收益分析</strong> — 同一采购票比较预计 USDT 与中介 USDT。</li>
        </ul>
        <div class="warn-box">仅总部管理员与 Organizer。进入需再次 Google OTP。仅指定总部管理员可授予 Organizer。</div>`,
        `<span class="menu-path">HQ Policy → วิเคราะห์ธุรกรรม / วิเคราะห์กำไร</span>
        <p>ทั้งสองเมนูกรอกเอง ระบบไม่จับคู่รายการต้นทุนกับตั๋วซื้อให้อัตโนมัติ</p>
        <ul>
          <li><strong>วิเคราะห์ธุรกรรม</strong> — ยอดโอนให้ตัวกลาง + USDT ที่วอลเล็ตได้รับ เรท HQ อัตโนมัติ ค่าปรับแก้/แก๊สกรอกเอง ค่าธรรมเนียมคำนวณย้อนแล้วบันทึกรายการ</li>
          <li><strong>วิเคราะห์กำไร</strong> — เทียบ USDT ที่คาดกับ USDT ตัวกลางในตั๋วเดียวกัน</li>
        </ul>
        <div class="warn-box">เฉพาะผู้ดูแล HQ และ Organizer เข้าเมนูต้อง OTP เพิ่ม มอบ Organizer ได้เฉพาะแอดมินที่กำหนด</div>`,
      ),
    },
    {
      id: 's6',
      title: L('버전 · 업데이트 내용', 'Version · release notes', 'バージョン・更新内容', '版本·更新内容', 'เวอร์ชัน·ประวัติอัปเดต'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 업데이트 내용</span>
        <p>라이브 버전은 표지·메뉴얼·업데이트 목록에 <strong>V{version}</strong>으로 표시됩니다. 현재 라이브는 목록 최상단 버전과 동일합니다.</p>
        <ul>
          <li><strong>주요 업데이트</strong> — 2.0, 3.0, 4.0 …</li>
          <li><strong>소소한 업데이트</strong> — 2.1 … 2.6 …</li>
        </ul>
        <div class="info-box">V2.6: 시뮬레이터·고객관리·Sandbox 수수료 등 운영·고객·조직 이용메뉴얼 전 언어 반영.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Release notes</span>
        <p>Live version appears as <strong>V{version}</strong> on covers and lists. The current live matches the top entry here.</p>
        <ul>
          <li><strong>Major</strong> — 2.0, 3.0, 4.0…</li>
          <li><strong>Minor</strong> — 2.1 … 2.6…</li>
        </ul>
        <div class="info-box">V2.6: simulator, customer admin, Sandbox fees — full manual updates (all languages).</div>`,
        `<span class="menu-path">運営管理 → アップデート内容</span>
        <p>ライブ版は表紙・マニュアル・更新一覧に V{version} で表示。現在は一覧最上段と一致。</p>`,
        `<span class="menu-path">运营管理 → 更新内容</span>
        <p>线上版本在封面、手册与更新列表显示为 V{version}，与列表首条一致。</p>`,
        `<span class="menu-path">Ops → Release notes</span>
        <p>เวอร์ชันสดแสดงเป็น V{version} ตรงกับรายการบนสุด</p>`,
      ),
    },
    {
      id: 's7',
      title: L('FAQ', 'FAQ', 'FAQ', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">카드 결제가 비활성인데 버튼이 보입니다.</div><div class="faq-a">의도된 동작입니다. 결제관리에서 사용으로 변경하면 활성화됩니다.</div></div>
        <div class="faq-item"><div class="faq-q">고객이 서비스를 신청하지 못합니다.</div><div class="faq-a">고객관리에서 해당 고객의 서류를 확인하고 인증패스를 처리하세요. 인증패스 전에는 USDT·에스크로 신청이 막힙니다.</div></div>
        <div class="faq-item"><div class="faq-q">인증센터 메뉴가 안 보입니다.</div><div class="faq-a">총본사·조직은 고객관리로 통합되었습니다. 고객 계정만 왼쪽 인증센터에서 서류를 올립니다.</div></div>
        <div class="faq-item"><div class="faq-q">수수료율이 도식에 안 보입니다.</div><div class="faq-a">시볼 수수료의 「세팅된 수수료율 노출」이 미사용인지 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">거래분석·수익분석에 OTP를 또 묻습니다.</div><div class="faq-a">의도된 동작입니다. 총본사 관리자·Organizer만 들어가며 Google OTP를 다시 확인합니다.</div></div>
        <div class="faq-item"><div class="faq-q">메뉴얼 로고가 안 보입니다.</div><div class="faq-a">플랫폼 브랜딩에서 로고를 업로드했는지 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">로그인 후 브라우저 탭이 Crypto Workflow입니다.</div><div class="faq-a">플랫폼 브랜드 카드의 사이트 이름(또는 브라우저 탭 이름)을 저장하세요. 강력 새로고침 후 확인합니다.</div></div>
        <div class="faq-item"><div class="faq-q">특정 통화로 USDT 매입이 안 됩니다.</div><div class="faq-a">플랫폼 입금 수취 계좌에서 해당 통화의 이체거래·카드결제가 켜져 있는지 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">비밀번호 초기화 후 OTP가 그대로입니다.</div><div class="faq-a">OTP는 별도 「OTP 초기화」입니다. 초기화하면 다음 로그인에서 OTP를 다시 등록합니다.</div></div>
        <div class="faq-item"><div class="faq-q">JPY CURFEX 건인데 고객이 증빙을 올리려 합니다.</div><div class="faq-a">CURFEX ON이면 증빙 업로드가 필요 없습니다. 입금 후 자동으로 관리자 확인으로 넘어갑니다.</div></div>
        <div class="faq-item"><div class="faq-q">CURFEX 입금이 감지되지 않습니다.</div><div class="faq-a">웹훅 URL·HMAC Secret 등록 여부를 확인하세요. 티켓 「입금 상태 확인」 또는 1분 폴링을 기다리세요.</div></div>`,
        `<div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Enable card under Payment management.</div></div>
        <div class="faq-item"><div class="faq-q">Customer cannot apply.</div><div class="faq-a">Open Customers, review documents, grant verification pass. USDT and escrow stay blocked until then.</div></div>
        <div class="faq-item"><div class="faq-q">Verification menu is missing for HQ.</div><div class="faq-a">It is merged into Customers. Only customer accounts upload files under Verification.</div></div>
        <div class="faq-item"><div class="faq-q">Rates missing on diagram.</div><div class="faq-a">Turn on “Show configured fee rates”.</div></div>
        <div class="faq-item"><div class="faq-q">Manual logo missing.</div><div class="faq-a">Upload a logo under Platform branding.</div></div>
        <div class="faq-item"><div class="faq-q">Tab still says Crypto Workflow after login.</div><div class="faq-a">Save site name (or tab title) on the brand card, then hard-refresh.</div></div>
        <div class="faq-item"><div class="faq-q">USDT purchase blocked for a currency.</div><div class="faq-a">Enable transfer and/or card for that currency under Platform deposit accounts.</div></div>
        <div class="faq-item"><div class="faq-q">OTP still works after password reset.</div><div class="faq-a">Use OTP reset separately. The user re-enrolls OTP at next login.</div></div>
        <div class="faq-item"><div class="faq-q">Customer tries proof upload on CURFEX JPY.</div><div class="faq-a">CURFEX ON skips proof — deposit is auto-detected.</div></div>
        <div class="faq-item"><div class="faq-q">CURFEX deposit not detected.</div><div class="faq-a">Check webhook URL and HMAC in CURFEX portal. Use “Check deposit status” on ticket.</div></div>`,
        `<div class="faq-item"><div class="faq-q">カードボタンが灰色です。</div><div class="faq-a">決済管理でカードを有効にしてください。</div></div>
        <div class="faq-item"><div class="faq-q">顧客が申請できません。</div><div class="faq-a">顧客管理で書類を確認し認証パスしてください。</div></div>
        <div class="faq-item"><div class="faq-q">認証センターがありません。</div><div class="faq-a">総本社・組織は顧客管理に統合。書類提出は顧客の認証センターです。</div></div>`,
        `<div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">请在支付管理中启用卡支付。</div></div>
        <div class="faq-item"><div class="faq-q">客户无法申请。</div><div class="faq-a">在客户管理核对文件并给予认证通过。</div></div>
        <div class="faq-item"><div class="faq-q">总部没有认证中心菜单。</div><div class="faq-a">已并入客户管理。上传仅客户认证中心。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ปุ่มบัตรเป็นสีเทา</div><div class="faq-a">เปิดใช้งานบัตรใน Payment</div></div>
        <div class="faq-item"><div class="faq-q">ลูกค้าสมัครไม่ได้</div><div class="faq-a">เปิดจัดการลูกค้า ตรวจเอกสาร แล้วให้ผ่านการยืนยัน</div></div>
        <div class="faq-item"><div class="faq-q">HQ ไม่มีเมนูศูนย์ยืนยัน</div><div class="faq-a">รวมไว้ที่จัดการลูกค้าแล้ว ลูกค้าอัปโหลดที่ศูนย์ยืนยันของตนเอง</div></div>`,
      ),
    },
  ],
};

export const ORG_OPS_MANUAL: ManualDoc = {
  id: 'org-ops',
  coverTitle: L('조직 운영 메뉴얼', 'Organization Ops Manual', '組織運営マニュアル', '组织运营手册', 'คู่มือปฏิบัติการองค์กร'),
  coverSubtitle: L(
    'USDT·에스크로·사용자·고객관리·장부 — 조직 스태프 가이드',
    'USDT, escrow, staff users, customers & ledger — org staff guide',
    'USDT・エスクロー・ユーザー・顧客管理・台帳 — 組織スタッフ向け',
    'USDT、托管、用户、客户管理与台账 — 组织员工指南',
    'USDT เอสโครว์ ผู้ใช้ จัดการลูกค้า และบัญชี — คู่มือพนักงานองค์กร',
  ),
  sections: [
    {
      id: 'o1',
      title: L('접근 범위', 'Access scope', 'アクセス範囲', '访问范围', 'ขอบเขตการเข้าถึง'),
      bodyHtml: L(
        `<p>조직 스태프(<strong>ORG_STAFF</strong>)는 소속 조직 경로 하위 데이터를 조회·처리합니다. <strong>본사정책</strong>은 총본사 전용입니다.</p>
        <ul>
          <li>USDT 매입 / 무역 에스크로 / 수수료 장부</li>
          <li><strong>사용자관리</strong> — 조직 직원만</li>
          <li><strong>고객관리</strong> — 이용 회원, 활성 상태, 인증 상태, 서류 열람</li>
          <li>조직 관리 / 이용메뉴얼</li>
        </ul>
        <div class="info-box">하위 조직(지사·대리점·영업점 등)은 <strong>조직 관리</strong>에서 등록하거나, 사용자 등록 시 「신규 조직 등록」으로 만들 수 있습니다.</div>`,
        `<p>Org staff (<strong>ORG_STAFF</strong>) work within their org path. <strong>HQ Policy</strong> is HQ-only.</p>
        <ul>
          <li>USDT / escrow / ledger</li>
          <li><strong>Users</strong> — org staff accounts only</li>
          <li><strong>Customers</strong> — members, active status, verification status, documents</li>
          <li>Organizations / manuals</li>
        </ul>`,
        `<p>組織スタッフは所属配下データを扱います。本社ポリシーは総本社専用です。</p>
        <ul><li>ユーザー管理は組織スタッフのみ</li><li>顧客管理で会員・認証状態・書類を確認</li></ul>`,
        `<p>组织员工处理下属数据；总部策略仅总部可用。</p>
        <ul><li>用户管理仅组织员工</li><li>客户管理查看会员、认证状态与文件</li></ul>`,
        `<p>พนักงานองค์กรจัดการข้อมูลในเส้นทางองค์กร; HQ Policy สำหรับสำนักงานใหญ่เท่านั้น</p>
        <ul><li>จัดการผู้ใช้ = พนักงานองค์กร</li><li>จัดการลูกค้า = สมาชิก สถานะยืนยัน และเอกสาร</li></ul>`,
      ),
    },
    {
      id: 'org-users-reset',
      title: L('비밀번호·OTP 초기화', 'Password & OTP reset', 'パスワード・OTP初期化', '密码与 OTP 初始化', 'รีเซ็ตรหัสผ่านและ OTP'),
      bodyHtml: L(
        `<span class="menu-path">사용자관리 · 고객관리</span>
        <p>조직 직원은 <strong>사용자관리</strong>, 소속 범위 이용 회원은 <strong>고객관리</strong>에서 동일하게 처리합니다.</p>
        <ul>
          <li><strong>비밀번호 초기화</strong> — 임시 비밀번호는 이메일 아이디 + 1! 입니다. 다음 로그인에서 새 비밀번호를 설정해야 합니다.</li>
          <li><strong>OTP 초기화</strong> — OTP 비밀키를 지웁니다. 다음 로그인에서 OTP를 다시 등록합니다. 비밀번호 초기화와 별개입니다.</li>
        </ul>
        <div class="info-box">권한 범위 안의 조직 직원·고객만 초기화할 수 있습니다. 총본사 정책(통화·브랜드)은 바꿀 수 없습니다.</div>`,
        `<span class="menu-path">Users · Customers</span>
        <p>Org staff under <strong>Users</strong>; in-scope members under <strong>Customers</strong> — same rules.</p>
        <ul>
          <li><strong>Password reset</strong> — temporary password is email ID + 1!. Next login requires a new password.</li>
          <li><strong>OTP reset</strong> — clears the authenticator secret. The user re-enrolls at next login. Separate from password reset.</li>
        </ul>
        <div class="info-box">You can reset only staff and customers within your org scope. HQ policy (currency, brand) cannot be changed.</div>`,
        `<span class="menu-path">ユーザー管理 · 顧客管理</span>
        <p>組織スタッフはユーザー管理、配下の会員は顧客管理で同様に処理します。パスワード初期化はメールID+1!。OTP初期化は次回に再登録。</p>`,
        `<span class="menu-path">用户管理 · 客户管理</span>
        <p>组织员工在用户管理，范围内客户在客户管理，规则相同。密码初始化为邮箱ID+1!；OTP 初始化后下次重新绑定。</p>`,
        `<span class="menu-path">จัดการผู้ใช้ · จัดการลูกค้า</span>
        <p>พนักงานที่จัดการผู้ใช้ ลูกค้าในขอบเขตที่จัดการลูกค้า — กฎเดียวกัน รีเซ็ตรหัสผ่าน = ID อีเมล+1!</p>`,
      ),
    },
    {
      id: 'o2',
      title: L('일일 업무', 'Daily work', '日常業務', '日常工作', 'งานประจำวัน'),
      bodyHtml: L(
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객이 인증센터에 서류를 올렸는지 고객관리에서 확인</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">USDT/에스크로 목록에서 대기 건 확인</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">증빙·상태 검토 후 다음 단계 처리 (CURFEX JPY는 입금 자동감지 — 증빙 불필요)</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">장부에서 수수료 배분 확인</span></div>
        </div>
        <div class="info-box">고객에게는 인증센터 → 지갑 → 시뮬레이터 → 매입 순서를 안내하세요. 인증패스는 총본사만 처리합니다.</div>
        <div class="warn-box">카드 결제·수수료율 변경은 총본사 결제관리·수수료 정책에서만 가능합니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Check Customers for Verification submissions</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Check pending USDT/escrow</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Review proofs and advance status (CURFEX JPY: auto deposit — no proof)</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Verify ledger shares</span></div>
        </div>
        <div class="info-box">Guide customers: Verification → wallet → simulator → purchase. Only HQ grants the pass.</div>`,
        `<div class="warn-box">カード・手数料設定は総本社のみ変更できます。</div>`,
        `<div class="warn-box">卡支付与费率仅总部可改。</div>`,
        `<div class="warn-box">การตั้งค่าบัตร/ค่าธรรมเนียมแก้ได้ที่สำนักงานใหญ่เท่านั้น</div>`,
      ),
    },
    {
      id: 'org-customers',
      title: L('고객관리 · 인증 확인', 'Customers · verification', '顧客管理・認証確認', '客户管理·认证核对', 'จัดการลูกค้า·การยืนยัน'),
      bodyHtml: L(
        `<span class="menu-path">고객관리</span>
        <p>이용 회원은 <strong>고객관리</strong>에서 봅니다. 조직 직원 계정은 <strong>사용자관리</strong>입니다.</p>
        <ul>
          <li>목록에서 활성/비활성과 인증패스·비인증·심사중·반려를 함께 확인합니다.</li>
          <li><strong>수정</strong> · <strong>비밀번호 초기화</strong> · <strong>OTP 초기화</strong> — 소속 범위 고객만(행 더블클릭으로 수정). 시뮬레이터 사용·S RATE도 수정 창에서 바꿀 수 있습니다.</li>
          <li>고객을 열어 업로드 서류를 열람할 수 있습니다.</li>
          <li>총판 이상은 고객 등록(통장·지갑 포함)을 고객관리에서 처리합니다.</li>
        </ul>
        <div class="warn-box">인증패스(승인)는 총본사만 합니다. 조직은 서류 확인 후 총본사에 처리를 요청하세요.</div>
        <div class="info-box">고객이 서류를 올리려면 고객 계정 왼쪽 <strong>인증센터</strong>를 안내하세요. <strong>이용메뉴얼</strong>에서 6개월 거래 예정 보고서·USDT 신청 체크리스트 양식을 내려받을 수 있습니다. 인증패스 전에는 USDT·에스크로 신청이 불가합니다.</div>`,
        `<span class="menu-path">Customers</span>
        <p>Members live under <strong>Customers</strong>. Staff accounts live under <strong>Users</strong>.</p>
        <ul>
          <li>See active/inactive together with verified pass / unverified / under review / rejected.</li>
          <li><strong>Edit</strong> · <strong>Password reset</strong> · <strong>OTP reset</strong> — in-scope customers only (double-click to edit). Simulator and S RATE are in the edit dialog.</li>
          <li>Open a customer to view uploaded documents.</li>
          <li>Master distributor and above can register customers (bank + wallet) on this screen.</li>
        </ul>
        <div class="warn-box">Only HQ can grant verification pass. Org staff review files and ask HQ to process.</div>
        <div class="info-box">Customers upload files in their own <strong>Verification</strong> menu. Download the 6-month forecast and USDT checklist from <strong>Usage manuals</strong>. Without a pass they cannot apply for USDT or escrow.</div>`,
        `<span class="menu-path">顧客管理</span>
        <p>利用会員は<strong>顧客管理</strong>、組織スタッフは<strong>ユーザー管理</strong>です。</p>
        <ul>
          <li>有効/無効と認証パス・未認証・審査中・差戻しを一覧で確認します。</li>
          <li><strong>修正</strong> · <strong>パスワード初期化</strong> · <strong>OTP初期化</strong> — 配下の顧客のみ(ダブルクリックで修正)。シミュレーター・S RATEも修正画面で変更。</li>
          <li>顧客を開き提出書類を閲覧できます。</li>
          <li>総販以上は顧客管理から顧客登録(口座・ウォレット)が可能です。</li>
        </ul>
        <div class="warn-box">認証パスは総本社のみ。組織は書類確認後に総本社へ処理を依頼します。</div>
        <div class="info-box">顧客の書類提出は顧客画面の<strong>認証センター</strong>です。<strong>利用マニュアル</strong>から6か月取引予定報告書・USDT申請チェックリストをダウンロードできます。パス前はUSDT・エスクロー申請不可です。</div>`,
        `<span class="menu-path">客户管理</span>
        <p>终端会员在<strong>客户管理</strong>，组织员工在<strong>用户管理</strong>。</p>
        <ul>
          <li>同时查看启用/停用与认证通过、未认证、审核中、已退回。</li>
          <li><strong>编辑</strong> · <strong>密码初始化</strong> · <strong>OTP 初始化</strong> — 仅范围内客户(双击编辑)。模拟器与 S RATE 可在编辑窗口修改。</li>
          <li>打开客户可查看上传文件。</li>
          <li>总经销及以上可在客户管理登记客户（账户与钱包）。</li>
        </ul>
        <div class="warn-box">认证通过仅总部可做。组织核对文件后请总部处理。</div>
        <div class="info-box">客户在其<strong>认证中心</strong>上传文件。可在<strong>使用手册</strong>下载 6 个月预估报告与 USDT 申请清单。未通过前不可申请 USDT 或托管。</div>`,
        `<span class="menu-path">จัดการลูกค้า</span>
        <p>สมาชิกอยู่ที่ <strong>จัดการลูกค้า</strong> พนักงานองค์กรอยู่ที่ <strong>จัดการผู้ใช้</strong></p>
        <ul>
          <li>ดูใช้งาน/ปิดใช้งาน พร้อมผ่านการยืนยัน ยังไม่ยืนยัน กำลังตรวจสอบ ถูกปฏิเสธ</li>
          <li><strong>แก้ไข</strong> · <strong>รีเซ็ตรหัสผ่าน</strong> · <strong>รีเซ็ต OTP</strong> — เฉพาะลูกค้าในขอบเขต (ดับเบิลคลิกแก้ไข) ตัวจำลองและ S RATE แก้ในหน้าต่างแก้ไข</li>
          <li>เปิดลูกค้าเพื่อดูเอกสารที่อัปโหลด</li>
          <li>ตัวแทนหลักขึ้นไปลงทะเบียนลูกค้าได้ที่นี่ (บัญชี+กระเป๋า)</li>
        </ul>
        <div class="warn-box">ให้ผ่านการยืนยันได้เฉพาะ HQ องค์กรตรวจเอกสารแล้วขอ HQ ดำเนินการ</div>
        <div class="info-box">ลูกค้าอัปโหลดที่ <strong>ศูนย์ยืนยันตัวตน</strong> ของตนเอง ดาวน์โหลดแบบฟอร์มรายงาน 6 เดือนและรายการตรวจสอบ USDT ได้ที่ <strong>คู่มือใช้งาน</strong> ยังไม่ผ่านจะสมัคร USDT/เอสโครว์ไม่ได้</div>`,
      ),
    },
    {
      id: 'org-curfex',
      title: L('CURFEX JPY 입금 처리', 'CURFEX JPY deposit handling', 'CURFEX JPY入金処理', 'CURFEX JPY 入金处理', 'จัดการฝาก JPY CURFEX'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입</span>
        <p>본사가 CURFEX를 켠 JPY 건은 <strong>입금 증빙 검토가 없습니다</strong>. 입금이 감지되면 티켓이 관리자 확인으로 옵니다.</p>
        <ul>
          <li>티켓에 「입금 계좌 (CURFEX 발급)」·CURFEX 참조번호가 표시됩니다.</li>
          <li>고객은 증빙을 올리지 않습니다 — 웹훅/폴링으로 입금 확인.</li>
          <li>운영자는 입금 확인 후 USDT 송금·TXID 등록 (기존과 동일).</li>
          <li>「입금 상태 확인」으로 CURFEX 상태를 수동 동기화할 수 있습니다.</li>
        </ul>
        <div class="warn-box">KRW·THB·CNY 등 전용계좌 건은 기존처럼 증빙을 검토하세요. CURFEX 설정은 총본사만 변경합니다.</div>`,
        `<span class="menu-path">USDT purchase</span>
        <p>When HQ enables CURFEX for JPY, there is <strong>no deposit proof review</strong>. Detected deposits move tickets to admin review.</p>
        <ul>
          <li>Ticket shows CURFEX-issued account and reference.</li>
          <li>Customers do not upload proof — webhook/poll confirms deposit.</li>
          <li>Operator sends USDT and registers TXID as usual.</li>
          <li>Use “Check deposit status” to sync manually if needed.</li>
        </ul>
        <div class="warn-box">Fixed-account tickets (KRW/THB/CNY etc.) still need proof review. Only HQ changes CURFEX settings.</div>`,
        `<span class="menu-path">USDT購入</span>
        <p>CURFEX有効のJPYは<strong>証憑確認なし</strong>。入金検知で管理者確認へ。</p>
        <ul><li>CURFEX発行口座・参照番号を確認</li><li>USDT送金・TXIDは従来どおり</li></ul>`,
        `<span class="menu-path">USDT 采购</span>
        <p>总部开启 CURFEX 的 JPY 单<strong>无需凭证审核</strong>，入金检测后进入管理员确认。</p>
        <ul><li>查看 CURFEX 账户与参考号</li><li>USDT 发送与 TXID 同以往</li></ul>`,
        `<span class="menu-path">USDT</span>
        <p>เมื่อ HQ เปิด CURFEX สำหรับ JPY <strong>ไม่ต้องตรวจสลิป</strong> ระบบยืนยันเงินเข้าอัตโนมัติ</p>
        <ul><li>ดูบัญชี CURFEX และเลขอ้างอิง</li><li>ส่ง USDT และ TXID ตามเดิม</li></ul>`,
      ),
    },
  ],
};

export const CUSTOMER_MANUAL: ManualDoc = {
  id: 'customer',
  coverTitle: L('고객용 사용 메뉴얼', 'Customer User Manual', '顧客向け利用マニュアル', '客户使用手册', 'คู่มือผู้ใช้สำหรับลูกค้า'),
  coverSubtitle: L(
    '회원가입 → 인증센터 → 인증패스 → 지갑 → USDT 시뮬레이터 → 매입·에스크로',
    'Register → Verification → pass → wallet → USDT simulator → purchase & escrow',
    '会員登録→認証センター→認証パス→ウォレット→シミュレーター→購入・エスクロー',
    '注册 → 认证中心 → 认证通过 → 钱包 → 模拟器 → 采购与托管',
    'สมัคร → ศูนย์ยืนยัน → ผ่าน → กระเป๋า → ตัวจำลอง → ซื้อและเอสโครว์',
  ),
  sections: [
    {
      id: 'c1',
      title: L('업무 시작 순서', 'Work start order', '業務開始の順番', '开工顺序', 'ลำดับเริ่มงาน'),
      bodyHtml: L(
        `<p>서비스를 쓰기 전에 아래 순서를 그대로 따르세요. 앞 단계가 끝나지 않으면 다음 단계가 막힐 수 있습니다.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">회원가입 (휴대폰·국가번호) 후 로그인. Google OTP가 있으면 앱 코드를 입력합니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">왼쪽 <strong>인증센터</strong>에서 서류를 올립니다. 양식은 <strong>이용메뉴얼</strong>에서 내려받습니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">상태가 <strong>심사중</strong>이 되면 총본사 인증패스를 기다립니다. 반려이면 사유를 보고 다시 제출합니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>내 지갑</strong>에 USDT 수령 주소(네트워크 포함)를 등록합니다.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>USDT 시뮬레이터</strong>에서 네트워크를 고르고 입금액 또는 받을 USDT로 수수료·수령액을 미리 봅니다. 최근 결과는 최대 3건입니다.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>인증패스 후</strong> USDT 매입 또는 무역 에스크로를 신청합니다.</span></div>
        </div>
        <div class="warn-box">인증패스 전에는 USDT 매입·무역 에스크로 신청이 불가합니다. 시뮬레이터는 <strong>참고용 미리 계산</strong>이며 실제 신청·확정 금액이 아닙니다.</div>
        <div class="info-box">대시보드에는 시뮬레이터 최근 결과가 2건만 보입니다. 언어는 상단에서 바꿉니다. 유휴 시간이 지나면 자동 로그아웃됩니다.</div>`,
        `<p>Follow this order. Later steps stay blocked until earlier ones are done.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Register (phone + country code) and sign in. Enter Google OTP if asked.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Upload documents in <strong>Verification</strong>. Download templates from <strong>Usage manuals</strong>.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">When status is <strong>Under review</strong>, wait for HQ verification pass. If rejected, read the reason and resubmit.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Register a receiving address (with network) under <strong>My wallets</strong>.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">Open <strong>USDT simulator</strong>, choose a network, and preview fees from deposit or target USDT. Up to 3 recent results are kept.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">After a <strong>verification pass</strong>, apply for USDT purchase or trade escrow.</span></div>
        </div>
        <div class="warn-box">USDT purchase and escrow stay blocked until you have a pass. The simulator is a <strong>reference preview only</strong>, not an application or binding amount.</div>
        <div class="info-box">Dashboard shows only 2 recent simulator results. Change language in the top bar. Idle timeout signs you out.</div>`,
        `<p>次の順番どおりに進めてください。前の段階が終わるまで次が止まることがあります。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">会員登録(電話・国番号)→ログイン。Google OTPがあれば入力。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">左の<strong>認証センター</strong>で書類をアップロード。様式は<strong>利用マニュアル</strong>から。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>審査中</strong>なら総本社の認証パスを待つ。差戻しなら理由を見て再提出。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>マイウォレット</strong>に受取アドレス(ネットワーク含む)を登録。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>USDTシミュレーター</strong>でネットワークを選び、入金または受取USDTで手数料を確認。直近最大3件。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>認証パス後</strong>にUSDT購入または貿易エスクローを申請。</span></div>
        </div>
        <div class="warn-box">認証パス前はUSDT購入・エスクロー申請不可。シミュレーターは<strong>参考用の試算</strong>で申請・確定金額ではありません。</div>
        <div class="info-box">ダッシュボードのシミュレーター表示は2件です。言語は上部で切替。アイドルで自動ログアウト。</div>`,
        `<p>请按此顺序操作。前一步未完成时，后一步可能无法进行。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">注册（手机+国家号）并登录。如需 Google OTP 请输入。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">在左侧<strong>认证中心</strong>上传文件。模板从<strong>使用手册</strong>下载。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">状态为<strong>审核中</strong>时等待总部认证通过。退回则按原因重交。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">在<strong>我的钱包</strong>登记收款地址（含网络）。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">打开<strong>USDT 模拟器</strong>，选择网络，按入金或目标 USDT 预览手续费。最多保留 3 条。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>认证通过后</strong>再申请 USDT 采购或贸易托管。</span></div>
        </div>
        <div class="warn-box">未通过认证前无法申请采购或托管。模拟器为<strong>仅供参考的试算</strong>，不是申请或确定金额。</div>
        <div class="info-box">仪表盘模拟器预览只显示 2 条。语言在顶部切换。空闲会自动退出。</div>`,
        `<p>ทำตามลำดับนี้ ขั้นหลังอาจถูกบล็อกจนกว่าขั้นก่อนจะเสร็จ</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">สมัคร (โทรศัพท์+รหัสประเทศ) แล้วเข้าสู่ระบบ ใส่ Google OTP หากมี</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">อัปโหลดเอกสารที่ <strong>ศูนย์ยืนยัน</strong> ดาวน์โหลดแบบฟอร์มจาก <strong>คู่มือใช้งาน</strong></span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">เมื่อสถานะ <strong>กำลังตรวจสอบ</strong> รอ HQ ให้ผ่าน หากถูกปฏิเสธอ่านเหตุผลแล้วส่งใหม่</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ลงทะเบียนที่อยู่รับ USDT (พร้อมเครือข่าย) ที่ <strong>กระเป๋าของฉัน</strong></span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">เปิด <strong>ตัวจำลอง USDT</strong> เลือกเครือข่าย ดูค่าธรรมเนียมจากยอดฝากหรือ USDT ที่จะรับ เก็บได้สูงสุด 3 รายการ</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">หลัง <strong>ผ่านการยืนยัน</strong> ค่อยสมัครซื้อ USDT หรือเอสโครว์</span></div>
        </div>
        <div class="warn-box">ยังไม่ผ่านจะสมัครซื้อ/เอสโครว์ไม่ได้ ตัวจำลองเป็น<strong>การอ้างอิงเท่านั้น</strong> ไม่ใช่การสมัครหรือจำนวนเงินที่ผูกพัน</div>
        <div class="info-box">แดชบอร์ดโชว์ผลจำลอง 2 รายการ เปลี่ยนภาษาด้านบน หากไม่ใช้งานจะออกจากระบบอัตโนมัติ</div>`,
      ),
    },
    {
      id: 'c-kyc',
      title: L('인증센터 · 인증패스', 'Verification · pass', '認証センター・認証パス', '认证中心·认证通过', 'ศูนย์ยืนยัน·ผ่านการยืนยัน'),
      bodyHtml: L(
        `<span class="menu-path">인증센터</span>
        <p>업무 시작 순서의 <strong>2~3단계</strong>입니다. USDT 매입과 무역 에스크로는 <strong>총본사 인증패스 이후</strong>에만 신청할 수 있습니다. 서류는 최초 1회 제출합니다.</p>
        <ul>
          <li><strong>개인</strong> — 6개월 거래 예정 보고서 업로드</li>
          <li><strong>법인</strong> — 보고서 + 등기·실질적지배자·세무 증빙</li>
        </ul>
        <p>화면의 상태</p>
        <ul>
          <li><strong>비인증</strong> — 아직 제출하지 않음. 서류를 올리고 심사를 요청하세요.</li>
          <li><strong>심사중</strong> — 총본사가 서류를 확인하는 중입니다.</li>
          <li><strong>인증패스</strong> — 서비스를 이용할 수 있습니다.</li>
          <li><strong>반려</strong> — 사유를 확인한 뒤 서류를 다시 제출하세요.</li>
        </ul>
        <div class="warn-box">인증패스가 나오기 전에는 USDT 매입·에스크로 신청 화면에서 진행할 수 없습니다.</div>
        <div class="info-box">양식은 왼쪽 <strong>이용메뉴얼</strong>에서 내려받으세요 (6개월 거래 예정 보고서, USDT 신청 체크리스트). 총본사는 고객관리에서 인증패스를 처리합니다.</div>`,
        `<span class="menu-path">Verification</span>
        <p>This is <strong>steps 2–3</strong> of the work start order. USDT purchase and trade escrow are available only after <strong>HQ grants a verification pass</strong>. Submit documents once.</p>
        <ul>
          <li><strong>Individual</strong> — upload the 6-month forecast report</li>
          <li><strong>Corporate</strong> — forecast plus registry / beneficial owner / tax files</li>
        </ul>
        <ul>
          <li><strong>Unverified</strong> — not submitted yet; upload and request review</li>
          <li><strong>Under review</strong> — HQ is checking your files</li>
          <li><strong>Verified pass</strong> — you may use the service</li>
          <li><strong>Rejected</strong> — read the reason and resubmit</li>
        </ul>
        <div class="warn-box">Until you have a pass, USDT and escrow applications stay blocked.</div>
        <div class="info-box">Download templates from <strong>Usage manuals</strong> (6-month forecast, USDT checklist). HQ reviews files in Customer management.</div>`,
        `<span class="menu-path">認証センター</span>
        <p>開始順の<strong>2〜3</strong>です。USDT購入と貿易エスクローは<strong>総本社の認証パス後</strong>のみ申請できます。書類は初回1回です。</p>
        <ul>
          <li><strong>個人</strong> — 6か月取引予定報告書</li>
          <li><strong>法人</strong> — 報告書＋登記・実質的支配者・税務書類</li>
        </ul>
        <ul>
          <li><strong>未認証</strong> — 未提出。アップロードして審査依頼</li>
          <li><strong>審査中</strong> — 総本社が確認中</li>
          <li><strong>認証パス</strong> — サービス利用可</li>
          <li><strong>差戻し</strong> — 理由を確認し再提出</li>
        </ul>
        <div class="warn-box">認証パス前はUSDT・エスクローを申請できません。</div>
        <div class="info-box">様式は左メニュー<strong>利用マニュアル</strong>からダウンロードします（6か月取引予定報告書、USDT申請チェックリスト）。総本社は顧客管理で認証パスを処理します。</div>`,
        `<span class="menu-path">认证中心</span>
        <p>这是开工顺序的<strong>第 2–3 步</strong>。USDT 采购与贸易托管须在<strong>总部认证通过之后</strong>才能申请。文件仅首次提交一次。</p>
        <ul>
          <li><strong>个人</strong> — 上传 6 个月交易预估报告</li>
          <li><strong>法人</strong> — 报告 + 登记 / 实际控制人 / 税务文件</li>
        </ul>
        <ul>
          <li><strong>未认证</strong> — 尚未提交，请上传并申请审核</li>
          <li><strong>审核中</strong> — 总部正在核对</li>
          <li><strong>认证通过</strong> — 可以使用服务</li>
          <li><strong>已退回</strong> — 查看原因后重新提交</li>
        </ul>
        <div class="warn-box">未通过前无法申请 USDT 采购或托管。</div>
        <div class="info-box">请从左侧<strong>使用手册</strong>下载模板（6 个月预估报告、USDT 申请清单）。总部在客户管理中认证。</div>`,
        `<span class="menu-path">ศูนย์ยืนยันตัวตน</span>
        <p>นี่คือขั้น <strong>2–3</strong> ของลำดับเริ่มงาน ซื้อ USDT และเอสโครว์ได้หลัง <strong>HQ ให้ผ่านการยืนยัน</strong> ส่งเอกสารครั้งเดียว</p>
        <ul>
          <li><strong>บุคคล</strong> — อัปโหลดรายงานคาดการณ์ 6 เดือน</li>
          <li><strong>นิติบุคคล</strong> — รายงาน + ทะเบียน / ผู้มีอำนาจควบคุม / ภาษี</li>
        </ul>
        <ul>
          <li><strong>ยังไม่ยืนยัน</strong> — ยังไม่ส่ง อัปโหลดแล้วขอตรวจ</li>
          <li><strong>กำลังตรวจสอบ</strong> — HQ กำลังดูเอกสาร</li>
          <li><strong>ผ่านการยืนยัน</strong> — ใช้บริการได้</li>
          <li><strong>ถูกปฏิเสธ</strong> — อ่านเหตุผลแล้วส่งใหม่</li>
        </ul>
        <div class="warn-box">ยังไม่ผ่านจะสมัคร USDT/เอสโครว์ไม่ได้</div>
        <div class="info-box">ดาวน์โหลดแบบฟอร์มจาก <strong>คู่มือใช้งาน</strong> (รายงาน 6 เดือน, รายการตรวจสอบ USDT) HQ ตรวจไฟล์ที่จัดการลูกค้า</div>`,
      ),
    },
    {
      id: 'c-sim',
      title: L('USDT 시뮬레이터', 'USDT simulator', 'USDTシミュレーター', 'USDT 模拟器', 'ตัวจำลอง USDT'),
      bodyHtml: L(
        `<span class="menu-path">USDT 시뮬레이터</span>
        <p>업무 시작 순서의 <strong>5단계</strong>입니다. 실제 신청 전에 수수료와 수령 USDT를 미리 봅니다.</p>
        <ul>
          <li>왼쪽 메뉴에서 <strong>USDT 시뮬레이터</strong>를 엽니다.</li>
          <li>출금 <strong>네트워크를 먼저 선택</strong>합니다.</li>
          <li><strong>입금액으로 계산</strong> 또는 <strong>받을 USDT로 계산</strong>을 고릅니다.</li>
          <li>금액을 입력하고 계산하면 수령 USDT(빨간색)·총 수수료(초록색)가 표시됩니다.</li>
          <li>최근 결과는 <strong>최대 3건</strong>이 이 화면에 남고, 대시보드에는 <strong>2건</strong>만 보입니다.</li>
        </ul>
        <div class="warn-box"><strong>참고용입니다.</strong> 시뮬레이터 결과는 당시 수수료·환율을 바탕으로 한 <strong>대략적인 참고치</strong>이며, 실제 매입·송금 금액과 <strong>일치하지 않을 수 있습니다</strong>. 계약·입금·수령의 확정 근거로 사용하지 마세요.</div>
        <div class="info-box">시뮬레이터는 시세·수수료 미리보기입니다. 돈을 보내거나 매입 신청이 만들어지지 않습니다.</div>`,
        `<span class="menu-path">USDT simulator</span>
        <p>This is <strong>step 5</strong>. Preview fees and received USDT before you apply.</p>
        <ul>
          <li>Open <strong>USDT simulator</strong> from the left menu.</li>
          <li>Choose a withdrawal <strong>network</strong> first.</li>
          <li>Pick <strong>calculate from deposit</strong> or <strong>from USDT to receive</strong>.</li>
          <li>Enter an amount and run the calculation. Received USDT is shown in red; total fee in green.</li>
          <li>This page keeps up to <strong>3</strong> recent results; the dashboard shows <strong>2</strong>.</li>
        </ul>
        <div class="warn-box"><strong>For reference only.</strong> Results are <strong>approximate previews</strong> based on fees and rates at calculation time. They may <strong>differ from the actual purchase or transfer</strong>. Do not treat them as binding amounts.</div>
        <div class="info-box">The simulator is a preview only. It does not send money or create a purchase.</div>`,
        `<span class="menu-path">USDTシミュレーター</span>
        <p>開始順の<strong>5</strong>です。申請前に手数料と受取USDTを確認します。</p>
        <ul>
          <li>左メニューから<strong>USDTシミュレーター</strong>を開く。</li>
          <li>出金<strong>ネットワークを先に選択</strong>。</li>
          <li>入金額または受取USDTで計算。</li>
          <li>金額入力後、受取USDT(赤)・総手数料(緑)が表示。</li>
          <li>この画面は最大3件、ダッシュボードは2件。</li>
        </ul>
        <div class="warn-box"><strong>参考用です。</strong> 結果は試算時点の手数料・為替に基づく<strong>目安</strong>で、実際の購入・送金と<strong>一致しない場合があります</strong>。確定金額の根拠には使わないでください。</div>
        <div class="info-box">シミュレーターは試算のみで、送金や購入は発生しません。</div>`,
        `<span class="menu-path">USDT 模拟器</span>
        <p>这是开工顺序的<strong>第 5 步</strong>。申请前先看手续费与到账 USDT。</p>
        <ul>
          <li>从左侧菜单打开<strong>USDT 模拟器</strong>。</li>
          <li>先选择提现<strong>网络</strong>。</li>
          <li>选择按<strong>入金额</strong>或<strong>要收到的 USDT</strong>计算。</li>
          <li>输入金额并计算后，到账 USDT 为红色，总手续费为绿色。</li>
          <li>本页最多 3 条，仪表盘只显示 2 条。</li>
        </ul>
        <div class="warn-box"><strong>仅供参考。</strong> 结果为当时手续费与汇率下的<strong>大致参考值</strong>，可能与实际采购/到账<strong>不一致</strong>。请勿作为合同或入账的确定依据。</div>
        <div class="info-box">模拟器仅预览，不会汇款或生成采购单。</div>`,
        `<span class="menu-path">ตัวจำลอง USDT</span>
        <p>ขั้น <strong>5</strong> ของลำดับเริ่มงาน ดูค่าธรรมเนียมและ USDT ที่จะได้รับก่อนสมัครจริง</p>
        <ul>
          <li>เปิด<strong>ตัวจำลอง USDT</strong>จากเมนูซ้าย</li>
          <li>เลือก<strong>เครือข่าย</strong>ถอนก่อน</li>
          <li>คำนวณจากยอดฝาก หรือจาก USDT ที่ต้องการรับ</li>
          <li>ใส่จำนวนแล้วคำนวณ USDT ที่ได้รับเป็นสีแดง ค่าธรรมเนียมรวมสีเขียว</li>
          <li>หน้านี้เก็บได้สูงสุด 3 รายการ แดชบอร์ดโชว์ 2</li>
        </ul>
        <div class="warn-box"><strong>ใช้เป็นข้อมูลอ้างอิงเท่านั้น</strong> ผลลัพธ์เป็น<strong>ค่าประมาณ</strong>ตามค่าธรรมเนียมและอัตรา ณ ขณะคำนวณ อาจ<strong>ไม่ตรงกับการซื้อ/โอนจริง</strong> อย่าใช้เป็นจำนวนเงินที่ผูกพัน</div>
        <div class="info-box">ตัวจำลองเป็นการทดลองคำนวณ ไม่โอนเงินและไม่สร้างคำขอซื้อ</div>`,
      ),
    },
    {
      id: 'c2',
      title: L('USDT 매입', 'USDT purchase', 'USDT購入', 'USDT 采购', 'ซื้อ USDT'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입 → + 신규신청</span>
        <p>업무 시작 순서의 <strong>6단계</strong>입니다. 인증패스와 지갑 등록이 끝난 뒤에 신청합니다. 희망 수령 USDT 또는 입금 금액을 입력하면 수수료·비용 도식이 표시됩니다.</p>
        <ul>
          <li><strong>계좌 이체</strong> — 안내 계좌로 입금. 통화·방식은 본사 설정에 따름</li>
          <li><strong>카드 결제</strong> — 카드 정보·환불 불가 동의 후 즉시 결제</li>
        </ul>
        <p class="mt-2"><strong>JPY 이체 — 두 가지 방식</strong></p>
        <table><thead><tr><th>방식</th><th>고객 행동</th></tr></thead><tbody>
        <tr><td>고정 수취계좌</td><td>플랫폼 전용 계좌로 입금 → 2시간 내 <strong>입금 증빙</strong> 업로드</td></tr>
        <tr><td>CURFEX (본사 ON)</td><td>티켓에 표시된 <strong>건별 계좌</strong>로만 입금 → <strong>증빙 업로드 없음</strong>. 입금 확인 후 자동으로 다음 단계</td></tr>
        </tbody></table>
        <div class="info-box">CURFEX 계좌는 「입금 계좌 (CURFEX 발급)」으로 표시됩니다. 다른 거래 계좌와 섞어 입금하지 마세요.</div>
        <div class="block-box">카드 결제는 완료 후 카드 취소·환불이 불가합니다. 동의 없이는 진행할 수 없습니다.</div>`,
        `<span class="menu-path">USDT → + New application</span>
        <p><strong>Step 6.</strong> Apply after verification pass and wallet setup.</p>
        <ul>
          <li><strong>Bank transfer</strong> — deposit to the shown account</li>
          <li><strong>Card</strong> — pay after non-refundable waiver</li>
        </ul>
        <p><strong>JPY transfer — two modes</strong></p>
        <table><thead><tr><th>Mode</th><th>What you do</th></tr></thead><tbody>
        <tr><td>Fixed HQ account</td><td>Deposit to fixed account → upload <strong>deposit proof</strong> within 2 hours</td></tr>
        <tr><td>CURFEX (HQ ON)</td><td>Deposit only to the <strong>per-ticket account</strong> → <strong>no proof upload</strong>. System auto-confirms deposit</td></tr>
        </tbody></table>
        <div class="info-box">CURFEX accounts are labeled “Deposit account (CURFEX issued)”. Do not mix with other tickets.</div>
        <div class="block-box">Card payments are non-refundable after charge.</div>`,
        `<span class="menu-path">USDT → +新規申請</span>
        <p><strong>6</strong>段階目。認証パスとウォレット登録後に申請。</p>
        <table><thead><tr><th>方式</th><th>操作</th></tr></thead><tbody>
        <tr><td>固定口座</td><td>入金→2時間以内に<strong>証憑アップロード</strong></td></tr>
        <tr><td>CURFEX</td><td>取引専用口座へ入金→<strong>証憑不要</strong>・自動確認</td></tr>
        </tbody></table>
        <div class="block-box">カード決済後の返金はできません。</div>`,
        `<span class="menu-path">USDT → +新申请</span>
        <p>第 <strong>6</strong> 步。认证通过并登记钱包后申请。</p>
        <table><thead><tr><th>方式</th><th>操作</th></tr></thead><tbody>
        <tr><td>固定账户</td><td>入金 → 2 小时内<strong>上传凭证</strong></td></tr>
        <tr><td>CURFEX</td><td>向本单专用账户入金 → <strong>无需凭证</strong>，系统自动确认</td></tr>
        </tbody></table>
        <div class="block-box">卡支付完成后不可退款。</div>`,
        `<span class="menu-path">USDT → +สมัครใหม่</span>
        <p>ขั้น <strong>6</strong> หลังผ่านการยืนยันและลงทะเบียนกระเป๋า</p>
        <table><thead><tr><th>แบบ</th><th>การทำ</th></tr></thead><tbody>
        <tr><td>บัญชีคงที่</td><td>ฝาก → อัปโหลด<strong>หลักฐาน</strong>ภายใน 2 ชม.</td></tr>
        <tr><td>CURFEX</td><td>ฝากบัญชีรายตั๋ว → <strong>ไม่ต้องอัปโหลดสลิป</strong> ระบบยืนยันอัตโนมัติ</td></tr>
        </tbody></table>
        <div class="block-box">ชำระบัตรแล้วคืนเงินไม่ได้</div>`,
      ),
    },
    {
      id: 'c-curfex',
      title: L('JPY CURFEX 입금 (자동 확인)', 'JPY CURFEX deposit (auto)', 'JPY CURFEX入金（自動確認）', 'JPY CURFEX 入金（自动确认）', 'ฝาก JPY CURFEX (อัตโนมัติ)'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입 → 티켓 상세</span>
        <p>본사가 CURFEX를 켠 경우, JPY 계좌이체 신청 시 <strong>이 거래 전용 일본 수취 계좌</strong>가 발급됩니다.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">신청 시 <strong>신청서·자금 원천 증빙</strong>만 업로드 (입금 영수증 칸 없음)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">「입금 계좌 (CURFEX 발급)」·참조번호 확인 후 해당 계좌로만 JPY 입금</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">입금 영수증 업로드 <strong>하지 않음</strong> — 실운영은 웹훅 자동 확인 / 샌드박스는 「입금 시뮬레이션」</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">상태가 <strong>심사중(관리자 확인)</strong>이 되면 USDT 송금을 기다림</span></div>
        </div>
        <div class="info-box">화면에 「입금 대기 (자동 감지)」가 보이면 CURFEX 모드입니다. 관리자 화면에서도 동일 티켓이 「심사중」으로 바뀌면 입금 완료로 처리된 것입니다.</div>
        <div class="warn-box">KRW·THB·CNY 등 다른 통화, 또는 CURFEX가 꺼진 경우에는 기존처럼 전용 계좌 + 입금 영수증 업로드가 필요합니다.</div>`,
        `<span class="menu-path">USDT purchase → ticket detail</span>
        <p>When HQ enables CURFEX, JPY bank transfer gets a <strong>per-ticket Japan receiving account</strong>.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">At apply: upload <strong>application / source-of-funds only</strong> (no deposit receipt field)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Note CURFEX account &amp; reference — transfer JPY only there</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Do <strong>not</strong> upload deposit receipt — live uses webhook; sandbox uses “Simulate deposit”</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">When status becomes <strong>Admin reviewing</strong>, wait for USDT</span></div>
        </div>
        <div class="info-box">“Awaiting deposit (auto-detect)” = CURFEX mode. Admins see the same ticket move to Admin reviewing when deposit is confirmed.</div>
        <div class="warn-box">Other currencies or when CURFEX is off: fixed account + deposit receipt as before.</div>`,
        `<span class="menu-path">USDT購入 → 詳細</span>
        <p>CURFEX有効時、JPY振込は<strong>取引専用口座</strong>が発行されます。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">申請→「入金口座（CURFEX発行）」を確認</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">表示口座へJPY入金</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">証憑アップロード<strong>不要</strong></span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">管理者確認後USDT送金を待つ</span></div>
        </div>`,
        `<span class="menu-path">USDT 采购 → 详情</span>
        <p>总部开启 CURFEX 时，JPY 转账会开立<strong>本单专用账户</strong>。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">申请后查看 CURFEX 账户</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">向该账户入金</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>无需</strong>上传凭证</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">等待 USDT 发送</span></div>
        </div>`,
        `<span class="menu-path">USDT → รายละเอียด</span>
        <p>เมื่อ HQ เปิด CURFEX โอน JPY จะได้<strong>บัญชีรายตั๋ว</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">สมัครแล้วดูบัญชี CURFEX</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">โอน JPY เข้าบัญชีนั้น</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>ไม่ต้อง</strong>อัปโหลดสลิป</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">รอ USDT หลังขั้นตรวจของผู้ดูแล</span></div>
        </div>`,
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
        <div class="faq-item"><div class="faq-q">USDT·에스크로를 신청할 수 없습니다.</div><div class="faq-a">인증센터에서 서류를 제출하고 총본사 인증패스를 기다리세요. 반려이면 사유를 보고 다시 올리세요.</div></div>
        <div class="faq-item"><div class="faq-q">시뮬레이터에 결과가 안 남습니다.</div><div class="faq-a">네트워크를 선택하고 금액을 입력하세요. 이 화면은 최근 3건, 대시보드는 2건입니다.</div></div>
        <div class="faq-item"><div class="faq-q">시뮬레이터와 실제 매입 금액이 다릅니다.</div><div class="faq-a">시뮬레이터는 참고용입니다. 환율·수수료 변동으로 실제 신청·입금 시점과 다를 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">예상 USDT와 실제가 다릅니다.</div><div class="faq-a">환율·가스비 변동으로 범위 내 차이가 날 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">원하는 통화가 목록에 없습니다.</div><div class="faq-a">본사가 해당 통화의 이체 또는 카드결제를 끈 상태입니다. 운영자에게 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">JPY인데 증빙 업로드 칸이 없습니다.</div><div class="faq-a">CURFEX가 켜져 있으면 정상입니다. 안내 계좌로 입금만 하면 시스템이 자동 확인합니다.</div></div>
        <div class="faq-item"><div class="faq-q">입금했는데 상태가 안 바뀝니다.</div><div class="faq-a">CURFEX 건은 「입금 상태 확인」을 누르거나 잠시 기다리세요. 전용계좌는 증빙을 업로드해야 합니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Card pay is disabled; use bank transfer or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Cannot apply for USDT or escrow.</div><div class="faq-a">Submit files in Verification and wait for HQ verification pass. If rejected, resubmit after reading the reason.</div></div>
        <div class="faq-item"><div class="faq-q">Simulator results disappear.</div><div class="faq-a">Select a network and enter an amount. The page keeps 3 runs; the dashboard shows 2.</div></div>
        <div class="faq-item"><div class="faq-q">Simulator differs from my purchase.</div><div class="faq-a">The simulator is reference only. Rates and fees may change before you apply or deposit.</div></div>
        <div class="faq-item"><div class="faq-q">Received USDT differs.</div><div class="faq-a">Rate/gas variance may apply within the shown range.</div></div>
        <div class="faq-item"><div class="faq-q">My currency is missing.</div><div class="faq-a">HQ disabled transfer or card for that currency. Contact support.</div></div>
        <div class="faq-item"><div class="faq-q">No proof upload for JPY.</div><div class="faq-a">Normal when CURFEX is on — deposit to the shown account only.</div></div>
        <div class="faq-item"><div class="faq-q">Deposited but status unchanged.</div><div class="faq-a">CURFEX: tap “Check deposit status” or wait. Fixed account: upload proof.</div></div>`,
        `<div class="faq-item"><div class="faq-q">カードが灰色です。</div><div class="faq-a">カード決済が無効です。振込を利用してください。</div></div>
        <div class="faq-item"><div class="faq-q">USDT・エスクローを申請できません。</div><div class="faq-a">認証センターで提出し、総本社の認証パスを待ってください。</div></div>`,
        `<div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">卡支付未启用，请用转账或联系客服。</div></div>
        <div class="faq-item"><div class="faq-q">无法申请 USDT 或托管。</div><div class="faq-a">请在认证中心提交文件并等待总部认证通过。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ปุ่มบัตรเทา</div><div class="faq-a">บัตรปิดอยู่ ใช้โอนหรือติดต่อผู้ดูแล</div></div>
        <div class="faq-item"><div class="faq-q">สมัคร USDT/เอสโครว์ไม่ได้</div><div class="faq-a">ส่งเอกสารที่ศูนย์ยืนยันแล้วรอ HQ ให้ผ่านการยืนยัน</div></div>`,
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
