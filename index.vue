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
        v-if="selected"
        :key="selected"
        :id="selected"
        @save="onSave"
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
        selected: null,
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
      async onSave(id) { // TODO: get root and all scopes under root that are saved to pass to patch
        console.log('PATCHING!!!!', id)
        const patchResponse = await Agent.patch(id, [id])
        console.log('PATCH RESPONSE', patchResponse)
      },
      select(path) {
        this.selected = path.split('/').at(-1)
      }
    }
  }
</script>

<style>
</style>
