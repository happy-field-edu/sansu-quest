import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // GitHub Pages (https://happy-field-edu.github.io/sansu-quest/) 用のベースパス。
  // ローカル開発は従来どおり http://localhost:5173/ のまま。
  base: command === 'build' ? '/sansu-quest/' : '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
}))
