import React from 'react';
import { 
  Instagram,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/Button';

const LandingPageDebug: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Brand Section */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
              {/* Logo */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-1 shadow-2xl shadow-amber-500/50">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-2 sm:p-3 shadow-inner">
                    <img
                      src="/hammar_logo.jpg"
                      alt="Hamarr Jiu-Jitsu MMA Logo"
                      className="w-full h-full rounded-full object-cover shadow-2xl ring-2 sm:ring-4 ring-white/10"
                      onError={(e) => {
                        console.error('Logo failed to load:', e);
                        (e.target as HTMLImageElement).style.backgroundColor = '#ef4444';
                        (e.target as HTMLImageElement).alt = 'Logo Error';
                      }}
                      onLoad={() => console.log('Logo loaded successfully')}
                    />
                  </div>
                </div>
              </div>
              
              {/* Brand Text */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-tight mb-2 sm:mb-4">
                  <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl">
                    HAMMAR
                  </span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text">
                  Martial Arts Manager
                </p>
                
                {/* Debug info */}
                <div className="mt-4 text-sm text-yellow-400">
                  Debug: Component loaded successfully
                </div>
              </div>
            </div>
          </div>

          {/* Simple Hero Text */}
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-tight">
              <span className="block bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
                Transform Your
              </span>
            </h2>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              The most powerful martial arts management system designed for modern dojos
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-2xl shadow-cyan-500/25 border-0 text-lg sm:text-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Get Started
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
              
              <a
                href="https://www.instagram.com/hamarr_jiujitsu_mma/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-2xl shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 text-lg sm:text-xl w-full sm:w-auto justify-center"
              >
                <Instagram className="w-6 h-6" />
                Follow Us
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPageDebug;