import React, { useState } from 'react';

const CATEGORIES = ['General', 'Personal', 'Auto', 'House'];
const CURRENCIES = ['MXN', 'USD'];

function App() {
  const [spendings, setSpendings] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState({
    category: 'General',
    amount: '',
    currency: 'MXN',
    note: ''
  });

  const handleInputChange = (field, value) => {
    if (field === 'amount') {
      // Only allow numbers and decimal point
      let numericValue = value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points - keep only first decimal and 2 digits after
      const firstDotIndex = numericValue.indexOf('.');
      if (firstDotIndex !== -1) {
        const beforeDot = numericValue.substring(0, firstDotIndex);
        const afterDot = numericValue.substring(firstDotIndex + 1).replace(/\./g, '').substring(0, 2);
        numericValue = beforeDot + '.' + afterDot;
      }
      setFormData(prev => ({ ...prev, amount: numericValue }));
    } else if (field === 'note') {
      // Limit to 140 characters
      if (value.length <= 140) {
        setFormData(prev => ({ ...prev, note: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleCurrency = () => {
    setFormData(prev => ({
      ...prev,
      currency: prev.currency === 'MXN' ? 'USD' : 'MXN'
    }));
  };

  const addSpending = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const newSpending = {
      id: Date.now(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      note: formData.note.trim(),
      date: new Date().toLocaleDateString()
    };

    setSpendings(prev => [newSpending, ...prev]);
    
    // Reset form
    setFormData({
      category: 'General',
      amount: '',
      currency: 'MXN',
      note: ''
    });
  };

  const formatAmount = (amount, currency) => {
    return `$${amount.toFixed(2)} ${currency}`;
  };

  const filteredSpendings = filterCategory === 'All' 
    ? spendings 
    : spendings.filter(spending => spending.category === filterCategory);

  const getTotalByCategory = (category) => {
    const categorySpending = category === 'All' 
      ? spendings 
      : spendings.filter(spending => spending.category === category);
    
    return categorySpending.reduce((total, spending) => total + spending.amount, 0);
  };

  const isFormValid = formData.amount && parseFloat(formData.amount) > 0;

  return (
    <div className="container">
      <div className="header">
        <h1>💰 Spending Tracker</h1>
        <p>Track your expenses easily</p>
      </div>

      {/* Add Spending Form */}
      <div className="card">
        <h2>Add New Spending</h2>
        
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            data-testid="category-select"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <div className="amount-input">
            <input
              id="amount"
              type="text"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              style={{ paddingLeft: '20px' }}
              data-testid="amount-input"
            />
            <button
              type="button"
              className="currency-toggle"
              onClick={toggleCurrency}
              data-testid="currency-toggle"
            >
              {formData.currency}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            placeholder="Add a note about this spending..."
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            rows="3"
            data-testid="note-input"
          />
          <div className={`char-count ${formData.note.length > 130 ? 'warning' : ''}`}>
            {formData.note.length}/140
          </div>
        </div>

        <button
          className="add-btn"
          onClick={addSpending}
          disabled={!isFormValid}
          data-testid="add-spending-btn"
        >
          Add Spending
        </button>
      </div>

      {/* Spending Filter and List */}
      <div className="card">
        <div className="spending-header">
          <h2>Your Spendings</h2>
          
          {spendings.length > 0 && (
            <div className="filter-section">
              <div className="filter-controls">
                <label htmlFor="filter">Filter by Category:</label>
                <select
                  id="filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-select"
                  data-testid="category-filter"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="total-display">
                <strong>
                  Total ({filterCategory}): {formatAmount(getTotalByCategory(filterCategory), 'MXN')}
                </strong>
              </div>
            </div>
          )}
        </div>
        
        {filteredSpendings.length === 0 ? (
          <div className="empty-state">
            {spendings.length === 0 ? (
              <p>No spendings yet. Add your first spending above!</p>
            ) : (
              <p>No spendings found for "{filterCategory}" category.</p>
            )}
          </div>
        ) : (
          <>
            {filteredSpendings.map(spending => (
              <div key={spending.id} className="spending-item" data-testid="spending-item">
                <div className="spending-category">
                  {spending.category}
                </div>
                <div className="spending-amount">
                  {formatAmount(spending.amount, spending.currency)}
                </div>
                {spending.note && (
                  <div className="spending-note">
                    "{spending.note}"
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default App; 