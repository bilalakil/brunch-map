import Vue from 'vue'
import App from './App.vue'

document.addEventListener('DOMContentLoaded', (e) => {
  const appEl = document.getElementById('app')

  new Vue({
    el: appEl,
    render: h => h(App)
  })

  appEl.style.display = null
})
