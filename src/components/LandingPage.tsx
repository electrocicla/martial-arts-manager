import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDevicePerformance } from '../hooks/useDevicePerformance';
import {
  Users,
  Calendar,
  CreditCard,
  Award,
  Instagram,
  ExternalLink,
  ArrowRight,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { MartialArtsParticles, FloatingElement, GlowingOrb } from './landing';const LandingPage: React.FC = () => {
  const { scrollY } = useScroll();
  const y2 = useTransform(scrollY, [0, 300], [0, -50]);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const performance = useDevicePerformance();

  const features = [
    {
      icon: Users,
      title: t('landing.features.studentManagement.title'),
      description: t('landing.features.studentManagement.description'),
      color: "from-black to-red-900",
    },
    {
      icon: Award,
      title: t('landing.features.beltProgression.title'),
      description: t('landing.features.beltProgression.description'),
      color: "from-red-900 to-black",
    },
    {
      icon: Calendar,
      title: t('landing.features.classScheduling.title'),
      description: t('landing.features.classScheduling.description'),
      color: "from-black to-red-800",
    },
    {
      icon: CreditCard,
      title: t('landing.features.paymentBilling.title'),
      description: t('landing.features.paymentBilling.description'),
      color: "from-red-800 to-black",
    },
    {
      icon: Activity,
      title: t('landing.features.attendanceMonitoring.title'),
      description: t('landing.features.attendanceMonitoring.description'),
      color: "from-black to-red-700",
    },
    {
      icon: Target,
      title: t('landing.features.growthAnalytics.title'),
      description: t('landing.features.growthAnalytics.description'),
      color: "from-red-700 to-black",
    },
  ];

  const stats = [
    { icon: Users, value: "500+", label: "Students Managed" },
    { icon: Award, value: "50+", label: "Belt Promotions Tracked" },
    { icon: Calendar, value: "1000+", label: "Classes Scheduled" },
    { icon: Target, value: "95%", label: "Student Retention" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-900/20 to-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <MartialArtsParticles />
      
      {/* Background Orbs - Performance optimized */}
      {!performance.isLowEnd && (
        <>
          <GlowingOrb 
            className="top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72" 
            color="#000000" 
          />
          <GlowingOrb 
            className="top-32 sm:top-40 right-5 sm:right-20 w-60 h-60 sm:w-96 sm:h-96" 
            color="#DC2626" 
          />
          {!performance.isMobile && (
            <>
              <GlowingOrb 
                className="bottom-10 sm:bottom-20 left-1/4 w-52 h-52 sm:w-80 sm:h-80" 
                color="#000000" 
              />
              <GlowingOrb 
                className="top-1/2 right-1/4 w-40 h-40 sm:w-64 sm:h-64" 
                color="#B91C1C" 
              />
            </>
          )}
        </>
      )}

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-0">
        <div className="max-w-8xl mx-auto">
          {/* Desktop Layout (lg and above) */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24 items-center min-h-[80vh]">
            {/* Left Side - Logo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-64 h-64 xl:w-80 xl:h-80 2xl:w-96 2xl:h-96 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-slate-800 p-3 electric-border">
                  <img
                    src="/hammar_logo.jpg"
                    alt="Hamarr Jiu-Jitsu MMA Logo"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                
                {/* Electric sparks positioned absolutely - Performance optimized */}
                {!performance.isLowEnd && (
                  <>
                    <div className="electric-spark absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                    <div className="electric-spark absolute top-1/4 right-0"></div>
                    <div className="electric-spark absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
                    {!performance.isMobile && (
                      <>
                        <div className="electric-spark absolute top-1/4 left-0"></div>
                        <div className="electric-spark absolute top-1/3 right-1/4"></div>
                        <div className="electric-spark absolute bottom-1/3 left-1/4"></div>
                      </>
                    )}
                    
                    {/* Electric glow */}
                    <div className="electric-glow"></div>
                    
                    {/* Additional electric rings - Only on capable devices */}
                    {!performance.isMobile && (
                      <>
                        <motion.div
                          className="absolute -inset-3 rounded-full border border-cyan-400/40"
                          animate={{ 
                            opacity: [0.3, 0.8, 0.3],
                            scale: [0.98, 1.02, 0.98]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="absolute -inset-6 rounded-full border border-blue-400/20"
                          animate={{ 
                            opacity: [0.2, 0.6, 0.2],
                            scale: [0.96, 1.04, 0.96]
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Right Side - Brand Text and Content */}
            <div className="text-left space-y-8">
              {/* Brand Text - Cinturón Negro con Cinta Roja */}
              <motion.h1 
                className="text-4xl xl:text-5xl 2xl:text-6xl font-black tracking-tight leading-tight space-y-3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <motion.div 
                  className="block dark-energy-text drop-shadow-2xl"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  HAMMAR
                </motion.div>
                
                <motion.div 
                  className="block fire-energy-text text-3xl xl:text-4xl 2xl:text-5xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  MARTIAL ARTS
                </motion.div>
                
                <motion.div 
                  className="block dark-energy-text drop-shadow-2xl"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                >
                  MANAGER
                </motion.div>
              </motion.h1>

              {/* Hero Content */}
              <div className="space-y-6">
                <motion.div
                  className="w-32 h-1 bg-gradient-to-r from-red-600 to-black rounded-full shadow-lg shadow-red-500/50"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.9 }}
                />
                
                <motion.div 
                  className="space-y-6 max-w-2xl"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <motion.h2 
                    className="text-2xl xl:text-3xl 2xl:text-4xl font-black leading-tight text-white mb-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                  >
                    {t('landing.hero.subtitle')}
                  </motion.h2>
                  <motion.p 
                    className="text-lg xl:text-xl 2xl:text-2xl leading-relaxed font-bold text-white mt-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                  >
                    {t('landing.hero.description')}
                  </motion.p>
                </motion.div>

                <motion.div
                  className="flex gap-6 pt-6"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.5 }}
                >
                  <motion.a 
                    href="/login"
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.7 }}
                    className="group"
                  >
                    <div className="relative">
                      <Button
                        size="lg"
                        className="mega-cta-button text-white font-black px-12 py-6 text-xl relative overflow-hidden transition-all duration-700"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-orange-400 rounded-xl blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                        
                        <span className="relative z-10 flex items-center gap-3">
                          <Zap className="w-5 h-5 text-yellow-300" />
                          {t('landing.hero.getStarted')}
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                          <Zap className="w-5 h-5 text-yellow-300" />
                        </span>
                      </Button>
                    </div>
                  </motion.a>

                  <motion.a
                    href="https://www.instagram.com/hamarr_jiujitsu_mma/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-6 bg-gradient-to-r from-black to-red-800 hover:from-red-800 hover:to-black rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-red-500/40 group relative overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.9 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <span className="relative z-10 flex items-center gap-3">
                      <Instagram className="w-6 h-6" />
                      {t('landing.hero.followUs')}
                      <ExternalLink className="w-5 h-5" />
                    </span>
                  </motion.a>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout (below lg) */}
          <div className="lg:hidden text-center">
            <div className="mb-8 sm:mb-12">
              <div className="flex flex-col items-center justify-center gap-6">
                {/* Logo */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-slate-800 p-2 electric-border">
                    <img
                      src="/hammar_logo.jpg"
                      alt="Hamarr Jiu-Jitsu MMA Logo"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  
                  {/* Electric sparks positioned absolutely */}
                  <div className="electric-spark absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  <div className="electric-spark absolute top-1/4 right-0"></div>
                  <div className="electric-spark absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
                  <div className="electric-spark absolute top-1/4 left-0"></div>
                  <div className="electric-spark absolute top-1/3 right-1/4"></div>
                  <div className="electric-spark absolute bottom-1/3 left-1/4"></div>
                  
                  {/* Electric glow */}
                  <div className="electric-glow"></div>
                  
                  {/* Additional electric rings */}
                  <motion.div
                    className="absolute -inset-2 sm:-inset-3 rounded-full border border-cyan-400/40"
                    animate={{ 
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.98, 1.02, 0.98]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute -inset-4 sm:-inset-6 rounded-full border border-blue-400/20"
                    animate={{ 
                      opacity: [0.2, 0.6, 0.2],
                      scale: [0.96, 1.04, 0.96]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </div>
                
                {/* Brand Text - Cinturón Negro con Cinta Roja */}
                <div className="text-center max-w-4xl">
                  <motion.h1 
                    className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight space-y-2"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  >
                    <motion.div 
                      className="block dark-energy-text drop-shadow-2xl"
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    >
                      HAMMAR
                    </motion.div>
                    
                    <motion.div 
                      className="block fire-energy-text text-2xl sm:text-3xl md:text-4xl"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    >
                      MARTIAL ARTS
                    </motion.div>
                    
                    <motion.div 
                      className="block dark-energy-text drop-shadow-2xl"
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.9 }}
                    >
                      MANAGER
                    </motion.div>
                  </motion.h1>
                </div>
              </div>
            </div>

            {/* Mobile Hero Content */}
            <div className="space-y-6 sm:space-y-8">
              <motion.div
                className="w-24 sm:w-32 md:w-40 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto rounded-full shadow-lg shadow-amber-500/50"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.9 }}
              />
              
              <motion.div 
                className="space-y-8 max-w-3xl mx-auto px-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.h2 
                  className="text-xl sm:text-2xl md:text-3xl font-black leading-tight text-white mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  Empower Your Dojo with Professional Management
                </motion.h2>
                <motion.p 
                  className="text-base sm:text-lg md:text-xl leading-relaxed font-bold text-white mt-6"
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
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.92 }}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.7 }}
                  className="group"
                >
                  <div className="relative">
                    <Button
                      size="lg"
                      className="mega-cta-button text-white font-black px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl relative overflow-hidden transition-all duration-700"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-orange-400 rounded-xl blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
                      
                      <span className="relative z-10 flex items-center gap-3">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                        GET STARTED
                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                      </span>
                    </Button>
                  </div>
                </motion.a>

                <motion.a
                  href="https://www.instagram.com/hamarr_jiujitsu_mma/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-black to-red-800 hover:from-red-800 hover:to-black rounded-xl font-medium transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-red-500/40 text-sm sm:text-base group relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.9 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  
                  <span className="relative z-10 flex items-center gap-2">
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                    Follow @hamarr_jiujitsu_mma
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                </motion.a>
              </motion.div>
            </div>
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
                        className="text-2xl sm:text-3xl lg:text-4xl font-black gradient-text-white-amber mb-1 sm:mb-2"
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
            <h2 className="text-3xl sm:text-5xl font-black mb-6 gradient-text-yellow-red">
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
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white group-hover:gradient-text-white-amber transition-all duration-300">
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
            <h2 className="text-3xl sm:text-5xl font-black gradient-text-green-teal">
              {t('landing.cta.title')}
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t('landing.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                {t('landing.cta.startTrial')}
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