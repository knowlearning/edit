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
  >
    <pane>
      <button @click="logOut">log out</button>
      <FolderTree
        :path="root"
        :paths="paths"
        @toggle="togglePath"
      />
    </pane>
    <pane>
      <Editor :id="root" />
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
        root: 'a0d171b0-c782-11ed-8e12-e15b5a9c6f12',
        paths: {}
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
    }
  }
</script>

<style>
</style>
