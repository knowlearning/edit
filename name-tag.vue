<template>
  <span
    draggable="true"
    @dragstart="initiateViewDrag"
  >
    <span v-if="name === null">...</span>
    {{ name }}
  </span>
</template>

<script>
import { v1 as uuid } from 'uuid'

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
  },
  methods: {
    initiateViewDrag(event) {
      console.log('Initiating drag!!!!!!!!!!')
      event.dataTransfer.setData('text', this.id)
    }
  }
}

</script>