import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Turnstile } from '../components/ui/Turnstile';
import AndroidApkInstallPrompt from '../components/mobile/AndroidApkInstallPrompt';
import { useAuth } from '../context/AuthContext';
import { isTurnstileConfigured } from '../lib/turnstile';
import { loginSchema, type LoginFormData } from '../lib/validation';
import { ACADEMY_BRAND } from '../branding/catalog';
import { getManzurCopy } from '../branding/manzurCopy';

export default function Login() {
  const turnstileEnabled = isTurnstileConfigured();
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isManzur = ACADEMY_BRAND.id === 'manzur';
  const manzur = getManzurCopy(i18n.resolvedLanguage ?? i18n.language);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Watch for pending approval error
  useEffect(() => {
    if (error === 'PENDING_APPROVAL') {
      navigate('/pending-approval');
    }
  }, [error, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    clearError();

    if (turnstileEnabled && !turnstileToken) {
      setTurnstileError(t('login.captchaRequired', 'Completa la verificacion CAPTCHA para continuar.'));
      return;
    }

    setTurnstileError(null);
    const success = await login({
      ...data,
      turnstileToken: turnstileEnabled ? (turnstileToken ?? undefined) : undefined,
    });
    if (success) {
      navigate('/');
    }
    // Reset widget after each attempt so a fresh token is required
    setTurnstileToken(null);
  };

  return (
    <div className={isManzur
      ? "dark-page relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-[#fefefe] sm:px-6 lg:px-8"
      : "dark-page min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-900/20 to-black px-4 py-6 sm:px-6 lg:px-8 relative overflow-hidden"}>
      <AndroidApkInstallPrompt context="login" />
      {/* Background Effects */}
      <div className={isManzur ? "absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(227,18,25,.14),transparent_50%)]" : "absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-red-900/30"}></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className={isManzur ? "absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#e31219]/10 blur-3xl" : "absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full blur-3xl"}></div>
        <div className={isManzur ? "absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-[#27272a]/15 blur-3xl" : "absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-red-800/20 to-black/30 rounded-full blur-3xl"}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className={isManzur ? "rounded-3xl border border-[#e31219]/35 bg-[#18181b]/95 shadow-2xl backdrop-blur-xl" : "backdrop-blur-xl bg-black/60 border border-red-500/30 shadow-2xl electric-border"}>
          <CardHeader className="text-center px-6 py-8">
            {/* Academy logo */}
            <motion.div 
              className="relative w-24 h-24 mx-auto mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className={isManzur ? "h-full w-full rounded-2xl border border-[#e31219]/35 bg-[#050505] p-1" : "w-full h-full rounded-full bg-slate-800 p-2 electric-border"}>
                <img 
                  src={ACADEMY_BRAND.iconUrl} 
                  alt={ACADEMY_BRAND.iconAlt} 
                  className={isManzur ? "h-full w-full rounded-xl object-contain" : "w-full h-full object-cover rounded-full"}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-2"
            >
              <h1 className={isManzur ? "text-2xl font-black tracking-[.15em] text-[#fefefe] sm:text-3xl" : "text-2xl sm:text-3xl font-black dark-energy-text"}>
                {ACADEMY_BRAND.name}
              </h1>
              <h2 className={isManzur ? "text-base font-semibold uppercase tracking-[.27em] text-[#ff7b80] sm:text-lg" : "text-2xl sm:text-3xl font-black fire-energy-text"}>
                MARTIAL ARTS
              </h2>
              <h3 className={isManzur ? "text-sm font-semibold tracking-[.12em] text-[#d4d4d8] sm:text-base" : "text-2xl sm:text-3xl font-black dark-energy-text"}>
                {isManzur ? manzur.portal : "MANAGER"}
              </h3>
            </motion.div>

            <motion.p 
              className="text-sm text-slate-300 mt-4 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {isManzur ? manzur.tagline : t('login.welcomeMessage')}
            </motion.p>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <motion.form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {error && (
                <motion.div 
                  className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300 font-medium">{error}</p>
                </motion.div>
              )}

              {turnstileError && (
                <motion.div
                  className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl backdrop-blur-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0" />
                  <p className="text-sm text-amber-200 font-medium">{turnstileError}</p>
                </motion.div>
              )}

              <div>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder={t('login.enterEmail')}
                  label={t('login.emailLabel')}
                  error={errors.email?.message}
                  disabled={isLoading}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.enterPassword')}
                  label={t('login.passwordLabel')}
                  error={errors.password?.message}
                  disabled={isLoading}
                  className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={isManzur ? "text-[#d4b579] transition-colors hover:text-[#f0d6a8]" : "text-slate-400 hover:text-cyan-400 transition-colors duration-200"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  }
                />
              </div>

              {turnstileEnabled ? (
                <Turnstile
                  onVerify={(token) => {
                    setTurnstileToken(token);
                    setTurnstileError(null);
                  }}
                  onExpire={() => {
                    setTurnstileToken(null);
                    setTurnstileError(t('login.captchaExpired', 'La verificacion CAPTCHA expiro. Intentalo de nuevo.'));
                  }}
                  onError={() => {
                    setTurnstileToken(null);
                    setTurnstileError(t('login.captchaRetry', 'No se pudo validar el CAPTCHA. Intentalo de nuevo.'));
                  }}
                  theme="dark"
                  className="flex justify-center"
                />
              ) : null}

              <Button
                type="submit"
                className={isManzur ? "group relative w-full overflow-hidden rounded-xl bg-[#c51626] py-4 text-lg font-bold text-[#fefefe] transition hover:bg-[#970d1a]" : "w-full mega-cta-button text-white font-black py-4 text-lg relative overflow-hidden transition-all duration-700 group"}
                disabled={isLoading}
                isLoading={isLoading}
              >
                <div className={isManzur ? "pointer-events-none absolute inset-0 bg-gradient-to-r from-[#dfbb7b] to-[#b48b51] opacity-80" : "absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-90"} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  {isLoading ? t('login.signingIn') : t('login.signIn')}
                  <Zap className="w-5 h-5 text-yellow-300" />
                </span>
              </Button>
            </motion.form>

            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <p className="text-sm text-slate-300">
                {t('login.noAccount')}{' '}
                <Link
                  to="/register"
                  className={isManzur ? "font-semibold text-[#eac889] underline underline-offset-4 hover:text-white" : "login-signup-link"}
                >
                  {t('login.signUp')}
                </Link>
              </p>
              
              <Link
                to="/"
                className="inline-flex items-center gap-2 mt-4 text-sm text-slate-300 hover:text-white transition-all duration-200 font-medium underline underline-offset-2 hover:underline-offset-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('login.backToHome')}
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}