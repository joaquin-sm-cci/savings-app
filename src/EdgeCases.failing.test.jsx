import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('Edge Cases and Advanced Features - Failing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Input Validation Edge Cases', () => {
    it('should prevent negative amounts', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '-50.00')
      
      // Should show error message for negative amounts
      expect(screen.getByText('Amount cannot be negative')).toBeInTheDocument()
    })

    it('should handle extremely large amounts gracefully', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      // Try to add a very large amount
      await user.type(amountInput, '999999999999.99')
      await user.click(addButton)
      
      // Should show warning about large amounts
      expect(screen.getByText(/This is an unusually large amount/)).toBeInTheDocument()
    })

    it('should limit decimal places to 2', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '50.12345')
      
      // Should only keep 2 decimal places
      expect(amountInput).toHaveValue('50.12')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation between form fields', async () => {
      const user = userEvent.setup()
      render(<App />)

      const categorySelect = screen.getByTestId('category-select')
      const amountInput = screen.getByTestId('amount-input')
      const currencyToggle = screen.getByTestId('currency-toggle')
      const noteInput = screen.getByTestId('note-input')

      // Tab navigation should work through the form fields
      categorySelect.focus()
      expect(categorySelect).toHaveFocus()

      await user.tab()
      expect(amountInput).toHaveFocus()

      await user.tab()
      expect(currencyToggle).toHaveFocus()

      await user.tab()
      expect(noteInput).toHaveFocus()
    })

    it('should allow Enter key to submit form when amount is focused', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      await user.type(amountInput, '75.00')
      await user.keyboard('{Enter}')
      
      // Should add the spending
      expect(screen.getByText('$75.00 MXN')).toBeInTheDocument()
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels for screen readers', () => {
      render(<App />)
      
      expect(screen.getByLabelText('Category')).toHaveAttribute('aria-label', 'Select spending category')
      expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-label', 'Enter spending amount')
      expect(screen.getByTestId('currency-toggle')).toHaveAttribute('aria-label', 'Toggle currency between MXN and USD')
    })

    it('should announce when new spendings are added', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '100.00')
      await user.click(addButton)
      
      // Should have live region announcement
      expect(screen.getByText('New spending of $100.00 MXN added')).toHaveAttribute('aria-live', 'polite')
    })

    it('should support high contrast mode', () => {
      render(<App />)
      
      // Check for high contrast styles
      const appContainer = screen.getByRole('main')
      expect(appContainer).toHaveClass('high-contrast-supported')
    })
  })

  describe('Performance Features', () => {
    it('should virtualize spending list for large datasets', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Add many spendings to test virtualization
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')

      for (let i = 0; i < 100; i++) {
        await user.type(amountInput, `${i + 1}.00`)
        await user.click(addButton)
        await user.clear(amountInput)
      }

      // Should only render visible items
      const renderedItems = screen.getAllByTestId('spending-item')
      expect(renderedItems.length).toBeLessThan(100) // Should not render all

      // Should have virtualization container
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    }, 30000)

    it('should debounce search input for better performance', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const searchInput = screen.getByTestId('search-input')
      
      // Type quickly
      await user.type(searchInput, 'quick typing test')
      
      // Should not trigger search immediately
      const searchSpy = vi.spyOn(window, 'requestAnimationFrame')
      expect(searchSpy).not.toHaveBeenCalled()
      
      // Wait for debounce
      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalled()
      }, { timeout: 500 })
    })
  })

  describe('Data Import/Export', () => {
    it('should import spendings from CSV file', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const importButton = screen.getByTestId('import-csv-btn')
      expect(importButton).toBeInTheDocument()
      
      // Mock file input
      const csvContent = 'Category,Amount,Currency,Note,Date\nGeneral,100.00,MXN,Test,1/1/2024'
      const file = new File([csvContent], 'spendings.csv', { type: 'text/csv' })
      
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, file)
      
      // Should import the data
      expect(screen.getByText('$100.00 MXN')).toBeInTheDocument()
      expect(screen.getByText('"Test"')).toBeInTheDocument()
    })

    it('should validate CSV format during import', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Upload invalid CSV
      const invalidCsv = 'Invalid,CSV,Format'
      const file = new File([invalidCsv], 'invalid.csv', { type: 'text/csv' })
      
      const fileInput = screen.getByTestId('file-input')
      await user.upload(fileInput, file)
      
      // Should show error
      expect(screen.getByText('Invalid CSV format. Please check your file.')).toBeInTheDocument()
    })
  })

  describe('Offline Support', () => {
    it('should work when offline', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      render(<App />)
      
      // Should show offline indicator
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument()
      expect(screen.getByText('You are currently offline')).toBeInTheDocument()
    })

    it('should sync data when coming back online', async () => {
      const user = userEvent.setup()
      
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      render(<App />)
      
      // Add spending while offline
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '50.00')
      await user.click(addButton)
      
      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })
      
      // Trigger online event
      fireEvent(window, new Event('online'))
      
      // Should show sync indicator
      expect(screen.getByTestId('sync-indicator')).toBeInTheDocument()
      expect(screen.getByText('Syncing data...')).toBeInTheDocument()
    })
  })

  describe('Multi-language Support', () => {
    it('should support Spanish language', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const languageToggle = screen.getByTestId('language-toggle')
      await user.click(languageToggle)
      await user.selectOptions(languageToggle, 'es')
      
      // Should display Spanish text
      expect(screen.getByText('💰 Rastreador de Gastos')).toBeInTheDocument()
      expect(screen.getByText('Categoría')).toBeInTheDocument()
      expect(screen.getByText('Cantidad')).toBeInTheDocument()
    })

    it('should format currency according to locale', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Switch to US locale
      const localeToggle = screen.getByTestId('locale-toggle')
      await user.selectOptions(localeToggle, 'en-US')
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '1234.56')
      await user.click(addButton)
      
      // Should format with US conventions
      expect(screen.getByText('$1,234.56 MXN')).toBeInTheDocument()
    })
  })
}) 