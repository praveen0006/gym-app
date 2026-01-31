'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, Activity } from 'lucide-react'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'
                }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <Activity size={20} strokeWidth={3} />
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>
                            HealthFit
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:gap-8">
                        <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            How it Works
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 hover:bg-slate-800"
                            >
                                Get Started <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 right-0 border-b border-slate-100 bg-white/95 backdrop-blur-md p-4 shadow-lg md:hidden">
                    <div className="flex flex-col gap-4">
                        <Link
                            href="#features"
                            className="flex items-center rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Features
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="flex items-center rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            How it Works
                        </Link>
                        <hr className="border-slate-100" />
                        <Link
                            href="/login"
                            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
