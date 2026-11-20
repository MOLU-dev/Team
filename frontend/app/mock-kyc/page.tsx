import { redirect } from "next/navigation"

export default function MockKYCRedirect() {
  redirect("/kyc")
}
