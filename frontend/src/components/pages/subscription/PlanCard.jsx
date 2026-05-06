import { useState } from 'react'
import { T } from '../../../design/pages/subscription/designTokens.js'
import { CheckIcon, CrossIcon } from './Icons.jsx'
import { formatDA, toDzd } from '../../../utils/pages/subscription/money.js'
import { navigateTo } from '../../../utils/navigation.js'

export default function PlanCard({ plan, billing, idx, onCta }) {
  const [hovered, setHovered] = useState(false)
  const priceUsd = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const priceDzd = toDzd(priceUsd)
  const promoDzd = Math.round(priceDzd * 0.8)

  return (
    <div
      className={plan.popular ? 'plan-popular' : ''}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: plan.popular
          ? `linear-gradient(160deg, ${T.surface2} 0%, rgba(0,212,255,0.04) 100%)`
          : T.surface,
        border: `1px solid ${plan.popular ? 'rgba(0,212,255,0.3)' : hovered ? T.borderHover : T.border}`,
        borderRadius: 20,
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform .3s, border-color .3s',
        transform: plan.popular ? 'scale(1.04)' : hovered ? 'translateY(-4px)' : 'none',
        animation: `fadeup .8s ${idx * 0.12 + 0.1}s ease both`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${plan.glow}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {plan.popular ? (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: T.cyan,
            color: T.bg,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '.65rem',
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            padding: '.25rem .7rem',
            borderRadius: 100,
          }}
        >
          Most Popular
        </div>
      ) : null}

      <div style={{ marginBottom: '1.6rem' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            marginBottom: '1rem',
            background: `rgba(${plan.color === T.cyan ? '0,212,255' : '255,107,43'},0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {plan.id === 'starter' ? (
              <path
                d="M10 2L12.5 7.5H18L13.5 11L15.5 17L10 13.5L4.5 17L6.5 11L2 7.5H7.5L10 2Z"
                stroke={plan.color}
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
            ) : plan.id === 'growth' ? (
              <>
                <path
                  d="M3 17l4-4 4 3 4-7 4 8"
                  stroke={plan.color}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={3} cy={17} r={1.5} fill={plan.color} />
                <circle cx={17} cy={10} r={1.5} fill={plan.color} />
              </>
            ) : (
              <>
                <circle cx={10} cy={10} r={7} stroke={plan.color} strokeWidth={1.4} />
                <path
                  d="M10 6v4l3 2"
                  stroke={plan.color}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </div>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-.02em',
            marginBottom: '.3rem',
            color: T.text,
          }}
        >
          {plan.name}
        </h3>
        <p style={{ fontSize: '.82rem', color: T.muted, fontWeight: 300 }}>{plan.tagline}</p>
      </div>

      <div
        style={{
          marginBottom: '1.5rem',
          paddingBottom: '1.5rem',
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.3rem' }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '2.8rem',
              fontWeight: 800,
              color: plan.color,
              letterSpacing: '-.04em',
              lineHeight: 1,
            }}
          >
            {formatDA(priceDzd)}
          </span>
          <span style={{ fontSize: '.85rem', color: T.muted }}>/ mo</span>
        </div>
        {billing === 'annual' ? (
          <div style={{ fontSize: '.75rem', color: T.green, marginTop: '.3rem', fontWeight: 500 }}>
            ↓ Save {formatDA(toDzd((plan.monthlyPrice - plan.annualPrice) * 12))}/year
          </div>
        ) : null}
        {billing === 'monthly' && plan.id === 'starter' ? (
          <div style={{ marginTop: '.45rem', fontSize: '.75rem', color: T.green, fontWeight: 500 }}>
            1st month free • then {formatDA(promoDzd)}/mo for 2 months (20% off)
          </div>
        ) : null}
        <div
          style={{
            marginTop: '.9rem',
            background: `rgba(${plan.color === T.cyan ? '0,212,255' : '255,107,43'},0.07)`,
            border: `1px solid rgba(${plan.color === T.cyan ? '0,212,255' : '255,107,43'},0.15)`,
            borderRadius: 8,
            padding: '.45rem .8rem',
            fontSize: '.75rem',
            color: plan.color,
            fontWeight: 500,
            display: 'inline-block',
          }}
        >
          {plan.group}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '.65rem',
          marginBottom: '1.8rem',
        }}
      >
        {plan.features.map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '.6rem' }}>
            {feature.ok ? <CheckIcon color={plan.color} /> : <CrossIcon />}
            <span
              style={{
                fontSize: '.83rem',
                color: feature.ok ? T.text : T.muted,
                fontWeight: feature.ok ? 400 : 300,
                lineHeight: 1.5,
              }}
            >
              {feature.label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        style={{
          width: '100%',
          background: plan.popular
            ? `linear-gradient(135deg, ${T.cyan}, ${T.cyanDim})`
            : plan.id === 'pro'
              ? `linear-gradient(135deg, ${T.orange}, #cc4f1a)`
              : 'transparent',
          border: `1px solid ${plan.popular ? 'transparent' : plan.id === 'pro' ? 'transparent' : T.border}`,
          color: plan.popular || plan.id === 'pro' ? T.bg : T.text,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '.88rem',
          padding: '.85rem',
          borderRadius: 10,
          letterSpacing: '.02em',
          transition: 'all .25s',
          boxShadow: plan.popular ? '0 0 28px rgba(0,212,255,0.25)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (plan.popular) {
            e.currentTarget.style.boxShadow = '0 0 40px rgba(0,212,255,0.4)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          } else if (plan.id === 'pro') {
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255,107,43,0.3)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          } else {
            e.currentTarget.style.borderColor = T.cyan
            e.currentTarget.style.color = T.cyan
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = plan.popular ? '0 0 28px rgba(0,212,255,0.25)' : 'none'
          e.currentTarget.style.transform = 'none'
          if (!plan.popular && plan.id !== 'pro') {
            e.currentTarget.style.borderColor = T.border
            e.currentTarget.style.color = T.text
          }
        }}
        onClick={() => onCta ? onCta() : navigateTo('signup')}
      >
        {plan.id === 'starter' ? 'Start Free Trial' : plan.id === 'growth' ? 'Get Growth' : 'Go Pro →'}
      </button>
    </div>
  )
}
