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
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>계정 수령</strong> — 관리자가 등록한 이메일·임시 비밀번호로 로그인. 최초 로그인 시 비밀번호 변경이 필요할 수 있습니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong> — 켜져 있으면 앱 코드를 입력합니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>인증센터</strong> — 6개월 거래 예정 보고서 + 법인 서류를 올립니다. 양식은 이용메뉴얼에서 내려받습니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>내 지갑</strong> — 최대 5개. OTP + 두 번 확인. 새 주소는 본사 승인 후 매입에서 선택. 삭제는 본사 승인 후.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(선택) 운영자</strong> — 본사가 멀티 사용자를 허용하면 관리자가 OTP로 운영자 최대 2명 등록.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>크립토 시뮬레이터</strong> — 네트워크·금액으로 수수료 미리보기 (참고용).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>인증패스 후</strong> 계좌이체·송금·카드(허용 시)로 크립토 매입 또는 무역 에스크로. 필요 시 인보이스를 확인·미리보기합니다.</span></div>
        </div>
        <div class="warn-box">인증패스·승인 지갑 없이는 매입·에스크로가 진행되지 않습니다. 시뮬레이터는 확정 금액이 아닙니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>Receive credentials</strong> — sign in with the email and temporary password from your admin. You may need to change the password on first login.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong> if enabled.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>Verification</strong> — forecast + corporate documents (templates in Usage manuals).</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>My wallets</strong> — up to 5; OTP + two confirms; HQ approval for new addresses; HQ approval to delete.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(Optional) Operators</strong> — if HQ enabled multi-user, admin adds up to 2 operators with OTP.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>Crypto simulator</strong> — fee preview (reference only).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc">After a <strong>verification pass</strong>, purchase via bank transfer / remittance / card (when allowed), or trade escrow. Use invoices to preview when needed.</span></div>
        </div>
        <div class="warn-box">Without a pass and an approved wallet, purchase/escrow stay blocked. The simulator is not binding.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>アカウント受領</strong> — 管理者が登録したメール・仮パスワードでログイン。初回はパスワード変更が必要なことがあります。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong>（有効時）。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>認証センター</strong> — 報告書＋法人書類。様式は利用マニュアルから。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>マイウォレット</strong> — 最大5。OTP+2回確認。新アドレスは本社承認後。削除も本社承認後。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(任意) 運営者</strong> — 本社がマルチユーザー許可時、管理者がOTPで最大2名登録。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>クリプトシミュレーター</strong> — 手数料試算(参考)。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>認証パス後</strong>に振替・送金・カード(許可時)で購入、またはエスクロー。必要ならインボイスを確認。</span></div>
        </div>
        <div class="warn-box">認証パス・承認ウォレットがないと進めません。シミュレーターは確定金額ではありません。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>领取账号</strong> — 用管理员登记的邮箱与临时密码登录。首次可能需改密。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong>（若开启）。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>认证中心</strong> — 预估报告 + 企业文件。模板在使用手册。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>我的钱包</strong> — 最多 5；OTP+两次确认；新地址需总部批准；删除亦需总部批准。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(可选) 操作员</strong> — 总部开启多用户后，管理员用 OTP 最多登记 2 名。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>加密货币模拟器</strong> — 手续费预览（参考）。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>认证通过后</strong>用转账/汇款/卡（若允许）采购，或贸易托管。需要时查看发票预览。</span></div>
        </div>
        <div class="warn-box">无认证通过与已批钱包则无法继续。模拟器不是确定金额。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>รับบัญชี</strong> — เข้าด้วยอีเมล/รหัสชั่วคราวจากผู้ดูแล อาจต้องเปลี่ยนรหัสครั้งแรก</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Google OTP</strong> หากเปิด</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>ศูนย์ยืนยัน</strong> — รายงาน 6 เดือน + เอกสารนิติ แบบฟอร์มจากคู่มือใช้งาน</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>กระเป๋าของฉัน</strong> — สูงสุด 5 OTP+ยืนยันสองครั้ง ที่อยู่ใหม่/ลบต้อง HQ อนุมัติ</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>(ถ้ามี) ผู้ปฏิบัติงาน</strong> — หาก HQ เปิดหลายผู้ใช้ แอดมินเพิ่มได้สูงสุด 2 คนด้วย OTP</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>ตัวจำลองคริปโต</strong> — ดูค่าธรรมเนียม (อ้างอิง)</span></div>
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
      id: 'co-faq',
      title: L('자주 묻는 질문', 'FAQ', 'よくある質問', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">개인용 메뉴얼이 안 보입니다.</div><div class="faq-a">기업 계정은 기업용만 열립니다. 개인 계정으로 로그인하면 개인용만 보입니다. 총본사·조직은 둘 다 볼 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">공개 가입이 없습니다.</div><div class="faq-a">정상입니다. 기업은 관리자 등록 또는 고객 상세에서 유형을 지정합니다.</div></div>
        <div class="faq-item"><div class="faq-q">송금만 보이고 이체가 없습니다.</div><div class="faq-a">본사 또는 고객 상세에서 계좌이체가 꺼져 있을 수 있습니다. 지원팀에 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">운영자를 더 만들 수 없습니다.</div><div class="faq-a">활성 운영자 최대 2명입니다. 중지된 계정도 상한에 포함될 수 있습니다. 삭제는 없고 중지만 가능합니다.</div></div>
        <div class="faq-item"><div class="faq-q">인보이스 삭제가 두 번 물어봅니다.</div><div class="faq-a">의도된 동작입니다. PDF 미리보기로 확인한 뒤 2단계 확인으로 삭제하세요.</div></div>
        <div class="faq-item"><div class="faq-q">지갑을 직접 삭제할 수 없습니다.</div><div class="faq-a">삭제 요청 후 본사 승인이 필요합니다. 진행 중 거래가 있으면 해당 지갑 주소를 바꿀 수 없습니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">I do not see the individual manual.</div><div class="faq-a">Corporate accounts open corporate only. Individual logins see individual only. HQ/org see both.</div></div>
        <div class="faq-item"><div class="faq-q">There is no public signup.</div><div class="faq-a">Expected — corporates are registered by an admin or typed as Corporate on customer detail.</div></div>
        <div class="faq-item"><div class="faq-q">I only see remittance, not bank transfer.</div><div class="faq-a">HQ or your customer toggle may have disabled transfer. Contact support.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot add another operator.</div><div class="faq-a">Max 2 active operators. Suspended ones may still count. No delete — suspend only.</div></div>
        <div class="faq-item"><div class="faq-q">Invoice delete asks twice.</div><div class="faq-a">Intended. Preview the PDF, then complete the two-step confirm.</div></div>
        <div class="faq-item"><div class="faq-q">I cannot delete a wallet myself.</div><div class="faq-a">Request deletion and wait for HQ. In-progress trades lock that wallet address.</div></div>`,
        `<div class="faq-item"><div class="faq-q">個人マニュアルが見えません。</div><div class="faq-a">法人は法人用のみ。個人ログインは個人用のみ。総本社・組織は両方。</div></div>
        <div class="faq-item"><div class="faq-q">公開登録がありません。</div><div class="faq-a">正常です。法人は管理者登録または顧客詳細でタイプ指定します。</div></div>
        <div class="faq-item"><div class="faq-q">送金だけで振替がありません。</div><div class="faq-a">本社または顧客設定で振替OFFの可能性があります。サポートへ。</div></div>
        <div class="faq-item"><div class="faq-q">運営者をこれ以上作れません。</div><div class="faq-a">有効最大2名。停止済みも上限に含まれることがあります。削除はなく停止のみ。</div></div>
        <div class="faq-item"><div class="faq-q">インボイス削除が2回確認されます。</div><div class="faq-a">仕様です。PDFプレビュー後に2段階確認で削除してください。</div></div>
        <div class="faq-item"><div class="faq-q">ウォレットを自分で削除できません。</div><div class="faq-a">削除依頼後に本社承認が必要です。進行中取引があるとアドレス変更不可です。</div></div>`,
        `<div class="faq-item"><div class="faq-q">看不到个人手册。</div><div class="faq-a">企业账号只打开企业手册；个人登录只看个人手册。总部/组织可看两者。</div></div>
        <div class="faq-item"><div class="faq-q">没有公开注册。</div><div class="faq-a">正常。企业由管理员登记或在客户详情指定类型。</div></div>
        <div class="faq-item"><div class="faq-q">只有汇款没有转账。</div><div class="faq-a">总部或客户设置可能关闭了转账。请联系支持。</div></div>
        <div class="faq-item"><div class="faq-q">无法再添加操作员。</div><div class="faq-a">启用最多 2 名。已停用也可能计入上限。不可删除，仅可停用。</div></div>
        <div class="faq-item"><div class="faq-q">删除发票要确认两次。</div><div class="faq-a">设计如此。先预览 PDF，再完成两步确认。</div></div>
        <div class="faq-item"><div class="faq-q">不能自行删除钱包。</div><div class="faq-a">需申请删除并等待总部批准。有进行中交易时不能改该地址。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ไม่เห็นคู่มือบุคคล</div><div class="faq-a">บัญชีนิติเปิดได้เฉพาะคู่มือนิติ บุคคลเห็นเฉพาะคู่มือบุคคล HQ/องค์กรเห็นทั้งสอง</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีสมัครสาธารณะ</div><div class="faq-a">ถูกต้อง นิติลงทะเบียนโดยผู้ดูแลหรือตั้งประเภทที่หน้ารายละเอียด</div></div>
        <div class="faq-item"><div class="faq-q">เห็นแค่ธุรกรรมโอน ไม่มีโอนบัญชี</div><div class="faq-a">HQ หรือตั้งค่าลูกค้าอาจปิดโอนบัญชี ติดต่อซัพพอร์ต</div></div>
        <div class="faq-item"><div class="faq-q">เพิ่มผู้ปฏิบัติงานอีกไม่ได้</div><div class="faq-a">สูงสุด 2 คนที่เปิดใช้ บัญชีที่หยุดอาจนับรวม ลบไม่ได้ หยุดได้อย่างเดียว</div></div>
        <div class="faq-item"><div class="faq-q">ลบใบแจ้งหนี้ถามสองครั้ง</div><div class="faq-a">ตั้งใจเช่นนั้น ดูตัวอย่าง PDF แล้วยืนยัน 2 ขั้น</div></div>
        <div class="faq-item"><div class="faq-q">ลบกระเป๋าเองไม่ได้</div><div class="faq-a">ขอลบแล้วรอ HQ อนุมัติ รายการกำลังทำจะเปลี่ยนที่อยู่ไม่ได้</div></div>`,
      ),
    },
  ],
};
