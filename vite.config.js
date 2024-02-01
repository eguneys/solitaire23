import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vite'

import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [glsl(),
  VitePWA({ 
    manifest: { 
name: 'Sofo Solitaire',
short_name: "Sofo",
start_url: ".?fullscreen=true",
display: "fullscreen",
orientation: "landscape",
background_color: "#315594",
description: "Solitaire 3 Card Games",
icons: [{
    src: "images/touch/homescreen192.png",
    sizes: "192x192",
    type: "image/png"
  }]
  }, injectRegister: 'inline', registerType: 'autoUpdate'})]
})
