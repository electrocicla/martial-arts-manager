import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { registerSchema, type RegisterFormData } from '../lib/validation';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roleOptions = [
    { value: 'student', label: t('registerPage.roles.student') },
    { value: 'instructor', label: t('registerPage.roles.instructor') },
    { value: 'admin', label: t('registerPage.roles.admin') },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    const { confirmPassword, ...registerData } = data;
    void confirmPassword; // Acknowledge unused variable
    const success = await registerUser(registerData);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-900/20 to-black px-4 py-6 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg backdrop-blur-xl bg-black/60 border border-red-500/30 shadow-2xl">
        <CardHeader className="text-center px-4 sm:px-6 py-6 sm:py-8">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            {t('registerPage.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('registerPage.subtitle')}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <Input
                {...register('name')}
                type="text"
                placeholder={t('registerPage.fullNamePlaceholder')}
                label={t('registerPage.fullName')}
                error={errors.name?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                {...register('email')}
                type="email"
                placeholder={t('registerPage.emailPlaceholder')}
                label={t('registerPage.emailAddress')}
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <Select
                {...register('role')}
                label={t('registerPage.role')}
                placeholder={t('registerPage.rolePlaceholder')}
                options={roleOptions}
                error={errors.role?.message}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('registerPage.passwordPlaceholder')}
                label={t('registerPage.password')}
                error={errors.password?.message}
                disabled={isLoading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>

            <div>
              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('registerPage.confirmPasswordPlaceholder')}
                label={t('registerPage.confirmPassword')}
                error={errors.confirmPassword?.message}
                disabled={isLoading}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              isLoading={isLoading}
            >
              {isLoading ? t('registerPage.creatingAccount') : t('registerPage.title')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('registerPage.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                {t('registerPage.signIn')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}