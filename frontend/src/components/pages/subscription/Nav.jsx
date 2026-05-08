import { T } from '../../../design/pages/subscription/designTokens.js'
import { hrefForPage, navigateTo } from '../../../utils/navigation.js'
import { isAuthenticated } from '../../../api/client.js'

export default function Nav({ scrolled }) {
  const loggedIn = isAuthenticated()
  const linkStyle = {
    color: T.muted,
    fontSize: '.88rem',
    transition: 'color .2s',
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 100,
        padding: '1rem 0',
        background: scrolled ? 'rgba(4,8,15,0.94)' : 'rgba(4,8,15,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? T.border : 'rgba(26,37,64,0.5)'}`,
        transition: 'all .3s',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href={hrefForPage('home')}
          onClick={(e) => {
            e.preventDefault()
            navigateTo('home')
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}
        >
          <svg width={30} height={30} viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width={32} height={32} rx={8} fill="rgba(0,212,255,0.08)" />
            <path
              d="M8 16L14 10L20 16L26 10"
              stroke={T.cyan}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 22L14 16L20 22L26 16"
              stroke={T.orange}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={16} cy={16} r={2.5} fill={T.cyan} />
          </svg>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '1.1rem',
              color: T.text,
            }}
          >
            Ecom<span style={{ color: T.cyan }}>Auto</span>
          </span>
        </a>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a
            href={hrefForPage('home')}
            onClick={(e) => {
              e.preventDefault()
              navigateTo('home')
            }}
            style={linkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            Home
          </a>
          <a
            href="#compare"
            style={linkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            Compare
          </a>
          <a
            href="#faq"
            style={linkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = T.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
          >
            FAQ
          </a>
          <a
            href={hrefForPage(loggedIn ? 'dashboard' : 'signup')}
            onClick={(e) => {
              e.preventDefault()
              navigateTo(loggedIn ? 'dashboard' : 'signup')
            }}
            style={{
              background: T.cyan,
              color: T.bg,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '.82rem',
              padding: '.5rem 1.2rem',
              borderRadius: 6,
              letterSpacing: '.02em',
              transition: 'all .2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00eeff'
              e.currentTarget.style.boxShadow = `0 0 22px ${T.cyanGlow}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.cyan
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {loggedIn ? 'Dashboard →' : 'Get Started →'}
          </a>
        </div>
      </div>
    </nav>
  )
}
