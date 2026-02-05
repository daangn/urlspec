# URLSpec - Claude Code Guide

## 최근 주요 변경사항

### ✨ 새로운 기능
- **Endpoint 선언**: 파일 레벨에서 `endpoint` 키워드로 API 엔드포인트 설정 가능
- **주석 지원**: `//` 형태의 한 줄 주석 완전 지원 (파일 어디서나 사용 가능)
- **Path에 하이픈 지원**: URL 경로에 하이픈 포함 가능 (`/api/list-items`, `/user-profile`)
- **테스트 픽스처 구조화**: 30개 이상의 `.urlspec` 픽스처 파일로 테스트 관리

### 🔧 네이밍 규칙 변경
- **Namespace 제거**: 파일 레벨 namespace 선언이 제거되었습니다
- **Page 이름**: camelCase만 허용 (`detail_view` → `detailView`)
- **ParamType 이름**: camelCase만 허용 (`sort_order` → `sortOrder`)
- **Parameter 이름**: ✨ 네이밍 제약 제거! 이제 snake_case, camelCase, PascalCase 모두 허용
  - `job_id` (snake_case)
  - `userId` (camelCase)
  - `MyParam` (PascalCase)
  - 모두 사용 가능합니다!

### 📁 환경별 Endpoint 관리
파일 단위로 endpoint를 선언하므로, 환경별로 다른 파일 사용을 권장:
- `jobs.dev.urlspec`, `jobs.staging.urlspec`, `jobs.prod.urlspec`

---

## 프로젝트 개요

URLSpec은 웹 애플리케이션의 URL 구조를 타입 안전하게 정의하고 문서화하기 위한 DSL(Domain-Specific Language)입니다. URL 문자열을 하드코딩하는 대신, 선언적으로 URL 아키텍처를 정의하여 타입 안전성과 유지보수성을 제공합니다.

### 해결하는 문제
- 타입 오류와 URL 파라미터 오타로 인한 런타임 에러 방지
- 쿼리 파라미터와 경로 세그먼트에 대한 타입 체킹 제공
- URL 구조에 대한 단일 진실 공급원(Single Source of Truth) 제공
- 대규모 코드베이스에서 URL 변경 시 리팩토링 용이성 향상

## 아키텍처

이 프로젝트는 Yarn Workspaces를 사용하는 모노레포 구조입니다.

```
urlspec/
├── packages/
│   ├── language/                 # 핵심 언어 구현 (Langium 기반)
│   ├── builder/                  # 프로그래매틱 API
│   └── urlspec-vscode-extension/ # VS Code 확장
└── examples/                     # 예제 파일
```

### 패키지별 역할

#### 1. @urlspec/language
**핵심 언어 구현 패키지**

- **주요 기술**: Langium 4.1.3 (언어 프레임워크)
- **책임**: URLSpec 문법의 파싱, 검증, 리졸빙
- **핵심 파일**:
  - `src/urlspec.langium` - 언어 문법 정의
  - `src/parser.ts` - 파서 진입점
  - `src/resolver.ts` - AST를 사용자 친화적 타입으로 변환
  - `src/validator.ts` - 커스텀 검증 규칙
  - `src/printer.ts` - AST를 `.urlspec` 포맷으로 출력
  - `src/ast-builder.ts` - AST 노드를 프로그래매틱하게 생성

**작업 시 참고사항**:
- 문법 변경 시 `yarn langium:generate`로 파서 재생성 필요
- `src/__generated__/` 디렉토리는 자동 생성되므로 직접 수정 금지
- 새로운 검증 규칙은 `validator.ts`의 `URLSpecValidator` 클래스에 추가

#### 2. @urlspec/builder
**프로그래매틱 API 패키지**

- **책임**: 코드로 URLSpec 문서를 생성할 수 있는 빌더 API 제공
- **핵심 파일**:
  - `src/index.ts` - `URLSpec` 클래스와 빌더 API
- **주요 메서드**:
  - `setEndpoint(url)` - endpoint 설정 (선택적)
  - `addParamType(name, type)` - param type 추가 (camelCase)
  - `addGlobalParam(param)` - global parameter 추가 (네이밍 제약 없음)
  - `addPage(page)` - page 추가 (camelCase 이름, 파라미터는 네이밍 제약 없음)
  - `toString()` - .urlspec 형식 문자열로 변환
  - `writeFile(path)` - 파일로 저장

**작업 시 참고사항**:
- 파일 경로 보안 검증 로직이 포함되어 있음 (경로 탐색 공격 방지)
- `@urlspec/language`에 의존하여 AST 생성 및 프린팅 수행

#### 3. urlspec-vscode-extension
**VS Code 통합 패키지**

- **책임**: IDE 지원 (문법 강조, 검증, 언어 서버)
- **핵심 파일**:
  - `src/extension.ts` - 확장 진입점
  - `src/language-server.ts` - 언어 서버 구현
  - `syntaxes/urlspec.tmLanguage.json` - TextMate 문법

**작업 시 참고사항**:
- 개발 시 `yarn watch` 사용
- 확장 테스트 시 F5로 Extension Development Host 실행

## 개발 워크플로우

### 초기 설정

```bash
# 의존성 설치
yarn install

# 전체 빌드 (패키지 의존성 순서대로)
yarn build
```

### 개발 사이클

**언어 문법 수정 시**:
```bash
cd packages/language
# 1. urlspec.langium 파일 수정
# 2. 파서 재생성
yarn langium:generate
# 3. 테스트 실행
yarn test
```

**빌더 API 수정 시**:
```bash
cd packages/builder
yarn test:watch  # 테스트 감시 모드
```

**VS Code 확장 개발 시**:
```bash
cd packages/urlspec-vscode-extension
yarn watch  # 변경사항 감시
# VS Code에서 F5 눌러 Extension Development Host 실행
```

### 코드 품질

```bash
# 포맷 체크 및 수정 (Biome 사용)
yarn format
```

## 주요 파일 및 디렉토리

### 언어 정의
- `packages/language/src/urlspec.langium` - **가장 중요**: 언어 문법 정의
  - 문법 변경 시 파서/AST 타입이 자동으로 재생성됨
  - ParamTypeDeclaration, GlobalBlock, PageDeclaration 등의 규칙 정의
  - `hidden terminal SL_COMMENT`로 주석(`//`) 지원
  - PATH_SEGMENT_WITH_HYPHEN terminal로 하이픈 포함 경로 지원

### 타입 정의
- `packages/language/src/resolved-types.ts` - 사용자 대면 타입 정의
  - `ResolvedURLSpec`, `ResolvedPage`, `ResolvedParameter` 등
- `packages/language/src/__generated__/ast.ts` - Langium이 생성한 AST 타입

### 핵심 로직
- `packages/language/src/resolver.ts` - AST → 리졸브된 타입 변환
  - 타입 참조 해석
  - 전역 파라미터 병합
  - 주석에서 설명(description) 추출 (// 주석은 `hidden` terminal로 파싱됨)

### 테스트
- `packages/language/test/` - 언어 패키지 테스트
  - `test/fixtures/*.urlspec` - 테스트용 URLSpec 파일들 (30개 이상)
  - `parser.test.ts`, `resolver.test.ts`, `printer.test.ts`, `validation.test.ts`
- `packages/builder/test/` - 빌더 패키지 테스트

## 언어 문법 가이드

### 기본 구조

```urlspec
// 파라미터 타입 정의 (재사용 가능) - camelCase로 작성
param sortOrder = "recent" | "popular";
param jobStatus = "active" | "closed";

// 전역 파라미터 (모든 페이지에 적용) - 네이밍 제약 없음!
global {
  utm_source?: string;  // snake_case
  utmCampaign?: string; // camelCase
  ReferrerID?: string;  // PascalCase - 모두 가능!
}

// 페이지 정의 - 페이지 이름은 camelCase
page list = /api/job-list {  // path에 하이픈 사용 가능!
  sort?: sortOrder;
  category?: string;
}

page detail = /api/v2/job-details/:jobId {  // path에 하이픈, 파라미터는 camelCase
  jobId: string;       // camelCase 파라미터
  preview?: "true" | "false";
}
```

### 타입 시스템

- `string` - 문자열 타입
- `"literal"` - 문자열 리터럴
- `"a" | "b" | "c"` - 유니온 타입
- `paramTypeName` - 타입 참조 (camelCase)

### 환경별 Endpoint 관리

Endpoint 설정은 파일 레벨에서 선언하므로, 환경별로 다른 파일을 사용하는 패턴을 권장합니다:

```
specs/
├── jobs.dev.urlspec      # endpoint "https://dev-api.example.com";
├── jobs.staging.urlspec  # endpoint "https://staging-api.example.com";
└── jobs.prod.urlspec     # endpoint "https://api.example.com";
```

각 파일은 동일한 page 정의를 가지지만 endpoint만 다르게 설정하여 환경별로 사용할 수 있습니다.

### 검증 규칙

1. **Page 이름**: camelCase만 허용 (예: `list`, `detailView`)
2. **ParamType 이름**: camelCase만 허용 (예: `sortOrder`, `jobStatus`)
3. **Parameter 이름**: ✨ 제약 없음! snake_case, camelCase, PascalCase 모두 허용
   - `job_id` (snake_case)
   - `userId` (camelCase)
   - `MyParam` (PascalCase)
4. **Path 세그먼트**: 하이픈 포함 가능 (예: `/api/list-items`, `/user-profile`)
5. **경로 파라미터**: `:param_name` 형태는 반드시 파라미터 블록에 선언되어야 함
6. **문자열 리터럴**: 유니온 타입과 문자열 리터럴은 따옴표로 감싸야 함
7. **주석**: 파일 어디서나 `//` 형태의 한 줄 주석 사용 가능

## 개발 시 주의사항

### 문법 변경 시
1. `urlspec.langium` 파일 수정
2. **반드시** `yarn langium:generate` 실행
3. 생성된 AST 타입에 맞춰 resolver, validator 코드 업데이트
4. 테스트 작성/업데이트

### 타입 안전성
- `packages/language/src/resolved-types.ts`와 `src/__generated__/ast.ts`의 타입이 다름
  - AST 타입: Langium이 생성한 내부 표현
  - Resolved 타입: 사용자 대면 API

### 보안
- `packages/builder`의 파일 쓰기 기능은 경로 검증 포함
- 경로 탐색 공격 방지 로직 유지 필수

### 테스트
- 언어 변경 시 파서, 리졸버, 프린터 테스트 모두 확인
- 빌더 API 변경 시 파일 생성 테스트 확인
- **테스트 픽스처 관리**:
  - `packages/language/test/fixtures/` 디렉토리에 `.urlspec` 파일로 관리
  - 테스트 코드는 `parseFile(fixture("name.urlspec"))` 패턴 사용
  - 인라인 문자열보다 픽스처 파일 사용으로 유지보수성 향상

## 테스트 실행

```bash
# 전체 테스트
yarn test

# 패키지별 테스트
cd packages/language && yarn test
cd packages/builder && yarn test

# 감시 모드
yarn test:watch
```

## 빌드 및 배포

### 로컬 빌드
```bash
# 전체 빌드
yarn build

# 패키지별 빌드
cd packages/language && yarn build
cd packages/builder && yarn build
cd packages/urlspec-vscode-extension && yarn build
```

### 버전 관리
- Changesets 사용 (`@changesets/cli`)
- 변경사항 기록: `yarn changeset`
- 버전 업데이트: `yarn changeset version`

### 배포
- GitHub Actions로 자동 배포 (`.github/workflows/deploy-packages.yml`)
- npm에 `@urlspec/` 네임스페이스로 퍼블리시

## 기술 스택

| 도구 | 용도 | 버전 |
|------|------|------|
| Langium | 언어 프레임워크 | 4.1.3 |
| TypeScript | 프로그래밍 언어 | 5.9.3 |
| Vitest | 테스트 러너 | 3.0.5 |
| Biome | 포매터/린터 | 2.3.11 |
| ultra-runner | 모노레포 태스크 러너 | 3.10.5 |
| tsdown | 번들러 | 0.20.0-beta.3 |
| Yarn | 패키지 매니저 | 4.12.0+ |

## Builder API 예제

```typescript
import { URLSpec } from '@urlspec/builder';

const spec = new URLSpec();

// ParamType 정의 (camelCase)
spec.addParamType('sortOrder', ['recent', 'popular', 'trending']);
spec.addParamType('jobStatus', ['active', 'closed', 'draft']);

// Global 파라미터 추가 (네이밍 제약 없음)
spec.addGlobalParam({
  name: 'utm_source',
  type: 'string',
  optional: true,
});

spec.addGlobalParam({
  name: 'userId',
  type: 'string',
  optional: true,
});

// 페이지 추가 (camelCase 이름, 파라미터는 네이밍 제약 없음)
spec.addPage({
  name: 'list',
  path: '/api/job-list',  // 하이픈 포함 가능
  parameters: [
    { name: 'category', type: 'string', optional: true },
    { name: 'sort', type: 'sortOrder' },
  ],
});

spec.addPage({
  name: 'detail',
  path: '/jobs/:job_id',
  parameters: [
    { name: 'job_id', type: 'string' },
    { name: 'preview', type: ['true', 'false'], optional: true },
  ],
});

// .urlspec 형식으로 출력
console.log(spec.toString());

// 파일로 저장
await spec.writeFile('./output.urlspec');
```

## 디버깅 팁

### 파서 문제 디버깅
```typescript
import { parse } from '@urlspec/language';

const result = await parse(source);
console.log(result.diagnostics); // 검증 에러 확인
console.log(result.value); // AST 출력
```

### 리졸버 문제 디버깅
```typescript
import { resolve } from '@urlspec/language';

const resolved = await resolve(source);
console.log(resolved.pages); // 리졸브된 페이지 구조 확인
```

### VS Code 확장 디버깅
1. `packages/urlspec-vscode-extension`에서 F5 누르기
2. Extension Development Host에서 `.urlspec` 파일 열기
3. Output 패널에서 "URLSpec Language Server" 로그 확인

## 참고 자료

- [Langium 문서](https://langium.org/)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [TextMate Grammar](https://macromates.com/manual/en/language_grammars)

## 라이센스

MIT License
