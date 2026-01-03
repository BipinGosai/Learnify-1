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
      <header className="relative overflow-hidden text-white pt-24 pb-36 px-6 md:px-12 bg-gradient-to-br from-purple-700 via-violet-600 to-fuchsia-500">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm backdrop-blur-lg border border-white/20">
              <span className="flex h-2 w-2 rounded-full bg-fuchsia-300 animate-pulse"></span>
              <span className="font-medium text-white/90">Powered by Advanced AI</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Learn Smarter <br /> with <span className="text-fuchsia-200">AI Tutors</span>
            </h1>
            <p className="text-purple-50 text-xl max-w-lg leading-relaxed font-light">
              Personalized learning paths and adaptive content tailored to your pace. Transform your education journey today.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-slate-50 rounded-2xl font-bold px-10 h-14 shadow-xl transition-transform hover:scale-105">
                <Link href="/sign-in">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl font-bold px-10 h-14 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-transform hover:scale-105">
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          </div>

          {/* HERO IMAGE CONTAINER */}
          <div className="relative group">
            <div className="w-full aspect-[4/3] bg-white/10 rounded-[2.5rem] border border-white/20 backdrop-blur-md overflow-hidden flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
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
          <FeatureCard icon={<ChartLine className="text-purple-600" />} bgColor="bg-purple-50" title="Personalized Paths" desc="Customized learning paths that adapt in real-time based on your personal progress." />
          <FeatureCard icon={<CheckCircle className="text-purple-600" />} bgColor="bg-purple-50" title="Progress Tracking" desc="Real-time analytics and detailed progress reports to monitor every improvement." />
          <FeatureCard icon={<Utensils className="text-purple-600" />} bgColor="bg-purple-50" title="Interactive Content" desc="Engage with interactive quizzes and projects that make learning truly enjoyable." />
          <FeatureCard icon={<DollarSign className="text-purple-600" />} bgColor="bg-purple-50" title="Affordable Pricing" desc="Flexible subscription plans that fit your budget. Start free and upgrade whenever." />
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

      {/* --- FOOTER --- */}
      <footer className="pt-32 bg-slate-950 text-white px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center pb-24 border-b border-white/10">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-8 flex items-center justify-center gap-5 leading-tight text-white">
            Ready to Start Your <br /> Learning Journey? <Rocket className="text-purple-400" size={50} />
          </h2>
          <div className="flex justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-slate-100 px-16 py-8 text-xl font-bold rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95">
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-20 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white"><BookOpen size={18} /></div>
              <span className="text-xl font-bold">Learnify</span>
            </div>
            <p className="text-slate-500 text-sm">The world's most advanced AI-powered learning ecosystem.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-8">Platform</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#features" className="hover:text-purple-400 transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-purple-400 transition">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-8">Company</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-purple-400 transition">About Us</a></li>
              <li><a href="#" className="hover:text-purple-400 transition">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-8">Social</h4>
            <div className="flex gap-6">
              <Facebook className="text-slate-400 hover:text-purple-400 cursor-pointer transition" size={20} />
              <Twitter className="text-slate-400 hover:text-purple-400 cursor-pointer transition" size={20} />
              <Instagram className="text-slate-400 hover:text-purple-400 cursor-pointer transition" size={20} />
            </div>
          </div>
        </div>
      </footer>
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