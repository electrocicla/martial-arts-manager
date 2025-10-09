import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Award,
  Instagram,
  ExternalLink,
  ArrowRight,
  Target,
  Activity
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const MartialArtsParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const createParticles = () => {
      const newParticles: Particle[] = [];
      const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];
      const isMobile = window.innerWidth < 768;
      const particleCount = isMobile ? 15 : 25;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * (isMobile ? 3 : 6) + (isMobile ? 2 : 3),
          speed: Math.random() * 1.5 + 0.3,
          opacity: Math.random() * 0.4 + 0.3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setParticles(newParticles);
    };

    createParticles();
    window.addEventListener('resize', createParticles);
    return () => window.removeEventListener('resize', createParticles);
  }, []);

  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y <= -20 ? window.innerHeight + 20 : particle.y - particle.speed,
        x: particle.x + Math.sin(particle.y * 0.01) * 1.2,
      })));
    };

    const interval = setInterval(animateParticles, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
          }}
        >
          {/* Main particle */}
          <motion.div
            className="rounded-full relative"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [particle.opacity, particle.opacity * 0.6, particle.opacity],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: particle.color,
              filter: `blur(${particle.size}px)`,
              opacity: particle.opacity * 0.3,
            }}
            animate={{
              scale: [1.5, 2.5, 1.5],
              opacity: [particle.opacity * 0.3, particle.opacity * 0.1, particle.opacity * 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

const FloatingElement: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
  children, 
  delay = 0 
}) => (
  <motion.div
    animate={{
      y: [-10, 10, -10],
      rotate: [-2, 2, -2],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    {children}
  </motion.div>
);

const GlowingOrb: React.FC<{ className?: string; color: string }> = ({ 
  className = "", 
  color 
}) => (
  <motion.div
    className={`absolute rounded-full blur-xl ${className}`}
    style={{ backgroundColor: color }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const LandingPage: React.FC = () => {
  const { scrollY } = useScroll();
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student profiles with contact info, emergency contacts, belt progression history, and attendance tracking",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Award,
      title: "Belt Progression Tracking",
      description: "Monitor each student's martial arts journey, track belt promotions, and maintain detailed progression records",
      color: "from-amber-500 to-yellow-500",
    },
    {
      icon: Calendar,
      title: "Class Scheduling & Management",
      description: "Schedule classes, manage capacity, assign instructors, and track recurring training sessions",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: CreditCard,
      title: "Payment & Billing System",
      description: "Track monthly fees, private lessons, equipment sales, and generate detailed financial reports",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Activity,
      title: "Attendance Monitoring",
      description: "Quick check-in system, attendance history, class participation rates, and student engagement analytics",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Target,
      title: "Growth Analytics",
      description: "Track dojo growth, student retention, revenue trends, and make data-driven decisions for your academy",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  const stats = [
    { icon: Users, value: "500+", label: "Students Managed" },
    { icon: Award, value: "50+", label: "Belt Promotions Tracked" },
    { icon: Calendar, value: "1000+", label: "Classes Scheduled" },
    { icon: Target, value: "95%", label: "Student Retention" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <MartialArtsParticles />
      
      {/* Background Orbs */}
      <GlowingOrb 
        className="top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72" 
        color="#8b5cf6" 
      />
      <GlowingOrb 
        className="top-32 sm:top-40 right-5 sm:right-20 w-60 h-60 sm:w-96 sm:h-96" 
        color="#06b6d4" 
      />
      <GlowingOrb 
        className="bottom-10 sm:bottom-20 left-1/4 w-52 h-52 sm:w-80 sm:h-80" 
        color="#f59e0b" 
      />
      <GlowingOrb 
        className="top-1/2 right-1/4 w-40 h-40 sm:w-64 sm:h-64" 
        color="#ef4444" 
      />

      {/* Hero Section */}
      <section className="z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-0">
        <div className="max-w-7xl mx-auto text-center">
          {/* Logo and Brand */}
          <div className="mb-8 sm:mb-12">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
              {/* Logo */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 flex-shrink-0">
                {/* Multiple rotating rings */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-1 shadow-2xl shadow-amber-500/50"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-2 sm:p-3 shadow-inner">
                    <img
                      src="/hammar_logo.jpg"
                      alt="Hamarr Jiu-Jitsu MMA Logo"
                      className="w-full h-full rounded-full object-cover shadow-2xl ring-2 sm:ring-4 ring-white/10"
                    />
                  </div>
                </motion.div>
                
                {/* Outer rotating rings */}
                <motion.div
                  className="absolute -inset-4 sm:-inset-6 rounded-full border-2 border-amber-400/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -inset-6 sm:-inset-8 rounded-full border border-orange-500/20"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -inset-8 sm:-inset-10 rounded-full border border-red-500/10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Pulsing glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              
              {/* Brand Text */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-tight mb-2 sm:mb-4">
                  <span 
                    className="block drop-shadow-2xl text-cyan-400"
                    style={{
                      background: 'linear-gradient(to right, #22d3ee, #3b82f6, #9333ea)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      display: 'inline-block'
                    }}
                  >
                    HAMMAR
                  </span>
                </h1>
                <p 
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-400"
                  style={{
                    background: 'linear-gradient(to right, #34d399, #14b8a6, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block'
                  }}
                >
                  Martial Arts Manager
                </p>
              </div>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-4 sm:space-y-6">
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tight leading-tight"
                initial={{ y: 30, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 100 }}
              >
                <motion.span 
                  className="block bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl animate-pulse"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  MARTIAL ARTS
                </motion.span>
                <motion.span 
                  className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent font-extrabold mt-2"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  MANAGER
                </motion.span>
              </motion.h1>
              
              <motion.div
                className="w-24 sm:w-32 md:w-40 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full shadow-lg shadow-amber-500/50"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.9 }}
              />
            </div>
            
            <motion.div 
              className="space-y-4 sm:space-y-6 max-w-3xl lg:max-w-4xl mx-auto px-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.h2 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-400 bg-clip-text text-transparent"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
              >
                Empower Your Dojo with Professional Management
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-bold bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.3 }}
              >
                The ultimate solution for martial arts instructors to organize students, track belt progressions, 
                manage payments, schedule classes, monitor attendance, and grow your martial arts academy.
              </motion.p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-6 sm:pt-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <motion.a 
                href="/login"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.7 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-2xl hover:shadow-amber-500/40 transition-all duration-500 group relative overflow-hidden"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </motion.a>

              <motion.a
                href="https://www.instagram.com/hamarr_jiujitsu_mma/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl font-medium transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-pink-500/40 text-sm sm:text-base group relative overflow-hidden"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.9 }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <span className="relative z-10 flex items-center gap-2">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  Follow Us
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </span>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section 
        className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
        style={{ y: y2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0, rotateY: -90 }}
                whileInView={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100 
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  rotateY: 5,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                }}
                className="text-center group"
              >
                <FloatingElement delay={index * 0.5}>
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/15 hover:border-amber-400/30 transition-all duration-500 p-4 sm:p-6 relative overflow-hidden group-hover:shadow-2xl group-hover:shadow-amber-500/20">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Icon with enhanced styling */}
                    <div className="relative z-10 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-2 sm:p-2.5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg flex items-center justify-center">
                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" strokeWidth={1.5} />
                      </div>
                    </div>
                    
                    <div className="relative z-10">
                      <motion.div 
                        className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text mb-1 sm:mb-2"
                        initial={{ scale: 0.5 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs sm:text-sm font-medium text-slate-300 group-hover:text-slate-200 transition-colors duration-300">
                        {stat.label}
                      </div>
                    </div>
                    
                    {/* Accent line */}
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 w-0 group-hover:w-full transition-all duration-500 ease-out" />
                  </Card>
                </FloatingElement>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-6 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse">
              Powerful Features
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Everything you need to manage your martial arts school efficiently
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.03,
                  rotateY: 5,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                }}
                className="group perspective-1000"
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-500 p-6 sm:p-8 h-full relative overflow-hidden group-hover:shadow-2xl group-hover:shadow-amber-500/10">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-5 blur-xl`} />
                  </div>
                  
                  {/* Icon with martial arts styling */}
                  <div className="relative z-10 mb-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r ${feature.color} p-4 sm:p-5 mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg relative flex items-center justify-center`}>
                      {/* Inner glow */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-50 blur-sm group-hover:opacity-75 transition-opacity duration-300`} />
                      <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white relative z-10 drop-shadow-lg" strokeWidth={1.5} />
                    </div>
                    
                    {/* Floating particles around icon */}
                    <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${feature.color}`}
                          style={{
                            left: `${20 + i * 30}%`,
                            top: `${10 + i * 20}%`,
                          }}
                          animate={{
                            y: [-5, -15, -5],
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-amber-200 group-hover:bg-clip-text transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 group-hover:text-slate-300 leading-relaxed text-sm sm:text-base transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} w-0 group-hover:w-full transition-all duration-500 ease-out`} />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent animate-pulse">
              Ready to Elevate Your Dojo?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Join martial arts instructors worldwide who trust our platform to manage their schools, 
              track student progress, and grow their academies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
              <a
                href="https://www.instagram.com/hamarr_jiujitsu_mma/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-300 text-lg"
              >
                <Instagram className="w-6 h-6" />
                Follow @hamarr_jiujitsu_mma
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <p className="text-lg font-medium text-amber-400">
              Dedicated to <span className="font-bold">Tyrone Salgado Reyes</span>
            </p>
            <p className="text-slate-400">
              Created by <span className="text-white font-medium">Luis Salgado Reyes</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <span>Powered by</span>
              <a
                href="https://not-meta.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300 inline-flex items-center gap-1"
              >
                not-meta.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>

          <div className="pt-6 border-t border-white/10">
            <p className="text-sm text-slate-500">
              © 2025 Martial Arts Manager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;