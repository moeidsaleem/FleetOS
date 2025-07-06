"use client"

import Link from 'next/link'
import { Button } from '../components/ui/button'
import MagicLogo from '@/components/magicui/MagicLogo'
import { Badge } from '../components/ui/badge'
import { Star, Sun, Moon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTheme, ThemeProvider } from '@/components/ui/theme-provider'
import Head from 'next/head'

// Simple scroll animation hook
function useScrollReveal(ref: React.RefObject<HTMLElement>, options = { threshold: 0.1 }) {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const onReveal = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.classList.add('animate-fadein-slideup');
        }
      });
    };
    const observer = new window.IntersectionObserver(onReveal, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, options]);
}

// --- Navigation ---
function MainNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navItems = [
    { title: 'Features', href: '#features' },
    { title: 'How it Works', href: '#how-it-works' },
    { title: 'Pricing', href: '#pricing' },
    { title: 'FAQ', href: '#faq' },
    { title: 'Contact', href: '/contact' },
  ]
  const menuRef = useRef<HTMLDivElement>(null)

  // Trap focus and close on Esc
  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
      // Trap focus
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a,button,[tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
      <div className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <MagicLogo size={32} />
          <span className="text-xl font-bold text-black dark:text-white">Fleet OS</span>
          <Badge variant="secondary" className="text-xs ml-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">AI SaaS</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a key={item.title} href={item.href} className="px-3 py-1 text-gray-800 dark:text-gray-200 font-medium hover:text-black dark:hover:text-white transition-colors">
                {item.title}
              </a>
            ))}
            <Link href="/login"><Button variant="outline" className="border-gray-300 dark:border-gray-700 text-black dark:text-white">Login</Button></Link>
            <Link href="/demo"><Button variant="outline" className="border-gray-300 dark:border-gray-700 text-black dark:text-white">Book a Demo</Button></Link>
            <Link href="/pricing"><Button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100">Get Started Free</Button></Link>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(v => !v)} aria-label="Open menu">
              <span className="sr-only">Open menu</span>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </Button>
          </div>
          {/* Always show theme toggle at far right */}
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme} className="ml-2">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {/* Mobile menu overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-fadein" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          {/* Slide-in menu */}
          <div ref={menuRef} className="fixed top-0 right-0 z-50 h-full w-4/5 max-w-xs bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 shadow-xl flex flex-col gap-2 px-6 py-8 animate-slidein" role="dialog" aria-modal="true" tabIndex={-1}>
            <button className="absolute top-4 right-4" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="22" y2="22"/><line x1="6" y1="22" x2="22" y2="6"/></svg>
            </button>
            <div className="flex flex-col gap-2 mt-8">
              {navItems.map((item) => (
                <a key={item.title} href={item.href} className="py-3 px-2 text-lg font-medium text-gray-900 dark:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setMobileOpen(false)}>{item.title}</a>
              ))}
              <Link href="/login" className="py-2" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full border-gray-300 dark:border-gray-700 text-black dark:text-white">Login</Button></Link>
              <Link href="/demo" className="py-2" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full border-gray-300 dark:border-gray-700 text-black dark:text-white">Book a Demo</Button></Link>
              <div className="flex items-center gap-2 mt-2">
                <Link href="/pricing" className="py-2" onClick={() => setMobileOpen(false)}><Button className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100">Get Started Free</Button></Link>
              </div>
            </div>
          </div>
          <style jsx global>{`
            @keyframes slidein {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-slidein { animation: slidein 0.25s cubic-bezier(0.4,0,0.2,1) both; }
          `}</style>
        </>
      )}
    </nav>
  )
}

// --- Hero Section ---
function HeroSection() {
  const ref = useRef<HTMLElement>(null!);
  useScrollReveal(ref);
  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-20 flex flex-col items-center text-center border-b border-gray-100" data-reveal ref={ref}>
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-black mb-6 leading-tight drop-shadow-xl">AI Fleet Management.<br />24/7. No Humans Needed.</h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-8">The world&apos;s most advanced AI-powered fleet management system. Manage drivers, rides, and operations with zero human intervention.</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
          <Link href="/pricing"><Button size="lg" className="bg-black text-white hover:bg-gray-900 text-lg font-bold px-8 py-4 focus:ring-2 focus:ring-blue-400 active:scale-95 transition">Get Started Free</Button></Link>
          <Link href="/demo"><Button size="lg" variant="outline" className="text-lg font-bold px-8 py-4 border-gray-300 text-black focus:ring-2 focus:ring-blue-400 active:scale-95 transition">Book a Demo</Button></Link>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-gray-500 text-sm">
          <span>Trusted by leading fleets in Dubai &amp; beyond</span>
          <span className="flex items-center gap-1"><Star className="h-4 w-4 text-gray-400" /> 4.9/5 average rating</span>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  // Back to Top button state
  const [showBackToTop, setShowBackToTop] = useState(false)
  // Scroll progress state
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setShowBackToTop(scrollY > 300)
      setScrollProgress(docHeight > 0 ? (scrollY / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ThemeProvider>
      <Head>
        <title>Fleet OS – AI Fleet Management SaaS for Limousine Companies</title>
        <meta name="description" content="The world's most advanced AI-powered fleet management system. Manage drivers, rides, and operations with zero human intervention. Trusted by Dubai's top fleets." />
        <meta property="og:title" content="Fleet OS – AI Fleet Management SaaS" />
        <meta property="og:description" content="AI-powered fleet management for limousine companies. Real-time analytics, driver scoring, multi-channel alerts, and more." />
        <meta property="og:image" content="/public/file.svg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mrnicedrive.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fleet OS – AI Fleet Management SaaS" />
        <meta name="twitter:description" content="AI-powered fleet management for limousine companies. Real-time analytics, driver scoring, multi-channel alerts, and more." />
        <meta name="twitter:image" content="/public/file.svg" />
      </Head>
      {/* Scroll Progress Bar */}
      <div aria-hidden="true" className="fixed top-0 left-0 w-full h-1 z-[100] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" style={{ width: `${scrollProgress}%`, transition: 'width 0.2s', position: 'fixed' }} />
      <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
        <MainNav />
        <HeroSection />
        {/* Feature Grid Section */}
        <section id="features" className="relative py-12 md:py-20 bg-white dark:bg-black overflow-hidden border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl relative z-10" data-reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 md:mb-14 text-black dark:text-white">Why Fleet OS?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-2xl transition-colors duration-300 hover:scale-105 focus-within:scale-105">
                <svg className="h-10 w-10 text-gray-900 dark:text-white mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19V6h13M9 6L3 12l6 6" /></svg>
                <div className="font-bold text-lg mb-2 text-black dark:text-white">AI Fleet Management</div>
                <div className="text-gray-600 dark:text-gray-300">AI manages all your drivers, ride requests, and fleet ops 24/7. No humans needed.</div>
              </div>
              {/* Feature 2 */}
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-2xl transition-colors duration-300 hover:scale-105 focus-within:scale-105">
                <svg className="h-10 w-10 text-gray-900 dark:text-white mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                <div className="font-bold text-lg mb-2 text-black dark:text-white">Plug & Play Device</div>
                <div className="text-gray-600 dark:text-gray-300">Install our device in seconds for full vehicle, ride, and driver visibility. No setup, no hassle.</div>
              </div>
              {/* Feature 3 */}
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-2xl transition-colors duration-300 hover:scale-105 focus-within:scale-105">
                <svg className="h-10 w-10 text-gray-900 dark:text-white mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                <div className="font-bold text-lg mb-2 text-black dark:text-white">Smart Demand Zones</div>
                <div className="text-gray-600 dark:text-gray-300">AI fetches airport arrivals, weather, events, and directs drivers to demand zones.</div>
              </div>
              {/* Feature 4 */}
              <div className="group bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center text-center transition-transform hover:-translate-y-2 hover:shadow-2xl transition-colors duration-300 hover:scale-105 focus-within:scale-105">
                <svg className="h-10 w-10 text-gray-900 dark:text-white mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M16 3v4a1 1 0 0 0 1 1h4" /><path d="M8 21v-4a1 1 0 0 0-1-1H3" /></svg>
                <div className="font-bold text-lg mb-2 text-black dark:text-white">Multi-Channel Alerts</div>
                <div className="text-gray-600 dark:text-gray-300">AI sends alerts via WhatsApp, voice, and Telegram. Drivers always know what to do.</div>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl" data-reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-14 text-center text-black dark:text-white">How It Works</h2>
            <div className="relative flex flex-col md:grid md:grid-cols-9 gap-8">
              {/* Vertical connector line (desktop only) */}
              <div className="hidden md:block absolute left-1/2 top-0 h-full w-1 bg-gray-200 dark:bg-gray-700 z-0" style={{transform: 'translateX(-50%)'}} />
              {/* Step 1 */}
              <div className="md:col-span-4 md:col-start-1 flex justify-end md:pr-8">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-right md:text-right mb-0 md:mb-16 transition-colors duration-300">
                  <div className="absolute -right-6 top-8 md:top-8 flex items-center justify-center w-12 h-12 rounded-full border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-xl z-10">1</div>
                  <svg className="h-8 w-8 text-gray-900 dark:text-white mb-4 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                  <div className="font-bold text-lg mb-2 text-black dark:text-white">Add Your Fleet</div>
                  <div className="text-gray-600 dark:text-gray-300">Connect your vehicles and drivers in minutes. Plug in the device, sync with Uber, and you&apos;re live.</div>
                </div>
              </div>
              <div className="md:col-span-1 flex justify-center items-center md:col-start-5 md:row-span-1" />
              {/* Step 2 */}
              <div className="md:col-span-4 md:col-start-6 flex justify-start md:pl-8">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-left md:text-left mt-0 md:mt-16 transition-colors duration-300">
                  <div className="absolute -left-6 top-8 md:top-8 flex items-center justify-center w-12 h-12 rounded-full border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-xl z-10">2</div>
                  <svg className="h-8 w-8 text-gray-900 dark:text-white mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 21v-4a1 1 0 0 0-1-1H3" /><path d="M16 3v4a1 1 0 0 0 1 1h4" /></svg>
                  <div className="font-bold text-lg mb-2 text-black dark:text-white">AI Takes Over</div>
                  <div className="text-gray-600 dark:text-gray-300">AI assigns rides, monitors drivers, and sends alerts. No manual intervention needed.</div>
                </div>
              </div>
              {/* Step 3 */}
              <div className="md:col-span-4 md:col-start-1 flex justify-end md:pr-8">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-right md:text-right mb-0 md:mb-16 transition-colors duration-300">
                  <div className="absolute -right-6 top-8 md:top-8 flex items-center justify-center w-12 h-12 rounded-full border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-xl z-10">3</div>
                  <svg className="h-8 w-8 text-gray-900 dark:text-white mb-4 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  <div className="font-bold text-lg mb-2 text-black dark:text-white">Optimize & Grow</div>
                  <div className="text-gray-600 dark:text-gray-300">Get real-time analytics, demand zone routing, and driver coaching. Watch your fleet thrive.</div>
                </div>
              </div>
              <div className="md:col-span-1 flex justify-center items-center md:col-start-5 md:row-span-1" />
              {/* Step 4 */}
              <div className="md:col-span-4 md:col-start-6 flex justify-start md:pl-8">
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 w-full max-w-md text-left md:text-left mt-0 md:mt-16 transition-colors duration-300">
                  <div className="absolute -left-6 top-8 md:top-8 flex items-center justify-center w-12 h-12 rounded-full border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-xl z-10">4</div>
                  <svg className="h-8 w-8 text-gray-900 dark:text-white mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27" fill="currentColor" stroke="currentColor" strokeLinejoin="round" /></svg>
                  <div className="font-bold text-lg mb-2 text-black dark:text-white">Delight Customers</div>
                  <div className="text-gray-600 dark:text-gray-300">Faster pickups, happier drivers, and seamless operations. Your fleet, upgraded.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Trusted By Section */}
        <section className="py-8 md:py-12 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl" data-reveal>
            <div className="mb-4 md:mb-6 flex flex-col items-center">
              <span className="uppercase text-xs tracking-widest text-gray-400 font-semibold mb-2">Trusted by</span>
              <div className="flex flex-wrap justify-center gap-6 md:gap-12 items-center">
                {/* Placeholder logos/brands */}
                <div className="flex flex-col items-center group">
                  <svg width="64" height="32" viewBox="0 0 64 32" fill="none" className="grayscale group-hover:grayscale-0 transition duration-200"><rect width="64" height="32" rx="8" fill="#E5E7EB"/><text x="50%" y="55%" textAnchor="middle" fill="#111827" fontSize="14" fontWeight="bold" alignmentBaseline="middle">Dubai Limo</text></svg>
                </div>
                <div className="flex flex-col items-center group">
                  <svg width="64" height="32" viewBox="0 0 64 32" fill="none" className="grayscale group-hover:grayscale-0 transition duration-200"><rect width="64" height="32" rx="8" fill="#E5E7EB"/><text x="50%" y="55%" textAnchor="middle" fill="#111827" fontSize="14" fontWeight="bold" alignmentBaseline="middle">Royal Chauffeurs</text></svg>
                </div>
                <div className="flex flex-col items-center group">
                  <svg width="64" height="32" viewBox="0 0 64 32" fill="none" className="grayscale group-hover:grayscale-0 transition duration-200"><rect width="64" height="32" rx="8" fill="#E5E7EB"/><text x="50%" y="55%" textAnchor="middle" fill="#111827" fontSize="14" fontWeight="bold" alignmentBaseline="middle">Prestige Cars</text></svg>
                </div>
                <div className="flex flex-col items-center group">
                  <svg width="64" height="32" viewBox="0 0 64 32" fill="none" className="grayscale group-hover:grayscale-0 transition duration-200"><rect width="64" height="32" rx="8" fill="#E5E7EB"/><text x="50%" y="55%" textAnchor="middle" fill="#111827" fontSize="14" fontWeight="bold" alignmentBaseline="middle">Metro Limo</text></svg>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl" data-reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-14 text-center text-black dark:text-white">What Our Customers Say</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              {/* Testimonial 1 */}
              <div className="min-w-[320px] max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">“Fleet OS has transformed our operations. Our drivers are happier and our customers are too!”</div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xl text-gray-700 dark:text-gray-200">A</div>
                  <div>
                    <div className="font-semibold text-black dark:text-white">Ahmed R.</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Fleet Manager, Dubai Limo</div>
                  </div>
                </div>
              </div>
              {/* Testimonial 2 */}
              <div className="min-w-[320px] max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">“The AI alerts and analytics are a game changer. We save hours every week.”</div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xl text-gray-700 dark:text-gray-200">S</div>
                  <div>
                    <div className="font-semibold text-black dark:text-white">Sarah L.</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Ops Lead, Royal Chauffeurs</div>
                  </div>
                </div>
              </div>
              {/* Testimonial 3 */}
              <div className="min-w-[320px] max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">“Setup was instant. The support team is fantastic and the product just works.”</div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xl text-gray-700 dark:text-gray-200">J</div>
                  <div>
                    <div className="font-semibold text-black dark:text-white">James P.</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">CEO, Prestige Cars</div>
                  </div>
                </div>
              </div>
              {/* Testimonial 4 */}
              <div className="min-w-[320px] max-w-xs bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between">
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">“We&apos;ve seen a 20% increase in completed trips and a huge drop in idle time.”</div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-xl text-gray-700 dark:text-gray-200">M</div>
                  <div>
                    <div className="font-semibold text-black dark:text-white">Mohammed K.</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Owner, Metro Limo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Black Background Section (Highlight/CTA) */}
        <section className="py-12 md:py-20 bg-black text-white border-b border-gray-900">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center" data-reveal>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to Upgrade Your Fleet?</h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">Experience the future of fleet management with AI-powered automation, real-time analytics, and multi-channel driver engagement. No more manual headaches—just results.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/demo"><Button size="lg" className="bg-white text-black font-bold px-8 py-4 hover:bg-gray-200">Book a Free Demo</Button></Link>
              <Link href="/pricing"><Button size="lg" variant="outline" className="border-white text-white font-bold px-8 py-4 hover:bg-white hover:text-black">See Pricing</Button></Link>
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section id="faq" className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl" data-reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-14 text-center text-black dark:text-white">Frequently Asked Questions</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">How long does it take to set up Fleet OS?</h3>
                <p className="text-gray-700 dark:text-gray-300">Most fleets are up and running in under 24 hours. Our team will guide you through every step.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Can I try before I buy?</h3>
                <p className="text-gray-700 dark:text-gray-300">Yes! Book a free demo and experience the platform with no commitment.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Is my data secure?</h3>
                <p className="text-gray-700 dark:text-gray-300">Absolutely. We use enterprise-grade security and never share your data with third parties.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">What integrations are available?</h3>
                <p className="text-gray-700 dark:text-gray-300">We integrate with Uber Fleet, WhatsApp, Telegram, Twilio, and more. Custom integrations are available for enterprise clients.</p>
              </div>
            </div>
          </div>
        </section>
        {/* Blog/Resources Section */}
        <section className="py-12 md:py-20 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl" data-reveal>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 md:mb-14 text-center text-black dark:text-white">Resources & Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Blog Card 1 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-2xl">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">How AI is Transforming Fleet Management</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">Discover the latest trends in AI-driven fleet operations and how leading companies are leveraging automation for efficiency and growth.</p>
                </div>
                <Link href="/blog/ai-fleet-management" className="text-blue-600 dark:text-blue-400 font-medium hover:underline mt-auto">Read more &rarr;</Link>
              </div>
              {/* Blog Card 2 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-2xl">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">5 Ways to Boost Driver Performance</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">Practical tips and strategies to help your drivers excel, reduce idle time, and improve customer satisfaction.</p>
                </div>
                <Link href="/blog/driver-performance" className="text-blue-600 dark:text-blue-400 font-medium hover:underline mt-auto">Read more &rarr;</Link>
              </div>
              {/* Blog Card 3 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-2xl">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">The Future of Urban Mobility in Dubai</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">A look at how technology, regulation, and innovation are shaping the next decade of transportation in the UAE.</p>
                </div>
                <Link href="/blog/urban-mobility-dubai" className="text-blue-600 dark:text-blue-400 font-medium hover:underline mt-auto">Read more &rarr;</Link>
              </div>
            </div>
          </div>
        </section>
        {/* Final Call to Action Section */}
        <section className="py-10 md:py-16 bg-gradient-to-r from-blue-600 via-purple-700 to-pink-600 text-white text-center">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl" data-reveal>
            <h2 className="text-4xl font-extrabold mb-4">Start Your AI Fleet Journey Today</h2>
            <p className="text-lg mb-8">Join the most advanced fleets in Dubai and beyond. Get started in minutes and see the difference.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/signup"><Button size="lg" className="bg-white text-black font-bold px-8 py-4 hover:bg-gray-200">Get Started Free</Button></Link>
              <Link href="/demo"><Button size="lg" variant="outline" className="border-white text-white font-bold px-8 py-4 hover:bg-white hover:text-black">Book a Demo</Button></Link>
            </div>
          </div>
        </section>
        {/* Footer Section */}
        <footer className="relative bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white border-t border-gray-900 pt-12 pb-6 mt-12" role="contentinfo">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col md:flex-row md:justify-between md:items-start gap-12 md:gap-20" data-reveal>
            {/* Left: Logo, name, tagline */}
            <div className="flex flex-col items-center md:items-start gap-4 mb-8 md:mb-0 w-full md:w-1/3">
              <div className="flex items-center gap-3 mb-2">
                <MagicLogo size={40} />
                <span className="text-2xl font-bold tracking-tight">Fleet OS</span>
              </div>
              <p className="text-gray-400 text-base max-w-xs text-center md:text-left">AI-powered fleet management for modern operators. Built for Dubai, ready for the world.</p>
            </div>
            {/* Right: Navigation, newsletter, and social */}
            <div className="flex flex-col items-center md:items-end gap-8 w-full md:w-2/3">
              <nav className="flex flex-wrap gap-6 text-base font-semibold mb-2 justify-center md:justify-end" aria-label="Footer navigation">
                <Link href="/" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">Home</Link>
                <Link href="#features" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">Features</Link>
                <Link href="#how-it-works" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">How it Works</Link>
                <Link href="#faq" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">FAQ</Link>
                <Link href="/contact" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-blue-400 hover:underline underline-offset-4 transition-colors">Terms of Service</Link>
              </nav>
              {/* Newsletter Signup */}
              <form className="w-full max-w-sm flex flex-col gap-2 bg-gray-950/80 rounded-xl shadow-lg p-4 border border-gray-800" aria-label="Newsletter signup" onSubmit={e => { e.preventDefault(); alert('Thank you for subscribing!'); }}>
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <div className="flex gap-2">
                  <input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder="Your email" className="rounded-lg px-3 py-2 w-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="Email address" />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 shadow-sm" aria-label="Subscribe to newsletter">Subscribe</button>
                </div>
                <span className="text-xs text-gray-400">No spam. Unsubscribe anytime.</span>
              </form>
              <div className="flex gap-3 mt-2" role="group" aria-label="Social links">
                {/* Social icons as rounded outlined buttons */}
                <a href="https://www.linkedin.com/" target="_blank" rel="noopener" aria-label="LinkedIn" className="rounded-full border border-gray-700 hover:border-blue-400 p-2 transition-colors bg-gray-900 hover:bg-blue-950 flex items-center justify-center shadow-sm"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
                <a href="https://twitter.com/" target="_blank" rel="noopener" aria-label="Twitter" className="rounded-full border border-gray-700 hover:border-blue-400 p-2 transition-colors bg-gray-900 hover:bg-blue-950 flex items-center justify-center shadow-sm"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.4.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.01-4.52 4.5 0 .35.04.7.11 1.03C7.69 5.4 4.07 3.67 1.64 1.15c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.94 3.65A4.48 4.48 0 0 1 .96 6v.06c0 2.13 1.52 3.91 3.54 4.31-.37.1-.76.16-1.16.16-.28 0-.55-.03-.82-.08.55 1.7 2.16 2.94 4.07 2.97A9.05 9.05 0 0 1 0 19.54a12.8 12.8 0 0 0 6.95 2.03c8.34 0 12.9-6.91 12.9-12.9 0-.2 0-.39-.01-.58A9.22 9.22 0 0 0 24 4.59a8.93 8.93 0 0 1-2.6.71z"/></svg></a>
                <a href="mailto:info@mrnicedrive.com" aria-label="Email" className="rounded-full border border-gray-700 hover:border-blue-400 p-2 transition-colors bg-gray-900 hover:bg-blue-950 flex items-center justify-center shadow-sm"><svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg></a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-6 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Mr. Nice Drive. All rights reserved.
            <span className="mx-2">|</span>
            <Link href="/careers" className="text-blue-400 hover:underline font-semibold">We&apos;re hiring! Join our team &rarr;</Link>
          </div>
        </footer>
        {/* Floating Contact Us Button */}
        <Link href="/contact" className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg px-6 py-3 flex items-center gap-2 transition-all focus:ring-2 focus:ring-blue-400" style={{boxShadow: '0 4px 24px 0 rgba(59,130,246,0.15)'}} aria-label="Contact Us">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
          Contact Us
        </Link>
        {/* Floating Back to Top Button */}
        {showBackToTop && (
          <button onClick={handleBackToTop} className="fixed bottom-24 right-6 z-50 bg-gray-900 hover:bg-gray-700 text-white font-bold rounded-full shadow-lg p-3 flex items-center justify-center transition-all focus:ring-2 focus:ring-blue-400" aria-label="Back to Top">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>
        )}
      </div>
    </ThemeProvider>
  )
}
