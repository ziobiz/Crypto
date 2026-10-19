import type { ManualDoc } from './manual-types';
import { L } from './locale-text';

/** 기업(법인) 고객 전용 퀵 매뉴얼 — 관리자 등록·이체+송금·인보이스 */
export const CUSTOMER_CORPORATE_MANUAL: ManualDoc = {
  id: 'customer-corporate',
  coverTitle: L(
    '기업용 고객 이용 메뉴얼',
    'Corporate customer manual',
    '法人顧客向け利用マニュアル',
    '企业客户使用手册',
    'คู่มือลูกค้านิติบุคคล',
  ),
  coverSubtitle: L(
    '관리자 등록 → 인증패스 → 지갑·운영자 → 이체·송금 매입 · 인보이스 (간편 가이드)',
    'Admin registration → verification → wallets & operators → bank/remittance purchase · invoices (quick guide)',
    '管理者登録→認証パス→ウォレット・運営者→振替・送金購入・インボイス（かんたんガイド）',
    '管理员登记 → 认证通过 → 钱包·操作员 → 转账·汇款采购 · 发票（简易指南）',
    'ลงทะเบียนโดยผู้ดูแล → ผ่านยืนยัน → กระเป๋า·ผู้ปฏิบัติงาน → โอน/ธุรกรรมโอน · ใบแจ้งหนี้ (คู่มือง่าย)',
  ),
  sections: [
    {
      id: 'co-who',
      title: L('이 메뉴얼은 누구용인가요?', 'Who is this for?', 'このマニュアルの対象', '本手册适用对象', 'คู่มือนี้สำหรับใคร'),
      bodyHtml: L(
        `<div class="check-box">이 문서는 <strong>기업(Corporate)</strong> 고객·운영자용입니다. 개인 계정은 <strong>개인용 고객 이용 메뉴얼</strong>을 보세요.</div>
        <p>기업 고객의 특징</p>
        <ul>
          <li><strong>공개 회원가입이 없습니다.</strong> 총본사·조직 관리자가 등록하거나, 고객 상세에서 유형을 기업으로 지정합니다.</li>
          <li>인증센터에 <strong>등기·실질적지배자·세무 증빙</strong> 등 법인 서류가 추가로 필요할 수 있습니다.</li>
          <li>크립토 매입 결제수단 기본값은 <strong>계좌이체 + 송금거래</strong>입니다 (본사·고객 설정에 따름).</li>
          <li>대표 관리자 + 운영자(최대 2명)·인보이스(미리보기·삭제)를 업무에 자주 씁니다.</li>
        </ul>`,
        `<div class="check-box">This guide is for <strong>Corporate</strong> customers and their operators. Individuals use the <strong>Individual customer manual</strong>.</div>
        <ul>
          <li><strong>No public signup</strong> — HQ/org admins register the account, or set type to Corporate on customer detail.</li>
          <li>Verification may require <strong>registry / beneficial owner / tax</strong> files in addition to the forecast.</li>
          <li>Default crypto purchase methods are <strong>bank transfer + remittance</strong> (subject to HQ and customer toggles).</li>
          <li>You typically use admin + operators (max 2) and invoices (preview / delete).</li>
        </ul>`,
        `<div class="check-box">この文書は<strong>法人</strong>顧客・運営者向けです。個人は<strong>個人顧客向けマニュアル</strong>を見てください。</div>
        <ul>
          <li><strong>公開会員登録はありません。</strong>総本社・組織管理者が登録するか、顧客詳細で法人に指定します。</li>
          <li>認証に<strong>登記・実質的支配者・税務</strong>書類が追加で必要なことがあります。</li>
          <li>クリプト購入の既定手段は<strong>口座振替＋送金</strong>です（本社・顧客設定に従う）。</li>
          <li>代表管理者＋運営者(最大2)・インボイス(プレビュー・削除)をよく使います。</li>
        </ul>`,
        `<div class="check-box">本文档适用于<strong>企业</strong>客户及其操作员。个人请看<strong>个人客户使用手册</strong>。</div>
        <ul>
          <li><strong>无公开注册</strong> — 由总部/组织管理员登记，或在客户详情设为企业。</li>
          <li>认证可能另需<strong>登记 / 实际控制人 / 税务</strong>文件。</li>
          <li>加密货币采购默认方式为<strong>银行转账 + 汇款</strong>（取决于总部与客户开关）。</li>
          <li>常用代表管理员 + 操作员(最多 2) 与发票(预览/删除)。</li>
        </ul>`,
        `<div class="check-box">เอกสารนี้สำหรับลูกค้า<strong>นิติบุคคล</strong>และผู้ปฏิบัติงาน บุคคลใช้<strong>คู่มือลูกค้าบุคคล</strong></div>
        <ul>
          <li><strong>ไม่มีสมัครสาธารณะ</strong> — HQ/องค์กรลงทะเบียน หรือตั้งประเภทเป็นนิติที่หน้ารายละเอียด</li>
          <li>การยืนยันอาจต้อง<strong>ทะเบียน / ผู้มีอำนาจควบคุม / ภาษี</strong>เพิ่ม</li>
          <li>ช่องทางซื้อคริปโตเริ่มต้นคือ<strong>โอนบัญชี + ธุรกรรมโอน</strong> (ตาม HQ และตั้งค่าลูกค้า)</li>
          <li>ใช้แอดมิน + ผู้ปฏิบัติงาน (สูงสุด 2) และใบแจ้งหนี้ (ดูตัวอย่าง/ลบ) เป็นประจำ</li>
        </ul>`,
      ),
    },
    {
      id: 'co-start',
      title: L('빠른 시작 순서', 'Quick start order', 'かんたん開始の順番', '快速开工顺序', 'ลำดับเริ่มงานแบบเร็ว'),
      bodyHtml: L(
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>계정 수령</strong> — <strong>https://tinpass.com/login</strong> 에서 기업회원으로, 본사가 등록한 이메일·임시 비밀번호로 로그인. 최초 로그인 시 비밀번호 변경이 필요할 수 있습니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong> — 켜져 있으면 앱 코드를 입력합니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>인증센터</strong> — 6개월 거래 예정 보고서 + 법인 서류를 올립니다. 양식은 이용메뉴얼에서 내려받습니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>내 지갑</strong> — 최대 5개. OTP + 두 번 확인. 새 주소는 본사 승인 후 매입에서 선택. 삭제는 본사 승인 후.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(선택) 운영자</strong> — 본사가 멀티 사용자를 허용하면 관리자가 OTP로 운영자 최대 2명 등록.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>시뮬레이터</strong> — 네트워크·금액으로 수수료 미리보기 (참고용).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>인증패스 후</strong> 계좌이체·송금·카드(허용 시)로 크립토 매입 또는 무역 에스크로. 필요 시 인보이스를 확인·미리보기합니다.</span></div>
        </div>
        <div class="warn-box">인증패스·승인 지갑 없이는 매입·에스크로가 진행되지 않습니다. 시뮬레이터는 확정 금액이 아닙니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>Receive credentials</strong> — sign in at <strong>https://tinpass.com/login</strong> (corporate member) with the email and temporary password from HQ. First login may require a new password.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong> if enabled.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>Verification</strong> — forecast + corporate documents (templates in Usage manuals).</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>My wallets</strong> — up to 5; OTP + two confirms; HQ approval for new addresses; HQ approval to delete.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(Optional) Operators</strong> — if HQ enabled multi-user, admin adds up to 2 operators with OTP.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>Simulator</strong> — fee preview (reference only).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc">After a <strong>verification pass</strong>, purchase via bank transfer / remittance / card (when allowed), or trade escrow. Use invoices to preview when needed.</span></div>
        </div>
        <div class="warn-box">Without a pass and an approved wallet, purchase/escrow stay blocked. The simulator is not binding.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>アカウント受領</strong> — 管理者が登録したメール・仮パスワードでログイン。初回はパスワード変更が必要なことがあります。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong>（有効時）。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>認証センター</strong> — 報告書＋法人書類。様式は利用マニュアルから。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>マイウォレット</strong> — 最大5。OTP+2回確認。新アドレスは本社承認後。削除も本社承認後。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(任意) 運営者</strong> — 本社がマルチユーザー許可時、管理者がOTPで最大2名登録。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>シミュレーター</strong> — 手数料試算(参考)。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>認証パス後</strong>に振替・送金・カード(許可時)で購入、またはエスクロー。必要ならインボイスを確認。</span></div>
        </div>
        <div class="warn-box">認証パス・承認ウォレットがないと進めません。シミュレーターは確定金額ではありません。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>领取账号</strong> — 用管理员登记的邮箱与临时密码登录。首次可能需改密。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong>（若开启）。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>认证中心</strong> — 预估报告 + 企业文件。模板在使用手册。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>我的钱包</strong> — 最多 5；OTP+两次确认；新地址需总部批准；删除亦需总部批准。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(可选) 操作员</strong> — 总部开启多用户后，管理员用 OTP 最多登记 2 名。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>模拟器</strong> — 手续费预览（参考）。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>认证通过后</strong>用转账/汇款/卡（若允许）采购，或贸易托管。需要时查看发票预览。</span></div>
        </div>
        <div class="warn-box">无认证通过与已批钱包则无法继续。模拟器不是确定金额。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>รับบัญชี</strong> — เข้าด้วยอีเมล/รหัสชั่วคราวจากผู้ดูแล อาจต้องเปลี่ยนรหัสครั้งแรก</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong> หากเปิด</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>ศูนย์ยืนยัน</strong> — รายงาน 6 เดือน + เอกสารนิติ แบบฟอร์มจากคู่มือใช้งาน</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>กระเป๋าของฉัน</strong> — สูงสุด 5 OTP+ยืนยันสองครั้ง ที่อยู่ใหม่/ลบต้อง HQ อนุมัติ</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(ถ้ามี) ผู้ปฏิบัติงาน</strong> — หาก HQ เปิดหลายผู้ใช้ แอดมินเพิ่มได้สูงสุด 2 คนด้วย OTP</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>ตัวจำลอง</strong> — ดูค่าธรรมเนียม (อ้างอิง)</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc">หลัง<strong>ผ่านยืนยัน</strong> ซื้อด้วยโอนบัญชี/ธุรกรรมโอน/บัตร (ถ้าอนุญาต) หรือเอสโครว์ และดูใบแจ้งหนี้เมื่อต้องการ</span></div>
        </div>
        <div class="warn-box">ไม่มีผ่านยืนยันและกระเป๋าที่อนุมัติจะทำต่อไม่ได้ ตัวจำลองไม่ใช่ยอดผูกพัน</div>`,
      ),
    },
    {
      id: 'co-account',
      title: L('계정 · 연락처 · 유형', 'Account · contacts · type', 'アカウント・連絡先・タイプ', '账号·联系方式·类型', 'บัญชี · ติดต่อ · ประเภท'),
      bodyHtml: L(
        `<ul>
          <li><strong>고객 유형</strong>은 개인/기업입니다. 기업은 관리자 등록 또는 고객 상세의 유형 드롭다운으로 지정됩니다.</li>
          <li><strong>이메일</strong>은 전 서비스에서 한 번만. <strong>휴대폰</strong>은 기업 유형에서 한 번까지(개인과 각각 가능). 검색 시 개인/기업이 구분됩니다.</li>
          <li>비밀번호·OTP 복구는 개인과 동일하게 동작합니다.</li>
          <li>상단에서 언어를 바꾸고, 유휴 시 자동 로그아웃됩니다.</li>
        </ul>
        <div class="info-box">공개 가입 CTA는 개인용입니다. 기업 계정은 로그인만 사용합니다.</div>`,
        `<ul>
          <li><strong>Customer type</strong> is Individual or Corporate. Corporate is set by admin registration or the type dropdown on customer detail.</li>
          <li><strong>Email</strong> is globally unique. <strong>Phone</strong> may be used once per corporate type (and once for individual). Search shows the type label.</li>
          <li>Password and OTP recovery work like individuals.</li>
          <li>Change language in the top bar; idle timeout signs you out.</li>
        </ul>
        <div class="info-box">The public signup CTA is for individuals. Corporate accounts sign in only.</div>`,
        `<ul>
          <li><strong>顧客タイプ</strong>は個人/法人。法人は管理者登録または顧客詳細のドロップダウンで指定。</li>
          <li><strong>メール</strong>は全体で1回。<strong>電話</strong>は法人タイプで1回まで（個人と別）。検索時に個人/法人表示。</li>
          <li>パスワード・OTP復旧は個人と同じ。</li>
          <li>上部で言語切替。アイドルで自動ログアウト。</li>
        </ul>
        <div class="info-box">公開登録CTAは個人用です。法人はログインのみです。</div>`,
        `<ul>
          <li><strong>客户类型</strong>为个人/企业。企业由管理员登记或客户详情下拉指定。</li>
          <li><strong>邮箱</strong>全局唯一。<strong>手机</strong>在企业类型下各用一次（个人另计）。搜索显示类型。</li>
          <li>密码与 OTP 恢复与个人相同。</li>
          <li>顶部切换语言；空闲自动退出。</li>
        </ul>
        <div class="info-box">公开注册入口仅限个人。企业账号仅登录。</div>`,
        `<ul>
          <li><strong>ประเภทลูกค้า</strong>คือบุคคล/นิติ นิติตั้งโดยผู้ดูแลหรือเมนูประเภทที่หน้ารายละเอียด</li>
          <li><strong>อีเมล</strong>ไม่ซ้ำทั้งระบบ <strong>เบอร์</strong>ใช้ได้ครั้งเดียวในนิติ (และครั้งในบุคคล) ค้นหาแสดงประเภท</li>
          <li>กู้รหัสผ่าน/OTP เหมือนบุคคล</li>
          <li>เปลี่ยนภาษาด้านบน Idle ออกอัตโนมัติ</li>
        </ul>
        <div class="info-box">ปุ่มสมัครสาธารณะเป็นของบุคคล บัญชีนิติเข้าสู่ระบบอย่างเดียว</div>`,
      ),
    },
    {
      id: 'co-kyc',
      title: L('인증센터 · 법인 서류', 'Verification · corporate docs', '認証センター・法人書類', '认证中心·企业文件', 'ศูนย์ยืนยัน · เอกสารนิติ'),
      bodyHtml: L(
        `<span class="menu-path">인증센터</span>
        <ul>
          <li><strong>6개월 거래 예정 보고서</strong> + <strong>등기·실질적지배자·세무</strong> 등 화면 안내에 따른 법인 서류</li>
          <li>상태: 비인증 → 심사중 → 인증패스 / 반려(사유 확인 후 재제출)</li>
        </ul>
        <div class="warn-box">인증패스 전에는 크립토 매입·무역 에스크로를 신청할 수 없습니다. 「심사중」은 KYC용이며 USDT의 「입금확인중」과 다릅니다.</div>
        <div class="info-box">양식은 왼쪽 <strong>이용메뉴얼</strong>에서 내려받으세요.</div>`,
        `<span class="menu-path">Verification</span>
        <ul>
          <li><strong>6-month forecast</strong> plus <strong>registry / beneficial owner / tax</strong> files as listed on screen</li>
          <li>Status: Unverified → Under review → Verified pass / Rejected (resubmit)</li>
        </ul>
        <div class="warn-box">USDT and escrow stay blocked until you have a pass. “Under review” is KYC only — not USDT deposit verifying.</div>`,
        `<span class="menu-path">認証センター</span>
        <ul>
          <li><strong>6か月取引予定報告書</strong>＋画面案内の<strong>登記・実質的支配者・税務</strong>書類</li>
          <li>状態: 未認証→審査中→認証パス／差戻し</li>
        </ul>
        <div class="warn-box">認証パス前はUSDT・エスクロー申請不可。「審査中」はKYC用でUSDTの入金確認中とは別です。</div>`,
        `<span class="menu-path">认证中心</span>
        <ul>
          <li><strong>6 个月预估报告</strong> + 画面所列<strong>登记 / 实际控制人 / 税务</strong>文件</li>
          <li>状态：未认证 → 审核中 → 认证通过 / 退回</li>
        </ul>
        <div class="warn-box">未通过前无法申请加密货币/托管。「审核中」仅用于 KYC。</div>`,
        `<span class="menu-path">ศูนย์ยืนยัน</span>
        <ul>
          <li><strong>รายงาน 6 เดือน</strong> + <strong>ทะเบียน / ผู้มีอำนาจควบคุม / ภาษี</strong> ตามหน้าจอ</li>
          <li>สถานะ: ยังไม่ยืนยัน → กำลังตรวจ → ผ่าน / ปฏิเสธ</li>
        </ul>
        <div class="warn-box">ยังไม่ผ่านจะสมัครคริปโต/เอสโครว์ไม่ได้ 「กำลังตรวจสอบ」เป็น KYC ไม่ใช่สถานะฝาก USDT</div>`,
      ),
    },
    {
      id: 'co-ops-wallet',
      title: L('관리자 · 운영자 · 지갑', 'Admin · operators · wallets', '管理者・運営者・ウォレット', '管理员·操作员·钱包', 'แอดมิน · ผู้ปฏิบัติงาน · กระเป๋า'),
      bodyHtml: L(
        `<table><thead><tr><th>구분</th><th>내용</th></tr></thead><tbody>
        <tr><td>관리자</td><td>대표 계정. 내 지갑·사용자관리 포함 전 메뉴</td></tr>
        <tr><td>운영자</td><td>관리자가 OTP로 등록. USDT·에스크로·인증·시뮬레이터·운영기록은 동일. <strong>내 지갑·사용자관리 없음</strong></td></tr>
        </tbody></table>
        <ul>
          <li>운영자 사용 = 본사 <strong>멀티 사용자 허용</strong> ON. 끄면 운영자 로그인 불가.</li>
          <li>운영자 삭제 없음 → <strong>중지(비활성)</strong>만. 활성 기준 최대 2명.</li>
          <li>지갑 최대 5개. 등록·주소 변경·삭제 요청 = OTP + 두 번 확인. 새 주소·삭제는 본사 승인.</li>
        </ul>
        <div class="warn-box">운영자로 로그인하면 지갑·사용자관리가 보이지 않습니다. 지갑 변경은 대표 관리자로 하세요.</div>`,
        `<table><thead><tr><th>Role</th><th>Access</th></tr></thead><tbody>
        <tr><td>Admin</td><td>All merchant menus including Wallets and Users</td></tr>
        <tr><td>Operator</td><td>Same USDT/escrow/Verification/simulator/history. <strong>No Wallets or Users</strong></td></tr>
        </tbody></table>
        <ul>
          <li>Requires HQ <strong>Allow multi-user</strong>. Turning it off blocks operator login.</li>
          <li>No delete — <strong>suspend</strong> only. Max 2 active operators.</li>
          <li>Up to 5 wallets; OTP + two confirms; HQ approval for new address and deletion.</li>
        </ul>
        <div class="warn-box">Operator logins hide Wallets/Users. Change wallets as the admin.</div>`,
        `<table><thead><tr><th>区分</th><th>内容</th></tr></thead><tbody>
        <tr><td>管理者</td><td>全メニュー（マイウォレット・ユーザー管理含む）</td></tr>
        <tr><td>運営者</td><td>USDT等は同じ。<strong>マイウォレット・ユーザー管理なし</strong></td></tr>
        </tbody></table>
        <ul>
          <li>本社の<strong>マルチユーザー許可</strong>が必要。OFFで運営者ログイン不可。</li>
          <li>削除なし→<strong>停止</strong>のみ。有効最大2名。</li>
          <li>ウォレット最大5。OTP+2回確認。新アドレス・削除は本社承認。</li>
        </ul>
        <div class="warn-box">運営者ログインではウォレット・ユーザー管理が見えません。</div>`,
        `<table><thead><tr><th>角色</th><th>权限</th></tr></thead><tbody>
        <tr><td>管理员</td><td>全部菜单（含我的钱包、用户管理）</td></tr>
        <tr><td>操作员</td><td>USDT 等相同。<strong>无我的钱包、用户管理</strong></td></tr>
        </tbody></table>
        <ul>
          <li>需总部<strong>允许多用户</strong>。关闭后操作员无法登录。</li>
          <li>不可删除 → 仅<strong>停用</strong>。启用最多 2 名。</li>
          <li>钱包最多 5；OTP+两次确认；新地址与删除需总部批准。</li>
        </ul>
        <div class="warn-box">操作员登录看不到钱包与用户管理。</div>`,
        `<table><thead><tr><th>บทบาท</th><th>สิทธิ์</th></tr></thead><tbody>
        <tr><td>แอดมิน</td><td>ทุกเมนูรวมกระเป๋าและจัดการผู้ใช้</td></tr>
        <tr><td>ผู้ปฏิบัติงาน</td><td>USDT ฯลฯ เหมือนกัน <strong>ไม่มีกระเป๋า/จัดการผู้ใช้</strong></td></tr>
        </tbody></table>
        <ul>
          <li>ต้อง HQ เปิด<strong>อนุญาตหลายผู้ใช้</strong> ปิดแล้วผู้ปฏิบัติงานเข้าไม่ได้</li>
          <li>ลบไม่ได้ → <strong>หยุด</strong>เท่านั้น สูงสุด 2 คนที่เปิดใช้</li>
          <li>กระเป๋าสูงสุด 5 OTP+ยืนยันสองครั้ง ที่อยู่ใหม่/ลบต้อง HQ อนุมัติ</li>
        </ul>
        <div class="warn-box">เข้าด้วยผู้ปฏิบัติงานจะไม่เห็นกระเป๋าและจัดการผู้ใช้</div>`,
      ),
    },
    {
      id: 'co-pay',
      title: L('크립토 매입 · 결제수단', 'Crypto purchase · pay methods', 'クリプト購入・決済手段', '加密货币采购·支付方式', 'ซื้อคริปโต · ช่องทางชำระ'),
      bodyHtml: L(
        `<span class="menu-path">크립토 매입</span>
        <p>목록 기본 기간: 시작 <strong>1주 전</strong> ~ 종료 <strong>오늘</strong>. <strong>거래하기</strong>에서 1회 크립토 한도(LR~SR/ML)와 ±8% 참고 견적을 확인합니다.</p>
        <table><thead><tr><th>결제수단</th><th>기업 고객 안내</th></tr></thead><tbody>
        <tr><td><strong>계좌이체</strong></td><td>기업 기본 허용(본사따름). 전용계좌/가상계좌 흐름은 아래 「입금 순서」.</td></tr>
        <tr><td><strong>송금거래</strong></td><td>기업 기본 허용. 송금자 성명은 계정 이름과 같고, 국가·이메일은 수정 가능.</td></tr>
        <tr><td><strong>카드</strong></td><td>본사·통화·고객 설정이 모두 ON일 때만. 결제 후 환불 불가. 회색 버튼 = 비활성.</td></tr>
        </tbody></table>
        <div class="info-box">표시는 본사 설정과 고객별 설정(본사따름/사용/중지)의 <strong>교집합</strong>입니다. 고객 상세에서 수단별로 끌 수 있습니다.</div>
        <div class="warn-box">시뮬레이터는 참고용입니다. 실제 신청·입금과 다를 수 있습니다.</div>`,
        `<span class="menu-path">Crypto purchase</span>
        <p>Default list range: <strong>1 week ago → today</strong>. Use <strong>Trade</strong> for per-ticket CRYPTO limits and a ±8% reference quote.</p>
        <table><thead><tr><th>Method</th><th>For corporates</th></tr></thead><tbody>
        <tr><td><strong>Bank transfer</strong></td><td>Default-allowed (Follow HQ). See deposit steps below.</td></tr>
        <tr><td><strong>Remittance</strong></td><td>Default-allowed. Sender name matches account; country/email editable.</td></tr>
        <tr><td><strong>Card</strong></td><td>Only when HQ, currency, and customer settings are on. Non-refundable. Gray = off.</td></tr>
        </tbody></table>
        <div class="info-box">Visibility = HQ settings <strong>AND</strong> per-customer Follow HQ / Enabled / Disabled.</div>`,
        `<span class="menu-path">クリプト購入</span>
        <p>一覧既定: 開始<strong>1週間前</strong>〜終了<strong>今日</strong>。<strong>取引する</strong>で1回クリプト限度と±8%参考見積を確認。</p>
        <table><thead><tr><th>手段</th><th>法人向け</th></tr></thead><tbody>
        <tr><td><strong>口座振替</strong></td><td>既定で許可(本社に従う)。入金手順は下記。</td></tr>
        <tr><td><strong>送金</strong></td><td>既定で許可。送金者氏名はアカウント名。国・メールは変更可。</td></tr>
        <tr><td><strong>カード</strong></td><td>本社・通貨・顧客がすべてONのとき。決済後返金不可。灰色=無効。</td></tr>
        </tbody></table>
        <div class="info-box">表示は本社設定と顧客別設定の<strong>積集合</strong>です。</div>`,
        `<span class="menu-path">加密货币采购</span>
        <p>列表默认：<strong>一周前 → 今天</strong>。点<strong>交易</strong>查看单笔限额与 ±8% 参考报价。</p>
        <table><thead><tr><th>方式</th><th>企业说明</th></tr></thead><tbody>
        <tr><td><strong>银行转账</strong></td><td>默认允许（跟随总部）。见下方入金步骤。</td></tr>
        <tr><td><strong>汇款</strong></td><td>默认允许。汇款人姓名与账户相同；国家/邮箱可改。</td></tr>
        <tr><td><strong>卡支付</strong></td><td>总部·币种·客户均开启时。扣款后不可退。灰色=关闭。</td></tr>
        </tbody></table>
        <div class="info-box">显示为总部设置与客户开关的<strong>交集</strong>。</div>`,
        `<span class="menu-path">ซื้อคริปโต</span>
        <p>ช่วงรายการเริ่มต้น: <strong>1 สัปดาห์ก่อน → วันนี้</strong> กด<strong>ทำรายการ</strong>เพื่อดูวงเงินและช่วงอ้างอิง ±8%</p>
        <table><thead><tr><th>ช่องทาง</th><th>สำหรับนิติ</th></tr></thead><tbody>
        <tr><td><strong>โอนบัญชี</strong></td><td>อนุญาตเริ่มต้น (ตาม HQ) ดูลำดับฝากด้านล่าง</td></tr>
        <tr><td><strong>ธุรกรรมโอน</strong></td><td>อนุญาตเริ่มต้น ชื่อผู้ส่งตรงบัญชี ประเทศ/อีเมลแก้ได้</td></tr>
        <tr><td><strong>บัตร</strong></td><td>เมื่อ HQ สกุล และลูกค้าเปิดทั้งหมด ชำระแล้วคืนไม่ได้ เทา=ปิด</td></tr>
        </tbody></table>
        <div class="info-box">การแสดงเป็น<strong>จุดร่วม</strong>ของตั้งค่า HQ และการเปิด/ปิดรายลูกค้า</div>`,
      ),
    },
    {
      id: 'co-deposit',
      title: L('계좌이체 입금 순서', 'Bank deposit steps', '口座振込の順番', '银行入金顺序', 'ลำดับฝากโอนบัญชี'),
      bodyHtml: L(
        `<p>수취방식은 <strong>전용계좌</strong> / <strong>가상계좌</strong>로만 표기됩니다.</p>
        <p><strong>A. 전용계좌</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">신규신청 → 통화·금액·승인 지갑</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>계좌번호·수취인명 복사</strong> (半角カタカナ 그대로) 후 등록 통장에서 송금</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>자금 원천 + 송금증</strong> 첨부 후 제출 → 입금확인·크립토 송금 대기</span></div>
        </div>
        <p><strong>B. 가상계좌</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">자금 원천만 올리고 제출</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">상세의 <strong>이 건 전용</strong> 계좌로만 입금</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">송금증 없음 — 시스템 자동 확인</span></div>
        </div>
        <div class="warn-box">수취인명은 UI 언어와 무관하게 일본어 원문입니다. 다른 티켓 계좌와 섞지 마세요.</div>`,
        `<p>Receipt method shows only <strong>Dedicated</strong> or <strong>Virtual</strong> account.</p>
        <p><strong>A. Dedicated</strong> — copy account &amp; beneficiary → transfer from registered bank → attach source-of-funds + remittance slip.</p>
        <p><strong>B. Virtual</strong> — source-of-funds only → deposit to per-ticket account → no slip (auto-confirm).</p>
        <div class="warn-box">Beneficiary stays half-width katakana. Do not mix tickets.</div>`,
        `<p>受取方式は<strong>専用</strong>/<strong>バーチャル</strong>のみ。</p>
        <p><strong>A. 専用</strong> — 口座・受取人名をコピー→登録通帳から送金→資金原資＋送金証。</p>
        <p><strong>B. バーチャル</strong> — 資金原資のみ→取引専用口座へ→証憑なし(自動確認)。</p>
        <div class="warn-box">受取人名はUI言語と無関係に日本語原文です。</div>`,
        `<p>收款方式仅显示<strong>专用</strong>/<strong>虚拟</strong>账户。</p>
        <p><strong>A. 专用</strong> — 复制账号与收款人 → 本人账户转账 → 资金来源+汇款凭证。</p>
        <p><strong>B. 虚拟</strong> — 仅资金来源 → 本单账户入金 → 不上传凭证（自动确认）。</p>
        <div class="warn-box">收款人姓名始终为日语原文。勿混用单据。</div>`,
        `<p>วิธีรับแสดง<strong>บัญชีเฉพาะ</strong>/<strong>บัญชีเสมือน</strong>เท่านั้น</p>
        <p><strong>A. เฉพาะ</strong> — คัดลอกเลขบัญชี/ผู้รับ → โอนจากบัญชีที่ลงทะเบียน → แนบแหล่งเงิน+สลิป</p>
        <p><strong>B. เสมือน</strong> — แหล่งเงินอย่างเดียว → ฝากเข้าบัญชีรายตั๋ว → ไม่มีสลิป (ยืนยันอัตโนมัติ)</p>
        <div class="warn-box">ชื่อผู้รับเป็นต้นฉบับญี่ปุ่นเสมอ อย่าผสมตั๋ว</div>`,
      ),
    },
    {
      id: 'co-invoice',
      title: L('인보이스', 'Invoices', 'インボイス', '发票', 'ใบแจ้งหนี้'),
      bodyHtml: L(
        `<span class="menu-path">인보이스</span>
        <ul>
          <li>목록에서 인보이스를 선택하면 <strong>PDF 미리보기</strong>로 내용을 확인할 수 있습니다.</li>
          <li>다운로드는 미리보기 확인 후 진행하세요.</li>
          <li><strong>삭제</strong>는 실수 방지를 위해 <strong>2단계 확인</strong>이 필요합니다. 확인하면 Invoice 서비스에서도 함께 삭제됩니다.</li>
        </ul>
        <div class="warn-box">삭제된 인보이스는 복구할 수 없습니다. 미리보기로 대상을 확인한 뒤 삭제하세요.</div>`,
        `<span class="menu-path">Invoices</span>
        <ul>
          <li>Open an invoice for a <strong>PDF preview</strong> before download.</li>
          <li><strong>Delete</strong> requires a <strong>two-step confirm</strong> and also removes it from the Invoice service.</li>
        </ul>
        <div class="warn-box">Deleted invoices cannot be restored. Preview first, then delete.</div>`,
        `<span class="menu-path">インボイス</span>
        <ul>
          <li>一覧から<strong>PDFプレビュー</strong>で内容を確認してからダウンロード。</li>
          <li><strong>削除</strong>は<strong>2段階確認</strong>が必要で、Invoiceサービスからも削除されます。</li>
        </ul>
        <div class="warn-box">削除したインボイスは復元できません。プレビューで確認してから削除してください。</div>`,
        `<span class="menu-path">发票</span>
        <ul>
          <li>可先<strong>PDF 预览</strong>再下载。</li>
          <li><strong>删除</strong>需<strong>两步确认</strong>，并会从 Invoice 服务一并删除。</li>
        </ul>
        <div class="warn-box">已删除的发票无法恢复。请先预览再删除。</div>`,
        `<span class="menu-path">ใบแจ้งหนี้</span>
        <ul>
          <li>เปิด<strong>ดูตัวอย่าง PDF</strong>ก่อนดาวน์โหลด</li>
          <li><strong>ลบ</strong>ต้อง<strong>ยืนยัน 2 ขั้น</strong> และลบจากบริการ Invoice ด้วย</li>
        </ul>
        <div class="warn-box">ใบแจ้งหนี้ที่ลบแล้วกู้คืนไม่ได้ ดูตัวอย่างก่อนแล้วค่อยลบ</div>`,
      ),
    },
    {
      id: 'co-escrow',
      title: L('무역 에스크로 · 운영기록', 'Trade escrow · history', '貿易エスクロー・運営記録', '贸易托管·运营记录', 'เอสโครว์ · ประวัติ'),
      bodyHtml: L(
        `<p><strong>무역 에스크로</strong> — 인증패스·승인 지갑 후 신청. 목록 기간 기본은 크립토 매입과 동일. 주요 상태 변경은 OTP 후 운영기록에 남습니다.</p>
        <p><strong>운영기록</strong> — 관리자·운영자 모두 조회 가능. 삭제는 총본사만 가능합니다.</p>`,
        `<p><strong>Trade escrow</strong> — apply after verification pass and approved wallet. Same default date range as crypto purchase. Major status changes need OTP and are logged.</p>
        <p><strong>Operation history</strong> — viewable by admin and operators. Only HQ can delete logs.</p>`,
        `<p><strong>貿易エスクロー</strong> — 認証パス・承認ウォレット後。一覧期間はクリプト購入と同じ。主な状態変更はOTP後に記録。</p>
        <p><strong>運営記録</strong> — 管理者・運営者が閲覧。削除は総本社のみ。</p>`,
        `<p><strong>贸易托管</strong> — 认证通过且有已批钱包后申请。列表默认区间同加密货币采购。主要状态变更需 OTP 并记入运营记录。</p>
        <p><strong>运营记录</strong> — 管理员与操作员可查看。仅总部可删除。</p>`,
        `<p><strong>เอสโครว์การค้า</strong> — สมัครหลังผ่านยืนยันและมีกระเป๋าที่อนุมัติ ช่วงวันเหมือนการซื้อคริปโต การเปลี่ยนสถานะสำคัญต้อง OTP และบันทึกประวัติ</p>
        <p><strong>ประวัติการดำเนินงาน</strong> — แอดมินและผู้ปฏิบัติงานดูได้ ลบได้เฉพาะ HQ</p>`,
      ),
    },
    {
      id: 'co-membership',
      title: L(
        '유료회원이란 · 가입 방법',
        'What paid membership is · how to join',
        '有料会員とは · 加入方法',
        '什么是付费会员 · 如何开通',
        'สมาชิกเสียเงินคืออะไร · วิธีสมัคร',
      ),
      bodyHtml: L(
        `<span class="menu-path">유료회원가입</span>
        <div class="check-box"><strong>유료회원</strong>은 기업 계정이 있다는 뜻이 아닙니다. <strong>법인 등급을 결제했고, 유료 만료가 아직 남지 않은 상태</strong>입니다. 관리자가 만든 기업 계정은 처음에 <strong>일반회원(STANDARD)</strong>입니다. 일반 기업도 인증패스·승인 지갑이 있으면 매입·에스크로를 합니다. 유료는 그 위에 한도와 EXPRESS 혜택을 더하는 선택입니다. 혜택은 <strong>회사 계정</strong>에 붙으므로 대표와 운영자가 같은 만료·횟수를 씁니다.</div>
        <p><strong>화면에서 확인하는 법</strong></p>
        <ul>
          <li>현재 등급이 <strong>PREMIUMB · VIPB · VVIPB · PRESTIGEB · BLACKB</strong> 이고 유료 만료가 미래이면 유료 기업입니다. 끝의 B는 법인 상품입니다. 개인용 PREMIUM 등은 보이지 않습니다.</li>
          <li>「유료 미적용」이거나 만료가 지났으면 일반 기업입니다. 무료 EXPRESS 횟수와 유료 한도는 꺼집니다.</li>
          <li>본사가 판매를 켠 법인 등급만 카드로 나옵니다.</li>
        </ul>
        <p><strong>유료인 동안 달라지는 것</strong> (본사가 그 등급에 넣어 둔 값, 만료 전)</p>
        <ul>
          <li><strong>거래 한도</strong> — 법인 일반 한도보다 유료 한도가 우선할 수 있습니다.</li>
          <li><strong>EXPRESS 무료 횟수</strong> — 빠른 완료 등급마다 기간 전체의 0원 횟수. 매달 리셋되지 않습니다. 회사 전체가 같은 횟수를 씁니다.</li>
          <li><strong>횟수 소진 후 할인</strong> — 만료 전까지 일반 EXPRESS보다 낮은 유료 할인이 적용될 수 있습니다.</li>
        </ul>
        <p>판매가는 <strong>USD</strong>입니다. USDT·USDC는 1:1, EURC는 EUR 시세입니다. 기간은 일(1–30) 또는 월(2–12)이며 많은 상품은 12개월입니다.</p>
        <p><strong>구매 순서</strong> (대표 관리자가 진행)</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>유료회원가입</strong>을 엽니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">법인 등급 카드의 가격·기간·청구 통화를 확인합니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>카드로 구매</strong> 또는 <strong>크립토로 구매</strong>. 허용된 버튼만 나옵니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ICOPAY로 이동합니다. 카드는 계정 이메일·전화(국가번호)가 필요합니다. 크립토는 입금 안내를 따릅니다.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">결과 화면에서 확정합니다. 확인 중이면 <strong>상태 새로고침</strong>. 확정되면 등급과 만료가 회사 계정에 적용됩니다.</span></div>
        </div>
        <div class="warn-box"><strong>결제 후 취소·환불은 불가</strong>합니다. 기간은 구매 시점부터 새로 시작하며 남은 일수를 더하지 않습니다. 다시 사면 EXPRESS 무료 횟수도 그 시점부터 다시 받습니다.</div>
        <div class="info-box">크립토가 꺼지거나 수탁 주소 오류가 나면 본사 ICOPAY 크립토 설정입니다. 카드가 있으면 카드로 구매하세요. 기업 공개 가입은 없지만, 로그인 후 유료 등급 구매는 이 메뉴에서 합니다.</div>`,
        `<span class="menu-path">Paid membership</span>
        <div class="check-box"><strong>Paid member</strong> does not mean “we have a corporate login.” It means <strong>a corporate grade was paid and has not expired</strong>. An account created by an admin starts as a <strong>standard member (STANDARD)</strong>. A standard company can still purchase and use escrow after verification and an approved wallet. Paid adds limits and EXPRESS benefits. Benefits sit on the <strong>company account</strong>, so the admin and operators share one expiry and one set of free counts.</div>
        <p><strong>How to tell on screen</strong></p>
        <ul>
          <li>Current grade is <strong>PREMIUMB · VIPB · VVIPB · PRESTIGEB · BLACKB</strong> and paid-until is still ahead. The B marks a corporate product. Individual names such as PREMIUM are not shown.</li>
          <li>If it says not on a paid plan, or the date has passed, you are a standard company. Free EXPRESS counts and paid limits turn off.</li>
          <li>Only corporate grades HQ put on sale appear as cards.</li>
        </ul>
        <p><strong>What changes while paid</strong> (HQ values for that grade, before expiry)</p>
        <ul>
          <li><strong>Limits</strong> — paid limits can override the company’s standard caps.</li>
          <li><strong>Free EXPRESS counts</strong> — each faster tier has a 0-fee count for the whole period. It does not reset monthly. The whole company shares the counts.</li>
          <li><strong>Discount after the free count</strong> — until expiry, EXPRESS can bill below the standard fee.</li>
        </ul>
        <p>Price is <strong>USD</strong>. USDT/USDC are 1:1; EURC uses the EUR rate. Period is days (1–30) or months (2–12); many products are 12 months.</p>
        <p><strong>How to buy</strong> (company admin)</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Open <strong>Paid membership</strong>.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Read price, period, and charge currency on the corporate card.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>Buy with card</strong> or <strong>Buy with crypto</strong>. Only allowed buttons show.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ICOPAY opens. Card needs the account email and phone with country code. Crypto follows the deposit page.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">Confirm on the result page. If pending, use <strong>Refresh status</strong>. Grade and expiry then apply to the company.</span></div>
        </div>
        <div class="warn-box"><strong>No cancel or refund after payment.</strong> The period starts at purchase and does not add leftover days. Buying again grants EXPRESS free counts again from that date.</div>
        <div class="info-box">If crypto is off or shows a custody-address error, that is HQ ICOPAY crypto setup. Use card when allowed. Corporates have no public signup, but after login they buy a paid grade in this menu.</div>`,
        `<span class="menu-path">有料会員</span>
        <div class="check-box"><strong>有料会員</strong>は「法人アカウントがある」ことではありません。<strong>法人等級を支払い、有料期限が残っている</strong>状態です。管理者が作った法人は最初<strong>一般会員(STANDARD)</strong>です。一般の法人も認証パスと承認ウォレットがあれば購入・エスクローができます。有料はその上に限度とEXPRESS特典を足します。特典は<strong>会社アカウント</strong>に付くので、代表と運営者は同じ期限・回数を使います。</div>
        <p><strong>画面での見分け方</strong></p>
        <ul>
          <li>現在の等級が <strong>PREMIUMB · VIPB · VVIPB · PRESTIGEB · BLACKB</strong> で期限が未来なら有料の法人です。末尾Bは法人商品です。個人のPREMIUMなどは出ません。</li>
          <li>「有料未適用」または期限切れなら一般の法人です。無料回数と有料限度はオフです。</li>
          <li>本社が販売中の法人等級だけカードになります。</li>
        </ul>
        <p><strong>有料のあいだ変わること</strong>（本社がその等級に設定した値、期限前）</p>
        <ul>
          <li><strong>取引限度</strong> — 法人の通常限度より有料限度が優先されることがあります。</li>
          <li><strong>EXPRESS無料回数</strong> — 早い等級ごとに期間全体の0円回数。毎月リセットしません。会社全体で同じ回数を使います。</li>
          <li><strong>回数後の割引</strong> — 期限まで通常より安い有料割引になり得ます。</li>
        </ul>
        <p>価格は<strong>USD</strong>。USDT/USDCは1:1、EURCはEUR相場。期間は日(1–30)または月(2–12)。多くの商品は12か月です。</p>
        <p><strong>購入手順</strong>（代表管理者が実施）</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>有料会員登録</strong>を開きます。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">法人カードの価格・期間・請求通貨を確認します。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>カードで購入</strong>または<strong>クリプトで購入</strong>。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ICOPAYへ。カードはアカウントのメール・電話(国番号)が必要。クリプトは入金案内に従います。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">結果画面で確定。確認待ちなら<strong>状態を更新</strong>。確定すると等級と期限が会社に付きます。</span></div>
        </div>
        <div class="warn-box"><strong>決済後の取消・返金は不可</strong>です。期間は購入時点から再開し残日数は足しません。再購入でEXPRESS無料回数もその日から再付与されます。</div>
        <div class="info-box">クリプトが無効またはカストディ住所エラーなら本社のICOPAYクリプト設定です。カードがあればカードで。法人の公開登録はありませんが、ログイン後の有料購入はこのメニューです。</div>`,
        `<span class="menu-path">付费会员</span>
        <div class="check-box"><strong>付费会员</strong>不是“已有企业账号”。它是<strong>已购买企业等级且尚未到期</strong>。管理员创建的企业一开始是<strong>普通会员（STANDARD）</strong>。普通企业在认证通过且钱包已批准后仍可采购和托管。付费是在此之上增加限额与 EXPRESS 权益。权益挂在<strong>公司账户</strong>上，代表与操作员共用同一个到期日和同一组免费次数。</div>
        <p><strong>如何在画面上判断</strong></p>
        <ul>
          <li>当前等级为 <strong>PREMIUMB · VIPB · VVIPB · PRESTIGEB · BLACKB</strong> 且到期日未到。末尾 B 表示企业商品。不会出现个人的 PREMIUM 等名称。</li>
          <li>显示未付费或已过期，即为普通企业。免费次数与付费限额关闭。</li>
          <li>仅总部在售的企业等级会显示为卡片。</li>
        </ul>
        <p><strong>付费期间会变化的内容</strong>（总部为该等级设置的值，到期前）</p>
        <ul>
          <li><strong>交易限额</strong> — 付费限额可优先于企业普通限额。</li>
          <li><strong>EXPRESS 免费次数</strong> — 每个更快等级在整个期限内有若干次 0 费，不按月重置。全公司共用次数。</li>
          <li><strong>次数用完后的折扣</strong> — 到期前可能低于普通 EXPRESS 费率。</li>
        </ul>
        <p>价格为 <strong>USD</strong>。USDT/USDC 为 1:1；EURC 按 EUR 汇率。期限为天(1–30)或月(2–12)，许多商品为 12 个月。</p>
        <p><strong>购买步骤</strong>（由代表管理员操作）</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">打开<strong>付费会员注册</strong>。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">查看企业卡片的价格、期限与收费币种。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>卡支付购买</strong>或<strong>加密支付购买</strong>。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">进入 ICOPAY。卡支付需要账户邮箱与电话(含国家号)。加密按入金说明操作。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">在结果页确认。确认中请<strong>刷新状态</strong>。确认后等级与到期日记在公司账户上。</span></div>
        </div>
        <div class="warn-box"><strong>付款后不可取消或退款。</strong>期限从购买时重新开始，不叠加剩余天数。再次购买会重新发放 EXPRESS 免费次数。</div>
        <div class="info-box">加密关闭或出现托管地址错误，是总部 ICOPAY 加密设置。允许卡支付时请用卡。企业没有公开注册，但登录后在此菜单购买付费等级。</div>`,
        `<span class="menu-path">สมาชิกเสียเงิน</span>
        <div class="check-box"><strong>สมาชิกเสียเงิน</strong>ไม่ได้แปลว่ามีบัญชีนิติบุคคล แต่คือ<strong>ซื้อระดับนิติแล้วและยังไม่หมดอายุ</strong> บัญชีที่ผู้ดูแลสร้างเริ่มเป็น<strong>สมาชิกทั่วไป (STANDARD)</strong> นิติทั่วไปก็ซื้อและเอสโครว์ได้หลังผ่านยืนยันและมีกระเป๋าที่อนุมัติ สมาชิกเสียเงินเพิ่มวงเงินและสิทธิ EXPRESS สิทธิอยู่ที่<strong>บัญชีบริษัท</strong> แอดมินและผู้ปฏิบัติงานใช้วันหมดอายุและจำนวนฟรีชุดเดียวกัน</div>
        <p><strong>ดูบนหน้าจออย่างไร</strong></p>
        <ul>
          <li>ระดับปัจจุบันเป็น <strong>PREMIUMB · VIPB · VVIPB · PRESTIGEB · BLACKB</strong> และวันหมดอายุยังไม่ถึง ตัว B ท้ายคือสินค้านิติ จะไม่เห็นชื่อบุคคลเช่น PREMIUM</li>
          <li>ถ้าขึ้นว่ายังไม่เสียเงินหรือเลยวันแล้ว คือนิติทั่วไป จำนวนฟรีและวงเงินเสียเงินจะปิด</li>
          <li>โชว์เฉพาะระดับนิติที่ HQ เปิดขาย</li>
        </ul>
        <p><strong>อะไรเปลี่ยนเมื่อยังเสียเงิน</strong> (ค่าที่ HQ ตั้ง ก่อนหมดอายุ)</p>
        <ul>
          <li><strong>วงเงิน</strong> — วงเงินเสียเงินอาจมาก่อนวงเงินทั่วไปของนิติ</li>
          <li><strong>จำนวน EXPRESS ฟรี</strong> — แต่ละระดับที่เร็วขึ้นมีจำนวน 0 บาทตลอดระยะ ไม่รีเซ็ตรายเดือน ทั้งบริษัทใช้จำนวนเดียวกัน</li>
          <li><strong>ส่วนลดหลังหมดจำนวน</strong> — จนหมดอายุอาจถูกกว่าอัตรา EXPRESS ทั่วไป</li>
        </ul>
        <p>ราคาเป็น <strong>USD</strong> USDT/USDC = 1:1 EURC ตามเรท EUR ระยะเป็นวัน (1–30) หรือเดือน (2–12) ส่วนใหญ่ 12 เดือน</p>
        <p><strong>วิธีซื้อ</strong> (แอดมินบริษัทเป็นผู้ทำ)</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">เปิด<strong>สมัครสมาชิกเสียเงิน</strong></span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ดูราคา ระยะ สกุลเงินบนการ์ดนิติ</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>ซื้อด้วยบัตร</strong>หรือ<strong>ซื้อด้วยคริปโต</strong></span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ไป ICOPAY บัตรต้องมีอีเมลและเบอร์ของบัญชี คริปโตทำตามหน้าฝาก</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">ยืนยันที่หน้าผล หากรอให้กด<strong>รีเฟรชสถานะ</strong> เมื่อยืนยัน ระดับและวันหมดอายุติดที่บริษัท</span></div>
        </div>
        <div class="warn-box"><strong>หลังชำระแล้วยกเลิกหรือคืนเงินไม่ได้</strong> ระยะเริ่มใหม่จากวันซื้อ ไม่บวกวันที่เหลือ ซื้อซ้ำได้จำนวน EXPRESS ฟรีใหม่</div>
        <div class="info-box">ถ้าคริปโตปิดหรือขึ้นที่อยู่คัสโตดีผิดพลาด เป็นการตั้งค่า ICOPAY ของ HQ ถ้ามีบัตรให้ใช้บัตร นิติไม่มีสมัครสาธารณะ แต่หลังเข้าสู่ระบบซื้อระดับเสียเงินที่เมนูนี้</div>`,
      ),
    },
    {
      id: 'co-express',
      title: L(
        'EXPRESS란 · 쓰는 방법',
        'What EXPRESS is · how to use it',
        'EXPRESSとは · 使い方',
        '什么是 EXPRESS · 如何使用',
        'EXPRESS คืออะไร · วิธีใช้',
      ),
      bodyHtml: L(
        `<span class="menu-path">크립토 매입 신청 → EXPRESS (빠른 완료)</span>
        <div class="check-box"><strong>EXPRESS</strong>는 별도 가입 상품이 아닙니다. 크립토 매입을 넣을 때 <strong>얼마나 빨리 끝내 달라고 할지</strong>를 고릅니다. 고르지 않으면 <strong>BASIC</strong>입니다. 꺼진 등급은 목록에 없습니다. 대표와 운영자 중 매입을 신청할 수 있는 사람이 고릅니다. 유료 무료 횟수는 회사 계정에서 같이 줄어듭니다.</div>
        <p>빠른 등급일수록 수수료가 붙을 수 있습니다. 금액은 <strong>고정(크립토) + 거래 금액의 %</strong>입니다. BASIC은 보통 0입니다.</p>
        <table>
          <tr><th>등급</th><th>완료 약속</th></tr>
          <tr><td>ULTRA</td><td>1시간 이내</td></tr>
          <tr><td>PRIORITY</td><td>6시간 이내</td></tr>
          <tr><td>HALF</td><td>12시간 이내</td></tr>
          <tr><td>DAY</td><td>24시간 이내</td></tr>
          <tr><td>D1</td><td>견적 확정일 기준 다음 날(D+1) 23:59까지</td></tr>
          <tr><td>D2</td><td>견적 확정일 기준 D+2일 23:59까지</td></tr>
          <tr><td>BASIC</td><td>견적 확정일 기준 D+3일 23:59까지 (기본)</td></tr>
        </table>
        <ul>
          <li>D+N은 <strong>견적 확정일</strong>부터입니다. 약속을 넘기면 실제 완료 시각으로 다시 계산되고, 더 받은 수수료는 복원될 수 있습니다.</li>
          <li><strong>일반 기업</strong>은 화면의 EXPRESS 요금을 냅니다.</li>
          <li><strong>유료 기업</strong>(만료 전)은 그 등급 무료 횟수가 남아 있으면 0원입니다. 횟수는 유료 기간 전체이며 매달 다시 채워지지 않습니다. BASIC은 무료 횟수 대상이 아닙니다.</li>
          <li>횟수를 다 쓰면 만료 전까지 유료 할인 요금입니다. 멤버십을 다시 사면 기간과 횟수가 구매 시점부터 다시 시작됩니다.</li>
          <li>빠른 등급을 고르지 않아도 BASIC으로 매입할 수 있습니다.</li>
        </ul>
        <div class="info-box">신청 상세에서 신청 등급, 약속 시각, 실제 달성 등급, 정산 수수료, 복원 여부를 확인합니다.</div>`,
        `<span class="menu-path">Crypto purchase → EXPRESS (faster completion)</span>
        <div class="check-box"><strong>EXPRESS</strong> is not a separate signup. On a crypto purchase you choose <strong>how fast completion is promised</strong>. If you do not choose, <strong>BASIC</strong> applies. Hidden tiers are turned off. Whoever can apply (admin or operator) picks the tier. Paid free counts go down on the shared company account.</div>
        <p>Faster tiers can cost more: a <strong>fixed crypto fee plus a percent of the trade</strong>. BASIC is usually 0.</p>
        <table>
          <tr><th>Tier</th><th>Promise</th></tr>
          <tr><td>ULTRA</td><td>Within 1 hour</td></tr>
          <tr><td>PRIORITY</td><td>Within 6 hours</td></tr>
          <tr><td>HALF</td><td>Within 12 hours</td></tr>
          <tr><td>DAY</td><td>Within 24 hours</td></tr>
          <tr><td>D1</td><td>By 23:59 on D+1 from quote confirmation</td></tr>
          <tr><td>D2</td><td>By 23:59 on D+2 from quote confirmation</td></tr>
          <tr><td>BASIC</td><td>By 23:59 on D+3 from quote confirmation (default)</td></tr>
        </table>
        <ul>
          <li>D+N counts from the <strong>quote confirmation day</strong>. If the promise is missed, the fee can be recalculated and any extra restored.</li>
          <li>A <strong>standard company</strong> pays the EXPRESS price shown.</li>
          <li>An <strong>active paid company</strong> pays 0 while that tier’s free count remains. Counts cover the whole paid period and do not refill monthly. BASIC has no free count.</li>
          <li>After the count is used, the paid discount applies until expiry. Buying again restarts the period and the counts.</li>
          <li>You can purchase on BASIC without a faster tier.</li>
        </ul>
        <div class="info-box">The ticket shows the requested tier, promised time, tier achieved, settled fee, and any amount restored.</div>`,
        `<span class="menu-path">クリプト購入 → EXPRESS（早い完了）</span>
        <div class="check-box"><strong>EXPRESS</strong>は別の加入商品ではありません。購入時に<strong>どれだけ早く完了を約束するか</strong>を選びます。未選択は<strong>BASIC</strong>です。OFFの等級は出ません。申請できる代表または運営者が選びます。有料の無料回数は会社アカウントで一緒に減ります。</div>
        <p>速いほど手数料が付くことがあります。<strong>固定(クリプト)＋取引額の%</strong>です。BASICは通常0です。</p>
        <table>
          <tr><th>等級</th><th>完了の約束</th></tr>
          <tr><td>ULTRA</td><td>1時間以内</td></tr>
          <tr><td>PRIORITY</td><td>6時間以内</td></tr>
          <tr><td>HALF</td><td>12時間以内</td></tr>
          <tr><td>DAY</td><td>24時間以内</td></tr>
          <tr><td>D1</td><td>見積確定日の翌日(D+1) 23:59まで</td></tr>
          <tr><td>D2</td><td>見積確定日からD+2日 23:59まで</td></tr>
          <tr><td>BASIC</td><td>見積確定日からD+3日 23:59まで（既定）</td></tr>
        </table>
        <ul>
          <li>D+Nは<strong>見積確定日</strong>から。約束を過ぎると再計算され、多く受け取った分は復元され得ます。</li>
          <li><strong>一般の法人</strong>は画面の料金を支払います。</li>
          <li><strong>有料の法人</strong>（期限内）は無料回数が残っていれば0円です。回数は期間全体で毎月は補充されません。BASICは対象外です。</li>
          <li>回数後は期限まで有料割引です。再購入で期間と回数が購入日から再開します。</li>
          <li>速い等級を選ばなくてもBASICで購入できます。</li>
        </ul>
        <div class="info-box">申請詳細で申請等級、約束時刻、達成等級、精算手数料、復元の有無を確認します。</div>`,
        `<span class="menu-path">加密货币采购 → EXPRESS（更快完成）</span>
        <div class="check-box"><strong>EXPRESS</strong>不是另一项注册。申请采购时选择<strong>承诺多快完成</strong>。不选则为 <strong>BASIC</strong>。已关闭的等级不显示。能申请的代表或操作员来选择。付费免费次数在公司账户上一起减少。</div>
        <p>越快可能越贵：<strong>固定（加密）+ 交易金额的百分比</strong>。BASIC 通常为 0。</p>
        <table>
          <tr><th>等级</th><th>完成承诺</th></tr>
          <tr><td>ULTRA</td><td>1 小时内</td></tr>
          <tr><td>PRIORITY</td><td>6 小时内</td></tr>
          <tr><td>HALF</td><td>12 小时内</td></tr>
          <tr><td>DAY</td><td>24 小时内</td></tr>
          <tr><td>D1</td><td>报价确认日次日(D+1) 23:59 前</td></tr>
          <tr><td>D2</td><td>报价确认日起 D+2 日 23:59 前</td></tr>
          <tr><td>BASIC</td><td>报价确认日起 D+3 日 23:59 前（默认）</td></tr>
        </table>
        <ul>
          <li>D+N 从<strong>报价确认日</strong>起算。未按时完成会重算，多收部分可退回。</li>
          <li><strong>普通企业</strong>按画面价格支付。</li>
          <li><strong>有效付费企业</strong>在该等级免费次数剩余时为 0 费。次数覆盖整个付费期，不按月补充。BASIC 没有免费次数。</li>
          <li>次数用完后至到期按付费折扣计费。再次购买会重新开始期限与次数。</li>
          <li>不选更快等级时仍可用 BASIC 采购。</li>
        </ul>
        <div class="info-box">申请详情可查看申请等级、承诺时间、实际达成、结算手续费及是否退回。</div>`,
        `<span class="menu-path">ซื้อคริปโต → EXPRESS (เสร็จเร็วขึ้น)</span>
        <div class="check-box"><strong>EXPRESS</strong>ไม่ใช่การสมัครแยก ตอนซื้อคริปโตเลือก<strong>สัญญาว่าจะเสร็จเร็วแค่ไหน</strong> ถ้าไม่เลือกเป็น <strong>BASIC</strong> ระดับที่ปิดจะไม่โชว์ คนที่สมัครได้ (แอดมินหรือผู้ปฏิบัติงาน) เป็นผู้เลือก จำนวนฟรีของสมาชิกเสียเงินลดที่บัญชีบริษัทเดียวกัน</div>
        <p>ยิ่งเร็วอาจยิ่งมีค่าธรรมเนียม: <strong>คงที่ (คริปโต) + % ของยอด</strong> BASIC มักเป็น 0</p>
        <table>
          <tr><th>ระดับ</th><th>คำสัญญา</th></tr>
          <tr><td>ULTRA</td><td>ภายใน 1 ชั่วโมง</td></tr>
          <tr><td>PRIORITY</td><td>ภายใน 6 ชั่วโมง</td></tr>
          <tr><td>HALF</td><td>ภายใน 12 ชั่วโมง</td></tr>
          <tr><td>DAY</td><td>ภายใน 24 ชั่วโมง</td></tr>
          <tr><td>D1</td><td>ถึง 23:59 ของ D+1 จากวันยืนยันใบเสนอราคา</td></tr>
          <tr><td>D2</td><td>ถึง 23:59 ของ D+2 จากวันยืนยันใบเสนอราคา</td></tr>
          <tr><td>BASIC</td><td>ถึง 23:59 ของ D+3 จากวันยืนยันใบเสนอราคา (ค่าเริ่มต้น)</td></tr>
        </table>
        <ul>
          <li>D+N นับจาก<strong>วันยืนยันใบเสนอราคา</strong> ถ้าเลยสัญญาอาจคำนวณใหม่และคืนส่วนเกิน</li>
          <li><strong>นิติทั่วไป</strong>จ่ายตามราคาที่โชว์</li>
          <li><strong>นิติที่เสียเงินและยังมีผล</strong> เป็น 0 จนกว่าจำนวนฟรีของระดับนั้นจะหมด จำนวนครอบทั้งระยะ ไม่เติมรายเดือน BASIC ไม่มีจำนวนฟรี</li>
          <li>หมดจำนวนแล้วจนหมดอายุคิดส่วนลดสมาชิก ซื้อใหม่จะเริ่มระยะและจำนวนใหม่</li>
          <li>ไม่เลือกเร็วขึ้นก็ซื้อด้วย BASIC ได้</li>
        </ul>
        <div class="info-box">ในรายละเอียดดูระดับที่ขอ เวลาที่สัญญา ระดับที่ทำได้จริง ค่าธรรมเนียม และส่วนที่คืน</div>`,
      ),
    },
    {
      id: 'co-faq',
      title: L('자주 묻는 질문', 'FAQ', 'よくある質問', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">개인용 메뉴얼이 안 보입니다.</div><div class="faq-a">기업 계정은 기업용만 열립니다. 개인 계정으로 로그인하면 개인용만 보입니다. 총본사·조직은 둘 다 볼 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">공개 가입이 없습니다.</div><div class="faq-a">정상입니다. 기업은 관리자 등록 또는 고객 상세에서 유형을 지정합니다.</div></div>
        <div class="faq-item"><div class="faq-q">송금만 보이고 이체가 없습니다.</div><div class="faq-a">본사 또는 고객 상세에서 계좌이체가 꺼져 있을 수 있습니다. 지원팀에 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">운영자를 더 만들 수 없습니다.</div><div class="faq-a">활성 운영자 최대 2명입니다. 중지된 계정도 상한에 포함될 수 있습니다. 삭제는 없고 중지만 가능합니다.</div></div>
        <div class="faq-item"><div class="faq-q">인보이스 삭제가 두 번 물어봅니다.</div><div class="faq-a">의도된 동작입니다. PDF 미리보기로 확인한 뒤 2단계 확인으로 삭제하세요.</div></div>
        <div class="faq-item"><div class="faq-q">지갑을 직접 삭제할 수 없습니다.</div><div class="faq-a">삭제 요청 후 본사 승인이 필요합니다. 진행 중 거래가 있으면 해당 지갑 주소를 바꿀 수 없습니다.</div></div>
        <div class="faq-item"><div class="faq-q">기업 계정이면 유료회원인가요?</div><div class="faq-a">아닙니다. 기업 계정은 처음에 일반회원입니다. 유료회원가입에서 PREMIUMB 등 법인 등급을 결제하고 만료가 남아 있을 때만 유료입니다. 혜택은 회사 계정에 붙어 운영자와 같이 씁니다.</div></div>
        <div class="faq-item"><div class="faq-q">유료를 환불할 수 있나요?</div><div class="faq-a">결제 후 취소·환불은 불가입니다. 기간은 구매 시점부터 새로 시작합니다.</div></div>
        <div class="faq-item"><div class="faq-q">EXPRESS가 안 보이거나 회사인데도 유료가 아닙니다.</div><div class="faq-a">목록에 없으면 그 등급이 꺼져 있습니다. 선택하지 않으면 BASIC입니다. 유료인데 0원이 아니면 회사의 그 등급 무료 횟수를 다 쓴 것이거나 BASIC입니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">I do not see the individual manual.</div><div class="faq-a">Corporate accounts open corporate only. Individual logins see individual only. HQ/org see both.</div></div>
        <div class="faq-item"><div class="faq-q">There is no public signup.</div><div class="faq-a">Expected — corporates are registered by an admin or typed as Corporate on customer detail.</div></div>
        <div class="faq-item"><div class="faq-q">I only see remittance, not bank transfer.</div><div class="faq-a">HQ or your customer toggle may have disabled transfer. Contact support.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot add another operator.</div><div class="faq-a">Max 2 active operators. Suspended ones may still count. No delete — suspend only.</div></div>
        <div class="faq-item"><div class="faq-q">Invoice delete asks twice.</div><div class="faq-a">Intended. Preview the PDF, then complete the two-step confirm.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot delete a wallet myself.</div><div class="faq-a">Request deletion and wait for HQ. In-progress trades lock that wallet address.</div></div>
        <div class="faq-item"><div class="faq-q">Is a corporate account automatically paid?</div><div class="faq-a">No. A new company is a standard member. You are paid only after buying a corporate grade such as PREMIUMB and while paid-until is still ahead. Benefits sit on the company account and are shared with operators.</div></div>
        <div class="faq-item"><div class="faq-q">Can we refund paid membership?</div><div class="faq-a">No cancel or refund after payment. The period starts again at purchase.</div></div>
        <div class="faq-item"><div class="faq-q">EXPRESS is missing, or we are a company but it is not free.</div><div class="faq-a">A missing tier is turned off. If you do not choose, BASIC applies. If you are paid but still charged, the company’s free count for that tier is used up, or you chose BASIC.</div></div>`,
        `<div class="faq-item"><div class="faq-q">個人マニュアルが見えません。</div><div class="faq-a">法人は法人用のみ。個人ログインは個人用のみ。総本社・組織は両方。</div></div>
        <div class="faq-item"><div class="faq-q">公開登録がありません。</div><div class="faq-a">正常です。法人は管理者登録または顧客詳細でタイプ指定します。</div></div>
        <div class="faq-item"><div class="faq-q">送金だけで振替がありません。</div><div class="faq-a">本社または顧客設定で振替OFFの可能性があります。サポートへ。</div></div>
        <div class="faq-item"><div class="faq-q">運営者をこれ以上作れません。</div><div class="faq-a">有効最大2名。停止済みも上限に含まれることがあります。削除はなく停止のみ。</div></div>
        <div class="faq-item"><div class="faq-q">インボイス削除が2回確認されます。</div><div class="faq-a">仕様です。PDFプレビュー後に2段階確認で削除してください。</div></div>
        <div class="faq-item"><div class="faq-q">ウォレットを自分で削除できません。</div><div class="faq-a">削除依頼後に本社承認が必要です。進行中取引があるとアドレス変更不可です。</div></div>
        <div class="faq-item"><div class="faq-q">法人アカウントなら有料会員ですか?</div><div class="faq-a">いいえ。最初は一般会員です。有料会員登録でPREMIUMBなど法人等級を支払い、期限が残っているときだけ有料です。特典は会社アカウントに付き、運営者と共有します。</div></div>
        <div class="faq-item"><div class="faq-q">有料を返金できますか?</div><div class="faq-a">決済後の取消・返金は不可です。期間は購入時点から再開します。</div></div>
        <div class="faq-item"><div class="faq-q">EXPRESSが出ない、または法人なのに無料ではありません。</div><div class="faq-a">一覧にない等級はOFFです。未選択はBASICです。有料なのに0円でないなら、会社のその無料回数を使い切ったかBASICです。</div></div>`,
        `<div class="faq-item"><div class="faq-q">看不到个人手册。</div><div class="faq-a">企业账号只打开企业手册；个人登录只看个人手册。总部/组织可看两者。</div></div>
        <div class="faq-item"><div class="faq-q">没有公开注册。</div><div class="faq-a">正常。企业由管理员登记或在客户详情指定类型。</div></div>
        <div class="faq-item"><div class="faq-q">只有汇款没有转账。</div><div class="faq-a">总部或客户设置可能关闭了转账。请联系支持。</div></div>
        <div class="faq-item"><div class="faq-q">无法再添加操作员。</div><div class="faq-a">启用最多 2 名。已停用也可能计入上限。不可删除，仅可停用。</div></div>
        <div class="faq-item"><div class="faq-q">删除发票要确认两次。</div><div class="faq-a">设计如此。先预览 PDF，再完成两步确认。</div></div>
        <div class="faq-item"><div class="faq-q">不能自行删除钱包。</div><div class="faq-a">需申请删除并等待总部批准。有进行中交易时不能改该地址。</div></div>
        <div class="faq-item"><div class="faq-q">有企业账号就是付费会员吗？</div><div class="faq-a">不是。新企业一开始是普通会员。在付费会员中购买 PREMIUMB 等企业等级，且到期日未到，才是付费。权益在公司账户上，与操作员共用。</div></div>
        <div class="faq-item"><div class="faq-q">可以退付费吗？</div><div class="faq-a">付款后不可取消或退款。期限从购买时重新开始。</div></div>
        <div class="faq-item"><div class="faq-q">看不到 EXPRESS，或已是企业却不免费。</div><div class="faq-a">列表中没有表示该等级已关闭。不选则为 BASIC。已付费仍收费，表示公司该等级免费次数已用完，或选了 BASIC。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ไม่เห็นคู่มือบุคคล</div><div class="faq-a">บัญชีนิติเปิดได้เฉพาะคู่มือนิติ บุคคลเห็นเฉพาะคู่มือบุคคล HQ/องค์กรเห็นทั้งสอง</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีสมัครสาธารณะ</div><div class="faq-a">ถูกต้อง นิติลงทะเบียนโดยผู้ดูแลหรือตั้งประเภทที่หน้ารายละเอียด</div></div>
        <div class="faq-item"><div class="faq-q">เห็นแค่ธุรกรรมโอน ไม่มีโอนบัญชี</div><div class="faq-a">HQ หรือตั้งค่าลูกค้าอาจปิดโอนบัญชี ติดต่อซัพพอร์ต</div></div>
        <div class="faq-item"><div class="faq-q">เพิ่มผู้ปฏิบัติงานอีกไม่ได้</div><div class="faq-a">สูงสุด 2 คนที่เปิดใช้ บัญชีที่หยุดอาจนับรวม ลบไม่ได้ หยุดได้อย่างเดียว</div></div>
        <div class="faq-item"><div class="faq-q">ลบใบแจ้งหนี้ถามสองครั้ง</div><div class="faq-a">ตั้งใจเช่นนั้น ดูตัวอย่าง PDF แล้วยืนยัน 2 ขั้น</div></div>
        <div class="faq-item"><div class="faq-q">ลบกระเป๋าเองไม่ได้</div><div class="faq-a">ขอลบแล้วรอ HQ อนุมัติ รายการกำลังทำจะเปลี่ยนที่อยู่ไม่ได้</div></div>
        <div class="faq-item"><div class="faq-q">มีบัญชีนิติแล้วเป็นสมาชิกเสียเงินไหม</div><div class="faq-a">ไม่ เริ่มต้นเป็นสมาชิกทั่วไป จะเสียเงินเมื่อซื้อระดับนิติเช่น PREMIUMB และวันหมดอายุยังไม่ถึง สิทธิอยู่ที่บัญชีบริษัท ใช้ร่วมกับผู้ปฏิบัติงาน</div></div>
        <div class="faq-item"><div class="faq-q">คืนเงินสมาชิกเสียเงินได้ไหม</div><div class="faq-a">หลังชำระแล้วยกเลิกหรือคืนเงินไม่ได้ ระยะเริ่มใหม่จากวันซื้อ</div></div>
        <div class="faq-item"><div class="faq-q">ไม่เห็น EXPRESS หรือเป็นนิติแล้วแต่ไม่ฟรี</div><div class="faq-a">ถ้าไม่อยู่ในรายการ ระดับนั้นปิด ถ้าไม่เลือกเป็น BASIC ถ้าเสียเงินแล้วยังถูกคิด แปลว่าจำนวนฟรีของบริษัทหมด หรือเลือก BASIC</div></div>`,
      ),
    },
  ],
};
