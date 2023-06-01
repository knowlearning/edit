<template>
  <div
    class="wrapper"
    v-for="(id, index) in ids"
    :key="id"
  >
    <div>
      <div
        @click="() => ids.splice(index, 1)"
      >
        X
      </div>
      <folder-tree
        :path="id"
        :paths="paths"
        @toggle="p => togglePath(p)"
      />
    </div>
    <div>
      <button @click="() => download(id)">
        download
      </button>
    </div>
  </div>
  <div v-if="ids.length === 0">
    Drop a content reference here to explore its structure
  </div>
</template>

<script>
  import JSZip from 'npm/unscoped/jszip/3.10.1'
  import FolderTree from './folder-tree.vue'
  import recursivelyLoad from '../../utils/recursively-load.js'

  const getUUIDs = source => source.match(/[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/g) || []

  function saveData(blob, fileName) {
    const a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none"

    const url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  export default {
    components: {
      FolderTree
    },
    data() {
      return {
        ids: [],
        paths: {}
      }
    },
    created() {
      window.addEventListener('dragover', event => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      })
      window.addEventListener('drop', event => {
        const text = event.dataTransfer.getData("text")
        //  TODO: consider parsing out one/multiple ids for drop
        console.log(text)
        let content = []
        try {
          const { id } = JSON.parse(text)
          if (id) content = [id]
        }
        catch (error) {
          content = getUUIDs(text)
        }

        this.ids = [...this.ids, ...content]
      })

      //  watch for applied patches to update swaps
      Core.send({ type: 'state', scope: 'log' }, ({ state: event }) => {
        if (event && event.type === 'patch-apply') {
          this
            .ids
            .forEach((id, index) => {
              const swap = event.swaps[id]
              if (swap) this.ids.splice(index, 1, swap)
            })
        }
      })
    },
    methods: {
      togglePath(path) {
        if (this.paths[path]) delete this.paths[path]
        else this.paths[path] = true
      },
      async download(id) {
        const zip = new JSZip()
        const contentSet = await recursivelyLoad(id, Core.download)
        const nameSwaps = {}
        await Promise.all(
          Object
            .keys(contentSet)
            .map(async id => {
              const { metadata } = await Core.send({ type: 'metadata', id })
              nameSwaps[id] = metadata.name
            })
        )

        const swapUUIDsForNames = (name, content) => {
          //  TODO: instead of maintaining absolute references and using extra ../ references
          //        do proper relative referencing...
          let swappedContent = content
          getUUIDs(content)
            .forEach(id => {
              const importeeName = nameSwaps[id]
              if (importeeName) {
                const importerPath = name.split('/')
                const importeePath = nameSwaps[id].split('/')
                while (importeePath[0] === importerPath[0] && importeePath.length) {
                  importeePath.shift()
                  importerPath.shift()
                }
                //  handle case for self-reference
                if (importeePath.length === 0) importeePath.push(name.split('/').pop())

                const backReferences = importerPath.slice(0, -1).map(() => '..')
                const relativePrefix = (backReferences.length ? backReferences.join('/') + '/' : './')
                const relativeRef =  relativePrefix + importeePath.join('/')
                swappedContent = swappedContent.replaceAll(id, relativeRef)
              }
            })
          return swappedContent
        }

        Object
          .entries(contentSet)
          .forEach(([id, content]) => {
            const name = nameSwaps[id]
            zip.file(name, swapUUIDsForNames(name, content))
          })

        zip
          .generateAsync({ type: 'blob' })
          .then(blob => saveData(blob, 'test.zip'))
      }
    }
  }
</script>

<style>
.wrapper
{
  display: flex;
  justify-content: space-between;
}
</style>