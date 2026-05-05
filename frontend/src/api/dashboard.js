import { request } from './client.js'

// ── Raw API calls ──────────────────────────────────────────────────────────────

export const fetchProfile = () => request('/api/clients/me/')
export const fetchProducts = () => request('/api/products/')
export const fetchConversations = (sentiment) =>
  request(`/api/conversations/${sentiment ? `?sentiment=${sentiment}` : ''}`)
export const fetchActivity = () => request('/api/clients/me/activity/')

export const createProduct = (data) =>
  request('/api/products/', { method: 'POST', body: JSON.stringify(data) })

export const deleteProduct = (id) =>
  request(`/api/products/${id}/`, { method: 'DELETE' })

export const toggleProductStatus = (id) =>
  request(`/api/products/${id}/status/`, { method: 'PATCH' })

// ── Transformers — map API shapes to what the UI expects ──────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ACTION_COLOR_MAP = {
  conversation_started: '#00d4ff',
  message_sent:         '#00d4ff',
  product_added:        '#ff6b2b',
  product_updated:      '#ff6b2b',
  product_deleted:      '#f05f5f',
  ai_description:       '#9b64ff',
  page_connected:       '#3ecf8e',
  page_disconnected:    '#f05f5f',
  code_verified:        '#9b64ff',
  plan_upgraded:        '#3ecf8e',
  group_assigned:       '#6b7a94',
}

export function transformProfile(data) {
  const group = data.group
  const sub = data.subscription
  const usage = data.usage || {}
  const auto = data.automation_status || {}

  return {
    name: data.company_name || `${data.first_name} ${data.last_name}`.trim() || 'My Store',
    email: data.email,
    plan: data.plan?.display || 'Starter',
    planName: data.plan?.name || 'starter',
    useCode: data.use_code || '—',
    group: group ? `Group ${group.name}` : '—',
    groupSlot: group ? `${group.current_count} / ${group.capacity}` : '0 / 0',
    renewal: sub?.current_period_end ? formatDate(sub.current_period_end) : '—',
    msgsUsed: usage.messages_sent || 0,
    msgsLimit: usage.messages_limit || 2000,
    conversations: usage.conversations || 0,
    joinedAt: formatDate(data.created_at),
    codeStatus: 'active',
    automation: {
      aiAgent: auto.ai_agent || 'offline',
      pageConnected: auto.facebook_page_connected || false,
      messageHandler: auto.message_handler || 'idle',
      groupUsed: auto.group_capacity_used || 0,
      groupMax: auto.group_capacity_max || 0,
    },
  }
}

export function transformProducts(data) {
  const results = data?.results ?? (Array.isArray(data) ? data : [])
  return results.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price != null ? `${Number(p.price).toLocaleString()} DA` : '—',
    category: p.category_display || p.category || '—',
    status: p.status,
    desc: p.description || '',
    aiGenerated: p.is_ai_generated || false,
    img: '📦',
  }))
}

export function transformConversations(data) {
  const results = data?.results ?? (Array.isArray(data) ? data : [])
  return results.map((c) => ({
    id: c.id,
    sender: c.sender_name || c.sender_fb_id || 'Unknown',
    topic: c.topic || 'General inquiry',
    outcome: c.outcome || '—',
    turns: c.message_count || 0,
    date: c.last_message_at ? formatDate(c.last_message_at) : '—',
    sentiment: c.sentiment || 'neutral',
    product: '—',
  }))
}

export function transformActivity(data) {
  const results = data?.results ?? (Array.isArray(data) ? data : [])
  return results.map((a) => ({
    type: a.action_type,
    text: a.description,
    time: timeAgo(a.created_at),
    color: ACTION_COLOR_MAP[a.action_type] || '#6b7a94',
  }))
}
