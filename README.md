# 사진작가 개인 포트폴리오 사이트 백엔드

## 1. 프로젝트 목적
- 사진작가 개인 포트폴리오 사이트
- 관리자 1명
- 일반 사용자는 조회만 가능
- 단순 구조, 과설계 지양
- 3개월간 거의 무료 운영 → 이후 월 1만원 내외 지출 가능


## 2. 기술 스택
Frontend:
- Next.js
- Netlify 배포 (이미 완료)

Backend:
- NestJS

ORM:
- Prisma

Database:
- PostgreSQL

Image Storage:
- AWS S3
- Presigned URL 방식


## 3. 전체 아키텍처 구조

[User]
   ↓
[Netlify - Frontend]
   ↓ (API 요청)
[Backend - NestJS]
   ↓
[PostgreSQL]

이미지 업로드:
Frontend → S3 (Presigned URL)

## 4. 인프라 전략 (2단계 운영 계획)

[1단계 - 거의 무료 운영 (~3개월)]

Frontend  → Netlify (Free)
Backend   → Render Free
Database  → Supabase Free (Postgres)
Storage   → AWS S3

특징:
- 서버 15분 inactivity 시 sleep
- 첫 요청 시 콜드 스타트 발생 가능
- 구조 변경 없이 추후 유료 전환 가능


[2단계 - 유료 전환 (~월 1만원)]

Frontend  → Netlify 유지
Backend   → Railway 유료 플랜
Database  → Railway Postgres

변경되는 것:
- DATABASE_URL
- Backend 배포 위치

변경되지 않는 것:
- Prisma 구조
- DB 종류(Postgres)
- API 구조
- 프론트 코드 대부분


## 5. 도메인 구조 (향후 적용)

example.com        → Netlify (Frontend)
api.example.com    → Backend (Render or Railway)

도메인 구매 후 DNS만 연결
배포 서비스 이동 불필요

## 6. 인증 설계

- 관리자 1명
- JWT 기반 인증
- 로그인 시 Access Token 발급
- 작품 CUD / About 수정은 인증 필요

Auth API (로그인)
--------------------------------------------------
- Endpoint: `POST /auth/login`
- Headers: `Content-Type: application/json`
- Request Body:
  - `email` (string, required)
  - `password` (string, required)
- Response 200 OK:
```
{
  "accessToken": "JWT 문자열"
}
```
- Error 401 Unauthorized:
  - 잘못된 이메일 또는 비밀번호 → `{ "statusCode": 401, "message": "Invalid credentials", "error": "Unauthorized" }`
- 비고:
  - 토큰 만료: 7일 (`expiresIn: '7d'`)
  - JWT payload: `{ sub: adminId, email }`
  - Authorization 헤더에 `Bearer <accessToken>` 형태로 포함해 보호된 API 요청
--------------------------------------------------


## 7. 데이터베이스 설계


[admins]
- id (PK)
- email (unique)
- password (hash)
- created_at

----------------------------------------------

[works]
- id (PK)
- title
- year
- thumbnail_url
- image_urls (JSON 배열)
- created_at
- updated_at

image_urls 예시:
[
  "https://s3.../works/1/img1.jpg",
  "https://s3.../works/1/img2.jpg"
]

설계 철학:
- 이미지 최대 20장
- 이미지 메타데이터 없음
- 순서 = JSON 배열 index
- 정규화(work_images 테이블) 사용 안 함

----------------------------------------------

[about]
- id (PK, 단일 row)
- artist_name
- description (100자 미만)
- image_url
- updated_at


## 8. 이미지 업로드 전략

- 서버는 이미지 파일을 직접 받지 않음
- 서버는 presigned URL만 발급
- 프론트가 S3에 직접 업로드

업로드 흐름:

1. 관리자 로그인
2. presigned URL 요청 (최대 20개)
3. 서버가 S3 presigned URL 발급 (5분 유효)
4. 프론트가 S3에 PUT 업로드
5. 업로드 성공 후 작품 생성 API 호출
6. 서버가 DB에 URL 저장

## 9. 이미지 순서 변경 정책

- 이미지 순서는 DB가 관리하지 않음
- 프론트에서 순서 변경
- 변경된 image_urls 배열을 통째로 PUT
- 서버는 JSON 배열 전체 덮어쓰기

이유:
- 이미지 수 적음
- 관리자 1명
- 단순성 유지
- 과설계 방지

## 10. 향후 구조 변경 조건

아래 중 하나 발생 시 정규화 고려:

- 이미지별 설명 추가
- 이미지별 공개 여부
- 다수 관리자
- 이미지 수 대폭 증가
- 이미지 단위 히스토리 필요

→ works + work_images 테이블 구조 전환

