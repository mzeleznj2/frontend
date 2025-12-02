<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-lg">
      Import excel files for plant {{ selectedPlant }} i Warehouse {{ selectedWarehouse }}
    </div>

    <q-card class="q-pa-md q-mb-md">
      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <div class="text-subtitle1 q-mb-sm">Import Book balance</div>
            <q-uploader
              label="Add BB Excel file"
              ref="ksUploader"
              accept=".xls,.xlsx"
              :auto-upload="false"
              :disable="loading"
              @added="handleKSFileAdded"
              @removed="handleKSFileRemoved"
              style="max-width: 100%"
            />
            <q-btn
              label="IMPORT BB"
              color="primary"
              :disable="loading || !files.ks"
              class="q-mt-lg"
              @click="uploadKSFile"
            />
          </div>

          <div class="col-12 col-md-4">
            <div class="text-subtitle1 q-mb-sm">Import Inventory</div>
            <q-uploader
              label="Add inventory file"
              ref="popisanUploader"
              accept=".xls,.xlsx"
              :auto-upload="false"
              :disable="loading"
              @added="handlePopisanFileAdded"
              @removed="handlePopisanFileRemoved"
              style="max-width: 100%"
            />
            <q-btn
              label="IMPORT INV"
              color="primary"
              :disable="loading || !files.popisan"
              class="q-mt-lg"
              @click="uploadPopisano"
            />
          </div>

          <div class="col-12 col-md-4">
            <div class="text-subtitle1 q-mb-sm">Import Quantity Control</div>
            <q-uploader
              label="Add excel file for quantity control"
              ref="qcUploader"
              accept=".xls,.xlsx"
              :auto-upload="false"
              :disable="loading"
              @added="handleControlQuantityFileAdded"
              @removed="handleControlQuantityFileRemoved"
              style="max-width: 100%"
            />
            <q-btn
              label="IMPORT QC"
              color="primary"
              :disable="loading || !files.qc"
              class="q-mt-lg"
              @click="uploadQCFile"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Add button "Idi na obradu" named Obrada -->
    <q-btn
      :label="obradaLabel"
      color="secondary"
      class="q-mt-lg"
      @click="goToObrada"
      style="text-transform: none"
      :disable="loading"
    >
    </q-btn>
  </q-page>
</template>

<script setup>
import { Notify } from 'quasar'
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'

const handleKSFileAdded = onFileAdded('ks')
const handlePopisanFileAdded = onFileAdded('popisan')
const handleControlQuantityFileAdded = onFileAdded('qc')
const selectedPlant = localStorage.getItem('selectedPlant')
const selectedWarehouse = localStorage.getItem('selectedWarehouse')
const router = useRouter()

const obradaLabel = computed(() => {
  return `Go to processing ${selectedPlant || 'N/A'} i ${selectedWarehouse || 'N/A'}`
})

const files = reactive({
  ks: null,
  popisan: null,
  qc: null,
})

const loading = ref(false) //varijabla za Loading state

function goToObrada() {
  router.push({ name: 'obradaPodataka' })
}

function onFileAdded(type) {
  return (newFiles) => {
    if (newFiles && newFiles.length > 0) {
      const file = newFiles[0]
      validateExcelFile(file, type)
    } else {
      console.error(`No file selected for ${type}.`)
    }
  }
}

function handleKSFileRemoved() {
  files.ks = null
  const ksUploader = ref.ksUploader
  if (ksUploader) {
    ksUploader.reset()
    loading.value = false
  }
  Notify.create({
    type: 'info',
    message: 'KS Excel file is removed.',
  })
}

function handlePopisanFileRemoved() {
  files.popisan = null
  const popisanUploader = ref.popisanUploader
  if (popisanUploader) {
    popisanUploader.reset()
    loading.value = false
  }
  Notify.create({
    type: 'info',
    message: 'Inventory Excel file is removed.',
  })
}

function handleControlQuantityFileRemoved() {
  files.qc = null
  const qcUploader = ref.qcUploader
  if (qcUploader) {
    qcUploader.reset()
    loading.value = false
  }
  Notify.create({
    type: 'info',
    message: 'Control quantity Excel file is removed.',
  })
}

function validateExcelFile(file, type) {
  loading.value = true
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const range = XLSX.utils.decode_range(sheet['!ref'])

    const requiredColumns = type === 'ks' ? 23 : 10 // A-W = 23 columns, A-J = 10 columns
    const actualColumns = range.e.c + 1

    if (actualColumns < requiredColumns) {
      Notify.create({
        type: 'negative',
        position: 'top',
        message: `Excel file ${type === 'ks' ? 'KS' : 'Inventurni'} does not contain enough columns!`,
      })
      files[type] = null
      loading.value = false
      return
    } else {
      if (type === 'popisan' || type === 'qc') {
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 }) // Column 'A' is index 0
          const cell = sheet[cellAddress]
          if (!cell || cell.v !== selectedWarehouse) {
            Notify.create({
              type: 'negative',
              position: 'top',
              message: `Value in column 'A' doesn't match picked Warehouse-u (${selectedWarehouse}).`,
            })
            files[type] = null
            loading.value = false
            return
          }
        }
      }

      /* check columns G */
      if (type === 'popisan') {
        const columnGValues = []
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: 6 }) // Column 'G' is index 6
          const cell = sheet[cellAddress]
          if (cell && cell.v && cell.v !== 'ACTI' && cell.v !== 'COUN') {
            columnGValues.push(cell.v)
          }
        }
        const uniqueValues = [...new Set(columnGValues)]

        if (uniqueValues.length > 0) {
          Notify.create({
            type: 'warning',
            message: `Column 'G' contains values other then 'ACTI' ili 'COUN': ${uniqueValues.join(', ')}`,
          })
        }
      }

      /* QC validation moved here: column H must be 'COUN' or empty */
      if (type === 'qc') {
        const ref = sheet && sheet['!ref'] ? sheet['!ref'] : 'A1'
        const qcRange = XLSX.utils.decode_range(ref)
        const invalidH = []
        for (let row = qcRange.s.r + 1; row <= qcRange.e.r; row++) {
          const cellAddr = XLSX.utils.encode_cell({ r: row, c: 7 }) // H = index 7
          const cell = sheet[cellAddr]
          if (cell && cell.v !== undefined && String(cell.v).trim() !== '') {
            if (String(cell.v).trim().toUpperCase() !== 'COUN') {
              invalidH.push(String(cell.v))
            }
          }
        }
        const uniqueInvalid = [...new Set(invalidH)]
        if (uniqueInvalid.length > 0) {
          Notify.create({
            type: 'negative',
            position: 'top',
            message: `Column 'H' contains values other then 'COUN': ${uniqueInvalid.join(', ')}`,
          })
          files[type] = null
          loading.value = false
          return
        } else {
          Notify.create({
            type: 'positive',
            position: 'top',
            message: "QC file valid: column 'H' contains only 'COUN' (or empty).",
          })
        }
      }

      files[type] = file
      Notify.create({
        type: 'positive',
        message: `${type === 'ks' ? 'KS' : type === 'qc' ? 'QC' : 'Inventory'} file successfully validated and added.`,
      })
    }
    loading.value = false
  }
  reader.onerror = (err) => {
    console.error('Error reading file:', err)
    Notify.create({
      type: 'negative',
      position: 'top',
      message: `Error reading Excel file: ${err.message}`,
    })
    loading.value = false
  }
  reader.readAsArrayBuffer(file)
}

function uploadKSFile() {
  console.log('KS file added:', files.ks)

  if (!files.ks) {
    Notify.create({
      type: 'warning',
      position: 'top',
      message: 'You have not added an Excel file KS!',
    })
    return
  }

  loading.value = true
  const formData = new FormData()
  formData.append('ksFile', files.ks)
  formData.append('plant', selectedPlant)
  formData.append('warehouse', selectedWarehouse)

  fetch('http://10.24.131.7:96/api/excel/import', {
    method: 'POST',
    body: formData,
  })
    .then(async (res) => {
      if (res.status === 423) {
        throw new Error('Resource is locked. Upload process stopped.')
      }

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : await res.text()

      if (!res.ok) {
        throw new Error(data)
      }

      Notify.create({
        type: 'positive',
        message: 'KS File uspješno importan',
      })
      console.log(data)
    })
    .catch((err) => {
      console.error(err)
      Notify.create({
        type: 'negative',
        position: 'top',
        message: `Error: ${err.message} . Check if you have closed the file you are trying to upload.`,
      })
    })
    .finally(() => {
      loading.value = false
    })
}

function uploadPopisano() {
  console.log('Inventurni file:', files.popisan)

  if (!files.popisan) {
    Notify.create({
      type: 'warning',
      position: 'top',
      message: 'Niste dodali Excel Inventurni file!',
    })
    return
  }

  loading.value = true
  const formData = new FormData()
  formData.append('popisanFile', files.popisan)
  formData.append('plant', selectedPlant)
  formData.append('warehouse', selectedWarehouse)

  fetch('http://10.24.131.7:96/api/excel/importPopisano', {
    // fetch('http://localhost:5059/api/excel/importPopisano', {
    method: 'POST',
    body: formData,
  })
    .then(async (res) => {
      if (res.status === 423) {
        throw new Error('Resource is locked. Upload process stopped.')
      }

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : await res.text()

      if (!res.ok) {
        console.error('Response Error:', data)
        throw new Error(data)
      }

      Notify.create({
        type: 'positive',
        message: 'Inventory FILE successfully imported.',
      })
      console.log(data)
    })
    .catch((err) => {
      console.error(err)
      Notify.create({
        type: 'negative',
        position: 'top',
        message: `Error: ${err.message}. Check if you have closed the file you are trying to upload.`,
      })
    })
    .finally(() => {
      loading.value = false
    })
}

function uploadQCFile() {
  if (!files.qc) {
    Notify.create({
      type: 'warning',
      position: 'top',
      message: "You didn't add Quantity Control Excel file!",
    })
    return
  }

  loading.value = true
  const formData = new FormData()
  formData.append('qcFile', files.qc)
  formData.append('plant', selectedPlant)
  formData.append('warehouse', selectedWarehouse)

  // fetch('http://localhost:5059/api/excel/importFilesQuantityControl', {
  fetch('http://10.24.131.7:96/api/excel/importFilesQuantityControl', {
    method: 'POST',
    body: formData,
  })
    .then(async (res) => {
      if (res.status === 423) {
        throw new Error('Resource is locked. Upload process stopped.')
      }

      const isJson = res.headers.get('content-type')?.includes('application/json')
      const data = isJson ? await res.json() : await res.text()

      if (!res.ok) {
        console.error('Response Error:', data)
        throw new Error(data)
      }

      Notify.create({
        type: 'positive',
        message: 'Quantity control FILE successfully imported.',
      })
      console.log(data)
    })
    .catch((err) => {
      console.error(err)
      Notify.create({
        type: 'negative',
        position: 'top',
        message: `Error: ${err.message}. Check if you have closed the file you are trying to upload.`,
      })
    })
    .finally(() => {
      loading.value = false
    })
}
</script>
