/** Countdown for OTP resend buttons; mirrors server cooldown duration. */
export function useOtpResendCooldown(cooldownSeconds: number) {
  const canResend = ref(true)
  const secondsLeft = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function clearTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function startCooldown(fromSeconds = cooldownSeconds) {
    clearTimer()
    const duration = Math.max(0, Math.floor(fromSeconds))
    if (duration === 0) {
      canResend.value = true
      secondsLeft.value = 0
      return
    }
    secondsLeft.value = duration
    canResend.value = false
    timer = setInterval(() => {
      secondsLeft.value -= 1
      if (secondsLeft.value <= 0) {
        canResend.value = true
        clearTimer()
      }
    }, 1000)
  }

  onScopeDispose(clearTimer)

  return { canResend, secondsLeft, startCooldown, clearTimer }
}
