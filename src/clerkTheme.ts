import { dark } from "@clerk/themes";

/**
 * Premium dark appearance for Clerk SignIn / SignUp embeds.
 */
export const homeOsClerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "transparent",
    colorInputBackground: "#111114",
    colorInputText: "#FAFAFA",
    colorText: "#FAFAFA",
    colorTextSecondary: "#8E8E93",
    colorTextOnPrimaryBackground: "#000000",
    colorNeutral: "#ffffff",
    colorDanger: "#f87171",
    borderRadius: "0.75rem",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    spacingUnit: "0.9rem",
  },
  elements: {
    rootBox: "w-full !max-w-none !m-0 !h-auto !min-h-0",
    cardBox:
      "!w-full !h-auto !min-h-0 !shadow-none !bg-transparent !p-0 !m-0 !gap-0 !overflow-visible !justify-start",
    card:
      "!w-full !h-auto !min-h-0 !max-w-none !shadow-none !bg-transparent !border-0 !p-0 !m-0 !rounded-none !overflow-visible !justify-start",
    main: "!gap-3.5 !p-0 !m-0 !w-full !h-auto !min-h-0 !justify-start !flex-none",
    header: "!hidden",
    headerTitle: "!hidden",
    headerSubtitle: "!hidden",
    socialButtonsRoot: "!w-full !gap-0 !m-0",
    socialButtons: "!w-full !gap-0 !grid !grid-cols-1",
    socialButtonsBlockButton:
      "!relative !w-full !bg-[#141418] !border !border-white/[0.12] !text-white " +
      "hover:!bg-[#1c1c22] !h-11 !min-h-[2.75rem] !max-h-[2.75rem] !shadow-none !rounded-xl !normal-case " +
      "!overflow-hidden !m-0 !px-4",
    socialButtonsBlockButtonText: "!text-[13px] !font-semibold !text-white !truncate",
    socialButtonsProviderIcon: "!w-4 !h-4 !shrink-0",
    socialButtonsBlockButtonArrow: "!hidden",
    // Hide "Last used" badge that overlaps the Google button
    lastAuthenticationStrategy:
      "!hidden !opacity-0 !pointer-events-none !w-0 !h-0 !overflow-hidden !absolute",
    dividerRow: "!my-0.5 !w-full",
    dividerLine: "!bg-white/[0.1]",
    dividerText: "!text-[#5C5C66] !text-[10px] !uppercase !tracking-wider !font-semibold",
    form: "!gap-3.5 !w-full !m-0",
    formFields: "!gap-3.5 !w-full",
    formFieldRow: "!gap-1.5 !w-full !m-0",
    formFieldLabelRow: "!mb-0 !w-full",
    formFieldLabel:
      "!text-[#8E8E93] !text-[10px] !font-semibold !uppercase !tracking-wider !mb-0",
    formFieldInput:
      "!box-border !w-full !bg-[#111114] !border !border-white/[0.12] !text-white " +
      "!h-11 !min-h-[2.75rem] !text-[13px] !rounded-xl !shadow-none !m-0 " +
      "placeholder:!text-[#55555F] focus:!border-white/30 focus:!ring-0 focus:!outline-none " +
      "focus:!shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
    formFieldInputShowPasswordButton: "!text-[#6B7280] hover:!text-white !right-2",
    formFieldInputGroup: "!w-full !bg-transparent !m-0",
    formButtonPrimary:
      "!w-full !bg-white !text-black hover:!bg-[#F0F0F0] !h-11 !min-h-[2.75rem] " +
      "!text-[13px] !font-bold !rounded-xl !shadow-none !normal-case !m-0 !mt-0.5",
    formFieldAction: "!text-white/70 hover:!text-white !text-[12px]",
    footer: "!hidden",
    footerAction: "!hidden",
    footerPages: "!hidden",
    logoBox: "!hidden",
    logoImage: "!hidden",
    identityPreview:
      "!bg-[#141418] !border !border-white/10 !rounded-xl !w-full !box-border",
    identityPreviewText: "!text-white !text-[13px]",
    identityPreviewEditButton: "!text-white/60 hover:!text-white",
    formFieldErrorText: "!text-red-400 !text-[11px] !mt-1",
    formFieldHintText: "!text-[#6B7280] !text-[11px]",
    otpCodeFieldInput: "!bg-[#111114] !border-white/10 !text-white !rounded-xl",
    alternativeMethodsBlockButton:
      "!bg-[#141418] !border !border-white/10 !text-white hover:!bg-[#1c1c22] !rounded-xl !w-full",
    formResendCodeLink: "!text-white hover:!text-white/80",
    badge: "!hidden",
    captcha: "!bg-transparent !w-full",
    phoneInputBox: "!bg-[#111114] !border-white/10 !rounded-xl !w-full",
  },
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    showOptionalFields: false,
    unsafe_disableDevelopmentModeWarnings: true,
  },
};
