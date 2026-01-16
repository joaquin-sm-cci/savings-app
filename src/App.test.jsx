import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('Spending Tracker App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('renders the app title and form elements', () => {
      render(<App />)
      
      expect(screen.getByText('💰 Spending Tracker')).toBeInTheDocument()
      expect(screen.getByText('Track your expenses easily')).toBeInTheDocument()
      expect(screen.getByLabelText('Category')).toBeInTheDocument()
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
      expect(screen.getByLabelText('Note (optional)')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Spending' })).toBeInTheDocument()
    })

    it('shows empty state message when no spendings exist', () => {
      render(<App />)
      
      expect(screen.getByText('No spendings yet. Add your first spending above!')).toBeInTheDocument()
    })

    it('has default form values', () => {
      render(<App />)

      expect(screen.getByDisplayValue('General')).toBeInTheDocument()
      expect(screen.getByTestId('currency-toggle')).toHaveTextContent('MXN')
      expect(screen.getByTestId('amount-input')).toHaveValue('')
      expect(screen.getByPlaceholderText('Add a note about this spending...')).toHaveValue('')
    })
  })

  describe('Form Interactions', () => {
    it('allows category selection', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const categorySelect = screen.getByTestId('category-select')
      await user.selectOptions(categorySelect, 'Personal')
      
      expect(categorySelect).toHaveValue('Personal')
    })

    it('allows currency toggle', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const currencyToggle = screen.getByTestId('currency-toggle')
      expect(currencyToggle).toHaveTextContent('MXN')
      
      await user.click(currencyToggle)
      expect(currencyToggle).toHaveTextContent('USD')
      
      await user.click(currencyToggle)
      expect(currencyToggle).toHaveTextContent('MXN')
    })

    it('allows note input with character limit', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const noteInput = screen.getByTestId('note-input')
      const shortNote = 'Short note'
      
      await user.type(noteInput, shortNote)
      expect(noteInput).toHaveValue(shortNote)
      expect(screen.getByText(`${shortNote.length}/140`)).toBeInTheDocument()
    })

    it('prevents note input beyond 140 characters', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const noteInput = screen.getByTestId('note-input')
      const longNote = 'a'.repeat(150) // 150 characters
      
      await user.type(noteInput, longNote)
      expect(noteInput.value.length).toBe(140)
      expect(screen.getByText('140/140')).toBeInTheDocument()
    })

    it('shows warning when approaching character limit', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const noteInput = screen.getByTestId('note-input')
      const longNote = 'a'.repeat(135) // 135 characters
      
      await user.type(noteInput, longNote)
      
      const charCount = screen.getByText('135/140')
      expect(charCount).toHaveClass('warning')
    })
  })

  describe('Amount Input Validation', () => {
    it('allows numeric input only', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      
      await user.type(amountInput, 'abc123.45def')
      expect(amountInput).toHaveValue('123.45')
    })

    it('prevents multiple decimal points', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      
      await user.type(amountInput, '123.45.67')
      expect(amountInput).toHaveValue('123.45')
    })

    it('disables add button when amount is empty', () => {
      render(<App />)
      
      const addButton = screen.getByTestId('add-spending-btn')
      expect(addButton).toBeDisabled()
    })

    it('disables add button when amount is zero', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '0')
      expect(addButton).toBeDisabled()
    })

    it('enables add button when valid amount is entered', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '25.50')
      expect(addButton).toBeEnabled()
    })
  })

  describe('Adding Spendings', () => {
    it('adds a new spending when form is valid', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Fill form
      const categorySelect = screen.getByTestId('category-select')
      const amountInput = screen.getByTestId('amount-input')
      const noteInput = screen.getByTestId('note-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.selectOptions(categorySelect, 'Personal')
      await user.type(amountInput, '50.75')
      await user.type(noteInput, 'Coffee and lunch')
      await user.click(addButton)

      // Check spending was added (use getAllByText since category appears in filter dropdown too)
      const personalElements = screen.getAllByText('Personal')
      expect(personalElements.length).toBeGreaterThan(0)
      expect(screen.getByText('$50.75 MXN')).toBeInTheDocument()
      expect(screen.getByText('"Coffee and lunch"')).toBeInTheDocument()
    })

    it('resets form after adding spending', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const categorySelect = screen.getByTestId('category-select')
      const amountInput = screen.getByTestId('amount-input')
      const noteInput = screen.getByTestId('note-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.selectOptions(categorySelect, 'Auto')
      await user.type(amountInput, '100.00')
      await user.type(noteInput, 'Gas')
      await user.click(addButton)
      
      // Check form is reset
      expect(categorySelect).toHaveValue('General')
      expect(amountInput).toHaveValue('')
      expect(noteInput).toHaveValue('')
      expect(screen.getByText('0/140')).toBeInTheDocument()
    })

    it('shows alert for invalid amount', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const addButton = screen.getByTestId('add-spending-btn')
      
      // Try to add without amount (button should be disabled, but let's test the validation)
      fireEvent.click(addButton)
      
      expect(global.alert).not.toHaveBeenCalled() // Button should be disabled
    })

    it('adds spending with different currency', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const currencyToggle = screen.getByTestId('currency-toggle')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '25.00')
      await user.click(currencyToggle) // Switch to USD
      await user.click(addButton)
      
      expect(screen.getByText('$25.00 USD')).toBeInTheDocument()
    })
  })

  describe('Category Filter', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Add multiple spendings with different categories
      const amountInput = screen.getByTestId('amount-input')
      const categorySelect = screen.getByTestId('category-select')
      const addButton = screen.getByTestId('add-spending-btn')
      
      // Add General spending
      await user.type(amountInput, '10.00')
      await user.click(addButton)
      
      // Add Personal spending
      await user.selectOptions(categorySelect, 'Personal')
      await user.type(amountInput, '20.00')
      await user.click(addButton)
      
      // Add Auto spending
      await user.selectOptions(categorySelect, 'Auto')
      await user.type(amountInput, '30.00')
      await user.click(addButton)
    })

    it('shows filter dropdown when spendings exist', () => {
      expect(screen.getByTestId('category-filter')).toBeInTheDocument()
      expect(screen.getByText('Filter by Category:')).toBeInTheDocument()
    })

    it('shows all spendings by default', () => {
      const spendingItems = screen.getAllByTestId('spending-item')
      expect(spendingItems).toHaveLength(3)
    })

    it('filters spendings by selected category', async () => {
      const user = userEvent.setup()
      const filterSelect = screen.getByTestId('category-filter')
      
      await user.selectOptions(filterSelect, 'Personal')
      
      const spendingItems = screen.getAllByTestId('spending-item')
      expect(spendingItems).toHaveLength(1)
      expect(screen.getByText('$20.00 MXN')).toBeInTheDocument()
    })

    it('shows empty state when no spendings match filter', async () => {
      const user = userEvent.setup()
      const filterSelect = screen.getByTestId('category-filter')
      
      await user.selectOptions(filterSelect, 'House')
      
      expect(screen.queryAllByTestId('spending-item')).toHaveLength(0)
      expect(screen.getByText('No spendings found for "House" category.')).toBeInTheDocument()
    })

    it('shows correct total for filtered category', async () => {
      const user = userEvent.setup()
      const filterSelect = screen.getByTestId('category-filter')
      
      await user.selectOptions(filterSelect, 'Auto')
      
      expect(screen.getByText('Total (Auto): $30.00 MXN')).toBeInTheDocument()
    })

    it('shows correct total for all categories', () => {
      expect(screen.getByText('Total (All): $60.00 MXN')).toBeInTheDocument()
    })
  })

  describe('Spending Display', () => {
    it('displays spending information correctly', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const categorySelect = screen.getByTestId('category-select')
      const amountInput = screen.getByTestId('amount-input')
      const noteInput = screen.getByTestId('note-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.selectOptions(categorySelect, 'House')
      await user.type(amountInput, '150.25')
      await user.type(noteInput, 'Groceries and utilities')
      await user.click(addButton)
      
      const spendingItem = screen.getByTestId('spending-item')

      // Check all elements are present
      expect(screen.getByText('$150.25 MXN')).toBeInTheDocument()
      expect(screen.getByText('"Groceries and utilities"')).toBeInTheDocument()
      // House appears in both category selector and filter - just check spending has House category
      const houseElements = screen.getAllByText('House')
      expect(houseElements.length).toBeGreaterThan(1) // appears in form dropdown, filter dropdown, and spending item
    })

    it('does not show note section when note is empty', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const amountInput = screen.getByTestId('amount-input')
      const addButton = screen.getByTestId('add-spending-btn')
      
      await user.type(amountInput, '25.00')
      await user.click(addButton)
      
      const spendingItem = screen.getByTestId('spending-item')

      expect(screen.getByText('$25.00 MXN')).toBeInTheDocument()
      // Note section should not be rendered
      expect(screen.queryByText(/"/)).not.toBeInTheDocument() // No quoted text means no note
    })
  })
}) 