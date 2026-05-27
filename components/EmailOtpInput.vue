<script setup lang="ts">
import {
  EMAIL_OTP_LENGTH,
  EMAIL_OTP_PATTERN,
  isCompleteEmailOtp,
  sanitizeEmailOtpInput,
} from '~/utils/email-otp-code'

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    testId?: string
    hint?: string
    pending?: boolean
    disabled?: boolean
    autoSubmit?: boolean
  }>(),
  {
    testId: undefined,
    hint: undefined,
    pending: false,
    disabled: false,
    autoSubmit: false,
  },
)

const emit = defineEmits<{ complete: [] }>()

const { t } = useI18n()

const hintText = computed(() => props.hint ?? t('common.otpSixDigits'))

function onInput(event: Event) {
  const next = sanitizeEmailOtpInput((event.target as HTMLInputElement).value)
  model.value = next
  if (props.autoSubmit && isCompleteEmailOtp(next) && !props.pending && !props.disabled) {
    emit('complete')
  }
}
</script>

<template>
  <fieldset class="fieldset gap-1 border-0 bg-transparent p-0">
    <label class="label w-full pb-0" :for="id">
      <span class="label-text text-[var(--infl0-panel-text)]">{{ label }}</span>
    </label>
    <input
      :id="id"
      :value="model"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      :maxlength="EMAIL_OTP_LENGTH"
      :minlength="EMAIL_OTP_LENGTH"
      :pattern="EMAIL_OTP_PATTERN"
      required
      class="input input-bordered infl0-field validator w-full tabular-nums tracking-[0.3em] text-center"
      :class="{ 'opacity-60': pending }"
      :data-testid="testId"
      :disabled="disabled || pending"
      :aria-busy="pending"
      @input="onInput"
    >
    <p class="validator-hint hidden">{{ hintText }}</p>
  </fieldset>
</template>
