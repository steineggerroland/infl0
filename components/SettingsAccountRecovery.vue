<script setup lang="ts">
import { normalizeOptionalRecoveryEmail } from '~/utils/username'
import { isCompleteEmailOtp } from '~/utils/email-otp-code'

const props = defineProps<{
  user: {
    username: string
    email: string | null
    recoveryEmailVerifiedAt: string | null
  } | null
}>()

const emit = defineEmits<{
  'user-updated': [user: NonNullable<typeof props.user>]
}>()

const { t } = useI18n()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const resendCooldownSeconds = runtimeConfig.public.emailOtpResendCooldownSeconds
const { canResend, secondsLeft, startCooldown } = useOtpResendCooldown(resendCooldownSeconds)

const editing = ref(false)
const codeSent = ref(false)
const recoveryEmailInput = ref('')
const recoveryCode = ref('')
const recoveryPending = ref(false)
const recoveryError = ref('')

const isVerified = computed(() => Boolean(props.user?.recoveryEmailVerifiedAt))

const normalizedEmailInput = computed(() =>
  normalizeOptionalRecoveryEmail(recoveryEmailInput.value),
)

const isAlreadyVerifiedEmail = computed(
  () =>
    isVerified.value &&
    Boolean(normalizedEmailInput.value) &&
    props.user?.email === normalizedEmailInput.value,
)

const editActionLabel = computed(() => {
  if (isVerified.value) return t('settingsIndex.recoveryChangeAction')
  if (props.user?.email) return t('settingsIndex.recoveryVerifyAction')
  return t('settingsIndex.recoverySetupAction')
})

const editorSubmitLabel = computed(() =>
  codeSent.value ? t('settingsIndex.recoveryConfirmCode') : t('settingsIndex.recoverySendCode'),
)

const resendLabel = computed(() =>
  canResend.value
    ? t('settingsIndex.recoveryResendCode')
    : t('settingsIndex.recoveryResendIn', { seconds: secondsLeft.value }),
)

const canSendVerificationCode = computed(
  () =>
    Boolean(normalizedEmailInput.value) &&
    !isAlreadyVerifiedEmail.value &&
    !recoveryPending.value,
)

function openEditor() {
  recoveryEmailInput.value = props.user?.email ?? ''
  recoveryCode.value = ''
  recoveryError.value = ''
  codeSent.value = false
  editing.value = true
}

function closeEditor() {
  editing.value = false
  codeSent.value = false
  recoveryCode.value = ''
  recoveryError.value = ''
}

async function requestRecoveryEmailVerification() {
  if (!canSendVerificationCode.value) return
  recoveryPending.value = true
  recoveryError.value = ''
  try {
    await $fetch('/api/auth/recovery-email/request', {
      method: 'POST',
      body: { email: recoveryEmailInput.value },
      credentials: 'include',
    })
    codeSent.value = true
    recoveryCode.value = ''
    startCooldown()
    toast.push({ message: t('settingsIndex.recoveryCodeSent'), variant: 'success' })
  } catch (e: unknown) {
    const { statusCode, message } = parseFetchError(e)
    recoveryError.value = message.trim() || t('settingsIndex.recoveryRequestFailed')
    if (statusCode === 429) startCooldown()
  } finally {
    recoveryPending.value = false
  }
}

async function confirmRecoveryEmailVerification() {
  if (!isCompleteEmailOtp(recoveryCode.value) || recoveryPending.value) return
  recoveryPending.value = true
  recoveryError.value = ''
  try {
    const res = await $fetch<{
      user: NonNullable<typeof props.user>
    }>('/api/auth/recovery-email/confirm', {
      method: 'POST',
      body: { email: recoveryEmailInput.value, code: recoveryCode.value },
      credentials: 'include',
    })
    emit('user-updated', res.user)
    closeEditor()
    toast.push({ message: t('settingsIndex.recoveryVerified'), variant: 'success' })
  } catch (e: unknown) {
    const { message } = parseFetchError(e)
    recoveryError.value = message.trim() || t('settingsIndex.recoveryConfirmFailed')
  } finally {
    recoveryPending.value = false
  }
}

function onEditorSubmit() {
  if (recoveryPending.value) return
  if (codeSent.value) {
    void confirmRecoveryEmailVerification()
  } else {
    void requestRecoveryEmailVerification()
  }
}

function onOtpComplete() {
  void confirmRecoveryEmailVerification()
}

async function resendVerificationCode() {
  if (!canResend.value || recoveryPending.value) return
  await requestRecoveryEmailVerification()
}
</script>

<template>
  <div v-if="user" class="infl0-panel space-y-4 p-5">
    <div>
      <p class="infl0-panel-muted text-xs font-medium">
        {{ t('settingsIndex.accountSignInNameLabel') }}
      </p>
      <p
        class="mt-1 text-sm text-[var(--infl0-panel-text)]"
        data-testid="account-sign-in-name"
      >
        {{ user.username }}
      </p>
    </div>

    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="infl0-panel-muted text-xs font-medium">
          {{ t('settingsIndex.accountRecoveryEmailLabel') }}
        </p>
        <p
          class="mt-1 text-sm text-[var(--infl0-panel-text)]"
          data-testid="account-recovery-email"
        >
          {{ user.email ?? t('settingsIndex.accountRecoveryEmailUnset') }}
        </p>
        <p
          v-if="user.email"
          class="mt-1 text-xs"
          :class="isVerified ? 'text-success' : 'infl0-panel-muted'"
          data-testid="account-recovery-email-status"
        >
          {{
            isVerified
              ? t('settingsIndex.accountRecoveryEmailVerified')
              : t('settingsIndex.accountRecoveryEmailUnverified')
          }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-outline btn-sm shrink-0"
        data-testid="edit-recovery-email"
        @click="openEditor"
      >
        {{ editActionLabel }}
      </button>
    </div>

    <form
      v-if="editing"
      class="space-y-3 border-t border-base-300/60 pt-4"
      data-testid="recovery-email-editor"
      @submit.prevent="onEditorSubmit"
    >
      <p class="infl0-panel-muted text-xs leading-snug">
        {{ t('settingsIndex.recoveryEditorHint') }}
      </p>

      <fieldset class="fieldset gap-1 border-0 bg-transparent p-0">
        <label class="label w-full pb-0" for="settings-recovery-email">
          <span class="label-text text-[var(--infl0-panel-text)]">
            {{ t('settingsIndex.recoveryEmailInput') }}
          </span>
        </label>
        <input
          id="settings-recovery-email"
          v-model="recoveryEmailInput"
          type="email"
          autocomplete="email"
          required
          class="input input-bordered infl0-field validator w-full"
          :class="{ 'input-error': isAlreadyVerifiedEmail }"
          data-testid="recovery-email-input"
          :readonly="codeSent"
        >
        <p
          v-if="isAlreadyVerifiedEmail"
          class="text-sm text-warning"
          data-testid="recovery-email-already-verified"
        >
          {{ t('settingsIndex.recoveryAlreadyVerified') }}
        </p>
      </fieldset>

      <template v-if="codeSent">
        <p class="infl0-panel-muted text-xs leading-snug" data-testid="recovery-email-spam-hint">
          {{ t('common.checkSpamFolder') }}
        </p>

        <EmailOtpInput
          id="settings-recovery-code"
          v-model="recoveryCode"
          :label="t('settingsIndex.recoveryCodePlaceholder')"
          test-id="recovery-email-code"
          :pending="recoveryPending"
          auto-submit
          @complete="onOtpComplete"
        />

        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!canResend || recoveryPending"
          data-testid="resend-recovery-email-code"
          @click="resendVerificationCode"
        >
          <span v-if="recoveryPending" class="loading loading-spinner loading-xs" aria-hidden="true" />
          {{ resendLabel }}
        </button>
      </template>

      <p
        v-if="recoveryError"
        role="alert"
        class="text-sm text-error"
        data-testid="recovery-email-error"
      >
        {{ recoveryError }}
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          :disabled="recoveryPending || (!codeSent && !canSendVerificationCode)"
          :data-testid="codeSent ? 'confirm-recovery-email-code' : 'request-recovery-email-code'"
        >
          <span v-if="recoveryPending" class="loading loading-spinner loading-xs" aria-hidden="true" />
          {{ recoveryPending ? t('common.loading') : editorSubmitLabel }}
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-testid="cancel-recovery-email-edit"
          @click="closeEditor"
        >
          {{ t('common.close') }}
        </button>
      </div>
    </form>
  </div>
</template>
