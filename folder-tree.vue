<template>
  <div v-if="recursive">🐢</div>
  <div v-else class="parent">
    <div class="line">
      <div
        v-if="children.length"
        class="action-handle"
        @click="$emit('toggle', path)"
      >
        {{ open ? ' v ' : ' > ' }}
      </div>
      <slot name="name" :id="id" :path="path" />
      <div class="line-spacer"></div>
      <slot name="actions" :id="id" :path="path" />
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
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script>
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
    computed: {
      pathSegments() {
        return this.path.split('/')
      },
      id() {
        return this.pathSegments.at(-1)
      },
      root() {
        return this.pathSegments[0]
      },
      recursive() {
        return this.pathSegments.slice(0, -1).includes(this.id)
      },
      open() {
        return this.paths[this.path]
      }
    },
    created() {
      const { id } = this
      this.name = id //  TODO Actually get the name
      Agent
        .download(id)
        .then(res => res.text())
        .then(text => this.children = [...new Set(getUUIDs(text))])
    }
  }

</script>

<style scoped>

  .child
  {
    padding-left: 2em;
  }

  .line
  {
    display: flex;
  }

  .line-spacer
  {
    flex-grow: 1;
  }

  .action-handle
  {
    cursor: pointer;
    padding: 0 4px;
  }

</style>