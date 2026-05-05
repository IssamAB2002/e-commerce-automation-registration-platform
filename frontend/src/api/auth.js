import { request, setTokens, clearTokens, getTokens } from './client.js'

export const register = (data) =>
  request('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
      company_name: data.company,
      business_type: data.businessType || '',
      marketing_opt_in: data.agreedToMarketing || false,
    }),
  })

export const login = (email, password) =>
  request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const onboarding = (data) =>
  request('/api/auth/onboarding/', {
    method: 'POST',
    body: JSON.stringify({
      business_niche: data.businessNiche,
      monthly_ad_spend: data.monthlyAdSpend,
      primary_goal: data.primaryGoal,
      team_size: data.teamSize || 'solo',
      phone: data.phoneNumber,
      website_url: data.website || '',
    }),
  })

export const getFacebookAuthUrl = () =>
  request('/api/auth/facebook/')

export const logout = async () => {
  const { refresh } = getTokens()
  try {
    await request('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    })
  } finally {
    clearTokens()
  }
}

export const saveAuthTokens = (tokens) => setTokens(tokens)
