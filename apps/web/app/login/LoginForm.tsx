'use client'

import { useState } from 'react'
import { login, signup, signInWithGoogle } from './actions'
import './login.css'

export default function LoginForm({ message }: { message?: string }) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [isLoading, setIsLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            if (mode === 'signin') {
                await login(formData)
            } else {
                await signup(formData)
            }
        } catch {
            // redirect throws, which is expected
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogle() {
        setGoogleLoading(true)
        try {
            await signInWithGoogle()
        } catch {
            // redirect throws
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb login-bg-orb-1" />
                <div className="login-bg-orb login-bg-orb-2" />
                <div className="login-bg-orb login-bg-orb-3" />
            </div>

            <div className="login-container">
                {/* Left branding panel */}
                <div className="login-branding">
                    <div className="login-branding-content">
                        <div className="login-logo">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <rect width="48" height="48" rx="12" fill="url(#logo-gradient)" />
                                <path d="M14 32L20 18L26 26L32 14L38 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10 36H38" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                                <defs>
                                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48">
                                        <stop stopColor="#10B981" />
                                        <stop offset="1" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h1 className="login-brand-title">EasyToTrade</h1>
                        <p className="login-brand-subtitle">Master the markets with expert-led courses and real-time trading insights</p>
                        <div className="login-features">
                            <div className="login-feature">
                                <div className="login-feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <span>Live Market Analysis</span>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                </div>
                                <span>Expert-Led Courses</span>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <span>Risk-Free Practice</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="login-form-panel">
                    <div className="login-form-wrapper">
                        <div className="login-form-header">
                            <h2 className="login-form-title">
                                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                            </h2>
                            <p className="login-form-desc">
                                {mode === 'signin'
                                    ? 'Enter your credentials to access your account'
                                    : 'Start your trading journey today'}
                            </p>
                        </div>

                        {/* Tab switcher */}
                        <div className="login-tabs">
                            <button
                                type="button"
                                className={`login-tab ${mode === 'signin' ? 'login-tab-active' : ''}`}
                                onClick={() => setMode('signin')}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                className={`login-tab ${mode === 'signup' ? 'login-tab-active' : ''}`}
                                onClick={() => setMode('signup')}
                            >
                                Sign Up
                            </button>
                        </div>

                        {/* Google OAuth */}
                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={googleLoading}
                            className="login-google-btn"
                        >
                            {googleLoading ? (
                                <div className="login-spinner" />
                            ) : (
                                <svg className="login-google-icon" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        <div className="login-divider">
                            <div className="login-divider-line" />
                            <span className="login-divider-text">or continue with email</span>
                            <div className="login-divider-line" />
                        </div>

                        {/* Form */}
                        <form action={handleSubmit} className="login-form">
                            {mode === 'signup' && (
                                <div className="login-field">
                                    <label htmlFor="fullName" className="login-label">Full Name</label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        required={mode === 'signup'}
                                        className="login-input"
                                    />
                                </div>
                            )}

                            <div className="login-field">
                                <label htmlFor="email" className="login-label">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="login-input"
                                />
                            </div>

                            <div className="login-field">
                                <label htmlFor="password" className="login-label">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="login-input"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="login-submit-btn"
                            >
                                {isLoading ? (
                                    <div className="login-spinner login-spinner-light" />
                                ) : (
                                    mode === 'signin' ? 'Sign In' : 'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Message */}
                        {message && (
                            <div className={`login-message ${message.includes('Check email') ? 'login-message-success' : 'login-message-error'}`}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {message.includes('Check email') ? (
                                        <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
                                    ) : (
                                        <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                                    )}
                                </svg>
                                <span>{message}</span>
                            </div>
                        )}

                        <p className="login-footer-text">
                            {mode === 'signin' ? (
                                <>Don&apos;t have an account?{' '}
                                    <button type="button" onClick={() => setMode('signup')} className="login-switch-link">
                                        Sign up for free
                                    </button>
                                </>
                            ) : (
                                <>Already have an account?{' '}
                                    <button type="button" onClick={() => setMode('signin')} className="login-switch-link">
                                        Sign in
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
