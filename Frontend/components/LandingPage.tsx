import React from 'react';
import { ArrowRight, Star } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-[#7BDCB5]/30">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto bg-white z-50">
                <div className="flex items-center gap-2">
                    {/* Hexagon icon mock */}
                    <div className="w-7 h-7 relative flex items-center justify-center text-[#65D49D]">
                        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 drop-shadow-sm">
                            <path d="M12 2L22 7.77333V16.2267L12 22L2 16.2267V7.77333L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            {/* Inner symbol representing a flask somewhat */}
                            <path d="M10 6H14M11 6V11L8 16H16L13 11V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900">Interviewer's Co-Pilot</span>
                </div>

                <div className="hidden md:flex items-center gap-8 font-medium text-[15px] text-zinc-800">
                    <a href="#" className="hover:text-zinc-500 transition-colors">Home</a>
                    <a href="#" className="hover:text-zinc-500 transition-colors">Features</a>
                    <a href="#" className="hover:text-zinc-500 transition-colors">Pricing</a>
                    <a href="#" className="hover:text-zinc-500 transition-colors">Testimonials</a>
                    <a href="#" className="hover:text-zinc-500 transition-colors">FAQ</a>
                </div>

                <button
                    onClick={onEnter}
                    className="hidden md:block bg-[#6DE0A3] hover:bg-[#5bc98e] text-zinc-900 font-semibold px-5 py-2.5 rounded-lg text-[15px] transition-colors shadow-sm"
                >
                    Get Started
                </button>
            </nav>

            {/* Hero Section */}
            <main className="flex flex-col items-center text-center pt-28 md:pt-36 px-4 max-w-[1200px] mx-auto">
                <h1 className="text-5xl md:text-[64px] lg:text-[80px] leading-[1.1] font-medium tracking-tight text-zinc-800 mb-8 md:whitespace-nowrap">
                    Elevate Your Engineering<br></br> Interviews
                </h1>

                <p className="text-[17px] md:text-[20px] text-zinc-500 mb-12 max-w-2xl leading-[1.6]">
                    A secure, intelligent platform for technical assessments. Experience fair, deep, and collaborative engineering interviews.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 mb-14 w-full sm:w-auto">
                    <button
                        onClick={onEnter}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#6DE0A3] hover:bg-[#5bc98e] text-zinc-900 font-semibold px-6 py-4 rounded-2xl transition-all text-[17px] shadow-sm"
                    >
                        Get started <ArrowRight className="w-5 h-5 ml-1" />
                    </button>

                    <button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold px-6 py-4 rounded-2xl transition-all text-[17px]"
                    >
                        View Live Demo
                    </button>
                </div>

                
            </main>
        </div>
    );
}
