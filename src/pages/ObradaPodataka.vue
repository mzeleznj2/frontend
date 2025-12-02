<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="full-width">
      <div class="flex flex-center q-mb-md">
        <q-btn
          v-if="!responseData"
          color="primary"
          label="Start processing"
          :loading="isLoading"
          @click="pokreniObradu"
          unelevated
          rounded
          class="q-pa-md"
        >
          <template v-slot:loading>
            <q-spinner-dots color="white" />
          </template>
        </q-btn>
      </div>

      <div v-if="responseData" class="q-mt-lg">
        <div class="text-center q-mb-md">
          <h4>Data comparison for {{ selectedPlant }} i {{ selectedWarehouse }}</h4>
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchTerm"
              placeholder="Primary search (all fields)..."
              outlined
              dense
              clearable
              :clear-value="''"
              @clear="searchTerm = ''"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="searchTerm2"
              placeholder="Secondary search (refine results)..."
              outlined
              dense
              clearable
              :clear-value="''"
              @clear="searchTerm2 = ''"
            >
              <template v-slot:append>
                <q-icon name="filter_alt" />
              </template>
            </q-input>
          </div>
        </div>

        <q-toggle
          v-model="excludeFullMatch"
          label="Everything but full match"
          color="primary"
          class="q-mb-md"
        />

        <div class="text-right q-mb-md">
          <q-btn
            color="secondary"
            label="Print table"
            icon="print"
            @click="printTable"
            unelevated
            rounded
          />
          <q-btn
            color="primary"
            label="Export to Excel"
            icon="download"
            @click="exportToExcel"
            unelevated
            rounded
            class="q-ml-sm"
          />
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12" style="overflow-x: auto">
            <q-table
              v-if="responseData.comparisonResult && responseData.comparisonResult.length"
              :rows="filteredRows"
              :columns="comparedTableColumns.filter((c) => c.name !== 'state')"
              row-key="hu"
              :rows-per-page-options="[30]"
              :rows-per-page="30"
              class="q-pa-md"
              flat
              bordered
              :row-class="getRowClass"
            >
              <template v-slot:header>
                <tr>
                  <th colspan="5" class="text-center">Group 1: Book balance</th>
                  <th colspan="4" class="text-center">Group 2: Inventory</th>
                  <th colspan="4" class="text-center">Group 3: Quantity control</th>
                </tr>

                <tr>
                  <th
                    v-for="col in comparedTableColumns.filter((c) => c.name !== 'state')"
                    :key="col.name"
                    :class="[
                      'text-center',
                      col.name === 'quantity' || col.name === 'description'
                        ? 'border-right-separator'
                        : '',
                    ]"
                  >
                    {{ col.label }}
                  </th>
                </tr>
              </template>

              <template v-slot:body="props">
                <q-tr :props="props" :class="getRowClass(props)">
                  <q-td
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                    :class="[
                      col.name === 'quantity' || col.name === 'description'
                        ? 'border-right-separator'
                        : '',
                      getCellClass(props, col),
                    ]"
                  >
                    {{ col.value }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { Notify } from 'quasar'
import * as XLSX from 'xlsx'

const isLoading = ref(false)
const selectedPlant = localStorage.getItem('selectedPlant')
const selectedWarehouse = localStorage.getItem('selectedWarehouse')
const responseData = ref(null)
const searchTerm = ref('')
const searchTerm2 = ref('')
const excludeFullMatch = ref(false)

const comparedTableColumns = [
  { name: 'huKs', label: 'HU KS', field: 'huKs', align: 'center' },
  { name: 'huPlusKs', label: 'HU+ KS', field: 'huPlusKs', align: 'center' },
  { name: 'sBinKs', label: 'SBIN KS', field: 'sBinKs', align: 'center' },
  { name: 'skuKs', label: 'SKU KS', field: 'skuKs', align: 'center' },
  { name: 'quantity', label: 'Quantity KS', field: 'quantity', align: 'center' },
  { name: 'huInv', label: 'Hu Inv', field: 'huInv', align: 'center' },
  { name: 'huPlusInv', label: 'Hu+ Inv', field: 'huPlusInv', align: 'center' },
  { name: 'sBinInv', label: 'SBin Inv', field: 'sBinInv', align: 'center' },
  { name: 'description', label: 'Description', field: 'description', align: 'center' },
  { name: 'state', label: 'State', field: 'state', align: 'center' },
  { name: 'quantityControlHU', label: 'Hu QC', field: 'quantityControlHU', align: 'center' },
  {
    name: 'quantityControlQuantity',
    label: 'Quantity',
    field: 'quantityControlQuantity',
    align: 'center',
  },
  {
    name: 'material',
    label: 'Material',
    field: 'material',
    align: 'center',
  },
  {
    name: 'quantityControlDescription',
    label: 'Description QC',
    field: 'quantityControlDescription',
    align: 'center',
  },
]

const filteredRows = computed(() => {
  if (!responseData.value || !responseData.value.comparisonResult) {
    return []
  }

  let results = responseData.value.comparisonResult

  // First level filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    results = results.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(term)),
    )
  }

  // Second level filter
  if (searchTerm2.value) {
    const term2 = searchTerm2.value.toLowerCase()
    results = results.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(term2)),
    )
  }

  // Full match filter
  if (excludeFullMatch.value) {
    results = results.filter((row) => row.description !== 'Full match')
  }

  return results
})

function getRowClass(props) {
  //console.log('Row data:', props)
  return props.row.state === 1 ? 'row-green' : 'row-red'
}

function getCellClass(props, col) {
  if (!props || !props.row || !col) return ''
  const lastThree = [
    'quantityControlHU',
    'quantityControlQuantity',
    'material',
    'quantityControlDescription',
  ]
  if (!lastThree.includes(col.name)) return ''

  // Check if all four fields are empty
  const allEmpty =
    !props.row.quantityControlHU &&
    !props.row.quantityControlQuantity &&
    !props.row.material &&
    !props.row.quantityControlDescription

  if (allEmpty) return 'cell-white'

  return props.row.quantityControlDescription === 'Full match QC' ? 'row-green' : 'row-red'
}

async function pokreniObradu() {
  //console.log('Button clicked')
  isLoading.value = true
  try {
    //console.log('Sending API request...')
    const response = await axios.post('http://10.24.131.7:96/api/compare/sendData', {
      //const response = await axios.post('http://localhost:5059/api/compare/sendData', {
      selectedPlant,
      selectedWarehouse,
    })
    console.log('API response:', response.data)

    if (!response.data || Object.keys(response.data).length === 0) {
      Notify.create({
        type: 'warning',
        message: `Processing for selected plant (${selectedPlant}) and warehouse (${selectedWarehouse}) does not exist.`,
        position: 'top',
      })
      responseData.value = null
    } else {
      responseData.value = {
        comparisonResult: Array.isArray(response.data) ? response.data : [response.data],
      }
    }
  } catch (error) {
    console.error('Error during API call:', error)
    Notify.create({
      type: 'negative',
      message: 'Error during API call.',
      position: 'top',
    })
  } finally {
    isLoading.value = false
    //console.log('Processing finished')
  }
}

function exportToExcel() {
  const dataToExport = filteredRows.value.map((row) => {
    const exportRow = {}
    comparedTableColumns
      .filter((col) => col.name !== 'state')
      .forEach((col) => {
        exportRow[col.label] = row[col.field] || ''
      })
    return exportRow
  })

  const worksheet = XLSX.utils.json_to_sheet(dataToExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Data')

  const fileName = `Filtered_Data_${selectedPlant}_${selectedWarehouse}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

function printTable() {
  const group3Columns = [
    'quantityControlHU',
    'quantityControlQuantity',
    'material',
    'quantityControlDescription',
  ]
  const columnsForPrint = comparedTableColumns.filter(
    (c) => c.name !== 'state' && !group3Columns.includes(c.name),
  )

  const printableContent = `
    <html>
      <head>
        <title>Printable Table</title>
        <style>
        @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10px;
          }
          h3 {
            font-size: 14px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black;
            padding: 4px 6px;
            text-align: center;
            white-space: nowrap;
            font-size: 9px;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h3>Filtered Table for ${selectedPlant} and ${selectedWarehouse}</h3>
        <table>
          <thead>
            <tr>
              ${columnsForPrint.map((col) => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredRows.value
              .map(
                (row) =>
                  `<tr>${columnsForPrint
                    .map((col) => `<td>${row[col.field] || ''}</td>`)
                    .join('')}</tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `
  const printWindow = window.open('', '_blank')
  printWindow.document.open()
  printWindow.document.write(printableContent)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}
</script>
<style scoped>
:deep(.row-green) {
  background-color: #80f39b !important;
}
:deep(.row-red) {
  background-color: #e79393 !important;
}
:deep(.cell-white) {
  background-color: white !important;
}
:deep(.border-right-separator) {
  border-right: 2px solid #0a0505;
}
:deep(.q-table tbody td) {
  padding: 4px 8px !important;
  height: 32px !important;
}
:deep(.q-table thead th) {
  padding: 4px 8px !important;
}
</style>
