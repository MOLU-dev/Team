"use client"

import { useState, useCallback, useEffect, useMemo, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import AppHeader from "@/components/shared/AppHeader"
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Wallet,
  UserCheck,
  Camera,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Check
} from "lucide-react"

type Step =
  | "phone_otp"
  | "enter_nin"
  | "verifying"
  | "review_identity"
  | "biometric"
  | "creating_account"
  | "success"
  | "error"

export interface CountryOption {
  code: string
  name: string
  currency: string
  flag_emoji: string
  document_label: string
  document_type: string
  document_format: string
  dial_code: string
  example_document: string
}

export const FALLBACK_COUNTRIES: CountryOption[] = [
  {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    flag_emoji: "🇳🇬",
    document_label: "National Identity Number (NIN)",
    document_type: "nin",
    document_format: "11 digits",
    dial_code: "+234",
    example_document: "12345678901",
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    flag_emoji: "🇺🇸",
    document_label: "Social Security Number (SSN)",
    document_type: "ssn",
    document_format: "9 digits",
    dial_code: "+1",
    example_document: "123456789",
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    flag_emoji: "🇰🇪",
    document_label: "National ID Number",
    document_type: "national_id",
    document_format: "8 digits",
    dial_code: "+254",
    example_document: "12345678",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    flag_emoji: "🇬🇧",
    document_label: "National Insurance (NI) Number",
    document_type: "ni_number",
    document_format: "9 alphanumeric",
    dial_code: "+44",
    example_document: "QQ123456A",
  },
  {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    flag_emoji: "🇬🇭",
    document_label: "Ghana Card (PIN)",
    document_type: "ghana_card",
    document_format: "10-15 chars",
    dial_code: "+233",
    example_document: "GHA-123456789-0",
  },
  {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    flag_emoji: "🇿🇦",
    document_label: "South African ID",
    document_type: "sa_id",
    document_format: "13 digits",
    dial_code: "+27",
    example_document: "9001015009087",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    flag_emoji: "🇨🇦",
    document_label: "Social Insurance Number (SIN)",
    document_type: "sin",
    document_format: "9 digits",
    dial_code: "+1",
    example_document: "123456789",
  },
  {
    code: "DE",
    name: "Germany / EU",
    currency: "EUR",
    flag_emoji: "🇪🇺",
    document_label: "National Identity Card",
    document_type: "national_id",
    document_format: "9-10 chars",
    dial_code: "+49",
    example_document: "T220001293",
  },
]

interface NINIdentity {
  nin: string
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth: string
  gender: string
  state: string
  lga: string
  address: {
    street1: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  nationality: string
  country?: string
  currency?: string
  confidence: number
}

interface AccountHolder {
  token: string
  account_token?: string
  status: string
  user_id: string
}

function KYCContent() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const requestedLevel = parseInt(searchParams.get("level") || "2", 10)

  const [countries, setCountries] = useState<CountryOption[]>(FALLBACK_COUNTRIES)
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(FALLBACK_COUNTRIES[0])

  const userCurrency = user?.currency ? user.currency.toUpperCase() : ""
  const isCurrencyLocked = Boolean(userCurrency)
  const isPhoneVerified = user?.phone_verified || (user?.tier || 0) >= 1
  const isTier2Verified = (user?.tier || 0) >= 2

  // Initial step based on current status and requested level
  const [step, setStep] = useState<Step>(() => {
    if (isTier2Verified) return "success"
    if (requestedLevel === 1) return "phone_otp"
    if (isPhoneVerified) return "enter_nin"
    return "phone_otp"
  })

  const [userId] = useState(() => (user?.id ? user.id : `user_${Math.random().toString(36).slice(2, 10)}`))

  // Step 1: Phone Verification
  const [phone, setPhone] = useState(user?.phone || "+2348012345678")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  // Step 2: National ID
  const [ninInput, setNinInput] = useState("")
  const [inquiryId, setInquiryId] = useState<string>("")
  const [verifyProgress, setVerifyProgress] = useState(0)
  const [identity, setIdentity] = useState<NINIdentity | null>(null)

  // Step 3 & 4: Biometrics & Account
  const [accountHolder, setAccountHolder] = useState<AccountHolder | null>(null)
  const [verifiedCountry, setVerifiedCountry] = useState<string>("")
  const [verifiedCurrency, setVerifiedCurrency] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [isCapturing, setIsCapturing] = useState(false)

  // Fetch supported countries from API
  useEffect(() => {
    fetch("/api/nin/countries")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.countries) && data.countries.length > 0) {
          setCountries(data.countries)
        }
      })
      .catch(() => {})
  }, [])

  // Auto-match and permanently lock country if user has an assigned fiat currency
  useEffect(() => {
    if (userCurrency) {
      const match = countries.find(
        (c) => c.currency.toUpperCase() === userCurrency.toUpperCase()
      )
      if (match) {
        setSelectedCountry(match)
      }
    }
  }, [userCurrency, countries])

  // If user phone verified status changes, advance past phone step if on it
  useEffect(() => {
    if (isPhoneVerified && step === "phone_otp" && requestedLevel >= 2) {
      setStep("enter_nin")
    }
  }, [isPhoneVerified, step, requestedLevel])

  // When selected country changes (only allowed if currency not locked)
  const handleSelectCountry = (country: CountryOption) => {
    if (isCurrencyLocked) return
    setSelectedCountry(country)
    setNinInput("")
    setError("")
    const digitsOnly = phone.replace(/\D/g, "")
    setPhone(`${country.dial_code}${digitsOnly.slice(3) || "8012345678"}`)
  }

  // ────────────────────────────────────────────────────────────
  // STEP 1: Phone OTP (Tier 1 Verification)
  // ────────────────────────────────────────────────────────────
  const handleRequestOTP = async () => {
    if (!phone) return
    setPhoneLoading(true)
    setError("")
    try {
      const res = await fetch("/api/nin/phone/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send OTP")
      setOtpSent(true)
      if (data.otp_code) {
        setDevOtpHint(data.otp_code)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!otpCode) return
    setPhoneLoading(true)
    setError("")
    try {
      const res = await fetch("/api/nin/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode, user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid OTP code")
      
      if (refreshUser) {
        await refreshUser()
      }
      setStep("enter_nin")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPhoneLoading(false)
    }
  }

  // ────────────────────────────────────────────────────────────
  // STEP 2: National ID Verification (Tier 2 Verification)
  // ────────────────────────────────────────────────────────────
  const startInquiry = async () => {
    setError("")
    try {
      const effectiveCurrency = userCurrency || selectedCountry.currency
      const res = await fetch("/api/nin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          nin: ninInput,
          country: selectedCountry.code,
          currency: effectiveCurrency,
          phone: phone || user?.phone || "",
          email: user?.email || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Verification failed")
        setStep("error")
        return
      }

      setInquiryId(data.inquiry_id)
      setStep("verifying")
      startPolling(data.inquiry_id)
    } catch (err: any) {
      setError(err.message)
      setStep("error")
    }
  }

  const startPolling = useCallback((id: string) => {
    let p = 10
    const interval = setInterval(async () => {
      try {
        p = Math.min(p + 25, 95)
        setVerifyProgress(p)

        const res = await fetch(`/api/nin/inquiries/${id}`)
        if (res.status === 404) return

        const data = await res.json()
        if (data.inquiry?.status === "completed") {
          clearInterval(interval)
          setIdentity(data.nin_identity)
          setVerifyProgress(100)
          setStep("review_identity")
        } else if (data.inquiry?.status === "failed") {
          clearInterval(interval)
          setError(data.inquiry.failure_reason || "Document verification failed")
          setStep("error")
        }
      } catch {
        // Continue polling
      }
    }, 600)

    setTimeout(() => clearInterval(interval), 15000)
    return () => clearInterval(interval)
  }, [])

  // ────────────────────────────────────────────────────────────
  // STEP 3: Biometric Face Match & Account Assignment
  // ────────────────────────────────────────────────────────────
  const handleBiometric = async () => {
    setIsCapturing(true)
    setError("")
    try {
      const res = await fetch("/api/nin/biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          selfie_data: "data:image/jpeg;base64,mock_selfie_stream_liveness_verified",
          liveness_challenge_completed: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.biometric_status !== "completed") {
        throw new Error(data.error || "Biometric liveness check failed")
      }

      setStep("creating_account")

      // Step 4: Provision account, elevate to Tier 2 and permanently assign currency
      const accountRes = await fetch("/api/nin/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiry_id: inquiryId }),
      })
      const accountData = await accountRes.json()
      if (!accountRes.ok) {
        throw new Error(accountData.error || "Account provisioning failed")
      }

      setAccountHolder(accountData.account_holder)
      setVerifiedCountry(accountData.country || selectedCountry.code)
      setVerifiedCurrency(accountData.currency || userCurrency || selectedCountry.currency)

      if (refreshUser) {
        await refreshUser()
      }

      setStep("success")
    } catch (err: any) {
      setError(err.message)
      setStep("error")
    } finally {
      setIsCapturing(false)
    }
  }

  const reset = () => {
    if (isPhoneVerified) {
      setStep("enter_nin")
    } else {
      setStep("phone_otp")
    }
    setInquiryId("")
    setIdentity(null)
    setAccountHolder(null)
    setError("")
    setNinInput("")
    setVerifyProgress(0)
    setOtpSent(false)
    setOtpCode("")
  }

  const stepList = [
    { key: "phone", label: "Tier 1: Phone OTP", num: "1" },
    { key: "nin", label: "Tier 2: National ID", num: "2" },
    { key: "review", label: "Identity Match", num: "3" },
    { key: "selfie", label: "Face Match", num: "4" },
    { key: "done", label: "Verified Tier 2", num: "5" },
  ]

  const getCurrentStepIndex = () => {
    switch (step) {
      case "phone_otp":
        return 0
      case "enter_nin":
      case "verifying":
        return 1
      case "review_identity":
        return 2
      case "biometric":
      case "creating_account":
        return 3
      case "success":
        return 4
      default:
        return 0
    }
  }

  return (
    <div className="min-h-screen bg-midnight text-text-primary flex flex-col justify-between">
      <AppHeader showBackButton={true} backHref="/dashboard" />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} /> Tier Identity Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-orbitron tracking-tight text-text-primary">
            Account & Region Verification
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-lg mx-auto leading-relaxed">
            Verify your identity across multiple supported regions. Your native fiat wallet currency will be permanently assigned to your verified country.
          </p>
        </div>

        {/* Stepper Bar */}
        {step !== "success" && (
          <div className="mb-6 bg-surface-subtle border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              {stepList.map((item, idx) => {
                const currentIdx = getCurrentStepIndex()
                const isDone = idx < currentIdx || (idx === 0 && isPhoneVerified)
                const isCurrent = idx === currentIdx && !(idx === 0 && isPhoneVerified)
                return (
                  <div key={item.key} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                        isDone
                          ? "bg-cyan text-midnight font-bold shadow-md shadow-cyan/20"
                          : isCurrent
                          ? "bg-cyan/20 text-cyan ring-2 ring-cyan/50 font-bold"
                          : "bg-white/5 text-text-secondary border border-white/10"
                      }`}
                    >
                      {isDone ? <Check size={14} /> : item.num}
                    </div>
                    <span
                      className={`text-[10px] hidden sm:block ${
                        isCurrent
                          ? "text-cyan font-bold"
                          : isDone
                          ? "text-text-primary font-medium"
                          : "text-text-secondary"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan via-electric-blue to-cyan h-full transition-all duration-300"
                style={{
                  width: `${((getCurrentStepIndex() + 1) / stepList.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Multi-Region Country & Currency Selector Card */}
        {step !== "success" && step !== "verifying" && step !== "creating_account" && (
          <div className="mb-6 p-5 rounded-2xl bg-surface-subtle border border-border shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan" />
                Country & Fiat Currency
              </label>
              {isCurrencyLocked ? (
                <span className="text-[11px] font-bold text-cyan bg-cyan/10 px-2.5 py-1 rounded-full border border-cyan/30 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Permanently Locked ({userCurrency})
                </span>
              ) : (
                <span className="text-[11px] text-text-secondary">
                  Will assign: <strong className="text-cyan">{selectedCountry.currency}</strong>
                </span>
              )}
            </div>

            {isCurrencyLocked && (
              <div className="mb-3 p-3 rounded-xl bg-cyan/5 border border-cyan/20 text-xs text-text-secondary flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-text-primary">
                    Fiat Currency is permanently set to {userCurrency}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Your account is permanently locked to {selectedCountry.name} ({userCurrency}) and cannot be edited.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {countries.map((c) => {
                const isSelected = c.code === selectedCountry.code
                const isDisabled = isCurrencyLocked && !isSelected
                return (
                  <button
                    key={c.code}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectCountry(c)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-cyan/10 border-cyan text-text-primary shadow-md shadow-cyan/10 ring-1 ring-cyan/40"
                        : isDisabled
                        ? "bg-white/5 border-white/5 text-text-secondary/40 opacity-40 cursor-not-allowed"
                        : "bg-surface-elevated border-border text-text-secondary hover:border-cyan/40 hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{c.flag_emoji}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 text-cyan">
                        {c.currency}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-tight truncate">{c.name}</p>
                      <p className="text-[9px] text-text-secondary truncate">{c.document_label.split(" ")[0]}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Dynamic KYC Card Container */}
        <div className="rounded-3xl border border-border bg-surface-subtle p-6 sm:p-8 shadow-xl backdrop-blur-md">
          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 1: PHONE VERIFICATION (Tier 1)                          */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "phone_otp" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold tracking-wider text-cyan uppercase flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Tier 1 Requirement
                </div>
                <h2 className="text-xl font-bold text-text-primary font-orbitron">Phone Verification</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Enter your mobile number for {selectedCountry.name} ({selectedCountry.dial_code}). A 6-digit verification code will be generated for instant verification.
                </p>
              </div>

              {error && (
                <div className="p-3 text-xs bg-danger/10 border border-danger/30 text-danger rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Phone Number ({selectedCountry.name})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                      placeholder={`${selectedCountry.dial_code}8012345678`}
                      className="flex-1 rounded-xl bg-midnight border border-border px-4 py-3 text-sm text-text-primary focus:border-cyan focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={phoneLoading || !phone}
                      className="px-5 py-3 rounded-xl bg-cyan text-midnight font-bold text-xs hover:bg-electric-blue disabled:opacity-50 transition-all shadow-md shadow-cyan/10"
                    >
                      {phoneLoading ? "Sending…" : otpSent ? "Resend" : "Send OTP"}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="p-4 rounded-2xl bg-midnight border border-border space-y-3 animate-fade-slide-up">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary font-medium">Enter 6-digit Code</span>
                      {devOtpHint && (
                        <button
                          type="button"
                          onClick={() => setOtpCode(devOtpHint)}
                          className="text-[11px] text-cyan bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/30 hover:bg-cyan/20 font-medium"
                        >
                          Auto-fill: <span className="font-mono font-bold">{devOtpHint}</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="w-full text-center text-2xl font-mono tracking-[0.3em] py-3 rounded-xl bg-surface-subtle border border-border text-cyan focus:border-cyan focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      disabled={phoneLoading || otpCode.length !== 6}
                      className="w-full py-3 rounded-xl bg-cyan text-midnight font-bold text-sm hover:bg-electric-blue disabled:opacity-40 transition-all shadow-lg shadow-cyan/10"
                    >
                      {phoneLoading ? "Verifying…" : "Confirm Phone & Continue to Tier 2 →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 2: ENTER NATIONAL ID (Tier 2)                           */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "enter_nin" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold tracking-wider text-cyan uppercase flex items-center gap-1.5">
                  <span>{selectedCountry.flag_emoji}</span>
                  <span>{selectedCountry.name} · Tier 2 Verification</span>
                </div>
                <h2 className="text-xl font-bold text-text-primary font-orbitron">
                  Enter {selectedCountry.document_label}
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Required Format: <span className="text-text-primary font-semibold">{selectedCountry.document_format}</span>. Resolves official identity data and assigns your native wallet currency to <strong className="text-cyan font-bold">{userCurrency || selectedCountry.currency}</strong>.
                </p>
              </div>

              {error && (
                <div className="p-3 text-xs bg-danger/10 border border-danger/30 text-danger rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-text-secondary">{selectedCountry.document_label}</label>
                    <span className="text-[11px] font-mono text-cyan">
                      {selectedCountry.document_format}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={ninInput}
                    onChange={(e) => setNinInput(e.target.value.toUpperCase())}
                    placeholder={`e.g. ${selectedCountry.example_document}`}
                    className="w-full py-3.5 px-4 text-center font-mono text-xl tracking-[0.2em] rounded-2xl bg-midnight border border-border text-cyan focus:border-cyan focus:outline-none transition-colors"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-midnight border border-border">
                  <p className="text-[11px] text-text-secondary mb-2 flex items-center gap-1">
                    <Sparkles size={12} className="text-cyan" /> Quick test numbers for {selectedCountry.name}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      selectedCountry.example_document,
                      selectedCountry.code === "US"
                        ? "987654321"
                        : selectedCountry.code === "KE"
                        ? "87654321"
                        : selectedCountry.code === "GB"
                        ? "AB123456C"
                        : selectedCountry.code === "ZA"
                        ? "8502025009087"
                        : selectedCountry.code === "CA"
                        ? "456789012"
                        : "98765432109",
                    ].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNinInput(n)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-text-secondary hover:text-cyan hover:border-cyan/40 font-mono transition-colors"
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startInquiry}
                  disabled={!ninInput || ninInput.length < 6}
                  className="w-full py-3.5 rounded-xl bg-cyan text-midnight font-bold text-sm hover:bg-electric-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan/10"
                >
                  Verify {selectedCountry.document_label.split(" ")[0]} & Match Identity →
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 2B: VERIFYING ANIMATION                                */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "verifying" && (
            <div className="py-8 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 text-white/10" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" />
                </svg>
                <svg
                  className="absolute inset-0 w-20 h-20 text-cyan animate-spin"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="264"
                    strokeDashoffset={264 - verifyProgress * 2.64}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-cyan">
                  {verifyProgress}%
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary">Validating National Registry</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Connecting to {selectedCountry.name} ({selectedCountry.code}) verification network...
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2 text-xs text-left bg-midnight p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-cyan">
                  <span>✓</span> <span>Checking checksum & format</span>
                </div>
                <div className="flex items-center gap-2 text-cyan">
                  <span>✓</span> <span>Querying identity registry</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <span className="animate-pulse text-cyan">●</span>{" "}
                  <span>Mapping fiat currency ({userCurrency || selectedCountry.currency})</span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 2C: REVIEW EXTRACTED IDENTITY                          */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "review_identity" && identity && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary font-orbitron">Identity Matched</h2>
                  <p className="text-xs text-text-secondary">Official records matched from {selectedCountry.name}.</p>
                </div>
                <span className="text-xs bg-cyan/10 text-cyan px-3 py-1 rounded-full border border-cyan/30 font-semibold">
                  Confidence: {(identity.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="rounded-2xl bg-midnight border border-border p-5 space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-text-secondary uppercase tracking-wider text-[10px]">
                    Assigned Fiat Wallet
                  </span>
                  <span className="font-mono text-cyan text-sm font-bold flex items-center gap-1.5">
                    <span>{selectedCountry.flag_emoji}</span>
                    <span>{userCurrency || selectedCountry.currency}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-text-secondary uppercase tracking-wider text-[10px]">
                    Document Number
                  </span>
                  <span className="font-mono text-text-primary text-sm font-semibold">
                    {identity.nin}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-text-secondary uppercase tracking-wider text-[10px]">First Name</span>
                    <p className="text-text-primary font-semibold text-sm">{identity.first_name}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary uppercase tracking-wider text-[10px]">Last Name</span>
                    <p className="text-text-primary font-semibold text-sm">{identity.last_name}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary uppercase tracking-wider text-[10px]">Date of Birth</span>
                    <p className="text-text-primary font-semibold text-sm">{identity.date_of_birth}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary uppercase tracking-wider text-[10px]">Gender</span>
                    <p className="text-text-primary font-semibold text-sm capitalize">{identity.gender}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-text-secondary uppercase tracking-wider text-[10px]">Registered Address</span>
                  <p className="text-text-secondary mt-0.5 text-xs">
                    {identity.address.street1}, {identity.address.city}, {identity.address.state},{" "}
                    {identity.nationality}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-medium text-xs hover:bg-white/5 transition-colors"
                >
                  Change Document
                </button>
                <button
                  type="button"
                  onClick={() => setStep("biometric")}
                  className="flex-1 py-3 rounded-xl bg-cyan text-midnight font-bold text-xs hover:bg-electric-blue transition-all shadow-md shadow-cyan/10"
                >
                  Confirm & Take Selfie →
                </button>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 3: BIOMETRIC SELFIE (Tier 2 Biometrics)                */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "biometric" && (
            <div className="space-y-6 text-center">
              <div className="space-y-1">
                <div className="text-xs font-bold tracking-wider text-cyan uppercase flex items-center justify-center gap-1.5">
                  <Camera size={14} /> Tier 2 Biometrics
                </div>
                <h2 className="text-xl font-bold text-text-primary font-orbitron">Facial Liveness Match</h2>
                <p className="text-xs text-text-secondary">
                  Confirm liveness match with official identity photo for {selectedCountry.name}.
                </p>
              </div>

              {error && (
                <div className="p-3 text-xs bg-danger/10 border border-danger/30 text-danger rounded-xl text-left flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Viewfinder Circle */}
              <div className="py-4">
                <div className="relative w-36 h-36 mx-auto rounded-full border-2 border-dashed border-cyan bg-midnight flex items-center justify-center p-2 ring-8 ring-cyan/10">
                  <div className="w-full h-full rounded-full bg-surface-subtle flex flex-col items-center justify-center text-text-secondary">
                    <Camera className="w-10 h-10 text-cyan mb-1 animate-pulse" />
                    <span className="text-[10px] text-text-secondary font-mono">Liveness Check</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBiometric}
                disabled={isCapturing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan via-electric-blue to-cyan text-midnight font-bold text-sm hover:scale-[1.01] disabled:opacity-50 transition-all shadow-lg shadow-cyan/20"
              >
                {isCapturing ? "Analyzing Liveness & Face Match…" : "Capture Selfie & Verify Liveness →"}
              </button>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 3B: PROVISIONING ACCOUNT                               */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "creating_account" && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-4 border-cyan border-t-transparent rounded-full animate-spin" />
              <h3 className="text-base font-bold text-text-primary font-orbitron">Assigning Fiat Currency & Elevating Tier</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Permanently locking native fiat currency to {userCurrency || selectedCountry.currency} and unlocking Tier 2 platform features...
              </p>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP 4: SUCCESS / VERIFIED PROFILE                          */}
          {/* ──────────────────────────────────────────────────────────── */}
          {(step === "success" || isTier2Verified) && (
            <div className="space-y-6 text-center animate-fade-slide-up">
              <div className="w-16 h-16 mx-auto rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan shadow-lg shadow-cyan/10">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-cyan font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Tier 2 Verified
                </span>
                <h2 className="text-2xl font-bold font-orbitron text-text-primary mt-1">Identity Verified</h2>
                <p className="text-xs text-text-secondary mt-1">
                  Your identity is confirmed and region-specific financial services are fully unlocked.
                </p>
              </div>

              <div className="rounded-2xl bg-midnight border border-border p-5 text-left text-xs space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-border">
                  <span className="text-text-secondary">Verified Country</span>
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <span>{selectedCountry.flag_emoji}</span>
                    <span>{selectedCountry.name} ({verifiedCountry || selectedCountry.code})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border">
                  <span className="text-text-secondary">Assigned Fiat Wallet Currency</span>
                  <span className="font-bold text-cyan font-mono text-sm flex items-center gap-1.5">
                    <Lock size={12} /> {verifiedCurrency || userCurrency || selectedCountry.currency}
                    <span className="text-[10px] font-sans font-normal px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
                      Permanently Locked
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border">
                  <span className="text-text-secondary">Account Tier</span>
                  <span className="font-bold text-cyan uppercase">Tier 2 (Advanced Trading Active)</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border">
                  <span className="text-text-secondary">Fiat Operations</span>
                  <span className="text-cyan font-semibold">Deposit & Withdrawal Enabled</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Daily Limit</span>
                  <span className="text-text-primary font-semibold">$50,000 / day</span>
                </div>
              </div>

              {/* Tier 3 Notice */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border text-left flex items-start gap-3">
                <FileText className="w-5 h-5 text-text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Tier 3 (Proof of Address) — Coming Soon</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Tier 3 unlocks physical platinum metal cards and limits up to $1M+. No further action is required today.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/receive"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan via-electric-blue to-cyan text-midnight font-bold text-xs hover:scale-[1.02] transition-transform text-center flex items-center justify-center gap-2 shadow-lg shadow-cyan/10"
                >
                  <Wallet className="w-4 h-4" /> Deposit Crypto
                </Link>
                <Link
                  href="/fiat"
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-text-primary font-bold text-xs hover:bg-white/10 transition-all text-center flex items-center justify-center gap-2"
                >
                  Manage Fiat ({verifiedCurrency || userCurrency || selectedCountry.currency}) →
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 px-4 rounded-xl bg-surface-subtle border border-border text-text-secondary font-semibold text-xs hover:text-text-primary transition-all text-center flex items-center justify-center gap-2"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* STEP: ERROR                                                 */}
          {/* ──────────────────────────────────────────────────────────── */}
          {step === "error" && (
            <div className="py-6 text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center text-danger">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-primary font-orbitron">Verification Failed</h2>
                <p className="text-xs text-danger mt-1 max-w-sm mx-auto">{error}</p>
              </div>

              <button
                type="button"
                onClick={reset}
                className="w-full py-3 rounded-xl bg-cyan text-midnight font-bold text-xs hover:bg-electric-blue transition-all"
              >
                Try Again →
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-text-secondary mt-8">
          BitSilo Identity & Compliance Engine · Tier-based multi-region verification with permanently assigned fiat currency.
        </p>
      </main>
    </div>
  )
}

export default function KYCPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-midnight flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KYCContent />
    </Suspense>
  )
}
