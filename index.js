import { browserAgent } from '@knowlearning/agents'
import sourceCodeEditor from './editor/source-code-editor.js'
import './index.css'

window.Agent = browserAgent()

async function init() {
  const base = 'a0d171b0-c782-11ed-8e12-e15b5a9c6f12'
  const container = await sourceCodeEditor(base)
  document.body.appendChild(container)
}

init()
