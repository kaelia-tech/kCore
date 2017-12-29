<template>
  <div>
     <!-- 
      Render an expandable fab if multiple actions are provided
     -->
    <q-fab v-if="fab.actions.length > 1" 
      icon="keyboard_arrow_up"
      class="fixed"
      style="right: 18px; bottom: 18px" 
      direction ="up" 
      color="primary">
        <q-fab-action 
          v-for="action in fab.actions" 
          :key="action.name"
          color="primary"
          @click="onActionTriggered(action)"
          :icon="action.icon">
          <q-tooltip v-if="action.label" anchor="center left" self="center right" :offset="[20, 0]">
            {{action.label}}
          </q-tooltip>
        </q-fab-action>
    </q-fab>
    <!-- 
      Render a non expandable fab if a single action is provided
     -->
    <q-btn v-else-if="fab.actions.length === 1" round 
      color="primary"
      class="fixed"
      style="right: 18px; bottom: 18px"
      @click="onActionTriggered(fab.actions[0])">
      <q-icon :name="fab.actions[0].icon" />
      <q-tooltip v-if="fab.actions[0].label" anchor="center left" self="center right" :offset="[20, 20]">
        {{fab.actions[0].label}}
      </q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import { QBtn, QIcon, QFab, QFabAction, QTooltip } from 'quasar'

export default {
  name: 'k-fab',
  components: {
    QBtn,
    QIcon,
    QFab,
    QFabAction,
    QTooltip
  },
  data () {
    return {
      fab: {}
    }
  },
  methods: {
    onActionTriggered (action) {
      // If a handler is given call it
      if (action.handler) action.handler.call(this)
      // If a route is given activate it
      else if (action.route) this.$router.push(action.route)
    }
  },
  created () {
    this.fab = this.$store.get('fab')
  }
}
</script>