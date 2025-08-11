# Next.js Radar Sample Project

이 샘플 프로젝트는 Next.js Radar 확장 프로그램의 기능을 테스트하기 위해 만들어졌습니다.

## 🚀 사용 방법

### 1. 확장 프로그램 디버깅 실행

1. VS Code에서 이 프로젝트(nextjs-radar)를 엽니다
2. `F5` 키를 누르거나 **Run and Debug** 뷰에서 "Run Extension"을 선택합니다
3. 새로운 VS Code Extension Development Host 창이 열립니다
4. 샘플 프로젝트(`samples/nextjs-sample`)가 자동으로 로드됩니다

### 2. Next.js Radar 패널 확인

Extension Development Host에서:
1. **Explorer** 패널(또는 Activity Bar)에서 **Next.js Radar** 아이콘을 찾습니다
2. **Next.js Routes** 트리뷰를 확인합니다
3. **Page Content** 트리뷰를 확인합니다

## 📁 샘플 프로젝트 구조

이 샘플에는 다음과 같은 Next.js App Router 패턴들이 포함되어 있습니다:

### 정적 라우트
- `/` - 홈페이지 (src/app/page.tsx)
- `/about` - 정적 About 페이지

### 동적 라우트  
- `/blog/[slug]` - 블로그 포스트 (동적 세그먼트)
- `/docs/[...slug]` - 문서 (catch-all 라우트)

### 라우트 그룹
- `(marketing)/products` - 마케팅 라우트 그룹

### 병렬 라우트
- `/dashboard` - 메인 대시보드
- `/dashboard/@analytics` - 분석 병렬 라우트
- `/dashboard/@team` - 팀 병렬 라우트

### API 라우트
- `/api/users` - 사용자 목록 API
- `/api/users/[id]` - 특정 사용자 API

### 특수 파일들
- `layout.tsx` - 레이아웃 컴포넌트
- `loading.tsx` - 로딩 UI
- `error.tsx` - 에러 페이지
- `not-found.tsx` - 404 페이지

## 🧪 테스트할 기능들

### 1. 라우트 트리 확인
- 계층적(hierarchical) 뷰와 플랫(flat) 뷰 전환
- 자연스러운 정렬과 기본 정렬 전환
- 라우트 검색 기능

### 2. 컨텍스트 메뉴
- 라우트 우클릭 → "Open in Browser"
- 라우트 우클릭 → "Copy Path" 

### 3. 명령 팔레트 (Ctrl/Cmd + Shift + P)
- `Next.js Radar: Search Routes`
- `Next.js Radar: Refresh Routes`
- `Next.js Radar: Toggle View Type`
- `Next.js Radar: Toggle Sorting Type`

### 4. 페이지 내용 뷰
- TypeScript/React 파일을 열었을 때 함수, 컴포넌트 등이 표시되는지 확인

## 🔧 설정 파일

샘플 프로젝트에는 `.vscode/nextjs-radar.json` 설정 파일이 포함되어 있습니다:

```json
{
  "projectRoot": "./",
  "appDirectory": "src/app",
  "port": 3000,
  "enablePageContentView": true,
  "excludePatterns": [
    "**/node_modules/**",
    "**/.next/**",
    "**/.git/**"
  ],
  "viewType": "hierarchical",
  "sortingType": "natural",
  "showFileExtensions": false,
  "groupByType": true
}
```

## 🐛 디버깅

확장 프로그램의 로그는 Extension Development Host의 **Developer Console**에서 확인할 수 있습니다:
- `Cmd/Ctrl + Shift + I`로 개발자 도구 열기
- Console 탭에서 "Next.js Radar" 관련 로그 확인

## 📝 예상 결과

정상적으로 작동한다면:
1. Next.js Radar 패널이 Activity Bar에 표시됩니다
2. Routes 트리에 모든 라우트가 계층적으로 표시됩니다
3. 각 라우트에 적절한 아이콘과 설명이 표시됩니다
4. 파일 변경시 자동으로 트리가 업데이트됩니다