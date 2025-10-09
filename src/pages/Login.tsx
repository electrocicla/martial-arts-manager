import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { loginSchema, type LoginFormData } from '../lib/validation';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login(data);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
        <CardHeader className="text-center px-4 sm:px-6 py-6 sm:py-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <LogIn className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base lg:text-lg font-medium bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Sign in to your Martial Arts Manager account
          </p>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-red-300 font-medium">{error}</p>
              </div>
            )}

            <div>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter your email"
                label="Email Address"
                error={errors.email?.message}
                disabled={isLoading}
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                label="Password"
                error={errors.password?.message}
                disabled={isLoading}
                className="text-sm sm:text-base"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white transition-colors duration-200 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 text-sm sm:text-base shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-slate-300">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent hover:from-emerald-300 hover:to-teal-400 transition-all duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}