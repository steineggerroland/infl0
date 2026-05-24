export default defineNuxtPlugin((nuxtApp) => {
  let hydrating = true
  let routerPending = 0
  let pagePending = 0
  let settleTimer: number | null = null

  function pendingStatus(): string | null {
    if (hydrating) return 'hydration'
    if (routerPending > 0 || pagePending > 0) return 'navigation'
    return null
  }

  function setStatus() {
    const status = pendingStatus()
    if (status) {
      document.body.dataset.testStatus = status
      return
    }
    delete document.body.dataset.testStatus
  }

  function settleStatus() {
    if (settleTimer != null) {
      window.clearTimeout(settleTimer)
      settleTimer = null
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        settleTimer = window.setTimeout(() => {
          settleTimer = null
          setStatus()
        }, 0)
      })
    })
  }

  function markHydrated() {
    hydrating = false
    settleStatus()
  }

  document.body.dataset.testStatus = 'hydration'

  const router = useRouter()
  router.beforeEach(() => {
    routerPending += 1
    setStatus()
  })
  router.afterEach(() => {
    routerPending = Math.max(0, routerPending - 1)
    settleStatus()
  })
  router.onError(() => {
    routerPending = 0
    settleStatus()
  })

  nuxtApp.hook('page:start', () => {
    pagePending += 1
    setStatus()
  })
  nuxtApp.hook('page:finish', () => {
    pagePending = Math.max(0, pagePending - 1)
    settleStatus()
  })
  nuxtApp.hook('app:mounted', markHydrated)
})
