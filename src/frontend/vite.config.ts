import { spawn, type ChildProcess } from 'node:child_process'
import { connect } from 'node:net'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const backendPort = Number(process.env.KBC_TRUST_PORT ?? 8787)

function portInUse(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = connect(port, '127.0.0.1')
    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
  })
}

/**
 * Starts the KBC Trust Python backend (src/backend/server.py) with `npm run dev`, so the demo needs
 * one command. Skipped when the port is already taken or KBC_TRUST_BACKEND=off.
 */
function kbcTrustBackend(): Plugin {
  let child: ChildProcess | undefined
  return {
    name: 'kbc-trust-backend',
    apply: 'serve',
    async configureServer(server) {
      if (process.env.KBC_TRUST_BACKEND === 'off' || (await portInUse(backendPort))) return
      const script = fileURLToPath(new URL('../backend/server.py', import.meta.url))
      child = spawn(process.env.PYTHON ?? 'python3', [script], {
        stdio: 'inherit',
        env: { ...process.env, KBC_TRUST_PORT: String(backendPort) },
      })
      child.on('error', (error) => server.config.logger.warn(`KBC Trust backend did not start: ${error.message}`))
      const stop = () => child?.kill()
      server.httpServer?.once('close', stop)
      process.once('exit', stop)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), kbcTrustBackend()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': `http://127.0.0.1:${backendPort}`,
    },
  },
})
