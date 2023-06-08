<template>
  <span>
    <span v-if="name === null">...</span>
    {{ name }}
  </span>
</template>

<script>

export default {
  props: {
    id: String
  },
  data() {
    return { name: null }
  },
  async created() {
    const { name } = await Agent.metadata(this.id)
    this.name = name
  }
}

</script>