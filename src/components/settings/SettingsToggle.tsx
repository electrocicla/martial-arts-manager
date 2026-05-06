interface SettingsToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export default function SettingsToggle({ id, label, description, checked, disabled, onChange }: SettingsToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-900/40 p-4 transition-colors hover:bg-gray-800/70"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{label}</span>
        {description && <span className="mt-1 block text-xs text-gray-400">{description}</span>}
      </span>
      <span className="relative inline-flex items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className="h-6 w-11 rounded-full bg-gray-600 transition-colors peer-checked:bg-red-600 peer-disabled:opacity-50"
          aria-hidden="true"
        />
        <span
          className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 peer-disabled:opacity-70"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}