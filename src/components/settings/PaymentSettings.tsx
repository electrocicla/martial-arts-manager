import { Save, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import useSettings from '../../hooks/useSettings';

export default function PaymentSettings() {
  const { saveSection } = useSettings();
  const [provider, setProvider] = useState('Stripe');
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [acceptCards, setAcceptCards] = useState(true);
  const [acceptBank, setAcceptBank] = useState(false);
  const [acceptCash, setAcceptCash] = useState(true);
  const [autoBilling, setAutoBilling] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(7);
  const [lateFee, setLateFee] = useState(5);

  const handleSave = async () => {
    await saveSection('payment', {
      provider,
      apiKey,
      webhookSecret,
      options: { acceptCards, acceptBank, acceptCash, autoBilling },
      late: { gracePeriod, lateFee }
    });
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sm:p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Configuration</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded-md border text-sm">Test</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-sm inline-flex items-center gap-2"><Save className="w-4 h-4" />Save</button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-sky-50 dark:bg-slate-800 p-3 rounded-md">
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <div className="text-sm text-slate-700 dark:text-slate-300">Configure your payment gateway to accept online payments</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-transparent">
              <option>Stripe</option>
              <option>Square</option>
              <option>PayPal</option>
              <option>Manual Only</option>
            </select>
          </label>

          <div />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">API key</span>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="sk_live_..." className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Webhook secret</span>
            <input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} type="password" placeholder="whsec_..." className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Payment options</h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Accept credit cards</span>
              <input checked={acceptCards} onChange={(e) => setAcceptCards(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-sky-600" aria-hidden />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Accept bank transfers</span>
              <input checked={acceptBank} onChange={(e) => setAcceptBank(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-sky-600" aria-hidden />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Accept cash payments</span>
              <input checked={acceptCash} onChange={(e) => setAcceptCash(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-sky-600" aria-hidden />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">Enable auto-billing</span>
              <input checked={autoBilling} onChange={(e) => setAutoBilling(e.target.checked)} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-sky-600" aria-hidden />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Grace period (days)</span>
            <input value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} type="number" className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Late fee (%)</span>
            <input value={lateFee} onChange={(e) => setLateFee(Number(e.target.value))} type="number" className="mt-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm" />
          </label>
        </div>
      </div>
    </section>
  );
}