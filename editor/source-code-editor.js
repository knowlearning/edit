//  TODO: be able to specify these two importantly peer imports from the code level here
import { EditorState, EditorSelection, Compartment } from '@codemirror/state'
import { keymap, EditorView } from "@codemirror/view"
import { v1 as uuid, validate } from 'uuid'
import { javascript, esLint } from '@codemirror/lang-javascript'
import { lintGutter, linter } from "@codemirror/lint"
import * as eslint from "eslint-linter-browserify"
import esLintRecommendedRules from './eslint-recommended-rules.js'
import { vue } from '@codemirror/lang-vue'
import { indentWithTab } from '@codemirror/commands'
import basicSetup from './codemirror-6-basic-setup.js'
import ContentReferencePlugin from './codemirror-6-content-reference-plugin.js'
import codemirrorReducer from './codemirror-reducer.js'

const style = document.createElement('style')
style.appendChild(document.createTextNode(`
.cm-editor
{
  width: 100%;
  height: 100%;
}
`))
document.head.appendChild(style)

export default async function setupEditor(base) {

  const container = document.createElement('div')
  container.style.width = '100%'
  container.style.height = '100%'
  container.style.position = 'absolute'

  const state = await Agent.mutate(base)

  if (state.base !== base) state.base = base
  if (!state.changes) state.changes = []
  state.reducer = null // TODO: more consideration around reducers

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
        //  TODO: collect type info from user, or default to current type
        Agent.upload('New Content', 'text/plain', '', id)
        
        return true
      }
    },
    {
      key: 'Ctrl-s',
      preventDefault: true,
      run() {
        //  TODO: handle save behavior
      }
    }
  ]

  //  TODO: apply these swaps more directly here
  /*
  Core.send({ type: 'state', scope: 'log' }, ({ state: event, interaction }) => {
    const { root, base } = state
    if (event && event.type === 'patch-apply' && event.swaps[root] && event.swaps[base]) {

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
  */

  //  download document and apply any previously captured changes
  const doc = await (
    Agent
      .download(state.base)
      .then(data => data.text())
      .then(text => codemirrorReducer(text, state.changes))
  )

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

  //  TODO: handle types
  //  TODO: better recognizers...
  /*
  const languageModules = {
    'application/javascript': javascript,
    'application/javascript;syntax=vue-template': vue
  }
  if (languageModules[type]) extensions.push(languageModules[type]())
  */

  const editorState = EditorState.create({ doc, extensions })
  const dispatch = transaction => {
    editor.update([transaction])
    state.changes.push(transaction.changes.toJSON())
  }

  const editor = new EditorView({
    state: editorState,
    parent: container,
    dispatch
  })

  return container
}
