import { useState, useEffect } from 'react'
import { T } from '../../design/pages/auth/designTokens.js'
import ParticleBackground from '../../components/ParticleBackground.jsx'
import AuthNav from '../../components/pages/auth/AuthNav.jsx'
import AuthInput from '../../components/pages/auth/AuthInput.jsx'
import AuthButton from '../../components/pages/auth/AuthButton.jsx'
import { navigateTo } from '../../utils/navigation.js'
import { onboarding, getFacebookAuthUrl } from '../../api/auth.js'
import { isAuthenticated, request } from '../../api/client.js'
import '../../styles/pages/auth/auth.css'

export default function SignUpPage({ onNavigate }) {
  const [step, setStep] = useState(() => isAuthenticated() ? 'onboarding' : 'signup')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Redirect already-onboarded users straight to dashboard (prevents double-submit loops)
  useEffect(() => {
    if (!isAuthenticated()) return
    request('/api/clients/me/')
      .then(data => { if (data?.is_onboarded) { if (onNavigate) onNavigate('dashboard'); else navigateTo('dashboard') } })
      .catch(() => {})
  }, [])

  const [onboardingData, setOnboardingData] = useState({
    businessNiche: '',
    monthlyAdSpend: '',
    teamSize: '',
    primaryGoal: '',
    phoneNumber: '',
    website: '',
  })

  const handleOnboardingChange = (e) => {
    const { name, value } = e.target
    setOnboardingData(prev => ({ ...prev, [name]: value }))
  }

  const handleFacebookSignUp = async () => {
    if (!agreedToTerms) {
      setErrors({ terms: 'You must agree to the terms and conditions' })
      return
    }
    setIsLoading(true)
    setErrors({})
    try {
      const data = await getFacebookAuthUrl()
      window.location.href = data.auth_url
    } catch {
      setErrors({ general: 'Could not initiate Facebook login. Please try again.' })
      setIsLoading(false)
    }
  }

  const validateOnboarding = () => {
    const newErrors = {}
    if (!onboardingData.businessNiche.trim()) newErrors.businessNiche = 'Business niche is required'
    if (!onboardingData.monthlyAdSpend) newErrors.monthlyAdSpend = 'Please select your monthly ad spend'
    if (!onboardingData.primaryGoal) newErrors.primaryGoal = 'Please select your primary goal'
    if (!onboardingData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    return newErrors
  }

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateOnboarding()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setIsLoading(true)
    setErrors({})
    try {
      await onboarding(onboardingData)
      if (onNavigate) onNavigate('dashboard')
      else navigateTo('dashboard')
    } catch (err) {
      const msg = err?.detail || 'Failed to save your information. Please try again.'
      setErrors({ general: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <ParticleBackground />
      <AuthNav isSignUp={true} />

      <div className="auth-container" style={{ paddingTop: '5rem', paddingBottom: '2rem' }}>
        <div className="auth-wrapper">
          {/* Left Side */}
          <div className="auth-content">
            <h1>
              Connect Your <span>Facebook Page</span> &amp;
              <br />
              Let AI Handle Your Customers
            </h1>
            <p>
              Link your business Facebook page in seconds. Our AI will automatically reply to customer messages 24/7 — no
              manual work, no missed leads.
            </p>

            <div className="auth-benefits">
              <div className="auth-benefit">
                <div className="auth-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                    <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="auth-benefit-text">
                  <h3>Your Page Stays Yours</h3>
                  <p>We only request the permissions needed to read &amp; reply to messages — nothing else.</p>
                </div>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className="auth-benefit-text">
                  <h3>Live in Under 5 Minutes</h3>
                  <p>Connect your page, tell us about your business, and your AI agent goes live instantly.</p>
                </div>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-icon">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <line x1="9" y1="10" x2="15" y2="10" />
                    <line x1="9" y1="14" x2="13" y2="14" />
                  </svg>
                </div>
                <div className="auth-benefit-text">
                  <h3>AI Trained on Your Business</h3>
                  <p>Responds using your tone, products, and FAQs — feels like a real team member.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="auth-form-container">
            <div className="auth-form-box" style={{ maxWidth: '100%' }}>

              {step === 'signup' && (
                <>
                  <h2>Create Your Account</h2>
                  <p className="auth-form-subtitle">Start your free 30-day trial — one click with Facebook</p>

                  <div
                    style={{
                      background: `linear-gradient(160deg, ${T.surface3} 0%, rgba(17,29,48,0.6) 100%)`,
                      border: `1px solid ${T.border}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'grid', gap: '0.85rem' }}>
                      {[
                        { step: '1', text: 'Connect your Facebook Page' },
                        { step: '2', text: 'Approve messaging permissions' },
                        { step: '3', text: "We'll handle the rest" },
                      ].map(({ step: stepNumber, text }) => (
                        <div key={stepNumber} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${T.orange}, ${T.orange}cc)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {stepNumber}
                          </div>
                          <span style={{ fontSize: '0.9rem', color: T.text }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="auth-checkbox" style={{ marginBottom: '1.25rem' }}>
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked)
                        if (e.target.checked) setErrors(prev => ({ ...prev, terms: undefined }))
                      }}
                      className="checkbox-input"
                    />
                    <label htmlFor="terms">
                      I agree to the{' '}
                      <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                    </label>
                  </div>

                  {errors.terms && (
                    <div className="auth-error" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="7" y1="3.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                      </svg>
                      {errors.terms}
                    </div>
                  )}

                  {errors.general && (
                    <div className="auth-error" style={{ marginBottom: '1.5rem', color: T.error }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="7" y1="3.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                      </svg>
                      {errors.general}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleFacebookSignUp}
                    disabled={isLoading}
                    className="facebook-login-btn"
                  >
                    {isLoading ? (
                      <span>Connecting...</span>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Continue with Facebook
                      </>
                    )}
                  </button>

                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: T.muted,
                      textAlign: 'center',
                      marginTop: '-0.75rem',
                      lineHeight: '1.5',
                    }}
                  >
                    We request only <strong>pages_messaging</strong> &amp; <strong>pages_show_list</strong> permissions.
                    We never post on your behalf or access your personal account data.
                  </p>

                  <div className="auth-footer">
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('signin') }}>
                      Sign in here
                    </a>
                  </div>
                </>
              )}

              {step === 'onboarding' && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span style={{ fontSize: '0.875rem', color: '#22c55e', fontWeight: '500' }}>Connected</span>
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem 0' }}>Tell Us About Your Business</h2>
                    <p className="auth-form-subtitle">Help us customize your automation experience</p>
                  </div>

                  {errors.general && (
                    <div className="auth-error" style={{ marginBottom: '1.5rem', color: T.error }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="7" y1="3.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                      </svg>
                      {errors.general}
                    </div>
                  )}

                  <form onSubmit={handleOnboardingSubmit}>
                    <div className="auth-form-group" style={{ marginBottom: '1rem' }}>
                      <label className="auth-label">
                        Business Niche / Industry
                        <span style={{ color: T.orange }}>*</span>
                      </label>
                      <select
                        name="businessNiche"
                        value={onboardingData.businessNiche}
                        onChange={handleOnboardingChange}
                        className={`auth-input ${errors.businessNiche ? 'error' : ''}`}
                        style={{
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7a94' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                          paddingRight: '32px',
                        }}
                      >
                        <option value="">Select your niche...</option>
                        <option value="fashion">Fashion &amp; Apparel</option>
                        <option value="beauty">Beauty &amp; Cosmetics</option>
                        <option value="electronics">Electronics &amp; Gadgets</option>
                        <option value="home">Home &amp; Garden</option>
                        <option value="health">Health &amp; Wellness</option>
                        <option value="food">Food &amp; Beverages</option>
                        <option value="pets">Pet Supplies</option>
                        <option value="toys">Toys &amp; Games</option>
                        <option value="sports">Sports &amp; Outdoors</option>
                        <option value="jewelry">Jewelry &amp; Accessories</option>
                        <option value="digital">Digital Products</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.businessNiche && (
                        <div className="auth-error">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="7" y1="3.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                          </svg>
                          {errors.businessNiche}
                        </div>
                      )}
                    </div>

                    <div className="auth-form-group" style={{ marginBottom: '1rem' }}>
                      <label className="auth-label">
                        Monthly Meta Ad Spend
                        <span style={{ color: T.orange }}>*</span>
                      </label>
                      <select
                        name="monthlyAdSpend"
                        value={onboardingData.monthlyAdSpend}
                        onChange={handleOnboardingChange}
                        className={`auth-input ${errors.monthlyAdSpend ? 'error' : ''}`}
                        style={{
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7a94' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                          paddingRight: '32px',
                        }}
                      >
                        <option value="">Select range...</option>
                        <option value="0-10">$0 - $10 / mo</option>
                        <option value="10-30">$10 - $30 / mo</option>
                        <option value="30-100">$30 - $100 / mo</option>
                        <option value="100-150">$100 - $150 / mo</option>
                        <option value="150+">$150+ / mo</option>
                      </select>
                      {errors.monthlyAdSpend && (
                        <div className="auth-error">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="7" y1="3.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                          </svg>
                          {errors.monthlyAdSpend}
                        </div>
                      )}
                    </div>

                    <div className="auth-form-group" style={{ marginBottom: '1rem' }}>
                      <label className="auth-label">
                        Primary Automation Goal
                        <span style={{ color: T.orange }}>*</span>
                      </label>
                      <select
                        name="primaryGoal"
                        value={onboardingData.primaryGoal}
                        onChange={handleOnboardingChange}
                        className={`auth-input ${errors.primaryGoal ? 'error' : ''}`}
                        style={{
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7a94' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                          paddingRight: '32px',
                        }}
                      >
                        <option value="">Select your goal...</option>
                        <option value="leads">Capture &amp; Qualify Leads</option>
                        <option value="sales">Drive Direct Sales</option>
                        <option value="find_buyers">Find Buyers &amp; Grow Reach</option>
                        <option value="support">Customer Support Automation</option>
                        <option value="retargeting">Retargeting &amp; Follow-ups</option>
                        <option value="abandoned">Abandoned Cart Recovery</option>
                        <option value="all">All of the Above</option>
                      </select>
                      {errors.primaryGoal && (
                        <div className="auth-error">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="7" y1="3.5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                          </svg>
                          {errors.primaryGoal}
                        </div>
                      )}
                    </div>

                    <div className="auth-form-group" style={{ marginBottom: '1rem' }}>
                      <label className="auth-label">Team Size</label>
                      <select
                        name="teamSize"
                        value={onboardingData.teamSize}
                        onChange={handleOnboardingChange}
                        className="auth-input"
                        style={{
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7a94' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                          paddingRight: '32px',
                        }}
                      >
                        <option value="">Select team size...</option>
                        <option value="solo">Just Me</option>
                        <option value="2-5">2 - 5 people</option>
                        <option value="6-15">6 - 15 people</option>
                        <option value="16-50">16 - 50 people</option>
                        <option value="50+">50+ people</option>
                      </select>
                    </div>

                    <AuthInput
                      label="Phone Number"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      name="phoneNumber"
                      value={onboardingData.phoneNumber}
                      onChange={handleOnboardingChange}
                      error={errors.phoneNumber}
                      required
                    />

                    <AuthInput
                      label={
                        <>
                          Website / Store URL{' '}
                          <span style={{ color: T.muted, fontWeight: '400' }}>(Optional)</span>
                        </>
                      }
                      type="url"
                      placeholder="https://yourstore.com"
                      name="website"
                      value={onboardingData.website}
                      onChange={handleOnboardingChange}
                    />

                    <AuthButton type="submit" isLoading={isLoading}>
                      Complete Setup &amp; Go to Dashboard
                    </AuthButton>
                  </form>

                  <div className="auth-footer">
                    <a href="#" onClick={(e) => { e.preventDefault(); setErrors({}); setStep('signup') }}>
                      Back
                    </a>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
