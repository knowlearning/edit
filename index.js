import { createApp } from 'vue'
import { createStore } from 'vuex'
import { browserAgent, vuePersistentStore } from '@knowlearning/agents'
import mainComponent from './index.vue'
import storeConfig from './store.js'
import './index.css'

window.Agent = browserAgent()

async function initialize() {
  const store = createStore(await vuePersistentStore(storeConfig))
  const app = createApp(mainComponent)
  app.use(store)
  app.mount(document.body)
}

initialize()