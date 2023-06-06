<template>
  <div v-if="auth === null">initializing...</div>
  <LoginMenu
    v-else-if="auth.provider === 'anonymous'"
    google
    microsoft
  />
  <splitpanes
    v-else
    class="default-theme"
    @resize="adjustPanelSizes"
  >
    <pane :size="panels[0].size">
      <button @click="logOut">log out</button>
      <button @click="create">create</button>
      <FolderTree
        v-for="root in roots"
        :key="root"
        :path="root"
        :paths="paths"
        @select="select"
        @toggle="togglePath"
      />
    </pane>
    <pane :size="panels[1].size">
      <Editor
        v-if="selectedPath"
        :scope="selectedPath"
        :root="selectedRoot"
        :base="selectedBase"
        :save="save"
      />
      <div v-else>Select a file to edit</div>
    </pane>
  </splitpanes>
</template>

<script>
  import { Splitpanes, Pane } from 'splitpanes'
  import LoginMenu from './login-menu.vue'
  import Editor from './editor.vue'
  import FolderTree from './folder-tree.vue'

  function applySwaps(start, swaps) {
    return (
      Object
        .entries(swaps)
        .reduce((last, [from, to]) =>  last.replaceAll(from, to), start)
    )
  }

  export default {
    components: {
      LoginMenu,
      FolderTree,
      Editor,
      Splitpanes,
      Pane
    },
    data() {
      return {
        auth: null,
        roots: [],
        selectedPath: null,
        paths: {},
        panels: [{ size: 20  }, { size: 80 }]
      }
    },
    async created() {
      if (!this.auth) {
        const { auth } = await Agent.environment()
        this.auth = auth
      }
    },
    methods: {
      logOut() {
        Agent.logout()
      },
      togglePath(path) {
        if (this.paths[path]) delete this.paths[path]
        else this.paths[path] = true
      },
      adjustPanelSizes(panels) {
        this
          .panels
          .forEach((p, i) => p.size = panels[i].size)
      },
      async create() {
        const id = await Agent.upload('New Content', 'text/plain', 'new file')
        this.roots.push(id)
      },
      async save() {
        console.log('saving!!!')
        const { swaps } = await Agent.patch(this.selectedRoot, [this.selectedBase])
        //  swap all roots and paths for folder tree
        this.roots = this.roots.map(root => swaps[root] || root)
        this.selectedPath = applySwaps(this.selectedPath, swaps)
        Object
          .keys(this.paths)
          .forEach(path => {
            const swappedPath = applySwaps(path, swaps)
            if (swappedPath !== path) {
              delete this.paths[path]
              this.paths[swappedPath] = true
            }
          })
        return swaps
      },
      select(path) {
        this.selectedPath = path
      }
    },
    computed: {
      selectedRoot() {
        return this.selectedPath.split('/')[0]
      },
      selectedBase() {
        return this.selectedPath.split('/').at(-1)
      }
    }
  }
</script>

<style>
</style>
