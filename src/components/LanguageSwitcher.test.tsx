import { describe, it, expect, vi } from 'vitest'
import { render } from '../test/test-utils'
import { screen } from '@testing-library/react'
import { LanguageSwitcher } from './LanguageSwitcher'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}))

describe('LanguageSwitcher', () => {
  it('should render language options', () => {
    render(<LanguageSwitcher />)

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('en')
  })

  it('should display all language options', () => {
    render(<LanguageSwitcher />)

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)

    expect(options[0]).toHaveValue('en')
    expect(options[0]).toHaveTextContent('English')

    expect(options[1]).toHaveValue('es')
    expect(options[1]).toHaveTextContent('Español')

    expect(options[2]).toHaveValue('pt')
    expect(options[2]).toHaveTextContent('Português')
  })

  it('should have correct styling classes', () => {
    render(<LanguageSwitcher />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('w-32')
  })
})