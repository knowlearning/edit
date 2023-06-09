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
        v-for="root, index in roots"
        :key="root"
        :highlights="highlights"
        :path="root"
        :paths="paths"
        @select="selectPath"
        @toggle="togglePath"
      >
        <template v-slot:name="{ id, path }">
          <div>
            <NameTag :id="id" />
          </div>
        </template>
        <template v-slot:actions="{ path }">
          <div
            v-if="path.split('/').length === 1"
            @click="removeRoot(index)"
          >
            &#10005;
          </div>
        </template>
      </FolderTree>
      <div v-if="creating">
        <input
          v-model="creating.name"
          @keypress.enter="create"
        >
        <select v-model="creating.type">
          <option
            v-for="t in types"
            :key="t.value"
            :value="t.value"
          >
            {{ t.display }}
          </option>
        </select>
        <button @click="create">create</button>
      </div>
      <button
        v-else
        @click="creating = { name: '', type: 'text/plain' }"
      >
        +
      </button>
    </pane>
    <pane :size="panels[1].size">
      <Editor
        v-if="selectedPath"
        :key="originalPath"
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
  import NameTag from './name-tag.vue'

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
      Pane,
      NameTag
    },
    data() {
      return {
        auth: null,
        creating: null,
        roots: [],
        originalPath: null,
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
      removeRoot(index) {
        const root = this.roots[index]
        this.roots.splice(index, 1)
        if (this.selectedRoot === root) {
          this.originalPath = null
          this.selectedPath = null
        }
      },
      async create() {
        const { name, type } = this.creating
        this.creating = null
        const id = await Agent.upload(name, type, 'new file')
        this.roots.push(id)
        this.originalPath = id
        this.selectedPath = id
      },
      async save() {
        console.log('saving!!!')
        const { swaps } = await Agent.patch(this.selectedRoot, [this.selectedBase])
        //  swap all roots and paths for folder tree
        this.roots = this.roots.map(root => this.selectedRoot === root ? swaps[root] : root)
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
      selectPath(path) {
        if (path !== this.selectedPath) {
          this.originalPath = path
          this.selectedPath = path
        }
      }
    },
    computed: {
      selectedRoot() {
        return this.selectedPath.split('/')[0]
      },
      selectedBase() {
        return this.selectedPath.split('/').at(-1)
      },
      highlights() {
        return { [this.selectedPath]: true }
      },
      types() {
        return [
          {
            display: 'Vue',
            value: 'application/javascript;syntax=vue-template'
          },
          {
            display: 'JavaScript',
            value: 'application/javascript'
          },
          {
            display: 'JSON',
            value: 'application/json'
          },
          {
            display: 'Plaintext',
            value: 'text/plain'
          },
          {
            display: 'HTML',
            value: 'application/html'
          },
          {
            display: 'CSS',
            value: 'text/css'
          },
          {
            display: 'YAML',
            value: 'text/yaml'
          },
          {
            display: 'Dockerfile',
            value: 'text/plain;syntax=Dockerfile'
          }
        ]
      }
    }
  }
</script>
["", "vue"],
["application/javascript", "js"],
["application/json", "json"],
["text/html", "html"],
["text/css", "css"],
["text/plain", "txt"],
["text/yaml", "yaml"],
["image/png", "png"],
["text/plain;syntax=Dockerfile", "Dockerfile"]


<style>
</style>
