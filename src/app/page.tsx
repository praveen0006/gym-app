'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ArrowRight, BarChart3, Brain, Zap, CheckCircle2, Shield, Activity, TrendingUp, Sparkles, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="overflow-hidden pt-16">
        {/* Hero Section */}
        <section className="relative px-6 pt-16 pb-24 sm:pt-24 lg:px-8 lg:pt-32 lg:pb-36 text-center">
          {/* Background Gradients */}
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20 bg-white/50 backdrop-blur-sm">
                ✨ New: AI Photo Analysis is live. <Link href="/login" className="font-semibold text-blue-600"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></Link>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 pb-2">
              Your Personal AI <br className="hidden sm:block" />
              <span className="text-blue-600">Health Coach</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
              Stop guessing. Start transforming. HealthFit uses advanced AI to track your nutrition, analyze your physique, and optimize your workouts in real-time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all hover:scale-105"
              >
                Start Your Journey
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-slate-900 flex items-center gap-1 group">
                Learn more <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Background Gradients Right */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
          </div>
        </section>

        {/* Dashboard Preview / Trust */}
        <section className="py-12 px-6 lg:px-8 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted by fitness enthusiasts worldwide</p>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex justify-center items-center gap-2 font-bold text-slate-800 text-xl"><Shield size={24} /> SecureFit</div>
              <div className="flex justify-center items-center gap-2 font-bold text-slate-800 text-xl"><Activity size={24} /> CardioAI</div>
              <div className="flex justify-center items-center gap-2 font-bold text-slate-800 text-xl"><Zap size={24} /> PowerLift</div>
              <div className="flex justify-center items-center gap-2 font-bold text-slate-800 text-xl"><TrendingUp size={24} /> PulseTrack</div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 sm:py-32 px-6 lg:px-8 bg-white">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-semibold leading-7 text-blue-600 flex items-center justify-center gap-2"><Sparkles size={16} /> Everything you need</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                A complete ecosystem for your health
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                We don't just track numbers. We provide actionable insights to help you reach your peak performance.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-sm transition-all hover:shadow-md hover:border-blue-100 group">
                  <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-slate-900">
                    <div className="rounded-lg bg-blue-600 p-2 text-white group-hover:scale-110 transition-transform">
                      <Brain size={20} />
                    </div>
                    AI Physique Analysis
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Upload progress photos and get instant, privacy-focused AI feedback on body fat percentage and muscle symmetry.</p>
                  </dd>
                </div>

                <div className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-sm transition-all hover:shadow-md hover:border-emerald-100 group">
                  <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-slate-900">
                    <div className="rounded-lg bg-emerald-600 p-2 text-white group-hover:scale-110 transition-transform">
                      <TrendingUp size={20} />
                    </div>
                    Smart Weight Goals
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Set dynamic weight goals and visualize your trajectory with predictive charts that keep you motivated.</p>
                  </dd>
                </div>

                <div className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-sm transition-all hover:shadow-md hover:border-amber-100 group">
                  <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-slate-900">
                    <div className="rounded-lg bg-amber-600 p-2 text-white group-hover:scale-110 transition-transform">
                      <Zap size={20} />
                    </div>
                    Nutritional Intelligence
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600">
                    <p className="flex-auto">Log meals in seconds with AI lookup. Track macros automatically and get daily recommendations.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative isolate overflow-hidden bg-slate-900 px-6 py-24 shadow-2xl sm:px-32 lg:flex lg:gap-x-20 lg:px-8">
          <svg
            viewBox="0 0 1024 1024"
            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0 opacity-30"
            aria-hidden="true"
          >
            <circle cx={512} cy={512} r={512} fill="url(#gradient)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="gradient">
                <stop stopColor="#3b82f6" />
                <stop offset={1} stopColor="#1d4ed8" />
              </radialGradient>
            </defs>
          </svg>
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform?
              <br />
              Start your free trial today.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Join thousands of users who have already achieved their fitness goals with HealthFit. No credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Link
                href="/login"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-white group flex items-center gap-1">
                Learn more <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200" aria-labelledby="footer-heading">
          <h2 id="footer-heading" className="sr-only">Footer</h2>
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Activity size={20} strokeWidth={3} />
                  </div>
                  <span className="text-xl font-bold text-slate-900">HealthFit</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500 max-w-xs">
                  The intelligent health platform designed to help you live better, longer.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-8 md:mt-0">
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-slate-900">Product</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-slate-600 hover:text-blue-600">Features</a></li>
                    <li><a href="#" className="text-sm leading-6 text-slate-600 hover:text-blue-600">Pricing</a></li>
                    <li><a href="#" className="text-sm leading-6 text-slate-600 hover:text-blue-600">Testimonials</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-6 text-slate-900">Company</h3>
                  <ul role="list" className="mt-6 space-y-4">
                    <li><a href="#" className="text-sm leading-6 text-slate-600 hover:text-blue-600">About</a></li>
                    <li><a href="#" className="text-sm leading-6 text-slate-600 hover:text-blue-600">Blog</a></li>
                    <li><a href="#" className="text-sm leading-6 text-slate-600 hover:text-blue-600">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-16 border-t border-slate-200 pt-8 sm:mt-20 lg:mt-24">
              <p className="text-xs leading-5 text-slate-500">&copy; 2026 HealthFit AI Inc. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
