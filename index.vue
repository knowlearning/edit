<template>
  <div v-if="auth === null">initializing...</div>
  <LoginMenu
    v-else-if="auth.provider === 'anonymous'"
    google
    microsoft
  />
  <div v-else>
    <button @click="logOut">log out</button>
  </div>
</template>

<script>
  import LoginMenu from './login-menu.vue'
  export default {
    components: {
      LoginMenu
    },
    data() {
      return {
        auth: null
      }
    },
    async created() {
      const { auth } = await Agent.environment()
      this.auth = auth
    },
    methods: {
      logOut() {
        Agent.logout()
      }
    }
  }
</script>

<style>
  body
  {
    margin: 0;
  }
</style>
