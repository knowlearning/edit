import { browserAgent, vuePersistentComponent } from '@knowlearning/agents'
import mainComponent from './index.vue'

import 'splitpanes/dist/splitpanes.css'
import './index.css'

window.Agent = browserAgent()
vuePersistentComponent(mainComponent)
