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
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>로그인</strong> — <strong>https://tinpass.com/login</strong>. 회원 유형은 <strong>자동 인식</strong>으로 두어도 됩니다. 기업회원으로 넣고 개인 계정이면 「확인」 후 개인회원으로 다시 시도합니다. 아직 없으면 「확인」으로 개인 가입 화면으로 이동합니다. Google OTP가 켜져 있으면 앱 코드를 입력합니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>본사 승인 대기</strong> — 승인 전에는 매입·에스크로 실행이 막힐 수 있습니다. 승인되면 거래 실행이 열립니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>인증센터</strong> — <strong>본인인증 서류</strong>(이미지 또는 PDF)만 올립니다. 개인은 6개월 거래 예정 보고서가 없습니다.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>내 지갑</strong> — 최대 5개. 등록·주소 변경·삭제 요청은 OTP + 두 번 확인. 새 주소는 본사 승인 후 매입에서 선택합니다.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>시뮬레이터</strong> — 네트워크·금액으로 수수료·수령액을 미리 봅니다 (참고용).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>인증패스 후</strong> 크립토 매입 또는 무역 에스크로를 신청합니다. 개인 기본 결제수단은 <strong>송금거래</strong>입니다.</span></div>
        </div>
        <div class="warn-box">인증패스·승인 지갑·본사 승인이 없으면 매입·에스크로가 진행되지 않습니다. 시뮬레이터는 확정 금액이 아닙니다.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>Individual signup</strong> — email, phone (country code), password. Search and confirm a referrer by email, name, or phone if you have one; otherwise you link to HQ.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>Sign in</strong> at <strong>https://tinpass.com/login</strong>. Leave member type on <strong>Detect automatically</strong>. If you pick corporate for an individual account, press Confirm to retry as an individual. If the ID is not registered, Confirm opens individual signup. Enter Google OTP if enabled.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>Wait for HQ approval</strong> — purchase/escrow may stay blocked until approved.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>Verification</strong> — upload only an <strong>identity document</strong> (image or PDF). Individuals do not submit a 6-month forecast.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>My wallets</strong> — up to 5. Register / change / delete-request need OTP and two confirms. New addresses need HQ approval.</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>Simulator</strong> — preview fees (reference only).</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc">After a <strong>verification pass</strong>, apply for Crypto purchase or escrow. Default method for individuals is <strong>remittance</strong>.</span></div>
        </div>
        <div class="warn-box">Without a pass, an approved wallet, and HQ approval, purchase/escrow stay blocked. The simulator is not a binding amount.</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>個人会員登録</strong> — メール・電話(国番号)・パスワード。紹介者がいればメール・氏名・電話で検索確認。なければ本社直結。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>ログイン</strong> — <strong>https://tinpass.com/login</strong>。会員タイプは<strong>自動認識</strong>のままでも構いません。法人で入れて個人アカウントなら「確認」で個人として再試行します。未登録なら「確認」で個人登録へ進みます。Google OTPがあれば入力します。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>本社承認待ち</strong> — 承認前は購入・エスクローが止まることがあります。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>認証センター</strong> — <strong>本人確認書類</strong>（画像またはPDF）のみ。個人に6か月取引予定報告書はありません。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>マイウォレット</strong> — 最大5。登録・変更・削除依頼はOTP+2回確認。新アドレスは本社承認後。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>シミュレーター</strong> — 手数料の試算(参考)。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>認証パス後</strong>に購入またはエスクロー。個人の既定決済は<strong>送金</strong>です。</span></div>
        </div>
        <div class="warn-box">認証パス・承認ウォレット・本社承認がないと進めません。シミュレーターは確定金額ではありません。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>个人注册</strong> — 邮箱、手机(国家号)、密码。有推荐人时用邮箱/姓名/电话搜索确认；否则直连总部。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>登录</strong> — <strong>https://tinpass.com/login</strong>。会员类型可保持<strong>自动识别</strong>。个人账户选了企业时，按「确认」后以个人会员重试。尚未注册时，按「确认」进入个人注册。如开启 Google OTP 请输入。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>等待总部批准</strong> — 批准前可能无法执行采购/托管。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>认证中心</strong> — 只上传<strong>本人认证文件</strong>（图片或 PDF）。个人不提交 6 个月交易预估。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>我的钱包</strong> — 最多 5 个。登记/改址/删请需 OTP+两次确认。新地址需总部批准。</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>模拟器</strong> — 预览手续费（仅供参考）。</span></div>
          <div class="flow-row"><span class="flow-num">7</span><span class="flow-desc"><strong>认证通过后</strong>申请采购或托管。个人默认支付方式为<strong>汇款</strong>。</span></div>
        </div>
        <div class="warn-box">无认证通过、已批钱包、总部批准则无法继续。模拟器不是确定金额。</div>`,
        `<div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>สมัครบุคคล</strong> — อีเมล โทร (รหัสประเทศ) รหัสผ่าน มีผู้แนะนำให้ค้นด้วยอีเมล/ชื่อ/เบอร์ ถ้าไม่มีจะผูกกับ HQ</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc"><strong>เข้าสู่ระบบ</strong> ที่ <strong>https://tinpass.com/login</strong> ประเภทสมาชิกไว้ที่<strong>ตรวจอัตโนมัติ</strong>ได้ ถ้าเลือกนิติบุคคลแต่เป็นบัญชีบุคคล กดยืนยันเพื่อลองใหม่เป็นบุคคล ถ้ายังไม่สมัคร กดยืนยันเพื่อไปสมัครบุคคล ใส่ Google OTP หากเปิด</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>รอ HQ อนุมัติ</strong> — ก่อนอนุมัติอาจซื้อ/เอสโครว์ไม่ได้</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc"><strong>ศูนย์ยืนยัน</strong> — อัปโหลดเฉพาะ<strong>เอกสารยืนยันตัวตน</strong> (รูปหรือ PDF) บุคคลไม่ส่งรายงาน 6 เดือน</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc"><strong>กระเป๋าของฉัน</strong> — สูงสุด 5 ใบ ลงทะเบียน/เปลี่ยน/ขอลบ ต้อง OTP+ยืนยันสองครั้ง ที่อยู่ใหม่ต้อง HQ อนุมัติ</span></div>
          <div class="flow-row"><span class="flow-num">6</span><span class="flow-desc"><strong>ตัวจำลอง</strong> — ดูค่าธรรมเนียม (อ้างอิง)</span></div>
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
        `<span class="menu-path">로그인 후 왼쪽 메뉴 · 인증센터</span>
        <p>본인인증은 <strong>가입 화면에서 하지 않습니다.</strong> 순서는 다음과 같습니다.</p>
        <ol>
          <li><strong>https://tinpass.com/login</strong> 에서 회원 유형을 <strong>개인 신규가입</strong>으로 두거나, 미등록 안내의 「확인」으로 <strong>/register</strong> 개인 가입을 마칩니다. 가입 항목은 이메일·휴대폰·비밀번호 등이며, 신분증은 여기 올리지 않습니다.</li>
          <li>가입한 아이디로 로그인합니다. 회원 유형은 <strong>자동 인식</strong>이어도 됩니다.</li>
          <li>로그인 후 왼쪽 <strong>인증센터</strong>를 엽니다. 주소는 <strong>/dashboard/kyc</strong> 입니다.</li>
          <li>상태가 비인증 또는 반려·인증 보류·승인 취소일 때 <strong>본인인증 서류</strong>(이미지 또는 PDF)를 올리고 <strong>심사 요청</strong>을 누릅니다.</li>
          <li>상태가 <strong>심사중</strong>이면 총본사 인증패스를 기다립니다. 인증패스 전에는 크립토 매입·에스크로가 열리지 않습니다.</li>
        </ol>
        <p>개인은 <strong>본인인증 서류</strong>만 올립니다. 6개월 거래 예정 보고서는 개인 인증과 개인 거래에서 받지 않습니다. 본인인증은 주민등록·여권을 따로 고르지 않고, 이미지 또는 PDF로 제출합니다. 이 파일만 서버에 암호화되어 저장됩니다. 가맹점 화면에는 파일명과 내용이 나오지 않습니다. 인증패스가 되면 <strong>인증패스 성공</strong>만 표시됩니다. 총본사가 서류를 열 때는 OTP를 입력하며, 한 번 확인하면 본사정책의 유지 시간(기본 60분) 동안 다시 묻지 않습니다. 시간은 본사정책 → 플랫폼 → 이메일·OTP에서 바꿉니다. 상태가 <strong>심사중</strong>이면 총본사 인증패스를 기다립니다. <strong>반려</strong>이면 사유를 보고 다시 제출합니다.</p>
        <ul>
          <li><strong>비인증</strong> → 서류 제출</li>
          <li><strong>심사중</strong> → 본사 확인 중</li>
          <li><strong>인증패스</strong> → 크립토·에스크로 신청 가능 (본사 거래 승인·지갑 승인 포함)</li>
          <li><strong>반려</strong> → 사유 확인 후 재제출</li>
          <li><strong>인증 보류</strong> · <strong>승인 취소</strong> → 이미 인증패스된 개인을 본사가 멈추는 상태. 매입·에스크로는 막히고, 사유를 본 뒤 본인인증 서류를 다시 제출할 수 있습니다.</li>
        </ul>
        <div class="warn-box">「심사중」은 인증센터(KYC)용입니다. 크립토 티켓의 「입금확인중」「결제확인중」과는 다릅니다.</div>
        <div class="info-box">양식은 왼쪽 <strong>이용메뉴얼</strong>에서 내려받으세요.</div>`,
        `<span class="menu-path">After login · left menu · Verification</span>
        <p>Identity verification is <strong>not part of signup</strong>.</p>
        <ol>
          <li>On <strong>https://tinpass.com/login</strong> choose <strong>New individual</strong>, or press Confirm on the unregistered notice to open <strong>/register</strong>. Signup asks for email, phone, and password. Do not upload an ID there.</li>
          <li>Sign in with that ID. Member type may stay on <strong>Detect automatically</strong>.</li>
          <li>After login open <strong>Verification</strong> in the left menu. The address is <strong>/dashboard/kyc</strong>.</li>
          <li>When status is unverified, rejected, on hold, or approval cancelled, upload an <strong>identity document</strong> (image or PDF) and press <strong>Submit for review</strong>.</li>
          <li>While status is <strong>under review</strong>, wait for the HQ pass. Crypto purchase and escrow stay closed until the pass.</li>
        </ol>
        <p>Individuals upload only an <strong>identity document</strong> (image or PDF — one upload, not separate ID vs passport). A 6-month forecast is not collected for individual verification or individual trades. Only that file is encrypted on the server. The merchant screen does not show the file name or contents. After a pass it shows <strong>Verification pass successful</strong> only. HQ enters OTP to open the document. One check lasts for the HQ policy hold time (default 60 minutes), set under HQ Policy → Platform → Email and OTP. Wait for HQ pass when status is under review; if rejected, resubmit after reading the reason.</p>
        <ul>
          <li><strong>Unverified</strong> → submit files</li>
          <li><strong>Under review</strong> → HQ checking</li>
          <li><strong>Verified pass</strong> → crypto / escrow (also need trade approval + approved wallet)</li>
          <li><strong>Rejected</strong> → fix and resubmit</li>
          <li><strong>On hold</strong> or <strong>approval cancelled</strong> → HQ stops an individual who already passed. Purchase and escrow stay blocked. Read the reason and submit the identity document again.</li>
        </ul>
        <div class="warn-box">“Under review” is for KYC only — not the same as crypto purchase "Deposit verifying" / “Payment verifying”.</div>`,
        `<span class="menu-path">ログイン後 左メニュー · 認証センター</span>
        <p>本人確認は<strong>登録画面では行いません。</strong></p>
        <ol>
          <li><strong>https://tinpass.com/login</strong> で会員タイプを<strong>個人新規登録</strong>にするか、未登録案内の「確認」で <strong>/register</strong> の個人登録を終えます。登録項目はメール・電話・パスワードなどで、身分証はここでは上げません。</li>
          <li>そのIDでログインします。会員タイプは<strong>自動認識</strong>のままでも構いません。</li>
          <li>ログイン後、左の<strong>認証センター</strong>を開きます。アドレスは <strong>/dashboard/kyc</strong> です。</li>
          <li>未認証、差戻し、認証保留、承認取消のとき<strong>本人確認書類</strong>（画像またはPDF）を上げて<strong>審査を依頼</strong>します。</li>
          <li><strong>審査中</strong>なら総本社の認証パスを待ちます。パス前はクリプト購入・エスクローは開きません。</li>
        </ol>
        <p>個人は<strong>本人確認書類</strong>のみ提出します。6か月取引予定報告書は個人の認証と個人取引では受け取りません。住民票とパスポートを分けず、画像またはPDFをアップロードします。このファイルだけサーバーで暗号化して保存します。加盟店画面にはファイル名も内容も出ません。認証パス後は<strong>認証パス成功</strong>だけ表示します。総本社が開くときはOTPを入力します。一度確認すると本社ポリシーの維持時間（既定60分）は再入力しません。時間は本社ポリシー → プラットフォーム → メール・OTPで変更します。審査中なら総本社の認証パスを待ち、差戻しなら理由を見て再提出します。</p>
        <ul>
          <li><strong>未認証</strong> → 提出</li>
          <li><strong>審査中</strong> → 本社確認</li>
          <li><strong>認証パス</strong> → クリプト・エスクロー可（取引承認・ウォレット承認も必要）</li>
          <li><strong>差戻し</strong> → 再提出</li>
          <li><strong>認証保留</strong>・<strong>承認取消</strong> → 認証パス済みの個人を本社が止める状態。購入・エスクローは止まり、理由を見て本人確認書類を再提出できます。</li>
        </ul>
        <div class="warn-box">「審査中」はKYC用です。クリプトの「入金確認中」「決済確認中」とは別です。</div>`,
        `<span class="menu-path">登录后左侧菜单 · 认证中心</span>
        <p>本人认证<strong>不在注册页面进行。</strong></p>
        <ol>
          <li>在 <strong>https://tinpass.com/login</strong> 将会员类型设为<strong>个人新注册</strong>，或在未注册提示中按「确认」进入 <strong>/register</strong> 完成个人注册。注册填写邮箱、手机和密码，不在这里上传证件。</li>
          <li>用该账号登录。会员类型可以保持<strong>自动识别</strong>。</li>
          <li>登录后打开左侧<strong>认证中心</strong>。地址是 <strong>/dashboard/kyc</strong>。</li>
          <li>状态为未认证、已退回、认证暂缓或取消批准时，上传<strong>本人认证文件</strong>（图片或 PDF）并按<strong>提交审核</strong>。</li>
          <li>状态为<strong>审核中</strong>时等待总部认证通过。通过前不能申请加密货币采购和托管。</li>
        </ol>
        <p>个人只上传<strong>本人认证文件</strong>。个人认证和个人交易不收取 6 个月交易预估。不区分居民登记与护照，仅允许图片或 PDF。只有该文件在服务器加密保存。加盟商画面不显示文件名和内容。认证通过后只显示<strong>认证通过成功</strong>。总部打开时输入 OTP。确认一次后，在总部政策的保持时间（默认 60 分钟）内不再询问。时间在总部政策 → 平台 → 邮件与 OTP 中修改。审核中请等待总部通过；退回则按原因重交。</p>
        <ul>
          <li><strong>未认证</strong> → 提交</li>
          <li><strong>审核中</strong> → 总部核对</li>
          <li><strong>认证通过</strong> → 可申请加密货币/托管（还需交易批准与已批钱包）</li>
          <li><strong>已退回</strong> → 重交</li>
          <li><strong>认证暂缓</strong>、<strong>取消批准</strong> → 总部停止已通过的个人。采购和托管暂停。查看原因后可重新提交本人认证文件。</li>
        </ul>
        <div class="warn-box">「审核中」仅用于 KYC，与加密货币「入金确认中」「支付确认中」不同。</div>`,
        `<span class="menu-path">หลังเข้าสู่ระบบ · เมนูซ้าย · ศูนย์ยืนยัน</span>
        <p>การยืนยันตัวตน<strong>ไม่ทำในหน้าสมัคร</strong></p>
        <ol>
          <li>ที่ <strong>https://tinpass.com/login</strong> เลือก<strong>สมัครบุคคลใหม่</strong> หรือกดยืนยันในข้อความยังไม่สมัครเพื่อไป <strong>/register</strong> สมัครกรอกอีเมล โทร รหัสผ่าน ไม่ได้อัปโหลดบัตรที่นี่</li>
          <li>เข้าสู่ระบบด้วยไอดีนั้น ประเภทสมาชิกไว้ที่<strong>ตรวจอัตโนมัติ</strong>ได้</li>
          <li>หลังเข้าสู่ระบบ เปิด<strong>ศูนย์ยืนยัน</strong>ที่เมนูซ้าย ที่อยู่คือ <strong>/dashboard/kyc</strong></li>
          <li>เมื่อสถานะยังไม่ยืนยัน ถูกปฏิเสธ ระงับ หรือยกเลิกการอนุมัติ ให้อัปโหลด<strong>เอกสารยืนยันตัวตน</strong> (รูปหรือ PDF) แล้วกด<strong>ส่งให้ตรวจสอบ</strong></li>
          <li>สถานะ<strong>กำลังตรวจสอบ</strong> ให้รอ HQ ผ่าน ก่อนผ่านจะซื้อคริปโตหรือเอสโครว์ไม่ได้</li>
        </ol>
        <p>บุคคลอัปโหลดเฉพาะ<strong>เอกสารยืนยันตัวตน</strong> ไม่รับรายงาน 6 เดือนในการยืนยันหรือธุรกรรมบุคคล ไม่แยกบัตรประชาชนกับหนังสือเดินทาง อนุญาตเฉพาะรูปหรือ PDF ไฟล์นี้เท่านั้นถูกเข้ารหัสบนเซิร์ฟเวอร์ หน้าจอร้านค้าไม่แสดงชื่อไฟล์หรือเนื้อหา หลังผ่านจะแสดงเฉพาะ<strong>ผ่านการยืนยันสำเร็จ</strong> สำนักงานใหญ่เปิดไฟล์ต้องใส่ OTP ยืนยันครั้งหนึ่งแล้วไม่ถามซ้ำตามเวลาที่ตั้งในนโยบาย HQ (ค่าเริ่มต้น 60 นาที) ตั้งที่นโยบาย HQ → แพลตฟอร์ม → อีเมลและ OTP รอผ่านเมื่อกำลังตรวจ หากถูกปฏิเสธอ่านเหตุผลแล้วส่งใหม่</p>
        <ul>
          <li><strong>ยังไม่ยืนยัน</strong> → ส่งเอกสาร</li>
          <li><strong>กำลังตรวจสอบ</strong> → HQ ตรวจ</li>
          <li><strong>ผ่านยืนยัน</strong> → สมัครคริปโต/เอสโครว์ได้ (ต้องอนุมัติธุรกรรม+กระเป๋าด้วย)</li>
          <li><strong>ถูกปฏิเสธ</strong> → ส่งใหม่</li>
          <li><strong>ระงับการยืนยัน</strong> หรือ <strong>ยกเลิกการอนุมัติ</strong> → HQ หยุดบุคคลที่ผ่านแล้ว ซื้อและเอสโครว์ถูกปิด อ่านเหตุผลแล้วส่งเอกสารยืนยันตัวตนใหม่ได้</li>
        </ul>
        <div class="warn-box">「กำลังตรวจสอบ」เป็นของ KYC ไม่ใช่สถานะฝาก/ชำระของตั๋วคริปโต</div>`,
      ),
    },
    {
      id: 'i-wallet-sim',
      title: L('내 지갑 · 시뮬레이터', 'Wallets · simulator', 'マイウォレット・シミュレーター', '我的钱包·模拟器', 'กระเป๋า · ตัวจำลอง'),
      bodyHtml: L(
        `<span class="menu-path">내 지갑 / 시뮬레이터</span>
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
      id: 'i-membership',
      title: L(
        '유료회원이란 · 가입 방법',
        'What paid membership is · how to join',
        '有料会員とは · 加入方法',
        '什么是付费会员 · 如何开通',
        'สมาชิกเสียเงินคืออะไร · วิธีสมัคร',
      ),
      bodyHtml: L(
        `<span class="menu-path">유료회원가입</span>
        <div class="check-box"><strong>유료회원</strong>은 로그인한 계정이 아니라, <strong>돈을 내고 산 등급이 아직 만료되지 않은 상태</strong>입니다. 가입만 한 개인 계정은 <strong>일반회원(STANDARD)</strong>입니다. 일반회원도 인증패스·승인 지갑이 있으면 매입·에스크로를 할 수 있습니다. 유료는 그 위에 혜택을 더하는 선택입니다.</div>
        <p><strong>화면에서 확인하는 법</strong></p>
        <ul>
          <li>유료회원가입 상단의 <strong>현재 등급</strong>이 PREMIUM·VIP·VVIP·PRESTIGE·BLACK 이고, <strong>유료 만료</strong>가 미래이면 유료회원입니다.</li>
          <li>「유료 미적용」이거나 만료일이 지났으면 일반회원입니다. 혜택(무료 EXPRESS·유료 한도)은 꺼집니다.</li>
          <li>개인 계정에는 개인 상품만 보입니다. 이름은 대문자입니다: <strong>PREMIUM · VIP · VVIP · PRESTIGE · BLACK</strong>. 본사가 판매를 켠 등급만 카드로 나옵니다. BLACK이 가장 상위입니다.</li>
        </ul>
        <p><strong>유료회원이 되면 달라지는 것</strong> (만료 전, 본사가 그 등급에 넣어 둔 값)</p>
        <ul>
          <li><strong>거래 한도</strong> — 일반 한도보다 유료 한도가 우선할 수 있습니다. 1회·일·월 한도가 더 커질 수 있습니다.</li>
          <li><strong>EXPRESS 무료 횟수</strong> — 빠른 완료 등급마다 기간 동안 쓸 수 있는 0원 횟수가 있습니다. 매달 리셋되지 않습니다. 아래 EXPRESS 절을 보세요.</li>
          <li><strong>횟수를 다 쓴 뒤의 할인</strong> — 만료 전까지는 일반 EXPRESS보다 낮은 유료 할인 요금이 적용될 수 있습니다.</li>
        </ul>
        <p>판매가는 <strong>USD</strong>입니다. USDT·USDC는 1:1, EURC는 EUR 시세로 환산되어 청구액이 함께 표시됩니다. 기간은 일(1–30일) 또는 월(2–12개월)이며, 많은 상품은 12개월입니다.</p>
        <p><strong>구매 순서</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">왼쪽 <strong>유료회원가입</strong>을 엽니다.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">등급 카드의 가격·기간·청구 통화를 확인합니다.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>카드로 구매</strong> 또는 <strong>크립토로 구매</strong>. 그 상품이 허용한 버튼만 나옵니다.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ICOPAY로 이동합니다. 카드는 가입 이메일·전화(국가번호)가 필요합니다. 크립토는 ICOPAY 입금 안내를 따릅니다.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">결과 화면에서 확정을 확인합니다. 「확인 중」이면 <strong>상태 새로고침</strong>. 확정되면 등급과 만료일이 적용됩니다.</span></div>
        </div>
        <div class="warn-box"><strong>결제 후 취소·환불은 불가</strong>합니다. 기간은 구매한 순간부터 새로 시작하며, 남아 있던 일수를 더하지 않습니다. 다시 사면 EXPRESS 무료 횟수도 그 시점부터 다시 받습니다.</div>
        <div class="info-box">크립토 버튼이 꺼지거나 「수탁 주소」 오류가 나면 본사 ICOPAY 크립토 설정 문제입니다. 그 상품에 카드가 있으면 카드로 구매하세요.</div>`,
        `<span class="menu-path">Paid membership</span>
        <div class="check-box"><strong>Paid member</strong> means a <strong>purchased grade that has not expired</strong> — not merely having a login. After signup you are a <strong>standard member (STANDARD)</strong>. Standard members can still purchase and use escrow after a verification pass and an approved wallet. Paid membership adds benefits on top.</div>
        <p><strong>How to tell on screen</strong></p>
        <ul>
          <li>On Paid membership, <strong>current grade</strong> is PREMIUM, VIP, VVIP, PRESTIGE, or BLACK and <strong>paid until</strong> is still in the future.</li>
          <li>If it says you are not on a paid plan, or the date has passed, you are standard. Free EXPRESS counts and paid limits turn off.</li>
          <li>Individuals only see individual products, in capitals: <strong>PREMIUM · VIP · VVIP · PRESTIGE · BLACK</strong>. Higher names are higher grades. Only grades HQ put on sale appear.</li>
        </ul>
        <p><strong>What changes while paid is active</strong> (values HQ set for that grade)</p>
        <ul>
          <li><strong>Limits</strong> — paid limits can override standard per-trade, daily, and monthly caps.</li>
          <li><strong>Free EXPRESS counts</strong> — each faster tier can be free a set number of times for the whole period. Counts do not reset every month. See the EXPRESS section.</li>
          <li><strong>Discount after the free count</strong> — until expiry, EXPRESS can bill at the paid discount instead of the standard fee.</li>
        </ul>
        <p>Price is <strong>USD</strong>. USDT/USDC are 1:1; EURC uses the EUR rate. Period is days (1–30) or months (2–12); many products are 12 months.</p>
        <p><strong>How to buy</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">Open <strong>Paid membership</strong>.</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">Read price, period, and charge currency on the card.</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>Buy with card</strong> or <strong>Buy with crypto</strong>. Only allowed buttons show.</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ICOPAY opens. Card needs your email and phone with country code. Crypto follows the ICOPAY deposit page.</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">Confirm on the result page. If it says pending, use <strong>Refresh status</strong>. Grade and expiry apply when confirmed.</span></div>
        </div>
        <div class="warn-box"><strong>No cancel or refund after payment.</strong> The period starts at purchase and does not add leftover days. Buying again also grants EXPRESS free counts again from that date.</div>
        <div class="info-box">If crypto is disabled or shows a custody-address error, that is an HQ ICOPAY crypto setting. Use card when the product allows it.</div>`,
        `<span class="menu-path">有料会員</span>
        <div class="check-box"><strong>有料会員</strong>とは、ログインできることではなく<strong>購入した等級がまだ期限内</strong>である状態です。登録しただけの個人は<strong>一般会員(STANDARD)</strong>です。一般会員も認証パスと承認ウォレットがあれば購入・エスクローができます。有料はそこに特典を足す選択です。</div>
        <p><strong>画面での見分け方</strong></p>
        <ul>
          <li>有料会員登録の<strong>現在の等級</strong>が PREMIUM・VIP・VVIP・PRESTIGE・BLACK で、<strong>有料期限</strong>が未来なら有料会員です。</li>
          <li>「有料未適用」または期限切れなら一般会員です。無料EXPRESS回数と有料限度はオフになります。</li>
          <li>個人には個人商品のみ。大文字: <strong>PREMIUM · VIP · VVIP · PRESTIGE · BLACK</strong>。本社が販売中の等級だけ出ます。</li>
        </ul>
        <p><strong>有料のあいだ変わること</strong>（本社がその等級に設定した値）</p>
        <ul>
          <li><strong>取引限度</strong> — 通常限度より有料限度が優先されることがあります。</li>
          <li><strong>EXPRESS無料回数</strong> — 早い完了の等級ごとに、期間中の0円回数が付きます。毎月リセットしません。下のEXPRESSを見てください。</li>
          <li><strong>回数を使い切ったあとの割引</strong> — 期限まで、通常より安い有料割引が適用されることがあります。</li>
        </ul>
        <p>価格は<strong>USD</strong>。USDT/USDCは1:1、EURCはEUR相場。期間は日(1–30)または月(2–12)。多くの商品は12か月です。</p>
        <p><strong>購入手順</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc"><strong>有料会員登録</strong>を開きます。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">価格・期間・請求通貨を確認します。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>カードで購入</strong>または<strong>クリプトで購入</strong>。許可されたボタンだけ出ます。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ICOPAYへ。カードは登録メール・電話(国番号)が必要。クリプトは入金案内に従います。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">結果画面で確定を確認。「確認待ち」なら<strong>状態を更新</strong>。確定で等級と期限が付きます。</span></div>
        </div>
        <div class="warn-box"><strong>決済後の取消・返金は不可</strong>です。期間は購入時点から再開し、残日数は足しません。再購入するとEXPRESS無料回数もその日から再付与されます。</div>
        <div class="info-box">クリプトが無効、またはカストディ住所エラーなら本社のICOPAYクリプト設定です。カードがあればカードで購入してください。</div>`,
        `<span class="menu-path">付费会员</span>
        <div class="check-box"><strong>付费会员</strong>不是“能登录”，而是<strong>已购买的等级尚未到期</strong>。刚注册的个人是<strong>普通会员（STANDARD）</strong>。普通会员在认证通过且钱包已批准后仍可采购和托管。付费是在此之上的可选权益。</div>
        <p><strong>如何在画面上判断</strong></p>
        <ul>
          <li>付费会员页的<strong>当前等级</strong>为 PREMIUM、VIP、VVIP、PRESTIGE 或 BLACK，且<strong>付费到期</strong>仍在将来。</li>
          <li>显示未付费或日期已过，即为普通会员。免费 EXPRESS 次数与付费限额关闭。</li>
          <li>个人只看个人商品，大写：<strong>PREMIUM · VIP · VVIP · PRESTIGE · BLACK</strong>。仅总部在售的等级会出现。</li>
        </ul>
        <p><strong>付费有效期内会变化的内容</strong>（以总部为该等级设置的值为准）</p>
        <ul>
          <li><strong>交易限额</strong> — 付费限额可优先于普通的单笔、每日、每月限额。</li>
          <li><strong>EXPRESS 免费次数</strong> — 每个更快等级在整个期限内有若干次 0 费。不按月重置。见下方 EXPRESS。</li>
          <li><strong>次数用完后的折扣</strong> — 到期前可能按低于普通的付费折扣计 EXPRESS 费。</li>
        </ul>
        <p>价格为 <strong>USD</strong>。USDT/USDC 为 1:1；EURC 按 EUR 汇率。期限为天(1–30)或月(2–12)，许多商品为 12 个月。</p>
        <p><strong>购买步骤</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">打开<strong>付费会员注册</strong>。</span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">查看价格、期限与收费币种。</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>卡支付购买</strong>或<strong>加密支付购买</strong>。只显示允许的按钮。</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">进入 ICOPAY。卡支付需要邮箱与电话(含国家号)。加密按入金说明操作。</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">在结果页确认。若为确认中，请<strong>刷新状态</strong>。确认后等级与到期日生效。</span></div>
        </div>
        <div class="warn-box"><strong>付款后不可取消或退款。</strong>期限从购买时重新开始，不叠加剩余天数。再次购买会从该日起重新发放 EXPRESS 免费次数。</div>
        <div class="info-box">加密按钮关闭或出现托管地址错误，是总部 ICOPAY 加密设置问题。商品允许卡支付时请用卡。</div>`,
        `<span class="menu-path">สมาชิกเสียเงิน</span>
        <div class="check-box"><strong>สมาชิกเสียเงิน</strong>ไม่ใช่แค่มีบัญชีล็อกอิน แต่คือ<strong>ระดับที่ซื้อแล้วยังไม่หมดอายุ</strong> หลังสมัครบุคคลเป็น<strong>สมาชิกทั่วไป (STANDARD)</strong> สมาชิกทั่วไปก็ซื้อและเอสโครว์ได้หลังผ่านยืนยันและมีกระเป๋าที่อนุมัติ สมาชิกเสียเงินเป็นสิทธิเพิ่ม</div>
        <p><strong>ดูบนหน้าจออย่างไร</strong></p>
        <ul>
          <li>ที่หน้าสมัคร <strong>ระดับปัจจุบัน</strong>เป็น PREMIUM VIP VVIP PRESTIGE หรือ BLACK และ<strong>หมดอายุเสียเงิน</strong>ยังไม่ถึง</li>
          <li>ถ้าขึ้นว่ายังไม่เสียเงิน หรือเลยวันแล้ว คือสมาชิกทั่วไป จำนวน EXPRESS ฟรีและวงเงินเสียเงินจะปิด</li>
          <li>บุคคลเห็นเฉพาะสินค้าบุคคล ตัวพิมพ์ใหญ่: <strong>PREMIUM · VIP · VVIP · PRESTIGE · BLACK</strong> โชว์เฉพาะที่ HQ เปิดขาย</li>
        </ul>
        <p><strong>อะไรเปลี่ยนเมื่อยังมีผล</strong> (ตามค่าที่ HQ ตั้งให้ระดับนั้น)</p>
        <ul>
          <li><strong>วงเงิน</strong> — วงเงินเสียเงินอาจมาก่อนวงเงินทั่วไป ทั้งต่อครั้ง ต่อวัน ต่อเดือน</li>
          <li><strong>จำนวน EXPRESS ฟรี</strong> — แต่ละระดับที่เร็วขึ้นมีจำนวนครั้ง 0 บาทตลอดระยะ ไม่รีเซ็ตรายเดือน ดูหัวข้อ EXPRESS</li>
          <li><strong>ส่วนลดหลังหมดจำนวนฟรี</strong> — จนหมดอายุ อาจคิด EXPRESS ถูกกว่าอัตราทั่วไป</li>
        </ul>
        <p>ราคาเป็น <strong>USD</strong> USDT/USDC = 1:1 EURC ตามเรท EUR ระยะเป็นวัน (1–30) หรือเดือน (2–12) ส่วนใหญ่ 12 เดือน</p>
        <p><strong>วิธีซื้อ</strong></p>
        <div class="flow">
          <div class="flow-row"><span class="flow-num">1</span><span class="flow-desc">เปิด<strong>สมัครสมาชิกเสียเงิน</strong></span></div>
          <div class="flow-row"><span class="flow-num">2</span><span class="flow-desc">ดูราคา ระยะ สกุลเงินเรียกเก็บ</span></div>
          <div class="flow-row"><span class="flow-num">3</span><span class="flow-desc"><strong>ซื้อด้วยบัตร</strong>หรือ<strong>ซื้อด้วยคริปโต</strong> โชว์เฉพาะปุ่มที่อนุญาต</span></div>
          <div class="flow-row"><span class="flow-num">4</span><span class="flow-desc">ไป ICOPAY บัตรต้องมีอีเมลและเบอร์ (รหัสประเทศ) คริปโตทำตามหน้าฝาก</span></div>
          <div class="flow-row"><span class="flow-num">5</span><span class="flow-desc">ยืนยันที่หน้าผล หากรอ ให้กด<strong>รีเฟรชสถานะ</strong> เมื่อยืนยัน ระดับและวันหมดอายุมีผล</span></div>
        </div>
        <div class="warn-box"><strong>หลังชำระแล้วยกเลิกหรือคืนเงินไม่ได้</strong> ระยะเริ่มใหม่จากวันซื้อ ไม่บวกวันที่เหลือ ซื้อซ้ำได้จำนวน EXPRESS ฟรีใหม่จากวันนั้น</div>
        <div class="info-box">ถ้าปุ่มคริปโตปิดหรือขึ้นที่อยู่คัสโตดีผิดพลาด เป็นการตั้งค่าคริปโต ICOPAY ของ HQ ถ้ามีบัตรให้ใช้บัตร</div>`,
      ),
    },
    {
      id: 'i-express',
      title: L(
        'EXPRESS란 · 쓰는 방법',
        'What EXPRESS is · how to use it',
        'EXPRESSとは · 使い方',
        '什么是 EXPRESS · 如何使用',
        'EXPRESS คืออะไร · วิธีใช้',
      ),
      bodyHtml: L(
        `<span class="menu-path">크립토 매입 신청 → EXPRESS (빠른 완료)</span>
        <div class="check-box"><strong>EXPRESS</strong>는 별도 상품이 아닙니다. 크립토 매입을 넣을 때 <strong>얼마나 빨리 끝내 달라고 약속할지</strong>를 고르는 옵션입니다. 고르지 않으면 <strong>BASIC</strong>(가장 여유 있는 기본)이 적용됩니다. 본사나 고객 설정에서 끈 등급은 목록에 나오지 않습니다.</div>
        <p>빠른 등급일수록 수수료가 붙을 수 있습니다. 화면의 금액은 <strong>고정(크립토) + 거래 금액의 %</strong>입니다. BASIC은 보통 0입니다.</p>
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
          <li>D+N은 <strong>견적이 확정된 날</strong>부터 셉니다. 약속 시각을 넘기면 실제 끝난 시각으로 수수료가 다시 계산되고, 더 받은 금액은 복원될 수 있습니다.</li>
          <li><strong>일반회원</strong>은 화면에 나온 EXPRESS 요금을 그대로 냅니다.</li>
          <li><strong>유료회원</strong>(만료 전)은 그 등급에 남은 <strong>무료 횟수</strong>가 있으면 그 EXPRESS는 0원입니다. 횟수는 유료 기간 전체 분량이고 매달 다시 채워지지 않습니다. BASIC은 무료 횟수 대상이 아닙니다.</li>
          <li>무료 횟수를 다 쓰면, 만료 전까지 <strong>유료 할인 요금</strong>으로 청구됩니다. 멤버십을 다시 사면 기간과 무료 횟수가 구매 시점부터 다시 시작됩니다.</li>
          <li>빠른 등급을 고르지 않아도 매입은 BASIC으로 진행할 수 있습니다.</li>
        </ul>
        <div class="info-box">신청 상세에서 신청 등급, 약속 완료 시각, 실제 달성 등급, 정산 수수료, 복원(환급) 여부를 볼 수 있습니다.</div>`,
        `<span class="menu-path">Crypto purchase → EXPRESS (faster completion)</span>
        <div class="check-box"><strong>EXPRESS</strong> is not a separate product. On a crypto purchase it is the option for <strong>how fast completion is promised</strong>. If you do not choose, <strong>BASIC</strong> (the slowest default) applies. Tiers turned off by HQ or your account stay hidden.</div>
        <p>Faster tiers can cost more. The amount on screen is a <strong>fixed crypto fee plus a percent of the trade</strong>. BASIC is usually 0.</p>
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
          <li>D+N counts from the <strong>quote confirmation day</strong>. If the promise is missed, the fee can be recalculated from the real finish time and any extra charge restored.</li>
          <li>A <strong>standard member</strong> pays the EXPRESS price shown.</li>
          <li>An <strong>active paid member</strong> pays 0 for a tier while its <strong>free count</strong> remains. Counts cover the whole paid period and do not refill each month. BASIC has no free count.</li>
          <li>After the free count is used, the <strong>paid discount</strong> applies until expiry. Buying membership again restarts the period and the free counts.</li>
          <li>You can still purchase on BASIC without picking a faster tier.</li>
        </ul>
        <div class="info-box">The ticket shows the requested tier, promised time, tier actually achieved, settled fee, and any amount restored.</div>`,
        `<span class="menu-path">クリプト購入 → EXPRESS（早い完了）</span>
        <div class="check-box"><strong>EXPRESS</strong>は別商品ではありません。購入申請で<strong>どれだけ早く完了を約束するか</strong>を選ぶオプションです。未選択は<strong>BASIC</strong>（いちばん余裕のある既定）です。本社や顧客設定でOFFの等級は出ません。</div>
        <p>速い等級ほど手数料が付くことがあります。画面の金額は<strong>固定(クリプト)＋取引額の%</strong>です。BASICは通常0です。</p>
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
          <li>D+Nは<strong>見積確定日</strong>から数えます。約束を過ぎると実際の完了時刻で再計算され、多く受け取った分は復元されることがあります。</li>
          <li><strong>一般会員</strong>は画面のEXPRESS料金をそのまま支払います。</li>
          <li><strong>有料会員</strong>（期限内）は、その等級の<strong>無料回数</strong>が残っていれば0円です。回数は有料期間の合計で、毎月は補充されません。BASICは無料回数の対象外です。</li>
          <li>回数を使い切ると期限まで<strong>有料割引</strong>で請求されます。再購入すると期間と無料回数が購入日から再開します。</li>
          <li>速い等級を選ばなくてもBASICで購入できます。</li>
        </ul>
        <div class="info-box">申請詳細で申請等級、約束時刻、実際の達成等級、精算手数料、復元の有無を確認できます。</div>`,
        `<span class="menu-path">加密货币采购 → EXPRESS（更快完成）</span>
        <div class="check-box"><strong>EXPRESS</strong>不是另一件商品。申请采购时用来选择<strong>承诺多快完成</strong>。不选则为 <strong>BASIC</strong>（最从容的默认）。总部或账户关闭的等级不显示。</div>
        <p>越快的等级可能越贵。画面金额为<strong>固定（加密）+ 交易金额的百分比</strong>。BASIC 通常为 0。</p>
        <table>
          <tr><th>等级</th><th>完成承诺</th></tr>
          <tr><td>ULTRA</td><td>1 小时内</td></tr>
          <tr><td>PRIORITY</td><td>6 小时内</td></tr>
          <tr><td>HALF</td><td>12 小时内</td></tr>
          <tr><td>DAY</td><td>24 小时内</td></tr>
          <tr><td>D1</td><td>报价确认日的次日(D+1) 23:59 前</td></tr>
          <tr><td>D2</td><td>报价确认日起 D+2 日 23:59 前</td></tr>
          <tr><td>BASIC</td><td>报价确认日起 D+3 日 23:59 前（默认）</td></tr>
        </table>
        <ul>
          <li>D+N 从<strong>报价确认日</strong>起算。未按时完成时，按实际完成时间重算，多收部分可退回。</li>
          <li><strong>普通会员</strong>按画面上的 EXPRESS 价格支付。</li>
          <li><strong>有效付费会员</strong>在该等级<strong>免费次数</strong>还有剩余时为 0 费。次数是整个付费期的总量，不按月补充。BASIC 没有免费次数。</li>
          <li>次数用完后，到期前按<strong>付费折扣</strong>计费。再次购买会从购买日起重新开始期限与免费次数。</li>
          <li>不选更快等级时，仍可用 BASIC 采购。</li>
        </ul>
        <div class="info-box">申请详情可查看申请等级、承诺时间、实际达成等级、结算手续费及是否退回。</div>`,
        `<span class="menu-path">ซื้อคริปโต → EXPRESS (เสร็จเร็วขึ้น)</span>
        <div class="check-box"><strong>EXPRESS</strong>ไม่ใช่สินค้าแยก ตอนสมัครซื้อคือตัวเลือก<strong>สัญญาว่าจะเสร็จเร็วแค่ไหน</strong> ถ้าไม่เลือกจะเป็น <strong>BASIC</strong> (ค่าเริ่มต้นที่ผ่อนคลายสุด) ระดับที่ HQ หรือบัญชีปิดจะไม่โชว์</div>
        <p>ระดับยิ่งเร็วอาจยิ่งมีค่าธรรมเนียม ยอดบนจอคือ<strong>คงที่ (คริปโต) + % ของยอดซื้อ</strong> BASIC มักเป็น 0</p>
        <table>
          <tr><th>ระดับ</th><th>คำสัญญา</th></tr>
          <tr><td>ULTRA</td><td>ภายใน 1 ชั่วโมง</td></tr>
          <tr><td>PRIORITY</td><td>ภายใน 6 ชั่วโมง</td></tr>
          <tr><td>HALF</td><td>ภายใน 12 ชั่วโมง</td></tr>
          <tr><td>DAY</td><td>ภายใน 24 ชั่วโมง</td></tr>
          <tr><td>D1</td><td>ถึง 23:59 ของวันถัดไป (D+1) จากวันยืนยันใบเสนอราคา</td></tr>
          <tr><td>D2</td><td>ถึง 23:59 ของ D+2 จากวันยืนยันใบเสนอราคา</td></tr>
          <tr><td>BASIC</td><td>ถึง 23:59 ของ D+3 จากวันยืนยันใบเสนอราคา (ค่าเริ่มต้น)</td></tr>
        </table>
        <ul>
          <li>D+N นับจาก<strong>วันยืนยันใบเสนอราคา</strong> ถ้าเลยสัญญา อาจคำนวณใหม่ตามเวลาที่เสร็จจริงและคืนส่วนที่เก็บเกิน</li>
          <li><strong>สมาชิกทั่วไป</strong>จ่ายตามราคา EXPRESS ที่โชว์</li>
          <li><strong>สมาชิกเสียเงินที่ยังมีผล</strong> ระดับนั้นเป็น 0 บาทจนกว่า<strong>จำนวนฟรี</strong>จะหมด จำนวนเป็นยอดทั้งระยะ ไม่เติมทุกเดือน BASIC ไม่มีจำนวนฟรี</li>
          <li>หมดจำนวนแล้ว จนหมดอายุคิดตาม<strong>ส่วนลดสมาชิกเสียเงิน</strong> ซื้อใหม่จะเริ่มระยะและจำนวนฟรีใหม่จากวันซื้อ</li>
          <li>ไม่เลือกเร็วขึ้นก็ซื้อด้วย BASIC ได้</li>
        </ul>
        <div class="info-box">ในรายละเอียดคำขอ ดูระดับที่ขอ เวลาที่สัญญา ระดับที่ทำได้จริง ค่าธรรมเนียมที่คิด และส่วนที่คืน</div>`,
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
        <div class="faq-item"><div class="faq-q">시뮬레이터와 실제 금액이 다릅니다.</div><div class="faq-a">시뮬레이터는 참고용입니다. 환율·수수료는 신청·입금 시점에 달라질 수 있습니다.</div></div>
        <div class="faq-item"><div class="faq-q">가입하면 바로 유료회원인가요?</div><div class="faq-a">아닙니다. 가입만 하면 일반회원(STANDARD)입니다. 유료회원가입에서 등급을 결제하고, 유료 만료가 아직 남았을 때만 유료회원입니다.</div></div>
        <div class="faq-item"><div class="faq-q">유료 결제를 취소할 수 있나요?</div><div class="faq-a">결제 후 취소·환불은 불가입니다. 기간은 구매 시점부터 새로 시작하며 남은 일수를 더하지 않습니다.</div></div>
        <div class="faq-item"><div class="faq-q">EXPRESS가 안 보이거나 무료가 아닙니다.</div><div class="faq-a">목록에 없으면 그 등급이 꺼져 있거나 EXPRESS가 비활성입니다. 선택하지 않으면 BASIC입니다. 유료인데 유료가 아니면, 그 등급 무료 횟수를 다 썼거나 BASIC을 고른 경우입니다. 다시 구매하면 횟수가 새로 부여됩니다.</div></div>`,
        `<div class="faq-item"><div class="faq-q">I do not see the corporate manual.</div><div class="faq-a">Individual accounts only open the individual manual. Corporate logins see corporate only. HQ/org see both.</div></div>
        <div class="faq-item"><div class="faq-q">I signed up but cannot purchase.</div><div class="faq-a">You need HQ trade approval, a verification pass, and an approved wallet. If VIEW_ONLY, wait for approval.</div></div>
        <div class="faq-item"><div class="faq-q">Bank transfer is missing.</div><div class="faq-a">Individuals default to remittance. Transfer stays hidden if HQ or your customer setting disabled it.</div></div>
        <div class="faq-item"><div class="faq-q">Phone signup was rejected.</div><div class="faq-a">That number is already used for an individual. Email is globally unique. Sign in to the existing account or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Card button is gray.</div><div class="faq-a">Card is off. Use remittance / transfer (if allowed) or contact support.</div></div>
        <div class="faq-item"><div class="faq-q">Simulator differs from purchase.</div><div class="faq-a">Reference only — rates and fees can change before apply/deposit.</div></div>
        <div class="faq-item"><div class="faq-q">Am I a paid member just because I signed up?</div><div class="faq-a">No. Signup makes you a standard member (STANDARD). You are paid only after you buy a grade and the paid-until date is still ahead.</div></div>
        <div class="faq-item"><div class="faq-q">Can I cancel a paid membership?</div><div class="faq-a">No cancel or refund after payment. The period restarts at purchase and leftover days are not added.</div></div>
        <div class="faq-item"><div class="faq-q">EXPRESS is missing or not free.</div><div class="faq-a">A hidden tier is turned off, or EXPRESS is disabled. If you do not choose, BASIC applies. If you are paid but still charged, that tier’s free count is used up or you chose BASIC. A new purchase grants the counts again.</div></div>`,
        `<div class="faq-item"><div class="faq-q">法人マニュアルが見えません。</div><div class="faq-a">個人アカウントは個人用のみ。法人ログインは法人用のみ。総本社・組織は両方見られます。</div></div>
        <div class="faq-item"><div class="faq-q">登録したが購入できません。</div><div class="faq-a">本社の取引承認・認証パス・承認ウォレットが必要です。VIEW_ONLYなら承認待ちです。</div></div>
        <div class="faq-item"><div class="faq-q">口座振替がありません。</div><div class="faq-a">個人の既定は送金です。本社または顧客設定でOFFなら表示されません。</div></div>
        <div class="faq-item"><div class="faq-q">同じ電話で登録できません。</div><div class="faq-a">個人タイプで既に使用されています。メールは全体で一意です。既存アカウントでログインするかサポートへ。</div></div>
        <div class="faq-item"><div class="faq-q">カードボタンが灰色です。</div><div class="faq-a">カード無効です。送金・振替(許可時)を使うかサポートへ。</div></div>
        <div class="faq-item"><div class="faq-q">シミュレーターと実際が違います。</div><div class="faq-a">参考用です。為替・手数料は申請・入金時点で変わり得ます。</div></div>
        <div class="faq-item"><div class="faq-q">登録しただけで有料会員ですか?</div><div class="faq-a">いいえ。登録だけなら一般会員(STANDARD)です。有料会員登録で等級を支払い、有料期限が残っているときだけ有料会員です。</div></div>
        <div class="faq-item"><div class="faq-q">有料をキャンセルできますか?</div><div class="faq-a">決済後の取消・返金は不可です。期間は購入時点から再開し、残日数は足しません。</div></div>
        <div class="faq-item"><div class="faq-q">EXPRESSが出ない、または無料ではありません。</div><div class="faq-a">一覧にない等級はOFF、またはEXPRESS無効です。未選択はBASICです。有料なのに無料でないなら、その無料回数を使い切ったかBASICを選んでいます。再購入で回数が再付与されます。</div></div>`,
        `<div class="faq-item"><div class="faq-q">看不到企业手册。</div><div class="faq-a">个人账号只打开个人手册；企业登录只看企业手册。总部/组织可看两者。</div></div>
        <div class="faq-item"><div class="faq-q">注册后无法采购。</div><div class="faq-a">需要总部交易批准、认证通过与已批钱包。若为仅查看请等待批准。</div></div>
        <div class="faq-item"><div class="faq-q">没有银行转账。</div><div class="faq-a">个人默认汇款。总部或客户设置关闭时不显示转账。</div></div>
        <div class="faq-item"><div class="faq-q">同一手机无法注册。</div><div class="faq-a">该号已在个人类型使用。邮箱全局唯一。请登录已有账号或联系支持。</div></div>
        <div class="faq-item"><div class="faq-q">卡按钮是灰色。</div><div class="faq-a">卡支付未启用。请用汇款/转账（若允许）或联系支持。</div></div>
        <div class="faq-item"><div class="faq-q">模拟器与实际不符。</div><div class="faq-a">仅供参考，汇率与手续费可能在申请/入金时变化。</div></div>
        <div class="faq-item"><div class="faq-q">注册后就是付费会员吗？</div><div class="faq-a">不是。只注册是普通会员（STANDARD）。在付费会员里购买等级，且付费到期日未到，才是付费会员。</div></div>
        <div class="faq-item"><div class="faq-q">可以取消付费吗？</div><div class="faq-a">付款后不可取消或退款。期限从购买时重新开始，不叠加剩余天数。</div></div>
        <div class="faq-item"><div class="faq-q">看不到 EXPRESS，或并不免费。</div><div class="faq-a">列表中没有表示该等级已关闭，或 EXPRESS 未启用。不选则为 BASIC。已付费仍收费，表示该等级免费次数已用完，或您选了 BASIC。再次购买会重新发放次数。</div></div>`,
        `<div class="faq-item"><div class="faq-q">ไม่เห็นคู่มือนิติบุคคล</div><div class="faq-a">บัญชีบุคคลเปิดได้เฉพาะคู่มือบุคคล นิติเห็นเฉพาะคู่มือนิติ HQ/องค์กรเห็นทั้งสอง</div></div>
        <div class="faq-item"><div class="faq-q">สมัครแล้วซื้อไม่ได้</div><div class="faq-a">ต้องอนุมัติธุรกรรม HQ ผ่านยืนยัน และกระเป๋าที่อนุมัติ หาก VIEW_ONLY ให้รออนุมัติ</div></div>
        <div class="faq-item"><div class="faq-q">ไม่มีโอนบัญชี</div><div class="faq-a">บุคคลเริ่มต้นคือธุรกรรมโอน หาก HQ หรือตั้งค่าลูกค้าปิด จะไม่โชว์</div></div>
        <div class="faq-item"><div class="faq-q">สมัครด้วยเบอร์เดิมไม่ได้</div><div class="faq-a">เบอร์ถูกใช้ในประเภทบุคคลแล้ว อีเมลต้องไม่ซ้ำทั้งระบบ เข้าบัญชีเดิมหรือติดต่อซัพพอร์ต</div></div>
        <div class="faq-item"><div class="faq-q">ปุ่มบัตรสีเทา</div><div class="faq-a">บัตรปิดอยู่ ใช้โอน/ธุรกรรมโอน (ถ้าอนุญาต) หรือติดต่อซัพพอร์ต</div></div>
        <div class="faq-item"><div class="faq-q">ตัวจำลองไม่ตรงยอดจริง</div><div class="faq-a">ใช้อ้างอิงเท่านั้น อัตรา/ค่าธรรมเนียมอาจเปลี่ยนก่อนสมัครหรือฝาก</div></div>
        <div class="faq-item"><div class="faq-q">สมัครแล้วเป็นสมาชิกเสียเงินทันทีไหม</div><div class="faq-a">ไม่ สมัครอย่างเดียวเป็นสมาชิกทั่วไป (STANDARD) จะเป็นสมาชิกเสียเงินเมื่อซื้อระดับแล้ววันหมดอายุยังไม่ถึง</div></div>
        <div class="faq-item"><div class="faq-q">ยกเลิกการเสียเงินได้ไหม</div><div class="faq-a">หลังชำระแล้วยกเลิกหรือคืนเงินไม่ได้ ระยะเริ่มใหม่จากวันซื้อ ไม่บวกวันที่เหลือ</div></div>
        <div class="faq-item"><div class="faq-q">ไม่เห็น EXPRESS หรือไม่ฟรี</div><div class="faq-a">ถ้าไม่อยู่ในรายการ ระดับนั้นปิด หรือ EXPRESS ปิด ถ้าไม่เลือกจะเป็น BASIC ถ้าเสียเงินแล้วยังถูกคิด แปลว่าจำนวนฟรีหมด หรือเลือก BASIC ซื้อใหม่จะได้จำนวนใหม่</div></div>`,
      ),
    },
  ],
};
