import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('initial')
  })

  it('should return stored value when it exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('should update value and localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0))

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(1)
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify(1))
  })

  it('should remove value from localStorage when removeValue is called', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[2]() // removeValue
    })

    expect(result.current[0]).toBe('initial')
    expect(localStorage.getItem('test-key')).toBeNull()
  })

  it('should handle complex objects', () => {
    const initialObject = { name: 'test', count: 0 }
    const storedObject = { name: 'stored', count: 5 }

    localStorage.setItem('test-key', JSON.stringify(storedObject))

    const { result } = renderHook(() => useLocalStorage('test-key', initialObject))

    expect(result.current[0]).toEqual(storedObject)

    act(() => {
      result.current[1]({ name: 'updated', count: 10 })
    })

    expect(result.current[0]).toEqual({ name: 'updated', count: 10 })
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ name: 'updated', count: 10 })
  })

  it('should handle JSON parse errors gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Set invalid JSON in localStorage
    localStorage.setItem('test-key', 'invalid-json{')

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'))

    expect(result.current[0]).toBe('fallback')
    warnSpy.mockRestore()
  })

  it('should handle localStorage errors gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Mock localStorage.setItem to throw an error
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('Storage quota exceeded')
    })

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('new-value')
    })

    // Should still update state even if localStorage fails
    expect(result.current[0]).toBe('new-value')

    // Restore original setItem
    Storage.prototype.setItem = originalSetItem
    warnSpy.mockRestore()
  })
})