import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl space-y-8 z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900">
          Manage research with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-green-900">confidence</span>.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          ThesisGuard unifies the academic lifecycle. Secure milestone tracking, streamlined guide assignments, and advanced AI-powered semantic plagiarism detection.
        </p>
        
        <div className="pt-8">
          <Link 
            href="/login" 
            className="inline-flex items-center space-x-2 bg-green-900 hover:bg-green-800 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-[0_8px_30px_rgb(20,83,45,0.25)] hover:-translate-y-1"
          >
            <span>Login to Portal</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-50 rounded-full blur-3xl -z-10 pointer-events-none" />
    </div>
  );
}
