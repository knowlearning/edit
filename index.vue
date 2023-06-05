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
      <FolderTree
        :path="root"
        :paths="paths"
        @toggle="togglePath"
      />
    </pane>
    <pane :size="panels[1].size">
      <Editor
        :id="root"
        @save="onSave"
      />
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
        root: '15cbdca0-03e5-11ee-9151-87aafd410b1c',
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
      async onSave(id) { // TODO: get root and all scopes under root that are saved to pass to patch
        console.log('PATCHING!!!!', id)
        const patchResponse = await Agent.patch(id, [id])
        console.log('PATCH RESPONSE', patchResponse)
      }
    }
  }
</script>

<style>
</style>
