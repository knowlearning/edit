<template>
  <div v-if="recursive">🐢</div>
  <div v-else class="parent">
    <div @click="$emit('toggle', path)">
      <span
        draggable="true"
        @dragstart="initiateViewDrag"
      >
        {{ name }}
      </span>
      <span
        draggable="true"
        @dragstart="initiateEditDrag"
      >
        edit
      </span>
      <span v-if="children.length">
        {{ open ? ' v ' : ' > ' }}
      </span>
    </div>
    <div
      v-if="open"
      class="child"
    >
      <folder-tree
        v-for="id in children"
        :key="id"
        :id="id"
        :path="`${path}/${id}`"
        :paths="paths"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script>
  import { v1 as uuid } from 'uuid'
  const getUUIDs = s => s.match(/[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/g) || []

  export default {
    name: 'folder-tree',
    props: {
      path: String,
      paths: Object
    },
    data() {
      return {
        name: 'loading...',
        children: []
      }
    },
    created() {
      this.name = this.id //  TODO Actually get the name
    },
    computed: {
      id() {
        return this.path.split('/').pop()
      },
      root() {
        return this.path.split('/').shift()
      },
      recursive() {
        return this.path.split('/').slice(0, -1).includes(this.id)
      },
      open() {
        return this.paths[this.path]
      }
    },
    created() {
      const { id } = this
      Agent
        .download(id)
        .then(res => res.text())
        .then(text => this.children = [...new Set(getUUIDs(text))])
    },
    methods: {
      initiateViewDrag(event) {
        console.log('Initiating drag!!!!!!!!!!')
        event.dataTransfer.setData('text', this.id)
      },
      initiateEditDrag(event) {
        const { id: base, root } = this
        const json = JSON.stringify({
          root,
          id: './source-code-editor.js',
          scope: uuid(),
          state: { root, base, changes: [], reducer: null }
        })
        event.dataTransfer.setData('text', json)
      }
    }
  }

</script>

<style scoped>

  .child
  {
    padding-left: 2em;
  }

</style>