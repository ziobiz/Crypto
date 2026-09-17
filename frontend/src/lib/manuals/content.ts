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
        <tr><td>운영관리</td><td>좌측 펼침: 고객관리 · 수수료관리 · 조직관리 · 사용자관리 · 기록관리</td></tr>
        <tr><td>본사정책</td><td>좌측에서 한 번 누르면 펼침·다시 누르면 접힘. 하위: 접근·조직항목·수수료·플랫폼·운영·삭제·시뮬레이터·분석·메뉴얼</td></tr>
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
        <tr><td>Operations</td><td>Left expand: Customers · Fee management · Organizations · Users · Records</td></tr>
        <tr><td>HQ Policy</td><td>Click once in the left nav to expand, again to collapse. Children: access, columns, fees, platform, ops, deletion, simulators, analysis, manuals</td></tr>
        <tr><td>USDT simulator</td><td>Preview deposit / receive USDT, network, fees (under HQ Policy)</td></tr>
        <tr><td>Record simulator</td><td>Usage analysis on top, customer run list below</td></tr>
        <tr><td>Trade analysis</td><td>Manual broker deposit & received USDT; auto rate; reverse fee</td></tr>
        <tr><td>Profit analysis</td><td>Compare expected USDT vs broker USDT per purchase ticket</td></tr>
        <tr><td>Manuals</td><td>This document & org/customer guides</td></tr>
        </tbody></table>
        <div class="info-box">Org staff and customers cannot open HQ Policy. Ask HQ when needed. Create orgs under <strong>Organizations</strong> (or “Register new org” on user create).</div>`,
        `<p>総本社(<strong>SUPER_ADMIN</strong>)は左メニュー全項目と<strong>本社ポリシー</strong>にアクセスできます。</p>
        <table><thead><tr><th>メニュー</th><th>説明</th></tr></thead><tbody>
        <tr><td>ダッシュボード</td><td>相場・要約・クイック申請</td></tr>
        <tr><td>USDT購入</td><td>購入チケット照会・承認・送金</td></tr>
        <tr><td>貿易エスクロー</td><td>エスクロー契約・状態管理</td></tr>
        <tr><td>手数料台帳</td><td>組織手数料の精算履歴</td></tr>
        <tr><td>ユーザー管理</td><td>組織スタッフ(総本社・組織)のみ。加盟店代表・運営者は顧客管理のマルチユーザーと加盟店「ユーザー管理」</td></tr>
        <tr><td>顧客管理</td><td>利用会員・有効状態・認証パス/未認証・書類確認</td></tr>
        <tr><td>組織管理</td><td>本社・総販・支店・代理店・営業店の作成</td></tr>
        <tr><td>本社ポリシー</td><td>左メニューで1回押すと展開・再クリックで折りたたみ。下位: アクセス・組織項目・手数料・プラットフォーム・運営・削除・シミュレーター・分析・マニュアル</td></tr>
        <tr><td>USDTシミュレーター</td><td>入金額/受取USDT・ネットワーク・手数料の試算(本社ポリシー下)</td></tr>
        <tr><td>記録シミュレーター</td><td>顧客シミュレーター利用分析(上)と一覧(下)</td></tr>
        <tr><td>取引分析</td><td>仲介入金・受取USDT手入力、為替自動、手数料逆算</td></tr>
        <tr><td>収益分析</td><td>購入件の予想USDTと仲介USDTの比較</td></tr>
        <tr><td>利用マニュアル</td><td>本ドキュメントおよび組織・顧客マニュアル</td></tr>
        </tbody></table>
        <div class="info-box">組織は<strong>組織管理</strong>で作成します。ユーザー登録の「新規組織登録」でも作れます。組織スタッフ・顧客は本社ポリシーに入れません。</div>`,
        `<p>总部（<strong>SUPER_ADMIN</strong>）可访问全部左侧菜单与<strong>总部策略</strong>。</p>
        <table><thead><tr><th>菜单</th><th>说明</th></tr></thead><tbody>
        <tr><td>仪表盘</td><td>行情、摘要、快捷申请</td></tr>
        <tr><td>USDT 采购</td><td>采购单查询、审批、汇款</td></tr>
        <tr><td>贸易托管</td><td>托管合同与状态管理</td></tr>
        <tr><td>手续费台账</td><td>组织手续费结算明细</td></tr>
        <tr><td>用户管理</td><td>仅组织员工（总部·组织）。加盟商代表/操作员在客户管理的多用户与加盟商「用户管理」</td></tr>
        <tr><td>客户管理</td><td>终端会员、启用状态、认证通过/未认证、文件核对</td></tr>
        <tr><td>组织管理</td><td>创建总部、总经销、分公司、代理、营业点</td></tr>
        <tr><td>总部策略</td><td>左侧点一次展开、再点收起。子项：访问、组织字段、手续费、平台、运营、删除、模拟器、分析、手册</td></tr>
        <tr><td>USDT 模拟器</td><td>入金/到账 USDT、网络、手续费预览（在总部策略下）</td></tr>
        <tr><td>记录模拟器</td><td>客户模拟器使用分析（上）与列表（下）</td></tr>
        <tr><td>交易分析</td><td>手工录入中介入金与到账 USDT，自动汇率，反算手续费</td></tr>
        <tr><td>收益分析</td><td>比较采购单预计 USDT 与中介 USDT</td></tr>
        <tr><td>使用手册</td><td>本文档及组织·客户手册</td></tr>
        </tbody></table>
        <div class="info-box">组织在<strong>组织管理</strong>中创建，也可在用户注册时「新组织登记」。组织员工与客户无法打开总部策略。</div>`,
        `<p>สำนักงานใหญ่ (<strong>SUPER_ADMIN</strong>) เข้าเมนูซ้ายทั้งหมดและ <strong>HQ Policy</strong> ได้</p>
        <table><thead><tr><th>เมนู</th><th>คำอธิบาย</th></tr></thead><tbody>
        <tr><td>แดชบอร์ด</td><td>เรท สรุป การสมัครด่วน</td></tr>
        <tr><td>ซื้อ USDT</td><td>ดูตั๋ว อนุมัติ โอน</td></tr>
        <tr><td>เอสโครว์การค้า</td><td>สัญญาเอสโครว์และสถานะ</td></tr>
        <tr><td>บัญชีค่าธรรมเนียม</td><td>ประวัติเคลียร์ค่าคอมองค์กร</td></tr>
        <tr><td>จัดการผู้ใช้</td><td>เฉพาะพนักงานองค์กร (HQ·องค์กร) แอดมิน/ผู้ปฏิบัติงานร้านอยู่ที่จัดการลูกค้า (หลายผู้ใช้) และเมนูจัดการผู้ใช้ของร้าน</td></tr>
        <tr><td>จัดการลูกค้า</td><td>สมาชิกผู้ใช้ สถานะใช้งาน ผ่านการยืนยัน/ยังไม่ยืนยัน และเอกสาร</td></tr>
        <tr><td>จัดการองค์กร</td><td>สร้าง HQ ตัวแทนหลัก สาขา เอเย่นต์ สำนักงานขาย</td></tr>
        <tr><td>HQ Policy</td><td>คลิกครั้งหนึ่งในเมนูซ้ายเพื่อขยาย คลิกอีกครั้งเพื่อพับ เมนูย่อย: สิทธิ์ คอลัมน์ ค่าธรรมเนียม แพลตฟอร์ม ปฏิบัติการ การลบ ตัวจำลอง วิเคราะห์ คู่มือ</td></tr>
        <tr><td>ตัวจำลอง USDT</td><td>คำนวณยอดฝาก/USDT ที่รับ เครือข่าย ค่าธรรมเนียม (ใต้ HQ Policy)</td></tr>
        <tr><td>ตัวจำลองบันทึก</td><td>วิเคราะห์การใช้งาน (บน) และรายการ (ล่าง)</td></tr>
        <tr><td>วิเคราะห์ธุรกรรม</td><td>กรอกยอดตัวกลางและ USDT ที่รับเอง เรทอัตโนมัติ ค่าธรรมเนียมย้อนกลับ</td></tr>
        <tr><td>วิเคราะห์กำไร</td><td>เทียบ USDT ที่คาดกับ USDT ตัวกลางต่อตั๋ว</td></tr>
        <tr><td>คู่มือใช้งาน</td><td>เอกสารนี้และคู่มือองค์กร/ลูกค้า</td></tr>
        </tbody></table>
        <div class="info-box">สร้างองค์กรที่ <strong>จัดการองค์กร</strong> หรือตอนลงทะเบียนผู้ใช้ 「ลงทะเบียนองค์กรใหม่」 พนักงานองค์กรและลูกค้าเข้า HQ Policy ไม่ได้</div>`
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
          <li>목록에 <strong>S RATE</strong>(청록=LIVE / 주황=SAND), <strong>시뮬레이터</strong>(활성/비활성), <strong>멀티</strong>(활성/비활성), <strong>수수료</strong>(활성/비활성) 열이 있습니다. 수수료는 멀티와 인증 사이이며, 상세의 수수료 노출과 같습니다.</li>
          <li><strong>수정</strong> — 이름·휴대폰·모집 영업점·시뮬레이터 사용·S RATE·활성 상태·(선택) 새 비밀번호. 행을 더블클릭해도 수정 창이 열립니다.</li>
          <li><strong>비밀번호 초기화</strong> · <strong>OTP 초기화</strong> — 사용자관리와 동일 규칙(아래 「비밀번호·OTP 초기화」).</li>
          <li><strong>고객 상세 카드</strong> — USDT 시뮬레이터(LIVE/SAND·활성/비활성), 멀티 사용자(활성/비활성), <strong>수수료 노출</strong>(활성/비활성)을 카드별로 저장합니다.</li>
          <li><strong>멀티 사용자 허용</strong> — 상세에서 활성으로 켜야 가맹점 대표가 운영자(최대 2명)를 만들 수 있습니다. 비활성이면 기존 운영자는 중지되고 로그인할 수 없습니다. 개인·법인 동일합니다. 가맹점 메뉴 이름은 <strong>사용자관리</strong>입니다(본사 사용자관리와 다른 화면).</li>
          <li><strong>수수료 노출</strong> — 비활성(기본)이면 가맹점 「내 지갑」 수수료에 숫자가 없고 <strong>본사설정에따름</strong>만 보입니다. 활성이면 가스·플랫폼 수수료가 표시됩니다.</li>
          <li><strong>청구방식</strong> — 본사설정따름 / 통합 / 항목별 / 하이브리드. USDT 상세 「수수료 내역」과 신청 도식이 이 값을 따릅니다.</li>
          <li><strong>입금계좌 방식</strong> — 본사설정따름 / 고정 수취계좌 / 가상계좌. 고객 선택이 본사 기본보다 우선합니다. 가상계좌는 결제관리에서 VA가 켜진 통화만 발급되며, 고객 화면에는 CURFEX 명칭을 쓰지 않습니다.</li>
          <li><strong>추가 지갑 승인</strong> — 본사가 등록한 기본 지갑은 가맹점이 주소를 바꿀 수 없습니다. 가맹점이 추가한 지갑은 고객 상세에서 승인해야 매입·에스크로에 쓸 수 있습니다.</li>
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
          <li>The list shows <strong>S RATE</strong> (teal = LIVE / orange = SAND), <strong>simulator</strong> (Active/Inactive), <strong>Multi</strong> (Active/Inactive), and <strong>Fees</strong> (Active/Inactive) between Multi and Verification. Fees matches the detail Fee display card.</li>
          <li><strong>Edit</strong> — name, phone, recruiting office, simulator, S RATE, active status, optional new password. Double-click a row to open edit.</li>
          <li><strong>Password reset</strong> · <strong>OTP reset</strong> — same rules as Users (see “Password & OTP reset” below).</li>
          <li><strong>Customer detail cards</strong> — save USDT simulator (LIVE/SAND and Active/Inactive), multi-user (Active/Inactive), and <strong>Fee display</strong> (Active/Inactive) separately.</li>
          <li><strong>Allow multi-user</strong> — set Active on the detail card so the merchant admin can add operators (max 2). Inactive deactivates existing operators. Same for individual and corporate. The merchant menu is named <strong>Users</strong> (not the HQ Users screen).</li>
          <li><strong>Fee display</strong> — Inactive (default): merchant My wallets shows <strong>Follow HQ settings</strong> instead of fee amounts. Active: gas and platform fees are shown.</li>
          <li><strong>Billing method</strong> — Follow HQ / integrated / itemized / hybrid. USDT detail fee section and apply diagram follow this value.</li>
          <li><strong>Deposit account mode</strong> — Follow HQ / fixed receiving account / virtual account. Customer choice overrides the HQ default. VA issues only when the currency is enabled in Payment; customer UI never shows the vendor name.</li>
          <li><strong>Extra wallet approval</strong> — HQ-registered default wallets cannot have their address changed by the merchant. Extra wallets added by the merchant stay pending until HQ approves them on the customer detail page.</li>
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
          <li>一覧に<strong>S RATE</strong>(ティール=LIVE / オレンジ=SAND)、<strong>シミュレーター</strong>(有効/無効)、<strong>マルチ</strong>(有効/無効)、<strong>手数料</strong>(有効/無効)があります。手数料はマルチと認証の間で、詳細の手数料表示と同じです。</li>
          <li><strong>修正</strong> — 名前・電話・募集営業店・シミュレーター・S RATE・有効状態・(任意)新パスワード。行ダブルクリックでも開きます。</li>
          <li><strong>パスワード初期化</strong> · <strong>OTP初期化</strong> — ユーザー管理と同じ(下記参照)。</li>
          <li><strong>顧客詳細カード</strong> — USDTシミュレーター(LIVE/SAND・有効/無効)、マルチユーザー(有効/無効)、<strong>手数料表示</strong>(有効/無効)をカードごとに保存します。</li>
          <li><strong>マルチユーザー許可</strong> — 詳細で有効にすると加盟店代表が運営者(最大2名)を作れます。無効にすると既存運営者は停止されログイン不可。個人・法人とも同じ。加盟店メニュー名は<strong>ユーザー管理</strong>(総本社のユーザー管理とは別)。</li>
          <li><strong>手数料表示</strong> — 無効(既定)なら加盟店「マイウォレット」手数料は数字なしで<strong>本社設定に従う</strong>のみ。有効ならガス・プラットフォーム手数料を表示。</li>
          <li><strong>請求方式</strong> — 本社設定に従う / 統合 / 項目別 / ハイブリッド。USDT詳細の手数料内訳と申請図がこの値に従います。</li>
          <li><strong>入金口座方式</strong> — 本社設定に従う / 固定受取口座 / バーチャル口座。顧客選択が本社既定より優先。バーチャルは決済管理でVAが有効な通貨のみ。顧客画面にベンダー名は出しません。</li>
          <li><strong>追加ウォレット承認</strong> — 本社登録の既定ウォレットは加盟店がアドレス変更不可。加盟店が追加したウォレットは顧客詳細で承認後に使用。</li>
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
          <li>列表含<strong>S RATE</strong>(青绿=LIVE / 橙=SAND)、<strong>模拟器</strong>(启用/停用)、<strong>多用户</strong>(启用/停用)、<strong>手续费</strong>(启用/停用，位于多用户与认证之间，与详情手续费显示相同)。</li>
          <li><strong>编辑</strong> — 姓名、手机、招募营业点、模拟器、S RATE、启用状态、(可选)新密码。双击行可打开编辑。</li>
          <li><strong>密码初始化</strong> · <strong>OTP 初始化</strong> — 与用户管理相同(见下文)。</li>
          <li><strong>客户详情卡片</strong> — 分别保存 USDT 模拟器(LIVE/SAND 与启用/停用)、多用户(启用/停用)、<strong>手续费显示</strong>(启用/停用)。</li>
          <li><strong>允许多用户</strong> — 详情中设为启用后，加盟商代表才能添加操作员(最多 2 名)。停用后现有操作员无法登录。个人与法人相同。加盟商菜单名为<strong>用户管理</strong>（与总部用户管理不同）。</li>
          <li><strong>手续费显示</strong> — 停用(默认)时，商户「我的钱包」手续费不显示数字，只显示<strong>遵循总部设置</strong>。启用后显示 Gas 与平台手续费。</li>
          <li><strong>计费方式</strong> — 跟随总部 / 合并 / 分项 / 混合。USDT 详情手续费与申请图示遵循此值。</li>
          <li><strong>入金账户方式</strong> — 跟随总部 / 固定收款账户 / 虚拟账户。客户选择优先于总部默认。虚拟账户仅在支付管理已开启该币种时签发；客户界面不展示供应商名称。</li>
          <li><strong>额外钱包批准</strong> — 总部登记的默认钱包加盟商不能改地址。加盟商添加的钱包须在客户详情批准后才能使用。</li>
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
          <li>รายการมี <strong>S RATE</strong> (เขียวน้ำทะเล=LIVE / ส้ม=SAND), <strong>ตัวจำลอง</strong> (เปิด/ปิด), <strong>หลายผู้ใช้</strong> (เปิด/ปิด) และ <strong>ค่าธรรมเนียม</strong> (เปิด/ปิด อยู่ระหว่างหลายผู้ใช้กับการยืนยัน ตามการ์ดแสดงค่าธรรมเนียม)</li>
          <li><strong>แก้ไข</strong> — ชื่อ โทรศัพท์ สำนักงานรับสมัคร ตัวจำลอง S RATE สถานะใช้งาน (ไม่บังคับ) รหัสใหม่ ดับเบิลคลิกแถวเพื่อแก้ไข</li>
          <li><strong>รีเซ็ตรหัสผ่าน</strong> · <strong>รีเซ็ต OTP</strong> — กฎเดียวกับจัดการผู้ใช้ (ดูด้านล่าง)</li>
          <li><strong>การ์ดหน้ารายละเอียดลูกค้า</strong> — บันทึกตัวจำลอง USDT (LIVE/SAND และเปิด/ปิด), หลายผู้ใช้ (เปิด/ปิด) และ<strong>แสดงค่าธรรมเนียม</strong> (เปิด/ปิด) คนละการ์ด</li>
          <li><strong>อนุญาตหลายผู้ใช้</strong> — เปิดในหน้ารายละเอียด ตัวแทนร้านจึงเพิ่มผู้ปฏิบัติงานได้สูงสุด 2 คน ถ้าปิด ผู้ปฏิบัติงานเดิมหยุดและเข้าสู่ระบบไม่ได้ บุคคลและนิติบุคคลเหมือนกัน เมนูร้านชื่อ<strong>จัดการผู้ใช้</strong> (ไม่ใช่หน้า Users ของ HQ)</li>
          <li><strong>แสดงค่าธรรมเนียม</strong> — ถ้าปิด (ค่าเริ่ม) กระเป๋าของฉันจะไม่โชว์ตัวเลข แสดงแค่<strong>ตามการตั้งค่า HQ</strong> ถ้าเปิดจะโชว์แก๊สและค่าธรรมเนียมแพลตฟอร์ม</li>
          <li><strong>วิธีเรียกเก็บ</strong> — ตาม HQ / รวม / แยกรายการ / ไฮบริด รายละเอียดค่าธรรมเนียม USDT และแผนภาพคำขอใช้ค่านี้</li>
          <li><strong>โหมดบัญชีฝาก</strong> — ตาม HQ / บัญชีรับคงที่ / บัญชีเสมือน ตัวเลือกลูกค้ามีผลเหนือค่าเริ่มต้น HQ บัญชีเสมือนออกได้เมื่อเปิดสกุลเงินในหน้า Payment; หน้าลูกค้าไม่โชว์ชื่อผู้ให้บริการ</li>
          <li><strong>อนุมัติกระเป๋าเพิ่ม</strong> — กระเป๋าเริ่มต้นที่ HQ ลงทะเบียน ร้านค้าแก้ที่อยู่ไม่ได้ กระเป๋าที่ร้านเพิ่มต้องอนุมัติในหน้ารายละเอียดลูกค้าก่อนใช้</li>
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
        <p>좌측 메뉴에서 <strong>본사정책</strong>을 한 번 누르면 하위 메뉴가 펼쳐지고, 다시 누르면 접힙니다. 고객관리·조직관리 등 다른 메뉴로 이동해도 펼친 상태는 유지됩니다(브라우저에 기억). 상단 가로 탭은 없으며 좌측에서만 이동합니다.</p>
        <ul>
          <li><strong>접근·권한</strong> — 조직 단계별 메뉴 권한, 사용자 OTP·비밀번호</li>
          <li><strong>조직항목</strong> — 화면 컬럼·표시 순서</li>
          <li><strong>수수료·리스크</strong> — 시볼 수수료 구간, 한도, 조직 요율, 수수료율 노출</li>
          <li><strong>플랫폼 도메인·SSL</strong> — 브랜드(사이트 이름·브라우저 탭)·입금 수취 계좌(통화별 이체/카드)·도메인·이메일·SSL. 이메일·OTP 숫자 표에 <strong>민감작업 OTP 유지시간(분)</strong>(기본 10분, 1~60). 가맹점 사용자관리·내 지갑 등 민감작업에 적용됩니다. 6자리를 모두 넣고 맞으면 확인 버튼을 누르지 않아도 진행됩니다.</li>
          <li><strong>운영관리</strong> — 변경이력, 업데이트 내용/이력, 결제관리</li>
          <li><strong>삭제관리</strong> — 삭제 정책·처리</li>
          <li><strong>USDT 시뮬레이터 / 기록 시뮬레이터</strong> — 본사정책 하위. 기록은 사용 분석이 목록 위</li>
          <li><strong>거래분석 / 수익분석</strong> — 총본사 관리자·Organizer만. 진입 시 Google OTP 6자리. 맞으면 확인 버튼을 누르지 않아도 진행됩니다. 유지시간은 플랫폼 「민감작업 OTP 유지시간」(기본 10분). Organizer는 지정 admin만 부여</li>
          <li><strong>이용메뉴얼</strong> — 본 문서</li>
        </ul>
        <div class="warn-box">설정 저장 시 자동 업데이트 이력이 기록될 수 있습니다. 주요 변경은 V3.0처럼 정수 버전, 소소한 변경은 2.1·2.2·2.4처럼 소수로 관리합니다.</div>`,
        `<span class="menu-path">HQ Policy</span>
        <p>In the left nav, click <strong>HQ Policy</strong> once to expand children, click again to collapse. Moving to Customers, Organizations, etc. keeps the expanded state (remembered in the browser). There is no top tab bar — navigate from the left only.</p>
        <ul>
          <li><strong>Access</strong> — org menu permissions, OTP/password</li>
          <li><strong>Org columns</strong> — grid columns & order</li>
          <li><strong>Fees & risk</strong> — symbol tiers, limits, org rates, rate visibility</li>
          <li><strong>Platform</strong> — brand (site name, browser tab), deposit accounts (transfer/card per currency), domain, email, SSL. Email/OTP numeric table includes <strong>Sensitive action OTP duration (minutes)</strong> (default 10, range 1–60) for merchant Users, wallets, and similar. Six correct digits proceed without tapping Verify.</li>
          <li><strong>Ops</strong> — change log, release notes/history, payment</li>
          <li><strong>Deletion</strong> — deletion policy and processing</li>
          <li><strong>USDT simulator / Record simulator</strong> — under HQ Policy. Analysis sits above the log list</li>
          <li><strong>Trade analysis / Profit analysis</strong> — HQ admin and Organizer only. Enter Google OTP 6 digits on entry; correct codes proceed without Verify. Duration is Platform Sensitive action OTP (default 10 min). Only the designated HQ admin can assign Organizer</li>
          <li><strong>Manuals</strong> — this document</li>
        </ul>
        <div class="warn-box">Saves may auto-record release history. Major = 3.0; minor = 2.1, 2.2, 2.4.</div>`,
        `<span class="menu-path">本社ポリシー</span>
        <p>左メニューの<strong>本社ポリシー</strong>を一度押すと下位が開き、もう一度押すと閉じます。顧客管理・組織管理など他メニューへ移っても開いた状態は維持されます（ブラウザに記憶）。上部の横タブはなく、左側からのみ移動します。</p>
        <ul>
          <li><strong>アクセス・権限</strong> — 組織段階別メニュー権限、ユーザーOTP・パスワード</li>
          <li><strong>組織項目</strong> — 画面カラム・表示順</li>
          <li><strong>手数料・リスク</strong> — シンボル手数料段階、限度、組織料率、料率表示</li>
          <li><strong>プラットフォーム ドメイン・SSL</strong> — ブランド(サイト名・タブ)・入金受取口座(通貨別振込/カード)・ドメイン・メール・SSL。メール・OTP数値表に<strong>機密操作OTP維持時間（分）</strong>(既定10分、1〜60)。加盟店ユーザー管理・マイウォレット等に適用。6桁が正しければ確認ボタンなしで進みます。</li>
          <li><strong>運営管理</strong> — 変更履歴、更新内容/履歴、決済管理</li>
          <li><strong>削除管理</strong> — 削除方針・処理</li>
          <li><strong>USDTシミュレーター / 記録シミュレーター</strong> — 本社ポリシー下。記録は利用分析が一覧の上</li>
          <li><strong>取引分析 / 収益分析</strong> — 総本社管理者・Organizerのみ。入場時Google OTP 6桁。正しければ確認ボタンなし。維持時間はプラットフォーム機密操作OTP（既定10分）。Organizerは指定adminのみ付与</li>
          <li><strong>利用マニュアル</strong> — 本文書</li>
        </ul>
        <div class="warn-box">設定保存時に自動更新履歴が残ることがあります。主要変更は整数版(例:V3.0)、軽微は小数(2.1, 2.2, 2.4)で管理します。</div>`,
        `<span class="menu-path">总部策略</span>
        <p>左侧菜单中点击<strong>总部政策</strong>一次展开子项，再点一次收起。切换到客户管理、组织管理等其他菜单时仍保持展开（浏览器记忆）。无顶部横标签，仅从左侧进入。</p>
        <ul>
          <li><strong>访问·权限</strong> — 按组织层级的菜单权限、用户 OTP·密码</li>
          <li><strong>组织字段</strong> — 界面列与显示顺序</li>
          <li><strong>手续费·风险</strong> — 交易对手续费档位、限额、组织费率、费率显示</li>
          <li><strong>平台域名·SSL</strong> — 品牌（站点名·浏览器标签）、入金收款账户（按币种转账/卡）、域名、邮箱、SSL。邮箱·OTP 数字表含<strong>敏感操作 OTP 保持时间（分钟）</strong>（默认 10，1–60），用于加盟商用户管理、我的钱包等。输入正确 6 位后无需点确认即可继续。</li>
          <li><strong>运营管理</strong> — 变更历史、更新内容/历史、支付管理</li>
          <li><strong>删除管理</strong> — 删除策略与处理</li>
          <li><strong>USDT 模拟器 / 记录模拟器</strong> — 在总部政策下；记录页分析在列表上方</li>
          <li><strong>交易分析 / 收益分析</strong> — 仅总部管理员与 Organizer。进入时输入 Google OTP 6 位，正确则无需点确认。保持时间见平台敏感操作 OTP（默认 10 分钟）。仅指定管理员可授予 Organizer</li>
          <li><strong>使用手册</strong> — 本文档</li>
        </ul>
        <div class="warn-box">保存设置时可能自动写入更新历史。主要变更为整数版本（如 V3.0），小改为小数（2.1、2.2、2.4）。</div>`,
        `<span class="menu-path">HQ Policy</span>
        <p>ในเมนูซ้าย คลิก <strong>นโยบาย HQ</strong> ครั้งหนึ่งเพื่อขยาย คลิกอีกครั้งเพื่อพับ ไปเมนูอื่นเช่น จัดการลูกค้า·องค์กรแล้วยังคงขยายอยู่ (จำในเบราว์เซอร์) ไม่มีแท็บด้านบน — ใช้เมนูซ้ายเท่านั้น</p>
        <ul>
          <li><strong>สิทธิ์การเข้าถึง</strong> — สิทธิ์เมนูตามระดับองค์กร OTP/รหัสผ่านผู้ใช้</li>
          <li><strong>คอลัมน์องค์กร</strong> — คอลัมน์หน้าจอและลำดับแสดง</li>
          <li><strong>ค่าธรรมเนียม·ความเสี่ยง</strong> — ชั้นค่าธรรมเนียมสัญลักษณ์ วงเงิน อัตราองค์กร การแสดงอัตรา</li>
          <li><strong>แพลตฟอร์ม โดเมน·SSL</strong> — แบรนด์ (ชื่อไซต์·แท็บ) บัญชีรับเงิน (โอน/บัตรตามสกุล) โดเมน อีเมล SSL ตารางตัวเลขอีเมล/OTP มี<strong>ระยะเวลา OTP งานสำคัญ (นาที)</strong> (ค่าเริ่ม 10, 1–60) สำหรับจัดการผู้ใช้และกระเป๋าของร้าน กรอก 6 หลักถูกต้องแล้วไม่ต้องกดยืนยัน</li>
          <li><strong>ปฏิบัติการ</strong> — ประวัติการเปลี่ยนแปลง บันทึกอัปเดต การชำระเงิน</li>
          <li><strong>การลบ</strong> — นโยบายและการจัดการลบ</li>
          <li><strong>ตัวจำลอง USDT / ตัวจำลองบันทึก</strong> — ใต้ HQ Policy วิเคราะห์อยู่บนรายการ</li>
          <li><strong>วิเคราะห์ธุรกรรม / วิเคราะห์กำไร</strong> — เฉพาะผู้ดูแล HQ และ Organizer กรอก Google OTP 6 หลักตอนเข้า ถูกละไม่ต้องกดยืนยัน ระยะเวลาตามแพลตฟอร์ม OTP งานสำคัญ (ค่าเริ่ม 10 นาที) มอบ Organizer ได้เฉพาะแอดมินที่กำหนด</li>
          <li><strong>คู่มือ</strong> — เอกสารนี้</li>
        </ul>
        <div class="warn-box">เมื่อบันทึกอาจมีประวัติอัปเดตอัตโนมัติ การเปลี่ยนหลักเป็นจำนวนเต็ม (เช่น V3.0) การเปลี่ยนย่อยเป็นทศนิยม (2.1, 2.2, 2.4)</div>`
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
          <li><strong>サイト名</strong> — ログイン画面とログイン後メニューに表示されます。</li>
          <li><strong>ブラウザタブ名</strong> — 空欄ならサイト名をタブに使います。入力すればログイン前後すべてのページのタブにその値が表示されます。</li>
        </ul>
        <div class="info-box">ログイン後だけ「Crypto Workflow」に戻っていた問題を、サイト名(またはタブ名)で統一しました。編集後にブランド設定を保存してください。</div>`,
        `<span class="menu-path">总部策略 → 平台 → 品牌卡片</span>
        <ul>
          <li><strong>站点名称</strong> — 显示在登录页与登录后菜单。</li>
          <li><strong>浏览器标签名称</strong> — 留空则用站点名称；填写后登录前后所有页面标签均显示该名称。</li>
        </ul>
        <div class="info-box">已修复登录后标签回退为 Crypto Workflow 的问题，统一为站点名（或标签名）。编辑后请保存品牌设置。</div>`,
        `<span class="menu-path">HQ Policy → แพลตฟอร์ม → การ์ดแบรนด์</span>
        <ul>
          <li><strong>ชื่อไซต์</strong> — แสดงที่หน้าเข้าสู่ระบบและเมนูหลังเข้าสู่ระบบ</li>
          <li><strong>ชื่อแท็บเบราว์เซอร์</strong> — ว่างแล้วใช้ชื่อไซต์ ใส่แล้วแสดงทุกหน้าก่อน/หลังเข้าสู่ระบบ</li>
        </ul>
        <div class="info-box">แก้ปัญหาที่หลังเข้าสู่ระบบแท็บกลับเป็น Crypto Workflow ให้ใช้ชื่อไซต์ (หรือชื่อแท็บ) เดียวกัน หลังแก้ให้บันทึกการตั้งค่าแบรนด์</div>`
      ),
    },
    {
      id: 'hq-og-preview',
      title: L(
        'URL 링크 미리보기',
        'URL link preview',
        'URLリンクプレビュー',
        'URL 链接预览',
        'พรีวิวลิงก์ URL',
      ),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 플랫폼 → 브랜드 카드</span>
        <ul>
          <li>로그인 창은 고객·관리자 공통 하나이므로, LINE·WhatsApp 미리보기도 <strong>하나</strong>입니다.</li>
          <li><strong>제목</strong> — 사이트 이름</li>
          <li><strong>설명</strong> — 배경 브랜드 문구 (같은 칸을 그대로 사용)</li>
          <li><strong>이미지</strong> — 링크 미리보기 이미지(없으면 첫화면 로고)</li>
          <li>크롤러는 JS를 실행하지 않으므로 서버가 첫 HTML 머리에 위 값을 넣습니다. 본문을 긁지 않습니다.</li>
        </ul>
        <div class="info-box">브랜드 설정 저장 후 LINE은 캐시 때문에 재수집이 필요할 수 있습니다.</div>`,
        `<span class="menu-path">HQ Policy → Platform → Brand card</span>
        <ul>
          <li>There is one shared login for customers and admins, so there is also <strong>one</strong> LINE/WhatsApp preview.</li>
          <li><strong>Title</strong> — site name</li>
          <li><strong>Description</strong> — background brand text (same field)</li>
          <li><strong>Image</strong> — link preview image (falls back to landing logo)</li>
          <li>Crawlers do not run JavaScript. The server puts these values in the first HTML head and never scrapes the page body.</li>
        </ul>
        <div class="info-box">After saving brand settings, LINE may need a cache refresh.</div>`,
        `<span class="menu-path">本社ポリシー → プラットフォーム → ブランドカード</span>
        <ul>
          <li>ログイン画面は顧客・管理者共通のため、LINE・WhatsApp プレビューも<strong>1つ</strong>です。</li>
          <li><strong>タイトル</strong> — サイト名</li>
          <li><strong>説明</strong> — 背景ブランド文言（同じ欄）</li>
          <li><strong>画像</strong> — リンクプレビュー画像（未設定ならトップ画面ロゴ）</li>
          <li>クローラーはJSを実行しません。サーバーが最初のHTMLのheadに設定値を入れ、本文は取得しません。</li>
        </ul>
        <div class="info-box">ブランド保存後、LINEはキャッシュ再取得が必要な場合があります。</div>`,
        `<span class="menu-path">总部策略 → 平台 → 品牌卡片</span>
        <ul>
          <li>登录页客户与管理员共用，因此 LINE/WhatsApp 预览也只有<strong>一套</strong>。</li>
          <li><strong>标题</strong> — 站点名称</li>
          <li><strong>说明</strong> — 背景品牌文案（同一栏）</li>
          <li><strong>图片</strong> — 链接预览图（未设置则用首页 Logo）</li>
          <li>爬虫不运行 JavaScript。服务器把上述值写入首份 HTML 的 head，不抓取正文。</li>
        </ul>
        <div class="info-box">保存品牌后，LINE 可能需要重新抓取缓存。</div>`,
        `<span class="menu-path">HQ Policy → แพลตฟอร์ม → การ์ดแบรนด์</span>
        <ul>
          <li>หน้าเข้าสู่ระบบใช้ร่วมกัน ลูกค้าและผู้ดูแล จึงมีพรีวิว LINE/WhatsApp เพียง<strong>ชุดเดียว</strong></li>
          <li><strong>หัวข้อ</strong> — ชื่อไซต์</li>
          <li><strong>คำอธิบาย</strong> — ข้อความแบรนด์พื้นหลัง (ช่องเดียวกัน)</li>
          <li><strong>รูป</strong> — รูปพรีวิวลิงก์ (ถ้าไม่มีใช้โลโก้หน้าแรก)</li>
          <li>ครอว์เลอร์ไม่รัน JS เซิร์ฟเวอร์ใส่ค่าใน head ของ HTML แรก ไม่ดึงจากเนื้อหาหน้า</li>
        </ul>
        <div class="info-box">หลังบันทึกแบรนด์ LINE อาจต้องเก็บแคชใหม่</div>`
      ),
    },
    {
      id: 'hq-fiat',
      title: L('통화별 이체·카드·고정 수취계좌', 'Per-currency transfer, card & fixed accounts', '通貨別 振込・カード・固定受取口座', '按币种转账·卡·固定收款账户', 'โอน/บัตร/บัญชีคงที่ตามสกุล'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 플랫폼 → 고객 입금 수취 계좌 (통화별)</span>
        <p>KRW·JPY·THB·CNY마다 <strong>고정 수취 계좌</strong>를 등록하고, <strong>이체거래</strong>·<strong>카드결제</strong>를 따로 켭니다. CURFEX가 꺼진 통화(또는 미적용 통화)에서 고객에게 이 계좌가 안내됩니다.</p>
        <table><thead><tr><th>항목</th><th>설명</th></tr></thead><tbody>
        <tr><td>은행명·은행 주소</td><td>예: MUFG Bank, Ltd. / Marunouchi…</td></tr>
        <tr><td>은행 코드 · 지점 코드</td><td>예: 0005 · 869</td></tr>
        <tr><td>계좌 유형 · 계좌 번호</td><td>예: Savings / Futsu · 4685448</td></tr>
        <tr><td>수취인명(예금주)</td><td><strong>半角カタカナ 원문</strong> 그대로 저장 (언어와 무관하게 고객 화면에 동일 표기)</td></tr>
        <tr><td>고객 화면 중요 안내</td><td>KR/US/JP/CH/TH 언어별 문구. 비우면 기본 번역 사용</td></tr>
        </tbody></table>
        <ul>
          <li>이체를 끄면 그 통화로 <strong>계좌 이체 USDT 매입</strong> 불가.</li>
          <li>카드를 끄면 그 통화로 <strong>카드 USDT 매입</strong> 불가 (운영관리 카드 전체 ON과 별개).</li>
          <li>JPY Payoneer(MUFG)는 「기본값 채우기」로 일괄 입력 후 <strong>브랜드 설정 저장</strong>.</li>
        </ul>
        <div class="warn-box"><strong>입금 주의 (고객·운영 공통)</strong><br/>
        금액을 정상 수령하려면 수취인명을 <strong>표시된 그대로 정확히 복사</strong>해야 합니다 (半角カタカナ). 임의 변경 시 입금 실패·지연 가능.
        UI 언어를 바꿔도 <strong>수취인명만은 일본어 원문</strong>으로 남습니다. 안내 문구만 해당 언어로 바뀝니다.</div>
        <div class="check-box">위치는 운영관리가 아니라 <strong>플랫폼</strong>입니다. CURFEX는 운영관리 → 결제관리에서 별도 설정.</div>`,
        `<span class="menu-path">HQ Policy → Platform → Customer deposit accounts</span>
        <p>For KRW, JPY, THB, CNY register the <strong>fixed receiving account</strong> and toggle <strong>bank transfer</strong> / <strong>card</strong> separately. Shown when CURFEX is off (or not applied) for that currency.</p>
        <table><thead><tr><th>Field</th><th>Notes</th></tr></thead><tbody>
        <tr><td>Bank name · address</td><td>e.g. MUFG Bank, Ltd. / Marunouchi…</td></tr>
        <tr><td>Bank code · branch code</td><td>e.g. 0005 · 869</td></tr>
        <tr><td>Account type · number</td><td>e.g. Savings / Futsu · 4685448</td></tr>
        <tr><td>Beneficiary</td><td>Store <strong>half-width katakana exactly</strong>; always shown as-is regardless of UI language</td></tr>
        <tr><td>Customer notice</td><td>Per KR/US/JP/CH/TH. Blank → built-in translation</td></tr>
        </tbody></table>
        <ul>
          <li>Transfer off → no bank-transfer USDT purchase in that currency.</li>
          <li>Card off → no card USDT purchase in that currency (independent of Ops → Payment global card switch).</li>
          <li>Use “Fill JPY Payoneer (MUFG) defaults”, then <strong>Save brand settings</strong>.</li>
        </ul>
        <div class="warn-box"><strong>Deposit precautions</strong><br/>
        To receive funds correctly, customers must <strong>copy the beneficiary name exactly</strong> (half-width katakana). Changing it may fail or delay the deposit.
        Switching UI language translates the notice only — the <strong>beneficiary name stays Japanese</strong>.</div>
        <div class="check-box">Configured under <strong>Platform</strong>, not Ops. CURFEX is separate under Ops → Payment.</div>`,
        `<span class="menu-path">本社ポリシー → プラットフォーム → 顧客入金受取口座（通貨別）</span>
        <p>KRW・JPY・THB・CNYごとに<strong>固定受取口座</strong>を登録し、<strong>振込</strong>・<strong>カード</strong>を個別にON/OFFします。CURFEXがOFF（または未適用）の通貨で顧客に案内されます。</p>
        <table><thead><tr><th>項目</th><th>説明</th></tr></thead><tbody>
        <tr><td>銀行名・住所</td><td>例: MUFG Bank, Ltd. / Marunouchi…</td></tr>
        <tr><td>銀行コード・支店コード</td><td>例: 0005 · 869</td></tr>
        <tr><td>口座種別・口座番号</td><td>例: Savings / Futsu · 4685448</td></tr>
        <tr><td>受取人名</td><td><strong>半角カタカナ原文</strong>のまま保存（UI言語に関係なく同一表示）</td></tr>
        <tr><td>顧客向け重要案内</td><td>KR/US/JP/CH/TH別。空欄なら標準翻訳</td></tr>
        </tbody></table>
        <ul>
          <li>振込OFF → その通貨の<strong>口座振込USDT購入</strong>不可。</li>
          <li>カードOFF → その通貨の<strong>カードUSDT購入</strong>不可（運営管理の全体カードONとは別）。</li>
          <li>JPY Payoneer(MUFG)は「デフォルト入力」後に<strong>ブランド設定を保存</strong>。</li>
        </ul>
        <div class="warn-box"><strong>入金時の注意</strong><br/>
        正常着金には受取人名を<strong>表示どおり正確にコピー</strong>してください（半角カタカナ）。変更すると失敗・遅延の原因になります。
        UI言語を変えても<strong>受取人名だけは日本語原文</strong>のままです。案内文だけが翻訳されます。</div>
        <div class="check-box">場所は運営管理ではなく<strong>プラットフォーム</strong>です。CURFEXは運営管理→決済管理で別設定。</div>`,
        `<span class="menu-path">总部策略 → 平台 → 客户入金收款账户（按币种）</span>
        <p>为 KRW·JPY·THB·CNY 登记<strong>固定收款账户</strong>，并单独开关<strong>转账</strong>·<strong>卡支付</strong>。当 CURFEX 关闭（或未适用）时向客户展示。</p>
        <table><thead><tr><th>项目</th><th>说明</th></tr></thead><tbody>
        <tr><td>银行名·地址</td><td>如 MUFG Bank, Ltd. / Marunouchi…</td></tr>
        <tr><td>银行代码·分行代码</td><td>如 0005 · 869</td></tr>
        <tr><td>账户类型·账号</td><td>如 Savings / Futsu · 4685448</td></tr>
        <tr><td>收款人</td><td>保存<strong>半角片假名原文</strong>；无论界面语言如何均原样显示</td></tr>
        <tr><td>客户重要提示</td><td>按 KR/US/JP/CH/TH；留空则用内置翻译</td></tr>
        </tbody></table>
        <ul>
          <li>关闭转账 → 无法用该币种做<strong>银行转账 USDT 采购</strong>。</li>
          <li>关闭卡 → 无法用该币种做<strong>卡付 USDT 采购</strong>（与运营管理全局卡开关无关）。</li>
          <li>JPY Payoneer(MUFG) 可用「一键填充」后<strong>保存品牌设置</strong>。</li>
        </ul>
        <div class="warn-box"><strong>入金注意</strong><br/>
        为确保正常入账，须<strong>精确复制收款人姓名</strong>（半角片假名）。擅自修改可能导致失败或延迟。
        切换界面语言时，仅提示文翻译；<strong>收款人姓名始终保持日语原文</strong>。</div>
        <div class="check-box">位置在<strong>平台</strong>，不在运营管理。CURFEX 在运营管理→支付管理单独设置。</div>`,
        `<span class="menu-path">HQ Policy → แพลตฟอร์ม → บัญชีรับเงินลูกค้า (ตามสกุล)</span>
        <p>ลงทะเบียน<strong>บัญชีรับคงที่</strong>สำหรับ KRW·JPY·THB·CNY และเปิด/ปิด <strong>โอน</strong>·<strong>บัตร</strong> แยกกัน แสดงเมื่อ CURFEX ปิด (หรือไม่ใช้) ในสกุลนั้น</p>
        <table><thead><tr><th>รายการ</th><th>คำอธิบาย</th></tr></thead><tbody>
        <tr><td>ชื่อธนาคาร·ที่อยู่</td><td>เช่น MUFG Bank, Ltd. / Marunouchi…</td></tr>
        <tr><td>รหัสธนาคาร·สาขา</td><td>เช่น 0005 · 869</td></tr>
        <tr><td>ประเภท·เลขบัญชี</td><td>เช่น Savings / Futsu · 4685448</td></tr>
        <tr><td>ชื่อผู้รับ</td><td>เก็บ<strong>คาตาคานะครึ่งความกว้างตามต้นฉบับ</strong> แสดงเหมือนกันทุกภาษา UI</td></tr>
        <tr><td>ข้อความสำคัญ</td><td>แยก KR/US/JP/CH/TH ว่างแล้วใช้คำแปลเริ่มต้น</td></tr>
        </tbody></table>
        <ul>
          <li>ปิดโอน → ซื้อ USDT ด้วยโอนในสกุลนั้นไม่ได้</li>
          <li>ปิดบัตร → ซื้อ USDT ด้วยบัตรในสกุลนั้นไม่ได้ (แยกจากสวิตช์บัตรรวม)</li>
          <li>JPY Payoneer(MUFG) กดเติมค่าเริ่มต้นแล้ว<strong>บันทึกการตั้งค่าแบรนด์</strong></li>
        </ul>
        <div class="warn-box"><strong>ข้อควรระวังตอนฝาก</strong><br/>
        เพื่อรับเงินได้ถูกต้อง ต้อง<strong>คัดลอกชื่อผู้รับให้ตรง</strong> (คาตาคานะครึ่งความกว้าง) แก้เองอาจโอนไม่สำเร็จหรือล่าช้า
        เปลี่ยนภาษา UI จะแปลเฉพาะข้อความเตือน — <strong>ชื่อผู้รับคงเป็นต้นฉบับญี่ปุ่น</strong></div>
        <div class="check-box">ตั้งที่<strong>แพลตฟอร์ม</strong> ไม่ใช่ Ops CURFEX อยู่ที่ Ops → Payment แยกต่างหาก</div>`
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
        <p>組織スタッフアカウントは<strong>ユーザー管理</strong>、利用会員(顧客)は<strong>顧客管理</strong>で同様に処理します。</p>
        <ul>
          <li><strong>パスワード初期化</strong> — 仮パスワードは<strong>メールの@より前のID + 1!</strong>です（例: name@mail.com → name1!）。画面に仮パスワードが表示されます。次回ログインではダッシュボードの前に<strong>新しいパスワード設定</strong>が必要です。初期規則(ID+1!)は新パスワードに使えません。</li>
          <li><strong>OTP初期化</strong> — 登録済みGoogle OTP秘密鍵を削除します。パスワード初期化とは別です。本社ポリシーでOTPがONなら、次回ログインで<strong>OTPを最初から再登録</strong>します。</li>
        </ul>
        <div class="warn-box">パスワード初期化の確認文にOTP解除と書いてあっても、OTPを消すにはOTP初期化を別途押す必要があります。</div>`,
        `<span class="menu-path">用户管理 · 客户管理</span>
        <p>组织员工账号在<strong>用户管理</strong>，终端会员（客户）在<strong>客户管理</strong>，规则相同。</p>
        <ul>
          <li><strong>密码初始化</strong> — 临时密码为<strong>邮箱 @ 前的 ID + 1!</strong>（例：name@mail.com → name1!）。界面会显示临时密码。下次登录须在进入仪表盘前<strong>设置新密码</strong>。初始规则密码（ID+1!）不能用作新密码。</li>
          <li><strong>OTP 初始化</strong> — 清除已注册的 Google OTP 密钥，与密码初始化无关。若总部策略开启 OTP，下次登录须<strong>重新绑定 OTP</strong>。</li>
        </ul>
        <div class="warn-box">即使密码初始化确认文提到 OTP，要关闭 OTP 仍须单独点击 OTP 初始化。</div>`,
        `<span class="menu-path">จัดการผู้ใช้ · จัดการลูกค้า</span>
        <p>บัญชีพนักงานองค์กรที่ <strong>จัดการผู้ใช้</strong> สมาชิกผู้ใช้ (ลูกค้า) ที่ <strong>จัดการลูกค้า</strong> — กฎเดียวกัน</p>
        <ul>
          <li><strong>รีเซ็ตรหัสผ่าน</strong> — รหัสชั่วคราวคือ <strong>ส่วนก่อน @ ของอีเมล + 1!</strong> (เช่น name@mail.com → name1!) หน้าจอจะแสดงรหัสชั่วคราว เข้าสู่ระบบครั้งถัดไปต้อง<strong>ตั้งรหัสใหม่</strong>ก่อนแดชบอร์ด ใช้รูปแบบเริ่มต้น (ID+1!) เป็นรหัสใหม่ไม่ได้</li>
          <li><strong>รีเซ็ต OTP</strong> — ลบรหัสลับ Google OTP ที่ลงทะเบียน แยกจากรีเซ็ตรหัสผ่าน หาก HQ Policy เปิด OTP ครั้งถัดไปต้อง<strong>ลงทะเบียน OTP ใหม่ตั้งแต่ต้น</strong></li>
        </ul>
        <div class="warn-box">แม้ข้อความยืนยันรีเซ็ตรหัสผ่านจะพูดถึง OTP การปิด OTP ต้องกดรีเซ็ต OTP แยกต่างหาก</div>`
      ),
    },
    {
      id: 's3',
      title: L('수수료 정책 (% / 고정)', 'Fee policy (% / fixed)', '手数料ポリシー', '手续费政策', 'นโยบายค่าธรรมเนียม'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 수수료·리스크 → 시볼(티켓) 수수료</span>
        <p>FX·가스피·송금·기타 수수료마다 <strong>%</strong> 또는 <strong>고정(USDT)</strong>을 선택합니다. 선택한 방식만 계산·도식에 반영됩니다.</p>
        <div class="check-box"><strong>세팅된 수수료율 노출</strong> — <strong>LIVE</strong>와 <strong>Sandbox</strong>를 각각 사용/미사용·본사 기본 청구방식을 설정합니다. 사용 시 해당 환경 도식에 수수료율 열이 표시됩니다.</div>
        <p>통화·금액 구간별로 행을 편집한 뒤 저장하십시오.</p>
        <p class="mt-2"><strong>시뮬레이터 Sandbox 수수료</strong> (<span class="menu-path">본사정책 → 수수료·리스크 → 시뮬레이터용 수수료</span>, Sandbox 탭)</p>
        <ul>
          <li><strong>LIVE</strong> 구간·가스는 실거래(시볼) 수수료와 동일합니다.</li>
          <li><strong>Sandbox</strong>는 LIVE에 <strong>추가 기본 수수료</strong>(FX %, 가스/송금/기타 USDT)만 더합니다. 구간 표는 LIVE 미러(읽기 전용), 화면에는 <strong>합계 (LIVE)</strong>로 표시됩니다.</li>
          <li>「Sandbox 추가 수수료 0으로 초기화」로 Sandbox 가산만 0으로 되돌립니다.</li>
          <li>「LIVE 기본 수수료 적용」으로 본사 LIVE 기본 수수료·구간·가스피를 다시 읽고 Sandbox 추가 수수료에 LIVE 기본값을 채웁니다. 가맹점·본사 SAND 테스트용입니다.</li>
          <li>네트워크별 가스피도 「Sandbox 가스 추가분 0」/「LIVE 기본 가스피 적용」이 같습니다. 적용 후 반드시 저장하세요.</li>
        </ul>`,
        `<span class="menu-path">HQ Policy → Fees → Symbol fees</span>
        <p>Each of FX, gas, transfer, other can be <strong>%</strong> or <strong>fixed USDT</strong>. Only the selected mode applies.</p>
        <div class="check-box"><strong>Show fee rates</strong> — Configure <strong>LIVE</strong> and <strong>Sandbox</strong> separately (on/off and HQ default billing). On shows the rate column for that environment.</div>
        <p>Edit rows by currency and amount tier, then save.</p>
        <p class="mt-2"><strong>Simulator Sandbox fees</strong> (<span class="menu-path">HQ Policy → Fees → Simulator fees</span>, Sandbox tab)</p>
        <ul>
          <li><strong>LIVE</strong> tiers and gas match live (symbol) fees.</li>
          <li><strong>Sandbox</strong> adds only <strong>basic fees</strong> (FX %, gas/transfer/other USDT) on top of LIVE. The tier table mirrors LIVE (read-only); the UI shows <strong>combined (LIVE)</strong>.</li>
          <li>“Reset Sandbox add-ons to 0” clears only the Sandbox add-on.</li>
          <li>“Apply LIVE default fees” reloads HQ LIVE defaults/tiers/gas and fills Sandbox add-ons with LIVE basics for merchant/HQ SAND testing.</li>
          <li>Per-network gas has the same “reset gas add-on to 0” / “Apply LIVE default gas”. Always save after applying.</li>
        </ul>`,
        `<span class="menu-path">本社ポリシー → 手数料・リスク → シンボル(チケット)手数料</span>
        <p>FX・ガス・送金・その他ごとに<strong>%</strong>または<strong>固定(USDT)</strong>を選びます。選んだ方式だけが計算・図式に反映されます。</p>
        <div class="check-box"><strong>設定手数料率の表示</strong> — <strong>LIVE</strong>と<strong>Sandbox</strong>をそれぞれ使用/未使用・本社既定請求方式で設定します。使用時はその環境の図式に料率列を表示します。</div>
        <p>通貨・金額段階ごとに行を編集して保存してください。</p>
        <p class="mt-2"><strong>シミュレーターSandbox手数料</strong> (<span class="menu-path">本社ポリシー → 手数料・リスク → シミュレーター用手数料</span>、Sandboxタブ)</p>
        <ul>
          <li><strong>LIVE</strong>段階・ガスは実取引(シンボル)手数料と同じです。</li>
          <li><strong>Sandbox</strong>はLIVEに<strong>追加基本手数料</strong>(FX %、ガス/送金/その他USDT)だけを加算します。段階表はLIVEミラー(読取専用)、画面は<strong>合計 (LIVE)</strong>表示です。</li>
          <li>「Sandbox追加手数料を0に初期化」でSandbox加算のみ0に戻します。</li>
          <li>「LIVE基本手数料を適用」で本社LIVE基本・段階・ガスを再読込し、Sandbox追加分にLIVE基本値を入れます。加盟店・本社のSANDテスト用です。</li>
          <li>ネットワーク別ガスも「Sandboxガス追加分0」/「LIVE基本ガス適用」が同様です。適用後は必ず保存してください。</li>
        </ul>`,
        `<span class="menu-path">总部策略 → 手续费·风险 → 交易对（票据）手续费</span>
        <p>FX、燃气、汇款、其他各项可分别选择<strong>%</strong>或<strong>固定(USDT)</strong>。仅所选方式参与计算与图示。</p>
        <div class="check-box"><strong>显示已设手续费率</strong> — 分别设置 <strong>LIVE</strong> 与 <strong>Sandbox</strong>（使用/未使用及总部默认计费方式）。开启时该环境图示显示费率列。</div>
        <p>按币种与金额档位编辑行后保存。</p>
        <p class="mt-2"><strong>模拟器 Sandbox 手续费</strong> (<span class="menu-path">总部策略 → 手续费·风险 → 模拟器用手续费</span>，Sandbox 标签)</p>
        <ul>
          <li><strong>LIVE</strong> 档位与燃气与实盘（交易对）手续费相同。</li>
          <li><strong>Sandbox</strong> 仅在 LIVE 上叠加<strong>附加基本手续费</strong>（FX %、燃气/汇款/其他 USDT）。档位表为 LIVE 镜像（只读），界面显示<strong>合计 (LIVE)</strong>。</li>
          <li>「将 Sandbox 附加手续费重置为 0」仅清零 Sandbox 加价。</li>
          <li>「应用 LIVE 默认手续费」会重新读取总部 LIVE 默认/档位/gas，并将 LIVE 默认值填入 Sandbox 附加费，供加盟店/总部 SAND 测试。</li>
          <li>各网络 gas 同样有「Sandbox gas 附加归零」/「应用 LIVE 默认 gas」。应用后请务必保存。</li>
        </ul>`,
        `<span class="menu-path">HQ Policy → ค่าธรรมเนียม·ความเสี่ยง → ค่าธรรมเนียมสัญลักษณ์ (ตั๋ว)</span>
        <p>แต่ละรายการ FX แก๊ส โอน อื่นๆ เลือก <strong>%</strong> หรือ <strong>คงที่ (USDT)</strong> ได้ โหมดที่เลือกเท่านั้นที่ใช้คำนวณและแผนภาพ</p>
        <div class="check-box"><strong>แสดงอัตราค่าธรรมเนียมที่ตั้ง</strong> — ตั้ง <strong>LIVE</strong> และ <strong>Sandbox</strong> แยกกัน (ใช้/ไม่ใช้ และวิธีเรียกเก็บเริ่มต้น HQ) เปิดแล้วแสดงคอลัมน์อัตราในแผนภาพของสภาพแวดล้อมนั้น</div>
        <p>แก้แถวตามสกุลและชั้นยอดเงินแล้วบันทึก</p>
        <p class="mt-2"><strong>ค่าธรรมเนียม Sandbox ตัวจำลอง</strong> (<span class="menu-path">HQ Policy → ค่าธรรมเนียม → ค่าธรรมเนียมตัวจำลอง</span> แท็บ Sandbox)</p>
        <ul>
          <li><strong>LIVE</strong> ชั้นและแก๊สเท่ากับค่าธรรมเนียมจริง (สัญลักษณ์)</li>
          <li><strong>Sandbox</strong> บวกเฉพาะ<strong>ค่าพื้นฐานเพิ่ม</strong> (FX %, แก๊ส/โอน/อื่น USDT) บน LIVE ตารางชั้นเป็น LIVE (อ่านอย่างเดียว) หน้าจอแสดง<strong>รวม (LIVE)</strong></li>
          <li>「รีเซ็ตค่าเพิ่ม Sandbox เป็น 0」จะเคลียร์เฉพาะค่าเพิ่ม Sandbox</li>
          <li>「ใช้ค่าธรรมเนียมเริ่มต้น LIVE」โหลดค่า LIVE จาก HQ แล้วใส่ส่วนเพิ่ม Sandbox สำหรับทดสอบ SAND ของร้านค้า/HQ</li>
          <li>gas ตามเครือข่ายก็มี「รีเซ็ตส่วนเพิ่ม gas เป็น 0」/「ใช้ gas เริ่มต้น LIVE」เช่นกัน หลังใช้ต้องบันทึก</li>
        </ul>`
      ),
    },
    {
      id: 's4',
      title: L('결제관리 · ICOPAY · 가상계좌서비스(CURFEX)', 'Payment · ICOPAY · Virtual Account Service (CURFEX)', '決済・ICOPAY・バーチャル口座サービス(CURFEX)', '支付·ICOPAY·虚拟账户服务(CURFEX)', 'การชำระเงิน·ICOPAY·บริการบัญชีเสมือน(CURFEX)'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 결제관리</span>
        <p><strong>ICOPAY (카드)</strong></p>
        <ol>
          <li>ICOPAY 연동: MID, Bracket Secret, API Base URL, 샌드박스</li>
          <li>카드 결제 사용 체크 → 저장(이중 확인)</li>
          <li>카드 수수료 %·통화별 최소/최대 한도</li>
        </ol>
        <div class="block-box">카드 결제를 끄면 고객 화면의 카드 버튼은 회색(비활성)으로 남고 숨기지 않습니다. 통화별 카드 ON/OFF는 플랫폼 입금 수취 계좌에서 따로 설정합니다.</div>
        <p class="mt-3"><strong>본사 기본 입금계좌 방식</strong></p>
        <p>결제관리 CURFEX 카드에서 <strong>고정 수취계좌</strong> 또는 <strong>가상계좌</strong>를 본사 기본으로 둡니다. 고객이 「본사설정따름」이면 이 값이 적용됩니다. 고객이 고정/가상계좌를 직접 고르면 고객 선택이 우선합니다. 가상계좌는 VA·통화가 켜진 경우에만 발급되고, 아니면 고정 계좌로 폴백합니다.</p>
        <p class="mt-3"><strong>가상계좌서비스(CURFEX) Collection (일본 JPY 이체 수취) — 추가 기능</strong></p>
        <p>기본은 <strong>꺼짐</strong>입니다. 꺼져 있으면 플랫폼의 <strong>전용 수취 계좌</strong>를 안내합니다. 켜면 JPY 계좌이체 USDT 매입 시 가상계좌서비스(CURFEX)가 <strong>건별 수취 계좌</strong>를 발급합니다. 전용 계좌 설정은 삭제되지 않습니다.</p>
        <ol>
          <li>결제관리 하단 <strong>가상계좌서비스(CURFEX) Collection</strong>에서 「가상계좌서비스(CURFEX) Collection 사용」을 켭니다.</li>
          <li><strong>샌드박스 모드</strong>를 ON으로 두면 Client ID/Secret 없이도 테스트용 계좌가 발급됩니다. (실 API 호출 없음)</li>
          <li>실연동 시: 샌드박스 OFF → 가상계좌서비스(CURFEX) 포털에서 받은 Client ID / Client Secret 입력 → API Base URL(UAT: <code>https://fcol-dashboard-uat1.curfex.com</code> 또는 운영 URL) → Wallet Name(선택) → 저장</li>
          <li>플랫폼에서 JPY <strong>이체거래</strong>가 켜져 있는지 확인합니다.</li>
          <li>고객 계정으로 JPY·계좌이체 USDT 매입을 신청하면 티켓 상세·목록 수취방식에 <strong>가상계좌</strong>와 건별 계좌·참조번호가 표시됩니다.</li>
        </ol>
        <div class="info-box">샌드박스 테스트: 사용 ON + 샌드박스 ON + 저장 → 고객으로 JPY 이체 신청 → 상세에 Sandbox Ginko 등 테스트 계좌가 보이면 정상입니다. 실입금 웹훅은 없습니다. 「샌드박스 입금 시뮬레이션」버튼을 누르면 입금 확인과 동일하게 상태가 <strong>입금확인중</strong>으로 바뀝니다.</div>
        <p class="mt-2"><strong>입금 자동 감지 (가상계좌서비스(CURFEX) ON 시)</strong></p>
        <ul>
          <li>신청 시 <strong>신청서·자금 원천 증빙만</strong> 업로드 (입금 영수증 불필요)</li>
          <li>웹훅 URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — 가상계좌서비스(CURFEX) 포털 등록 + HMAC Secret</li>
          <li>실운영: 입금 감지 시 자동으로 <strong>입금확인중</strong> — 관리자는 USDT 매입 상세에서 「송금 처리 시작」</li>
          <li>샌드박스: 웹훅 없음 → 「샌드박스 입금 시뮬레이션」으로 동일 상태 전환 테스트</li>
          <li>고정 수취계좌(가상계좌서비스(CURFEX) OFF)는 기존처럼 수동 증빙</li>
        </ul>
        <div class="warn-box">가상계좌서비스(CURFEX)는 JPY 이체 수취용입니다. 카드결제는 ICOPAY, KRW/THB/CNY 전용계좌는 기존 방식을 그대로 씁니다.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment</span>
        <p><strong>ICOPAY (card)</strong></p>
        <ol>
          <li>ICOPAY: MID, Bracket Secret, API URL, sandbox</li>
          <li>Enable card payment → save (confirm)</li>
          <li>Card fee % and min/max per currency</li>
        </ol>
        <div class="block-box">When card is off, the customer card button stays gray (disabled), not hidden. Per-currency card on/off is set on Platform deposit accounts.</div>
        <p class="mt-3"><strong>HQ default deposit account mode</strong></p>
        <p>On the Payment CURFEX card, set HQ default to <strong>fixed receiving account</strong> or <strong>virtual account</strong>. Customers on “Follow HQ” use this value. A customer’s own Fixed/VA choice overrides HQ. VA issues only when VA and the currency are enabled; otherwise it falls back to fixed.</p>
        <p class="mt-3"><strong>Virtual Account Service (CURFEX) Collection (JPY bank transfer) — additive</strong></p>
        <p>Default is <strong>OFF</strong>: customers see <strong>fixed</strong> HQ deposit accounts. When ON, JPY bank-transfer USDT purchases get a <strong>per-ticket</strong> Virtual Account Service (CURFEX) account. Fixed accounts are kept.</p>
        <ol>
          <li>Open <strong>Virtual Account Service (CURFEX) Collection</strong> on the Payment page and enable it.</li>
          <li><strong>Sandbox ON</strong> issues test accounts without calling the live API (Client ID/Secret not required for this test mode).</li>
          <li>Production: Sandbox OFF → enter Client ID / Secret → API Base URL (UAT: <code>https://fcol-dashboard-uat1.curfex.com</code> or prod) → optional Wallet Name → Save.</li>
          <li>Ensure JPY <strong>bank transfer</strong> is enabled under Platform deposit accounts.</li>
          <li>As a customer, apply for JPY bank-transfer USDT — ticket detail shows the Virtual Account Service (CURFEX)-issued account and reference.</li>
        </ol>
        <div class="info-box">Sandbox test: Enable + Sandbox ON → customer JPY transfer apply → test account on ticket. No real deposit webhook in sandbox — press “Simulate sandbox deposit” to move status to <strong>Deposit verifying</strong>.</div>
        <p class="mt-2"><strong>Auto deposit detection (when Virtual Account Service (CURFEX) ON)</strong></p>
        <ul>
          <li>At apply: upload <strong>application / source-of-funds only</strong> (no deposit receipt)</li>
          <li>Webhook URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — register in CURFEX portal + HMAC Secret</li>
          <li>Live: deposit → auto <strong>Deposit verifying</strong> — admin starts remittance on ticket detail</li>
          <li>Sandbox: no webhook → “Simulate sandbox deposit” for the same transition</li>
          <li>Fixed accounts (Virtual Account Service (CURFEX) OFF) still require manual proof</li>
        </ul>
        <div class="warn-box">Virtual Account Service (CURFEX) is for JPY collection only. Cards stay on ICOPAY; other fiat fixed accounts are unchanged.</div>`,
        `<span class="menu-path">本社ポリシー → 運営管理 → 決済管理</span>
        <p><strong>ICOPAY（カード）</strong></p>
        <ol>
          <li>ICOPAY連携: MID、Bracket Secret、API Base URL、サンドボックス</li>
          <li>カード決済使用にチェック → 保存(二重確認)</li>
          <li>カード手数料%・通貨別最小/最大限度</li>
        </ol>
        <div class="block-box">カード決済をOFFにしても顧客画面のカードボタンは灰色(無効)のまま非表示にはしません。通貨別カードON/OFFはプラットフォーム入金受取口座で別設定です。</div>
        <p class="mt-3"><strong>バーチャル口座サービス(CURFEX) Collection（日本JPY振込受取）— 追加機能</strong></p>
        <p>既定は<strong>OFF</strong>です。OFFのときはプラットフォームの<strong>固定受取口座</strong>を案内します。ONにするとJPY口座振込USDT購入でバーチャル口座サービス(CURFEX)が<strong>取引ごとの受取口座</strong>を発行します。固定口座設定は消えません。</p>
        <ol>
          <li>決済管理下部の<strong>バーチャル口座サービス(CURFEX) Collection</strong>で「使用」をONにします。</li>
          <li><strong>サンドボックスモード</strong>ONならClient ID/Secretなしでテスト口座が発行されます（実API呼び出しなし）。</li>
          <li>本番連携: サンドボックスOFF → CURFEX発行のClient ID/Secret → API Base URL(UAT: <code>https://fcol-dashboard-uat1.curfex.com</code>または本番) → Wallet Name(任意) → 保存</li>
          <li>プラットフォームでJPY<strong>振込取引</strong>がONか確認します。</li>
          <li>顧客でJPY・口座振込USDTを申請すると、詳細に「バーチャル口座サービス(CURFEX)発行」口座・参照番号が表示されます。</li>
        </ol>
        <div class="info-box">サンドボックステスト: 使用ON+サンドボックスON+保存 → 顧客でJPY振込申請 → 詳細にSandbox Ginko等のテスト口座が見えれば正常。実入金Webhookはありません。「サンドボックス入金シミュレーション」で状態が<strong>入金確認中</strong>になります。</div>
        <p class="mt-2"><strong>入金自動検知（バーチャル口座サービス(CURFEX) ON時）</strong></p>
        <ul>
          <li>申請時は<strong>申請書・資金源証憑のみ</strong>（入金領収書不要）</li>
          <li>Webhook URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — CURFEXポータル登録 + HMAC Secret</li>
          <li>本番: 入金検知で自動<strong>入金確認中</strong> — 管理者はUSDT購入詳細で「送金処理開始」</li>
          <li>サンドボックス: Webhookなし → 「サンドボックス入金シミュレーション」で同じ遷移をテスト</li>
          <li>固定受取口座（バーチャル口座サービス(CURFEX) OFF）は従来どおり手動証憑</li>
        </ul>
        <div class="warn-box">バーチャル口座サービス(CURFEX)はJPY振込受取用です。カードはICOPAY、KRW/THB/CNY固定口座は従来どおりです。</div>`,
        `<span class="menu-path">总部策略 → 运营管理 → 支付管理</span>
        <p><strong>ICOPAY（卡）</strong></p>
        <ol>
          <li>ICOPAY 对接：MID、Bracket Secret、API Base URL、沙盒</li>
          <li>勾选启用卡支付 → 保存（二次确认）</li>
          <li>卡手续费 %、按币种最小/最大限额</li>
        </ol>
        <div class="block-box">关闭卡支付后，客户页卡按钮仍为灰色（禁用），不会隐藏。按币种卡开关在平台入金收款账户单独设置。</div>
        <p class="mt-3"><strong>虚拟账户服务(CURFEX) Collection（日本 JPY 转账收款）— 附加功能</strong></p>
        <p>默认<strong>关闭</strong>。关闭时引导平台<strong>固定收款账户</strong>。开启后，JPY 银行转账 USDT 采购由虚拟账户服务(CURFEX) 开立<strong>按单收款账户</strong>。固定账户设置不会删除。</p>
        <ol>
          <li>在支付管理底部 <strong>虚拟账户服务(CURFEX) Collection</strong> 中开启「使用」。</li>
          <li><strong>沙盒模式</strong> ON 时可无 Client ID/Secret 发放测试账户（不调用正式 API）。</li>
          <li>正式对接：沙盒 OFF → 填入 CURFEX 的 Client ID/Secret → API Base URL（UAT: <code>https://fcol-dashboard-uat1.curfex.com</code> 或生产）→ Wallet Name（可选）→ 保存</li>
          <li>确认平台已开启 JPY <strong>转账交易</strong>。</li>
          <li>用客户账号申请 JPY 转账 USDT 后，详情会显示「虚拟账户服务(CURFEX) 开立」账户与参考号。</li>
        </ol>
        <div class="info-box">沙盒测试：启用 + 沙盒 ON + 保存 → 客户申请 JPY 转账 → 详情出现 Sandbox Ginko 等测试账户即正常。无真实入金 Webhook。点「沙盒入金模拟」可将状态变为<strong>入金确认中</strong>。</div>
        <p class="mt-2"><strong>入金自动检测（虚拟账户服务(CURFEX) 开启时）</strong></p>
        <ul>
          <li>申请时仅上传<strong>申请书·资金来源证明</strong>（无需入金回单）</li>
          <li>Webhook URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — 在 CURFEX 门户注册 + HMAC Secret</li>
          <li>正式：检测到入金后自动进入<strong>入金确认中</strong> — 管理员在 USDT 采购详情点「开始汇款」</li>
          <li>沙盒：无 Webhook → 用「沙盒入金模拟」测同一状态流转</li>
          <li>固定收款账户（虚拟账户服务(CURFEX) 关闭）仍需手动凭证</li>
        </ul>
        <div class="warn-box">虚拟账户服务(CURFEX) 仅用于 JPY 转账收款。卡支付走 ICOPAY；KRW/THB/CNY 固定账户方式不变。</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment</span>
        <p><strong>ICOPAY (บัตร)</strong></p>
        <ol>
          <li>เชื่อม ICOPAY: MID, Bracket Secret, API Base URL, แซนด์บ็อกซ์</li>
          <li>ติ๊กใช้ชำระบัตร → บันทึก (ยืนยันสองชั้น)</li>
          <li>% ค่าธรรมเนียมบัตร และวงเงินต่ำสุด/สูงสุดตามสกุล</li>
        </ol>
        <div class="block-box">ปิดบัตรแล้วปุ่มบัตรหน้าลูกค้ายังเป็นสีเทา (ปิดใช้) ไม่ซ่อน การเปิด/ปิดบัตรตามสกุลตั้งที่บัญชีรับเงินบนแพลตฟอร์มแยกต่างหาก</div>
        <p class="mt-3"><strong>บริการบัญชีเสมือน(CURFEX) Collection (รับโอน JPY ญี่ปุ่น) — ฟีเจอร์เพิ่ม</strong></p>
        <p>ค่าเริ่มต้นคือ<strong>ปิด</strong> เมื่อปิดจะแนะนำ<strong>บัญชีรับเงินคงที่</strong>ของแพลตฟอร์ม เมื่อเปิด การซื้อ USDT โอนบัญชี JPY จะได้<strong>บัญชีรับรายตั๋ว</strong>จากบริการบัญชีเสมือน(CURFEX) การตั้งบัญชีคงที่ไม่ถูกลบ</p>
        <ol>
          <li>ที่ด้านล่าง Payment เปิดใช้ <strong>บริการบัญชีเสมือน(CURFEX) Collection</strong></li>
          <li><strong>โหมดแซนด์บ็อกซ์</strong> ON จะออกบัญชีทดสอบโดยไม่ต้องมี Client ID/Secret (ไม่เรียก API จริง)</li>
          <li>ใช้งานจริง: ปิดแซนด์บ็อกซ์ → ใส่ Client ID/Secret จาก CURFEX → API Base URL (UAT: <code>https://fcol-dashboard-uat1.curfex.com</code> หรือโปรด) → Wallet Name (ไม่บังคับ) → บันทึก</li>
          <li>ตรวจว่าแพลตฟอร์มเปิด <strong>โอน</strong> สำหรับ JPY</li>
          <li>ลูกค้าสมัครซื้อ USDT โอน JPY แล้วรายละเอียดจะแสดงบัญชี「ออกโดยบริการบัญชีเสมือน(CURFEX)」และเลขอ้างอิง</li>
        </ol>
        <div class="info-box">ทดสอบแซนด์บ็อกซ์: เปิดใช้ + Sandbox ON + บันทึก → ลูกค้าสมัครโอน JPY → เห็นบัญชีทดสอบ เช่น Sandbox Ginko คือปกติ ไม่มี webhook ฝากจริง กด「จำลองฝากแซนด์บ็อกซ์」แล้วสถานะจะเป็น<strong>กำลังตรวจสอบการฝาก</strong></div>
        <p class="mt-2"><strong>ตรวจเงินเข้าอัตโนมัติ (เมื่อบริการบัญชีเสมือน(CURFEX) เปิด)</strong></p>
        <ul>
          <li>ตอนสมัครอัปโหลดเฉพาะ<strong>ใบสมัคร·หลักฐานแหล่งเงิน</strong> (ไม่ต้องสลิปฝาก)</li>
          <li>Webhook URL: <code>https://api.tinpass.com/api/webhooks/curfex</code> — ลงทะเบียนที่พอร์ทัล CURFEX + HMAC Secret</li>
          <li>โปรดักชัน: ตรวจฝากแล้วเข้า<strong>กำลังตรวจสอบการฝาก</strong> อัตโนมัติ — ผู้ดูแลเริ่มโอนที่รายละเอียดตั๋ว</li>
          <li>แซนด์บ็อกซ์: ไม่มี webhook → ใช้「จำลองฝากแซนด์บ็อกซ์」ทดสอบการเปลี่ยนสถานะเดียวกัน</li>
          <li>บัญชีคงที่ (บริการบัญชีเสมือน(CURFEX) ปิด) ยังต้องอัปโหลดหลักฐานด้วยมือ</li>
        </ul>
        <div class="warn-box">บริการบัญชีเสมือน(CURFEX) ใช้รับโอน JPY เท่านั้น บัตรใช้ ICOPAY บัญชีคงที่ KRW/THB/CNY ตามเดิม</div>`
      ),
    },
    {
      id: 'hq-curfex',
      title: L('가상계좌서비스(CURFEX) 설정·입금 자동감지', 'Virtual Account Service (CURFEX) setup & auto-detect', 'バーチャル口座サービス(CURFEX)設定・入金自動検知', '虚拟账户服务(CURFEX) 设置与自动检测', 'ตั้งค่าบริการบัญชีเสมือน(CURFEX) และการตรวจอัตโนมัติ'),
      bodyHtml: L(
        `<span class="menu-path">본사정책 → 운영관리 → 결제관리 → 가상계좌서비스(CURFEX) Collection</span>
        <table><thead><tr><th>항목</th><th>설명</th></tr></thead><tbody>
        <tr><td>사용 ON/OFF</td><td>OFF(기본)=모든 통화 고정 수취계좌·수동 증빙 / ON=선택 통화만 가상계좌서비스(CURFEX)</td></tr>
        <tr><td>적용 통화</td><td>JPY/KRW/THB/CNY 중 선택. 기본 JPY. 미선택 통화는 전용계좌 + 입금 영수증</td></tr>
        <tr><td>Client ID / Secret</td><td>CURFEX(Fukugu) 발급. 샌드박스만 테스트 시 비워도 됨</td></tr>
        <tr><td>웹훅 URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code> — CURFEX 포털에 등록</td></tr>
        <tr><td>HMAC Secret</td><td>「HMAC Secret 생성」후 CURFEX에 동일 값 등록</td></tr>
        <tr><td>자동 APPROVE</td><td>입금 금액이 신청액과 일치하면 decision APPROVE 자동 호출</td></tr>
        <tr><td>샌드박스</td><td>ON=테스트 계좌 + 「샌드박스 입금 시뮬레이션」으로 자동감지 흐름 검증</td></tr>
        </tbody></table>
        <p class="mt-2"><strong>가상계좌서비스(CURFEX) ON 업무 순서</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객 JPY 이체 신청 → 건별 계좌·참조번호 발급</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">고객이 안내 계좌로 입금 (증빙 업로드 없음)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">웹훅 또는 1분 폴링으로 입금 감지 → 입금확인중</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">운영자가 USDT 송금·완료 (기존과 동일)</span></div>
        </div>
        <div class="warn-box">예외: 가상계좌서비스(CURFEX) ON이어도 적용 통화에 없는 화폐(예: KRW)는 고정 수취계좌 + 입금 영수증이 필요합니다.</div>
        <div class="check-box">샌드박스: 사용 ON + 샌드박스 ON → 신청 → 티켓에서 「샌드박스 입금 시뮬레이션」→ 입금확인중으로 넘어가면 성공.</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment → Virtual Account Service (CURFEX) Collection</span>
        <table><thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>
        <tr><td>Enable</td><td>OFF=all currencies fixed + manual proof / ON=Virtual Account Service (CURFEX) only for selected currencies</td></tr>
        <tr><td>Currencies</td><td>Select JPY/KRW/THB/CNY. Default JPY. Unselected → fixed account + deposit receipt</td></tr>
        <tr><td>Client ID / Secret</td><td>From CURFEX (Fukugu). Optional for sandbox-only tests</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code></td></tr>
        <tr><td>HMAC Secret</td><td>Generate in TINPASS → register same value in CURFEX portal</td></tr>
        <tr><td>Auto APPROVE</td><td>When deposited amount matches application, call CURFEX decision APPROVE</td></tr>
        <tr><td>Sandbox</td><td>Test account + “Simulate sandbox deposit” on ticket</td></tr>
        </tbody></table>
        <p class="mt-2"><strong>Virtual Account Service (CURFEX) ON workflow</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Customer JPY transfer apply → per-ticket account</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Customer deposits (no proof upload)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook or 1-min poll → deposit verifying</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Operator sends USDT and completes</span></div>
        </div>
        <div class="warn-box">Exception: even with Virtual Account Service (CURFEX) ON, currencies not in the list (e.g. KRW) use fixed accounts + deposit receipt.</div>
        <div class="check-box">Sandbox: Enable + Sandbox ON → apply → “Simulate sandbox deposit” on ticket → status moves to deposit verifying = success.</div>`,
        `<span class="menu-path">本社ポリシー → 運営管理 → 決済管理 → バーチャル口座サービス(CURFEX) Collection</span>
        <table><thead><tr><th>項目</th><th>説明</th></tr></thead><tbody>
        <tr><td>使用ON/OFF</td><td>OFF(既定)=全通貨固定受取・手動証憑 / ON=選択通貨のみバーチャル口座サービス(CURFEX)</td></tr>
        <tr><td>適用通貨</td><td>JPY/KRW/THB/CNYから選択。既定JPY。未選択通貨は固定口座＋入金領収書</td></tr>
        <tr><td>Client ID / Secret</td><td>CURFEX(Fukugu)発行。サンドボックステストのみなら空でも可</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code> — CURFEXポータルに登録</td></tr>
        <tr><td>HMAC Secret</td><td>「HMAC Secret生成」後、CURFEXに同値を登録</td></tr>
        <tr><td>自動APPROVE</td><td>入金額が申請額と一致するとdecision APPROVEを自動呼出</td></tr>
        <tr><td>サンドボックス</td><td>ON=テスト口座＋「サンドボックス入金シミュレーション」で自動検知フロー検証</td></tr>
        </tbody></table>
        <p class="mt-2"><strong>バーチャル口座サービス(CURFEX) ON業務手順</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">顧客JPY振込申請→取引ごと口座・参照番号発行</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">案内口座へ入金（証憑アップロードなし）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhookまたは1分ポーリングで入金検知→入金確認中</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">運営者がUSDT送金・完了（従来どおり）</span></div>
        </div>
        <div class="warn-box">例外: バーチャル口座サービス(CURFEX) ONでも適用通貨にない通貨(例:KRW)は固定受取口座＋入金領収書が必要です。</div>
        <div class="check-box">サンドボックス: 使用ON＋サンドボックスON→申請→チケットで「サンドボックス入金シミュレーション」→入金確認中へ進めば成功。</div>`,
        `<span class="menu-path">总部策略 → 运营管理 → 支付管理 → 虚拟账户服务(CURFEX) Collection</span>
        <table><thead><tr><th>项</th><th>说明</th></tr></thead><tbody>
        <tr><td>启用 ON/OFF</td><td>关闭(默认)=全部币种固定收款账户·手动凭证 / 开启=仅所选币种使用虚拟账户服务(CURFEX)</td></tr>
        <tr><td>适用币种</td><td>在 JPY/KRW/THB/CNY 中选择。默认 JPY。未选币种仍用固定账户 + 入金回单</td></tr>
        <tr><td>Client ID / Secret</td><td>由 CURFEX(Fukugu) 发放。仅沙盒测试时可留空</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code> — 在 CURFEX 门户注册</td></tr>
        <tr><td>HMAC Secret</td><td>在 TINPASS「生成 HMAC Secret」后于 CURFEX 登记相同值</td></tr>
        <tr><td>自动 APPROVE</td><td>入金金额与申请额一致时自动调用 decision APPROVE</td></tr>
        <tr><td>沙盒</td><td>开启=测试账户 + 用「沙盒入金模拟」验证自动检测流程</td></tr>
        </tbody></table>
        <p class="mt-2"><strong>虚拟账户服务(CURFEX) 开启后的业务顺序</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">客户 JPY 转账申请 → 开立按单账户与参考号</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">客户向指引账户入金（无需上传凭证）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook 或每分钟轮询检测到入金 → 入金确认中</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">运营发送 USDT 并完成（与以往相同）</span></div>
        </div>
        <div class="warn-box">例外：即使开启虚拟账户服务(CURFEX)，未列入适用币种的货币（如 KRW）仍需固定收款账户 + 入金回单。</div>
        <div class="check-box">沙盒：启用 + 沙盒 ON → 申请 → 在单据点「沙盒入金模拟」→ 进入入金确认中即成功。</div>`,
        `<span class="menu-path">HQ Policy → Ops → Payment → บริการบัญชีเสมือน(CURFEX) Collection</span>
        <table><thead><tr><th>รายการ</th><th>ความหมาย</th></tr></thead><tbody>
        <tr><td>เปิดใช้ ON/OFF</td><td>ปิด (ค่าเริ่ม)=ทุกสกุลบัญชีคงที่·หลักฐานด้วยมือ / เปิด=เฉพาะสกุลที่เลือกใช้บริการบัญชีเสมือน(CURFEX)</td></tr>
        <tr><td>สกุลที่ใช้</td><td>เลือก JPY/KRW/THB/CNY ค่าเริ่ม JPY สกุลที่ไม่เลือกใช้บัญชีคงที่ + สลิปฝาก</td></tr>
        <tr><td>Client ID / Secret</td><td>ออกโดย CURFEX (Fukugu) ทดสอบแซนด์บ็อกซ์อย่างเดียวว่างได้</td></tr>
        <tr><td>Webhook URL</td><td><code>https://api.tinpass.com/api/webhooks/curfex</code> — ลงทะเบียนที่พอร์ทัล CURFEX</td></tr>
        <tr><td>HMAC Secret</td><td>สร้างใน TINPASS แล้วลงทะเบียนค่าเดียวกันที่ CURFEX</td></tr>
        <tr><td>APPROVE อัตโนมัติ</td><td>ยอดฝากตรงกับยอดสมัครแล้วเรียก decision APPROVE อัตโนมัติ</td></tr>
        <tr><td>แซนด์บ็อกซ์</td><td>ON=บัญชีทดสอบ + 「จำลองฝากแซนด์บ็อกซ์」เพื่อตรวจโฟลว์อัตโนมัติ</td></tr>
        </tbody></table>
        <p class="mt-2"><strong>ลำดับงานเมื่อบริการบัญชีเสมือน(CURFEX) เปิด</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">ลูกค้าสมัครโอน JPY → ออกบัญชีรายตั๋วและเลขอ้างอิง</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ลูกค้าฝากเข้าบัญชีที่แจ้ง (ไม่ต้องอัปโหลดหลักฐาน)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Webhook หรือ poll ทุก 1 นาทีตรวจฝาก → กำลังตรวจสอบการฝาก</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ผู้ดำเนินการส่ง USDT และปิดงาน (ตามเดิม)</span></div>
        </div>
        <div class="warn-box">ข้อยกเว้น: แม้เปิดบริการบัญชีเสมือน(CURFEX) สกุลที่ไม่อยู่ในรายการ (เช่น KRW) ยังต้องใช้บัญชีคงที่ + สลิปฝาก</div>
        <div class="check-box">แซนด์บ็อกซ์: เปิดใช้ + Sandbox ON → สมัคร → กด「จำลองฝากแซนด์บ็อกซ์」บนตั๋ว → เข้ากำลังตรวจสอบการฝาก = สำเร็จ</div>`
      ),
    },
    {
      id: 's5',
      title: L('USDT 매입 운영', 'USDT purchase ops', 'USDT購入運用', 'USDT 采购运营', 'ปฏิบัติการซื้อ USDT'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입</span>
        <p>목록의 <strong>수취방식</strong> 열에는 <strong>전용계좌</strong>(고정 수취) 또는 <strong>가상계좌</strong>(건별 발급)로만 표시됩니다. 「TINPASS」 접두어는 쓰지 않습니다. 목록 필터의 시작일은 <strong>1주 전</strong>, 종료일은 <strong>오늘</strong>이 기본입니다(본사·가맹점 동일). 「본사설정」 드롭다운 높이는 새로고침·내림차순과 같습니다.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객 신청 (계좌 이체 또는 카드)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">전용계좌: 입금 증빙 / 가상계좌: 자동 입금감지 / 카드: 결제 완료</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">관리자 검토 → 송금 → TXID 등록</span></div>
        </div>
        <p>상세 화면에서 수수료 스냅샷·카드 결제 정보·김치/로컬 프리미엄을 확인합니다. 중계에서 받은 USDT는 <strong>중계 USDT</strong>로 수기 입력하면 수익분석에 반영됩니다.</p>
        <p class="mt-2"><strong>가상계좌 JPY 건 (입금 자동감지 ON · 백엔드 가상계좌서비스(CURFEX))</strong></p>
        <ul>
          <li>티켓·목록에는 「가상계좌」로 표시됩니다. 상세에 건별 계좌·참조번호가 나옵니다.</li>
          <li>입금 후 웹훅/폴링으로 <strong>입금확인중</strong>으로 자동 전환 — 증빙 검토 불필요.</li>
          <li>금액 불일치 시 관리자 메모에 기록됩니다. 「입금 상태 확인」으로 가상계좌 상태를 수동 동기화할 수 있습니다.</li>
          <li>샌드박스: 「샌드박스 입금 시뮬레이션」으로 테스트.</li>
        </ul>
        <p class="mt-2"><strong>상태 표현 (USDT vs KYC)</strong></p>
        <ul>
          <li><strong>입금확인중</strong> — 전용계좌·가상계좌 입금이 감지된 뒤 관리자가 금액·입금을 확인하는 단계</li>
          <li><strong>결제확인중</strong> — 카드 결제 건에서 결제·수수료를 확인하는 단계</li>
          <li><strong>심사중</strong> — <em>인증센터(KYC)</em> 서류·신원 심사 전용. USDT 입금 확인과 혼동하지 마세요.</li>
        </ul>
        <p class="mt-2"><strong>증빙 파일 (상세 화면)</strong></p>
        <ul>
          <li>계좌 이체 건은 첨부가 없어도 <strong>증빙 파일</strong> 섹션이 항상 표시됩니다.</li>
          <li>확인 대상: 자금 원천 증빙, 6개월 거래 예정 보고서, (전용계좌) 입금 영수증</li>
          <li>파일이 없으면 안내 문구가 표시됩니다. 실제 신청·입금 없이 상태만 설정된 테스트 데이터는 별도로 표시됩니다.</li>
        </ul>`,
        `<span class="menu-path">USDT purchase</span>
        <p>The list filter defaults to start <strong>1 week ago</strong> and end <strong>today</strong> (same for HQ and merchants). The HQ settings dropdown height matches Refresh and Sort.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Customer applies (bank or card)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Fixed account: deposit proof / Virtual Account Service (CURFEX): auto detect / Card: charged</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Review → transfer → TXID</span></div>
        </div>
        <p>On the detail screen check fee snapshot, card payment info, and kimchi/local premium. Enter <strong>broker USDT</strong> received from the broker for profit analysis.</p>
        <p class="mt-2"><strong>Virtual Account Service (CURFEX) JPY tickets (auto deposit ON)</strong></p>
        <ul>
          <li>Ticket shows “Deposit account (Virtual Account Service (CURFEX) issued)” and reference.</li>
          <li>After deposit, webhook/poll moves to <strong>deposit verifying</strong> — no proof review.</li>
          <li>Amount mismatch is noted in admin memo. Use “Check deposit status” to sync CURFEX manually.</li>
          <li>Sandbox: use “Simulate sandbox deposit”.</li>
        </ul>
        <p class="mt-2"><strong>Status labels (USDT vs KYC)</strong></p>
        <ul>
          <li><strong>Deposit verifying</strong> — fixed or Virtual Account Service (CURFEX) bank deposit detected; HQ checks amount and receipt</li>
          <li><strong>Payment verifying</strong> — card payment and fees under review</li>
          <li><strong>Under review</strong> — <em>Verification (KYC)</em> document review only. Do not confuse with USDT deposit checks.</li>
        </ul>
        <p class="mt-2"><strong>Proof files (detail screen)</strong></p>
        <ul>
          <li>Bank-transfer tickets always show the <strong>Attachments</strong> section, even when empty.</li>
          <li>Expected: source of funds, 6-month forecast, (fixed account) deposit receipt</li>
          <li>Empty state shows guidance. Test-seed tickets without real uploads are labeled separately.</li>
        </ul>`,
        `<span class="menu-path">USDT購入</span>
        <p>一覧フィルタの開始日は<strong>1週間前</strong>、終了日は<strong>今日</strong>が既定です（本社・加盟店共通）。「本社設定」ドロップダウンの高さは更新・降順と同じです。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">顧客申請（口座振込またはカード）</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">固定口座: 入金証憑 / バーチャル口座サービス(CURFEX): 入金自動検知 / カード: 決済完了</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">管理者レビュー → 送金 → TXID登録</span></div>
        </div>
        <p>詳細画面で手数料スナップショット・カード決済情報・キムチ/ローカルプレミアムを確認します。仲介で受け取ったUSDTは<strong>仲介USDT</strong>として手入力すると収益分析に反映されます。</p>
        <p class="mt-2"><strong>バーチャル口座サービス(CURFEX) JPY件（入金自動検知ON）</strong></p>
        <ul>
          <li>チケットに「入金口座（バーチャル口座サービス(CURFEX)発行）」・参照番号が表示されます。</li>
          <li>入金後、Webhook/ポーリングで<strong>入金確認中</strong>へ自動遷移 — 証憑確認不要。</li>
          <li>金額不一致は管理者メモに記録。「入金状態を確認」でCURFEX状態を手動同期できます。</li>
          <li>サンドボックス: 「サンドボックス入金シミュレーション」でテスト。</li>
        </ul>
        <p class="mt-2"><strong>状態表示（USDTとKYC）</strong></p>
        <ul>
          <li><strong>入金確認中</strong> — 固定口座・バーチャル口座サービス(CURFEX)の入金検知後、管理者が金額・入金を確認する段階</li>
          <li><strong>決済確認中</strong> — カード決済の確認段階</li>
          <li><strong>審査中</strong> — <em>認証センター(KYC)</em>の書類・本人確認専用。USDT入金確認と混同しないでください。</li>
        </ul>
        <p class="mt-2"><strong>証憑ファイル（詳細画面）</strong></p>
        <ul>
          <li>口座振込件は添付がなくても<strong>証憑ファイル</strong>欄が常に表示されます。</li>
          <li>確認対象: 資金源証憑、6か月取引予定報告書、（固定口座）入金領収書</li>
          <li>ファイルがない場合は案内文を表示。実際の申請・入金なしのテストデータは別途表示されます。</li>
        </ul>`,
        `<span class="menu-path">USDT 采购</span>
        <p>列表筛选默认开始日为<strong>一周前</strong>、结束日为<strong>今天</strong>（总部与加盟商相同）。「总部设置」下拉高度与刷新、降序相同。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">客户申请（银行转账或卡）</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">固定账户: 入金凭证 / 虚拟账户服务(CURFEX): 自动检测入金 / 卡: 支付完成</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">管理员审核 → 汇款 → 登记 TXID</span></div>
        </div>
        <p>在详情页查看手续费快照、卡支付信息、泡菜/本地溢价。将中介收到的 USDT 手工记为<strong>中介 USDT</strong>，会反映到收益分析。</p>
        <p class="mt-2"><strong>虚拟账户服务(CURFEX) JPY 单（入金自动检测开启）</strong></p>
        <ul>
          <li>单据显示「入金账户（虚拟账户服务(CURFEX) 开立）」与参考号。</li>
          <li>入金后经 Webhook/轮询自动进入<strong>入金确认中</strong> — 无需审核凭证。</li>
          <li>金额不符会记入管理员备注。可用「检查入金状态」手动同步 CURFEX。</li>
          <li>沙盒：用「沙盒入金模拟」测试。</li>
        </ul>
        <p class="mt-2"><strong>状态用语（USDT 与 KYC）</strong></p>
        <ul>
          <li><strong>入金确认中</strong> — 固定账户或虚拟账户服务(CURFEX) 检测到入金后，管理员核对金额与入金</li>
          <li><strong>支付确认中</strong> — 卡支付核对阶段</li>
          <li><strong>审核中</strong> — 仅用于<em>认证中心(KYC)</em>文件审核，勿与 USDT 入金确认混淆</li>
        </ul>
        <p class="mt-2"><strong>凭证文件（详情页）</strong></p>
        <ul>
          <li>银行转账单即使无附件也始终显示<strong>凭证文件</strong>区域。</li>
          <li>待确认：资金来源证明、6 个月预估报告、（固定账户）入金回单</li>
          <li>无文件时显示说明。未实际上传仅设状态的测试数据会单独标注。</li>
        </ul>`,
        `<span class="menu-path">ซื้อ USDT</span>
        <p>ตัวกรองรายการเริ่มต้นวันเริ่มเป็น<strong>1 สัปดาห์ก่อน</strong> วันสิ้นสุดเป็น<strong>วันนี้</strong> (HQ และร้านเหมือนกัน) รายการ「ตั้งค่า HQ」สูงเท่าปุ่มรีเฟรช/เรียง</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">ลูกค้าสมัคร (โอนบัญชีหรือบัตร)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">บัญชีคงที่: หลักฐานฝาก / บริการบัญชีเสมือน(CURFEX): ตรวจอัตโนมัติ / บัตร: ชำระแล้ว</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">ผู้ดูแลตรวจ → โอน → ลงทะเบียน TXID</span></div>
        </div>
        <p>ที่หน้ารายละเอียดดูสแนปช็อตค่าธรรมเนียม ข้อมูลชำระบัตร และพรีเมียม กิมจิ/ท้องถิ่น กรอก <strong>USDT ตัวกลาง</strong> ที่ได้รับจากตัวกลางเพื่อสะท้อนในวิเคราะห์กำไร</p>
        <p class="mt-2"><strong>ตั๋ว JPY บริการบัญชีเสมือน(CURFEX) (ตรวจฝากอัตโนมัติเปิด)</strong></p>
        <ul>
          <li>ตั๋วแสดง「บัญชีฝาก (ออกโดยบริการบัญชีเสมือน(CURFEX))」และเลขอ้างอิง</li>
          <li>หลังฝาก Webhook/poll เปลี่ยนเป็น<strong>กำลังตรวจสอบการฝาก</strong> อัตโนมัติ — ไม่ต้องตรวจสลิป</li>
          <li>ยอดไม่ตรงจะบันทึกในโน้ตผู้ดูแล ใช้「ตรวจสถานะฝาก」ซิงก์ CURFEX ด้วยมือได้</li>
          <li>แซนด์บ็อกซ์: ใช้「จำลองฝากแซนด์บ็อกซ์」</li>
        </ul>
        <p class="mt-2"><strong>สถานะ (USDT กับ KYC)</strong></p>
        <ul>
          <li><strong>กำลังตรวจสอบการฝาก</strong> — หลังตรวจพบเงินเข้าบัญชีคงที่หรือบริการบัญชีเสมือน(CURFEX) ผู้ดูแลตรวจยอดและสลิป</li>
          <li><strong>กำลังตรวจสอบการชำระ</strong> — ขั้นตรวจการชำระบัตร</li>
          <li><strong>กำลังตรวจสอบ</strong> — เฉพาะ<em>ศูนย์ยืนยัน(KYC)</em> อย่าสับสนกับการตรวจฝาก USDT</li>
        </ul>
        <p class="mt-2"><strong>ไฟล์หลักฐาน (หน้ารายละเอียด)</strong></p>
        <ul>
          <li>รายการโอนบัญชีแสดงส่วน<strong>ไฟล์หลักฐาน</strong>เสมอ แม้ไม่มีไฟล์แนบ</li>
          <li>ที่ต้องตรวจ: แหล่งเงิน รายงาน 6 เดือน (บัญชีคงที่) สลิปฝาก</li>
          <li>ถ้าไม่มีไฟล์จะแสดงคำแนะนำ ข้อมูลทดสอบที่ตั้งสถานะอย่างเดียวจะระบุแยก</li>
        </ul>`
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
        <p>総本社メニューは本社ポリシー配下です。顧客・組織は業務メニューのシミュレーターを使います。</p>
        <ul>
          <li>出金<strong>ネットワークを必ず選択</strong>してから、入金額または受取USDTで計算します。</li>
          <li>顧客画面には直近シミュレーションが<strong>最大3件</strong>残ります。ダッシュボードプレビューは<strong>2件</strong>です。</li>
          <li>記録シミュレーターは<strong>利用分析が上</strong>、一覧が下です。保管期間は本社ポリシー → プラットフォームで変更します。</li>
        </ul>
        <p><strong>顧客・組織シミュレーター設定</strong></p>
        <ul>
          <li><span class="menu-path">顧客管理</span> · <span class="menu-path">組織管理</span> — シミュレーター使用ON/OFF、S RATE(LIVE/SAND)。SANDはSandbox手数料体系で計算されます。</li>
          <li>S RATEは一覧でティール(LIVE)・オレンジ(SAND)バッジで区別されます。</li>
          <li>顧客ごとのシミュレーターOFFは本社CUSTOMERメニュー権限より優先してメニューを塞ぎます。</li>
        </ul>
        <p><strong>本社シミュレーター LIVE / Sandboxタブ</strong></p>
        <ul>
          <li><strong>LIVE</strong> — 実取引(シンボル)手数料・為替で計算します。</li>
          <li><strong>Sandbox</strong> — LIVE段階・ガスにSandbox追加基本手数料を加算。段階表はLIVEミラー(読取専用)、値は<strong>合計 (LIVE)</strong>表示。</li>
        </ul>
        <div class="info-box">Sandbox手数料の編集は<span class="menu-path">手数料・リスク → シミュレーター用手数料</span>です（「手数料ポリシー」参照）。</div>`,
        `<span class="menu-path">总部策略 → USDT 模拟器 / 记录模拟器</span>
        <p>总部菜单在总部策略下。客户与组织使用业务菜单中的模拟器。</p>
        <ul>
          <li>必须先选择提现<strong>网络</strong>，再按入金额或目标 USDT 计算。</li>
          <li>客户页最多保留<strong>3</strong>条最近模拟；仪表盘预览显示<strong>2</strong>条。</li>
          <li>记录模拟器：<strong>使用分析在上</strong>，列表在下。保留期限在总部策略 → 平台中修改。</li>
        </ul>
        <p><strong>客户·组织模拟器设置</strong></p>
        <ul>
          <li><span class="menu-path">客户管理</span> · <span class="menu-path">组织管理</span> — 模拟器开/关、S RATE(LIVE/SAND)。SAND 按 Sandbox 手续费体系计算。</li>
          <li>S RATE 在列表中以青绿(LIVE)·橙(SAND)徽章区分。</li>
          <li>单客户关闭模拟器优先于总部 CUSTOMER 菜单权限，会挡住该菜单。</li>
        </ul>
        <p><strong>总部模拟器 LIVE / Sandbox 标签</strong></p>
        <ul>
          <li><strong>LIVE</strong> — 按实盘（交易对）手续费与汇率计算。</li>
          <li><strong>Sandbox</strong> — 在 LIVE 档位·燃气上叠加 Sandbox 附加基本手续费。档位表为 LIVE 镜像（只读），显示为<strong>合计 (LIVE)</strong>。</li>
        </ul>
        <div class="info-box">Sandbox 手续费在<span class="menu-path">手续费·风险 → 模拟器用手续费</span>编辑（见「手续费政策」）。</div>`,
        `<span class="menu-path">HQ Policy → ตัวจำลอง USDT / ตัวจำลองบันทึก</span>
        <p>เมนู HQ อยู่ใต้ HQ Policy ลูกค้าและองค์กรใช้ตัวจำลองในเมนูงาน</p>
        <ul>
          <li>ต้องเลือก<strong>เครือข่าย</strong>ถอนก่อน แล้วคำนวณจากยอดฝากหรือ USDT ที่จะรับ</li>
          <li>หน้าลูกค้าเก็บผลจำลองล่าสุดได้สูงสุด <strong>3</strong> รายการ แดชบอร์ดโชว์ <strong>2</strong></li>
          <li>ตัวจำลองบันทึก: <strong>วิเคราะห์การใช้งานอยู่บน</strong> รายการอยู่ล่าง ระยะเก็บแก้ที่ HQ Policy → แพลตฟอร์ม</li>
        </ul>
        <p><strong>ตั้งค่าตัวจำลองลูกค้า·องค์กร</strong></p>
        <ul>
          <li><span class="menu-path">จัดการลูกค้า</span> · <span class="menu-path">จัดการองค์กร</span> — เปิด/ปิดตัวจำลอง, S RATE (LIVE/SAND) SAND คำนวณด้วยชุดค่าธรรมเนียม Sandbox</li>
          <li>S RATE แยกด้วยแบดจ์เขียวน้ำทะเล (LIVE) / ส้ม (SAND) ในรายการ</li>
          <li>ปิดตัวจำลองรายลูกค้ามีผลเหนือสิทธิ์เมนู CUSTOMER ของ HQ</li>
        </ul>
        <p><strong>แท็บ LIVE / Sandbox ที่ HQ</strong></p>
        <ul>
          <li><strong>LIVE</strong> — คำนวณด้วยค่าธรรมเนียม·เรทจริง (สัญลักษณ์)</li>
          <li><strong>Sandbox</strong> — บวกค่าพื้นฐานเพิ่มของ Sandbox บนชั้น LIVE·แก๊ส ตารางชั้นเป็น LIVE (อ่านอย่างเดียว) แสดง<strong>รวม (LIVE)</strong></li>
        </ul>
        <div class="info-box">แก้ค่าธรรมเนียม Sandbox ที่ <span class="menu-path">ค่าธรรมเนียม → ค่าธรรมเนียมตัวจำลอง</span> (ดู「นโยบายค่าธรรมเนียม」)</div>`
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
        <div class="warn-box">총본사 관리자와 Organizer만 접근합니다. 들어갈 때 Google OTP 6자리를 입력합니다. 맞으면 확인 버튼을 누르지 않아도 진행됩니다. 유지시간은 본사정책 → 플랫폼 「민감작업 OTP 유지시간」(기본 10분)입니다. Organizer 역할은 지정된 총본사 admin만 부여할 수 있습니다.</div>`,
        `<span class="menu-path">HQ Policy → Trade analysis / Profit analysis</span>
        <p>Both menus are <strong>manual entry</strong>. The system does not auto-match cost rows to purchase tickets.</p>
        <ul>
          <li><strong>Trade analysis</strong> — amount sent to the broker + USDT received. Same HQ rate auto-applied. Correction and gas are typed. Fee is reverse-calculated and saved as a list.</li>
          <li><strong>Profit analysis</strong> — compare expected USDT on a purchase ticket with typed <strong>broker USDT</strong>. Profit = broker − expected.</li>
        </ul>
        <div class="warn-box">HQ admin and Organizer only. Enter Google OTP 6 digits on entry; a correct code proceeds without Verify. Duration is HQ Policy → Platform Sensitive action OTP (default 10 minutes). Only the designated HQ admin can assign Organizer.</div>`,
        `<span class="menu-path">本社ポリシー → 取引分析 / 収益分析</span>
        <p>どちらも手入力です。原価記録と購入件の自動突合はしません。</p>
        <ul>
          <li><strong>取引分析</strong> — 仲介入金と受取USDT。同一為替自動。補正・ガスは手入力。手数料を逆算して保存。</li>
          <li><strong>収益分析</strong> — 予想USDTと仲介USDTを同一チケットで比較。</li>
        </ul>
        <div class="warn-box">総本社管理者とOrganizerのみ。入場時にGoogle OTP 6桁。正しければ確認ボタンなし。維持時間は本社ポリシー→プラットフォームの機密操作OTP（既定10分）。Organizer付与は指定adminのみ。</div>`,
        `<span class="menu-path">总部策略 → 交易分析 / 收益分析</span>
        <p>两项均为手工录入，系统不会把交易分析记录自动对到采购单。</p>
        <ul>
          <li><strong>交易分析</strong> — 打给中介的金额 + 钱包收到的 USDT。自动同一汇率。校正与燃气手填。反算手续费并保存列表。</li>
          <li><strong>收益分析</strong> — 同一采购票比较预计 USDT 与中介 USDT。</li>
        </ul>
        <div class="warn-box">仅总部管理员与 Organizer。进入时输入 Google OTP 6 位，正确则无需点确认。保持时间在总部策略 → 平台「敏感操作 OTP」（默认 10 分钟）。仅指定总部管理员可授予 Organizer。</div>`,
        `<span class="menu-path">HQ Policy → วิเคราะห์ธุรกรรม / วิเคราะห์กำไร</span>
        <p>ทั้งสองเมนูกรอกเอง ระบบไม่จับคู่รายการต้นทุนกับตั๋วซื้อให้อัตโนมัติ</p>
        <ul>
          <li><strong>วิเคราะห์ธุรกรรม</strong> — ยอดโอนให้ตัวกลาง + USDT ที่วอลเล็ตได้รับ เรท HQ อัตโนมัติ ค่าปรับแก้/แก๊สกรอกเอง ค่าธรรมเนียมคำนวณย้อนแล้วบันทึกรายการ</li>
          <li><strong>วิเคราะห์กำไร</strong> — เทียบ USDT ที่คาดกับ USDT ตัวกลางในตั๋วเดียวกัน</li>
        </ul>
        <div class="warn-box">เฉพาะผู้ดูแล HQ และ Organizer กรอก Google OTP 6 หลักตอนเข้า ถูกละไม่ต้องกดยืนยัน ระยะเวลาที่ HQ Policy → แพลตฟอร์ม OTP งานสำคัญ (ค่าเริ่ม 10 นาที) มอบ Organizer ได้เฉพาะแอดมินที่กำหนด</div>`,
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
        `<span class="menu-path">本社ポリシー → 運営管理 → アップデート内容</span>
        <p>ライブ版は表紙・マニュアル・更新一覧に<strong>V{version}</strong>で表示されます。現在のライブは一覧最上段のバージョンと一致します。</p>
        <ul>
          <li><strong>主要アップデート</strong> — 2.0, 3.0, 4.0 …</li>
          <li><strong>軽微アップデート</strong> — 2.1 … 2.6 …</li>
        </ul>
        <div class="info-box">V2.6: シミュレーター・顧客管理・Sandbox手数料など、運営・顧客・組織利用マニュアルを全言語反映。</div>`,
        `<span class="menu-path">总部策略 → 运营管理 → 更新内容</span>
        <p>线上版本在封面、手册与更新列表显示为 <strong>V{version}</strong>。当前线上版本与列表首条一致。</p>
        <ul>
          <li><strong>主要更新</strong> — 2.0、3.0、4.0 …</li>
          <li><strong>次要更新</strong> — 2.1 … 2.6 …</li>
        </ul>
        <div class="info-box">V2.6：模拟器、客户管理、Sandbox 手续费等 — 运营·客户·组织使用手册全语言更新。</div>`,
        `<span class="menu-path">HQ Policy → Ops → Release notes</span>
        <p>เวอร์ชันสดแสดงเป็น <strong>V{version}</strong> บนปก คู่มือ และรายการอัปเดต เวอร์ชันสดปัจจุบันตรงกับรายการบนสุด</p>
        <ul>
          <li><strong>อัปเดตหลัก</strong> — 2.0, 3.0, 4.0 …</li>
          <li><strong>อัปเดตย่อย</strong> — 2.1 … 2.6 …</li>
        </ul>
        <div class="info-box">V2.6: ตัวจำลอง จัดการลูกค้า ค่าธรรมเนียม Sandbox — อัปเดตคู่มือปฏิบัติการ·ลูกค้า·องค์กรครบทุกภาษา</div>`
      ),
    },
    {
      id: 's7',
      title: L('FAQ', 'FAQ', 'FAQ', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">카드 결제가 비활성인데 버튼이 보입니다.</div><div class="faq-a">의도된 동작입니다. 결제관리에서 사용으로 변경하면 활성화됩니다.</div></div>
        <div class="faq-item"><div class="faq-q">고객이 서비스를 신청하지 못합니다.</div><div class="faq-a">고객관리에서 해당 고객의 서류를 확인하고 인증패스를 처리하세요. 인증패스 전에는 USDT·에스크로 신청이 막힙니다.</div></div>
        <div class="faq-item"><div class="faq-q">인증센터 메뉴가 안 보입니다.</div><div class="faq-a">총본사·조직은 고객관리로 통합되었습니다. 고객 계정만 왼쪽 인증센터에서 서류를 올립니다.</div></div>
        <div class="faq-item"><div class="faq-q">수수료율이 도식에 안 보입니다.</div><div class="faq-a">시볼 수수료의 「세팅된 수수료율 노출」에서 LIVE·Sandbox 각각 사용 여부를 확인하세요. 시뮬레이터는 Sandbox 설정을 따릅니다.</div></div>
        <div class="faq-item"><div class="faq-q">거래분석·수익분석에 OTP를 또 묻습니다.</div><div class="faq-a">의도된 동작입니다. 총본사 관리자·Organizer만 들어가며 Google OTP 6자리를 다시 확인합니다. 맞으면 확인 버튼을 누르지 않아도 진행됩니다. 유지시간은 본사정책 → 플랫폼(기본 10분)입니다.</div></div>
        <div class="faq-item"><div class="faq-q">메뉴얼 로고가 안 보입니다.</div><div class="faq-a">플랫폼 브랜딩에서 로고를 업로드했는지 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">로그인 후 브라우저 탭이 Crypto Workflow입니다.</div><div class="faq-a">플랫폼 브랜드 카드의 사이트 이름(또는 브라우저 탭 이름)을 저장하세요. 강력 새로고침 후 확인합니다.</div></div>
        <div class="faq-item"><div class="faq-q">특정 통화로 USDT 매입이 안 됩니다.</div><div class="faq-a">플랫폼 입금 수취 계좌에서 해당 통화의 이체거래·카드결제가 켜져 있는지 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">비밀번호 초기화 후 OTP가 그대로입니다.</div><div class="faq-a">OTP는 별도 「OTP 초기화」입니다. 초기화하면 다음 로그인에서 OTP를 다시 등록합니다.</div></div>
        <div class="faq-item"><div class="faq-q">JPY 가상계좌서비스(CURFEX) 건인데 고객이 증빙을 올리려 합니다.</div><div class="faq-a">가상계좌서비스(CURFEX) ON이면 증빙 업로드가 필요 없습니다. 입금 후 자동으로 <strong>입금확인중</strong>으로 넘어갑니다.</div></div>
        <div class="faq-item"><div class="faq-q">가상계좌서비스(CURFEX) 입금이 감지되지 않습니다.</div><div class="faq-a">웹훅 URL·HMAC Secret 등록 여부를 확인하세요. 티켓 「입금 상태 확인」 또는 1분 폴링을 기다리세요.</div></div>
        <div class="faq-item"><div class="faq-q">가맹점 내 지갑에 수수료 숫자가 없고 「본사설정에따름」만 보입니다.</div><div class="faq-a">고객 상세의 <strong>수수료 노출</strong>이 비활성(기본)입니다. 활성이면 가스·플랫폼 수수료가 표시됩니다.</div></div>
        <div class="faq-item"><div class="faq-q">OTP 6자리를 넣었는데 확인을 또 눌러야 하나요?</div><div class="faq-a">맞으면 확인 버튼을 누르지 않아도 진행됩니다. 유지시간은 본사정책 → 플랫폼 「민감작업 OTP 유지시간」(기본 10분, 1~60)입니다.</div></div>
        <div class="faq-item"><div class="faq-q">USDT·에스크로 목록의 시작·종료일이 비어 있지 않습니다.</div><div class="faq-a">기본은 시작 <strong>1주 전</strong>, 종료 <strong>오늘</strong>입니다. 「본사설정」 드롭다운 높이는 새로고침·내림차순과 같습니다.</div></div>
        <div class="faq-item"><div class="faq-q">가맹점 사용자관리와 본사 사용자관리가 같나요?</div><div class="faq-a">다릅니다. 본사 사용자관리는 조직 직원입니다. 가맹점 사용자관리는 대표가 운영자(최대 2명)를 다루는 화면이며, 목록은 OTP 없이 보입니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Intended: enable card under Payment management.</div></div>
        <div class="faq-item"><div class="faq-q">Customer cannot apply.</div><div class="faq-a">Open Customers, review documents, grant verification pass. USDT and escrow stay blocked until then.</div></div>
        <div class="faq-item"><div class="faq-q">Verification menu is missing for HQ.</div><div class="faq-a">It is merged into Customers. Only customer accounts upload files under Verification.</div></div>
        <div class="faq-item"><div class="faq-q">Rates missing on diagram.</div><div class="faq-a">Under symbol fees, check “Show configured fee rates” for LIVE and Sandbox separately. The simulator uses the Sandbox setting.</div></div>
        <div class="faq-item"><div class="faq-q">Trade analysis / profit asks for OTP again.</div><div class="faq-a">Intended. HQ admin and Organizer only. Enter Google OTP 6 digits; a correct code proceeds without Verify. Duration is HQ Policy → Platform (default 10 minutes).</div></div>
        <div class="faq-item"><div class="faq-q">Manual logo missing.</div><div class="faq-a">Upload a logo under Platform branding.</div></div>
        <div class="faq-item"><div class="faq-q">Tab still says Crypto Workflow after login.</div><div class="faq-a">Save site name (or tab title) on the brand card, then hard-refresh.</div></div>
        <div class="faq-item"><div class="faq-q">USDT purchase blocked for a currency.</div><div class="faq-a">Enable transfer and/or card for that currency under Platform deposit accounts.</div></div>
        <div class="faq-item"><div class="faq-q">OTP still works after password reset.</div><div class="faq-a">Use OTP reset separately. The user re-enrolls OTP at next login.</div></div>
        <div class="faq-item"><div class="faq-q">Customer tries proof upload on Virtual Account Service (CURFEX) JPY.</div><div class="faq-a">When Virtual Account Service (CURFEX) is ON, proof is not needed — deposit is auto-detected.</div></div>
        <div class="faq-item"><div class="faq-q">Virtual Account Service (CURFEX) deposit not detected.</div><div class="faq-a">Check webhook URL and HMAC in CURFEX portal. Use “Check deposit status” on ticket or wait for 1-min poll.</div></div>
        <div class="faq-item"><div class="faq-q">Merchant My wallets shows Follow HQ settings instead of fee amounts.</div><div class="faq-a">Customer detail <strong>Fee display</strong> is Inactive (default). Set Active to show gas and platform fees.</div></div>
        <div class="faq-item"><div class="faq-q">Must I tap Verify after entering 6 OTP digits?</div><div class="faq-a">No — a correct code proceeds automatically. Duration is HQ Policy → Platform Sensitive action OTP (default 10 minutes, 1–60).</div></div>
        <div class="faq-item"><div class="faq-q">USDT/escrow start and end dates are pre-filled.</div><div class="faq-a">Default is start <strong>1 week ago</strong> through end <strong>today</strong>. The HQ settings dropdown matches Refresh/Sort height.</div></div>
        <div class="faq-item"><div class="faq-q">Is merchant Users the same as HQ Users?</div><div class="faq-a">No. HQ Users is org staff. Merchant Users is the admin adding operators (max 2). The merchant list is visible without OTP.</div></div>`,
        `<div class="faq-item"><div class="faq-q">カード決済が無効なのにボタンが見えます。</div><div class="faq-a">意図した動作です。決済管理で使用にすると有効になります。</div></div>
        <div class="faq-item"><div class="faq-q">顧客がサービスを申請できません。</div><div class="faq-a">顧客管理で書類を確認し認証パスしてください。パス前はUSDT・エスクロー申請が止まります。</div></div>
        <div class="faq-item"><div class="faq-q">認証センターメニューがありません。</div><div class="faq-a">総本社・組織は顧客管理に統合されました。書類提出は顧客アカウントの左メニュー認証センターです。</div></div>
        <div class="faq-item"><div class="faq-q">手数料率が図式に出ません。</div><div class="faq-a">シンボル手数料の「設定手数料率の表示」でLIVE・Sandboxそれぞれの使用可否を確認してください。シミュレーターはSandbox設定に従います。</div></div>
        <div class="faq-item"><div class="faq-q">取引分析・収益分析でOTPを再度聞かれます。</div><div class="faq-a">意図した動作です。総本社管理者・Organizerのみ入り、Google OTP 6桁を再確認します。正しければ確認ボタンなし。維持時間は本社ポリシー→プラットフォーム（既定10分）です。</div></div>
        <div class="faq-item"><div class="faq-q">マニュアルのロゴが見えません。</div><div class="faq-a">プラットフォームブランディングでロゴをアップロードしたか確認してください。</div></div>
        <div class="faq-item"><div class="faq-q">ログイン後タブがCrypto Workflowです。</div><div class="faq-a">プラットフォームブランドカードのサイト名(またはタブ名)を保存し、強制再読込してください。</div></div>
        <div class="faq-item"><div class="faq-q">特定通貨でUSDT購入ができません。</div><div class="faq-a">プラットフォーム入金受取口座で当該通貨の振込・カードがONか確認してください。</div></div>
        <div class="faq-item"><div class="faq-q">パスワード初期化後もOTPが残っています。</div><div class="faq-a">OTPは別の「OTP初期化」です。初期化すると次回ログインでOTPを再登録します。</div></div>
        <div class="faq-item"><div class="faq-q">JPYバーチャル口座サービス(CURFEX)なのに顧客が証憑を上げようとします。</div><div class="faq-a">バーチャル口座サービス(CURFEX) ONなら証憑不要です。入金後に自動で<strong>入金確認中</strong>へ進みます。</div></div>
        <div class="faq-item"><div class="faq-q">バーチャル口座サービス(CURFEX)入金が検知されません。</div><div class="faq-a">Webhook URL・HMAC Secretの登録を確認。チケット「入金状態を確認」または1分ポーリングを待ってください。</div></div>
        <div class="faq-item"><div class="faq-q">加盟店マイウォレットに手数料数字がなく「本社設定に従う」だけです。</div><div class="faq-a">顧客詳細の<strong>手数料表示</strong>が無効（既定）です。有効にするとガス・プラットフォーム手数料が表示されます。</div></div>
        <div class="faq-item"><div class="faq-q">OTP 6桁を入れたあと確認を押す必要がありますか？</div><div class="faq-a">正しければ確認ボタンなしで進みます。維持時間は本社ポリシー→プラットフォームの機密操作OTP（既定10分、1〜60）です。</div></div>
        <div class="faq-item"><div class="faq-q">USDT・エスクロー一覧の開始・終了日が空ではありません。</div><div class="faq-a">既定は開始<strong>1週間前</strong>、終了<strong>今日</strong>です。「本社設定」ドロップダウンの高さは更新・降順と同じです。</div></div>
        <div class="faq-item"><div class="faq-q">加盟店ユーザー管理と本社ユーザー管理は同じですか？</div><div class="faq-a">違います。本社は組織スタッフ、加盟店は代表が運営者（最大2名）を扱う画面です。加盟店一覧はOTPなしで表示されます。</div></div>`,
        `<div class="faq-item"><div class="faq-q">卡支付未启用但按钮仍可见。</div><div class="faq-a">这是预期行为。在支付管理中启用后即会激活。</div></div>
        <div class="faq-item"><div class="faq-q">客户无法申请服务。</div><div class="faq-a">在客户管理核对文件并给予认证通过。未通过前 USDT·托管申请会被拦截。</div></div>
        <div class="faq-item"><div class="faq-q">看不到认证中心菜单。</div><div class="faq-a">总部·组织已并入客户管理。仅客户账号在左侧认证中心上传文件。</div></div>
        <div class="faq-item"><div class="faq-q">图示上看不到手续费率。</div><div class="faq-a">请在交易对手续费的「显示已设费率」中分别确认 LIVE 与 Sandbox。模拟器使用 Sandbox 设置。</div></div>
        <div class="faq-item"><div class="faq-q">交易分析·收益分析又要 OTP。</div><div class="faq-a">预期行为。仅总部管理员·Organizer 可进，再次输入 Google OTP 6 位。正确则无需点确认。保持时间在总部策略 → 平台（默认 10 分钟）。</div></div>
        <div class="faq-item"><div class="faq-q">手册没有 logo。</div><div class="faq-a">请确认已在平台品牌中上传 logo。</div></div>
        <div class="faq-item"><div class="faq-q">登录后浏览器标签仍是 Crypto Workflow。</div><div class="faq-a">保存平台品牌卡片的站点名（或浏览器标签名），然后强制刷新。</div></div>
        <div class="faq-item"><div class="faq-q">某币种无法做 USDT 采购。</div><div class="faq-a">在平台入金收款账户中确认该币种的转账·卡支付已开启。</div></div>
        <div class="faq-item"><div class="faq-q">密码初始化后 OTP 仍有效。</div><div class="faq-a">OTP 需单独「OTP 初始化」。初始化后下次登录需重新绑定 OTP。</div></div>
        <div class="faq-item"><div class="faq-q">JPY 虚拟账户服务(CURFEX) 单，客户仍想上传凭证。</div><div class="faq-a">开启虚拟账户服务(CURFEX) 时无需上传凭证。入金后会自动进入<strong>入金确认中</strong>。</div></div>
        <div class="faq-item"><div class="faq-q">虚拟账户服务(CURFEX) 入金未被检测到。</div><div class="faq-a">检查 Webhook URL 与 HMAC Secret 是否已登记。使用单据「检查入金状态」或等待 1 分钟轮询。</div></div>
        <div class="faq-item"><div class="faq-q">商户我的钱包没有手续费数字，只显示遵循总部设置。</div><div class="faq-a">客户详情的<strong>手续费显示</strong>为停用（默认）。启用后显示 Gas 与平台手续费。</div></div>
        <div class="faq-item"><div class="faq-q">输入 OTP 6 位后还要点确认吗？</div><div class="faq-a">正确则无需点确认。保持时间在总部策略 → 平台「敏感操作 OTP」（默认 10 分钟，1–60）。</div></div>
        <div class="faq-item"><div class="faq-q">USDT/托管列表的开始、结束日不是空的。</div><div class="faq-a">默认开始为<strong>一周前</strong>、结束为<strong>今天</strong>。「总部设置」下拉高度与刷新、降序相同。</div></div>
        <div class="faq-item"><div class="faq-q">加盟商用户管理与总部用户管理是同一页吗？</div><div class="faq-a">不是。总部用户管理是组织员工。加盟商用户管理是代表添加操作员（最多 2 名），列表无需 OTP 即可查看。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ปิดบัตรแล้วแต่ยังเห็นปุ่ม</div><div class="faq-a">เป็นพฤติกรรมที่ตั้งใจ เปิดใช้ใน Payment แล้วจะใช้งานได้</div></div>
        <div class="faq-item"><div class="faq-q">ลูกค้าสมัครบริการไม่ได้</div><div class="faq-a">เปิดจัดการลูกค้า ตรวจเอกสาร แล้วให้ผ่านการยืนยัน ก่อนผ่านจะสมัคร USDT/เอสโครว์ไม่ได้</div></div>
        <div class="faq-item"><div class="faq-q">ไม่เห็นเมนูศูนย์ยืนยัน</div><div class="faq-a">HQ·องค์กรรวมไว้ที่จัดการลูกค้าแล้ว เฉพาะบัญชีลูกค้าอัปโหลดที่ศูนย์ยืนยันด้านซ้าย</div></div>
        <div class="faq-item"><div class="faq-q">ไม่เห็นอัตราค่าธรรมเนียมในแผนภาพ</div><div class="faq-a">ตรวจ「แสดงอัตราค่าธรรมเนียมที่ตั้ง」ว่า LIVE และ Sandbox เปิดหรือไม่ ตัวจำลองใช้การตั้งค่า Sandbox</div></div>
        <div class="faq-item"><div class="faq-q">วิเคราะห์ธุรกรรม·กำไรถาม OTP อีก</div><div class="faq-a">ตั้งใจไว้ เฉพาะผู้ดูแล HQ·Organizer กรอก Google OTP 6 หลักตอนเข้า ถูกละไม่ต้องกดยืนยัน ระยะเวลาที่ HQ Policy → แพลตฟอร์ม (ค่าเริ่ม 10 นาที)</div></div>
        <div class="faq-item"><div class="faq-q">ไม่เห็นโลโก้ในคู่มือ</div><div class="faq-a">ตรวจว่าอัปโหลดโลโก้ในแบรนด์แพลตฟอร์มแล้ว</div></div>
        <div class="faq-item"><div class="faq-q">หลังเข้าสู่ระบบแท็บยังเป็น Crypto Workflow</div><div class="faq-a">บันทึกชื่อไซต์ (หรือชื่อแท็บ) ในการ์ดแบรนด์ แล้วรีเฟรชแรง</div></div>
        <div class="faq-item"><div class="faq-q">ซื้อ USDT สกุลนั้นไม่ได้</div><div class="faq-a">ตรวจว่าเปิดโอนและ/หรือบัตรของสกุลนั้นในบัญชีรับเงินบนแพลตฟอร์ม</div></div>
        <div class="faq-item"><div class="faq-q">รีเซ็ตรหัสผ่านแล้ว OTP ยังใช้ได้</div><div class="faq-a">OTP ต้อง「รีเซ็ต OTP」แยก หลังรีเซ็ตครั้งถัดไปต้องลงทะเบียน OTP ใหม่</div></div>
        <div class="faq-item"><div class="faq-q">ตั๋ว JPY บริการบัญชีเสมือน(CURFEX) แต่ลูกค้าอยากอัปโหลดสลิป</div><div class="faq-a">เมื่อบริการบัญชีเสมือน(CURFEX) เปิด ไม่ต้องอัปโหลดหลักฐาน หลังฝากจะไป<strong>กำลังตรวจสอบการฝาก</strong>อัตโนมัติ</div></div>
        <div class="faq-item"><div class="faq-q">บริการบัญชีเสมือน(CURFEX) ตรวจฝากไม่ได้</div><div class="faq-a">ตรวจ Webhook URL และ HMAC Secret ที่พอร์ทัล CURFEX ใช้「ตรวจสถานะฝาก」บนตั๋ว หรือรอ poll 1 นาที</div></div>
        <div class="faq-item"><div class="faq-q">กระเป๋าของร้านไม่โชว์ตัวเลขค่าธรรมเนียม มีแค่ตามการตั้งค่า HQ</div><div class="faq-a">การ์ด<strong>แสดงค่าธรรมเนียม</strong>ในหน้ารายละเอียดลูกค้าปิดอยู่ (ค่าเริ่ม) เปิดแล้วจะโชว์แก๊สและค่าธรรมเนียมแพลตฟอร์ม</div></div>
        <div class="faq-item"><div class="faq-q">กรอก OTP 6 หลักแล้วต้องกดยืนยันอีกไหม</div><div class="faq-a">ถูกละไม่ต้องกดยืนยัน ระยะเวลาที่ HQ Policy → แพลตฟอร์ม OTP งานสำคัญ (ค่าเริ่ม 10 นาที, 1–60)</div></div>
        <div class="faq-item"><div class="faq-q">วันเริ่ม/วันสิ้นสุดในรายการ USDT/เอสโครว์ว่างไม่ใช่</div><div class="faq-a">ค่าเริ่มคือวันเริ่ม<strong>1 สัปดาห์ก่อน</strong> วันสิ้นสุด<strong>วันนี้</strong> รายการตั้งค่า HQ สูงเท่าปุ่มรีเฟรช/เรียง</div></div>
        <div class="faq-item"><div class="faq-q">จัดการผู้ใช้ของร้านกับของ HQ เป็นหน้าเดียวกันไหม</div><div class="faq-a">ไม่ใช่ HQ คือพนักงานองค์กร ร้านคือแอดมินเพิ่มผู้ปฏิบัติงานสูงสุด 2 คน ดูรายการร้านได้โดยไม่ต้อง OTP</div></div>`
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
        </ul>
        <div class="info-box">Create child orgs (branch, agency, sales office, etc.) under <strong>Organizations</strong>, or via “Register new org” when creating a user.</div>`,
        `<p>組織スタッフ(<strong>ORG_STAFF</strong>)は所属組織パス配下のデータを照会・処理します。<strong>本社ポリシー</strong>は総本社専用です。</p>
        <ul>
          <li>USDT購入 / 貿易エスクロー / 手数料台帳</li>
          <li><strong>ユーザー管理</strong> — 組織スタッフのみ</li>
          <li><strong>顧客管理</strong> — 利用会員、有効状態、認証状態、書類閲覧</li>
          <li>組織管理 / 利用マニュアル</li>
        </ul>
        <div class="info-box">下位組織(支店・代理店・営業店など)は<strong>組織管理</strong>で登録するか、ユーザー登録時の「新規組織登録」で作れます。</div>`,
        `<p>组织员工（<strong>ORG_STAFF</strong>）可查询·处理所属组织路径下的数据。<strong>总部策略</strong>仅总部可用。</p>
        <ul>
          <li>USDT 采购 / 贸易托管 / 手续费台账</li>
          <li><strong>用户管理</strong> — 仅组织员工</li>
          <li><strong>客户管理</strong> — 终端会员、启用状态、认证状态、文件查阅</li>
          <li>组织管理 / 使用手册</li>
        </ul>
        <div class="info-box">下级组织（分公司·代理·营业点等）在<strong>组织管理</strong>中登记，或在用户注册时通过「新组织登记」创建。</div>`,
        `<p>พนักงานองค์กร (<strong>ORG_STAFF</strong>) ดูและจัดการข้อมูลในเส้นทางองค์กรของตน <strong>HQ Policy</strong> เป็นของสำนักงานใหญ่เท่านั้น</p>
        <ul>
          <li>ซื้อ USDT / เอสโครว์การค้า / บัญชีค่าธรรมเนียม</li>
          <li><strong>จัดการผู้ใช้</strong> — เฉพาะพนักงานองค์กร</li>
          <li><strong>จัดการลูกค้า</strong> — สมาชิกผู้ใช้ สถานะใช้งาน สถานะยืนยัน และเอกสาร</li>
          <li>จัดการองค์กร / คู่มือใช้งาน</li>
        </ul>
        <div class="info-box">องค์กรย่อย (สาขา·เอเย่นต์·สำนักงานขาย ฯลฯ) ลงทะเบียนที่ <strong>จัดการองค์กร</strong> หรือตอนสร้างผู้ใช้ด้วย「ลงทะเบียนองค์กรใหม่」</div>`
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
        <p>組織スタッフは<strong>ユーザー管理</strong>、配下の利用会員は<strong>顧客管理</strong>で同様に処理します。</p>
        <ul>
          <li><strong>パスワード初期化</strong> — 仮パスワードはメールID + 1! です。次回ログインで新しいパスワード設定が必要です。</li>
          <li><strong>OTP初期化</strong> — OTP秘密鍵を削除します。次回ログインでOTPを再登録します。パスワード初期化とは別です。</li>
        </ul>
        <div class="info-box">権限範囲内の組織スタッフ・顧客のみ初期化できます。総本社ポリシー(通貨・ブランド)は変更できません。</div>`,
        `<span class="menu-path">用户管理 · 客户管理</span>
        <p>组织员工在<strong>用户管理</strong>，范围内终端会员在<strong>客户管理</strong>，规则相同。</p>
        <ul>
          <li><strong>密码初始化</strong> — 临时密码为邮箱 ID + 1!。下次登录须设置新密码。</li>
          <li><strong>OTP 初始化</strong> — 清除 OTP 密钥。下次登录须重新绑定。与密码初始化无关。</li>
        </ul>
        <div class="info-box">仅可初始化权限范围内的组织员工与客户。无法更改总部策略（币种·品牌）。</div>`,
        `<span class="menu-path">จัดการผู้ใช้ · จัดการลูกค้า</span>
        <p>พนักงานองค์กรที่ <strong>จัดการผู้ใช้</strong> สมาชิกในขอบเขตที่ <strong>จัดการลูกค้า</strong> — กฎเดียวกัน</p>
        <ul>
          <li><strong>รีเซ็ตรหัสผ่าน</strong> — รหัสชั่วคราวคือ ID อีเมล + 1! เข้าสู่ระบบครั้งถัดไปต้องตั้งรหัสใหม่</li>
          <li><strong>รีเซ็ต OTP</strong> — ลบรหัสลับ OTP ครั้งถัดไปต้องลงทะเบียน OTP ใหม่ แยกจากรีเซ็ตรหัสผ่าน</li>
        </ul>
        <div class="info-box">รีเซ็ตได้เฉพาะพนักงานและลูกค้าในขอบเขตสิทธิ์ แก้โยบาย HQ (สกุลเงิน·แบรนด์) ไม่ได้</div>`
      ),
    },
    {
      id: 'o2',
      title: L('일일 업무', 'Daily work', '日常業務', '日常工作', 'งานประจำวัน'),
      bodyHtml: L(
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">고객이 인증센터에 서류를 올렸는지 고객관리에서 확인</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">USDT/에스크로 목록에서 대기 건 확인</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">증빙·상태 검토 후 다음 단계 처리 (가상계좌서비스(CURFEX) JPY는 입금 자동감지 — 증빙 불필요)</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">장부에서 수수료 배분 확인</span></div>
        </div>
        <div class="info-box">고객에게는 인증센터 → 지갑 → 시뮬레이터 → 매입 순서를 안내하세요. 인증패스는 총본사만 처리합니다.</div>
        <div class="warn-box">카드 결제·수수료율 변경은 총본사 결제관리·수수료 정책에서만 가능합니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Check Customers for Verification submissions</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Check pending USDT/escrow</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Review proofs and advance status (Virtual Account Service (CURFEX) JPY: auto deposit — no proof)</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Verify ledger shares</span></div>
        </div>
        <div class="info-box">Guide customers: Verification → wallet → simulator → purchase. Only HQ grants the pass.</div>
        <div class="warn-box">Card payment and fee-rate changes are HQ-only (Payment / fee policy).</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">顧客管理で認証センター提出の有無を確認</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">USDT/エスクロー一覧で待機件を確認</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">証憑・状態を確認し次工程へ（バーチャル口座サービス(CURFEX) JPYは入金自動検知 — 証憑不要）</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">台帳で手数料配分を確認</span></div>
        </div>
        <div class="info-box">顧客には認証センター → ウォレット → シミュレーター → 購入の順を案内。認証パスは総本社のみ。</div>
        <div class="warn-box">カード決済・手数料率変更は総本社の決済管理・手数料ポリシーのみ可能です。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">在客户管理确认客户是否已在认证中心提交文件</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">在 USDT/托管列表查看待处理单</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">核对凭证与状态并推进（虚拟账户服务(CURFEX) JPY 为自动检测入金 — 无需凭证）</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">在台账确认手续费分配</span></div>
        </div>
        <div class="info-box">引导客户：认证中心 → 钱包 → 模拟器 → 采购。认证通过仅总部处理。</div>
        <div class="warn-box">卡支付与费率变更仅能在总部支付管理·手续费政策中修改。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">ตรวจในจัดการลูกค้าว่าลูกค้าส่งเอกสารที่ศูนย์ยืนยันแล้วหรือยัง</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ดูรายการรอใน USDT/เอสโครว์</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">ตรวจหลักฐาน·สถานะแล้วเดินต่อ (JPY บริการบัญชีเสมือน(CURFEX): ตรวจฝากอัตโนมัติ — ไม่ต้องสลิป)</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ตรวจการแบ่งค่าธรรมเนียมในบัญชี</span></div>
        </div>
        <div class="info-box">แนะนำลูกค้า: ศูนย์ยืนยัน → กระเป๋า → ตัวจำลอง → ซื้อ ให้ผ่านได้เฉพาะ HQ</div>
        <div class="warn-box">แก้บัตรและอัตราค่าธรรมเนียมได้เฉพาะที่ Payment / นโยบายค่าธรรมเนียมของ HQ</div>`
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
      id: 'org-deposit-care',
      title: L('계좌 이체 입금 주의사항', 'Bank deposit precautions', '口座振込入金の注意', '银行转账入金注意', 'ข้อควรระวังการโอนฝาก'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입 → 티켓 상세</span>
        <p>고정 수취계좌(<strong>전용계좌</strong>) 또는 <strong>가상계좌</strong>로 고객이 입금할 때, 운영자도 아래를 확인해 주세요.</p>
        <ul>
          <li><strong>수취인명·계좌번호</strong>는 화면의 <strong>복사</strong> 버튼으로 붙여 넣도록 안내하세요. 수취인명은 <strong>半角カタカナ 원문</strong>이며 UI 언어를 바꿔도 번역되지 않습니다.</li>
          <li>은행명·은행코드·지점코드·참조번호(가상계좌)도 티켓에 <strong>복사</strong>가 있습니다. 임의 입력·띄어쓰기 변경은 입금 실패·지연 원인이 됩니다.</li>
          <li>전용계좌 건은 등록 통장에서 송금 후 <strong>신청 시 송금증</strong>을 첨부합니다. 가상계좌 건은 건별 계좌만 사용(송금증 없음).</li>
        </ul>
        <div class="warn-box">입금자명과 등록 통장 예금주가 다르면 통장 불일치로 거래가 지연·중지될 수 있습니다.</div>`,
        `<span class="menu-path">USDT purchase → ticket detail</span>
        <p>When customers deposit to a fixed account or a <strong>virtual account</strong>, operators should verify:</p>
        <ul>
          <li>Ask customers to use <strong>Copy</strong> for <strong>beneficiary and account number</strong>. The beneficiary stays <strong>half-width katakana</strong> and does not change with UI language.</li>
          <li>Bank name, bank/branch codes, and VA reference also have <strong>Copy</strong> on the ticket. Manual edits or spacing changes can fail or delay the deposit.</li>
          <li>Fixed-account tickets still need deposit proof from the registered bank. Virtual-account tickets use the per-ticket account only (no proof).</li>
        </ul>
        <div class="warn-box">If the depositor name does not match the registered bank account holder, the trade may be delayed or stopped (bank mismatch).</div>`,
        `<span class="menu-path">USDT購入 → チケット詳細</span>
        <p>固定受取口座または<strong>バーチャル口座</strong>への入金時、運営者も以下を確認してください。</p>
        <ul>
          <li><strong>受取人名・口座番号</strong>は画面の<strong>コピー</strong>で貼り付けさせてください。受取人名は<strong>半角カタカナ原文</strong>で、UI言語を変えても翻訳されません。</li>
          <li>銀行名・銀行/支店コード・参照番号（バーチャル）にも<strong>コピー</strong>があります。手入力・スペース変更は失敗・遅延の原因です。</li>
          <li>固定口座件は登録通帳からの送金と入金証憑が必要です。バーチャル件は取引専用口座のみ（証憑なし）。</li>
        </ul>
        <div class="warn-box">入金者名と登録通帳の名義が異なると、通帳不一致で遅延・停止することがあります。</div>`,
        `<span class="menu-path">USDT 采购 → 单据详情</span>
        <p>客户向固定收款账户或<strong>虚拟账户</strong>入金时，运营也请核对：</p>
        <ul>
          <li>请引导客户用<strong>复制</strong>粘贴<strong>收款人与账号</strong>。收款人为<strong>半角片假名原文</strong>，切换界面语言不会翻译。</li>
          <li>银行名、银行/分行代码、虚拟账户参考号也有<strong>复制</strong>。手改或改空格可能导致失败或延迟。</li>
          <li>固定账户单仍须从注册账户汇款并上传凭证；虚拟账户单仅用按单账户（无需凭证）。</li>
        </ul>
        <div class="warn-box">入金人姓名与注册账户户名不一致时，可能因账户不符而延迟或中止。</div>`,
        `<span class="menu-path">ซื้อ USDT → รายละเอียดตั๋ว</span>
        <p>เมื่อลูกค้าฝากเข้าบัญชีคงที่หรือ<strong>บัญชีเสมือน</strong> ผู้ดำเนินการควรตรวจดังนี้</p>
        <ul>
          <li>แนะนำให้ใช้ปุ่ม<strong>คัดลอก</strong>สำหรับ<strong>ชื่อผู้รับและเลขบัญชี</strong> ชื่อผู้รับเป็น<strong>คาตาคานะครึ่งความกว้าง</strong> และไม่แปลเมื่อเปลี่ยนภาษา UI</li>
          <li>ชื่อธนาคาร รหัสสาขา และเลขอ้างอิง VA ก็มี<strong>คัดลอก</strong> การพิมพ์เองหรือเว้นวรรคผิดอาจทำให้ฝากล้มเหลวหรือล่าช้า</li>
          <li>บัญชีคงที่ต้องโอนจากบัญชีที่ลงทะเบียนและอัปโหลดสลิป บัญชีเสมือน ใช้เฉพาะบัญชีรายตั๋ว (ไม่มีสลิป)</li>
        </ul>
        <div class="warn-box">ถ้าชื่อผู้ฝากไม่ตรงกับชื่อบัญชีที่ลงทะเบียน ธุรกรรมอาจล่าช้าหรือหยุด (บัญชีไม่ตรง)</div>`
      ),
    },
    {
      id: 'org-curfex',
      title: L('JPY 가상계좌서비스(CURFEX) 입금 처리', 'JPY Virtual Account Service (CURFEX) deposit handling', 'JPY バーチャル口座サービス(CURFEX)入金処理', 'JPY 虚拟账户服务(CURFEX) 入金处理', 'จัดการฝาก JPY บริการบัญชีเสมือน(CURFEX)'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입</span>
        <p>본사가 가상계좌서비스(CURFEX)를 켠 JPY 건은 <strong>입금 증빙 검토가 없습니다</strong>. 입금이 감지되면 티켓이 <strong>입금확인중</strong>으로 옵니다.</p>
        <ul>
          <li>티켓·목록에는 <strong>가상계좌</strong>로 표시되며, 상세에 건별 계좌·참조번호가 나옵니다.</li>
          <li>고객은 증빙을 올리지 않습니다 — 웹훅/폴링으로 입금 확인.</li>
          <li>운영자는 입금 확인 후 USDT 송금·TXID 등록 (기존과 동일).</li>
          <li>「입금 상태 확인」으로 CURFEX 상태를 수동 동기화할 수 있습니다.</li>
        </ul>
        <div class="warn-box">KRW·THB·CNY 등 전용계좌 건은 기존처럼 증빙을 검토하세요. 가상계좌서비스(CURFEX) 설정은 총본사만 변경합니다.</div>`,
        `<span class="menu-path">USDT purchase</span>
        <p>When HQ enables Virtual Account Service (CURFEX) for JPY, there is <strong>no deposit proof review</strong>. Detected deposits move tickets to <strong>deposit verifying</strong>.</p>
        <ul>
          <li>Ticket shows Virtual Account Service (CURFEX)-issued account and reference.</li>
          <li>Customers do not upload proof — webhook/poll confirms deposit.</li>
          <li>Operator sends USDT and registers TXID as usual.</li>
          <li>Use “Check deposit status” to sync manually if needed.</li>
        </ul>
        <div class="warn-box">Fixed-account tickets (KRW/THB/CNY etc.) still need proof review. Only HQ changes Virtual Account Service (CURFEX) settings.</div>`,
        `<span class="menu-path">USDT購入</span>
        <p>総本社がバーチャル口座サービス(CURFEX)をONにしたJPY件は<strong>入金証憑の確認がありません</strong>。入金が検知されるとチケットが<strong>入金確認中</strong>に入ります。</p>
        <ul>
          <li>チケットに「入金口座（バーチャル口座サービス(CURFEX)発行）」・CURFEX参照番号が表示されます。</li>
          <li>顧客は証憑を上げません — Webhook/ポーリングで入金確認。</li>
          <li>運営者は入金確認後にUSDT送金・TXID登録（従来どおり）。</li>
          <li>「入金状態を確認」でCURFEX状態を手動同期できます。</li>
        </ul>
        <div class="warn-box">KRW・THB・CNYなど固定口座件は従来どおり証憑を確認してください。バーチャル口座サービス(CURFEX)設定は総本社のみ変更します。</div>`,
        `<span class="menu-path">USDT 采购</span>
        <p>总部开启虚拟账户服务(CURFEX) 的 JPY 单<strong>无需审核入金凭证</strong>。检测到入金后单据进入<strong>入金确认中</strong>。</p>
        <ul>
          <li>单据显示「入金账户（虚拟账户服务(CURFEX) 开立）」与 CURFEX 参考号。</li>
          <li>客户不上传凭证 — 由 Webhook/轮询确认入金。</li>
          <li>运营在确认入金后发送 USDT 并登记 TXID（与以往相同）。</li>
          <li>可用「检查入金状态」手动同步 CURFEX。</li>
        </ul>
        <div class="warn-box">KRW·THB·CNY 等固定账户单仍需审核凭证。虚拟账户服务(CURFEX) 设置仅总部可改。</div>`,
        `<span class="menu-path">ซื้อ USDT</span>
        <p>เมื่อ HQ เปิดบริการบัญชีเสมือน(CURFEX) สำหรับ JPY <strong>ไม่ต้องตรวจหลักฐานฝาก</strong> เมื่อตรวจฝากได้ตั๋วจะเข้า<strong>กำลังตรวจสอบการฝาก</strong></p>
        <ul>
          <li>ตั๋วแสดง「บัญชีฝาก (ออกโดยบริการบัญชีเสมือน(CURFEX))」และเลขอ้างอิง CURFEX</li>
          <li>ลูกค้าไม่อัปโหลดหลักฐาน — Webhook/poll ยืนยันฝาก</li>
          <li>ผู้ดำเนินการส่ง USDT และลงทะเบียน TXID หลังยืนยันฝาก (ตามเดิม)</li>
          <li>ใช้「ตรวจสถานะฝาก」ซิงก์ CURFEX ด้วยมือได้</li>
        </ul>
        <div class="warn-box">ตั๋วบัญชีคงที่ (KRW·THB·CNY ฯลฯ) ยังต้องตรวจสลิป การตั้งบริการบัญชีเสมือน(CURFEX) แก้ได้เฉพาะ HQ</div>`
      ),
    },
  ],
};

export const CUSTOMER_MANUAL: ManualDoc = {
  id: 'customer',
  coverTitle: L('고객용 사용 메뉴얼', 'Customer User Manual', '顧客向け利用マニュアル', '客户使用手册', 'คู่มือผู้ใช้สำหรับลูกค้า'),
  coverSubtitle: L(
    '대표 로그인 → 인증패스 → 본사 등록 지갑 → 시뮬레이터 → 매입·에스크로 · 운영자(최대 2명)',
    'Admin login → verification pass → HQ wallet → simulator → purchase & escrow · operators (max 2)',
    '代表ログイン→認証パス→本社登録ウォレット→シミュレーター→購入・エスクロー・運営者(最大2名)',
    '代表登录 → 认证通过 → 总部登记钱包 → 模拟器 → 采购·托管 · 操作员(最多2名)',
    'เข้าสู่ระบบตัวแทน → ผ่านยืนยัน → กระเป๋า HQ → ตัวจำลอง → ซื้อ·เอสโครว์ · ผู้ปฏิบัติงาน (สูงสุด 2)',
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
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">본사가 등록한 <strong>기본 지갑</strong>이 승인되어 있는지 확인합니다. 주소는 가맹점이 바꿀 수 없습니다. 추가 지갑은 내 지갑에서 등록 후 본사 승인을 기다립니다.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>USDT 시뮬레이터</strong>에서 네트워크를 고르고 입금액 또는 받을 USDT로 수수료·수령액을 미리 봅니다. 최근 결과는 최대 3건입니다.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>인증패스 후</strong> USDT 매입 또는 무역 에스크로를 신청합니다.</span></div>
        </div>
        <div class="warn-box">인증패스 전에는 USDT 매입·무역 에스크로 신청이 불가합니다. 시뮬레이터는 <strong>참고용 미리 계산</strong>이며 실제 신청·확정 금액이 아닙니다.</div>
        <div class="info-box">대시보드에는 시뮬레이터 최근 결과가 2건만 보입니다. 언어는 상단에서 바꿉니다. 유휴 시간이 지나면 자동 로그아웃됩니다. 본사가 멀티 사용자를 허용하면 대표(관리자)만 운영자를 등록할 수 있습니다.</div>`,
        `<p>Follow this order. Later steps stay blocked until earlier ones are done.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Register (phone + country code) and sign in. Enter Google OTP if asked.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Upload documents in <strong>Verification</strong>. Download templates from <strong>Usage manuals</strong>.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">When status is <strong>Under review</strong>, wait for HQ verification pass. If rejected, read the reason and resubmit.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Confirm the <strong>HQ-registered default wallet</strong> is approved. You cannot change that address. Extra wallets: add in My wallets, then wait for HQ approval.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">Open <strong>USDT simulator</strong>, choose a network, and preview fees from deposit or target USDT. Up to 3 recent results are kept.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">After a <strong>verification pass</strong>, apply for USDT purchase or trade escrow.</span></div>
        </div>
        <div class="warn-box">USDT purchase and escrow stay blocked until you have a pass. The simulator is a <strong>reference preview only</strong>, not an application or binding amount.</div>
        <div class="info-box">Dashboard shows only 2 recent simulator results. Change language in the top bar. Idle timeout signs you out. If HQ enabled multi-user, only the admin can add operators.</div>`,
        `<p>次の順番どおりに進めてください。前の段階が終わるまで次が止まることがあります。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">会員登録(電話・国番号)→ログイン。Google OTPがあれば入力。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">左の<strong>認証センター</strong>で書類をアップロード。様式は<strong>利用マニュアル</strong>から。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>審査中</strong>なら総本社の認証パスを待つ。差戻しなら理由を見て再提出。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">本社登録の<strong>既定ウォレット</strong>が承認済みか確認。そのアドレスは加盟店が変更できません。追加ウォレットはマイウォレットで登録後、本社承認を待ちます。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>USDTシミュレーター</strong>でネットワークを選び、入金または受取USDTで手数料を確認。直近最大3件。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>認証パス後</strong>にUSDT購入または貿易エスクローを申請。</span></div>
        </div>
        <div class="warn-box">認証パス前はUSDT購入・エスクロー申請不可。シミュレーターは<strong>参考用の試算</strong>で申請・確定金額ではありません。</div>
        <div class="info-box">ダッシュボードのシミュレーター表示は2件です。言語は上部で切替。アイドルで自動ログアウト。本社がマルチユーザーを許可した場合、代表(管理者)のみ運営者を登録できます。</div>`,
        `<p>请按此顺序操作。前一步未完成时，后一步可能无法进行。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">注册（手机+国家号）并登录。如需 Google OTP 请输入。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">在左侧<strong>认证中心</strong>上传文件。模板从<strong>使用手册</strong>下载。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">状态为<strong>审核中</strong>时等待总部认证通过。退回则按原因重交。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">确认总部登记的<strong>默认钱包</strong>已批准。该地址加盟商不能改。额外钱包在我的钱包登记后等待总部批准。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">打开<strong>USDT 模拟器</strong>，选择网络，按入金或目标 USDT 预览手续费。最多保留 3 条。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>认证通过后</strong>再申请 USDT 采购或贸易托管。</span></div>
        </div>
        <div class="warn-box">未通过认证前无法申请采购或托管。模拟器为<strong>仅供参考的试算</strong>，不是申请或确定金额。</div>
        <div class="info-box">仪表盘模拟器预览只显示 2 条。语言在顶部切换。空闲会自动退出。总部开启多用户后，仅代表(管理员)可登记操作员。</div>`,
        `<p>ทำตามลำดับนี้ ขั้นหลังอาจถูกบล็อกจนกว่าขั้นก่อนจะเสร็จ</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">สมัคร (โทรศัพท์+รหัสประเทศ) แล้วเข้าสู่ระบบ ใส่ Google OTP หากมี</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">อัปโหลดเอกสารที่ <strong>ศูนย์ยืนยัน</strong> ดาวน์โหลดแบบฟอร์มจาก <strong>คู่มือใช้งาน</strong></span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">เมื่อสถานะ <strong>กำลังตรวจสอบ</strong> รอ HQ ให้ผ่าน หากถูกปฏิเสธอ่านเหตุผลแล้วส่งใหม่</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ตรวจว่า<strong>กระเป๋าเริ่มต้นที่ HQ ลงทะเบียน</strong>ได้รับอนุมัติแล้ว ที่อยู่นี้ร้านค้าแก้ไม่ได้ กระเป๋าเพิ่ม: ลงที่กระเป๋าของฉันแล้วรอ HQ อนุมัติ</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">เปิด <strong>ตัวจำลอง USDT</strong> เลือกเครือข่าย ดูค่าธรรมเนียมจากยอดฝากหรือ USDT ที่จะรับ เก็บได้สูงสุด 3 รายการ</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">หลัง <strong>ผ่านการยืนยัน</strong> ค่อยสมัครซื้อ USDT หรือเอสโครว์</span></div>
        </div>
        <div class="warn-box">ยังไม่ผ่านจะสมัครซื้อ/เอสโครว์ไม่ได้ ตัวจำลองเป็น<strong>การอ้างอิงเท่านั้น</strong> ไม่ใช่การสมัครหรือจำนวนเงินที่ผูกพัน</div>
        <div class="info-box">แดชบอร์ดโชว์ผลจำลอง 2 รายการ เปลี่ยนภาษาด้านบน หากไม่ใช้งานจะออกจากระบบอัตโนมัติ หาก HQ เปิดหลายผู้ใช้ ตัวแทน(แอดมิน)เท่านั้นที่เพิ่มผู้ปฏิบัติงานได้</div>`,
      ),
    },
    {
      id: 'c-quick',
      title: L(
        '간편사용하기 · USDT 입금 순서',
        'Quick start · USDT deposit steps',
        'かんたん利用 · USDT入金の順番',
        '简易使用 · USDT 入金顺序',
        'ใช้งานง่าย · ลำดับฝาก USDT',
      ),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입</span>
        <p>계좌이체 USDT 매입은 <strong>두 가지 방식</strong>이 있습니다. 목록·상세의 <strong>수취방식</strong>이 <strong>전용계좌</strong>인지 <strong>가상계좌</strong>인지로 구분합니다. <strong>송금증은 전용계좌일 때 신청 시 필수</strong>이며, <strong>가상계좌</strong>에서는 올리지 않습니다.</p>
        <table><thead><tr><th>구분</th><th>어떻게 알까?</th><th>송금증</th></tr></thead><tbody>
        <tr><td><strong>전용계좌</strong></td><td>수취방식이 「전용계좌」. 신청 화면에 이미 은행·계좌가 보임</td><td><strong>필수</strong> (신청 시 첨부)</td></tr>
        <tr><td><strong>가상계좌</strong></td><td>수취방식이 「가상계좌」. 제출 후 상세에 「이 거래 전용」계좌가 새로 발급됨</td><td><strong>없음</strong> (입금만 하면 자동 확인)</td></tr>
        </tbody></table>
        <p class="mt-3"><strong>A. 전용계좌 — 순서</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT 매입 → 신규신청. 통화·금액·승인 지갑 선택</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">신청 화면에 안내된 <strong>전용계좌</strong>를 확인 — <strong>계좌번호·수취인명 복사</strong>로 붙여 넣기</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">본인 통장에서 해당 계좌로 송금</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>자금 원천 증빙</strong>과 <strong>송금증</strong>을 첨부하고 제출</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">상태가 「입금확인중」등이 되면 본사 확인·USDT 송금·완료를 기다림</span></div>
        </div>
        <p class="mt-3"><strong>B. 가상계좌 — 순서</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT 매입 → 신규신청. 통화·금액·승인 지갑 선택</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>자금 원천 증빙만</strong> 올리고 제출 (송금증 칸 없음)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">제출 직후 티켓 상세에 <strong>이 건 전용 가상계좌</strong>가 발급·표시됨</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">안내에 나온 계좌·수취인명을 <strong>복사</strong>로 붙여 넣어 송금 (다른 티켓 계좌와 섞지 않음)</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">송금증을 <strong>올리지 않음</strong>. 시스템이 입금을 자동 확인</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">상태가 「입금확인중」등이 되면 USDT 송금·완료를 기다림</span></div>
        </div>
        <div class="check-box">가상계좌는 <strong>신청마다 새로 발급</strong>됩니다. 공용 계좌 하나에 입금만 통보되는 방식이 아닙니다.</div>
        <div class="warn-box"><strong>계좌번호·수취인명은 반드시 「복사」</strong>로 붙여 넣으세요. 은행명·코드·참조번호도 복사할 수 있습니다. 등록한 본인 통장에서만 송금하세요.</div>`,
        `<span class="menu-path">USDT purchase</span>
        <p>Bank-transfer USDT purchase has <strong>two modes</strong>. Check the <strong>Receipt method</strong> column: <strong>Dedicated account</strong> or <strong>Virtual account</strong>. A <strong>remittance slip is required at apply for a dedicated account</strong>. With a <strong>virtual account</strong>, you do <strong>not</strong> upload a slip.</p>
        <table><thead><tr><th>Mode</th><th>How to tell</th><th>Remittance slip</th></tr></thead><tbody>
        <tr><td><strong>Dedicated account</strong></td><td>Receipt method shows “Dedicated account”. Bank details already on the apply form</td><td><strong>Required</strong> (attach at apply)</td></tr>
        <tr><td><strong>Virtual account</strong></td><td>Receipt method shows “Virtual account”. After submit, a <strong>per-ticket</strong> account is issued on the detail page</td><td><strong>None</strong> (auto-confirm after transfer)</td></tr>
        </tbody></table>
        <p class="mt-3"><strong>A. Dedicated account — steps</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT → New application. Choose currency, amount, approved wallet</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Check the <strong>dedicated account</strong> on the form — use <strong>Copy</strong> for account number and beneficiary</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Transfer from your registered bank to that account</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Attach <strong>source-of-funds</strong> and the <strong>remittance slip</strong>, then submit</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">When status becomes deposit verifying (etc.), wait for HQ review and USDT</span></div>
        </div>
        <p class="mt-3"><strong>B. Virtual account — steps</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT → New application. Choose currency, amount, approved wallet</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Upload <strong>source-of-funds only</strong> and submit (no receipt field)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Right after submit, detail shows a <strong>virtual account for this ticket only</strong></span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">Transfer exactly to that account and beneficiary (do not mix tickets)</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">Do <strong>not</strong> upload a receipt. The system confirms the deposit automatically</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">When status becomes deposit verifying (etc.), wait for USDT</span></div>
        </div>
        <div class="check-box">A virtual account is <strong>issued per application</strong>. It is not one shared account that only notifies on deposit.</div>
        <div class="warn-box">Use <strong>Copy</strong> for account number and beneficiary. Bank name, codes, and reference can also be copied. Transfer only from your registered bank account.</div>`,
        `<span class="menu-path">USDT購入</span>
        <p>口座振込USDT購入には<strong>2つの方式</strong>があります。一覧・詳細の<strong>受取方式</strong>が<strong>専用口座</strong>か<strong>バーチャル口座</strong>かで見分けます。<strong>送金証は専用口座の申請時に必須</strong>で、<strong>バーチャル口座</strong>ではアップロードしません。</p>
        <table><thead><tr><th>区分</th><th>見分け方</th><th>送金証</th></tr></thead><tbody>
        <tr><td><strong>専用口座</strong></td><td>受取方式が「専用口座」。申請画面にすでに銀行・口座が表示</td><td><strong>必須</strong>（申請時に添付）</td></tr>
        <tr><td><strong>バーチャル口座</strong></td><td>受取方式が「バーチャル口座」。提出後、詳細に<strong>この取引専用</strong>口座が発行</td><td><strong>不要</strong>（入金後に自動確認）</td></tr>
        </tbody></table>
        <p class="mt-3"><strong>A. 専用口座 — 順番</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT購入→新規申請。通貨・金額・承認済みウォレットを選択</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">申請画面の<strong>専用口座</strong>を確認 — <strong>口座番号・受取人名をコピー</strong>して貼り付け</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">登録通帳から当該口座へ送金</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>資金原資証憑</strong>と<strong>送金証</strong>を添付して提出</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">「入金確認中」などになったら本社確認・USDT送金・完了を待つ</span></div>
        </div>
        <p class="mt-3"><strong>B. バーチャル口座 — 順番</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT購入→新規申請。通貨・金額・承認済みウォレットを選択</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>資金原資証憑のみ</strong>アップロードして提出（送金証憑欄なし）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">提出直後、詳細に<strong>この件専用のバーチャル口座</strong>が発行・表示</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">案内どおりの口座・受取人名へ送金（他チケットと混ぜない）</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">送金証憑は<strong>アップロードしない</strong>。システムが入金を自動確認</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">「入金確認中」などになったらUSDT送金・完了を待つ</span></div>
        </div>
        <div class="check-box">バーチャル口座は<strong>申請ごとに新規発行</strong>されます。共有口座1つに入金通知だけ来る方式ではありません。</div>
        <div class="warn-box">受取人名は画面の「コピー」でそのまま貼り付けてください。登録した本人通帳からのみ送金してください。</div>`,
        `<span class="menu-path">USDT 采购</span>
        <p>银行转账购买 USDT 有<strong>两种方式</strong>，以列表/详情的<strong>收款方式</strong>区分：<strong>专用账户</strong>或<strong>虚拟账户</strong>。<strong>汇款凭证须在专用账户申请时一并上传</strong>；使用<strong>虚拟账户</strong>时<strong>不上传</strong>凭证。</p>
        <table><thead><tr><th>类型</th><th>如何分辨</th><th>汇款凭证</th></tr></thead><tbody>
        <tr><td><strong>专用账户</strong></td><td>收款方式显示「专用账户」。申请页已显示银行与账号</td><td><strong>必填</strong>（申请时附上）</td></tr>
        <tr><td><strong>虚拟账户</strong></td><td>收款方式显示「虚拟账户」。提交后详情页开立<strong>本单专用</strong>账户</td><td><strong>不需要</strong>（入金后自动确认）</td></tr>
        </tbody></table>
        <p class="mt-3"><strong>A. 专用账户 — 顺序</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT 采购 → 新申请。选择币种、金额、已批准钱包</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">在申请页确认<strong>专用账户</strong> — 用<strong>复制</strong>粘贴账号与收款人</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">从本人注册账户向该账户转账</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">附上<strong>资金来源证明</strong>与<strong>汇款凭证</strong>后提交</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">状态变为「入金确认中」等后等待总部确认并发送 USDT</span></div>
        </div>
        <p class="mt-3"><strong>B. 虚拟账户 — 顺序</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">USDT 采购 → 新申请。选择币种、金额、已批准钱包</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">仅上传<strong>资金来源证明</strong>并提交（无汇款凭证栏）</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">提交后详情页立即显示<strong>本单专用 虚拟账户</strong></span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">按指引向该账户与收款人转账（勿与其他单据混用）</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>不要</strong>上传汇款凭证。系统自动确认入金</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">状态变为「入金确认中」等后等待 USDT</span></div>
        </div>
        <div class="check-box">虚拟账户<strong>每次申请单独开立</strong>，不是共用一个账户仅通知入金。</div>
        <div class="warn-box">请用「复制收款人」原样粘贴。仅从已登记本人账户汇款。</div>`,
        `<span class="menu-path">ซื้อ USDT</span>
        <p>การซื้อ USDT ด้วยโอนบัญชีมี<strong>สองแบบ</strong> แยกจากบัญชีที่เห็นบนจอ <strong>สลิปโอนจำเป็นเฉพาะบัญชีคงที่</strong> ส่วน<strong>บัญชีเสมือน</strong> <strong>ไม่ต้อง</strong>อัปโหลดสลิป</p>
        <table><thead><tr><th>แบบ</th><th>ดูอย่างไร</th><th>สลิปโอน</th></tr></thead><tbody>
        <tr><td><strong>บัญชีรับคงที่</strong></td><td>หน้าสมัครมีธนาคาร·เลขบัญชีแล้ว รายละเอียดก็บัญชีเดิม</td><td><strong>ต้องมี</strong> (อัปโหลดที่รายละเอียด)</td></tr>
        <tr><td><strong>บัญชีเสมือน</strong></td><td>หลังส่ง จะออก<strong>บัญชีเฉพาะตั๋วนี้</strong>ในหน้ารายละเอียด</td><td><strong>ไม่มี</strong> (ยืนยันอัตโนมัติหลังโอน)</td></tr>
        </tbody></table>
        <p class="mt-3"><strong>A. บัญชีรับคงที่ — ลำดับ</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">ซื้อ USDT → สมัครใหม่ เลือกสกุล ยอด กระเป๋าที่อนุมัติแล้ว</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ดู<strong>บัญชีรับคงที่</strong>บนฟอร์ม (ธนาคาร เลขบัญชี ผู้รับ)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">อัปโหลดเฉพาะ<strong>หลักฐานแหล่งเงิน</strong>แล้วส่ง (ขั้นนี้ยังไม่มีสลิป)</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ในรายละเอียดตั๋วดูบัญชีเดิมอีกครั้ง แล้วโอนจากบัญชีที่ลงทะเบียน</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">อัปโหลด<strong>ใบเสร็จฝาก</strong>ที่รายละเอียด → ไปขั้นกำลังตรวจสอบฝาก</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">รอ HQ ตรวจแล้วส่ง USDT</span></div>
        </div>
        <p class="mt-3"><strong>B. บัญชีเสมือน — ลำดับ</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">ซื้อ USDT → สมัครใหม่ เลือกสกุล ยอด กระเป๋าที่อนุมัติแล้ว</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">อัปโหลดเฉพาะ<strong>หลักฐานแหล่งเงิน</strong>แล้วส่ง (ไม่มีช่องสลิป)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">หลังส่งทันที รายละเอียดแสดง<strong>บัญชีเสมือน เฉพาะรายการนี้</strong></span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">โอนตามบัญชีและชื่อผู้รับที่แจ้ง (อย่าปนกับตั๋วอื่น)</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>ไม่ต้อง</strong>อัปโหลดสลิป ระบบยืนยันเงินเข้าอัตโนมัติ</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc">เมื่อสถานะเป็นกำลังตรวจสอบฝาก ฯลฯ ให้รอ USDT</span></div>
        </div>
        <div class="check-box">บัญชีเสมือน<strong>ออกใหม่ทุกครั้งที่สมัคร</strong> ไม่ใช่บัญชีร่วมบัญชีเดียวแล้วแค่แจ้งเมื่อมีเงินเข้า</div>
        <div class="warn-box">ใช้ปุ่มคัดลอกชื่อผู้รับตามจอ โอนจากบัญชีที่ลงทะเบียนเท่านั้น</div>`,
      ),
    },
    {
      id: 'c-accounts',
      title: L('관리자 · 운영자', 'Admin · operators', '管理者・運営者', '管理员·操作员', 'ผู้ดูแล · ผู้ปฏิบัติงาน'),
      bodyHtml: L(
        `<p>개인 가맹점과 법인 가맹점은 <strong>동일</strong>합니다. 업무 계정은 대표 <strong>관리자 1명 + 운영자 최대 2명</strong>입니다.</p>
        <table><thead><tr><th>구분</th><th>내용</th></tr></thead><tbody>
        <tr><td>관리자</td><td>본사가 가맹점을 등록할 때 만든 대표 계정. 내 지갑·사용자관리를 포함해 모든 가맹점 메뉴를 씁니다.</td></tr>
        <tr><td>운영자</td><td>관리자가 OTP로 등록. USDT·에스크로·인증센터·시뮬레이터·운영기록은 관리자와 같습니다. <strong>내 지갑·사용자관리는 없습니다.</strong></td></tr>
        </tbody></table>
        <ul>
          <li>운영자를 쓰려면 본사가 고객관리에서 <strong>멀티 사용자 허용</strong>을 켜야 합니다. 끄면 기존 운영자는 중지되고 로그인할 수 없습니다.</li>
          <li>운영자는 <strong>삭제하지 않습니다.</strong> 관리자가 OTP로 <strong>서비스 중지(비활성)</strong>만 합니다. 이력은 남습니다.</li>
          <li>동시에 업무 가능한 운영자는 활성 기준 최대 2명입니다.</li>
        </ul>
        <div class="warn-box">운영자 계정으로 로그인하면 내 지갑·사용자관리 메뉴가 보이지 않습니다. 지갑 주소 변경·운영자 등록은 대표 관리자만 할 수 있습니다.</div>`,
        `<p>Individual and corporate merchants are the <strong>same</strong>: <strong>1 admin + up to 2 operators</strong>.</p>
        <table><thead><tr><th>Role</th><th>What they can do</th></tr></thead><tbody>
        <tr><td>Admin</td><td>The representative account HQ created. Uses all merchant menus, including Wallets and Users.</td></tr>
        <tr><td>Operator</td><td>Created by the admin with OTP. Same access to USDT, escrow, Verification, simulator, and operation history. <strong>No Wallets or Users.</strong></td></tr>
        </tbody></table>
        <ul>
          <li>HQ must enable <strong>Allow multi-user</strong> on the customer. Turning it off deactivates operators and they cannot sign in.</li>
          <li>Operators are <strong>not deleted</strong>. The admin can only <strong>suspend</strong> them (OTP). History is kept.</li>
          <li>At most 2 operators can be active at the same time.</li>
        </ul>
        <div class="warn-box">Operator logins do not show Wallets or Users. Only the admin can change wallets or add operators.</div>`,
        `<p>個人・法人とも<strong>同じ</strong>です。業務アカウントは代表<strong>管理者1名＋運営者最大2名</strong>です。</p>
        <table><thead><tr><th>区分</th><th>内容</th></tr></thead><tbody>
        <tr><td>管理者</td><td>本社が加盟店登録時に作った代表アカウント。マイウォレット・ユーザー管理を含む全メニュー。</td></tr>
        <tr><td>運営者</td><td>管理者がOTPで登録。USDT・エスクロー・認証・シミュレーター・運営記録は管理者と同じ。<strong>マイウォレット・ユーザー管理はありません。</strong></td></tr>
        </tbody></table>
        <ul>
          <li>運営者を使うには本社が顧客管理で<strong>マルチユーザー許可</strong>をONにする必要があります。OFFにすると既存運営者は停止されログインできません。</li>
          <li>運営者は<strong>削除しません</strong>。管理者はOTPで<strong>停止(無効)</strong>のみ。履歴は残ります。</li>
          <li>同時に業務できる運営者は有効状態で最大2名です。</li>
        </ul>
        <div class="warn-box">運営者でログインするとマイウォレット・ユーザー管理は表示されません。ウォレット変更・運営者登録は代表管理者のみです。</div>`,
        `<p>个人与法人商户规则<strong>相同</strong>：代表<strong>管理员 1 名 + 操作员最多 2 名</strong>。</p>
        <table><thead><tr><th>角色</th><th>内容</th></tr></thead><tbody>
        <tr><td>管理员</td><td>总部登记商户时创建的代表账号。可使用全部商户菜单，含我的钱包、用户管理。</td></tr>
        <tr><td>操作员</td><td>管理员用 OTP 登记。USDT、托管、认证、模拟器、运营记录与管理员相同。<strong>无我的钱包、用户管理。</strong></td></tr>
        </tbody></table>
        <ul>
          <li>使用操作员前，总部须在客户管理开启<strong>允许多用户</strong>。关闭后现有操作员停用且无法登录。</li>
          <li>操作员<strong>不可删除</strong>。管理员仅可用 OTP <strong>停用</strong>。记录保留。</li>
          <li>同时可办公的操作员以启用状态计最多 2 名。</li>
        </ul>
        <div class="warn-box">以操作员登录时不显示我的钱包与用户管理。改钱包、登记操作员仅代表管理员可做。</div>`,
        `<p>ร้านบุคคลและนิติบุคคลใช้กฎ<strong>เดียวกัน</strong>: <strong>แอดมิน 1 + ผู้ปฏิบัติงานสูงสุด 2 คน</strong></p>
        <table><thead><tr><th>บทบาท</th><th>รายละเอียด</th></tr></thead><tbody>
        <tr><td>แอดมิน</td><td>บัญชีตัวแทนที่ HQ สร้างตอนลงทะเบียนร้าน ใช้ทุกเมนูรวมกระเป๋าและจัดการผู้ใช้</td></tr>
        <tr><td>ผู้ปฏิบัติงาน</td><td>แอดมินสร้างด้วย OTP ใช้ USDT เอสโครว์ ศูนย์ยืนยัน ตัวจำลอง และประวัติการดำเนินงานเหมือนแอดมิน <strong>ไม่มีกระเป๋าและจัดการผู้ใช้</strong></td></tr>
        </tbody></table>
        <ul>
          <li>ต้องให้ HQ เปิด<strong>อนุญาตหลายผู้ใช้</strong>ในจัดการลูกค้า ถ้าปิด ผู้ปฏิบัติงานเดิมจะถูกหยุดและเข้าสู่ระบบไม่ได้</li>
          <li>ผู้ปฏิบัติงาน<strong>ลบไม่ได้</strong> แอดมินหยุดบริการด้วย OTP เท่านั้น ประวัติคงไว้</li>
          <li>ผู้ปฏิบัติงานที่ทำงานพร้อมกันได้สูงสุด 2 คนตามสถานะเปิดใช้</li>
        </ul>
        <div class="warn-box">เข้าด้วยผู้ปฏิบัติงานจะไม่เห็นกระเป๋าและจัดการผู้ใช้ เปลี่ยนกระเป๋า/เพิ่มผู้ปฏิบัติงานได้เฉพาะแอดมิน</div>`,
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
      id: 'c-wallet',
      title: L('내 지갑', 'My wallets', 'マイウォレット', '我的钱包', 'กระเป๋าของฉัน'),
      bodyHtml: L(
        `<span class="menu-path">내 지갑</span>
        <p>업무 시작 순서의 <strong>4단계</strong>입니다. 매입·에스크로에 쓰는 수령 주소입니다. <strong>이 메뉴는 가맹점 관리자만</strong> 보입니다. 운영자는 승인된 지갑을 신청 화면에서 고르기만 합니다.</p>
        <ul>
          <li><strong>본사 등록 기본 지갑</strong> — 주소·네트워크를 가맹점이 바꿀 수 없습니다.</li>
          <li><strong>추가 지갑</strong> — 관리자가 등록하면 <strong>승인대기</strong>입니다. 본사가 고객 상세에서 승인한 뒤에만 매입·에스크로에 쓸 수 있습니다.</li>
          <li><strong>수수료 열</strong> — 본사가 수수료 노출을 켜기 전에는 숫자가 없고 <strong>본사설정에따름</strong>만 보입니다. 켜면 가스·플랫폼 수수료가 표시됩니다.</li>
          <li><strong>기본 지갑 전환</strong> — 이미 승인된 지갑 중에서만, 관리자가 OTP로 바꿉니다.</li>
        </ul>
        <div class="warn-box">승인되지 않은 추가 지갑으로는 USDT 매입·무역 에스크로를 신청할 수 없습니다. 기본 지갑 주소를 직접 수정할 수 없다면 본사에 요청하세요.</div>
        <div class="info-box">운영자 계정에는 내 지갑 메뉴가 없습니다. 지갑을 추가·전환하려면 대표 관리자로 로그인하세요.</div>`,
        `<span class="menu-path">My wallets</span>
        <p><strong>Step 4.</strong> Receiving addresses for purchase and escrow. <strong>Admin only</strong> — operators pick an approved wallet on the application screen.</p>
        <ul>
          <li><strong>HQ-registered default</strong> — you cannot change the address or network.</li>
          <li><strong>Extra wallets</strong> — stay <strong>pending</strong> until HQ approves them on the customer detail page.</li>
          <li><strong>Fee column</strong> — until HQ turns on Fee display, amounts are hidden and the cell shows <strong>Follow HQ settings</strong>. When Active, gas and platform fees appear.</li>
          <li><strong>Switch default</strong> — among approved wallets only, admin + OTP.</li>
        </ul>
        <div class="warn-box">Unapproved extra wallets cannot be used for USDT purchase or escrow. Ask HQ if the default address must change.</div>
        <div class="info-box">Operators do not see My wallets. Sign in as the admin to add or switch wallets.</div>`,
        `<span class="menu-path">マイウォレット</span>
        <p>開始順の<strong>4</strong>です。購入・エスクローの受取アドレスです。<strong>加盟店管理者のみ</strong>表示されます。運営者は申請画面で承認済みウォレットを選ぶだけです。</p>
        <ul>
          <li><strong>本社登録の既定ウォレット</strong> — アドレス・ネットワークは加盟店が変更できません。</li>
          <li><strong>追加ウォレット</strong> — 管理者が登録すると<strong>承認待ち</strong>。本社が顧客詳細で承認後に使用できます。</li>
          <li><strong>手数料列</strong> — 本社が手数料表示をONにするまで数字は出ず<strong>本社設定に従う</strong>のみ。ONならガス・プラットフォーム手数料が表示されます。</li>
          <li><strong>既定の切替</strong> — 承認済みの中から、管理者がOTPで変更します。</li>
        </ul>
        <div class="warn-box">未承認の追加ウォレットではUSDT購入・エスクローを申請できません。既定アドレスの変更は本社へ依頼してください。</div>
        <div class="info-box">運営者にはマイウォレットがありません。追加・切替は代表管理者でログインしてください。</div>`,
        `<span class="menu-path">我的钱包</span>
        <p>开工顺序<strong>第 4 步</strong>。采购与托管的收款地址。<strong>仅加盟商管理员</strong>可见。操作员只在申请页选择已批准钱包。</p>
        <ul>
          <li><strong>总部登记的默认钱包</strong> — 加盟商不能改地址或网络。</li>
          <li><strong>额外钱包</strong> — 管理员登记后为<strong>待批准</strong>。总部在客户详情批准后才能用于采购/托管。</li>
          <li><strong>手续费列</strong> — 总部开启手续费显示前不显示数字，只显示<strong>遵循总部设置</strong>。开启后显示 Gas 与平台手续费。</li>
          <li><strong>切换默认</strong> — 仅在已批准钱包中，管理员 + OTP。</li>
        </ul>
        <div class="warn-box">未批准的额外钱包不能用于 USDT 采购或托管。默认地址需变更时请联系总部。</div>
        <div class="info-box">操作员账号没有我的钱包。添加或切换请用代表管理员登录。</div>`,
        `<span class="menu-path">กระเป๋าของฉัน</span>
        <p>ขั้น <strong>4</strong> ที่อยู่รับสำหรับซื้อ/เอสโครว์ <strong>แอดมินร้านเท่านั้น</strong> ผู้ปฏิบัติงานเลือกกระเป๋าที่อนุมัติแล้วในหน้าสมัคร</p>
        <ul>
          <li><strong>กระเป๋าเริ่มต้นที่ HQ ลงทะเบียน</strong> — ร้านค้าแก้ที่อยู่หรือเครือข่ายไม่ได้</li>
          <li><strong>กระเป๋าเพิ่ม</strong> — หลังแอดมินลงทะเบียนจะเป็น<strong>รออนุมัติ</strong> ใช้ซื้อ/เอสโครว์ได้เมื่อ HQ อนุมัติในหน้ารายละเอียดลูกค้า</li>
          <li><strong>คอลัมน์ค่าธรรมเนียม</strong> — จนกว่า HQ จะเปิดแสดงค่าธรรมเนียม จะไม่มีตัวเลข แสดงแค่<strong>ตามการตั้งค่า HQ</strong> ถ้าเปิดจะโชว์แก๊สและค่าธรรมเนียมแพลตฟอร์ม</li>
          <li><strong>สลับกระเป๋าหลัก</strong> — จากกระเป๋าที่อนุมัติแล้วเท่านั้น แอดมิน+OTP</li>
        </ul>
        <div class="warn-box">กระเป๋าเพิ่มที่ยังไม่อนุมัติใช้สมัครซื้อ USDT หรือเอสโครว์ไม่ได้ หากต้องเปลี่ยนที่อยู่หลัก ติดต่อ HQ</div>
        <div class="info-box">บัญชีผู้ปฏิบัติงานไม่มีเมนูกระเป๋า เพิ่ม/สลับให้เข้าด้วยแอดมิน</div>`,
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
        <p>목록 필터의 시작일은 <strong>1주 전</strong>, 종료일은 <strong>오늘</strong>이 기본입니다. 무역 에스크로 목록도 같습니다.</p>
        <p>업무 시작 순서의 <strong>6단계</strong>입니다. 인증패스와 <strong>본사가 승인한 지갑</strong>이 있는 뒤에 신청합니다. 관리자·운영자 모두 신청할 수 있으며, 주요 상태 변경은 OTP 후 운영기록에 남습니다. 희망 수령 USDT 또는 입금 금액을 입력하면 수수료·비용 도식이 표시됩니다.</p>
        <ul>
          <li><strong>계좌 이체</strong> — 안내 계좌로 입금. 통화·방식은 본사 설정에 따름</li>
          <li><strong>카드 결제</strong> — 카드 정보·환불 불가 동의 후 즉시 결제</li>
        </ul>
        <p class="mt-2"><strong>JPY 이체 — 두 가지 방식</strong></p>
        <table><thead><tr><th>방식</th><th>고객 행동</th></tr></thead><tbody>
        <tr><td>전용계좌</td><td>신청 화면에 계좌 미리 표시 → 해당 계좌로 입금 → <strong>자금 원천 증빙 + 송금증</strong>을 신청 시 첨부</td></tr>
        <tr><td>가상계좌 (본사 설정 시)</td><td>신청 시 자금 원천만 → 티켓에 표시된 <strong>건별 계좌</strong>로만 입금 → <strong>증빙 업로드 없음</strong>. 입금 확인 후 자동으로 다음 단계</td></tr>
        </tbody></table>
        <div class="info-box">수취방식·상세에는 <strong>전용계좌</strong> / <strong>가상계좌</strong>로만 표기됩니다. 가상계좌는 「입금 계좌 (가상계좌)」·참조번호로 안내됩니다. 다른 거래 계좌와 섞어 입금하지 마세요.</div>
        <div class="warn-box"><strong>계좌 이체 입금 시 필수</strong><br/>
        티켓에 표시된 <strong>수취인명(半角カタカナ)</strong>을 「수취인명 복사」로 그대로 붙여 넣으세요. UI 언어를 한국어·영어로 바꿔도 수취인명은 일본어 원문입니다. 은행명·코드·계좌번호도 안내와 일치해야 정상 입금됩니다.</div>
        <div class="block-box">카드 결제는 완료 후 카드 취소·환불이 불가합니다. 동의 없이는 진행할 수 없습니다.</div>`,
        `<span class="menu-path">USDT → + New application</span>
        <p>The list filter defaults to start <strong>1 week ago</strong> and end <strong>today</strong>. Trade escrow uses the same dates.</p>
        <p><strong>Step 6.</strong> Apply after a verification pass and an <strong>HQ-approved wallet</strong>. Admin and operators can both apply; major status changes are OTP-gated and written to operation history. Enter target USDT or deposit amount to see the fee diagram.</p>
        <ul>
          <li><strong>Bank transfer</strong> — deposit to the shown account. Currency and method follow HQ settings</li>
          <li><strong>Card</strong> — pay immediately after card details and non-refundable waiver</li>
        </ul>
        <p class="mt-2"><strong>JPY transfer — two modes</strong></p>
        <table><thead><tr><th>Mode</th><th>What you do</th></tr></thead><tbody>
        <tr><td>Dedicated account</td><td>Account previewed on the form → deposit there → attach <strong>source-of-funds + remittance slip</strong> at apply</td></tr>
        <tr><td>Virtual account (when HQ enabled)</td><td>Source-of-funds at apply → deposit only to the <strong>per-ticket account</strong> → <strong>no proof upload</strong>. System auto-confirms deposit</td></tr>
        </tbody></table>
        <div class="info-box">Receipt method and detail show only <strong>Dedicated account</strong> / <strong>Virtual account</strong>. Virtual accounts are labeled “Deposit account (virtual account)” with a reference. Do not mix with other tickets.</div>
        <div class="warn-box"><strong>Required for bank transfer</strong><br/>
        Use <strong>Copy beneficiary</strong> for the on-screen <strong>half-width katakana</strong> name. Changing UI language does not translate the beneficiary. Bank name, codes and account number must also match the ticket.</div>
        <div class="block-box">Card payments are non-refundable after charge. You cannot proceed without agreement.</div>`,
        `<span class="menu-path">USDT購入 → +新規申請</span>
        <p>一覧フィルタの開始日は<strong>1週間前</strong>、終了日は<strong>今日</strong>が既定です。貿易エスクロー一覧も同じです。</p>
        <p>開始順の<strong>6</strong>です。認証パスと<strong>本社承認済みウォレット</strong>の後に申請します。管理者・運営者とも申請でき、主な状態変更はOTP後に運営記録へ残ります。希望受取USDTまたは入金額を入れると手数料・費用の図式が表示されます。</p>
        <ul>
          <li><strong>口座振込</strong> — 案内口座へ入金。通貨・方式は本社設定に従う</li>
          <li><strong>カード決済</strong> — カード情報・返金不可同意の後に即時決済</li>
        </ul>
        <p class="mt-2"><strong>JPY振込 — 2つの方式</strong></p>
        <table><thead><tr><th>方式</th><th>顧客の操作</th></tr></thead><tbody>
        <tr><td>専用口座</td><td>申請画面に口座を表示 → 当該口座へ入金 → 申請時に<strong>資金原資証憑＋送金証</strong>を添付</td></tr>
        <tr><td>バーチャル口座（本社設定時）</td><td>申請時は資金原資のみ → チケット表示の<strong>取引専用口座</strong>へだけ入金 → <strong>証憑アップロードなし</strong>。入金確認後に自動で次工程</td></tr>
        </tbody></table>
        <div class="info-box">受取方式・詳細には<strong>専用口座</strong> / <strong>バーチャル口座</strong>のみ表示されます。バーチャルは「入金口座（バーチャル口座）」・参照番号で案内されます。他の取引と混ぜて入金しないでください。</div>
        <div class="warn-box"><strong>口座振込時の必須事項</strong><br/>
        チケットの<strong>受取人名（半角カタカナ）</strong>を「受取人名をコピー」でそのまま貼り付けてください。UI言語を変えても受取人名は日本語原文です。銀行名・コード・口座番号も案内どおりにしてください。</div>
        <div class="block-box">カード決済後の取消・返金はできません。同意なしでは進めません。</div>`,
        `<span class="menu-path">USDT 采购 → +新申请</span>
        <p>列表筛选默认开始日为<strong>一周前</strong>、结束日为<strong>今天</strong>。贸易托管列表相同。</p>
        <p>开工顺序的<strong>第 6 步</strong>。认证通过且有<strong>总部已批准钱包</strong>后再申请。管理员与操作员均可申请，主要状态变更需 OTP 并写入运营记录。输入希望到账 USDT 或入金额后会显示手续费·费用图示。</p>
        <ul>
          <li><strong>银行转账</strong> — 向指引账户入金。币种与方式以总部设置为准</li>
          <li><strong>卡支付</strong> — 填写卡信息并同意不可退款后立即扣款</li>
        </ul>
        <p class="mt-2"><strong>JPY 转账 — 两种方式</strong></p>
        <table><thead><tr><th>方式</th><th>客户操作</th></tr></thead><tbody>
        <tr><td>专用账户</td><td>申请页预览账户 → 向该账户入金 → 申请时附上<strong>资金来源证明 + 汇款凭证</strong></td></tr>
        <tr><td>虚拟账户（总部开启时）</td><td>申请时仅资金来源 → 仅向单据显示的<strong>按单账户</strong>入金 → <strong>无需上传凭证</strong>。入金确认后自动进入下一步</td></tr>
        </tbody></table>
        <div class="info-box">收款方式与详情仅显示<strong>专用账户</strong> / <strong>虚拟账户</strong>。虚拟账户以「入金账户（虚拟账户）」与参考号指引。请勿与其他交易混用。</div>
        <div class="warn-box"><strong>银行转账必读</strong><br/>
        请用「复制收款人」粘贴单据上的<strong>半角片假名收款人</strong>。切换界面语言不会翻译收款人姓名。银行名、代码、账号也须与指引一致。</div>
        <div class="block-box">卡支付完成后不可取消·退款。未同意无法继续。</div>`,
        `<span class="menu-path">ซื้อ USDT → +สมัครใหม่</span>
        <p>ตัวกรองรายการเริ่มต้นวันเริ่มเป็น<strong>1 สัปดาห์ก่อน</strong> วันสิ้นสุดเป็น<strong>วันนี้</strong> รายการเอสโครว์การค้าก็เช่นกัน</p>
        <p>ขั้น <strong>6</strong> ของลำดับเริ่มงาน สมัครหลังผ่านการยืนยันและมี<strong>กระเป๋าที่ HQ อนุมัติ</strong> แอดมินและผู้ปฏิบัติงานสมัครได้ การเปลี่ยนสถานะสำคัญต้อง OTP และบันทึกประวัติ ใส่ USDT ที่ต้องการรับหรือยอดฝากแล้วจะเห็นแผนภาพค่าธรรมเนียม</p>
        <ul>
          <li><strong>โอนบัญชี</strong> — ฝากเข้าบัญชีที่แจ้ง สกุลและวิธีตามการตั้งค่า HQ</li>
          <li><strong>ชำระบัตร</strong> — กรอกบัตรและยอมรับไม่คืนเงินแล้วชำระทันที</li>
        </ul>
        <p class="mt-2"><strong>โอน JPY — สองแบบ</strong></p>
        <table><thead><tr><th>แบบ</th><th>สิ่งที่ลูกค้าทำ</th></tr></thead><tbody>
        <tr><td>บัญชีเฉพาะ</td><td>ฟอร์มแสดงบัญชีล่วงหน้า → โอนเข้าบัญชีนั้น → แนบ<strong>หลักฐานแหล่งเงิน + สลิปโอน</strong>ตอนสมัคร</td></tr>
        <tr><td>บัญชีเสมือน (เมื่อ HQ เปิด)</td><td>หลักฐานแหล่งเงินตอนสมัคร → ฝากเฉพาะ<strong>บัญชีรายตั๋ว</strong>ที่แสดง → <strong>ไม่ต้องอัปโหลดสลิป</strong> ระบบยืนยันฝากแล้วไปขั้นถัดไปอัตโนมัติ</td></tr>
        </tbody></table>
        <div class="info-box">คอลัมน์วิธีรับและหน้ารายละเอียดแสดงเฉพาะ<strong>บัญชีเฉพาะ</strong> / <strong>บัญชีเสมือน</strong> บัญชีเสมือนจะมี「บัญชีฝาก (บัญชีเสมือน)」และเลขอ้างอิง อย่าฝากปนกับตั๋วอื่น</div>
        <div class="warn-box"><strong>จำเป็นเมื่อโอนบัญชี</strong><br/>
        ใช้ปุ่ม「คัดลอกชื่อผู้รับ」สำหรับ<strong>คาตาคานะครึ่งความกว้าง</strong>บนตั๋ว เปลี่ยนภาษา UI แล้วชื่อผู้รับไม่แปล ชื่อธนาคาร รหัส และเลขบัญชีต้องตรงกับที่แจ้ง</div>
        <div class="block-box">ชำระบัตรแล้วยกเลิก·คืนเงินไม่ได้ โดยไม่ยอมรับจะดำเนินการต่อไม่ได้</div>`
      ),
    },
    {
      id: 'c-deposit-care',
      title: L('계좌 입금 시 주의사항 (필수)', 'Bank deposit precautions (required)', '口座入金時の注意（必須）', '银行入金注意（必读）', 'ข้อควรระวังตอนฝาก (จำเป็น)'),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입 → 티켓 상세 → 입금 계좌</span>
        <p>계좌 이체로 USDT를 매입할 때 <strong>반드시</strong> 지켜 주세요.</p>
        <ol>
          <li>티켓에 표시된 <strong>은행명·은행 코드·지점 코드·계좌 유형·계좌 번호</strong>를 확인합니다.</li>
          <li><strong>수취인명</strong>은 「수취인명 복사」로 복사한 뒤 송금 앱에 그대로 붙여 넣습니다. <strong>半角カタカナ</strong> 원문을 바꾸면 안 됩니다.</li>
          <li>화면 언어를 한국어·영어·중국어 등으로 바꿔도 <strong>수취인명은 항상 일본어 원문</strong>입니다. 안내(빨간 경고) 문구만 해당 언어로 보입니다.</li>
          <li>가입 시 등록한 본인 통장에서만 송금하세요. 다른 통장 송금은 통장 불일치로 중지될 수 있습니다.</li>
          <li>전용계좌: 안내 계좌로 입금 후 신청 시 <strong>송금증 필수</strong>. 가상계좌: 해당 계좌로만 입금·송금증 불필요.</li>
        </ol>
        <div class="warn-box">금액을 정상적으로 수령하려면, 수취인 이름을 정확히 복사하여 입력해야 합니다. (半角カタカナ 그대로 사용)</div>`,
        `<span class="menu-path">USDT purchase → ticket detail → deposit account</span>
        <p>When buying USDT by bank transfer, you <strong>must</strong>:</p>
        <ol>
          <li>Check <strong>bank name, bank code, branch code, account type and account number</strong> on the ticket.</li>
          <li>Use <strong>Copy beneficiary</strong> and paste into your banking app. Do not alter the <strong>half-width katakana</strong> name.</li>
          <li>Changing UI language (Korean, English, Chinese, etc.) does <strong>not</strong> translate the beneficiary — only the red notice text changes.</li>
          <li>Transfer only from your registered bank account. Other accounts may trigger a bank mismatch stop.</li>
          <li>Fixed account: no receipt at apply → confirm account on detail, transfer, then upload <strong>deposit proof</strong> on time. virtual account: deposit only there — no proof upload.</li>
        </ol>
        <div class="warn-box">To receive the funds correctly, copy and enter the beneficiary name exactly as shown. (Use half-width katakana as-is.)</div>`,
        `<span class="menu-path">USDT購入 → チケット詳細 → 入金口座</span>
        <p>口座振込でUSDTを購入するときは<strong>必ず</strong>守ってください。</p>
        <ol>
          <li>チケットの<strong>銀行名・銀行コード・支店コード・口座種別・口座番号</strong>を確認します。</li>
          <li><strong>受取人名</strong>は「受取人名をコピー」でコピーし、送金アプリにそのまま貼り付けます。<strong>半角カタカナ</strong>を変更しないでください。</li>
          <li>画面言語を韓国語・英語・中国語などに変えても<strong>受取人名は常に日本語原文</strong>です。赤い案内文だけが翻訳されます。</li>
          <li>登録した本人通帳からのみ送金してください。別口座は通帳不一致で停止されることがあります。</li>
          <li>固定口座: 申請時に入金証憑なし → 詳細で口座確認・送金後、期限内に<strong>入金証憑</strong>アップロード。バーチャル口座: その口座へだけ入金・証憑不要。</li>
        </ol>
        <div class="warn-box">正常に着金するには、受取人名を表示どおり正確にコピーして入力してください。（半角カタカナのまま使用）</div>`,
        `<span class="menu-path">USDT 采购 → 单据详情 → 入金账户</span>
        <p>通过银行转账购买 USDT 时<strong>必须</strong>遵守：</p>
        <ol>
          <li>核对单据上的<strong>银行名、银行代码、分行代码、账户类型、账号</strong>。</li>
          <li>用「复制收款人」粘贴到网银，勿改动<strong>半角片假名</strong>收款人姓名。</li>
          <li>切换界面语言（韩/英/中等）时，<strong>收款人姓名始终为日语原文</strong>，仅红色提示文会翻译。</li>
          <li>仅从注册本人账户汇款；其他账户可能导致账户不符而中止。</li>
          <li>固定账户：申请时无入金凭证 → 在详情确认账户并转账后按时上传<strong>入金凭证</strong>。虚拟账户：仅向该账户入金，无需凭证。</li>
        </ol>
        <div class="warn-box">为确保正常入账，请精确复制并输入收款人姓名。（请原样使用半角片假名）</div>`,
        `<span class="menu-path">ซื้อ USDT → รายละเอียดตั๋ว → บัญชีฝาก</span>
        <p>เมื่อซื้อ USDT ด้วยโอนบัญชี <strong>ต้อง</strong>ทำตามนี้</p>
        <ol>
          <li>ตรวจ<strong>ชื่อธนาคาร รหัสธนาคาร รหัสสาขา ประเภทบัญชี เลขบัญชี</strong>บนตั๋ว</li>
          <li>ใช้「คัดลอกชื่อผู้รับ」แล้ววางในแอปธนาคาร ห้ามแก้<strong>คาตาคานะครึ่งความกว้าง</strong></li>
          <li>เปลี่ยนภาษา UI (เกาหลี อังกฤษ จีน ฯลฯ) แล้ว<strong>ชื่อผู้รับยังเป็นต้นฉบับญี่ปุ่น</strong> มีเฉพาะข้อความเตือนสีแดงที่แปล</li>
          <li>โอนจากบัญชีที่ลงทะเบียนเท่านั้น บัญชีอื่นอาจหยุดธุรกรรมเพราะบัญชีไม่ตรง</li>
          <li>บัญชีคงที่: ตอนสมัครไม่มีสลิป → ดูบัญชีในรายละเอียด โอน แล้วอัปโหลด<strong>หลักฐานฝาก</strong>ตามกำหนด บัญชีเสมือน: ฝากเฉพาะบัญชีนั้น ไม่ต้องอัปโหลดสลิป</li>
        </ol>
        <div class="warn-box">เพื่อให้รับเงินได้ถูกต้อง ต้องคัดลอกและใส่ชื่อผู้รับให้ตรงตามที่แสดง (ใช้คาตาคานะแบบครึ่งความกว้างตามเดิม)</div>`
      ),
    },
    {
      id: 'c-curfex',
      title: L(
        '가상계좌 입금 (자동 확인)',
        'virtual account deposit (auto)',
        'バーチャル口座入金（自動確認）',
        '虚拟账户入金（自动确认）',
        'ฝากบัญชีเสมือน (อัตโนมัติ)',
      ),
      bodyHtml: L(
        `<span class="menu-path">USDT 매입 → 티켓 상세</span>
        <p>본사 설정에 따라 일부 통화(예: JPY) 계좌이체 신청 시 <strong>이 거래 전용 가상계좌</strong>가 발급됩니다. 공용 계좌가 아닙니다.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">신청 시 <strong>신청서·자금 원천 증빙</strong>만 업로드 (입금 영수증 칸 없음)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">상세의 「입금 계좌 (가상계좌)」·참조번호 확인 후 해당 계좌로만 입금</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">입금 영수증 업로드 <strong>하지 않음</strong> — 시스템이 입금을 자동 확인</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">상태가 <strong>입금확인중</strong>이 되면 USDT 송금을 기다림</span></div>
        </div>
        <div class="info-box">화면에 「입금 대기 (자동 감지)」가 보이면 가상계좌 방식입니다.</div>
        <div class="warn-box">고정 수취계좌가 안내되면 송금 후 상세에서 입금 영수증을 업로드하세요. 자세한 순서는 <strong>간편사용하기</strong>를 보세요.</div>`,
        `<span class="menu-path">USDT purchase → ticket detail</span>
        <p>Depending on HQ settings, some currencies (e.g. JPY) get a <strong>virtual account for this ticket only</strong>. It is not a shared account.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">At apply: upload <strong>application / source-of-funds only</strong> (no deposit receipt field)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Check “Deposit account (virtual account)” &amp; reference — transfer only there</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">Do <strong>not</strong> upload a deposit receipt — the system confirms automatically</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">When status becomes <strong>Deposit verifying</strong>, wait for USDT</span></div>
        </div>
        <div class="info-box">“Awaiting deposit (auto-detect)” means virtual account mode.</div>
        <div class="warn-box">If a fixed receiving account is shown, transfer then upload the receipt on the detail page. See <strong>Quick start</strong> for the full order.</div>`,
        `<span class="menu-path">USDT購入 → チケット詳細</span>
        <p>本社設定により、一部通貨(例:JPY)の口座振込申請では<strong>この取引専用のバーチャル口座</strong>が発行されます。共有口座ではありません。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">申請時は<strong>申請書・資金源証憑のみ</strong>アップロード（入金領収書欄なし）</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">詳細の「入金口座（バーチャル口座）」・参照番号を確認し、その口座へだけ入金</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">入金領収書は<strong>アップロードしない</strong> — システムが自動確認</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">状態が<strong>入金確認中</strong>になったらUSDT送金を待つ</span></div>
        </div>
        <div class="info-box">画面に「入金待ち（自動検知）」と出ればバーチャル口座方式です。</div>
        <div class="warn-box">固定受取口座が表示される場合は、送金後に詳細で入金領収書をアップロードしてください。順番は<strong>かんたん利用</strong>を参照。</div>`,
        `<span class="menu-path">USDT 采购 → 单据详情</span>
        <p>根据总部设置，部分币种（如 JPY）银行转账申请会开立<strong>本单专用 虚拟账户</strong>，不是共用账户。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">申请时仅上传<strong>申请书·资金来源证明</strong>（无入金回单栏）</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">确认详情「入金账户（虚拟账户）」与参考号后，仅向该账户入金</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>不要</strong>上传入金回单 — 系统自动确认</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">状态变为<strong>入金确认中</strong>后等待 USDT</span></div>
        </div>
        <div class="info-box">若看到「等待入金（自动检测）」即为 虚拟账户方式。</div>
        <div class="warn-box">若显示固定收款账户，请转账后在详情上传入金回单。完整顺序见<strong>简易使用</strong>。</div>`,
        `<span class="menu-path">ซื้อ USDT → รายละเอียดตั๋ว</span>
        <p>ตามการตั้งค่า HQ บางสกุล (เช่น JPY) จะได้<strong>บัญชีเสมือน เฉพาะรายการนี้</strong> ไม่ใช่บัญชีร่วม</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">ตอนสมัครอัปโหลดเฉพาะ<strong>ใบสมัคร·หลักฐานแหล่งเงิน</strong> (ไม่มีช่องสลิปฝาก)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ดู「บัญชีฝาก (บัญชีเสมือน)」และเลขอ้างอิง แล้วโอนเข้าบัญชีนั้นเท่านั้น</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>ไม่ต้อง</strong>อัปโหลดสลิปฝาก — ระบบยืนยันอัตโนมัติ</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">เมื่อสถานะเป็น<strong>กำลังตรวจสอบการฝาก</strong> ให้รอการส่ง USDT</span></div>
        </div>
        <div class="info-box">ถ้าเห็น「รอฝาก (ตรวจอัตโนมัติ)」คือโหมดบัญชีเสมือน</div>
        <div class="warn-box">ถ้าแสดงบัญชีคงที่ ให้โอนแล้วอัปโหลดสลิปที่รายละเอียด ดูลำดับเต็มใน<strong>ใช้งานง่าย</strong></div>`
      ),
    },
    {
      id: 'c3',
      title: L('무역 에스크로', 'Trade escrow', '貿易エスクロー', '贸易托管', 'เอสโครว์การค้า'),
      bodyHtml: L(
        `<span class="menu-path">무역 에스크로 → + 신규 계약신청</span>
        <p>목록 시작일은 <strong>1주 전</strong>, 종료일은 <strong>오늘</strong>이 기본입니다.</p>
        <p>상대방 이메일·거래 조건을 입력합니다. 상대 수락 후 계약 확정 → 에스크로 진행입니다. 관리자·운영자 모두 신청할 수 있으며, 주요 상태 변경은 OTP 후 운영기록에 남습니다. 수령 지갑은 본사 승인 지갑만 사용할 수 있습니다.</p>`,
        `<span class="menu-path">Trade escrow → + New contract application</span>
        <p>The list defaults to start <strong>1 week ago</strong> and end <strong>today</strong>.</p>
        <p>Enter counterparty email and terms. After accept & confirm, escrow proceeds. Admin and operators can both apply; major status changes are OTP-gated and logged. Use an HQ-approved wallet only.</p>`,
        `<span class="menu-path">貿易エスクロー → +新規契約申請</span>
        <p>一覧の開始日は<strong>1週間前</strong>、終了日は<strong>今日</strong>が既定です。</p>
        <p>相手のメール・取引条件を入力します。相手の承諾後に契約確定 → エスクロー進行です。管理者・運営者とも申請でき、主な状態変更はOTP後に運営記録へ残ります。受取ウォレットは本社承認済みのみ使用できます。</p>`,
        `<span class="menu-path">贸易托管 → +新合同申请</span>
        <p>列表默认开始日为<strong>一周前</strong>、结束日为<strong>今天</strong>。</p>
        <p>输入对方邮箱与交易条件。对方接受后合同确认 → 进入托管流程。管理员与操作员均可申请，主要状态变更需 OTP 并写入运营记录。收款钱包仅可使用总部已批准钱包。</p>`,
        `<span class="menu-path">เอสโครว์การค้า → +สมัครสัญญาใหม่</span>
        <p>รายการเริ่มต้นวันเริ่มเป็น<strong>1 สัปดาห์ก่อน</strong> วันสิ้นสุดเป็น<strong>วันนี้</strong></p>
        <p>กรอกอีเมลคู่สัญญาและเงื่อนไขธุรกรรม หลังอีกฝ่ายยอมรับแล้วยืนยันสัญญา → เข้าสู่เอสโครว์ แอดมินและผู้ปฏิบัติงานสมัครได้ การเปลี่ยนสถานะสำคัญต้อง OTP และบันทึกประวัติ ใช้กระเป๋าที่ HQ อนุมัติแล้วเท่านั้น</p>`
      ),
    },
    {
      id: 'c-ops',
      title: L('사용자관리', 'Users', 'ユーザー管理', '用户管理', 'จัดการผู้ใช้'),
      bodyHtml: L(
        `<span class="menu-path">사용자관리</span>
        <p>가맹점 <strong>관리자만</strong> 보입니다. 본사가 멀티 사용자를 허용한 가맹점에서 운영자를 등록·중지합니다. 목록은 OTP 없이 바로 보이며, 등록·중지·활성화 시에만 관리자 Google OTP가 필요합니다. 기존 HQ 사용자관리(조직 직원)와는 다른 화면입니다.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">관리자로 로그인한 뒤 왼쪽 <strong>사용자관리</strong>를 엽니다. 목록이 바로 표시됩니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">운영자를 등록하거나 중지·활성화할 때 관리자 Google OTP 6자리를 입력합니다. 맞으면 확인 버튼을 누르지 않아도 진행됩니다. OTP는 본사 플랫폼에 설정된 시간(기본 10분) 동안 유지됩니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">새 운영자는 로그인 후 본인 Google OTP를 설정합니다. 활성 운영자는 최대 2명입니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">업무를 멈추려면 OTP로 <strong>서비스 중지</strong>만 합니다. 삭제 버튼은 없습니다.</span></div>
        </div>
        <div class="warn-box">운영자를 삭제하거나 2명을 넘는 활성 운영자를 둘 수 없습니다. 본사가 멀티 사용자를 끄면 운영자는 로그인할 수 없습니다.</div>
        <div class="check-box">등록·중지는 OTP 후 <strong>운영기록관리</strong>에 남습니다.</div>`,
        `<span class="menu-path">Users</span>
        <p><strong>Merchant admin only.</strong> Add or suspend operators when HQ has enabled multi-user. The list is visible without OTP; Google OTP is required only to register, suspend, or reactivate. This is not the HQ Users screen.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Sign in as admin and open <strong>Users</strong>. The list appears immediately.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">When registering, suspending, or reactivating, enter the admin Google OTP. Six correct digits proceed automatically. The OTP stays valid for the minutes set on HQ Platform (default 10).</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">The new operator sets their own Google OTP after first login. Max 2 active operators.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">To stop work, <strong>suspend</strong> with OTP. There is no delete button.</span></div>
        </div>
        <div class="warn-box">You cannot delete operators or keep more than 2 active. If HQ turns off multi-user, operators cannot sign in.</div>
        <div class="check-box">Create and suspend actions are written to <strong>Operation history</strong> after OTP.</div>`,
        `<span class="menu-path">ユーザー管理</span>
        <p>加盟店<strong>管理者のみ</strong>表示されます。本社がマルチユーザーを許可した加盟店で運営者を登録・停止します。一覧はOTPなしで表示され、登録・停止・再有効時のみ管理者Google OTPが必要です。総本社のユーザー管理とは別画面です。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">管理者でログインし、左の<strong>ユーザー管理</strong>を開く。一覧はすぐに表示されます。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">登録・停止・再有効時に管理者Google OTP 6桁を入力。正しければ確認ボタンなしで進みます。OTPは本社プラットフォームの設定時間（既定10分）維持されます。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">新しい運営者は初回ログイン後に本人のGoogle OTPを設定。有効運営者は最大2名。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">業務を止めるときはOTPで<strong>停止</strong>のみ。削除ボタンはありません。</span></div>
        </div>
        <div class="warn-box">運営者の削除や3名以上の有効運営者はできません。本社がマルチユーザーをOFFにすると運営者はログインできません。</div>
        <div class="check-box">登録・停止はOTP後に<strong>運営記録管理</strong>へ残ります。</div>`,
        `<span class="menu-path">用户管理</span>
        <p><strong>仅加盟商管理员</strong>可见。总部已允许多用户时登记或停用运营者。列表无需 OTP 即可查看，仅在登记、停用或重新启用时需要管理员 Google OTP。与总部用户管理不是同一页。</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">以管理员登录后打开左侧<strong>用户管理</strong>。列表立即显示。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">登记、停用或重新启用时输入管理员 Google OTP。6 位正确即自动继续。OTP 按总部平台设定时间（默认 10 分钟）保持。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">新运营者首次登录后设置本人 Google OTP。启用中的运营者最多 2 名。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">停止工作时用 OTP <strong>停用</strong>。没有删除按钮。</span></div>
        </div>
        <div class="warn-box">不能删除运营者，也不能有超过 2 名启用中的运营者。总部关闭多用户后运营者无法登录。</div>
        <div class="check-box">登记与停用会在 OTP 后写入<strong>运营记录</strong>。</div>`,
        `<span class="menu-path">จัดการผู้ใช้</span>
        <p><strong>แอดมินร้านเท่านั้น</strong> เพิ่มหรือหยุดผู้ปฏิบัติงานเมื่อ HQ เปิดหลายผู้ใช้ ดูรายการได้โดยไม่ต้อง OTP ต้องใช้ Google OTP ของผู้ดูแลเฉพาะตอนลงทะเบียน หยุด หรือเปิดใช้อีกครั้ง ไม่ใช่หน้า Users ของ HQ</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">เข้าด้วยแอดมินแล้วเปิด<strong>จัดการผู้ใช้</strong> รายการแสดงทันที</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ตอนลงทะเบียน หยุด หรือเปิดใช้ ให้กรอก Google OTP 6 หลักของผู้ดูแล ถูกละดำเนินการอัตโนมัติ OTP คงอยู่ตามนาทีที่ตั้งในแพลตฟอร์ม HQ (ค่าเริ่ม 10)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">ผู้ปฏิบัติงานใหม่ตั้ง Google OTP ของตนเองหลังเข้าสู่ระบบครั้งแรก ผู้ปฏิบัติงานที่เปิดใช้ได้สูงสุด 2 คน</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ถ้าจะหยุดงาน ให้<strong>ระงับ</strong>ด้วย OTP ไม่มีปุ่มลบ</span></div>
        </div>
        <div class="warn-box">ลบผู้ปฏิบัติงานไม่ได้ และเปิดใช้เกิน 2 คนไม่ได้ ถ้า HQ ปิดหลายผู้ใช้ ผู้ปฏิบัติงานเข้าสู่ระบบไม่ได้</div>
        <div class="check-box">การสร้าง/ระงับบันทึกใน<strong>ประวัติการดำเนินงาน</strong>หลัง OTP</div>`,
      ),
    },
    {
      id: 'c-hist',
      title: L('운영기록관리', 'Operation history', '運営記録管理', '运营记录', 'ประวัติการดำเนินงาน'),
      bodyHtml: L(
        `<span class="menu-path">운영기록관리</span>
        <p>왼쪽 메뉴에서 <strong>이용메뉴얼 위</strong>에 있습니다. 관리자·운영자가 주요 업무를 Google OTP로 처리한 뒤 남는 기록입니다.</p>
        <ul>
          <li>기록 범위(1차): 운영자 등록·중지, USDT 신청·주요 상태 변경, 에스크로 신청·주요 상태 변경</li>
          <li>가맹점(관리자·운영자)은 <strong>조회만</strong> 가능합니다. 삭제 버튼이 없습니다.</li>
          <li>기록 삭제는 <strong>총본사만</strong> 할 수 있습니다.</li>
        </ul>
        <div class="warn-box">가맹점 관리자도 운영기록을 지울 수 없습니다. 잘못된 기록은 총본사에 요청하세요.</div>`,
        `<span class="menu-path">Operation history</span>
        <p>In the left menu, this item sits <strong>above Usage manuals</strong>. It records major work after Google OTP.</p>
        <ul>
          <li>First scope: operator create/suspend, USDT apply and major status changes, escrow apply and major status changes</li>
          <li>Merchant admin and operators can <strong>view only</strong>. No delete button.</li>
          <li>Only <strong>HQ Super Admin</strong> can delete a log.</li>
        </ul>
        <div class="warn-box">Even the merchant admin cannot erase operation history. Ask HQ if a log must be removed.</div>`,
        `<span class="menu-path">運営記録管理</span>
        <p>左メニューの<strong>利用マニュアルの上</strong>にあります。管理者・運営者が主要業務をGoogle OTPで処理した後に残る記録です。</p>
        <ul>
          <li>対象(一次): 運営者の登録・停止、USDT申請・主な状態変更、エスクロー申請・主な状態変更</li>
          <li>加盟店(管理者・運営者)は<strong>閲覧のみ</strong>。削除ボタンはありません。</li>
          <li>記録の削除は<strong>総本社のみ</strong>可能です。</li>
        </ul>
        <div class="warn-box">加盟店管理者も運営記録を消せません。削除が必要な場合は総本社へ依頼してください。</div>`,
        `<span class="menu-path">运营记录</span>
        <p>在左侧菜单中位于<strong>使用手册上方</strong>。管理员与操作员用 Google OTP 完成主要业务后留下的记录。</p>
        <ul>
          <li>第一期范围：操作员登记/停用、USDT 申请与主要状态变更、托管申请与主要状态变更</li>
          <li>加盟商(管理员、操作员)仅可<strong>查看</strong>，无删除按钮。</li>
          <li>仅<strong>总部超级管理员</strong>可删除记录。</li>
        </ul>
        <div class="warn-box">加盟商管理员也不能删除运营记录。需删除时请联系总部。</div>`,
        `<span class="menu-path">ประวัติการดำเนินงาน</span>
        <p>อยู่ในเมนูซ้าย<strong>เหนือคู่มือใช้งาน</strong> บันทึกงานสำคัญหลัง Google OTP ของแอดมินและผู้ปฏิบัติงาน</p>
        <ul>
          <li>ขอบเขตระยะแรก: สร้าง/ระงับผู้ปฏิบัติงาน สมัคร USDT และการเปลี่ยนสถานะสำคัญ สมัครเอสโครว์และการเปลี่ยนสถานะสำคัญ</li>
          <li>ร้านค้า (แอดมินและผู้ปฏิบัติงาน) <strong>ดูได้อย่างเดียว</strong> ไม่มีปุ่มลบ</li>
          <li>ลบบันทึกได้เฉพาะ<strong>ผู้ดูแล HQ</strong></li>
        </ul>
        <div class="warn-box">แม้แอดมินร้านก็ลบประวัติไม่ได้ หากต้องลบ ให้ขอ HQ</div>`,
      ),
    },
    {
      id: 'c4',
      title: L('FAQ', 'FAQ', 'FAQ', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">카드 버튼이 회색입니다.</div><div class="faq-a">현재 카드 결제가 비활성입니다. 계좌 이체를 이용하거나 운영자에게 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">USDT·에스크로를 신청할 수 없습니다.</div><div class="faq-a">인증센터에서 서류를 제출하고 총본사 인증패스를 기다리세요. 반려이면 사유를 보고 다시 올리세요. 본사가 승인한 지갑도 필요합니다.</div></div>
        <div class="faq-item"><div class="faq-q">지갑 주소를 바꿀 수 없습니다.</div><div class="faq-a">본사가 등록한 기본 지갑은 가맹점이 주소·네트워크를 바꿀 수 없습니다. 추가 지갑은 내 지갑에서 등록한 뒤 본사 승인을 기다리세요. 기본 지갑은 승인된 지갑 중에서만 전환합니다.</div></div>
        <div class="faq-item"><div class="faq-q">내 지갑·사용자관리 메뉴가 없습니다.</div><div class="faq-a">운영자 계정이면 정상입니다. 지갑 추가·운영자 등록은 대표 관리자만 할 수 있습니다. 관리자인데 사용자관리가 없으면 본사에 멀티 사용자 허용을 요청하세요.</div></div>
        <div class="faq-item"><div class="faq-q">운영자를 더 만들 수 없습니다.</div><div class="faq-a">활성 운영자는 최대 2명입니다. 삭제는 없고 서비스 중지(비활성)만 됩니다. 중지된 자리도 총 2명 한도에 포함될 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">운영기록을 지울 수 없습니다.</div><div class="faq-a">가맹점 관리자·운영자는 조회만 가능합니다. 삭제는 총본사만 할 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">시뮬레이터에 결과가 안 남습니다.</div><div class="faq-a">네트워크를 선택하고 금액을 입력하세요. 이 화면은 최근 3건, 대시보드는 2건입니다.</div></div>
        <div class="faq-item"><div class="faq-q">시뮬레이터와 실제 매입 금액이 다릅니다.</div><div class="faq-a">시뮬레이터는 참고용입니다. 환율·수수료 변동으로 실제 신청·입금 시점과 다를 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">예상 USDT와 실제가 다릅니다.</div><div class="faq-a">환율·가스비 변동으로 범위 내 차이가 날 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">원하는 통화가 목록에 없습니다.</div><div class="faq-a">본사가 해당 통화의 이체 또는 카드결제를 끈 상태입니다. 운영자에게 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">JPY인데 증빙 업로드 칸이 없습니다.</div><div class="faq-a">가상계좌 방식이면 정상입니다. 안내 계좌로 입금만 하면 시스템이 자동 확인합니다. 순서는 <strong>간편사용하기</strong>를 보세요.</div></div>
        <div class="faq-item"><div class="faq-q">입금했는데 상태가 안 바뀝니다.</div><div class="faq-a">가상계좌 건은 「입금 상태 확인」을 누르거나 잠시 기다리세요. 고정 수취계좌는 상세에서 입금 증빙을 업로드해야 합니다.</div></div>
        <div class="faq-item"><div class="faq-q">USDT가 「심사중」인데 무엇을 기다리나요?</div><div class="faq-a">USDT 매입은 <strong>입금확인중</strong>·<strong>결제확인중</strong>으로 표시됩니다. <strong>심사중</strong>은 인증센터(KYC) 서류 심사 전용입니다. USDT 상세의 「증빙 파일」에서 입금 영수증·자금 원천 증빙을 확인하세요.</div></div>
        <div class="faq-item"><div class="faq-q">입금 영수증이 상세에 없습니다.</div><div class="faq-a">전용계좌 이체 후 고객이 입금 증빙을 업로드해야 「증빙 파일」에 표시됩니다. 첨부가 없어도 섹션은 항상 보이며, 테스트 데이터는 별도 안내가 나옵니다.</div></div>
        <div class="faq-item"><div class="faq-q">내 지갑 수수료에 숫자가 없고 「본사설정에따름」입니다.</div><div class="faq-a">본사가 수수료 노출을 켠 가맹점만 가스·플랫폼 수수료가 보입니다. 기본은 비활성입니다. 숫자가 필요하면 본사에 요청하세요.</div></div>
        <div class="faq-item"><div class="faq-q">사용자관리에서 OTP 6자리를 넣었는데 확인을 눌러야 하나요?</div><div class="faq-a">맞으면 확인 버튼을 누르지 않아도 진행됩니다. 목록 조회는 OTP가 없고, 등록·중지·활성화만 OTP입니다.</div></div>
        <div class="faq-item"><div class="faq-q">USDT 목록의 날짜가 오늘만 안 나옵니다.</div><div class="faq-a">시작일은 <strong>1주 전</strong>, 종료일은 <strong>오늘</strong>이 기본입니다. 기간을 바꿔 조회하세요. 무역 에스크로 목록도 같습니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Card pay is disabled; use bank transfer or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Cannot apply for USDT or escrow.</div><div class="faq-a">Submit files in Verification and wait for HQ verification pass. If rejected, resubmit after reading the reason. You also need an HQ-approved wallet.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot change the wallet address.</div><div class="faq-a">HQ-registered default wallets cannot have their address or network changed. Add an extra wallet in My wallets and wait for HQ approval. The default can only switch among approved wallets.</div></div>
        <div class="faq-item"><div class="faq-q">I do not see Wallets or Users.</div><div class="faq-a">Normal for operator accounts. Only the admin can add wallets or operators. If you are the admin and Users is missing, ask HQ to enable multi-user.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot add another operator.</div><div class="faq-a">At most 2 operators. There is no delete — only suspend. Inactive operators may still count toward the cap of 2.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot delete operation history.</div><div class="faq-a">Merchant admin and operators can view only. Only HQ Super Admin can delete logs.</div></div>
        <div class="faq-item"><div class="faq-q">Simulator results disappear.</div><div class="faq-a">Select a network and enter an amount. The page keeps 3 runs; the dashboard shows 2.</div></div>
        <div class="faq-item"><div class="faq-q">Simulator differs from my purchase.</div><div class="faq-a">The simulator is reference only. Rates and fees may change before you apply or deposit.</div></div>
        <div class="faq-item"><div class="faq-q">Received USDT differs.</div><div class="faq-a">Rate/gas variance may apply within the shown range.</div></div>
        <div class="faq-item"><div class="faq-q">My currency is missing.</div><div class="faq-a">HQ disabled transfer or card for that currency. Contact support.</div></div>
        <div class="faq-item"><div class="faq-q">No proof upload for JPY.</div><div class="faq-a">Normal with a virtual account — deposit to the shown account only. See <strong>Quick start</strong> for steps.</div></div>
        <div class="faq-item"><div class="faq-q">Deposited but status unchanged.</div><div class="faq-a">virtual account: tap “Check deposit status” or wait. Fixed account: upload proof on the detail page.</div></div>
        <div class="faq-item"><div class="faq-q">USDT shows “Under review” — what am I waiting for?</div><div class="faq-a">USDT purchases use <strong>Deposit verifying</strong> or <strong>Payment verifying</strong>. <strong>Under review</strong> is for Verification (KYC) only. Check the Attachments section on the USDT detail for deposit receipt and source-of-funds files.</div></div>
        <div class="faq-item"><div class="faq-q">No deposit receipt on the detail page.</div><div class="faq-a">For fixed accounts, the customer must upload deposit proof after transfer. The Attachments section is always shown; test-seed tickets without real uploads display a separate notice.</div></div>
        <div class="faq-item"><div class="faq-q">My wallets fee column shows Follow HQ settings, not amounts.</div><div class="faq-a">Gas and platform fees appear only after HQ turns on Fee display. The default is Inactive. Ask HQ if you need the numbers.</div></div>
        <div class="faq-item"><div class="faq-q">Must I tap Verify after entering 6 OTP digits on Users?</div><div class="faq-a">No — a correct code proceeds automatically. The list is visible without OTP; OTP is only for register, suspend, and reactivate.</div></div>
        <div class="faq-item"><div class="faq-q">USDT list dates are not “today only”.</div><div class="faq-a">Default is start <strong>1 week ago</strong> through end <strong>today</strong>. Change the range as needed. Trade escrow uses the same default.</div></div>`,
        `<div class="faq-item"><div class="faq-q">カードボタンが灰色です。</div><div class="faq-a">現在カード決済が無効です。口座振込を使うか運営者に問い合わせてください。</div></div>
        <div class="faq-item"><div class="faq-q">USDT・エスクローを申請できません。</div><div class="faq-a">認証センターで書類を提出し、総本社の認証パスを待ってください。差戻しなら理由を見て再提出してください。本社承認済みウォレットも必要です。</div></div>
        <div class="faq-item"><div class="faq-q">ウォレットアドレスを変更できません。</div><div class="faq-a">本社登録の既定ウォレットは加盟店がアドレス・ネットワークを変更できません。追加はマイウォレットで登録後、本社承認を待ってください。既定は承認済みの中からのみ切替です。</div></div>
        <div class="faq-item"><div class="faq-q">マイウォレット・ユーザー管理が見えません。</div><div class="faq-a">運営者アカウントなら正常です。ウォレット追加・運営者登録は代表管理者のみです。管理者なのにユーザー管理がない場合は、本社にマルチユーザー許可を依頼してください。</div></div>
        <div class="faq-item"><div class="faq-q">運営者をこれ以上作れません。</div><div class="faq-a">有効運営者は最大2名です。削除はなく停止のみです。停止済みも2名上限に含まれることがあります。</div></div>
        <div class="faq-item"><div class="faq-q">運営記録を消せません。</div><div class="faq-a">加盟店の管理者・運営者は閲覧のみです。削除は総本社のみです。</div></div>
        <div class="faq-item"><div class="faq-q">シミュレーターに結果が残りません。</div><div class="faq-a">ネットワークを選び金額を入力してください。この画面は直近3件、ダッシュボードは2件です。</div></div>
        <div class="faq-item"><div class="faq-q">シミュレーターと実際の購入金額が違います。</div><div class="faq-a">シミュレーターは参考用です。為替・手数料の変動で実際の申請・入金時点と異なることがあります。</div></div>
        <div class="faq-item"><div class="faq-q">予想USDTと実際が違います。</div><div class="faq-a">為替・ガス費の変動で表示範囲内の差が出ることがあります。</div></div>
        <div class="faq-item"><div class="faq-q">希望の通貨が一覧にありません。</div><div class="faq-a">本社が当該通貨の振込またはカードをOFFにしています。運営者に問い合わせてください。</div></div>
        <div class="faq-item"><div class="faq-q">JPYなのに証憑アップロード欄がありません。</div><div class="faq-a">バーチャル口座方式なら正常です。案内口座へ入金するだけでシステムが自動確認します。順番は<strong>かんたん利用</strong>を参照。</div></div>
        <div class="faq-item"><div class="faq-q">入金したのに状態が変わりません。</div><div class="faq-a">バーチャル口座件は「入金状態を確認」を押すか少し待ってください。固定口座は詳細で証憑アップロードが必要です。</div></div>
        <div class="faq-item"><div class="faq-q">USDTが「審査中」ですが何を待ちますか？</div><div class="faq-a">USDT購入は<strong>入金確認中</strong>・<strong>決済確認中</strong>と表示されます。<strong>審査中</strong>は認証センター(KYC)の書類審査専用です。USDT詳細の「証憑ファイル」で入金領収書・資金源証憑を確認してください。</div></div>
        <div class="faq-item"><div class="faq-q">詳細に入金領収書がありません。</div><div class="faq-a">固定口座振込後、顧客が入金証憑をアップロードすると「証憑ファイル」に表示されます。添付がなくても欄は常に表示され、テストデータは別途案内されます。</div></div>
        <div class="faq-item"><div class="faq-q">マイウォレット手数料が数字ではなく「本社設定に従う」です。</div><div class="faq-a">本社が手数料表示をONにした加盟店だけガス・プラットフォーム手数料が見えます。既定はOFFです。数字が必要なら本社へ依頼してください。</div></div>
        <div class="faq-item"><div class="faq-q">ユーザー管理でOTP 6桁を入れたあと確認を押す必要がありますか？</div><div class="faq-a">正しければ確認ボタンなしで進みます。一覧照会にOTPは不要で、登録・停止・再有効のみOTPです。</div></div>
        <div class="faq-item"><div class="faq-q">USDT一覧の日付が今日だけではありません。</div><div class="faq-a">開始は<strong>1週間前</strong>、終了は<strong>今日</strong>が既定です。期間を変えて照会してください。貿易エスクローも同じです。</div></div>`,
        `<div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">当前卡支付未启用。请用银行转账或联系运营。</div></div>
        <div class="faq-item"><div class="faq-q">无法申请 USDT 或托管。</div><div class="faq-a">请在认证中心提交文件并等待总部认证通过。若被退回，请查看原因后重新提交。还需要总部已批准的钱包。</div></div>
        <div class="faq-item"><div class="faq-q">无法修改钱包地址。</div><div class="faq-a">总部登记的默认钱包，加盟商不能改地址或网络。额外钱包请在我的钱包登记后等待总部批准。默认钱包只能在已批准钱包中切换。</div></div>
        <div class="faq-item"><div class="faq-q">没有我的钱包或用户管理菜单。</div><div class="faq-a">操作员账号属正常。添加钱包或操作员仅代表管理员可做。若您是管理员却没有用户管理，请向总部开启多用户。</div></div>
        <div class="faq-item"><div class="faq-q">无法再添加操作员。</div><div class="faq-a">启用中的操作员最多 2 名。不可删除，仅可停用。已停用的也可能计入 2 名上限。</div></div>
        <div class="faq-item"><div class="faq-q">无法删除运营记录。</div><div class="faq-a">加盟商管理员与操作员仅可查看。仅总部可删除。</div></div>
        <div class="faq-item"><div class="faq-q">模拟器没有留下结果。</div><div class="faq-a">请选择网络并输入金额。本页最多 3 条，仪表盘显示 2 条。</div></div>
        <div class="faq-item"><div class="faq-q">模拟器与实际采购金额不同。</div><div class="faq-a">模拟器仅供参考。汇率·手续费变动可能导致与实际申请·入金时点不同。</div></div>
        <div class="faq-item"><div class="faq-q">预计 USDT 与实际不同。</div><div class="faq-a">汇率·燃气费波动可能在显示范围内产生差异。</div></div>
        <div class="faq-item"><div class="faq-q">列表中没有我想要的币种。</div><div class="faq-a">总部关闭了该币种的转账或卡支付。请联系运营。</div></div>
        <div class="faq-item"><div class="faq-q">JPY 却没有凭证上传栏。</div><div class="faq-a">使用 虚拟账户时属正常。只需向指引账户入金，系统会自动确认。顺序见<strong>简易使用</strong>。</div></div>
        <div class="faq-item"><div class="faq-q">已入金但状态未变。</div><div class="faq-a">虚拟账户单请点「检查入金状态」或稍候。固定账户须在详情上传凭证。</div></div>
        <div class="faq-item"><div class="faq-q">USDT 显示「审核中」是在等什么？</div><div class="faq-a">USDT 采购显示<strong>入金确认中</strong>或<strong>支付确认中</strong>。<strong>审核中</strong>仅用于认证中心(KYC) 文件审核。请在 USDT 详情的「凭证文件」查看入金回单与资金来源证明。</div></div>
        <div class="faq-item"><div class="faq-q">详情里没有入金回单。</div><div class="faq-a">固定账户转账后，客户须上传入金凭证才会出现在「凭证文件」。即使无附件该区域也会显示；测试数据会单独说明。</div></div>
        <div class="faq-item"><div class="faq-q">我的钱包手续费没有数字，只显示遵循总部设置。</div><div class="faq-a">仅当总部开启手续费显示时才看到 Gas 与平台手续费。默认为停用。需要数字请向总部申请。</div></div>
        <div class="faq-item"><div class="faq-q">用户管理输入 OTP 6 位后还要点确认吗？</div><div class="faq-a">正确则无需点确认。查看列表不需要 OTP，仅登记、停用、重新启用需要 OTP。</div></div>
        <div class="faq-item"><div class="faq-q">USDT 列表日期不是只有今天。</div><div class="faq-a">默认开始为<strong>一周前</strong>、结束为<strong>今天</strong>。可改期间再查。贸易托管相同。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ปุ่มบัตรเป็นสีเทา</div><div class="faq-a">ตอนนี้ปิดชำระบัตรอยู่ ใช้โอนบัญชีหรือติดต่อผู้ดูแล</div></div>
        <div class="faq-item"><div class="faq-q">สมัคร USDT หรือเอสโครว์ไม่ได้</div><div class="faq-a">ส่งเอกสารที่ศูนย์ยืนยันแล้วรอ HQ ให้ผ่าน หากถูกปฏิเสธ อ่านเหตุผลแล้วส่งใหม่ ต้องมีกระเป๋าที่ HQ อนุมัติด้วย</div></div>
        <div class="faq-item"><div class="faq-q">เปลี่ยนที่อยู่กระเป๋าไม่ได้</div><div class="faq-a">กระเป๋าเริ่มต้นที่ HQ ลงทะเบียน ร้านค้าแก้ที่อยู่หรือเครือข่ายไม่ได้ กระเป๋าเพิ่มให้ลงที่กระเป๋าของฉันแล้วรอ HQ อนุมัติ สลับกระเป๋าหลักได้เฉพาะที่อนุมัติแล้ว</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีเมนูกระเป๋าหรือจัดการผู้ใช้</div><div class="faq-a">บัญชีผู้ปฏิบัติงานเป็นเรื่องปกติ เพิ่มกระเป๋า/ผู้ปฏิบัติงานได้เฉพาะแอดมิน หากเป็นแอดมินแต่ไม่มีเมนู ให้ขอ HQ เปิดหลายผู้ใช้</div></div>
        <div class="faq-item"><div class="faq-q">เพิ่มผู้ปฏิบัติงานอีกไม่ได้</div><div class="faq-a">ผู้ปฏิบัติงานที่เปิดใช้ได้สูงสุด 2 คน ลบไม่ได้ หยุดได้เท่านั้น รายการที่หยุดแล้วอาจนับในโควตา 2 คน</div></div>
        <div class="faq-item"><div class="faq-q">ลบประวัติการดำเนินงานไม่ได้</div><div class="faq-a">แอดมินและผู้ปฏิบัติงานร้านดูได้อย่างเดียว ลบได้เฉพาะ HQ</div></div>
        <div class="faq-item"><div class="faq-q">ตัวจำลองไม่เก็บผล</div><div class="faq-a">เลือกเครือข่ายแล้วใส่จำนวน หน้านี้เก็บ 3 รายการ แดชบอร์ดโชว์ 2</div></div>
        <div class="faq-item"><div class="faq-q">ตัวจำลองกับยอดซื้อจริงไม่ตรง</div><div class="faq-a">ตัวจำลองเป็นข้อมูลอ้างอิง เรท·ค่าธรรมเนียมอาจเปลี่ยนก่อนสมัครหรือฝากจริง</div></div>
        <div class="faq-item"><div class="faq-q">USDT ที่คาดกับที่ได้จริงต่างกัน</div><div class="faq-a">เรท·ค่าแก๊สอาจต่างได้ภายในช่วงที่แสดง</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีสกุลเงินที่ต้องการในรายการ</div><div class="faq-a">HQ ปิดโอนหรือบัตรของสกุลนั้น ติดต่อผู้ดูแล</div></div>
        <div class="faq-item"><div class="faq-q">JPY แต่ไม่มีช่องอัปโหลดหลักฐาน</div><div class="faq-a">ปกติเมื่อใช้บัญชีเสมือน ฝากเข้าบัญชีที่แจ้งอย่างเดียว ระบบยืนยันอัตโนมัติ ดูลำดับใน<strong>ใช้งานง่าย</strong></div></div>
        <div class="faq-item"><div class="faq-q">ฝากแล้วแต่สถานะไม่เปลี่ยน</div><div class="faq-a">ตั๋วบัญชีเสมือน กด「ตรวจสถานะฝาก」หรือรอสักครู่ บัญชีคงที่ต้องอัปโหลดหลักฐานที่รายละเอียด</div></div>
        <div class="faq-item"><div class="faq-q">USDT แสดง「กำลังตรวจสอบ」 รออะไร?</div><div class="faq-a">การซื้อ USDT ใช้<strong>กำลังตรวจสอบการฝาก</strong>หรือ<strong>กำลังตรวจสอบการชำระ</strong> <strong>กำลังตรวจสอบ</strong>ใช้กับศูนย์ยืนยัน(KYC) เท่านั้น ดูสลิปฝากและแหล่งเงินที่「ไฟล์หลักฐาน」ในหน้ารายละเอียด USDT</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีสลิปฝากในหน้ารายละเอียด</div><div class="faq-a">บัญชีคงที่ ลูกค้าต้องอัปโหลดหลักฐานหลังโอน จึงจะแสดงใน「ไฟล์หลักฐาน」 แม้ไม่มีไฟล์ส่วนนี้ยังแสดงเสมอ ข้อมูลทดสอบจะมีคำอธิบายแยก</div></div>
        <div class="faq-item"><div class="faq-q">คอลัมน์ค่าธรรมเนียมกระเป๋าไม่โชว์ตัวเลข มีแค่ตามการตั้งค่า HQ</div><div class="faq-a">จะเห็นแก๊สและค่าธรรมเนียมแพลตฟอร์มเมื่อ HQ เปิดแสดงค่าธรรมเนียม ค่าเริ่มคือปิด หากต้องการตัวเลขให้ขอ HQ</div></div>
        <div class="faq-item"><div class="faq-q">ที่จัดการผู้ใช้กรอก OTP 6 หลักแล้วต้องกดยืนยันไหม</div><div class="faq-a">ถูกละไม่ต้องกดยืนยัน ดูรายการไม่ต้อง OTP ต้อง OTP เฉพาะตอนลงทะเบียน หยุด และเปิดใช้อีกครั้ง</div></div>
        <div class="faq-item"><div class="faq-q">วันที่ในรายการ USDT ไม่ใช่วันนี้เท่านั้น</div><div class="faq-a">ค่าเริ่มวันเริ่มเป็น<strong>1 สัปดาห์ก่อน</strong> วันสิ้นสุดเป็น<strong>วันนี้</strong> เปลี่ยนช่วงแล้วค้นได้ เอสโครว์การค้าก็เช่นกัน</div></div>`
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
