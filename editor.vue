<template>
  <div ref="container" class="container"></div>
</template>

<script>
  import sourceCodeEditor from './editor/source-code-editor.js'

  export default {
    props: {
      scope: String,
      root: String,
      base: String,
      save: Function
    },
    async created() {
      const container = await sourceCodeEditor(this.scope, this.root, this.base, this.save)
      this.$refs.container.appendChild(container)
    }
  }
</script>

<style scoped>

.container {
  width: 100%;
  height: 100%;
}

</style>