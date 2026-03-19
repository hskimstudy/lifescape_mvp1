import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { authFetch, dbFetch } from '../dbHelper'

export default function Auth({ onBack, onSignupStart = () => { }, onSignupSuccess = () => { }, showToast }) {
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot_password'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [otp, setOtp] = useState('')

    // Mode-specific steps
    const [signupStep, setSignupStep] = useState('email') // 'email' | 'otp_password'
    const [forgotStep, setForgotStep] = useState('email') // 'email' | 'reset'

    const [cooldown, setCooldown] = useState(0)
    const [emailError, setEmailError] = useState('')
    const [otpVerified, setOtpVerified] = useState(false)
    const [otpError, setOtpError] = useState('')
    const [otpSent, setOtpSent] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [passwordTouched, setPasswordTouched] = useState(false)
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)
    const [passwordErrorMsg, setPasswordErrorMsg] = useState('')
    const [verifiedToken, setVerifiedToken] = useState('')

    // Cooldown Timer Effect
    React.useEffect(() => {
        let timer
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1)
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [cooldown])

    const validateEmail = (emailValue) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(emailValue)
    }

    const validatePassword = (pw) => {
        // Enforced by Supabase Backend: 8-12 chars, must include uppercase, lowercase, number, symbol
        if (pw.length < 8 || pw.length > 12) return false
        if (!/[a-z]/.test(pw)) return false
        if (!/[A-Z]/.test(pw)) return false
        if (!/[0-9]/.test(pw)) return false
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) return false
        return true
    }

    const resetStates = () => {
        setLoading(false)
        setOtp('')
        setPassword('')
        setConfirmPassword('')
        setCooldown(0)
        setEmailError('')
        setOtpVerified(false)
        setOtpError('')
        setOtpSent(false)
        setLoginError('')
        setPasswordTouched(false)
        setConfirmPasswordTouched(false)
        setPasswordErrorMsg('')
        setVerifiedToken('')
    }

    const goToForgotPassword = () => {
        setMode('forgot_password')
        setForgotStep('email')
        resetStates()
    }

    const goToSignup = () => {
        setMode('signup')
        setSignupStep('email')
        resetStates()
    }

    const goToLogin = () => {
        setMode('login')
        resetStates()
    }

    // Check if login button should be active
    const isLoginActive = email.trim() !== '' && password.trim() !== ''

    const handleKakaoLogin = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'kakao',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        prompt: 'login' // Force Kakao login screen even if another tab is logged in
                    }
                }
            })
            if (error) throw error
        } catch (error) {
            setLoginError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (loading) return

        if (!validateEmail(email)) {
            setEmailError('name@example.com 형식으로 입력해 주세요.')
            return
        }
        setEmailError('')
        setLoginError('')

        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error

            setEmail('')
            setPassword('')
        } catch (error) {
            let msg = error.error_description || error.message
            if (msg === 'Invalid login credentials') {
                msg = '이메일 또는 비밀번호가 잘못되었습니다.'
            }
            setLoginError(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleSignupEmailSubmit = async (e) => {
        e.preventDefault()
        if (loading) return

        if (!validateEmail(email)) {
            setEmailError('name@example.com 형식으로 입력해 주세요.')
            return
        }
        setEmailError('')

        if (cooldown > 0) return

        setLoading(true)
        try {
            const { error } = await authFetch('otp', {
                body: { email, create_user: true }
            })
            if (error) throw error
            onSignupStart()
            setSignupStep('otp_password')
            setOtpSent(true)
            setCooldown(60)
        } catch (error) {
            if (window.showToast) window.showToast(error.error_description || error.message || '인증 코드 전송에 실패했습니다.', 'error')
            else alert(error.error_description || error.message || '인증 코드 전송에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPasswordEmailSubmit = async (e) => {
        e.preventDefault()
        if (loading) return

        if (!validateEmail(email)) {
            setEmailError('name@example.com 형식으로 입력해 주세요.')
            return
        }
        setEmailError('')

        setLoading(true)
        try {
            const { error } = await authFetch('otp', {
                body: { email, create_user: false }
            })
            if (error) {
                if (error.status === 400 || error.message?.includes('not found')) {
                    setEmailError('등록되지 않은 이메일입니다. 회원가입을 진행해 주세요.')
                    return
                }
                throw error
            }
            setOtpSent(true)
            setCooldown(60)
        } catch (error) {
            if (window.showToast) window.showToast(error.error_description || error.message || '인증 코드 전송에 실패했습니다.', 'error')
            else alert(error.error_description || error.message || '인증 코드 전송에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (loading || otpVerified) return
        setOtpError('')
        setLoading(true)
        const payload = {
            email,
            token: otp,
            type: 'email'
        }
        console.log("handleVerifyOtp: Sending payload", payload)
        try {
            const { data, error } = await authFetch('verify', {
                body: payload
            })
            if (error) {
                setOtpError('코드를 다시 한번 확인해 주세요.')
                return
            }

            console.log("handleVerifyOtp: Response received", !!data)

            // Sync SDK session with the result (Non-blocking)
            if (data?.access_token && data?.refresh_token) {
                console.log("handleVerifyOtp: Tokens found, updating local state...")
                setVerifiedToken(data.access_token)

                // Fire and forget session sync to avoid SDK internal hangs blocking the UI
                supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token
                }).then(({ error: sessionError }) => {
                    if (sessionError) console.warn("handleVerifyOtp: Background setSession error", sessionError)
                    else console.log("handleVerifyOtp: Background session sync successful")
                }).catch(err => console.error("handleVerifyOtp: Background session sync crashed", err))
            } else {
                console.warn("handleVerifyOtp: Missing tokens in response data", data)
            }

            setOtpVerified(true)
            setOtpError('')

            if (mode === 'forgot_password') {
                setTimeout(() => setForgotStep('reset'), 1000)
            }
        } catch {
            setOtpError('코드를 다시 한번 확인해 주세요.')
        } finally {
            setLoading(false)
        }
    }

    const handleSignupComplete = async (e) => {
        e.preventDefault()
        console.log("handleSignupComplete: Triggered")
        if (loading) return

        console.log("handleSignupComplete: Validation states", {
            otpVerified,
            passwordValid: validatePassword(password),
            passwordsMatch: password === confirmPassword
        })

        if (!otpVerified || !validatePassword(password) || password !== confirmPassword) {
            console.warn("handleSignupComplete: Validation failed")
            return
        }

        setLoading(true)
        try {
            console.log("handleSignupComplete: Obtaining token...")

            // Prioritize local state to avoid SDK hangs
            let token = verifiedToken

            // Request SDK session in parallel but don't block if we already have a token
            if (!token) {
                console.log("handleSignupComplete: No local token, requesting from SDK...")
                const { data: sessionInfo } = await supabase.auth.getSession()
                token = sessionInfo?.session?.access_token
            } else {
                console.log("handleSignupComplete: Using local verifiedToken (fast-path)")
                // Update SDK session in background for future consistency
                supabase.auth.getSession().then(() => {
                    console.log("handleSignupComplete: Background session sync check completed")
                }).catch(() => { })
            }

            console.log("handleSignupComplete: Token check results", { hasToken: !!token })

            if (!token) {
                console.error("handleSignupComplete: No token found. Please re-verify.")
                if (window.showToast) window.showToast("인증 정보가 만료되었습니다. 다시 시도해 주세요.", 'error')
                else alert("인증 정보가 만료되었습니다. 다시 시도해 주세요.")
                setLoading(false)
                return
            }

            const { data: updateData, error: updateError } = await authFetch('user', {
                method: 'PUT',
                token: token,
                body: { password }
            })

            if (updateError) {
                // If password is already what we want, treat as success
                if (updateError.status === 422 && (updateError.code === 'same_password' || updateError.error_code === 'same_password')) {
                    console.log("handleSignupComplete: Password already set, proceeding to profile check...")
                } else {
                    console.error("handleSignupComplete: authFetch error", updateError)
                    throw updateError
                }
            }

            console.log("handleSignupComplete: Password update successful", updateData)
            const user = updateData?.user || updateData || (await supabase.auth.getUser())?.data?.user

            if (user?.id) {
                console.log("handleSignupComplete: Creating profile via dbFetch for", user.id)
                // Use native dbFetch to avoid SDK hangs during insert
                const { error: profileError } = await dbFetch('profiles', {
                    method: 'POST',
                    token: token,
                    body: {
                        id: user.id,
                        email: user.email,
                        credits: 100
                    }
                })

                if (profileError) {
                    // 23505 is unique violation, means profile already exists, which is fine
                    if (profileError.code === '23505' || profileError.status === 409) {
                        console.log("handleSignupComplete: Profile already exists")
                    } else {
                        console.error('handleSignupComplete: Failed to create profile:', profileError)
                    }
                } else {
                    console.log("handleSignupComplete: Profile created successfully")
                }
            }

            setLoading(false)
            if (window.showToast) window.showToast('회원가입이 완료되었습니다! 로그인을 진행해 주세요.')
            else if (showToast) showToast('회원가입이 완료되었습니다! 로그인을 진행해 주세요.')

            // Don't await signOut to avoid UI hangs
            supabase.auth.signOut().catch(err => console.error("SignOut error during signup redirect:", err))

            goToLogin()
            onSignupSuccess()
        } catch (error) {
            console.error("handleSignupComplete: Catch block", error)
            if (window.showToast) window.showToast(error.error_description || error.message || '회원가입 완료 중 오류가 발생했습니다.', 'error')
            else if (showToast) showToast(error.error_description || error.message || '회원가입 완료 중 오류가 발생했습니다.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (loading) return
        if (!validatePassword(password) || password !== confirmPassword) return

        setLoading(true)
        try {
            const token = verifiedToken || (await supabase.auth.getSession())?.data?.session?.access_token

            if (!token) {
                if (window.showToast) window.showToast("인증 정보가 만료되었습니다. 다시 로그인 해 주세요.", 'error')
                else alert("인증 정보가 만료되었습니다. 다시 로그인 해 주세요.")
                setLoading(false)
                return
            }

            const { error } = await authFetch('user', {
                method: 'PUT',
                token: token,
                body: { password }
            })
            if (error) {
                if (error.status === 422 && (error.code === 'same_password' || error.error_code === 'same_password')) {
                    console.log("handleResetPassword: Password already identical, treating as success")
                } else {
                    throw error
                }
            }
            setLoading(false)
            if (window.showToast) window.showToast('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주세요.')
            else if (showToast) showToast('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해 주세요.')
            goToLogin()
        } catch (error) {
            if (error.message?.includes('same as old') || error.error_code === 'same_password') {
                setPasswordErrorMsg('이전에 사용한 비밀번호입니다.')
            } else {
                if (window.showToast) window.showToast(error.error_description || error.message || '비밀번호 변경 중 오류가 발생했습니다.', 'error')
                else if (showToast) showToast(error.error_description || error.message || '비밀번호 변경 중 오류가 발생했습니다.', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    // Button states
    const isSignupCompleteActive = otpVerified && validatePassword(password) && password === confirmPassword
    const isResetPasswordActive = validatePassword(password) && password === confirmPassword

    // ==================== LOGIN MODE ====================
    if (mode === 'login') {
        const passwordInvalid = passwordTouched && password.length > 0 && !validatePassword(password)
        const emailInvalid = email.trim() !== '' && !validateEmail(email)

        return (
            <div className="auth-container-v2">
                <div className="itda-login-logo" onClick={onBack}>
                    <img src="/assets/Vector.png" alt="Symbol" className="symbol" />
                </div>

                <div className="auth-header-text-v2">
                    <p>잇다에 로그인하시면</p>
                    <p>다양한 서비스를 이용하실 수 있습니다.</p>
                </div>

                <div className="auth-card-v2">
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="auth-field-v2">
                            <label className="auth-label-v2">이메일</label>
                            <input
                                type="text"
                                className={`auth-input-v2 ${emailInvalid || emailError ? 'error' : ''}`}
                                placeholder="이메일을 입력하세요."
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setLoginError(''); }}
                            />
                            {(emailError || emailInvalid) && (
                                <div className="auth-error-msg-v2">
                                    <span className="error-icon">✕</span> {emailError || 'name@example.com 형식으로 입력해 주세요.'}
                                </div>
                            )}
                        </div>

                        <div className="auth-divider-v2">
                            <span>또는</span>
                        </div>

                        <button
                            type="button"
                            className="auth-social-btn-v2 kakao"
                            onClick={handleKakaoLogin}
                            disabled={loading}
                        >
                            <img src="/assets/kakao_icon.png" alt="Kakao" className="social-icon" />
                            카카오로 시작하기
                        </button>

                        <div className="auth-field-v2">
                            <label className="auth-label-v2">비밀번호</label>
                            <input
                                type="password"
                                className={`auth-input-v2 ${passwordInvalid || loginError ? 'error' : ''}`}
                                placeholder="비밀번호를 입력하세요."
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                                onBlur={() => setPasswordTouched(true)}
                            />
                            {(passwordInvalid || loginError) && (
                                <div className="auth-error-msg-v2">
                                    <span className="error-icon">✕</span> {loginError || '비밀번호는 대소문자, 숫자, 기호를 포함한 8~12자리입니다.'}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={`auth-btn-v2 ${isLoginActive && !passwordInvalid && !emailInvalid ? 'active' : ''}`}
                            disabled={loading}
                        >
                            {loading ? '처리 중...' : '로그인하기'}
                        </button>
                    </form>


                    <div className="auth-bottom-links-v2">
                        <span className="link-dark" onClick={goToForgotPassword}>비밀번호 찾기</span>
                        <span className="link-lime" onClick={goToSignup}>회원가입</span>
                    </div>
                </div>

                <div className="auth-footer-copyright">
                    © LifeScape, Inc. All rights reserved.
                </div>
            </div>
        )
    }

    // ==================== FORGOT PASSWORD MODE ====================
    if (mode === 'forgot_password') {
        const passwordInvalidReset = passwordTouched && password.length > 0 && !validatePassword(password)
        const passwordsMismatchReset = confirmPasswordTouched && confirmPassword.length > 0 && password !== confirmPassword

        return (
            <div className="auth-container-v2">
                <div className="itda-login-logo" onClick={onBack}>
                    <img src="/assets/Vector.png" alt="Symbol" className="symbol" />
                </div>

                <div className="auth-header-text-v2">
                    {forgotStep === 'email' ? (
                        <>
                            <p>비밀번호 재설정을 위해</p>
                            <p>이메일을 인증해 주세요.</p>
                        </>
                    ) : (
                        <p>새로 사용할 비밀번호를 입력해 주세요.</p>
                    )}
                </div>

                <div className="auth-card-v2">
                    {forgotStep === 'email' ? (
                        <form onSubmit={handleForgotPasswordEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="auth-field-v2">
                                <label className="auth-label-v2">이메일</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className={`auth-input-v2 ${emailError ? 'error' : ''}`}
                                        placeholder="이메일을 입력하세요."
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                    />
                                    <button
                                        type="submit"
                                        className={`itda-btn-lime ${email.trim() && validateEmail(email) ? 'active' : ''}`}
                                        style={{ width: '100px', borderRadius: '12px' }}
                                        disabled={loading || cooldown > 0}
                                    >
                                        {cooldown > 0 ? '재전송' : '전송'}
                                    </button>
                                </div>
                                {emailError && (
                                    <div className="auth-error-msg-v2">
                                        <span className="error-icon">✕</span> {emailError}
                                    </div>
                                )}
                                {otpSent && !emailError && (
                                    <div className="auth-error-msg-v2" style={{ color: '#2e7d32' }}>
                                        ✓ 인증 코드가 전송되었습니다.
                                    </div>
                                )}
                            </div>

                            <div className="auth-field-v2">
                                <label className="auth-label-v2">인증 코드</label>
                                <input
                                    type="text"
                                    className={`auth-input-v2 ${otpError ? 'error' : ''}`}
                                    placeholder="인증 코드 5자리를 입력하세요."
                                    value={otp}
                                    onChange={(e) => { setOtp(e.target.value); setOtpError(''); }}
                                    maxLength={8}
                                />
                                {otpError && (
                                    <div className="auth-error-msg-v2">
                                        <span className="error-icon">✕</span> {otpError}
                                    </div>
                                )}
                            </div>

                            {!otpVerified && otp.length >= 4 && (
                                <button type="button" className="auth-btn-v2 active" onClick={handleVerifyOtp} disabled={loading}>
                                    코드 확인
                                </button>
                            )}

                            <div className="auth-bottom-links-v2" style={{ justifyContent: 'center', gap: '40px' }}>
                                <span className="link-dark" onClick={goToLogin}>로그인</span>
                                <span className="link-lime" onClick={goToSignup}>회원가입</span>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="auth-field-v2">
                                <label className="auth-label-v2">비밀번호</label>
                                <input
                                    type="password"
                                    className={`auth-input-v2 ${passwordInvalidReset || passwordErrorMsg ? 'error' : ''}`}
                                    placeholder="비밀번호를 입력하세요."
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setPasswordErrorMsg(''); }}
                                    onBlur={() => setPasswordTouched(true)}
                                />
                                {(passwordInvalidReset || passwordErrorMsg) && (
                                    <div className="auth-error-msg-v2">
                                        <span className="error-icon">✕</span> {passwordErrorMsg || '비밀번호는 대소문자, 숫자, 기호를 포함한 8~12자리입니다.'}
                                    </div>
                                )}
                            </div>

                            <div className="auth-field-v2">
                                <label className="auth-label-v2">비밀번호 재입력</label>
                                <input
                                    type="password"
                                    className={`auth-input-v2 ${passwordsMismatchReset ? 'error' : ''}`}
                                    placeholder="비밀번호를 다시 입력하세요."
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onBlur={() => setConfirmPasswordTouched(true)}
                                />
                                {passwordsMismatchReset && (
                                    <div className="auth-error-msg-v2">
                                        <span className="error-icon">✕</span> 비밀번호가 다릅니다. 다시 입력해 주세요.
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={`auth-btn-v2 ${isResetPasswordActive ? 'active' : ''}`}
                                disabled={loading}
                            >
                                {loading ? '처리 중...' : '설정 완료'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="auth-footer-copyright">
                    © LifeScape, Inc. All rights reserved.
                </div>
            </div>
        )
    }

    // ==================== SIGNUP MODE ====================
    const signupEmailInvalid = email.trim() !== '' && !validateEmail(email)

    return (
        <div className="auth-container-v2">
            <div className="itda-login-logo" onClick={onBack}>
                <img src="/assets/Vector.png" alt="Symbol" className="symbol" />
            </div>

            {signupStep === 'email' ? (
                <>
                    <div className="auth-header-text-v2">
                        <p>잇다의 서비스 사용이 처음이신가요?</p>
                        <p>회원가입 후 서비스를 이용해 보세요.</p>
                    </div>

                    <div className="auth-card-v2">
                        <form onSubmit={handleSignupEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="auth-field-v2">
                                <label className="auth-label-v2">이메일</label>
                                <input
                                    type="text"
                                    className={`auth-input-v2 ${signupEmailInvalid || emailError ? 'error' : ''}`}
                                    placeholder="이메일을 입력하세요."
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                />
                                {(emailError || signupEmailInvalid) && (
                                    <div className="auth-error-msg-v2">
                                        <span className="error-icon">✕</span> {emailError || 'name@example.com 형식으로 입력해 주세요.'}
                                    </div>
                                )}
                            </div>

                            <div className="auth-divider-v2">
                                <span>또는</span>
                            </div>

                            <button
                                type="button"
                                className="auth-social-btn-v2 kakao"
                                onClick={handleKakaoLogin}
                                disabled={loading}
                            >
                                <img src="/assets/kakao_icon.png" alt="Kakao" className="social-icon" />
                                카카오로 시작하기
                            </button>

                            <button
                                type="submit"
                                className={`auth-btn-v2 ${email.trim() && validateEmail(email) ? 'active' : ''}`}
                                disabled={loading || cooldown > 0}
                            >
                                {loading ? '처리 중...' : cooldown > 0 ? `${cooldown}초 후 재전송` : '인증 코드 전송하기'}
                            </button>
                        </form>

                        <div className="auth-terms-notice-v2">
                            회원가입 시 <span className="terms-link">서비스 이용 약관</span>에 동의하는 것으로 간주합니다.
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="auth-header-text-v2">
                        <p>계정 생성을 위해</p>
                        <p>정보를 입력해 주세요.</p>
                    </div>

                    <div className="auth-card-v2">
                        <form onSubmit={handleSignupComplete} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="auth-field-v2">
                                <label className="auth-label-v2">이메일</label>
                                <input type="text" className="auth-input-v2" value={email} readOnly />
                            </div>

                            <div className="auth-field-v2">
                                <label className="auth-label-v2">인증 코드</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className={`auth-input-v2 ${otpError ? 'error' : ''}`}
                                        placeholder="인증 코드 5자리를 입력하세요."
                                        value={otp}
                                        onChange={(e) => { setOtp(e.target.value); setOtpError(''); }}
                                        maxLength={8}
                                        disabled={otpVerified}
                                    />
                                    {!otpVerified && (
                                        <button
                                            type="button"
                                            className={`itda-btn-lime ${otp.length >= 4 ? 'active' : ''}`}
                                            style={{ width: '100px', borderRadius: '12px', opacity: otp.length >= 4 ? 1 : 0.5 }}
                                            onClick={handleVerifyOtp}
                                            disabled={loading}
                                        >
                                            확인
                                        </button>
                                    )}
                                </div>
                                {otpVerified && <div className="auth-error-msg-v2" style={{ color: '#2e7d32' }}>✓ 인증이 완료되었습니다.</div>}
                                {otpError && <div className="auth-error-msg-v2"><span className="error-icon">✕</span> {otpError}</div>}
                            </div>

                            <div className="auth-field-v2">
                                <label className="auth-label-v2">비밀번호</label>
                                <input
                                    type="password"
                                    className={`auth-input-v2 ${passwordTouched && password.length > 0 && !validatePassword(password) ? 'error' : ''}`}
                                    placeholder="비밀번호 (대/소문자, 숫자, 특수문자 포함 8-12자)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => setPasswordTouched(true)}
                                />
                                {passwordTouched && password.length > 0 && !validatePassword(password) && (
                                    <div className="auth-error-msg-v2">
                                        <span className="error-icon">✕</span> 비밀번호는 영문 대/소문자, 숫자, 특수문자를 모두 포함하여 8~12자리여야 합니다.
                                    </div>
                                )}
                            </div>

                            <div className="auth-field-v2">
                                <label className="auth-label-v2">비밀번호 재입력</label>
                                <input
                                    type="password"
                                    className={`auth-input-v2 ${confirmPasswordTouched && confirmPassword.length > 0 && password !== confirmPassword ? 'error' : ''}`}
                                    placeholder="비밀번호 재확인"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onBlur={() => setConfirmPasswordTouched(true)}
                                />
                                {confirmPasswordTouched && confirmPassword.length > 0 && password !== confirmPassword && (
                                    <div className="auth-error-msg-v2"><span className="error-icon">✕</span> 비밀번호가 다릅니다. 다시 입력해 주세요.</div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={`auth-btn-v2 ${isSignupCompleteActive ? 'active' : ''}`}
                                disabled={loading}
                            >
                                회원가입 완료
                            </button>
                        </form>
                    </div>
                </>
            )}

            <div className="auth-footer-copyright">
                © LifeScape, Inc. All rights reserved.
            </div>
        </div>
    )
}
