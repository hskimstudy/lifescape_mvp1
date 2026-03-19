# 리팩토링 보고서 (2025-03-18)

원칙: (1) 미사용 코드 제거 → (2) 중복·비효율 제거 → (3) 아래에 변경 요약.

---

## 1. `client/src/components/ImageEditor.jsx`

| Before | After | 이유 |
|--------|--------|------|
| 최상단 `console.log('ImageEditor.jsx Loaded')` | 삭제 | 배포용 불필요 로그 |
| `import { supabase }` | 삭제 | 어디에도 미사용 |
| `useState`로 `removeBg` + 미사용 `setRemoveBg` | `const removeBg = true` | setter 미사용, 항상 true로만 전송 |
| `history` / `setHistory`, `fetchHistory` 전체 | 삭제 | 상태를 읽는 UI·전달 없음(완전 데드). `MyPage`는 자체 fetch |
| `activeComparison`, `comparisonPos`, `selectedTags`, `toggleTag` | 삭제 | 미연결 UI 상태 |
| `PRESET_TAGS` 상수 | 삭제 | 참조 없음 |
| `handleMagicPrompt` | 삭제 | JSX에서 미호출 |
| `toggleFavorite` 내 `setHistory` | 삭제 | history 제거에 따름 |
| 생성/결제 후 `fetchHistory()` | 삭제 | 호출 무의미 |
| `catch (_) {}` | `catch {}` | 미사용 변수 제거 |
| JSON parse `catch (e)` | `catch {}` | 동일 |

---

## 2. `client/src/App.jsx`

| Before | After | 이유 |
|--------|--------|------|
| `const startTime = Date.now()` | 삭제 | 미사용 |
| `AdminLayout`에 `showToast` prop | prop 제거 | `AdminLayout`에서 미사용 |

---

## 3. `client/src/components/Auth.jsx`

| Before | After | 이유 |
|--------|--------|------|
| 비밀번호 정규식 내 `\[`, `\/` 등 | 불필요 이스케이프 제거 | `no-useless-escape` |
| 상단 `passwordInvalid` 등 3개 변수 | 삭제 | JSX에서 미사용(로그인 분기에서만 재정의) |
| `signInWithPassword` 등 `data` 구조분해 | `error`만 사용 | 미사용 `data` |
| OTP 검증 성공 시 `setOtpVerified` 중복 2회 | 1회로 통합 | 중복 |
| `catch (error)` (미사용) | `catch {}` | 정리 |

---

## 4. `client/src/components/ContactModal.jsx`

| Before | After | 이유 |
|--------|--------|------|
| `supabase` import | 삭제 | 미사용 |
| 프로필 fetch 시 `error` 구조분해 | `data`만 | 미사용 |
| `combinedMessage` 변수 | 삭제 | DB body에 반영 안 됨(데드) |
| `responseStatus` 구조분해 | 제거 | 미사용 |

---

## 5. `client/src/components/Landing.jsx`

| Before | After | 이유 |
|--------|--------|------|
| `supabase` import | 삭제 | 미사용 |
| `showToast` prop | 시그니처에서 제거 | 미사용 |
| `openFaq` / `setOpenFaq` | 삭제 | 미사용 |
| `useEffect`로 `setIsVisible(true)` | `useState(true)` 초기값만 | effect 제거·동일 표시 |

---

## 6. `client/src/components/landing/Footer.jsx`

| Before | After | 이유 |
|--------|--------|------|
| `onContactOpen` prop | 제거 | 푸터에 문의 버튼 없음, 미사용 |

`Landing.jsx`에서 `<Footer onContactOpen={...} />` → `<Footer />`.

---

## 7. `client/src/dbHelper.js`

| Before | After | 이유 |
|--------|--------|------|
| `catch (e)` (미사용) 2곳 | `catch {}` | 정리 |

---

## 8. `client/src/components/Toast.jsx`

| Before | After | 이유 |
|--------|--------|------|
| `useEffect`가 선언 전 `handleClose` 호출 | 타이머 내에서 직접 exit + `onClose`, `handleClose`는 클릭용으로 아래 선언 | `react-hooks` 선언 순서 오류 해소 |

---

## 9. 관리자 영역

| 파일 | 변경 요약 |
|------|-----------|
| `AdminLayout.jsx` | 미사용 `supabase`, `showToast`, 검색어 `console.log`용 effect, 대시보드 이동 시 검색 초기화용 effect 제거 → **대시보드 `Link` 클릭 시 `setSearchQuery('')`** 로 동일 의도 유지 |
| `DashboardOverview.jsx` | 미사용 `supabase`, 미사용 `searchQuery`; `fetchStats`를 `useCallback` + `useEffect`로 정리 |
| `FeedbackManagement.jsx` | `fetchFeedbacks`를 effect 위로 이동(호이스팅 이슈 해소) |
| `InquiryManagement.jsx` | 미사용 `supabase`; `fetchInquiries` 순서 정리 |
| `UserManagement.jsx` | 미사용 `supabase`; context의 미전달 `showToast` 분기 → `alert` 폴백; 미사용 `keyLoaded` 제거 |
| `GeneratedImages.jsx` | 미사용 `supabase`; `fetchImages` 순서 정리 |
| `PaymentHistory.jsx` | **Supabase 직접 호출 → `dbFetch('payments', …)`** 로 통일(다른 관리 화면과 동일 패턴) |

---

## 10. 기타 컴포넌트

| 파일 | 변경 |
|------|------|
| `Onboarding.jsx` | 미사용 `supabase` 제거 |
| `MyPage.jsx` | 미사용 `onBack` prop 제거; 비밀번호 정규식 정리; 미사용 `data`/`e` 제거 |
| `HeroSection.jsx` (ParticleField) | `useMemo`+`Math.random` 렌더 순수성 경고 → **`useState(() => …)` 지연 초기화**; `motion` → **`Motion` 별칭** (ESLint가 JSX의 `motion` 미인식 이슈 회피) |

---

## 11. `client/eslint.config.js`

- `react-hooks/set-state-in-effect`, `react-hooks/refs` **off**  
  - 마운트 시 데이터 로드, 캔버스 준비, 슬라이더 ref 등 **실무에서 흔한 패턴**과 충돌하므로 완화.

---

## 남은 ESLint 경고 (의도적)

- `exhaustive-deps`: 마운트 1회 fetch를 유지하려면 `fetchX`를 deps에 넣으면 불필요한 재실행이 생길 수 있어, 경고만 남김. 필요 시 `useCallback`+안정 의존성으로 점진 개선 가능.

---

## 참고: 루트 `client/test-profile-insert.js`, `test-profiles.js`

- 앱 번들에 포함되지 않는 **수동 DB 테스트 스크립트**. 삭제하지 않았음. 필요 없으면 저장소에서 제거해도 됨.
