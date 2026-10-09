import type { ManualDoc } from './manual-types';
import { L } from './locale-text';

/** 개인 고객 전용 퀵 매뉴얼 — 공개 가입·송금 중심·국가 한도 */
export const CUSTOMER_INDIVIDUAL_MANUAL: ManualDoc = {
  id: 'customer-individual',
  coverTitle: L(
    '개인용 고객 이용 메뉴얼',
    'Individual customer manual',
    '個人顧客向け利用マニュアル',
    '个人客户使用手册',
    'คู่มือลูกค้าบุคคล',
  ),
  coverSubtitle: L(
    '공개 가입 → 본사 승인 → 인증패스 → 지갑 → 시뮬레이터 → 송금·매입 (간편 가이드)',
    'Signup → HQ approval → verification → wallet → simulator → remittance & purchase (quick guide)',
    '公開登録→本社承認→認証パス→ウォレット→シミュレーター→送金・購入（かんたんガイド）',
    '公开注册 → 总部批准 → 认证通过 → 钱包 → 模拟器 → 汇款·采购（简易指南）',
    'สมัครสาธารณะ → HQ อนุมัติ → ผ่านยืนยัน → กระเป๋า → ตัวจำลอง → โอน·ซื้อ (คู่มือง่าย)',
  ),
  sections: [
    {
      id: 'i-who',
      title: L('이 메뉴얼은 누구용인가요?', 'Who is this for?', 'このマニュアルの対象', '本手册适用对象', 'คู่มือนี้สำหรับใคร'),
      bodyHtml: L(
        `<div class="check-box">이 문서는 <strong>개인(Individual)</strong> 고객·운영자용입니다. 기업(법인) 계정은 <strong>기업용 고객 이용 메뉴얼</strong>을 보세요.</div>
        <p>개인 고객의 특징</p>
        <ul>
          <li>로그인 화면에서 <strong>개인 회원가입</strong>이 가능합니다. 기업은 공개 가입이 없습니다.</li>
          <li>가입 직후에는 거래가 <strong>조회만 가능(VIEW_ONLY)</strong>일 수 있습니다. 본사 승인 후 매입·에스크로를 실행합니다.</li>
          <li>크립토 매입 결제수단 기본값은 <strong>송금거래</strong>입니다. 계좌이체·카드는 본사·고객 설정에 따라 보일 수 있습니다.</li>
          <li>국가별 <strong>1회 거래 한도</strong>가 적용될 수 있습니다. 가입·송금 화면의 안내를 확인하세요.</li>
        </ul>`,
        `<div class="check-box">This guide is for <strong>Individual</strong> customers and their operators. Corporate accounts use the <strong>Corporate customer manual</strong>.</div>
        <ul>
          <li><strong>Public signup</strong> is available for individuals. Corporations cannot self-register.</li>
          <li>Right after signup you may be <strong>view-only</strong> until HQ approval.</li>
          <li>Default crypto purchase method is <strong>remittance</strong>. Bank transfer / card appear only when HQ and your account allow them.</li>
          <li><strong>Per-transaction country limits</strong> may apply — check notices on signup and remittance screens.</li>
        </ul>`,
        `<div class="check-box">この文書は<strong>個人</strong>顧客・運営者向けです。法人は<strong>法人顧客向けマニュアル</strong>を見てください。</div>
        <ul>
          <li>ログイン画面で<strong>個人会員登録</strong>が可能です。法人の公開登録はありません。</li>
          <li>登録直後は<strong>閲覧のみ</strong>のことがあります。本社承認後に購入・エスクローが可能です。</li>
          <li>クリプト購入の既定手段は<strong>送金</strong>です。口座振替・カードは本社・顧客設定で表示されます。</li>
          <li>国ごとの<strong>1回取引限度</strong>がある場合があります。登録・送金画面の案内を確認してください。</li>
        </ul>`,
        `<div class="check-box">本文档适用于<strong>个人</strong>客户及其操作员。企业账户请看<strong>企业客户使用手册</strong>。</div>
        <ul>
          <li>登录页可进行<strong>个人注册</strong>。企业不可公开自助注册。</li>
          <li>注册后可能为<strong>仅查看</strong>，需总部批准后才能采购/托管。</li>
          <li>加密货币采购默认支付方式为<strong>汇款</strong>。转账/卡支付仅在总部与账户允许时显示。</li>
          <li>可能适用<strong>各国单笔限额</strong>，请查看注册与汇款页提示。</li>
        </ul>`,
        `<div class="check-box">เอกสารนี้สำหรับลูกค้า<strong>บุคคล</strong>และผู้ปฏิบัติงาน บัญชีนิติบุคคลใช้<strong>คู่มือลูกค้านิติบุคคล</strong></div>
        <ul>
          <li>สมัคร<strong>บุคคล</strong>ได้ที่หน้าเข้าสู่ระบบ นิติบุคคลสมัครสาธารณะไม่ได้</li>
          <li>หลังสมัครอาจเป็น<strong>ดูอย่างเดียว</strong> จนกว่า HQ จะอนุมัติ</li>
          <li>ช่องทางซื้อคริปโตเริ่มต้นคือ<strong>ธุรกรรมโอน</strong> โอนบัญชี/บัตรจะโชว์เมื่อ HQ และบัญชีอนุญาต</li>
          <li>อาจมี<strong>วงเงินต่อครั้งตามประเทศ</strong> — ดูข้อความบนหน้าสมัครและโอน</li>
        </ul>`,
      ),
    },
    {
      id: 'i-start',
      title: L('빠른 시작 순서', 'Quick start order', 'かんたん開始の順番', '快速开工顺序', 'ลำดับเริ่มงานแบบเร็ว'),
      bodyHtml: L(
        `<p>아래 순서를 지키면 막히는 일이 줄어듭니다.</p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>개인 회원가입</strong> — 이메일·휴대폰(국가번호)·비밀번호. 추천인이 있으면 이메일·이름·전화로 검색해 확인합니다. 없으면 본사 직속으로 연결됩니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>로그인</strong> — Google OTP가 켜져 있으면 앱 코드를 입력합니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>본사 승인 대기</strong> — 승인 전에는 매입·에스크로 실행이 막힐 수 있습니다. 승인되면 거래 실행이 열립니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>인증센터</strong> — 6개월 거래 예정 보고서 등 서류를 올립니다. 양식은 이용메뉴얼에서 내려받습니다.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>내 지갑</strong> — 최대 5개. 등록·주소 변경·삭제 요청은 OTP + 두 번 확인. 새 주소는 본사 승인 후 매입에서 선택합니다.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>크립토 시뮬레이터</strong> — 네트워크·금액으로 수수료·수령액을 미리 봅니다 (참고용).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>인증패스 후</strong> 크립토 매입 또는 무역 에스크로를 신청합니다. 개인 기본 결제수단은 <strong>송금거래</strong>입니다.</span></div>
        </div>
        <div class="warn-box">인증패스·승인 지갑·본사 승인이 없으면 매입·에스크로가 진행되지 않습니다. 시뮬레이터는 확정 금액이 아닙니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>Individual signup</strong> — email, phone (country code), password. Search and confirm a referrer by email, name, or phone if you have one; otherwise you link to HQ.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Sign in</strong> — enter Google OTP if enabled.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>Wait for HQ approval</strong> — purchase/escrow may stay blocked until approved.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>Verification</strong> — upload the 6-month forecast (templates in Usage manuals).</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>My wallets</strong> — up to 5. Register / change / delete-request need OTP and two confirms. New addresses need HQ approval.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>Crypto simulator</strong> — preview fees (reference only).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc">After a <strong>verification pass</strong>, apply for Crypto purchase or escrow. Default method for individuals is <strong>remittance</strong>.</span></div>
        </div>
        <div class="warn-box">Without a pass, an approved wallet, and HQ approval, purchase/escrow stay blocked. The simulator is not a binding amount.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>個人会員登録</strong> — メール・電話(国番号)・パスワード。紹介者がいればメール・氏名・電話で検索確認。なければ本社直結。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>ログイン</strong> — Google OTPがあれば入力。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>本社承認待ち</strong> — 承認前は購入・エスクローが止まることがあります。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>認証センター</strong> — 6か月取引予定報告書など。様式は利用マニュアルから。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>マイウォレット</strong> — 最大5。登録・変更・削除依頼はOTP+2回確認。新アドレスは本社承認後。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>クリプトシミュレーター</strong> — 手数料の試算(参考)。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>認証パス後</strong>に購入またはエスクロー。個人の既定決済は<strong>送金</strong>です。</span></div>
        </div>
        <div class="warn-box">認証パス・承認ウォレット・本社承認がないと進めません。シミュレーターは確定金額ではありません。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>个人注册</strong> — 邮箱、手机(国家号)、密码。有推荐人时用邮箱/姓名/电话搜索确认；否则直连总部。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>登录</strong> — 如开启 Google OTP 请输入。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>等待总部批准</strong> — 批准前可能无法执行采购/托管。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>认证中心</strong> — 上传 6 个月交易预估等。模板在使用手册。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>我的钱包</strong> — 最多 5 个。登记/改址/删请需 OTP+两次确认。新地址需总部批准。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>加密货币模拟器</strong> — 预览手续费（仅供参考）。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>认证通过后</strong>申请采购或托管。个人默认支付方式为<strong>汇款</strong>。</span></div>
        </div>
        <div class="warn-box">无认证通过、已批钱包、总部批准则无法继续。模拟器不是确定金额。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>สมัครบุคคล</strong> — อีเมล โทร (รหัสประเทศ) รหัสผ่าน มีผู้แนะนำให้ค้นด้วยอีเมล/ชื่อ/เบอร์ ถ้าไม่มีจะผูกกับ HQ</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>เข้าสู่ระบบ</strong> — ใส่ Google OTP หากเปิด</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>รอ HQ อนุมัติ</strong> — ก่อนอนุมัติอาจซื้อ/เอสโครว์ไม่ได้</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>ศูนย์ยืนยัน</strong> — อัปโหลดรายงาน 6 เดือน ฯลฯ แบบฟอร์มจากคู่มือใช้งาน</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>กระเป๋าของฉัน</strong> — สูงสุด 5 ใบ ลงทะเบียน/เปลี่ยน/ขอลบ ต้อง OTP+ยืนยันสองครั้ง ที่อยู่ใหม่ต้อง HQ อนุมัติ</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>ตัวจำลองคริปโต</strong> — ดูค่าธรรมเนียม (อ้างอิง)</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc">หลัง<strong>ผ่านยืนยัน</strong> สมัครซื้อหรือเอสโครว์ ช่องทางเริ่มต้นของบุคคลคือ<strong>ธุรกรรมโอน</strong></span></div>
        </div>
        <div class="warn-box">ไม่มีผ่านยืนยัน กระเป๋าที่อนุมัติ และอนุมัติ HQ จะทำต่อไม่ได้ ตัวจำลองไม่ใช่ยอดผูกพัน</div>`,
      ),
    },
    {
      id: 'i-signup',
      title: L('가입 · 로그인 · 추천인', 'Signup · login · referrer', '登録・ログイン・紹介者', '注册·登录·推荐人', 'สมัคร · เข้าสู่ระบบ · ผู้แนะนำ'),
      bodyHtml: L(
        `<ul>
          <li><strong>이메일</strong>은 전 서비스에서 한 번만 사용할 수 있습니다. 이미 쓰인 이메일이면 가입·복구가 거부됩니다.</li>
          <li><strong>휴대폰</strong>은 개인 유형에서 한 번까지입니다. 같은 번호로 기업 계정이 따로 있을 수 있으며, 검색 시 개인/기업이 구분되어 보입니다.</li>
          <li><strong>추천인</strong> — 이메일·사업/개인 이름·전화로 검색해 확인합니다. 조직 유형은 화면에 나오지 않습니다. 없으면 본사 직속입니다.</li>
          <li>비밀번호 찾기·OTP 재설정은 개인·기업 공통으로 동작합니다.</li>
          <li>상단에서 언어(KR/US/JP/CH/TH)를 바꿀 수 있습니다. 유휴 시간이 지나면 자동 로그아웃됩니다.</li>
        </ul>
        <div class="info-box">로그인 화면의 개인 가입 안내·국가 한도 안내는 본사 정책에서 관리됩니다. 가입 전 안내문을 꼭 읽으세요.</div>`,
        `<ul>
          <li><strong>Email</strong> is unique across the whole service.</li>
          <li><strong>Phone</strong> may be used once for individual accounts. A corporate account may reuse the same phone; search shows individual vs corporate.</li>
          <li><strong>Referrer</strong> — search by email, business/personal name, or phone. Org type is not shown. No referrer → HQ direct.</li>
          <li>Password and OTP recovery work the same for individual and corporate.</li>
          <li>Change language in the top bar. Idle timeout signs you out.</li>
        </ul>
        <div class="info-box">Signup notices and country-limit text on the login page are managed by HQ policy. Read them before registering.</div>`,
        `<ul>
          <li><strong>メール</strong>はサービス全体で1回のみ。</li>
          <li><strong>電話</strong>は個人タイプで1回まで。法人で同じ番号があり得ます。検索時は個人/法人表示。</li>
          <li><strong>紹介者</strong> — メール・氏名・電話で検索確認。組織種別は非表示。なければ本社直結。</li>
          <li>パスワード・OTP復旧は個人・法人共通。</li>
          <li>上部で言語切替。アイドルで自動ログアウト。</li>
        </ul>
        <div class="info-box">ログイン画面の個人登録案内・限度案内は本社ポリシーで管理されます。登録前に必ず読んでください。</div>`,
        `<ul>
          <li><strong>邮箱</strong>在全服务唯一。</li>
          <li><strong>手机</strong>在个人类型下各用一次；企业可另有同号。搜索时显示个人/企业。</li>
          <li><strong>推荐人</strong> — 用邮箱、姓名或电话搜索确认。不显示组织类型。无推荐人则直连总部。</li>
          <li>找回密码与 OTP 重置对个人/企业相同。</li>
          <li>顶部切换语言。空闲会自动退出。</li>
        </ul>
        <div class="info-box">登录页的个人注册与限额提示由总部策略管理。注册前请阅读。</div>`,
        `<ul>
          <li><strong>อีเมล</strong>ใช้ได้ครั้งเดียวทั้งระบบ</li>
          <li><strong>เบอร์</strong>ใช้ได้ครั้งเดียวในประเภทบุคคล นิติบุคคลอาจใช้เบอร์เดียวกันได้ ค้นหาจะแสดงบุคคล/นิติ</li>
          <li><strong>ผู้แนะนำ</strong> — ค้นด้วยอีเมล ชื่อ หรือเบอร์ ไม่โชว์ประเภทองค์กร ถ้าไม่มีจะผูก HQ</li>
          <li>กู้รหัสผ่าน/OTP ใช้ได้ทั้งบุคคลและนิติ</li>
          <li>เปลี่ยนภาษาด้านบน Idle จะออกจากระบบอัตโนมัติ</li>
        </ul>
        <div class="info-box">ข้อความสมัครและวงเงินบนหน้าเข้าสู่ระบบจัดการโดยนโยบาย HQ อ่านก่อนสมัคร</div>`,
      ),
    },
    {
      id: 'i-kyc',
      title: L('인증센터 · 승인', 'Verification · approval', '認証センター・承認', '认证中心·批准', 'ศูนย์ยืนยัน · อนุมัติ'),
      bodyHtml: L(
        `<span class="menu-path">인증센터</span>
        <p>개인은 주로 <strong>6개월 거래 예정 보고서</strong>를 올립니다. 상태가 <strong>심사중</strong>이면 총본사 인증패스를 기다립니다. <strong>반려</strong>이면 사유를 보고 다시 제출합니다.</p>
        <ul>
          <li><strong>비인증</strong> → 서류 제출</li>
          <li><strong>심사중</strong> → 본사 확인 중</li>
          <li><strong>인증패스</strong> → 크립토·에스크로 신청 가능 (본사 거래 승인·지갑 승인 포함)</li>
          <li><strong>반려</strong> → 사유 확인 후 재제출</li>
        </ul>
        <div class="warn-box">「심사중」은 인증센터(KYC)용입니다. 크립토 티켓의 「입금확인중」「결제확인중」과는 다릅니다.</div>
        <div class="info-box">양식은 왼쪽 <strong>이용메뉴얼</strong>에서 내려받으세요.</div>`,
        `<span class="menu-path">Verification</span>
        <p>Individuals mainly upload the <strong>6-month forecast</strong>. Wait for HQ pass when status is under review; if rejected, resubmit after reading the reason.</p>
        <ul>
          <li><strong>Unverified</strong> → submit files</li>
          <li><strong>Under review</strong> → HQ checking</li>
          <li><strong>Verified pass</strong> → crypto / escrow (also need trade approval + approved wallet)</li>
          <li><strong>Rejected</strong> → fix and resubmit</li>
        </ul>
        <div class="warn-box">“Under review” is for KYC only — not the same as crypto purchase "Deposit verifying" / “Payment verifying”.</div>`,
        `<span class="menu-path">認証センター</span>
        <p>個人は主に<strong>6か月取引予定報告書</strong>を提出します。審査中なら総本社の認証パスを待ち、差戻しなら理由を見て再提出します。</p>
        <ul>
          <li><strong>未認証</strong> → 提出</li>
          <li><strong>審査中</strong> → 本社確認</li>
          <li><strong>認証パス</strong> → クリプト・エスクロー可（取引承認・ウォレット承認も必要）</li>
          <li><strong>差戻し</strong> → 再提出</li>
        </ul>
        <div class="warn-box">「審査中」はKYC用です。クリプトの「入金確認中」「決済確認中」とは別です。</div>`,
        `<span class="menu-path">认证中心</span>
        <p>个人主要上传<strong>6 个月交易预估报告</strong>。审核中请等待总部通过；退回则按原因重交。</p>
        <ul>
          <li><strong>未认证</strong> → 提交</li>
          <li><strong>审核中</strong> → 总部核对</li>
          <li><strong>认证通过</strong> → 可申请加密货币/托管（还需交易批准与已批钱包）</li>
          <li><strong>已退回</strong> → 重交</li>
        </ul>
        <div class="warn-box">「审核中」仅用于 KYC，与加密货币「入金确认中」「支付确认中」不同。</div>`,
        `<span class="menu-path">ศูนย์ยืนยัน</span>
        <p>บุคคลอัปโหลดหลักคือ<strong>รายงานคาดการณ์ 6 เดือน</strong> รอผ่านเมื่อกำลังตรวจ หากถูกปฏิเสธอ่านเหตุผลแล้วส่งใหม่</p>
        <ul>
          <li><strong>ยังไม่ยืนยัน</strong> → ส่งเอกสาร</li>
          <li><strong>กำลังตรวจสอบ</strong> → HQ ตรวจ</li>
          <li><strong>ผ่านยืนยัน</strong> → สมัครคริปโต/เอสโครว์ได้ (ต้องอนุมัติธุรกรรม+กระเป๋าด้วย)</li>
          <li><strong>ถูกปฏิเสธ</strong> → ส่งใหม่</li>
        </ul>
        <div class="warn-box">「กำลังตรวจสอบ」เป็นของ KYC ไม่ใช่สถานะฝาก/ชำระของตั๋วคริปโต</div>`,
      ),
    },
    {
      id: 'i-wallet-sim',
      title: L('내 지갑 · 시뮬레이터', 'Wallets · simulator', 'マイウォレット・シミュレーター', '我的钱包·模拟器', 'กระเป๋า · ตัวจำลอง'),
      bodyHtml: L(
        `<span class="menu-path">내 지갑 / 크립토 시뮬레이터</span>
        <ul>
          <li>지갑은 <strong>최대 5개</strong>. 관리자만 등록·변경·삭제 요청. 운영자는 신청 화면에서 승인된 지갑만 고릅니다.</li>
          <li>등록·주소 변경·삭제 요청 = OTP + 두 번 확인. 삭제는 본사 승인 후에만 실행됩니다.</li>
          <li>진행 중 거래가 있는 지갑은 주소를 바꿀 수 없고, 완료된 거래 주소는 그대로입니다.</li>
          <li>시뮬레이터: 네트워크 선택 → 입금액 또는 받을 크립토로 계산. 최근 결과 최대 3건(대시보드 2건).</li>
        </ul>
        <div class="warn-box">시뮬레이터는 <strong>참고용 미리 계산</strong>입니다. 실제 신청·입금 금액과 다를 수 있습니다.</div>`,
        `<ul>
          <li>Up to <strong>5 wallets</strong>. Admin only for register/change/delete-request; operators pick approved wallets on apply.</li>
          <li>OTP + two confirms for register, address change, delete request. Deletion runs only after HQ approves.</li>
          <li>In-progress trades lock that wallet’s address; completed trades keep theirs.</li>
          <li>Simulator: pick network → calculate from deposit or target CRYPTO. Up to 3 recent runs (dashboard shows 2).</li>
        </ul>
        <div class="warn-box">The simulator is a <strong>reference preview only</strong>.</div>`,
        `<ul>
          <li>ウォレット<strong>最大5</strong>。登録・変更・削除依頼は管理者のみ。運営者は申請画面で承認済みを選択。</li>
          <li>OTP+2回確認。削除は本社承認後のみ。</li>
          <li>進行中取引があるとアドレス変更不可。完了取引のアドレスは維持。</li>
          <li>シミュレーター: ネットワーク→入金または受取クリプト。直近最大3件(ダッシュボード2件)。</li>
        </ul>
        <div class="warn-box">シミュレーターは<strong>参考用の試算</strong>です。</div>`,
        `<ul>
          <li>钱包最多 <strong>5</strong> 个。仅管理员可登记/改址/申请删除；操作员在申请页选择已批钱包。</li>
          <li>OTP + 两次确认。删除仅在总部批准后执行。</li>
          <li>进行中交易锁定该钱包地址；已完成交易地址不变。</li>
          <li>模拟器：选网络 → 按入金或目标加密货币 计算。最多 3 条（仪表盘 2 条）。</li>
        </ul>
        <div class="warn-box">模拟器为<strong>仅供参考的试算</strong>。</div>`,
        `<ul>
          <li>กระเป๋าสูงสุด <strong>5</strong> ใบ แอดมินเท่านั้นที่ลงทะเบียน/เปลี่ยน/ขอลบ ผู้ปฏิบัติงานเลือกกระเป๋าที่อนุมัติในหน้าสมัคร</li>
          <li>OTP + ยืนยันสองครั้ง การลบเกิดเมื่อ HQ อนุมัติเท่านั้น</li>
          <li>รายการกำลังทำจะล็อกที่อยู่ รายการจบแล้วที่อยู่คงเดิม</li>
          <li>ตัวจำลอง: เลือกเครือข่าย → คำนวณจากฝากหรือ คริปโตเป้าหมาย สูงสุด 3 รายการ (แดชบอร์ด 2)</li>
        </ul>
        <div class="warn-box">ตัวจำลองเป็น<strong>การอ้างอิงเท่านั้น</strong></div>`,
      ),
    },
    {
      id: 'i-pay',
      title: L('크립토 매입 · 결제수단', 'Crypto purchase · pay methods', 'クリプト購入・決済手段', '加密货币采购·支付方式', 'ซื้อคริปโต · ช่องทางชำระ'),
      bodyHtml: L(
        `<span class="menu-path">크립토 매입</span>
        <p>목록 기본 기간은 시작 <strong>1주 전</strong> ~ 종료 <strong>오늘</strong>입니다. 금액 입력만으로 수수료가 자동 계산되지 않으며, <strong>거래하기</strong>에서 1회 크립토 한도(LR~SR/ML)와 ±8% 참고 견적을 확인합니다.</p>
        <table><thead><tr><th>결제수단</th><th>개인 고객 안내</th></tr></thead><tbody>
        <tr><td><strong>송금거래</strong></td><td>개인 기본값. 본사·고객 설정이 켜져 있을 때 사용. 송금자 성명은 계정 이름과 같고, 국가·이메일은 계정에서 가져온 뒤 수정 가능. 한도 국가가 맨 위에 기본 선택됩니다.</td></tr>
        <tr><td><strong>계좌이체</strong></td><td>본사가 허용하고 고객 상세에서 켠 경우에만 보입니다. 전용계좌/가상계좌 흐름은 아래 「입금 순서」를 보세요.</td></tr>
        <tr><td><strong>카드</strong></td><td>본사·통화·고객 설정이 모두 켜져 있을 때만. 결제 후 환불 불가에 동의해야 합니다. 버튼이 회색이면 비활성입니다.</td></tr>
        </tbody></table>
        <div class="info-box">결제수단 on/off는 본사 설정과 고객별 설정(본사따름/사용/중지)의 <strong>교집합</strong>입니다. 안 보이면 지원팀에 문의하세요.</div>`,
        `<span class="menu-path">Crypto purchase</span>
        <p>List dates default to <strong>1 week ago → today</strong>. Fees do not auto-calc on input — use <strong>Trade</strong> for per-ticket CRYPTO limits and a ±8% reference quote.</p>
        <table><thead><tr><th>Method</th><th>For individuals</th></tr></thead><tbody>
        <tr><td><strong>Remittance</strong></td><td>Default. Sender name matches account name; country/email are copied and editable. Limit country is selected first.</td></tr>
        <tr><td><strong>Bank transfer</strong></td><td>Only when HQ and your customer setting allow it. See deposit steps below.</td></tr>
        <tr><td><strong>Card</strong></td><td>Only when HQ, currency, and customer settings are on. Non-refundable after charge. Gray button = disabled.</td></tr>
        </tbody></table>
        <div class="info-box">Visibility is HQ settings <strong>AND</strong> your per-customer toggle (Follow HQ / Enabled / Disabled).</div>`,
        `<span class="menu-path">クリプト購入</span>
        <p>一覧の既定期間は開始<strong>1週間前</strong>〜終了<strong>今日</strong>。金額入力だけでは手数料は自動計算されず、<strong>取引する</strong>で1回クリプト限度と±8%参考見積を確認します。</p>
        <table><thead><tr><th>手段</th><th>個人向け</th></tr></thead><tbody>
        <tr><td><strong>送金</strong></td><td>既定。送金者氏名はアカウント名と同じ。国・メールは取込後に変更可。限度国が先頭。</td></tr>
        <tr><td><strong>口座振替</strong></td><td>本社と顧客設定がONのときのみ。入金手順は下記。</td></tr>
        <tr><td><strong>カード</strong></td><td>本社・通貨・顧客設定がすべてONのとき。決済後返金不可。灰色ボタンは無効。</td></tr>
        </tbody></table>
        <div class="info-box">表示は本社設定と顧客別設定の<strong>積集合</strong>です。</div>`,
        `<span class="menu-path">加密货币采购</span>
        <p>列表默认区间为<strong>一周前 → 今天</strong>。仅输入金额不会自动计费，请点<strong>交易</strong>查看单笔限额与 ±8% 参考报价。</p>
        <table><thead><tr><th>方式</th><th>个人说明</th></tr></thead><tbody>
        <tr><td><strong>汇款</strong></td><td>默认。汇款人姓名与账户姓名相同；国家/邮箱可改。限额国家默认置顶。</td></tr>
        <tr><td><strong>银行转账</strong></td><td>仅当总部与客户设置开启时显示。见下方入金步骤。</td></tr>
        <tr><td><strong>卡支付</strong></td><td>总部·币种·客户均开启时。扣款后不可退。灰色按钮=未启用。</td></tr>
        </tbody></table>
        <div class="info-box">显示为总部设置与客户开关的<strong>交集</strong>。</div>`,
        `<span class="menu-path">ซื้อคริปโต</span>
        <p>ช่วงรายการเริ่มต้นคือ<strong>1 สัปดาห์ก่อน → วันนี้</strong> กรอกจำนวนอย่างเดียวไม่คำนวณอัตโนมัติ กด<strong>ทำรายการ</strong>เพื่อดูวงเงินและช่วงอ้างอิง ±8%</p>
        <table><thead><tr><th>ช่องทาง</th><th>สำหรับบุคคล</th></tr></thead><tbody>
        <tr><td><strong>ธุรกรรมโอน</strong></td><td>ค่าเริ่มต้น ชื่อผู้ส่งตรงชื่อบัญชี ประเทศ/อีเมลแก้ได้ ประเทศวงเงินอยู่บนสุด</td></tr>
        <tr><td><strong>โอนบัญชี</strong></td><td>โชว์เมื่อ HQ และตั้งค่าลูกค้าเปิด ดูลำดับฝากด้านล่าง</td></tr>
        <tr><td><strong>บัตร</strong></td><td>เมื่อ HQ สกุล และลูกค้าเปิดทั้งหมด ชำระแล้วคืนเงินไม่ได้ ปุ่มเทา=ปิด</td></tr>
        </tbody></table>
        <div class="info-box">การแสดงเป็น<strong>จุดร่วม</strong>ของตั้งค่า HQ และการเปิด/ปิดรายลูกค้า</div>`,
      ),
    },
    {
      id: 'i-deposit',
      title: L('계좌이체 입금 순서 (허용 시)', 'Bank deposit steps (when allowed)', '口座振込の順番（許可時）', '银行入金顺序（允许时）', 'ลำดับฝากโอนบัญชี (เมื่ออนุญาต)'),
      bodyHtml: L(
        `<p>개인 계정에서도 본사가 계좌이체를 켠 경우에만 이 흐름을 씁니다. 수취방식은 <strong>전용계좌</strong> / <strong>가상계좌</strong>로만 표기됩니다.</p>
        <p><strong>A. 전용계좌</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">신규신청 → 통화·금액·승인 지갑</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">안내 계좌의 <strong>계좌번호·수취인명 복사</strong>로 붙여 넣기 (半角カタカナ 그대로)</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">등록 본인 통장에서 송금 → <strong>자금 원천 + 송금증</strong> 첨부 후 제출</span></div>
        </div>
        <p><strong>B. 가상계좌</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">자금 원천만 올리고 제출 (송금증 칸 없음)</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">상세에 나온 <strong>이 건 전용</strong> 계좌로만 입금</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc">송금증 업로드 없음 — 시스템 자동 확인</span></div>
        </div>
        <div class="warn-box">수취인명은 UI 언어를 바꿔도 일본어 원문입니다. 다른 통장·다른 티켓 계좌와 섞지 마세요.</div>`,
        `<p>Use this only when bank transfer is enabled for your individual account. Receipt method shows <strong>Dedicated</strong> or <strong>Virtual</strong> account.</p>
        <p><strong>A. Dedicated</strong> — copy account &amp; beneficiary → transfer from your registered bank → attach source-of-funds + remittance slip.</p>
        <p><strong>B. Virtual</strong> — source-of-funds only at apply → deposit to the per-ticket account → no slip upload (auto-confirm).</p>
        <div class="warn-box">Beneficiary stays half-width katakana even if you change UI language. Do not mix tickets or banks.</div>`,
        `<p>個人でも口座振替がONのときだけ使います。受取方式は<strong>専用</strong>/<strong>バーチャル</strong>のみ。</p>
        <p><strong>A. 専用</strong> — 口座・受取人名をコピー→登録通帳から送金→資金原資＋送金証。</p>
        <p><strong>B. バーチャル</strong> — 資金原資のみ→取引専用口座へ入金→証憑なし(自動確認)。</p>
        <div class="warn-box">受取人名はUI言語を変えても日本語原文です。</div>`,
        `<p>仅当个人账户启用银行转账时使用。收款方式仅显示<strong>专用</strong>/<strong>虚拟</strong>账户。</p>
        <p><strong>A. 专用</strong> — 复制账号与收款人 → 本人账户转账 → 资金来源+汇款凭证。</p>
        <p><strong>B. 虚拟</strong> — 仅资金来源 → 向本单账户入金 → 不上传凭证（自动确认）。</p>
        <div class="warn-box">切换界面语言后收款人仍为日语原文。勿混用单据或账户。</div>`,
        `<p>ใช้เมื่อเปิดโอนบัญชีให้บัญชีบุคคล วิธีรับแสดง<strong>บัญชีเฉพาะ</strong>/<strong>บัญชีเสมือน</strong>เท่านั้น</p>
        <p><strong>A. เฉพาะ</strong> — คัดลอกเลขบัญชี/ผู้รับ → โอนจากบัญชีที่ลงทะเบียน → แนบแหล่งเงิน+สลิป</p>
        <p><strong>B. เสมือน</strong> — แหล่งเงินอย่างเดียว → ฝากเข้าบัญชีรายตั๋ว → ไม่อัปโหลดสลิป (ยืนยันอัตโนมัติ)</p>
        <div class="warn-box">ชื่อผู้รับยังเป็นต้นฉบับญี่ปุ่นแม้เปลี่ยนภาษา UI</div>`,
      ),
    },
    {
      id: 'i-escrow-ops',
      title: L('무역 에스크로 · 운영자', 'Trade escrow · operators', '貿易エスクロー・運営者', '贸易托管·操作员', 'เอสโครว์ · ผู้ปฏิบัติงาน'),
      bodyHtml: L(
        `<p><strong>무역 에스크로</strong> — 인증패스·승인 지갑 후 신청. 목록 기간 기본은 크립토 매입과 동일(1주 전~오늘). 주요 상태 변경은 OTP 후 운영기록에 남습니다.</p>
        <p><strong>관리자·운영자</strong> — 본사가 멀티 사용자를 허용하면 대표 관리자 1명 + 운영자 최대 2명. 운영자는 내 지갑·사용자관리가 없습니다. 삭제는 없고 중지(비활성)만 가능합니다.</p>
        <div class="info-box">운영기록은 조회만 가능합니다. 삭제권한은 총본사에만 있습니다.</div>`,
        `<p><strong>Trade escrow</strong> — apply after verification pass and approved wallet. Same default date range as crypto purchase. Major status changes need OTP and are logged.</p>
        <p><strong>Admin · operators</strong> — if HQ enables multi-user: 1 admin + up to 2 operators. Operators have no Wallets/Users menus. No delete — suspend only.</p>
        <div class="info-box">Operation history is view-only for merchants. Only HQ can delete logs.</div>`,
        `<p><strong>貿易エスクロー</strong> — 認証パス・承認ウォレット後。一覧期間はクリプト購入と同じ。主な状態変更はOTP後に記録。</p>
        <p><strong>管理者・運営者</strong> — 本社がマルチユーザー許可時、管理者1＋運営者最大2。運営者にマイウォレット・ユーザー管理なし。削除はなく停止のみ。</p>
        <div class="info-box">運営記録は閲覧のみ。削除は総本社のみ。</div>`,
        `<p><strong>贸易托管</strong> — 认证通过且有已批钱包后申请。列表默认区间同加密货币采购。主要状态变更需 OTP 并记入运营记录。</p>
        <p><strong>管理员·操作员</strong> — 总部开启多用户时：1 名管理员 + 最多 2 名操作员。操作员无我的钱包/用户管理。不可删除，仅可停用。</p>
        <div class="info-box">运营记录仅可查看。仅总部可删除。</div>`,
        `<p><strong>เอสโครว์การค้า</strong> — สมัครหลังผ่านยืนยันและมีกระเป๋าที่อนุมัติ ช่วงวันเหมือนการซื้อคริปโต การเปลี่ยนสถานะสำคัญต้อง OTP และบันทึกประวัติ</p>
        <p><strong>แอดมิน·ผู้ปฏิบัติงาน</strong> — หาก HQ เปิดหลายผู้ใช้: แอดมิน 1 + ผู้ปฏิบัติงานสูงสุด 2 คน ผู้ปฏิบัติงานไม่มีกระเป๋า/จัดการผู้ใช้ ลบไม่ได้ หยุดได้เท่านั้น</p>
        <div class="info-box">ประวัติการดำเนินงานดูได้อย่างเดียว ลบได้เฉพาะ HQ</div>`,
      ),
    },
    {
      id: 'i-faq',
      title: L('자주 묻는 질문', 'FAQ', 'よくある質問', '常见问题', 'คำถามที่พบบ่อย'),
      bodyHtml: L(
        `<div class="faq-item"><div class="faq-q">기업용 메뉴얼이 안 보입니다.</div><div class="faq-a">개인 계정은 개인용 메뉴얼만 열립니다. 기업 계정으로 로그인하면 기업용만 보입니다. 총본사·조직은 둘 다 볼 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">가입했는데 매입이 안 됩니다.</div><div class="faq-a">본사 승인(거래 실행)·인증패스·승인 지갑이 모두 필요합니다. 상태가 VIEW_ONLY이면 승인을 기다리세요.</div></div>
        <div class="faq-item"><div class="faq-q">계좌이체가 안 보입니다.</div><div class="faq-a">개인 기본은 송금거래입니다. 본사 또는 고객 상세에서 계좌이체가 꺼져 있으면 메뉴에 나오지 않습니다.</div></div>
        <div class="faq-item"><div class="faq-q">같은 전화로 가입이 거부됩니다.</div><div class="faq-a">개인 유형에서 이미 쓰인 번호입니다. 이메일은 전역 유일입니다. 기존 계정으로 로그인하거나 지원팀에 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">카드 버튼이 회색입니다.</div><div class="faq-a">카드가 비활성입니다. 송금·이체(허용 시)를 쓰거나 지원팀에 문의하세요.</div></div>
        <div class="faq-item"><div class="faq-q">시뮬레이터와 실제 금액이 다릅니다.</div><div class="faq-a">시뮬레이터는 참고용입니다. 환율·수수료는 신청·입금 시점에 달라질 수 있습니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">I do not see the corporate manual.</div><div class="faq-a">Individual accounts only open the individual manual. Corporate logins see corporate only. HQ/org see both.</div></div>
        <div class="faq-item"><div class="faq-q">I signed up but cannot purchase.</div><div class="faq-a">You need HQ trade approval, a verification pass, and an approved wallet. If VIEW_ONLY, wait for approval.</div></div>
        <div class="faq-item"><div class="faq-q">Bank transfer is missing.</div><div class="faq-a">Individuals default to remittance. Transfer stays hidden if HQ or your customer setting disabled it.</div></div>
        <div class="faq-item"><div class="faq-q">Phone signup was rejected.</div><div class="faq-a">That number is already used for an individual. Email is globally unique. Sign in to the existing account or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Card is off. Use remittance / transfer (if allowed) or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Simulator differs from purchase.</div><div class="faq-a">Reference only — rates and fees can change before apply/deposit.</div></div>`,
        `<div class="faq-item"><div class="faq-q">法人マニュアルが見えません。</div><div class="faq-a">個人アカウントは個人用のみ。法人ログインは法人用のみ。総本社・組織は両方見られます。</div></div>
        <div class="faq-item"><div class="faq-q">登録したが購入できません。</div><div class="faq-a">本社の取引承認・認証パス・承認ウォレットが必要です。VIEW_ONLYなら承認待ちです。</div></div>
        <div class="faq-item"><div class="faq-q">口座振替がありません。</div><div class="faq-a">個人の既定は送金です。本社または顧客設定でOFFなら表示されません。</div></div>
        <div class="faq-item"><div class="faq-q">同じ電話で登録できません。</div><div class="faq-a">個人タイプで既に使用されています。メールは全体で一意です。既存アカウントでログインするかサポートへ。</div></div>
        <div class="faq-item"><div class="faq-q">カードボタンが灰色です。</div><div class="faq-a">カード無効です。送金・振替(許可時)を使うかサポートへ。</div></div>
        <div class="faq-item"><div class="faq-q">シミュレーターと実際が違います。</div><div class="faq-a">参考用です。為替・手数料は申請・入金時点で変わり得ます。</div></div>`,
        `<div class="faq-item"><div class="faq-q">看不到企业手册。</div><div class="faq-a">个人账号只打开个人手册；企业登录只看企业手册。总部/组织可看两者。</div></div>
        <div class="faq-item"><div class="faq-q">注册后无法采购。</div><div class="faq-a">需要总部交易批准、认证通过与已批钱包。若为仅查看请等待批准。</div></div>
        <div class="faq-item"><div class="faq-q">没有银行转账。</div><div class="faq-a">个人默认汇款。总部或客户设置关闭时不显示转账。</div></div>
        <div class="faq-item"><div class="faq-q">同一手机无法注册。</div><div class="faq-a">该号已在个人类型使用。邮箱全局唯一。请登录已有账号或联系支持。</div></div>
        <div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">卡支付未启用。请用汇款/转账（若允许）或联系支持。</div></div>
        <div class="faq-item"><div class="faq-q">模拟器与实际不符。</div><div class="faq-a">仅供参考，汇率与手续费可能在申请/入金时变化。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ไม่เห็นคู่มือนิติบุคคล</div><div class="faq-a">บัญชีบุคคลเปิดได้เฉพาะคู่มือบุคคล นิติเห็นเฉพาะคู่มือนิติ HQ/องค์กรเห็นทั้งสอง</div></div>
        <div class="faq-item"><div class="faq-q">สมัครแล้วซื้อไม่ได้</div><div class="faq-a">ต้องอนุมัติธุรกรรม HQ ผ่านยืนยัน และกระเป๋าที่อนุมัติ หาก VIEW_ONLY ให้รออนุมัติ</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีโอนบัญชี</div><div class="faq-a">บุคคลเริ่มต้นคือธุรกรรมโอน หาก HQ หรือตั้งค่าลูกค้าปิด จะไม่โชว์</div></div>
        <div class="faq-item"><div class="faq-q">สมัครด้วยเบอร์เดิมไม่ได้</div><div class="faq-a">เบอร์ถูกใช้ในประเภทบุคคลแล้ว อีเมลต้องไม่ซ้ำทั้งระบบ เข้าบัญชีเดิมหรือติดต่อซัพพอร์ต</div></div>
        <div class="faq-item"><div class="faq-q">ปุ่มบัตรสีเทา</div><div class="faq-a">บัตรปิดอยู่ ใช้โอน/ธุรกรรมโอน (ถ้าอนุญาต) หรือติดต่อซัพพอร์ต</div></div>
        <div class="faq-item"><div class="faq-q">ตัวจำลองไม่ตรงยอดจริง</div><div class="faq-a">ใช้อ้างอิงเท่านั้น อัตรา/ค่าธรรมเนียมอาจเปลี่ยนก่อนสมัครหรือฝาก</div></div>`,
      ),
    },
  ],
};
