# 스타일 로드 순서

`src/index.css`에서 아래 순서로 합쳐집니다 (캐스케이드 유지).

1. **base.css** — `:root`, 전역 타이포, 공통 애니메이션(`.animate-fade-up` 등)
2. **landing.css** — 랜딩(히어로, 요금, FAQ, 푸터 …)
3. **auth.css** — 로그인/회원가입 온보딩 UI
4. **editor-and-modals.css** — 에디터(`itda-*`), 모바일, 피드백/다운로드 모달 등

랜딩만 수정할 때는 주로 `landing.css`를 보면 됩니다.
