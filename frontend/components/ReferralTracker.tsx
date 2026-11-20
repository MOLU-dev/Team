'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'

export default function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      // Store referral code in a cookie for 30 days
      Cookies.set('referral_code', ref, { expires: 30, path: '/' })
      console.log('Referral code captured:', ref)
    }
  }, [searchParams])

  return null
}
