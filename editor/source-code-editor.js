//  TODO: be able to specify these two importantly peer imports from the code level here
import { EditorState, EditorSelection, Compartment } from 'npm/codemirror/state/6.2.0'
import { keymap, EditorView } from "npm/codemirror/view/6.9.2"
import { v1 as uuid } from 'npm/unscoped/uuid/8.3.2'
import { javascript, esLint } from 'npm/codemirror/lang-javascript/6.1.4'
import { lintGutter, linter } from "npm/codemirror/lint/6.2.0"
import * as eslint from "npm/unscoped/eslint-linter-browserify/8.35.0";
import esLintRecommendedRules from './eslint-recommended-rules.js'
import { vue } from 'npm/codemirror/lang-vue/0.1.1'
import { indentWithTab } from 'npm/codemirror/commands/6.2.2'
import basicSetup from './codemirror-6-basic-setup.js'
import ContentReferencePlugin from './codemirror-6-content-reference-plugin.js'
import codemirrorReducer from '../../utils/codemirror-reducer.js'

const { upload, download } = Core

const style = document.createElement('style')
style.appendChild(document.createTextNode(`
.cm-editor
{
  width: 100%;
  height: 100%;
}
`))
document.head.appendChild(style)

const container = document.createElement('div')
container.style.width = '100%'
container.style.height = '100%'
container.style.position = 'absolute'

let editor = null
let state = null

export default async function setupEditor(passedState, interact) {
  let awaitingPatchApply = false

  state = passedState || {
    base: './source-code-editor.js',
    changes: [],
    reducer: null
  }

  const keymaps = [
    indentWithTab,
    { // Insert new content
      key: "Ctrl-i",
      preventDefault: true,
      run: ({state, dispatch}) => {
        if (state.readOnly) return false
        const id = uuid()
        dispatch(state.update(state.changeByRange( range => {
          const changes = [{from: range.from, to: range.to, insert: id}]
          let changeSet = state.changes(changes)
          return {
            changes,
            range: EditorSelection.range(
              changeSet.mapPos(range.anchor, 1),
              changeSet.mapPos(range.head, 1)
            )
          }
        }), {userEvent: "input.indent"}))
        Core
          .send({ type: 'metadata', id: state.base })
          .then(({ metadata }) => {
            upload({ ...metadata, name: 'New Content', id }, '')
          })
        
        return true
      }
    },
    {
      key: 'Ctrl-s',
      preventDefault: true,
      run() {
        awaitingPatchApply = true
        editor.contentDOM.blur()
        Core.send({ type: 'save' })
      }
    }
  ]

  Core.send({ type: 'state', scope: 'log' }, ({ state: event, interaction }) => {
    const { root, base } = state
    if (event && event.type === 'patch-apply' && event.swaps[root] && event.swaps[base]) {
      if (awaitingPatchApply) {
        awaitingPatchApply = false
        editor.contentDOM.focus()
      }
      const text = editorState.doc.toString()
      const changes = []
      //  apply swaps
      Object
        .entries(event.swaps)
        .forEach(([ from, to ]) => {
          const getNext = skip => text.indexOf(from, skip)
          let next = getNext()
          while (next > -1) {
            changes.push({from: next, to: next + from.length, insert: to})
            next = getNext(next + to.length)
          }
        })
      editor.dispatch({changes})
      state.root = event.swaps[root]
      state.base = event.swaps[base]
      state.changes = []
      interact(state)
    }
  })

  //  download document and apply any previously captured changes
  const [doc, type] = await Promise.all([
    download(state.base)
      .then(data => data.text())
      .then(text => codemirrorReducer(text, state.changes)),
    Core
      .send({ type: 'metadata', id: state.base })
      .then(({ metadata: { type } }) => type )
  ])

  const esLintConfig = {
    globals: {
      Core: true
    },
    parserOptions: {
      ecmaVersion: 13,
      sourceType: "module"
    },
    env: {
      browser: true,
//      node: true,
      es6: true
    },
    rules: {
      ...esLintRecommendedRules
      //semi: ["error", "never"],
    },
  };

  const extensions = [
    ...basicSetup,
    keymap.of(keymaps),
    lintGutter(),
    linter(esLint(new eslint.Linter(), esLintConfig)),
//    EditorView.domEventHandlers({
//      scroll: (event, view) => {}
//    }),
    ContentReferencePlugin(state)
  ]

  //  TODO: better recognizers...
  const languageModules = {
    'application/javascript': javascript,
    'application/javascript;syntax=vue-template': vue
  }

  if (languageModules[type]) extensions.push(languageModules[type]())

  const editorState = EditorState.create({ doc, extensions })

  const dispatch = transaction => {
    editor.update([transaction])
    state.changes.push(transaction.changes.toJSON())
    interact(state)
  }

  editor = new EditorView({
    state: editorState,
    parent: container,
    dispatch
  })

  return container
}
