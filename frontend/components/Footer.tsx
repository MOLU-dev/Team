import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-cyan/10 py-10 md:py-12 text-center overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">
          &copy; 2026 BitSilo. All rights reserved.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-6">
          <Link href="#" className="text-xs sm:text-sm text-text-secondary transition-colors duration-300 hover:text-cyan">
            Privacy Policy
          </Link>
          <Link href="#" className="text-xs sm:text-sm text-text-secondary transition-colors duration-300 hover:text-cyan">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs sm:text-sm text-text-secondary transition-colors duration-300 hover:text-cyan">
            Documentation
          </Link>
          <Link href="/support" className="text-xs sm:text-sm text-text-secondary transition-colors duration-300 hover:text-cyan">
            Support
          </Link>
        </div>
      </div>
    </footer>
  )
}
