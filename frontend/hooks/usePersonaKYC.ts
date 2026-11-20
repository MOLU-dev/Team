// hooks/usePersonaKYC.ts
// Manages the full KYC session lifecycle: fetching the token,
// launching the Persona SDK, polling for status after completion.

import { useState, useCallback, useRef } from "react"
import { getAuthToken } from "@/lib/api/client"

export type KYCLevel = 2 | 3

export type KYCStatus =
  | "not_started"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired"

export interface LevelStatus {
  level: KYCLevel
  status: KYCStatus
  description: string
  approved_at?: string
}

export interface KYCProfile {
  full_name: string
  first_name: string
  last_name: string
  date_of_birth: string   // "YYYY-MM-DD"
  nationality: string
  id_type: string
  id_expiry: string
  address_line1: string
  address_city: string
  address_state: string
  country: string
  levels: LevelStatus[]
  highest_approved_level: number
  is_fully_verified: boolean
  verified_at?: string
}

export interface StartKYCResponse {
  application_id: string
  inquiry_id: string
  sdk_token: string
  web_url: string
  expires_at: string
}

interface UsePersonaKYCReturn {
  profile: KYCProfile | null
  isLoading: boolean
  isLaunching: boolean
  error: string | null
  startKYC: (level: KYCLevel) => Promise<void>
  resumeKYC: (level: KYCLevel) => Promise<void>
  refreshProfile: () => Promise<void>
}

export function usePersonaKYC(): UsePersonaKYCReturn {
  const [profile, setProfile]       = useState<KYCProfile | null>(null)
  const [isLoading, setIsLoading]   = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const clientRef                   = useRef<any>(null)

  // Load the Persona Web SDK lazily — only when needed
  const loadPersonaSDK = useCallback(async () => {
    if (typeof window === "undefined") return null
    if (clientRef.current) return clientRef.current

    // Persona's Web SDK is loaded at runtime, not bundled
    // Install: npm install @persona-kyc/inquiry-js
    try {
      const { Inquiry } = await import(
        // @ts-ignore
        "@persona-kyc/inquiry-js"
      )
      clientRef.current = Inquiry
      return Inquiry
    } catch (err) {
      console.error("Failed to load Persona SDK:", err)
      return null
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/kyc/me", {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      if (!res.ok) throw new Error("Could not fetch KYC profile")
      const data: KYCProfile = await res.json()
      setProfile(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const launchSDK = useCallback(
    async (token: string, inquiryId: string, level: KYCLevel) => {
      const Inquiry = await loadPersonaSDK()
      if (!Inquiry) {
        setError("Could not load verification SDK. Please ensure @persona-kyc/inquiry-js is installed.")
        return
      }

      setIsLaunching(true)
      setError(null)

      const client = new Inquiry({
        inquiryId,
        sessionToken: token,

        // Called when user completes the flow in the iframe
        onComplete: async ({ inquiryId, status }: { inquiryId: string, status: string }) => {
          setIsLaunching(false)

          if (status === "approved") {
            await refreshProfile()
          } else if (status === "needs_review" || status === "completed") {
            // Pending review — poll for status
            await pollForStatus(level)
          }
        },

        onCancel: () => {
          setIsLaunching(false)
          // User closed the flow — they can resume later
        },

        onError: (error: any) => {
          setIsLaunching(false)
          setError(error.message ?? "Verification error")
        },
      })

      client.open()
    },
    [loadPersonaSDK, refreshProfile]
  )

  // Poll backend until status resolves (for needs_review cases)
  const pollForStatus = useCallback(async (level: KYCLevel, attempts = 0) => {
    if (attempts > 12) return // give up after 1 minute

    await new Promise((r) => setTimeout(r, 5000)) // wait 5s between polls

    const res = await fetch(`/api/kyc/status?level=${level}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
    const data = await res.json()

    if (data.status === "approved") {
      await refreshProfile()
      return
    }
    if (data.status === "under_review" || data.status === "pending") {
      await pollForStatus(level, attempts + 1)
    }
  }, [refreshProfile])

  const startKYC = useCallback(async (level: KYCLevel) => {
    setError(null)
    try {
      const res = await fetch(`/api/kyc/start?level=${level}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to start verification")
      }
      const data: StartKYCResponse = await res.json()
      
      // Dev mode: if inquiry ID is mock, don't launch SDK
      if (data.inquiry_id.startsWith('mock_')) {
        await refreshProfile()
        return
      }

      await launchSDK(data.sdk_token, data.inquiry_id, level)
    } catch (err: any) {
      setError(err.message)
    }
  }, [launchSDK, refreshProfile])

  const resumeKYC = useCallback(async (level: KYCLevel) => {
    setError(null)
    try {
      const res = await fetch(`/api/kyc/resume?level=${level}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      if (!res.ok) throw new Error("Could not resume verification")
      const data: StartKYCResponse = await res.json()
      await launchSDK(data.sdk_token, data.inquiry_id, level)
    } catch (err: any) {
      setError(err.message)
    }
  }, [launchSDK])

  return { profile, isLoading, isLaunching, error, startKYC, resumeKYC, refreshProfile }
}
