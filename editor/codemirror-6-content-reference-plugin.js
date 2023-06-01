import { v1 as uuid } from "uuid"
import { Decoration, WidgetType, ViewPlugin, EditorView } from "npm/codemirror/view/6.9.2"

const SOURCE_CODE_EDITOR_CONTENT = './source-code-editor.js'

function makeDraggable(el, id, config) {
  el.setAttribute('draggable', 'true')
  el.setAttribute('aria-hidden', "true")
  el.addEventListener('mousedown', e => e.stopPropagation())
  el.addEventListener('dragstart', e => {
    const { root } = config
    e.stopPropagation()
    const json = JSON.stringify({
      root,
      id: SOURCE_CODE_EDITOR_CONTENT,
      scope: uuid(),
      state: { root, base: id, changes: [], reducer: null }
    })
    e.dataTransfer.setData('text', json)
  });
}

class UUIDWidget extends WidgetType {
  constructor(id, config) {
    super()
    this.id = id
    this.config = config
  }

  eq(other) { return other.id == this.id }

  toDOM() {
    const wrap = document.createElement('span')
    wrap.style.background = 'rgba(0,0,0,0.25)'
    wrap.style.borderRadius = '1.25em'
    wrap.style.padding = '0.25em 0.5em'
    wrap.style.fontSize = '80%'
    wrap.style.boxShadow = `
      rgb(0 0 0 / 25%) 0px 0.0625em 0.0625em,
      rgb(0 0 0 / 25%) 0px 0.125em 0.5em,
      rgb(255 255 255 / 10%) 0px 0px 0px 1px inset
    `
    //  TODO: use spinner instead of basic loading text
    wrap.appendChild(document.createTextNode('Loading Content Name...'))
    makeDraggable(wrap, this.id, this.config)
    Core
      .send({ type: 'metadata', id: this.id})
      .then(({ error, metadata }) => {
        wrap.innerHTML = ''
        const text = error ? this.id : metadata.name
        wrap.appendChild(document.createTextNode(text))
      })
    return wrap
  }

  ignoreEvent() { return false }
}

function UUIDWidgets(view, config) {
  let widgets = []
  for (let {from, to} of view.visibleRanges) {
    const reg = /[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/ig
    let result
    const rangeText = view.state.doc.sliceString(from, to)
    while((result = reg.exec(rangeText)) !== null) {
      let deco = Decoration.replace({
        widget: new UUIDWidget(result[0], config),
        side: -1,
        inclusive: true
      })
      const start = from + result.index
      widgets.push(deco.range(start, start + 36))
    }
  }
  return Decoration.set(widgets)
}

const ContentReferencePlugin = config => {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.decorations = UUIDWidgets(view, config)
    }

    update(update) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = UUIDWidgets(update.view, config)
    }
  }, {
    decorations: v => v.decorations,
    provide: plugin => EditorView.atomicRanges.of(view => {
      return view.plugin(plugin)?.decorations || Decoration.none
    })
  })
}

export default ContentReferencePlugin
