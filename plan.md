# Next.js Radar - PRD (Product Requirements Document)

## 개요

**Next.js Radar**는 Next.js App Router 프로젝트의 라우팅 구조를 시각화하고 탐색을 돕는 VS Code 확장입니다. Svelte Radar의 성공적인 아키텍처를 기반으로 Next.js App Router의 특성에 맞게 설계됩니다.

## 참고 소스
./svelte-radar 롤 최대한 참고 해서 제작 해 줘.
https://github.com/HarshKothari88/svelte-radar 사이트를 여기를 참고 해 줘.

### 개발 환경 구성
[contributing](svelte-radar/CONTRIBUTING.md) 파일을 참고 해서 개발 환경을 구성 해 줘

## 목표

- Next.js App Router 프로젝트의 복잡한 라우팅 구조를 직관적으로 시각화
- 개발자가 빠르고 효율적으로 라우트 파일을 탐색할 수 있도록 지원
- Next.js 13+ App Router의 모든 라우팅 패턴과 컨벤션 지원

## 대상 사용자

- Next.js App Router를 사용하는 프론트엔드 개발자
- 대규모 Next.js 프로젝트를 관리하는 팀
- Next.js 프로젝트 구조를 빠르게 이해해야 하는 개발자

## 핵심 기능

### 1. App Router 파일 감지 및 분류

**자동 감지 파일 유형:**
- `page.tsx/js` - 페이지 컴포넌트
- `layout.tsx/js` - 레이아웃 컴포넌트  
- `loading.tsx/js` - 로딩 UI
- `error.tsx/js` - 에러 페이지
- `not-found.tsx/js` - 404 페이지
- `route.ts/js` - API 라우트
- `template.tsx/js` - 템플릿 컴포넌트
- `default.tsx/js` - 기본 페이지 (병렬 라우트)
- `global-error.tsx/js` - 전역 에러 핸들러

### 2. 라우팅 패턴 지원

**지원할 Next.js App Router 패턴:**
- 정적 라우트 (`/about`, `/contact`)
- 동적 세그먼트 (`[id]`, `[slug]`)
- 동적 세그먼트 캐치올 (`[...slug]`)  
- 선택적 동적 세그먼트 캐치올 (`[[...slug]]`)
- 병렬 라우트 (`@auth`, `@dashboard`)
- 인터셉팅 라우트 (`(..)`, `(...)`, `(....)`
- 라우트 그룹 (`(marketing)`, `(auth)`)

### 3. 시각화 뷰

**계층적 뷰 (Hierarchical View):**
- 실제 폴더 구조를 반영한 트리 뷰
- 라우트 그룹과 병렬/인터셉팅 라우트 시각화
- 폴더별 확장/축소 기능

**플랫 뷰 (Flat View):**  
- 모든 라우트를 플랫하게 나열
- URL 경로 기준 정렬
- 검색 및 필터링 기능

### 4. 페이지 콘텐츠 네비게이터

**컴포넌트 분석:**
- 페이지/레이아웃 파일 내 컴포넌트 자동 감지
- 섹션 마커 지원 (`// @nr My Section`)
- 컴포넌트 정의로 바로 이동 기능

### 5. 스마트 네비게이션

**URL 기반 라우트 열기:**
- 실제 URL에서 해당하는 파일로 이동
- 동적 라우트 매칭 지원
- 브라우저에서 미리보기 기능

### 6. 검색 및 필터링

- 라우트 경로 검색
- 파일 유형별 필터링  
- 빠른 검색 단축키

## 기술 스펙

### 개발 환경
- **언어:** TypeScript
- **플랫폼:** VS Code Extension
- **빌드 도구:** esbuild
- **테스트:** Mocha + VS Code Test Suite
- **패키지 관리:** npm

### 주요 의존성
- `@types/vscode` - VS Code API 타입
- `glob` - 파일 패턴 매칭
- `path` - 경로 조작 유틸리티

### 확장 구조
```
src/
├── extension.ts              # 확장 진입점
├── constants/
│   ├── types.ts             # 타입 정의
│   └── patterns.ts          # Next.js 라우팅 패턴
├── models/
│   ├── routeItem.ts         # 라우트 아이템 모델
│   └── pageContentItem.ts   # 페이지 콘텐츠 모델
├── providers/
│   ├── routesProvider.ts    # 라우트 트리 제공자
│   └── pageContentProvider.ts # 페이지 콘텐츠 제공자
├── utils/
│   ├── routeUtils.ts        # 라우트 유틸리티
│   ├── fileUtils.ts         # 파일 유틸리티
│   └── urlUtils.ts          # URL 처리 유틸리티
└── test/
    └── **/*.test.ts         # 테스트 파일
```

## 활성화 조건

확장이 다음 조건에서 자동 활성화:
- `next.config.js` 파일 존재
- `package.json`의 dependencies에 `next` 포함  
- `src/app` 또는 `app` 디렉토리 존재

## 구성 옵션

### Workspace 설정 (`.vscode/nextjs-radar.json`)
```json
{
  "projectRoot": "./",           // 프로젝트 루트 (모노레포 지원)
  "appDirectory": "src/app",     // App Router 디렉토리
  "port": 3000,                  // 개발 서버 포트
  "enablePageContentView": true, // 페이지 콘텐츠 뷰 활성화
  "excludePatterns": [           // 제외할 패턴
    "**/node_modules/**",
    "**/.next/**"
  ]
}
```

### Extension 설정
```json
{
  "nextjsRadar.viewType": "hierarchical",    // 기본 뷰 타입
  "nextjsRadar.sortingType": "natural",      // 정렬 방식
  "nextjsRadar.showFileExtensions": false,   // 파일 확장자 표시
  "nextjsRadar.groupByType": true            // 파일 타입별 그룹화
}
```

## UI/UX 디자인

### Activity Bar 아이콘
- 레이더 스타일의 아이콘 (Next.js 색상 적용)
- "Next.js Radar" 타이틀

### 사이드바 뷰
1. **Routes View**: 전체 라우트 구조
2. **Page Content View**: 현재 파일의 콘텐츠 네비게이션

### 아이콘 체계
- 📄 page.tsx - 페이지
- 🔧 layout.tsx - 레이아웃  
- ⏳ loading.tsx - 로딩
- ❌ error.tsx - 에러
- 🔍 not-found.tsx - 404
- 🌐 route.ts - API
- 📋 template.tsx - 템플릿
- 🔗 default.tsx - 기본 페이지
- 🚨 global-error.tsx - 전역 에러
- 📁 (group) - 라우트 그룹
- ⚡ @parallel - 병렬 라우트
- 🔄 (..)intercept - 인터셉팅 라우트

## 성능 고려사항

### 최적화 전략
- 파일 변경 감지 시에만 라우트 트리 재구성
- 가상 스크롤링 (대규모 프로젝트 지원)
- 지연 로딩으로 초기 로딩 시간 단축
- 메모이제이션을 통한 중복 계산 방지

### 메모리 관리
- 사용하지 않는 파일 감시자 정리
- 트리 노드 재사용
- 효율적인 상태 관리

## 테스트 계획

### 유닛 테스트
- 라우트 패턴 매칭 테스트
- URL-파일 매핑 테스트  
- 파일 감지 로직 테스트

### 통합 테스트
- VS Code Extension 환경 테스트
- 다양한 Next.js 프로젝트 구조 테스트
- 성능 테스트 (대규모 프로젝트)

## 호환성

### Next.js 버전
- Next.js 13+ (App Router 지원 버전)
- Next.js 14, 15 완전 지원

### VS Code 버전
- VS Code 1.60.0 이상

## 릴리즈 계획

### Phase 1 (MVP)
- 기본 라우트 감지 및 표시
- 계층적/플랫 뷰
- 기본 네비게이션 기능

### Phase 2 (Enhanced)
- 페이지 콘텐츠 네비게이터
- URL 기반 라우트 열기
- 고급 검색/필터링

### Phase 3 (Advanced)  
- 병렬/인터셉팅 라우트 완전 지원
- 성능 최적화
- 추가 구성 옵션

## 마케팅 및 배포

### VS Code Marketplace
- 확장명: `nextjs-radar`
- 퍼블리셔: 개발자 계정
- 카테고리: Programming Languages, Visualization
- 키워드: nextjs, app-router, routes, navigation, developer-tools

### 문서화
- README.md with GIF demos
- CHANGELOG.md
- 사용법 가이드
- 기여 가이드라인

## 성공 지표

- VS Code Marketplace 다운로드 수
- 사용자 평점 및 리뷰
- GitHub Stars 및 이슈
- 커뮤니티 피드백 및 기여

---

이 PRD는 Next.js Radar 확장의 개발 가이드라인과 요구사항을 정의하며, Svelte Radar의 검증된 아키텍처를 기반으로 Next.js App Router의 독특한 특성을 완벽히 지원하는 것을 목표로 합니다.