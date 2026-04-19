import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const email = env.VITE_ZD_EMAIL ?? ''
  const token = env.VITE_ZD_TOKEN ?? ''
  const subdomain = env.VITE_ZD_SUBDOMAIN ?? 'getstream'
  const auth = email && token
    ? `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`
    : ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/v2': {
          target: `https://${subdomain}.zendesk.com`,
          changeOrigin: true,
          ...(auth ? { headers: { Authorization: auth } } : {}),
        },
      },
    },
  }
})
