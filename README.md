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

### About API
관리자 소개(About) 정보는 단일 row만 존재하며, 조회는 누구나 가능하지만 수정은 인증이 필요합니다. 이미지는 서버가 직접 받지 않고 아래 순서를 지켜야 합니다.

1. `POST /about/image/presigned-url` 호출 → S3 업로드용 `uploadUrl`과 최종 `fileUrl` 확보
2. 프론트엔드가 `uploadUrl`로 S3에 직접 PUT 업로드
3. 업로드 성공 시 반환받은 `fileUrl`을 `PUT /about`의 `imageUrl` 필드에 전달
4. About 데이터 저장 및 조회 시 DB에 저장된 `imageUrl` 사용

**GET /about**
--------------------------------------------------
- 권한: Public
- Response 200 OK:
```
{
  "id": 1,
  "artistName": "작가 이름",
  "description": "소개 문구 (100자 미만)",
  "imageUrl": "https://..." | null,
  "updatedAt": "2026-02-20T12:34:56.000Z"
}
```
--------------------------------------------------

**PUT /about**
--------------------------------------------------
- 권한: 관리자 (Authorization: Bearer <JWT>)
- Headers: `Content-Type: application/json`
- Request Body:
```
{
  "artistName": "작가 이름 (필수)",
  "description": "소개 문구 (필수, 100자 미만)",
  "imageUrl": "https://<bucket>.s3.<region>.amazonaws.com/..." | "" | null (선택)
}
```
  - `imageUrl`에 빈 문자열 혹은 `null`을 전달하면 기존 이미지를 제거
  - presigned 업로드 완료 후 반환된 `fileUrl`만 허용 (임의 URL 금지)
- Response 200 OK: GET과 동일한 형태
- Validation Errors (400 Bad Request):
  - `artistName`/`description`이 비어 있거나 100자 이상인 경우
  - `imageUrl`이 문자열/`null` 이외의 타입인 경우
--------------------------------------------------

**POST /about/image/presigned-url**
--------------------------------------------------
- 권한: 관리자 (Authorization: Bearer <JWT>)
- Headers: `Content-Type: application/json`
- Request Body:
```
{
  "fileName": "profile.png",
  "contentType": "image/png"
}
```
- Response 200 OK:
```
{
  "uploadUrl": "https://s3.amazonaws.com/...&X-Amz-Signature=...",
  "fileUrl": "https://<bucket>.s3.<region>.amazonaws.com/about/1739999999999-uuid-profile.png",
  "expiresInSeconds": 300
}
```
- 비고:
  - `contentType`은 반드시 `image/*` MIME 이어야 함
  - presigned URL 유효시간은 5분
  - 업로드 성공 후 `fileUrl` 값을 `PUT /about`의 `imageUrl`로 전달
--------------------------------------------------

### Works API
작품 데이터는 공개 조회가 가능하며, 생성/수정/삭제/이미지 업로드 presigned URL 발급은 관리자 전용입니다. 모든 이미지 URL은 반드시 `POST /works/image/presigned-url`을 통해 받은 `fileUrl`만 허용합니다.

**GET /works**
--------------------------------------------------
- 권한: Public
- Query Params:
  - `limit` (선택, 1~50, 기본 12)
  - `cursor` (선택, 이전 응답의 마지막 `id`)
- 정렬: `createdAt DESC`, `id DESC`
- Response 200 OK:
```
[
  {
    "id": 12,
    "title": "작품명",
    "year": 2024,
    "thumbnailUrl": "https://<bucket>.s3.<region>.amazonaws.com/works/...",
    "imageUrls": ["https://.../image1.jpg", "..."],
    "createdAt": "2026-02-23T05:12:34.000Z",
    "updatedAt": "2026-02-23T05:12:34.000Z"
  }
]
```
- 커서 기반 페이지네이션: 다음 페이지 요청 시 `cursor`에 이전 응답 마지막 row의 `id` 전달
--------------------------------------------------

**GET /works/:id**
--------------------------------------------------
- 권한: Public
- Path Params: `id` (number)
- Response 200 OK: 단일 작품, 필드 구조는 GET /works 요소와 동일
- 404 Not Found: 없는 `id`
--------------------------------------------------

**POST /works**
--------------------------------------------------
- 권한: 관리자 (Authorization: Bearer <JWT>)
- Headers: `Content-Type: application/json`
- Request Body:
```
{
  "title": "작품명",
  "year": 2024,
  "thumbnailUrl": "https://<bucket>.s3.<region>.amazonaws.com/works/...",
  "imageUrls": [
    "https://<bucket>.s3.<region>.amazonaws.com/works/...-1.jpg",
    "https://<bucket>.s3.<region>.amazonaws.com/works/...-2.jpg"
  ]
}
```
- Response 201 Created: 생성된 row 전체 (id, timestamps 포함)
- Validation Rules:
  - `title`: string, 공백 불가, 100자 이하
  - `year`: 1900~현재 연도
  - `imageUrls`: 1~20개, 모두 presigned S3 URL
  - `thumbnailUrl`: 선택, null 허용, presigned S3 URL
--------------------------------------------------

**PUT /works/:id**
--------------------------------------------------
- 권한: 관리자 (Authorization: Bearer <JWT>)
- Request Body: POST와 동일 구조 (필수 필드만 포함해도 되지만 최소 1개 필드 필요)
- 동작: 전달된 필드로 전체 덮어쓰기. `imageUrls`는 `{ set: [...] }` 방식으로 순서를 포함해 전부 교체되므로, 프론트에서 정렬 후 전체 배열 전달.
- Response 200 OK: 갱신된 row
- 404 Not Found: 없는 `id`
--------------------------------------------------

**DELETE /works/:id**
--------------------------------------------------
- 권한: 관리자 (Authorization: Bearer <JWT>)
- Response 204 No Content
- 404 Not Found: 없는 `id`
--------------------------------------------------

**POST /works/image/presigned-url**
--------------------------------------------------
- 권한: 관리자 (Authorization: Bearer <JWT>)
- Headers: `Content-Type: application/json`
- Request Body:
```
{
  "fileName": "work-main.png",
  "contentType": "image/png"
}
```
- Response 200 OK:
```
{
  "uploadUrl": "https://s3.../works/...&X-Amz-Signature=...",
  "fileUrl": "https://<bucket>.s3.<region>.amazonaws.com/works/1739999999999-uuid-work-main.png",
  "expiresInSeconds": 300
}
```
- 비고:
  - 이미지 파일만 허용 (`image/*`)
  - presigned URL 유효시간 5분
  - 발급받은 `fileUrl`을 작품 생성/수정 시 `thumbnailUrl` 혹은 `imageUrls`에 그대로 사용
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

필요 환경 변수:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`

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
