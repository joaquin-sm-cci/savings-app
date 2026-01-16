import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('Failing Tests - Features Not Yet Implemented', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Delete Functionality', () => {
    it('should have delete buttons for each spending item', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add a spending first
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '50.00')
      await user.click(addButton)
      
      // Look for delete button that doesn't exist
      expect(screen.getByTestId('delete-spending-btn')).toBeInTheDocument()
    })

    it('should delete a spending when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add a spending
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '75.00')
      await user.click(addButton)
      
      // Try to delete it
      const deleteButton = screen.getByTestId('delete-spending-btn')
      await user.click(deleteButton)
      
      // Check that spending is removed
      expect(screen.queryByText('$75.00 MXN')).not.toBeInTheDocument()
    })
  })

  describe('Edit Functionality', () => {
    it('should have edit buttons for each spending item', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add a spending first
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '100.00')
      await user.click(addButton)
      
      // Look for edit button that doesn't exist
      expect(screen.getByTestId('edit-spending-btn')).toBeInTheDocument()
    })

    it('should allow editing a spending amount', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add a spending
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '200.00')
      await user.click(addButton)
      
      // Click edit button
      const editButton = screen.getByTestId('edit-spending-btn')
      await user.click(editButton)
      
      // Should show edit form
      expect(screen.getByTestId('edit-amount-input')).toBeInTheDocument()
      
      // Change amount
      const editAmountInput = screen.getByTestId('edit-amount-input')
      await user.clear(editAmountInput)
      await user.type(editAmountInput, '250.00')
      
      // Save changes
      const saveButton = screen.getByTestId('save-edit-btn')
      await user.click(saveButton)
      
      // Check updated amount
      expect(screen.getByText('$250.00 MXN')).toBeInTheDocument()
      expect(screen.queryByText('$200.00 MXN')).not.toBeInTheDocument()
    })
  })

  describe('Data Persistence', () => {
    it('should save spendings to localStorage', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '150.00')
      await user.click(addButton)
      
      // Check localStorage
      const savedData = JSON.parse(localStorage.getItem('spendings'))
      expect(savedData).toHaveLength(1)
      expect(savedData[0].amount).toBe(150.00)
    })

    it('should load spendings from localStorage on app start', () => {
      // Set up localStorage data
      const mockSpendings = [
        {
          id: 1,
          category: 'General',
          amount: 100.00,
          currency: 'MXN',
          note: 'Test spending',
          date: '1/1/2024'
        }
      ]
      localStorage.setItem('spendings', JSON.stringify(mockSpendings))
      
      render(<App />)
      
      // Should display the saved spending
      expect(screen.getByText('$100.00 MXN')).toBeInTheDocument()
      expect(screen.getByText('"Test spending"')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should have a search input field', () => {
      render(<App />)
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search spendings...')).toBeInTheDocument()
    })

    it('should filter spendings by note content', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add multiple spendings with different notes
      const amountInput = screen.getByTestId('amount-input')
      const noteInput = screen.getByTestId('note-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      // First spending
      await user.type(amountInput, '50.00')
      await user.type(noteInput, 'Grocery shopping')
      await user.click(addButton)
      
      // Second spending
      await user.type(amountInput, '25.00')
      await user.clear(noteInput)
      await user.type(noteInput, 'Gas station')
      await user.click(addButton)
      
      // Search for "grocery"
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'grocery')

      // Should only show grocery spending (wait for debounce)
      await waitFor(() => {
        expect(screen.getByText('"Grocery shopping"')).toBeInTheDocument()
        expect(screen.queryByText('"Gas station"')).not.toBeInTheDocument()
      })
    })
  })

  describe('Budget Limits', () => {
    it('should have a budget limit setting', () => {
      render(<App />)
      
      expect(screen.getByTestId('budget-limit-input')).toBeInTheDocument()
      expect(screen.getByText('Monthly Budget Limit')).toBeInTheDocument()
    })

    it('should warn when approaching budget limit', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Set budget limit
      const budgetInput = screen.getByTestId('budget-limit-input')
      await user.type(budgetInput, '1000')
      
      // Add spending close to limit
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '950.00')
      await user.click(addButton)
      
      // Should show warning
      expect(screen.getByTestId('budget-warning')).toBeInTheDocument()
      expect(screen.getByText(/You are approaching your budget limit/)).toBeInTheDocument()
    })

    it('should prevent adding spending when over budget', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Set budget limit
      const budgetInput = screen.getByTestId('budget-limit-input')
      await user.type(budgetInput, '500')
      
      // Try to add spending over budget
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '600.00')
      
      // Button should be disabled
      expect(addButton).toBeDisabled()
      
      // Should show error message
      expect(screen.getByText(/This spending would exceed your budget limit/)).toBeInTheDocument()
    })
  })

  describe('Export Functionality', () => {
    it('should have an export to CSV button', async () => {
      const user = userEvent.setup()
      render(<App />)

      // Add a spending first so export button appears
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      await user.type(amountInput, '50.00')
      await user.click(addButton)

      expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument()
      expect(screen.getByText('Export to CSV')).toBeInTheDocument()
    })

    it('should download CSV file when export button is clicked', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add some spendings first
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '100.00')
      await user.click(addButton)
      
      // Mock download functionality
      const downloadSpy = vi.spyOn(document, 'createElement')
      
      const exportButton = screen.getByTestId('export-csv-btn')
      await user.click(exportButton)
      
      // Should trigger download
      expect(downloadSpy).toHaveBeenCalledWith('a')
    })
  })
}) 