//  TODO: be able to specify these two importantly peer imports from the code level here
import { EditorState } from 'npm/codemirror/state/6.2.0'
import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  highlightActiveLineGutter
} from "npm/codemirror/view/6.9.2"
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  indentOnInput,
  bracketMatching,
  foldGutter,
  foldKeymap
} from "npm/codemirror/language/6.6.0"
import {
  defaultKeymap,
  history,
  historyKeymap
} from 'npm/codemirror/commands/6.2.2'
import { searchKeymap, highlightSelectionMatches } from "npm/codemirror/search/6.2.3"
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap
} from "npm/codemirror/autocomplete/6.4.2"
import { lintKeymap } from "npm/codemirror/lint/6.2.0"

export default (() => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
])()