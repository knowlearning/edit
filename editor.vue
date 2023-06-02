<template>
  <div ref="container" class="container"></div>
</template>

<script>
  import sourceCodeEditor from './editor/source-code-editor.js'

  export default {
    props: {
      id: String
    },
    async created() {
      const container = await sourceCodeEditor(this.id)
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