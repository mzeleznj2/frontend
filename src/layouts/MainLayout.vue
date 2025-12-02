<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> Menu </q-toolbar-title>

        <q-toolbar-title> Inventura SAP</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <!-- drawer content -->
      <q-list>
        <q-item
          v-for="route in routes"
          :key="route.name"
          clickable
          tag="router-link"
          :to="route.path"
        >
          <q-item-section avatar>
            <q-icon :name="route.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ route.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const leftDrawerOpen = ref(false)

    const routes = [
      { name: 'home', path: '/', label: 'Home', icon: 'home' },
      {
        name: 'ucitaj-Excel',
        path: '/ucitaj-Excel',
        label: 'Import Excel files',
        icon: 'import_export',
      },
      {
        name: 'obradaPodataka',
        path: '/obrada-Podataka',
        label: 'Processing imported data',
        icon: 'settings',
      },
    ]

    return {
      leftDrawerOpen,
      routes,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
    }
  },
}
</script>
