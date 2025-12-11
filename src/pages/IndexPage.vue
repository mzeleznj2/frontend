<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card class="q-pa-xl shadow-2 rounded-borders" style="min-width: 300px; max-width: 400px">
      <q-card-section>
        <div class="text-h6">Select location</div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedPlant"
          :options="plants"
          label="Plant"
          emit-value
          map-options
          dense
          outlined
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Potvrdi" color="primary" @click="confirmSelection" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'

const router = useRouter()

const selectedPlant = ref(null)
const selectedWarehouse = ref(null)

const plants = [
  { label: 'Tubla', value: 'PPL1', warehouse: 'L10' },
  { label: 'Ytres', value: 'PPN1', warehouse: 'N10' },
  { label: 'Ella Textile', value: 'PPR1', warehouse: 'R10' },
  { label: 'Bytres', value: 'PPS1', warehouse: 'S10' },
  { label: '2M', value: 'PPM1', warehouse: 'M10' },
  { label: 'Trever', value: 'PPO1', warehouse: 'O10' },
]

watch(selectedPlant, (newValue) => {
  const plant = plants.find((p) => p.value === newValue)
  selectedWarehouse.value = plant ? plant.warehouse : null
})

function confirmSelection() {
  console.log('Selected:', selectedPlant.value, selectedWarehouse.value)
  if (!selectedPlant.value || !selectedWarehouse.value) {
    Notify.create({
      type: 'negative',
      message: 'Please pick location!',
    })
    return
  }

  localStorage.setItem('selectedPlant', selectedPlant.value)
  localStorage.setItem('selectedWarehouse', selectedWarehouse.value)

  router.push({ name: 'ucitajExcel' })
}
</script>
