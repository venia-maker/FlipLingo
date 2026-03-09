export const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID ?? ''
export const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET ?? ''
export const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI
  ?? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/oauth/zoho`
export const ZOHO_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/auth'
export const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token'
export const ZOHO_DESK_API_BASE = 'https://desk.zoho.com/api/v1'
export const ZOHO_SCOPES = 'Desk.tickets.ALL,Desk.basic.READ,Desk.settings.READ'
