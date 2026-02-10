import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Bolt,
  ChartLine,
  CheckCircle,
  Utensils,
  DollarSign,
  Star,
  Rocket,
  Facebook,
  Twitter,
  Instagram,
  Check,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFAFF] font-sans text-slate-900 scroll-smooth">
      {/* --- NAVBAR --- */}
      <nav className="bg-white/80 backdrop-blur-md py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-purple-200 shadow-lg">
            <BookOpen size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Learnify</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-purple-600 cursor-pointer transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-purple-600 cursor-pointer transition-colors">How It Works</a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative overflow-hidden text-white pt-24 pb-36 px-6 md:px-12 bg-linear-to-br from-purple-700 via-violet-600 to-fuchsia-500">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Learn Smarter <br /> with <span className="text-fuchsia-200">AI Tutors</span>
            </h1>
            <p className="text-purple-50 text-xl max-w-lg leading-relaxed font-light">
              Personalized learning paths and adaptive content tailored to your pace. Transform your education journey today.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-slate-50 rounded-2xl font-bold px-10 h-14 shadow-xl transition-transform hover:scale-105">
                <Link href="/sign-up">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold px-10 h-14 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-transform hover:scale-105">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* HERO IMAGE CONTAINER */}
          <div className="relative group">
            <div className="w-full aspect-4/3 bg-white/10 rounded-[2.5rem] border border-white/20 backdrop-blur-md overflow-hidden flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
              <Image 
                src="/photo.png" 
                alt="AI Learning Platform Preview"
                fill
                className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              
            </div>
          </div>
        </div>
      </header>

      {/* --- WHY CHOOSE SECTION --- */}
      <section id="features" className="py-32 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Why Choose <span className="text-purple-600">Learnify?</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">Experience the future of online learning with our AI-powered platform designed for your unique success path.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <FeatureCard icon={<Bolt className="text-purple-600" />} bgColor="bg-purple-50" title="Create your own Courses" desc="Build custom courses in minutes with guided prompts and AI suggestions." />
          <FeatureCard icon={<ChartLine className="text-purple-600" />} bgColor="bg-purple-50" title="Personalized Paths" desc="Customized learning paths that adapt in real-time based on your personal progress." />
          <FeatureCard icon={<CheckCircle className="text-purple-600" />} bgColor="bg-purple-50" title="Progress Tracking" desc="Real-time analytics and detailed progress reports to monitor every improvement." />
        </div>
      </section>

      {/* --- PRICING SECTION REMOVED --- */}

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-32 bg-purple-600 text-white px-6 md:px-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16 flex items-center justify-center gap-4">How It Works <span className="text-purple-200">🤔</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-purple-500/30 backdrop-blur-sm p-12 rounded-[2rem] border border-white/10 text-left">
              <div className="text-4xl font-black text-purple-200 mb-6">01</div>
              <h3 className="text-2xl font-bold mb-4">Explore</h3>
              <p className="text-purple-50 leading-relaxed">Browse AI-curated courses specifically for your skill level.</p>
            </div>
            <div className="bg-purple-500/30 backdrop-blur-sm p-12 rounded-[2rem] border border-white/10 text-left">
              <div className="text-4xl font-black text-purple-200 mb-6">02</div>
              <h3 className="text-2xl font-bold mb-4">Learn</h3>
              <p className="text-purple-50 leading-relaxed">Engage with your AI tutor to clarify complex topics in real-time.</p>
            </div>
            <div className="bg-purple-500/30 backdrop-blur-sm p-12 rounded-[2rem] border border-white/10 text-left">
              <div className="text-4xl font-black text-purple-200 mb-6">03</div>
              <h3 className="text-2xl font-bold mb-4">Master</h3>
              <p className="text-purple-50 leading-relaxed">Apply your knowledge through projects and reach your goals.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// --- SUB-COMPONENTS ---
function FeatureCard({ icon, title, desc, bgColor }) {
  return (
    <div className="bg-white p-10 rounded-[2rem] border border-purple-50 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 group text-left">
      <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-slate-800">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}