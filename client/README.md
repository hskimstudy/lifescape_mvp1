<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# 라이프스케이프 MVP1 클라이언트 — 랜딩 변경 사항 보고

선임 개발자 분이 넘겨주신 기준부터 적용한 **랜딩 페이지 수정 사항** 요약입니다.

---

## 1. 변경 사항 요약

### 1) 완전히 다른 결과 슬라이더 (FeaturesSection)

- **실제 이미지 연동**  
  - Before/After 플레이스홀더 제거 후 실제 이미지 사용  
  - 타사: `public/assets/slider-before_1.png`  
  - 잇다: `public/assets/slider-after.png`  
  - 권장 해상도: 1920×1200 (16:10)

- **경계선(슬라이더 핸들) 기본 위치**  
  - 초기값 50% → **33%** (왼쪽 1/3, 오른쪽 2/3)로 변경

- **라벨 문구 및 위치**  
  - "일반 AI 서비스" → **"타 회사"** 로 변경  
  - 두 라벨 모두 **사진 바깥 위**에 배치  
  - "타 회사": 사진 가로 **1/3 구간의 중앙** 위  
  - "잇다": 사진 가로 **2/3 구간의 중앙** 위  
  - 구현: 절대 위치 + `left: 16.666%` / `66.666%`, `transform: translateX(-50%)`

- **돋보기(마그니파이어) 기능**  
  - 슬라이더 위에 마우스를 올리면 **커서 위치만** 확대되는 원형 렌즈 표시  
  - 배율 1.4배, 렌즈 크기 140px  
  - **경계선(핸들) 근처 28px 이내**에서는 렌즈 미표시  
  - 드래그 중에는 렌즈 미표시  
  - 슬라이더/렌즈에 배경·user-select 등 적용해 드래그 시 파란 하이라이트 방지

- **하단 3개 포인트 문구 위치**  
  - 캡션을 사진 위로 옮기면서 줄어든 여백 복구  
  - `.itda-why-points`에 `margin-top: 100px` 적용해 원래 높이 유지

### 2) 히어로 캐러셀 (HeroSection)

- **프리셋 이름 표시**  
  - 각 캐러셀 이미지 **상단**에 프리셋 이름 오버레이  
  - 1. 심플 드레스룸  
  - 2. 서재 분위기  
  - 3. 실사같은 모델 활용  
  - 4. 블랙&화이트  
  - 5. 내츄럴 우드  
  - 6. 인스타 감성  
  - 스타일: 상단 배치, 반투명 배경 `rgba(0,0,0,0.35)` (그라데이션 제거)

### 3) FAQ

- **항목 1개 추가**  
  - `FAQ_DATA`에 id 3 항목 추가 (질문/답변 placeholder)  
  - 기존 3개와 동일한 흰색 아코디언 박스로 표시

### 4) 기타

- **삭제**  
  - FAQ 아래에 추가했던 별도 섹션(ExtraSection) 컴포넌트 및 관련 코드 제거  
  - `ExtraSection.jsx` 삭제, `Landing.jsx`에서 import/사용 제거, 관련 CSS 제거

---

## 2. 수정·추가·삭제된 파일 목록

| 구분 | 파일 경로 |
|------|-----------|
| **수정** | `src/index.css` |
| **수정** | `src/components/landing/FeaturesSection.jsx` |
| **수정** | `src/components/landing/HeroSection.jsx` |
| **수정** | `src/components/landing/constants.js` |
| **수정** | `src/components/Landing.jsx` (ExtraSection 제거 시점에만 수정, 현재는 반영 완료) |
| **삭제** | `src/components/landing/ExtraSection.jsx` (생성 후 삭제) |

---

## 3. 파일별 변경 내용 요약

- **`src/index.css`**  
  - 슬라이더 캡션: 위 배치, 1/3·2/3 중앙 정렬용 스타일  
  - 돋보기 렌즈: `.itda-why-magnifier-lens`, `.itda-why-magnifier-inner` (배경, 테두리, 드래그 시 파란색 방지 등)  
  - 슬라이더: `cursor: none`, `-webkit-tap-highlight-color` 등  
  - `.itda-why-points` 상단 여백 100px  
  - 히어로 캐러셀: `.hero-carousel-preset-label` (상단, 반투명 배경)  
  - FAQ 아래 ExtraSection 관련 스타일 제거  

- **`src/components/landing/FeaturesSection.jsx`**  
  - 슬라이더 기본 position 33, 이미지 `img` 연동, 캡션 "타 회사" / "잇다"  
  - 마우스 위치 state, 렌즈 표시/숨김(경계선 근처·드래그 시), 돋보기 렌즈 렌더링  

- **`src/components/landing/HeroSection.jsx`**  
  - `PRESET_NAMES` 상수, 이미지 객체에 `preset` 필드, 카드에 `.hero-carousel-preset-label` 표시  

- **`src/components/landing/constants.js`**  
  - `FAQ_DATA`에 id 3 항목 추가 (placeholder 질문/답변)  

- **`src/components/Landing.jsx`**  
  - ExtraSection import 및 사용 제거  

- **`src/components/landing/ExtraSection.jsx`**  
  - 파일 삭제 (FAQ 아래 별도 섹션 제거에 따라)

---

위 내용은 선임 개발자 분이 넘겨주신 코드를 기준으로, 이후 적용한 랜딩 관련 수정만 정리한 것입니다.
>>>>>>> jxxhwan/feature/landing-updates
