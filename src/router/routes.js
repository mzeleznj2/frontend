const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: 'ucitaj-Excel',
        name: 'ucitajExcel',
        component: () => import('pages/ucitajExcel.vue'),
      },
      {
        path: 'obrada-Podataka',
        name: 'obradaPodataka',
        component: () => import('pages/ObradaPodataka.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
