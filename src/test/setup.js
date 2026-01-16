import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Mock window.alert for tests
global.alert = vi.fn()

// Mock URL.createObjectURL for CSV export tests
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Clear localStorage after each test
afterEach(() => {
  localStorage.clear()
}) 