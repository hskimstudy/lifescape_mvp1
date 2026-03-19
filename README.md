# lifescape_mvp1

lifescape mvp_frontend_only

---

## 문서 목차

| 문서 | 설명 |
|------|------|
| **아래 § 1차 리팩토링** | 코드 정리 1차 — 큰 기준 요약 |
| [docs/REFACTORING-2025-03-18.md](docs/REFACTORING-2025-03-18.md) | 파일별 Before/After·이유 상세 |

### Git 브랜치

| 브랜치 | 설명 |
|--------|------|
| **`first_refactoring`** | 1차 리팩토링 커밋이 푸시된 브랜치 (`origin/first_refactoring`) |
| **`second_refactoring`** | 2차 — `ImageEditor` 상수 분리 등 (`origin/second_refactoring`) |
| **`third_refactoring`** | 3차 — 랜딩/메인 CSS·JSX 대규모 분할·모듈화 (`origin/third_refactoring`) |

---

## 3차 리팩토링 (`third_refactoring`)

**목표:** 어드민·결제 로직은 유지, **랜딩·메인 UI 관련 JSX/CSS**만 대규모 정리. 기능·화면 동작 유지, 빌드 통과.

| 항목 | 내용 |
|------|------|
| **CSS 분할** | `client/src/styles/` — `base.css`, `landing.css`, `auth.css`, `editor-and-modals.css`. `index.css`는 폰트·위 파일 `@import`만. 분할 스크립트: `client/scripts/split-css.mjs`. 상세: `client/src/styles/README.md`. |
| **랜딩 JSX** | `landing/index.js` 배럴 export. 히어로 서브컴포넌트(`hero/`), `FeaturesComparisonSlider` 등 분리. **미사용** `StepsSection`, `ImageUpload`, `BackgroundSelector`, `ResultPreview` 제거. |
| **Windows 빌드** | `Landing.jsx`는 `./landing`이 `Landing.jsx`와 충돌할 수 있어 **`from './landing/index.js'`** 로 명시 import. |
| **레거시 정리** | `index.css` 미사용 블록 삭제, Qwen Colab·지출품의서·`qwen_pipeline_source.py` 제거 (2차 문서와 동일). |

---

## 2차 리팩토링

**목표:** 기능·UI 변화 없음 + 유지보수 용이.

### 완료된 단계

| 단계 | 내용 |
|------|------|
| **2-1** | `ImageEditor` 내 프리셋·프롬프트·하이라이트 키워드·`getHighlightRanges`를 **`client/src/components/imageEditor/constants.js`**로 분리. 에디터는 import만 사용 — **동작 동일**, 빌드 통과. |

### 예정 (이후 단계)

- 커스텀 훅 분리(크레딧/생성/결제 등), 모달·결과 영역 서브컴포넌트 분리 등 — 단계마다 빌드·수동 스모크 권장.

### 정리 (레거시 CSS · 불필요 스크립트)

- **`index.css`**: 예전 프리미엄 단일 페이지용으로 남아 있던 **JSX에서 전혀 쓰이지 않는 블록(~1476줄) 삭제**. 랜딩·히어로·에디터(`itda-*`) 스타일은 유지. (크레딧/결제/어드민 전용 로직은 건드리지 않음.)
- **삭제한 파일**
  - `generate_expense_report.py` (지출품의서 docx 생성)
  - `colab_qwen_*.py` (Qwen Colab 실험 3개)
  - `server/qwen_pipeline_source.py` (런타임에서 import되지 않던 사본)

---

## 1차 리팩토링 (Keep 적용 기준)

**일자:** 2025-03-18  
**방향:** 미사용 코드 제거 → 중복·비효율 정리 → ESLint/빌드 통과 유지.

### 목차 — 큰 기준으로 바꾼 내용

1. **에디터·메인 플로우 (`ImageEditor`, `App` 등)**  
   - 로드용 로그·미사용 import 제거  
   - **히스토리 state / `fetchHistory` 전체 제거** (UI·자식에 미사용이던 데드 코드)  
   - 미연결 비교·태그 state, 미호출 `handleMagicPrompt`, 상수 `PRESET_TAGS` 제거  
   - `removeBg`는 항상 true만 쓰이도록 단순화  

2. **인증·온보딩·랜딩 (`Auth`, `ContactModal`, `Landing`, `Footer`, `Onboarding`)**  
   - 미사용 변수·import·props 정리  
   - `Landing` 가시성: `useEffect` 대신 초기 state로 동일 동작 유지  
   - `Footer` 미사용 `onContactOpen` 제거  

3. **공통 유틸 (`dbHelper`)**  
   - 미사용 `catch` 파라미터 정리  

4. **토스트 (`Toast`)**  
   - 자동 닫힘 타이머가 선언 전 함수를 참조하던 구조를 **effect 내부에서 직접 처리**하도록 수정  

5. **마이페이지 (`MyPage`)**  
   - 미사용 prop·정규식 이스케이프·미사용 구조분해 정리  

6. **관리자 (`AdminLayout`, 대시보드·문의·피드백·유저·이미지·결제)**  
   - 미사용 Supabase import·디버그용 effect 제거  
   - 대시보드 이동 시 검색어 초기화: **effect → 대시보드 링크 `onClick`**  
   - **`PaymentHistory`**: Supabase 직접 조회 → **`dbFetch`로 통일** (다른 관리 화면과 동일 패턴)  
   - 데이터 fetch 함수 선언 순서 정리(마운트 effect와의 호이스팅 이슈 완화)  

7. **랜딩 히어로 (`HeroSection`)**  
   - 파티클: `useMemo`+`Math.random` → **`useState` 지연 초기화** (렌더 순수성)  
   - Framer `motion` → **`Motion` 별칭** (ESLint가 JSX의 `motion` 미인식 이슈 회피)  

8. **ESLint (`client/eslint.config.js`)**  
   - 마운트 시 fetch·ref 사용 등과 충돌하던 **`set-state-in-effect` / `refs` 규칙 완화**  

9. **상세 보고서**  
   - 위 항목의 파일 단위 내역은 **[docs/REFACTORING-2025-03-18.md](docs/REFACTORING-2025-03-18.md)** 참고  

**범위 참고:** `ImageEditor.jsx`는 줄 수 기준으로는 소폭 감소만(구조 분리·모듈화는 1차에 미포함).  
**남은 ESLint:** `exhaustive-deps` 경고 일부(마운트 1회 fetch 유지 의도).
