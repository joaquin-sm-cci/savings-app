import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Mock window object properties
if (typeof window !== 'undefined') {
  // Mock window.alert for tests
  global.alert = vi.fn()

  // Mock URL.createObjectURL for CSV export tests
  global.URL.createObjectURL = vi.fn(() => 'mock-url')
  global.URL.revokeObjectURL = vi.fn()

  // Mock window.requestAnimationFrame
  window.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 0)
    return 0
  })
}

// Clear localStorage after each test
afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
}) 