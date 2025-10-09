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
      const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#10b981'];
      
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 4 + 1,
          speed: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
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
        y: particle.y <= -10 ? window.innerHeight + 10 : particle.y - particle.speed,
        x: particle.x + Math.sin(particle.y * 0.01) * 0.5,
      })));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            filter: 'blur(0.5px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 0.7, particle.opacity],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
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

export const LandingPage: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

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
        className="top-20 left-10 w-72 h-72" 
        color="#8b5cf6" 
      />
      <GlowingOrb 
        className="top-40 right-20 w-96 h-96" 
        color="#06b6d4" 
      />
      <GlowingOrb 
        className="bottom-20 left-1/4 w-80 h-80" 
        color="#f59e0b" 
      />

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8"
        style={{ y: y1, opacity }}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="relative mx-auto w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 p-1 animate-spin-slow shadow-2xl shadow-amber-500/50">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-3 shadow-inner">
                  <img
                    src="/hammar_logo.jpg"
                    alt="Hamarr Jiu-Jitsu MMA Logo"
                    className="w-full h-full rounded-full object-cover shadow-2xl ring-4 ring-white/10"
                  />
                </div>
              </div>
              <motion.div
                className="absolute -inset-6 rounded-full border-2 border-amber-400/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute -inset-8 rounded-full border border-orange-500/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.h1 
                className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tight"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-2xl">
                  MARTIAL ARTS
                </span>
                <br />
                <span className="text-4xl sm:text-6xl lg:text-8xl bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent font-extrabold">
                  MANAGER
                </span>
              </motion.h1>
              
              <motion.div
                className="w-32 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full shadow-lg shadow-amber-500/50"
                initial={{ width: 0 }}
                animate={{ width: 128 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
            
            <motion.div 
              className="space-y-4 max-w-4xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Empower Your Dojo with Professional Management
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 leading-relaxed font-medium">
                The ultimate solution for martial arts instructors to organize students, track belt progressions, 
                manage payments, schedule classes, monitor attendance, and grow your martial arts academy.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <a href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold px-8 py-4 text-lg shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>

              <a
                href="https://www.instagram.com/hamarr_jiujitsu_mma/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-pink-500/25"
              >
                <Instagram className="w-5 h-5" />
                Follow Us
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="relative z-10 py-20 px-4 sm:px-6 lg:px-8"
        style={{ y: y2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <FloatingElement delay={index * 0.5}>
                  <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 p-6">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-amber-400" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-300">{stat.label}</div>
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
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Everything you need to manage your martial arts school efficiently
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 p-6 h-full">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
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
            <h2 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
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