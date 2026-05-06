/**
 * MercadoPagoSettings
 *
 * Admin-only configuration UI for the MercadoPago integration. Lets the
 * admin store credentials, validate them server-side, and flip the system
 * to "active" once every required field is set. All secrets render masked
 * by default and can be revealed via the eye toggle.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../../hooks/useToast';
import mercadoPagoService, { type MercadoPagoConfigInput } from '../../services/mercadopago.service';
import { invalidateMercadoPagoStatus } from '../../hooks/useMercadoPagoStatus';
import type { MercadoPagoConfigDTO } from '../../types/index';

const CURRENCY_OPTIONS = ['CLP', 'ARS', 'BRL', 'MXN', 'COP', 'PEN', 'UYU', 'USD'] as const;

type FormState = MercadoPagoConfigInput;

const EMPTY_FORM: FormState = {
  enabled: false,
  accessToken: '',
  publicKey: '',
  webhookSecret: '',
  accountEmail: '',
  currency: 'CLP',
  defaultAmount: 0,
  successUrl: '',
  failureUrl: '',
  pendingUrl: '',
  notificationUrl: '',
};

function applyConfigToForm(config: MercadoPagoConfigDTO): FormState {
  return {
    enabled: config.enabled,
    accessToken: config.accessToken,
    publicKey: config.publicKey,
    webhookSecret: config.webhookSecret,
    accountEmail: config.accountEmail,
    currency: config.currency,
    defaultAmount: config.defaultAmount,
    successUrl: config.successUrl,
    failureUrl: config.failureUrl,
    pendingUrl: config.pendingUrl,
    notificationUrl: config.notificationUrl,
  };
}

export default function MercadoPagoSettings() {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [config, setConfig] = useState<MercadoPagoConfigDTO | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [reveal, setReveal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const loadConfig = useCallback(async (revealNext: boolean) => {
    setIsLoading(true);
    const res = await mercadoPagoService.getConfig(revealNext);
    if (res.success && res.data) {
      setConfig(res.data);
      setForm(applyConfigToForm(res.data));
    } else {
      error(res.error || t('mercadopago.messages.saveFailed'));
    }
    setIsLoading(false);
  }, [error, t]);

  useEffect(() => {
    void loadConfig(false);
  }, [loadConfig]);

  const handleToggleReveal = useCallback(async () => {
    const next = !reveal;
    setReveal(next);
    await loadConfig(next);
  }, [reveal, loadConfig]);

  const handleChange = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const res = await mercadoPagoService.saveConfig(form);
    setIsSaving(false);
    if (res.success && res.data) {
      setConfig(res.data);
      setForm(applyConfigToForm(res.data));
      invalidateMercadoPagoStatus();
      success(t('mercadopago.messages.saved'));
    } else {
      error(res.error || t('mercadopago.messages.saveFailed'));
    }
  }, [form, success, error, t]);

  const handleTest = useCallback(async () => {
    if (!form.accessToken) return;
    setIsTesting(true);
    const res = await mercadoPagoService.testCredentials(form.accessToken);
    setIsTesting(false);
    if (res.success && res.data?.ok) {
      success(t('mercadopago.messages.testOk'), {
        description: res.data.nickname || res.data.email || res.data.site_id || undefined,
      });
    } else {
      error(t('mercadopago.messages.testFailed'), {
        description: res.error || res.data?.error,
      });
    }
  }, [form.accessToken, success, error, t]);

  const statusBanner = useMemo(() => {
    if (!config) return null;
    if (config.isActive) {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">{t('mercadopago.status.active')}</p>
            <p className="text-xs text-emerald-200/80">{config.accountEmail}</p>
          </div>
        </div>
      );
    }
    if (config.isComplete) {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3">
          <Sparkles className="h-5 w-5 text-sky-300" />
          <p className="text-sm text-sky-200">{t('mercadopago.status.ready')}</p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <ShieldAlert className="h-5 w-5 text-amber-300" />
        <p className="text-sm text-amber-200">{t('mercadopago.status.incomplete')}</p>
      </div>
    );
  }, [config, t]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t('mercadopago.section.title')}</h3>
              <p className="text-sm text-gray-300">{t('mercadopago.section.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleToggleReveal}
              leftIcon={reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {reveal ? t('mercadopago.actions.hide') : t('mercadopago.actions.reveal')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleTest}
              disabled={isTesting || !form.accessToken}
              leftIcon={isTesting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />}
            >
              {isTesting ? t('mercadopago.actions.testing') : t('mercadopago.actions.test')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              leftIcon={isSaving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Save className="h-4 w-4" />}
            >
              {isSaving ? t('mercadopago.actions.saving') : t('mercadopago.actions.save')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {statusBanner}

        <label className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3">
          <div>
            <span className="block text-sm font-semibold text-white">
              {t('mercadopago.fields.enabled')}
            </span>
            <span className="block text-xs text-gray-400">
              {config?.isComplete
                ? t('mercadopago.status.ready')
                : t('mercadopago.messages.activationBlocked')}
            </span>
          </div>
          <input
            type="checkbox"
            className="toggle toggle-success"
            checked={Boolean(form.enabled)}
            disabled={!config?.isComplete && !form.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="mp-account-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.accountEmail')}
            </label>
            <Input
              id="mp-account-email"
              type="email"
              autoComplete="off"
              value={form.accountEmail ?? ''}
              onChange={(e) => handleChange('accountEmail', e.target.value)}
              placeholder="hamarr@dojo.cl"
            />
          </div>
          <div>
            <label htmlFor="mp-currency" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.currency')}
            </label>
            <Select
              id="mp-currency"
              value={form.currency ?? 'CLP'}
              onChange={(e) => handleChange('currency', e.target.value)}
              options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="mp-access-token" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.accessToken')}
            </label>
            <Input
              id="mp-access-token"
              type={reveal ? 'text' : 'password'}
              autoComplete="off"
              value={form.accessToken ?? ''}
              onChange={(e) => handleChange('accessToken', e.target.value)}
              placeholder="APP_USR-xxxxxxxx"
            />
            <p className="mt-1 text-xs text-gray-400">{t('mercadopago.hints.accessToken')}</p>
          </div>

          <div>
            <label htmlFor="mp-public-key" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.publicKey')}
            </label>
            <Input
              id="mp-public-key"
              type="text"
              autoComplete="off"
              value={form.publicKey ?? ''}
              onChange={(e) => handleChange('publicKey', e.target.value)}
              placeholder="APP_USR-xxxxxxxx"
            />
            <p className="mt-1 text-xs text-gray-400">{t('mercadopago.hints.publicKey')}</p>
          </div>

          <div>
            <label htmlFor="mp-webhook-secret" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.webhookSecret')}
            </label>
            <Input
              id="mp-webhook-secret"
              type={reveal ? 'text' : 'password'}
              autoComplete="off"
              value={form.webhookSecret ?? ''}
              onChange={(e) => handleChange('webhookSecret', e.target.value)}
              placeholder="whsec_xxxxxxxx"
            />
            <p className="mt-1 text-xs text-gray-400">{t('mercadopago.hints.webhookSecret')}</p>
          </div>

          <div>
            <label htmlFor="mp-default-amount" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.defaultAmount')}
            </label>
            <Input
              id="mp-default-amount"
              type="number"
              min={0}
              step="0.01"
              value={Number.isFinite(form.defaultAmount) ? form.defaultAmount : 0}
              onChange={(e) => handleChange('defaultAmount', Number(e.target.value))}
              placeholder="35000"
            />
          </div>

          <div>
            <label htmlFor="mp-success-url" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.successUrl')}
            </label>
            <Input
              id="mp-success-url"
              type="url"
              value={form.successUrl ?? ''}
              onChange={(e) => handleChange('successUrl', e.target.value)}
              placeholder="https://hamarr.cl/payments?mp=success"
            />
          </div>

          <div>
            <label htmlFor="mp-failure-url" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.failureUrl')}
            </label>
            <Input
              id="mp-failure-url"
              type="url"
              value={form.failureUrl ?? ''}
              onChange={(e) => handleChange('failureUrl', e.target.value)}
              placeholder="https://hamarr.cl/payments?mp=failure"
            />
          </div>

          <div>
            <label htmlFor="mp-pending-url" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.pendingUrl')}
            </label>
            <Input
              id="mp-pending-url"
              type="url"
              value={form.pendingUrl ?? ''}
              onChange={(e) => handleChange('pendingUrl', e.target.value)}
              placeholder="https://hamarr.cl/payments?mp=pending"
            />
          </div>

          <div>
            <label htmlFor="mp-notification-url" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-300">
              {t('mercadopago.fields.notificationUrl')}
            </label>
            <Input
              id="mp-notification-url"
              type="url"
              value={form.notificationUrl ?? ''}
              onChange={(e) => handleChange('notificationUrl', e.target.value)}
              placeholder="https://hamarr.cl/api/payments/mercadopago/webhook"
            />
            <p className="mt-1 text-xs text-gray-400">{t('mercadopago.hints.notificationUrl')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
