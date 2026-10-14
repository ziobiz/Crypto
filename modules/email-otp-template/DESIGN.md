# Email OTP Template — 설계값 (DESIGN)

버전: **1.0.0**  
적용 제품: TINPASS / 동일 브랜드의 인증 메일

## 1. UI 구조 (고정)

Wirex One 계열 카드 레이아웃:

1. 카드 상단 브랜드 라벨 (작은 회색) — 기본 `TINPASS By Ontheline`
2. 목적 제목 (~17px regular, 제품명만 bold) — 예: `Log in to **TINPASS**`
3. 구분선
4. `Your code is` (로케일 번역)
5. 테두리 박스 + **6자리 코드** (가장 강조, ~28px)
6. 유효시간 + 공유 금지
7. 구분선
8. 본인 요청 아님 안내
9. 카드 밖 하단 — `Service by **Thinpass**`

이메일 클라이언트 호환을 위해 **table 기반** HTML을 사용한다.

## 2. Purpose (목적)

| purpose | 용도 (예) |
|---------|-----------|
| `LOGIN` | 로그인 이메일 OTP / 테스트 발송 |
| `REGISTER` | 신규 회원가입 이메일 인증 |
| `OTP_ENROLL` | Google OTP 최초 등록 전 이메일 확인 |
| `PASSWORD_RESET` | 비밀번호 재설정 |
| `OTP_RESET` | OTP 초기화 |

호스트 앱의 purpose enum이 다르면 매핑 레이어에서 위 5개로 변환한다.

## 3. 다국어

필수 로케일: **KR / US / JP / CH / TH**  
제목·본문·만료·무시 안내를 로케일별로 둔다.  
브랜드 라벨·`Service by` 접두사는 영문 고정해도 되고, 제품명만 교체한다.

## 4. 브랜딩 교체 (다른 사이트)

`brand` 옵션만 바꾸면 동일 레이아웃으로 재사용:

```ts
brand: {
  brandLabel: 'ACME By Partner',
  productName: 'ACME',
  serviceByName: 'Acme',
}
```

## 5. 보안·운영

- 코드는 메일 HTML에만 넣고, 로그에 평문 코드를 남기지 않는다.
- 유효시간은 호스트가 발급 시 결정한 분을 `{minutes}`로 전달한다.
- HQ 커스텀 subject/body가 있으면 **text(평문)** 만 덮어쓰고, HTML은 브랜드 카드 유지(권장).
