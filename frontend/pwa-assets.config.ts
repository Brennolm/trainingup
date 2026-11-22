import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates PWA icons (64/192/512, maskable, apple-touch, favicon.ico) from the brand icon.
// Run: npm run icons
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#121316' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#121316' } },
  },
  images: ['public/app-icon.svg'],
})
