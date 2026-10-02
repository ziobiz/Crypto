# TINPASS 서버 이전 런북

현재 운영(구): `root@114.207.245.160` (`otltinpass.cafe24.com`)  
신규(이관 중): `root@162.35.16.100` (`vps3674458.trouble-free.net`)

앱 경로: `/var/www/crypto-workflow`  
도메인: `tinpass.com`, `www.tinpass.com`, `api.tinpass.com`

---

## 이미 완료된 작업

1. 신규 서버 Ubuntu 22.04 기본 설치 (Node 20, PostgreSQL, Nginx, PM2, Swap)
2. 구서버 DB(`crypto_workflow`) · `uploads` · `.env` 백업 → 신규 복원
3. `crypto-release.zip` 배포 · PM2 `crypto` online · localhost health OK
4. Nginx HTTP(80) 프록시 (IP + 도메인 server_name)
5. 로컬 배포 스크립트 IP 갱신: [`deploy/ftp-upload-built.ps1`](../deploy/ftp-upload-built.ps1) → `162.35.16.100`

헬퍼: [`deploy/cafe24-business/migrate-remote.py`](../deploy/cafe24-business/migrate-remote.py)

```powershell
python deploy\cafe24-business\migrate-remote.py inspect-old
python deploy\cafe24-business\migrate-remote.py backup-old
python deploy\cafe24-business\migrate-remote.py restore-new
python deploy\cafe24-business\migrate-remote.py upload-release
```

---

## DNS 전환 (남은 핵심)

도메인 A 레코드를 **신규 IP `162.35.16.100`** 으로 변경:

| 호스트 | 타입 | 값 |
|--------|------|-----|
| `@` (tinpass.com) | A | 162.35.16.100 |
| `www` | A | 162.35.16.100 |
| `api` | A | 162.35.16.100 |

전파 확인 후 SSL:

```bash
ssh root@162.35.16.100
cd /var/www/crypto-workflow
sudo bash deploy/cafe24-business/setup-ssl-tinpass.sh
```

전환 전 임시 확인:

- http://162.35.16.100/login
- http://162.35.16.100/health

---

## 컷오버 체크리스트

- [ ] DNS A 레코드 → 162.35.16.100
- [ ] `dig +short tinpass.com` / `api.tinpass.com` 신규 IP 확인
- [ ] SSL 발급 (`setup-ssl-tinpass.sh`)
- [ ] https://tinpass.com/login · https://api.tinpass.com/health 확인
- [ ] 로그인·USDT 목록·증빙 파일(uploads) 확인
- [ ] CURFEX/ICOPAY/웹훅 콜백 URL이 새 서버로 오는지 확인
- [ ] 로컬 배포: `deploy\ftp-upload-built.ps1` (이미 신규 IP)
- [ ] 구서버 PM2 stop (안정화 후) — 즉시 삭제하지 말 것
- [ ] 구서버 최종 `pg_dump` 보관

---

## 주의

- `deploy/release/migrate-staging/` 에 `.env` 백업이 있음 → **커밋 금지** (gitignore 처리)
- 서버 root 비밀번호·DB 비밀번호는 채팅/저장소에 남기지 말 것
- SSL은 DNS가 신규를 가리킨 뒤에만 Let's Encrypt 성공
