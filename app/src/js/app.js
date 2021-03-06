import '../../node_modules/material-design-lite/dist/material.js'

import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'

Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.GOOGLE_MAPS_API_KEY
  }
})

import App from './App.vue'

document.addEventListener('DOMContentLoaded', (e) => {
  const appEl = document.getElementById('app')

  new Vue({
    el: appEl,
    render: h => h(App)
  })

  appEl.style.display = null
})
