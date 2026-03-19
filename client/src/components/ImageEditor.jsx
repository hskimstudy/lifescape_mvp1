import React, { useState, useEffect, useRef } from 'react'
import { dbFetch } from '../dbHelper'
import MyPage from './MyPage'
import ContactModal from './ContactModal'
import CanvasImage from './CanvasImage'
import {
    BACKGROUND_PRESETS,
    STYLE_PRESETS,
    COMMON_PRESET_DETAILS,
    BACKGROUND_SUB_PRESETS,
    PROMPT_HIGHLIGHT_KEYWORDS,
    REF_BACKGROUND_PROMPT,
    getHighlightRanges,
} from './imageEditor/constants'


export default function ImageEditor({ session, onBack, onLogout, showToast }) {
    const [imageFile, setImageFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [styleFile, setStyleFile] = useState(null)
    const [stylePreview, setStylePreview] = useState(null)
    const [isPromptGlow, setIsPromptGlow] = useState(false)
    const [showGenerateCopyrightModal, setShowGenerateCopyrightModal] = useState(false)
    const [generateCopyrightChecked, setGenerateCopyrightChecked] = useState(false)

    const [prompt, setPrompt] = useState('')
    const [selectedStyle, setSelectedStyle] = useState('Original')
    const removeBg = true
    const [objectScale, setObjectScale] = useState(1.0) // Add state
    const [loading, setLoading] = useState(false)
    const [resultImages, setResultImages] = useState([])
    const [credits, setCredits] = useState(0)
    const [viewMode, setViewMode] = useState('workspace') // workspace | mypage
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentModalReason, setPaymentModalReason] = useState('insufficient') // 'insufficient' | 'charge'
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [showContactModal, setShowContactModal] = useState(false)
    const [selectedPreset, setSelectedPreset] = useState(null)
    const [selectedPresetDetailLabel, setSelectedPresetDetailLabel] = useState('')
    const [showPresetDetailModal, setShowPresetDetailModal] = useState(false)
    const [activePresetForDetail, setActivePresetForDetail] = useState(null)
    const [editorStep, setEditorStep] = useState('input') // input | result
    const [zoomedImage, setZoomedImage] = useState(null)
    const [selectedResults, setSelectedResults] = useState([]) // Indices of selected images
    const [isProtected, setIsProtected] = useState(false)
    const [userPlan, setUserPlan] = useState('free') // free | pro
    const [useHD, setUseHD] = useState(false) // HD resolution toggle
    const [isHdShake, setIsHdShake] = useState(false)
    const [showHdTooltip, setShowHdTooltip] = useState(false)
    const isProtectedRef = React.useRef(false)
    const promptGlowTimeoutRef = useRef(null)
    const promptHighlightOverlayRef = useRef(null)
    const [promptHighlightMode, setPromptHighlightMode] = useState(null) // null | 'props' | 'wallfloor' | 'lighting' | 'angle' | 'mood'
    const [isDownloading, setIsDownloading] = useState(false)
    const [showDownloadConfirmModal, setShowDownloadConfirmModal] = useState(false)
    const [showRegenerateModal, setShowRegenerateModal] = useState(false)
    const [hideRegenerate30Days, setHideRegenerate30Days] = useState(false)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [generationError, setGenerationError] = useState(null)
    const [fbRating, setFbRating] = useState(5)
    const [fbText, setFbText] = useState('')
    const [fbHideForWeek, setFbHideForWeek] = useState(false)
    const [hideCopyright30Days, setHideCopyright30Days] = useState(false)
    // Backend URL: empty string means requests go through Vite proxy (avoids CORS)
    const backendUrl = import.meta.env.VITE_API_URL || '/api'

    const selectedPresetMeta = BACKGROUND_PRESETS.find(p => p.id === selectedPreset)
    const isAiModelPreset = selectedPreset === 'scandinavian'
    const isCloseupPreset = selectedPreset === 'classic'
    const isRefMode = !!(imageFile && styleFile)
    /** 프리셋 세부 선택 완료 또는 참조 배경 업로드 시에만 소품/벽지 등 퀵 옵션 버튼 표시 */
    const showPromptQuickOptions =
        isRefMode || (!!selectedPreset && !!String(selectedPresetDetailLabel || '').trim())

    useEffect(() => {
        if (!showPromptQuickOptions) setPromptHighlightMode(null)
    }, [showPromptQuickOptions])

    useEffect(() => {
        fetchProfile()

        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen' ||
                (e.metaKey && e.shiftKey && e.key === 's') ||
                (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                updateProtection(true);
            }
        };

        const updateProtection = (status) => {
            if (isProtectedRef.current !== status) {
                isProtectedRef.current = status;
                setIsProtected(status);
            }
        };

        let rafId;
        const checkVisibility = () => {
            const hasFocus = document.hasFocus();
            const isVisible = document.visibilityState === 'visible' && !document.hidden;

            if (!hasFocus || !isVisible) {
                updateProtection(true);
            } else {
                updateProtection(false);
            }
            rafId = requestAnimationFrame(checkVisibility);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', () => updateProtection(true));
        window.addEventListener('focus', () => updateProtection(false));
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) updateProtection(true);
        });

        rafId = requestAnimationFrame(checkVisibility);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', () => updateProtection(true));
            window.removeEventListener('focus', () => updateProtection(false));
            document.removeEventListener('visibilitychange', () => { });
            cancelAnimationFrame(rafId);
        };
    }, [zoomedImage]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await dbFetch('profiles', {
                select: 'credits,plan',
                filters: { id: session.user.id }
            });
            if (error) {
                console.error('fetchProfile error:', error);
                // Fallback: try without plan column
                const { data: fallbackData } = await dbFetch('profiles', {
                    select: 'credits',
                    filters: { id: session.user.id }
                });
                if (fallbackData && fallbackData.length > 0) {
                    setCredits(fallbackData[0].credits ?? 0);
                }
                return;
            }
            if (data && data.length > 0) {
                setCredits(data[0].credits ?? 0);
                setUserPlan(data[0].plan || 'free');
            }
        } catch (e) {
            console.error('fetchProfile exception:', e);
        }
    }

    const deductCredits = async (amount) => {
        if (!amount || typeof amount !== 'number') return false;

        try {
            // STEP 1: Fetch absolute latest credit count from DB to avoid race conditions
            const { data: profileData, error: fetchError } = await dbFetch('profiles', {
                select: 'credits',
                filters: { id: session.user.id }
            });

            if (fetchError || !profileData || profileData.length === 0) {
                console.error('deductCredits: Failed to fetch latest profile', fetchError);
                return false;
            }

            const currentDbCredits = parseInt(profileData[0].credits) || 0;
            const newVal = Math.max(0, currentDbCredits - amount);

            // STEP 2: Update the DB with the new calculated value
            const { error: patchError } = await dbFetch('profiles', {
                method: 'PATCH',
                filters: { id: session.user.id },
                body: { credits: newVal }
            });

            if (!patchError) {
                // STEP 3: Sync local state with the confirmed DB value
                setCredits(newVal);
                return true;
            } else {
                console.error('deductCredits: PATCH update failed', patchError);
                return false;
            }
        } catch (err) {
            console.error('deductCredits exception:', err);
            return false;
        }
    }


    const handleBaseImageChange = (e) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        setImageFile(file)
        setPreview(URL.createObjectURL(file))
    }

    const notifyUser = (message, type = 'success') => {
        if (showToast) showToast(message, type)
        else if (typeof window !== 'undefined' && window.showToast) window.showToast(message, type)
    }

    const clearStyleImage = () => {
        if (stylePreview && String(stylePreview).startsWith('blob:')) {
            try {
                URL.revokeObjectURL(stylePreview)
            } catch { /* ignore */ }
        }
        setStyleFile(null)
        setStylePreview(null)
        const styleInput = document.getElementById('style-upload')
        if (styleInput) styleInput.value = ''
        setPrompt((p) => (p === REF_BACKGROUND_PROMPT ? '' : p))
    }

    const handleStyleImageChange = (e) => {
        if (!e.target.files?.[0]) return
        const file = e.target.files[0]
        setStyleFile(file)
        setStylePreview(URL.createObjectURL(file))
        e.target.value = ''
        // 기본 가구 + 참조 배경 업로드 시: 프리셋 해제, 참조용 프롬프트 설정, 텍스트란으로 스크롤 + 글로우
        if (imageFile) {
            setSelectedPreset(null)
            setSelectedPresetDetailLabel('')
            setActivePresetForDetail(null)
            setShowPresetDetailModal(false)
            setSelectedStyle('Original')
            setPrompt(REF_BACKGROUND_PROMPT)
            if (promptGlowTimeoutRef.current) clearTimeout(promptGlowTimeoutRef.current)
            setIsPromptGlow(true)
            setTimeout(() => document.getElementById('prompt-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
            promptGlowTimeoutRef.current = setTimeout(() => {
                setIsPromptGlow(false)
                promptGlowTimeoutRef.current = null
            }, 5000)
        }
    }

    const handleGenerate = async () => {
        if (credits < 1) { setPaymentModalReason('insufficient'); return setShowPaymentModal(true); }
        if (!imageFile) {
            notifyUser('변형할 원본 이미지를 업로드해 주세요.', 'error')
            return
        }

        setLoading(true)
        setGenerationError(null)
        setEditorStep('result') // Switch to result view immediately to show loading
        setResultImages([])
        setSelectedResults([]) // Reset selection on new generation

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

        try {
            const formData = new FormData()
            formData.append('file', imageFile)
            if (styleFile) formData.append('style_file', styleFile)
            formData.append('prompt', prompt)
            formData.append('style', (selectedStyle === 'Auto' || selectedStyle === 'Original') ? '' : selectedStyle)
            formData.append('remove_bg', removeBg ? 'true' : 'false')
            formData.append('object_scale', objectScale)
            if (userPlan === 'pro' && useHD) {
                formData.append('resolution', 'hd')
            }

            const response = await fetch(`${backendUrl}/generate`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = `생성 실패 (Status: ${response.status})`;
                const errorText = await response.text();
                try {
                    const err = JSON.parse(errorText);
                    errorMessage = err.detail || errorMessage;
                } catch {
                    if (response.status === 504 || response.status === 502) {
                        errorMessage = "서버 응답 시간이 초과되었습니다 (Gateway Timeout).";
                    } else if (response.status === 500) {
                        errorMessage = "서버 내부 오류가 발생했습니다.";
                    }
                }
                throw new Error(errorMessage);
            }

            let data = await response.json()

            // Handle Asynchronous Polling for Vercel Serverless
            if (data.status === "TaskCreated" && data.polling_url) {
                console.log("Task created, starting polling...");
                let completed = false;
                const pollingUrl = data.polling_url;
                
                // Poll for up to 120 seconds
                for (let i = 0; i < 60; i++) {
                    if (controller.signal.aborted) break;
                    await new Promise(r => setTimeout(r, 2000));
                    
                    try {
                        const statusRes = await fetch(`${backendUrl}/status?polling_url=${encodeURIComponent(pollingUrl)}`, {
                            signal: controller.signal
                        });
                        if (!statusRes.ok) continue;
                        const statusData = await statusRes.json();
                        
                        if (statusData.status === "Ready") {
                            data = statusData;
                            completed = true;
                            break;
                        } else if (statusData.status === "Error" || statusData.status === "Failed") {
                            throw new Error("이미지 생성 작업이 실패했습니다.");
                        }
                    } catch (e) {
                        if (e.name === 'AbortError') throw e;
                        console.warn("Polling error, retrying...", e);
                    }
                }
                if (!completed && !controller.signal.aborted) {
                    throw new Error("이미지 생성 시간이 너무 오래 걸립니다. 잠시 후 마이페이지에서 확인해 보세요.");
                }
            }

            await deductCredits(1)

            const savedItems = []
            for (const url of data.images) {
                const fullUrl = `${backendUrl}${url}`
                const { data: savedArray } = await dbFetch('generations', {
                    method: 'POST',
                    body: {
                        user_id: session.user.id,
                        url: fullUrl,
                        prompt: prompt,
                        style: selectedStyle
                    }
                });
                if (savedArray && savedArray.length > 0) savedItems.push(savedArray[0])
            }

            setResultImages(savedItems)
        } catch (error) {
            console.error(error)
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                setGenerationError("서버 응답 시간 초과 (120초). 생성량이 많아 지연되고 있습니다.");
            } else {
                setGenerationError(error.message);
            }
            setEditorStep('error')
        } finally {
            setLoading(false)
        }
    }

    const toggleFavorite = async (id, currentStatus) => {
        const nextStatus = !currentStatus;

        setResultImages(prev => prev.map(item => item.id === id ? { ...item, is_favorite: nextStatus } : item));

        const { error } = await dbFetch('generations', {
            method: 'PATCH',
            filters: { id: id },
            body: { is_favorite: nextStatus }
        });

        if (error) {
            setResultImages(prev => prev.map(item => item.id === id ? { ...item, is_favorite: currentStatus } : item));
            if (showToast) showToast('오류가 발생했습니다. 다시 시도해 주세요.', 'error');
        }
    }

    const handlePayment = (pack) => {
        const { IMP } = window
        if (!IMP) {
            if (showToast) showToast("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.", 'error');
            else alert("결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        IMP.init('imp46237155') // Merchant ID

        const orderId = `AO09C_${Date.now()}`
        const amount = parseInt(pack.price.replace(/[^0-9]/g, ''))

        IMP.request_pay({
            pg: 'kcp.AO09C',
            pay_method: 'card',
            merchant_uid: orderId,
            name: `${pack.planName || 'Credits'} Plan - ${pack.count} Credits - Lifescape`,
            amount: amount,
            buyer_email: session.user.email,
            m_redirect_url: window.location.origin
        }, async (rsp) => {
            if (rsp.success) {
                try {
                    // Fetch latest credits to avoid race conditions or stale state
                    const { data } = await dbFetch('profiles', { select: 'credits', filters: { id: session.user.id } });
                    const latestCredits = data?.[0]?.credits || 0;
                    const newTotal = latestCredits + pack.count;

                    const updateBody = { credits: newTotal };
                    if (pack.planName) {
                        updateBody.plan = pack.planName;
                    }

                    const { error } = await dbFetch('profiles', {
                        method: 'PATCH',
                        filters: { id: session.user.id },
                        body: updateBody
                    });

                    if (!error) {
                        setCredits(newTotal);
                        if (pack.planName) setUserPlan(pack.planName);

                        // Save payment record
                        await dbFetch('payments', {
                            method: 'POST',
                            body: {
                                user_email: session.user.email,
                                amount: amount,
                                credits: pack.count,
                                plan: pack.planName || 'credit',
                                imp_uid: rsp.imp_uid,
                                merchant_uid: orderId,
                                status: 'completed'
                            }
                        });

                        if (showToast) showToast(`${pack.planName ? pack.planName.toUpperCase() + ' 플랜으로 업그레이드되었습니다! ' : ''}${pack.count} 크레딧이 충전되었습니다!`);
                        else alert(`${pack.count} 크레딧이 충전되었습니다!`);
                        setShowPaymentModal(false);
                    }
                } catch (err) {
                    console.error("Payment sync internal error:", err);
                    alert('결제 성공 후 데이터 동기화 중 오류가 발생했습니다. 고객센터로 문의주세요.');
                }
            } else {
                if (showToast) showToast(`결제에 실패했습니다: ${rsp.error_msg}`, 'error');
                else alert(`결제에 실패했습니다: ${rsp.error_msg}`);
            }
        })
    }


    const handleDownload = async (imageUrl, imageId, skipCheck = false) => {
        if (!skipCheck) {
            if (credits < 5) {
                if (confirm("다운로드하려면 5 크레딧이 필요합니다. 충전하시겠습니까?")) {
                    setShowPaymentModal(true)
                }
                return
            }

            if (!confirm("이미지를 다운로드하시겠습니까? (5 크레딧 차감)")) return

            try {
                await deductCredits(5)
            } catch (error) {
                console.error('Credit deduction failed:', error)
                return
            }
        }

        try {
            // Fetch the image as blob with longer timeout and specific headers
            const response = await fetch(imageUrl, {
                mode: 'cors',
                cache: 'no-cache'
            })
            if (!response.ok) throw new Error(`HTTP ${response.status} for ${imageUrl}`)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = blobUrl
            // Extract extension or default to png
            const extension = imageUrl.split('.').pop().split('?')[0] || 'png';
            a.download = `itda_result_${imageId || Date.now()}.${extension}`
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()

            // Critical: Don't revoke too fast, and definitely remove from body
            setTimeout(() => {
                if (document.body.contains(a)) document.body.removeChild(a)
                window.URL.revokeObjectURL(blobUrl)
                if (showToast) showToast('갤러리에 저장되었습니다! ✨')
            }, 2000) // Increased to 2 seconds for safety
            return true;
        } catch (error) {
            console.error('Blob download failed, trying direct link fallback:', error)

            try {
                // Fallback: Use direct link with _blank to avoid blocking current page or triggering same-origin issues
                const a = document.createElement('a')
                a.href = imageUrl
                const extension = imageUrl.split('.').pop().split('?')[0] || 'png';
                a.download = `itda_result_${imageId || Date.now()}.${extension}`
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                a.style.display = 'none'
                document.body.appendChild(a)
                a.click()
                setTimeout(() => {
                    if (document.body.contains(a)) document.body.removeChild(a)
                }, 1000)
                return true;
            } catch (fallbackError) {
                console.error('All download methods failed:', fallbackError)
                return false;
            }
        }
    }


    const handleDetailPresetClick = (detail) => {
        if (!activePresetForDetail) return
        if (styleFile) {
            notifyUser('참조 배경을 업로드한 경우 프리셋을 선택할 수 없습니다. 참조 이미지를 제거하면 프리셋을 쓸 수 있어요.', 'error')
            return
        }

        const baseDescription = activePresetForDetail.description || ''
        const mergedPrompt = detail.fullPrompt
            ? detail.fullPrompt
            : `${baseDescription} ${detail.promptSuffix || ''}`.trim()

        setSelectedStyle(activePresetForDetail.id)
        setSelectedPreset(activePresetForDetail.id)
        setSelectedPresetDetailLabel(detail.label)
        setPrompt(mergedPrompt)
        setShowPresetDetailModal(false)

        if (promptGlowTimeoutRef.current) {
            clearTimeout(promptGlowTimeoutRef.current)
        }
        setIsPromptGlow(true)
        setTimeout(() => {
            document.getElementById('prompt-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
        promptGlowTimeoutRef.current = setTimeout(() => {
            setIsPromptGlow(false)
            promptGlowTimeoutRef.current = null
        }, 5000)
    }

    const sliderToScale = (val) => {
        if (val <= 50) return 0.1 + (val / 50) * 0.9
        else return 1.0 + ((val - 50) / 50) * 0.2
    }

    const scaleToSlider = (scale) => {
        if (scale <= 1.0) return ((scale - 0.1) / 0.9) * 50
        else return 50 + ((scale - 1.0) / 0.2) * 50
    }

    return (
        <div style={{ backgroundColor: '#111', minHeight: '100vh', color: '#fff' }}>
            <header className="itda-app-navbar">
                <div className="itda-nav-left">
                    <div className="itda-logo-wrap" onClick={() => {
                        if (viewMode === 'mypage' || editorStep === 'result') {
                            setViewMode('workspace');
                            setEditorStep('input');
                        } else {
                            onBack();
                        }
                    }}>
                        <img src="/assets/Vector.png" alt="잇다 로고 심볼" className="itda-logo-symbol" />
                        <img src="/assets/Frame.png" alt="잇다 텍스트 로고" className="itda-logo-text" />
                    </div>
                    <nav className="itda-nav-links">
                        <a href="#" className={`itda-nav-link ${viewMode === 'workspace' ? 'active' : ''}`} onClick={(e) => {
                            e.preventDefault();
                            setViewMode('workspace');
                            setEditorStep('input');
                        }}>사진 생성</a>
                        <a href="#" className={`itda-nav-link ${viewMode === 'mypage' ? 'active' : ''}`} onClick={(e) => {
                            e.preventDefault();
                            setViewMode('mypage');
                        }}>마이페이지</a>
                    </nav>
                </div>
                <div className="itda-nav-actions">
                    <button className="itda-logout-btn btn-outline" onClick={() => setShowContactModal(true)}>문의하기</button>
                    <button className="itda-logout-btn" onClick={() => {
                        console.log("ImageEditor: Logout button clicked");
                        onLogout();
                    }}>로그아웃</button>
                </div>
            </header>

            {viewMode === 'workspace' ? (
                <div className="itda-editor-wrapper">
                    {/* Sidebar */}
                    <aside className="itda-sidebar">
                        <section>
                            <span className="itda-step-label">STEP 1</span>
                            <h2 className="itda-step-title">사진 업로드</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--itda-text-muted)', marginBottom: '16px' }}>가구 사진을 준비해 주세요.</p>

                            <div className="itda-upload-card">
                                <div className="itda-preview-box itda-preview-box--furniture-scale">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Furniture"
                                            className="itda-preview-furniture-img"
                                            style={{
                                                transform: `scale(${objectScale})`,
                                            }}
                                            onContextMenu={e => e.preventDefault()}
                                            onDragStart={e => e.preventDefault()}
                                            draggable="false"
                                        />
                                    ) : (
                                        <div className="itda-placeholder-content">
                                            <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🛋️</div>
                                            <p style={{ fontSize: '1.2rem', color: '#666', fontFamily: "'Inter', sans-serif" }}>가구 사진을 업로드해 주세요.</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="itda-btn-lime"
                                    onClick={() => document.getElementById('base-upload').click()}
                                >
                                    가구 사진 {preview ? '변경' : '업로드'}
                                </button>
                                <input id="base-upload" type="file" hidden onChange={handleBaseImageChange} accept="image/*" />
                            </div>
                        </section>

                        <section>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>제품 크기 조절</label>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={scaleToSlider(objectScale)}
                                onChange={(e) => setObjectScale(parseFloat(sliderToScale(parseFloat(e.target.value)).toFixed(2)))}
                                style={{ width: '100%', accentColor: '#3b82f6', height: '4px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#fff' }}></span>
                                <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px' }}>
                                    {objectScale.toFixed(2)}x
                                </span>
                            </div>
                        </section>

                        <section>
                            <div className="itda-upload-card">
                                <div className="itda-preview-box" style={{ aspectRatio: '1.4/1' }}>
                                    {stylePreview ? (
                                        <img src={stylePreview} alt="Reference" />
                                    ) : (
                                        <div className="itda-placeholder-content">
                                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🖼️</div>
                                            <p style={{ fontSize: '1.1rem', color: '#666', fontFamily: "'Inter', sans-serif" }}>참조할 배경 사진이 있다면<br />업로드해 주세요.</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px', alignItems: 'stretch' }}>
                                    <button
                                        type="button"
                                        className="itda-btn-lime"
                                        onClick={() => {
                                            if (!imageFile) {
                                                notifyUser('기본 가구 사진을 먼저 업로드해 주세요.', 'error')
                                                return
                                            }
                                            document.getElementById('style-upload').click()
                                        }}
                                    >
                                        참조 배경 사진 {stylePreview ? '변경' : '업로드'}
                                    </button>
                                    {stylePreview ? (
                                        <button
                                            type="button"
                                            className="itda-btn-outline"
                                            onClick={clearStyleImage}
                                            style={{
                                                borderColor: 'rgba(239, 68, 68, 0.45)',
                                                color: '#f87171',
                                                background: 'rgba(239, 68, 68, 0.08)',
                                            }}
                                        >
                                            참조 이미지 제거
                                        </button>
                                    ) : null}
                                </div>
                                <input id="style-upload" type="file" hidden onChange={handleStyleImageChange} accept="image/*" />
                            </div>
                        </section>

                        <section className="itda-credit-card">
                            <div className="itda-credit-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>🪙</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>나의 남은 크레딧 개수</span>
                                </div>
                                <button
                                    onClick={() => { setPaymentModalReason('charge'); setShowPaymentModal(true); }}
                                    style={{
                                        background: 'rgba(163, 230, 53, 0.1)',
                                        border: '1px solid var(--itda-lime)',
                                        color: 'var(--itda-lime)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    충전하기
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--itda-lime)', fontWeight: 700 }}>{credits} 크레딧</span> 남음
                            </div>
                            <div className="itda-progress-bg">
                                <div className="itda-progress-fill" style={{ width: `${Math.min(100, (credits / 100) * 100)}%` }}></div>
                            </div>
                        </section>
                    </aside>

                    {/* Main Content */}
                    <main className="itda-main">
                        {editorStep === 'input' ? (
                            <>
                                <section className="itda-section-header">
                                    <span className="itda-step-label">STEP 2</span>
                                    <h2 className="itda-step-title">가구 배경 / 연출 선택</h2>
                                    <p style={{ color: 'var(--itda-text-muted)' }}>검증된 BEST 추천 배경을 선택하고 완성도 높은 사진을 생성하세요.</p>
                                </section>

                                <div className="itda-grid-6">
                                    {BACKGROUND_PRESETS.map(preset => (
                                        <div
                                            key={preset.id}
                                            className={`itda-preset-card ${selectedPreset === preset.id ? 'active' : ''}`}
                                            onClick={() => {
                                                if (styleFile) {
                                                    notifyUser('참조 배경 사진을 이용할 경우 프리셋을 선택할 수 없습니다. 참조 이미지를 제거하면 프리셋을 쓸 수 있어요.', 'error')
                                                    return
                                                }
                                                // 재클릭 시: 체크 해제, 텍스트 제거, 글로우 즉시 제거
                                                if (selectedPreset === preset.id) {
                                                    if (promptGlowTimeoutRef.current) {
                                                        clearTimeout(promptGlowTimeoutRef.current);
                                                        promptGlowTimeoutRef.current = null;
                                                    }
                                                    setIsPromptGlow(false);
                                                    setSelectedPreset(null);
                                                    setSelectedPresetDetailLabel('');
                                                    setSelectedStyle('Original');
                                                    setPrompt('');
                                                    setActivePresetForDetail(null);
                                                    setShowPresetDetailModal(false);
                                                    return;
                                                }

                                                const hasDetails = BACKGROUND_SUB_PRESETS[preset.id];
                                                setSelectedPreset(preset.id);
                                                setSelectedPresetDetailLabel('');

                                                if (preset.id === 'classic') {
                                                    const detailPrompt = `입력 이미지에 있는 특정 가구를 그대로 유지한 상태로, 제품의 모서리와 가장자리에 초점을 맞춘 클로즈업 시네마틱 샷을 연출해줘.
제품의 뒷배경은 초점이 흐릿하게 해주고, 제품의 낮은 각도 + 측면 각도에서 본 것처럼 소재의 가장자리에 초점을 맞춥니다. 전문 사진작가 스러운 스타일, 밝고 깨끗한 조명, 사실적인 디테일.`;
                                                    setSelectedStyle(preset.id);
                                                    setSelectedPresetDetailLabel('디테일 클로즈업');
                                                    setPrompt(detailPrompt);
                                                    if (promptGlowTimeoutRef.current) {
                                                        clearTimeout(promptGlowTimeoutRef.current);
                                                    }
                                                    setIsPromptGlow(true);
                                                    setTimeout(() => {
                                                        document.getElementById('prompt-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }, 50);
                                                    promptGlowTimeoutRef.current = setTimeout(() => {
                                                        setIsPromptGlow(false);
                                                        promptGlowTimeoutRef.current = null;
                                                    }, 4000);
                                                    return;
                                                }

                                                if (hasDetails) {
                                                    setActivePresetForDetail(preset);
                                                    setShowPresetDetailModal(true);
                                                } else {
                                                    setSelectedStyle(preset.id);
                                                    setPrompt(preset.description);
                                                    if (promptGlowTimeoutRef.current) {
                                                        clearTimeout(promptGlowTimeoutRef.current);
                                                    }
                                                    setIsPromptGlow(true);
                                                    setTimeout(() => {
                                                        document.getElementById('prompt-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }, 50);
                                                    promptGlowTimeoutRef.current = setTimeout(() => {
                                                        setIsPromptGlow(false);
                                                        promptGlowTimeoutRef.current = null;
                                                    }, 4000);
                                                }
                                            }}
                                        >
                                            <img
                                                src={preset.image}
                                                srcSet={preset.image2x ? `${preset.image} 1x, ${preset.image2x} 2x` : undefined}
                                                alt={preset.title}
                                                className="itda-preset-card-img"
                                                decoding="async"
                                                onContextMenu={e => e.preventDefault()}
                                                onDragStart={e => e.preventDefault()}
                                                draggable="false"
                                            />
                                            <div className="itda-check-badge">✔</div>
                                            <div className="itda-preset-info">
                                                <h4>{preset.title}</h4>
                                                <p>{preset.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <section>
                                    <div className="itda-section-header">
                                        <span className="itda-step-label">STEP 3</span>
                                        <h2 className="itda-step-title">텍스트로 상세 수정</h2>
                                    </div>

                                    {selectedPresetMeta && selectedPresetDetailLabel && (
                                        <div className="itda-selection-chip">
                                            <div className="itda-chip-text">
                                                {selectedPresetMeta.id === 'classic'
                                                    ? selectedPresetMeta.title
                                                    : `${selectedPresetMeta.title} · ${selectedPresetDetailLabel}`}
                                            </div>
                                        </div>
                                    )}


                                    <div className={`itda-prompt-card ${isPromptGlow ? 'glow' : ''}`}>
                                        {showPromptQuickOptions ? (
                                            <>
                                                <div className="itda-prompt-guide">
                                                    💡 버튼을 클릭해 원하는 소품이나 색상으로 자유롭게 변경해 보세요!
                                                </div>
                                                <div className="itda-prompt-quick-btns">
                                                    {[
                                                        ...(isRefMode
                                                            ? [
                                                                { id: 'angle', label: '각도 변경', hint: '각도·구도 관련 문구 하이라이트' },
                                                                { id: 'position', label: '위치 변경', hint: '위치·배치 관련 문구 하이라이트' },
                                                                { id: 'styleRef', label: '스타일 변경', hint: '스타일·분위기 관련 문구 하이라이트' },
                                                            ]
                                                            : isCloseupPreset
                                                                ? [
                                                                    { id: 'closeupPos', label: '클로즈업 위치', hint: '클로즈업 위치 관련 문구 하이라이트' },
                                                                    { id: 'material', label: '소재 변경', hint: '소재·질감 관련 문구 하이라이트' },
                                                                    { id: 'angle', label: '각도 변경', hint: '각도·구도 관련 문구 하이라이트' },
                                                                    { id: 'lighting', label: '조명 변경', hint: '조명 관련 문구 하이라이트' },
                                                                ]
                                                                : isAiModelPreset
                                                                    ? [
                                                                        { id: 'pose', label: '포즈 & 자세 바꾸기', hint: '포즈·자세 관련 문구 하이라이트' },
                                                                        { id: 'person', label: '인물 바꾸기', hint: '인물·모델 관련 문구 하이라이트' },
                                                                        { id: 'camera', label: '카메라 각도 바꾸기', hint: '카메라·구도 관련 문구 하이라이트' },
                                                                        { id: 'outfit', label: '의상 바꾸기', hint: '의상·스타일링 관련 문구 하이라이트' },
                                                                    ]
                                                                    : [
                                                                        { id: 'props', label: '소품 변경', hint: '소품 관련 문구 하이라이트' },
                                                                        { id: 'wallfloor', label: '벽지, 바닥 변경', hint: '벽·바닥 관련 문구 하이라이트' },
                                                                        { id: 'lighting', label: '조명 변경', hint: '조명 관련 문구 하이라이트' },
                                                                        { id: 'angle', label: '각도 변경', hint: '각도·구도 관련 문구 하이라이트' },
                                                                        { id: 'mood', label: '분위기 변경', hint: '분위기·스타일 관련 문구 하이라이트' },
                                                                    ]),
                                                    ].map(({ id, label, hint }) => (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            className={`itda-prompt-quick-btn ${promptHighlightMode === id ? 'active' : ''}`}
                                                            title={hint}
                                                            onClick={() => setPromptHighlightMode(m => m === id ? null : id)}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : null}
                                        <div className="itda-prompt-textarea-wrap">
                                        <textarea
                                            id="prompt-textarea"
                                            className="itda-prompt-textarea"
                                            placeholder="가구와 어울리는 배경을 묘사해 주세요.
(예시: 가구의 인테리어 배경을 만들어줘. 베이지 색 벽지와 흰색 오크 나무 원목 바닥. 창문으로 들어오는 자연광)"
                                            value={prompt}
                                            maxLength={1000}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setPrompt(value);
                                                if (!value.trim()) {
                                                    setSelectedPreset(null);
                                                    setSelectedPresetDetailLabel('');
                                                }
                                            }}
                                            onScroll={(e) => {
                                                const el = promptHighlightOverlayRef.current;
                                                if (el) { el.scrollTop = e.target.scrollTop; el.scrollLeft = e.target.scrollLeft; }
                                            }}
                                        />
                                        {promptHighlightMode && prompt.trim() && (() => {
                                            const ranges = getHighlightRanges(prompt, PROMPT_HIGHLIGHT_KEYWORDS[promptHighlightMode]);
                                            const parts = [];
                                            let last = 0;
                                            for (const { start, end } of ranges) {
                                                if (start > last) parts.push({ text: prompt.slice(last, start), highlight: false });
                                                parts.push({ text: prompt.slice(start, end), highlight: true });
                                                last = end;
                                            }
                                            if (last < prompt.length) parts.push({ text: prompt.slice(last), highlight: false });
                                            return (
                                                <div
                                                    ref={promptHighlightOverlayRef}
                                                    className="itda-prompt-highlight-overlay"
                                                    aria-hidden="true"
                                                >
                                                    {parts.map((p, i) => p.highlight ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>)}
                                                </div>
                                            );
                                        })()}
                                        </div>
                                        <div className="itda-char-count">{prompt.length}/1000</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                                        {userPlan === 'pro' && (
                                            <label className="itda-hd-toggle" title="스튜디오 플랜: 초고해상도 이미지 생성">
                                                <span className="itda-hd-toggle-label">초고해상도 생성 ✨</span>
                                                <input
                                                    type="checkbox"
                                                    checked={useHD}
                                                    onChange={(e) => setUseHD(e.target.checked)}
                                                />
                                                <span className="itda-hd-toggle-slider"></span>
                                            </label>
                                        )}
                                        {userPlan !== 'pro' && (
                                            <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                {showHdTooltip && (
                                                    <div
                                                        className="itda-hd-tooltip"
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '100%',
                                                            marginBottom: '8px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#fff',
                                                            color: '#333',
                                                            borderRadius: '8px',
                                                            fontSize: '13px',
                                                            whiteSpace: 'nowrap',
                                                            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                                                            zIndex: 10,
                                                        }}
                                                    >
                                                        스튜디오 플랜 유저만 이용할 수 있어요.
                                                    </div>
                                                )}
                                                <label
                                                    className={`itda-hd-toggle itda-hd-locked ${isHdShake ? 'shake' : ''}`}
                                                    title="스튜디오 플랜으로 이용 가능합니다"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setIsHdShake(true);
                                                        setShowHdTooltip(true);
                                                        setTimeout(() => setIsHdShake(false), 400);
                                                        setTimeout(() => setShowHdTooltip(false), 3000);
                                                    }}
                                                >
                                                    <span className="itda-hd-toggle-label" style={{ color: 'var(--itda-text-muted)', pointerEvents: 'none' }}>🔒 초고해상도 생성</span>
                                                    <input
                                                        type="checkbox"
                                                        readOnly
                                                        checked={false}
                                                        style={{ pointerEvents: 'none' }}
                                                    />
                                                    <span className="itda-hd-toggle-slider" style={{ opacity: 0.5, pointerEvents: 'none' }}></span>
                                                </label>
                                            </div>
                                        )}
                                        <button
                                            className={`itda-generate-btn ${imageFile || credits < 1 ? 'active' : ''}`}
                                            disabled={loading}
                                            onClick={() => {
                                                if (!imageFile) {
                                                    return alert("변환할 원본 이미지를 업로드해주세요.");
                                                }

                                                const hideUntil = localStorage.getItem('itda_copyright_hide_until');
                                                const now = new Date().getTime();
                                                if (hideUntil && now < parseInt(hideUntil)) {
                                                    handleGenerate();
                                                } else {
                                                    setGenerateCopyrightChecked(false);
                                                    setHideCopyright30Days(false);
                                                    setShowGenerateCopyrightModal(true);
                                                }
                                            }}
                                        >
                                            배경 생성하기 🪙-1
                                        </button>
                                    </div>
                                </section>
                            </>
                        ) : editorStep === 'error' ? (
                            <div className="itda-result-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '5rem', marginBottom: '24px' }}>⚠️</div>
                                <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '16px', fontWeight: '700' }}>오류가 발생했어요</h2>
                                <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px', wordBreak: 'keep-all' }}>
                                    안심하세요! 서버 연결이 일시적으로 원활하지 않을 수 있습니다.<br />
                                    아래 대표번호로 연락주시면 문제를 즉시 해결해 드립니다.
                                </p>

                                <div style={{ background: 'rgba(163, 183, 52, 0.1)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(163, 183, 52, 0.2)', display: 'inline-block', marginBottom: '40px' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#a3b734', fontWeight: '600', marginBottom: '8px' }}>대표번호</div>
                                    <div style={{ fontSize: '1.6rem', color: '#fff', fontWeight: '800' }}>010-7371-4116</div>
                                </div>

                                {generationError && (
                                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '10px', marginBottom: '30px', fontFamily: 'monospace' }}>
                                        Error Detail: {generationError}
                                    </div>
                                )}

                                <div className="itda-result-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                                    <button className="itda-btn-gray" onClick={() => {
                                        setEditorStep('input');
                                        setGenerationError(null);
                                    }}>
                                        다시 시도하기
                                    </button>
                                    <button className="itda-btn-lime" onClick={() => setShowContactModal(true)}>
                                        1:1 문의남기기
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Result View (Redesigned to match ITDA reference) */
                            <div className="itda-result-container">
                                <header className="itda-result-header">
                                    <h2>생성이 완료되었어요!</h2>
                                    <p>사진의 조명과 배경이 밝을수록 결과물이 좋게 나와요!</p>
                                </header>

                                <div className="itda-result-grid-top">
                                    <button
                                        className="itda-select-all-btn"
                                        onClick={() => {
                                            if (selectedResults.length === resultImages.length) {
                                                setSelectedResults([]);
                                            } else {
                                                setSelectedResults(resultImages.map((_, i) => i));
                                            }
                                        }}
                                    >
                                        전체 선택
                                    </button>
                                </div>

                                <div className="itda-result-grid">
                                    {resultImages.map((img, idx) => (
                                        <div
                                            key={img.id || idx}
                                            className={`itda-result-card ${selectedResults.includes(idx) ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedResults(prev =>
                                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                                );
                                            }}
                                        >
                                            <div className="itda-selection-badge">✔</div>
                                            <div
                                                className={`itda-heart-badge ${img.is_favorite ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(img.id, img.is_favorite);
                                                }}
                                            >
                                                {img.is_favorite ? '💚' : '🤍'}
                                            </div>
                                            <div
                                                className="itda-zoom-badge"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setZoomedImage(img.url);
                                                }}
                                            >
                                                🔍
                                            </div>
                                            <img
                                                src={img.url}
                                                alt="Result"
                                                onContextMenu={(e) => e.preventDefault()}
                                                onDragStart={(e) => e.preventDefault()}
                                                draggable="false"
                                            />
                                        </div>
                                    ))}
                                    {/* Fallback if no images (for testing/loading states) */}
                                    {resultImages.length === 0 && !loading && (
                                        <div className="empty-results" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                                            <p style={{ color: 'var(--itda-text-muted)' }}>생성된 이미지가 없습니다.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="itda-result-actions">
                                    <button
                                        className="itda-btn-outline"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onClick={async () => {
                                            if (selectedResults.length === 0) return alert('이미지를 선택해주세요.');
                                            for (const idx of selectedResults) {
                                                const img = resultImages[idx];
                                                if (!img.is_favorite) {
                                                    await toggleFavorite(img.id, img.is_favorite);
                                                }
                                            }
                                            alert('좋아요 저장 완료!');
                                        }}
                                    >
                                        <span>💚</span> 좋아요로 저장하기
                                    </button>
                                    <button
                                        className="itda-btn-lime"
                                        disabled={loading || isDownloading}
                                        onClick={async () => {
                                            if (selectedResults.length === 0) return alert('다운로드할 이미지를 선택해주세요.');

                                            // Ensure credits computation is robust 
                                            const currentCreditsVal = parseInt(credits) || 0;
                                            const totalCost = selectedResults.length * 5;

                                            if (currentCreditsVal < totalCost) {
                                                setPaymentModalReason('insufficient');
                                                return setShowPaymentModal(true);
                                            }

                                            setShowDownloadConfirmModal(true);
                                        }}
                                    >
                                        {isDownloading ? '다운로드 중...' : (loading ? '처리 중...' : `사진 다운로드 ${selectedResults.length > 0 ? `-${selectedResults.length * 5}` : ''} 🪙`)}
                                    </button>
                                    <button className="itda-btn-gray" onClick={() => {
                                        const hideUntil = localStorage.getItem('itda_regenerate_hide_until');
                                        const now = new Date().getTime();
                                        if (hideUntil && now < parseInt(hideUntil)) {
                                            setEditorStep('input');
                                            setSelectedResults([]);
                                        } else {
                                            setShowRegenerateModal(true);
                                        }
                                    }}>
                                        다시 생성하기
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Loading Overlay */}
                    {loading && (
                        <div className="itda-loading-overlay">
                            <div className="itda-armchair-wrap">🪑</div>
                            <div className="itda-loading-text">
                                <h3>이미지를 생성하는 중. . .</h3>
                                <p>사진의 조명과 배경이 밝을수록 결과물이 좋게 나와요!</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <MyPage session={session} onBack={() => setViewMode('workspace')} />
            )}

            {/* Preset Detail Modal */}
            {showPresetDetailModal && activePresetForDetail && (
                <div className="payment-overlay" onClick={() => setShowPresetDetailModal(false)}>
                    <div className="preset-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={() => setShowPresetDetailModal(false)}>✕</button>
                        <h3 className="preset-modal-title">세부 옵션 선택</h3>
                        <p className="preset-modal-subtitle">
                            원하는 스타일을 고르면, 해당 조합에 맞는 내용이 자동으로 채워집니다.
                        </p>
                        <div className="preset-modal-grid">
                            {(BACKGROUND_SUB_PRESETS[activePresetForDetail.id] || []).map((detail) => (
                                <button
                                    key={`${activePresetForDetail.id}-${detail.id}`}
                                    type="button"
                                    className="preset-modal-item"
                                    onClick={() => handleDetailPresetClick(detail)}
                                >
                                    <div className="preset-modal-item-img">
                                        <img
                                            src={detail.image || activePresetForDetail.image}
                                            alt={detail.label}
                                            onContextMenu={e => e.preventDefault()}
                                            onDragStart={e => e.preventDefault()}
                                            draggable="false"
                                        />
                                    </div>
                                    <div className="preset-modal-item-body">
                                        <div className="preset-modal-item-label">{detail.label}</div>
                                        <p className="preset-modal-item-desc">{detail.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {activePresetForDetail.id === 'warm-minimal' && (
                            <p className="preset-modal-note">⚠️ 이 배경은 가구의 각도가 달라질 수 있습니다</p>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="payment-overlay" onClick={() => { setShowPaymentModal(false); setSelectedPlan(null); }}>
                    <div className="itda-payment-modal" onClick={e => e.stopPropagation()}>
                        <div className="itda-pm-header">
                            <img src="/assets/Frame.png" alt="Itda Logo" className="itda-pm-logo" />
                            <button className="close-x" onClick={() => { setShowPaymentModal(false); setSelectedPlan(null); }}>✕</button>
                        </div>
                        <p className="itda-pm-subtitle">
                            {paymentModalReason === 'insufficient'
                                ? '크레딧이 부족해요. 구매 옵션을 선택해 주세요.'
                                : '상상을 현실로 만드는 법, 충전 옵션을 선택해 주세요.'}
                        </p>

                        <div className="itda-pm-grid">
                            {[
                                { id: 'basic', title: '싱글 플랜', icon: '🪙', price: '24,900원', creditTxt: '크레딧 50개 지급', features: [{ t: '초고화질 이미지 제공', a: false }, { t: '상세 페이지 제작', a: false }, { t: '자사몰 제작', a: false }] },
                                { id: 'pro', title: '스튜디오 플랜', icon: '🪙', price: '249,000원', creditTxt: '크레딧 1,000개 지급', features: [{ t: '초고화질 이미지 제공', a: true }, { t: '상세 페이지 제작', a: false }, { t: '자사몰 제작', a: false }] },
                                { id: 'enterprise', title: '엔터프라이즈', icon: '🏢', price: '기업 문의', creditTxt: '대량 SKU 전용', features: [{ t: '커스텀 플랜 제공', a: true }, { t: '상세 페이지 제작', a: true }, { t: '자사몰 제작', a: true }, { t: '상담 후 진행', a: true }] }
                            ].map(p => (
                                <div key={p.id}
                                    className={`itda-pm-card ${selectedPlan === p.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPlan(p.id)}>
                                    <div className="itda-pm-card-head">
                                        <span className="itda-pm-icon">{p.icon}</span>
                                        <span className="itda-pm-card-title">{p.title}</span>
                                    </div>
                                    <div className="itda-pm-price">{p.price}</div>
                                    <div className="itda-pm-credit-txt">{p.creditTxt}</div>
                                    <ul className="itda-pm-features">
                                        {p.features.map((f, idx) => (
                                            <li key={idx} className={f.a ? 'active' : ''}>{f.t}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="itda-pm-footer">
                            <button
                                className={`itda-pm-buy-btn ${selectedPlan ? 'active' : ''}`}
                                disabled={!selectedPlan}
                                onClick={() => {
                                    if (!selectedPlan) return;
                                    if (selectedPlan === 'enterprise') {
                                        setShowPaymentModal(false);
                                        setSelectedPlan(null);
                                        setShowContactModal(true);
                                    } else {
                                        const plans = {
                                            basic: { count: 50, price: '24900', planName: 'single' },
                                            pro: { count: 1000, price: '249000', planName: 'studio' }
                                        };
                                        handlePayment(plans[selectedPlan]);
                                        setSelectedPlan(null);
                                    }
                                }}
                            >
                                구매하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Zoom View (same as before) */}
            {zoomedImage && (
                <div
                    className="zoom-modal-backdrop"
                    onClick={() => setZoomedImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: '#000',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div className="zoom-content" style={{ position: 'relative', width: 'fit-content', height: 'fit-content', overflow: 'hidden', background: '#000' }}>
                        {/* Protection Layer - Instant occlusion */}
                        <div className={`itda-hardened-protection-layer ${isProtected ? 'active' : ''}`}>
                            <div className="protection-msg">보안 정책상 캡처가 차단되었습니다</div>
                        </div>

                        {/* Interaction Shield - Blocks right click/drag even when not protected */}
                        <div className="itda-interaction-shield"></div>

                        {!isProtected && (
                            <>
                                <div className="itda-watermark-overlay hardened"></div>
                                <CanvasImage
                                    src={zoomedImage}
                                    className="itda-zoomed-canvas"
                                    style={{
                                        maxWidth: '90vw',
                                        maxHeight: '90vh',
                                        display: 'block'
                                    }}
                                />
                            </>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                            className="itda-zoom-close-btn"
                            style={{ position: 'absolute', top: 10, right: 10, zIndex: 100000 }}
                        >✕</button>
                    </div>
                </div>
            )}
            {/* Contact Modal */}
            <ContactModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                session={session}
            />

            {/* Generate Copyright Modal */}
            {showGenerateCopyrightModal && (
                <div className="payment-overlay" onClick={() => setShowGenerateCopyrightModal(false)}>
                    <div className="itda-copyright-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={() => setShowGenerateCopyrightModal(false)}>✕</button>
                        <span className="itda-copyright-icon">⚖️</span>
                        <h3 className="itda-copyright-title">저작권 침해 주의</h3>
                        <p className="itda-copyright-desc">
                            첨부한 제품은 이용자 본인의 제품 혹은 상업적 이용이 가능한 제품이여야 해요.<br />
                            저작권을 소유하고 있지 않은 타인의 제품을 업로드하고 상업적 목적으로 사용하실 경우,<br />
                            발생하는 모든 법적 책임은 이용자 본인에게 있어요.
                        </p>
                        <label className="itda-copyright-agreement" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={generateCopyrightChecked}
                                onChange={(e) => setGenerateCopyrightChecked(e.target.checked)}
                            />
                            <span>위 내용을 확인했으며, 기재된 내용에 동의합니다.</span>
                        </label>
                        <button
                            className="itda-copyright-btn"
                            disabled={!generateCopyrightChecked}
                            onClick={() => {
                                if (hideCopyright30Days) {
                                    const until = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
                                    localStorage.setItem('itda_copyright_hide_until', until.toString());
                                }
                                setShowGenerateCopyrightModal(false);
                                handleGenerate();
                            }}
                        >
                            동의하고 계속하기
                        </button>
                        <label className="itda-copyright-dontshow" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={hideCopyright30Days}
                                onChange={(e) => setHideCopyright30Days(e.target.checked)}
                            />
                            <span>30일 간 다시 보지 않기</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Regenerate Confirmation Modal */}
            {showRegenerateModal && (
                <div className="itda-download-confirm-overlay" onClick={() => setShowRegenerateModal(false)}>
                    <div className="itda-download-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="itda-dc-logo">
                            <img src="/assets/Frame.png" alt="잇다" style={{ height: '36px', width: 'auto' }} />
                        </div>
                        <button className="itda-dc-close" onClick={() => setShowRegenerateModal(false)}>✕</button>

                        <div style={{ textAlign: 'center', fontSize: '6rem', marginTop: '40px', marginBottom: '8px', lineHeight: 1 }}>😢</div>
                        <h2 className="itda-dc-title" style={{ marginTop: '16px', marginBottom: '16px' }}>정말 다시 생성하시겠어요?</h2>
                        <p className="itda-dc-subtitle" style={{ marginBottom: '40px', wordBreak: 'keep-all' }}>
                            최대 7일 간의 생성 기록은 마이페이지 - 히스토리에서 확인하실 수 있어요.
                        </p>

                        <div className="itda-dc-actions" style={{ marginBottom: '16px' }}>
                            <button className="itda-dc-btn-cancel" onClick={() => setShowRegenerateModal(false)}>취소</button>
                            <button
                                className="itda-dc-btn-download"
                                onClick={() => {
                                    if (hideRegenerate30Days) {
                                        const until = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
                                        localStorage.setItem('itda_regenerate_hide_until', until.toString());
                                    }
                                    setShowRegenerateModal(false);
                                    setEditorStep('input');
                                    setSelectedResults([]);
                                }}
                            >
                                다시 생성 <span className="cost-tag">-1</span> <span className="coin-icon" style={{ opacity: 0.8 }}>🪙</span>
                            </button>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }} onClick={e => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={hideRegenerate30Days}
                                onChange={(e) => setHideRegenerate30Days(e.target.checked)}
                                style={{ accentColor: '#a3e635', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span>30일 간 다시 보지 않기</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Download Confirmation Modal (User Request) */}
            {showDownloadConfirmModal && (
                <div className="itda-download-confirm-overlay" onClick={() => setShowDownloadConfirmModal(false)}>
                    <div className="itda-download-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="itda-dc-logo">
                            <img src="/assets/Frame.png" alt="잇다" style={{ height: '32px', width: 'auto' }} />
                        </div>
                        <button className="itda-dc-close" onClick={() => setShowDownloadConfirmModal(false)}>&times;</button>

                        <h2 className="itda-dc-title">다운로드하시겠어요?</h2>
                        <p className="itda-dc-subtitle">다운로드한 이미지는 최대 1년까지 보관할 수 있어요.</p>

                        <div className="itda-dc-credit-box">
                            <div className="itda-dc-credit-row">
                                현재 보유한 크레딧: <span className="itda-dc-credit-value">{credits}</span>
                            </div>
                            <div className="itda-dc-credit-row">
                                사용 후 크레딧: <span className="itda-dc-credit-value" style={{ color: '#3b82f6' }}>{credits - (selectedResults.length * 5)}</span>
                            </div>
                        </div>

                        <div className="itda-dc-actions">
                            <button className="itda-dc-btn-cancel" onClick={() => setShowDownloadConfirmModal(false)}>취소</button>
                            <button
                                className="itda-dc-btn-download"
                                disabled={isDownloading}
                                onClick={async () => {
                                    const totalCost = selectedResults.length * 5;
                                    setIsDownloading(true);
                                    setShowDownloadConfirmModal(false);
                                    if (showToast) showToast('다운로드를 시작합니다...');

                                    try {
                                        const success = await deductCredits(totalCost);
                                        if (!success) {
                                            alert('크레딧 차감 중 오류가 발생했습니다.');
                                            return;
                                        }

                                        let count = 0;
                                        for (let i = 0; i < selectedResults.length; i++) {
                                            const idx = selectedResults[i];
                                            const img = resultImages[idx];
                                            if (!img || !img.url) continue;

                                            if (i > 0) await new Promise(r => setTimeout(r, 450));
                                            const ok = await handleDownload(img.url, img.id, true);
                                            if (ok) count++;
                                        }

                                        if (showToast) showToast(`${count}장의 이미지를 다운로드했습니다!`);
                                        setSelectedResults([]);

                                        // Show feedback modal logic
                                        const hideUntil = localStorage.getItem('itda_feedback_hide_until');
                                        const now = new Date().getTime();
                                        if (!hideUntil || now > parseInt(hideUntil)) {
                                            setFbRating(5);
                                            setFbText('');
                                            setShowFeedbackModal(true);
                                        }
                                    } catch (err) {
                                        console.error('Download modal exec error:', err);
                                        alert('다운로드 중 오류가 발생했습니다.');
                                    } finally {
                                        setIsDownloading(false);
                                    }
                                }}
                            >
                                다운로드 <span className="cost-tag">-{selectedResults.length * 5}</span> <span className="coin-icon">🪙</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Feedback / Success Modal (User Request) */}
            {showFeedbackModal && (
                <div className="itda-feedback-overlay">
                    <div className="itda-feedback-modal">
                        <div className="itda-dc-logo">
                            <img src="/assets/Frame.png" alt="잇다" style={{ height: '32px', width: 'auto' }} />
                        </div>
                        <button className="itda-dc-close" onClick={() => setShowFeedbackModal(false)}>&times;</button>

                        <h2 className="itda-fb-title">다운로드가 완료되었어요.</h2>
                        <p className="itda-fb-subtitle">방금 만든 사진 어떠셨나요? 1분 투자로 <span>무료 크레딧</span>을 받아 가세요!</p>

                        <div className="itda-fb-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`itda-fb-star ${star <= fbRating ? 'active' : ''}`}
                                    onClick={() => setFbRating(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <div className="itda-fb-textarea-wrap">
                            <textarea
                                className="itda-fb-textarea"
                                placeholder="아쉬운 점이나 마음에 들었던 점을 자유롭게 적어 주시면 서비스 발전에 큰 도움이 됩니다."
                                value={fbText}
                                onChange={(e) => setFbText(e.target.value)}
                            />
                        </div>

                        <div className="itda-fb-actions">
                            <button className="itda-fb-btn-home" onClick={() => {
                                if (fbHideForWeek) {
                                    const expiry = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                                    localStorage.setItem('itda_feedback_hide_until', expiry.toString());
                                }
                                setShowFeedbackModal(false);
                                setEditorStep('input');
                            }}>
                                메인으로 이동
                            </button>
                            <button className="itda-fb-btn-submit" onClick={() => {
                                if (fbHideForWeek) {
                                    const expiry = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                                    localStorage.setItem('itda_feedback_hide_until', expiry.toString());
                                }

                                // Close instantly for snappy feel
                                setShowFeedbackModal(false);
                                if (showToast) showToast('피드백을 제출 중입니다...');

                                // Process in background without blocking UI
                                (async () => {
                                    try {
                                        await dbFetch('inquiries', {
                                            method: 'POST',
                                            body: {
                                                user_id: session.user.id,
                                                name: session.user.email.split('@')[0],
                                                email: session.user.email,
                                                message: `[별점: ${fbRating}점]\n\n피드백 내용:\n${fbText || '(내용 없음)'}`,
                                                status: 'feedback'
                                            }
                                        });

                                        const { data: profile } = await dbFetch('profiles', {
                                            select: 'credits',
                                            filters: { id: session.user.id }
                                        });
                                        if (profile && profile.length > 0) {
                                            const newCredits = (profile[0].credits || 0) + 1;
                                            await dbFetch('profiles', {
                                                method: 'PATCH',
                                                filters: { id: session.user.id },
                                                body: { credits: newCredits }
                                            });
                                            setCredits(newCredits);
                                            if (showToast) showToast('피드백 보상 +1 크레딧 지급 완료! 🪙');
                                        }
                                    } catch (e) {
                                        console.error('Feedback background error:', e);
                                    }
                                })();
                            }}>
                                제출하기 <span className="bonus">+1</span> <span className="coin-icon">🪙</span>
                            </button>
                        </div>

                        <label className="itda-fb-dontshow">
                            <input
                                type="checkbox"
                                checked={fbHideForWeek}
                                onChange={(e) => setFbHideForWeek(e.target.checked)}
                            />
                            7일 동안 다시 보지 않기
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
