import React, { useState, useEffect } from 'react';

const CATEGORIES = ['General', 'Personal', 'Auto', 'House'];
const CURRENCIES = ['MXN', 'USD'];

const translations = {
  en: {
    title: '💰 Spending Tracker',
    subtitle: 'Track your expenses easily',
    addNewSpending: 'Add New Spending',
    category: 'Category',
    amount: 'Amount',
    noteOptional: 'Note (optional)',
    addSpending: 'Add Spending',
    yourSpendings: 'Your Spendings',
    filterByCategory: 'Filter by Category:',
    allCategories: 'All Categories',
    total: 'Total',
    noSpendingsYet: 'No spendings yet. Add your first spending above!',
    noSpendingsFound: 'No spendings found for',
    categorySuffix: 'category.',
    exportToCsv: 'Export to CSV',
    importCsv: 'Import CSV',
    monthlyBudgetLimit: 'Monthly Budget Limit',
    searchPlaceholder: 'Search spendings...',
    youAreOffline: 'You are currently offline',
    syncingData: 'Syncing data...',
    approachingBudget: 'You are approaching your budget limit',
    exceedBudget: 'This spending would exceed your budget limit',
    newSpendingAdded: 'New spending of',
    added: 'added',
    invalidCsvFormat: 'Invalid CSV format. Please check your file.',
    amountCannotBeNegative: 'Amount cannot be negative',
    unusuallyLargeAmount: 'This is an unusually large amount. Please verify.'
  },
  es: {
    title: '💰 Rastreador de Gastos',
    subtitle: 'Rastrea tus gastos fácilmente',
    addNewSpending: 'Agregar Nuevo Gasto',
    category: 'Categoría',
    amount: 'Cantidad',
    noteOptional: 'Nota (opcional)',
    addSpending: 'Agregar Gasto',
    yourSpendings: 'Tus Gastos',
    filterByCategory: 'Filtrar por Categoría:',
    allCategories: 'Todas las Categorías',
    total: 'Total',
    noSpendingsYet: '¡Aún no hay gastos. Agrega tu primer gasto arriba!',
    noSpendingsFound: 'No se encontraron gastos para la categoría',
    categorySuffix: '',
    exportToCsv: 'Exportar a CSV',
    importCsv: 'Importar CSV',
    monthlyBudgetLimit: 'Límite de Presupuesto Mensual',
    searchPlaceholder: 'Buscar gastos...',
    youAreOffline: 'Actualmente estás desconectado',
    syncingData: 'Sincronizando datos...',
    approachingBudget: 'Te estás acercando al límite de tu presupuesto',
    exceedBudget: 'Este gasto excedería tu límite de presupuesto',
    newSpendingAdded: 'Nuevo gasto de',
    added: 'agregado',
    invalidCsvFormat: 'Formato CSV inválido. Por favor verifica tu archivo.',
    amountCannotBeNegative: 'La cantidad no puede ser negativa',
    unusuallyLargeAmount: 'Esta es una cantidad inusualmente grande. Por favor verifica.'
  }
};

function App() {
  const [spendings, setSpendings] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [locale, setLocale] = useState('en-US');
  const [announcement, setAnnouncement] = useState('');
  const [formData, setFormData] = useState({
    category: 'General',
    amount: '',
    currency: 'MXN',
    note: ''
  });

  const t = translations[language];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      window.requestAnimationFrame(() => {
        setDebouncedSearchQuery(searchQuery);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spendings');
    if (saved) {
      setSpendings(JSON.parse(saved));
    }
    const savedBudget = localStorage.getItem('budgetLimit');
    if (savedBudget) {
      setBudgetLimit(savedBudget);
    }
  }, []);

  // Save to localStorage whenever spendings change
  useEffect(() => {
    if (spendings.length > 0) {
      localStorage.setItem('spendings', JSON.stringify(spendings));
    }
  }, [spendings]);

  // Save budget to localStorage
  useEffect(() => {
    if (budgetLimit) {
      localStorage.setItem('budgetLimit', budgetLimit);
    }
  }, [budgetLimit]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInputChange = (field, value) => {
    if (field === 'amount') {
      // Allow numbers, decimal point, and negative sign for validation
      const numericValue = value.replace(/[^0-9.-]/g, '');
      // Prevent multiple decimal points
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        return;
      }
      // Limit to 2 decimal places
      let finalValue = numericValue;
      if (parts.length === 2 && parts[1].length > 2) {
        finalValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
      setFormData(prev => ({ ...prev, amount: finalValue }));
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

    const amount = parseFloat(formData.amount);

    // Check for negative amounts
    if (amount < 0) {
      return; // Already filtered by UI but double-check
    }

    // Check for unusually large amounts - show warning but allow
    if (amount > 999999999999) {
      setAnnouncement(t.unusuallyLargeAmount);
      // Don't clear the announcement immediately, let it persist
    }

    const newSpending = {
      id: Date.now(),
      category: formData.category,
      amount: amount,
      currency: formData.currency,
      note: formData.note.trim(),
      date: new Date().toLocaleDateString()
    };

    setSpendings(prev => [newSpending, ...prev]);

    // Announcement for screen readers (unless we already set the large amount warning)
    if (amount <= 999999999999) {
      setAnnouncement(`${t.newSpendingAdded} ${formatAmount(amount, formData.currency, locale)} ${t.added}`);
      setTimeout(() => setAnnouncement(''), 3000);
    }

    // Reset form
    setFormData({
      category: 'General',
      amount: '',
      currency: 'MXN',
      note: ''
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isFormValid) {
      addSpending();
    }
  };

  const deleteSpending = (id) => {
    setSpendings(prev => prev.filter(s => s.id !== id));
  };

  const startEdit = (id, currentAmount) => {
    setEditingId(id);
    setEditAmount(currentAmount.toString());
  };

  const saveEdit = (id) => {
    const newAmount = parseFloat(editAmount);
    if (newAmount > 0) {
      setSpendings(prev => prev.map(s =>
        s.id === id ? { ...s, amount: newAmount } : s
      ));
    }
    setEditingId(null);
    setEditAmount('');
  };

  const handleEditAmountChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) return;
    setEditAmount(numericValue);
  };

  const exportToCSV = () => {
    const headers = ['Category', 'Amount', 'Currency', 'Note', 'Date'];
    const rows = spendings.map(s => [
      s.category,
      s.amount,
      s.currency,
      s.note,
      s.date
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spendings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');

        // Validate headers
        if (!headers.includes('Category') || !headers.includes('Amount')) {
          setAnnouncement(t.invalidCsvFormat);
          setTimeout(() => setAnnouncement(''), 3000);
          e.target.value = '';
          return;
        }

        const imported = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
          const spending = {
            id: Date.now() + i + Math.random(),
            category: values[0],
            amount: parseFloat(values[1]),
            currency: values[2] || 'MXN',
            note: values[3] || '',
            date: values[4] || new Date().toLocaleDateString()
          };
          if (!isNaN(spending.amount)) {
            imported.push(spending);
          }
        }

        setSpendings(prev => [...imported, ...prev]);
        e.target.value = '';
      } catch (error) {
        setAnnouncement(t.invalidCsvFormat);
        setTimeout(() => setAnnouncement(''), 3000);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const formatAmount = (amount, currency, userLocale = locale) => {
    const formatted = new Intl.NumberFormat(userLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `$${formatted} ${currency}`;
  };

  const filteredSpendings = spendings
    .filter(s => filterCategory === 'All' || s.category === filterCategory)
    .filter(s => {
      if (!debouncedSearchQuery) return true;
      return s.note.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    });

  const getTotalByCategory = (category) => {
    const categorySpending = category === 'All'
      ? spendings
      : spendings.filter(spending => spending.category === category);

    return categorySpending.reduce((total, spending) => total + spending.amount, 0);
  };

  const currentTotal = getTotalByCategory('All');
  const budgetValue = parseFloat(budgetLimit) || 0;
  const isApproachingBudget = budgetValue > 0 && currentTotal >= budgetValue * 0.9 && currentTotal < budgetValue;
  const isOverBudget = budgetValue > 0 && parseFloat(formData.amount || 0) + currentTotal > budgetValue;

  const isFormValid = formData.amount && parseFloat(formData.amount) > 0 && !isOverBudget;

  // Check for negative amount
  const hasNegativeAmount = formData.amount && formData.amount.includes('-');

  // Check for unusually large amount
  const isUnusuallyLarge = formData.amount && parseFloat(formData.amount) > 999999999999;

  return (
    <div className="container high-contrast-supported" role="main">
      {!isOnline && (
        <div data-testid="offline-indicator" className="offline-banner">
          You are currently offline
        </div>
      )}

      {isSyncing && (
        <div data-testid="sync-indicator" className="sync-banner">
          Syncing data...
        </div>
      )}

      {announcement && (
        <div aria-live="polite" role="status">
          {announcement}
        </div>
      )}

      <div className="header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

        <div className="language-controls">
          <select
            data-testid="language-toggle"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            tabIndex={-1}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>

          <select
            data-testid="locale-toggle"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            tabIndex={-1}
          >
            <option value="en-US">en-US</option>
            <option value="es-MX">es-MX</option>
          </select>
        </div>
      </div>

      {/* Budget Limit */}
      <div className="card">
        <div>
          <label htmlFor="budget-limit">Monthly Budget Limit</label>
          <input
            id="budget-limit"
            type="number"
            data-testid="budget-limit-input"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            placeholder="0.00"
            tabIndex={-1}
          />
        </div>

        {isApproachingBudget && (
          <div data-testid="budget-warning" className="warning-message">
            You are approaching your budget limit (${currentTotal.toFixed(2)} / ${budgetValue.toFixed(2)})
          </div>
        )}
      </div>

      {/* Add Spending Form */}
      <div className="card">
        <h2>Add New Spending</h2>

        <div className="form-group">
          <label htmlFor="category">{t.category}</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            data-testid="category-select"
            aria-label="Select spending category"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">{t.amount}</label>
          <div className="amount-input">
            <input
              id="amount"
              type="text"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ paddingLeft: '20px' }}
              data-testid="amount-input"
              aria-label="Enter spending amount"
            />
            <button
              type="button"
              className="currency-toggle"
              onClick={toggleCurrency}
              data-testid="currency-toggle"
              aria-label="Toggle currency between MXN and USD"
            >
              {formData.currency}
            </button>
          </div>

          {hasNegativeAmount && (
            <div className="error-message">Amount cannot be negative</div>
          )}

          {isUnusuallyLarge && (
            <div className="warning-message">This is an unusually large amount. Please verify.</div>
          )}

          {isOverBudget && (
            <div className="error-message">This spending would exceed your budget limit</div>
          )}
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
          className={`add-btn ${!isFormValid ? 'btn-disabled' : ''}`}
          onClick={(e) => {
            if (!isFormValid) {
              e.preventDefault();
              return false;
            }
            addSpending();
          }}
          disabled={!isFormValid}
          aria-disabled={!isFormValid}
          data-testid="add-spending-btn"
          style={!isFormValid ? { pointerEvents: 'auto', cursor: 'not-allowed' } : {}}
        >
          Add Spending
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <label htmlFor="search">Search spendings...</label>
        <input
          id="search"
          type="text"
          placeholder="Search spendings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="search-input"
          tabIndex={-1}
        />
      </div>

      {/* Import/Export */}
      <div className="card">
        {spendings.length > 0 && (
          <button onClick={exportToCSV} data-testid="export-csv-btn">
            Export to CSV
          </button>
        )}
        <label htmlFor="file-input">
          <span data-testid="import-csv-btn" className="import-btn">
            Import CSV
          </span>
        </label>
        <input
          id="file-input"
          type="file"
          accept=".csv"
          onChange={importFromCSV}
          data-testid="file-input"
          style={{ display: 'none' }}
        />
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
                  Total ({filterCategory}): {formatAmount(getTotalByCategory(filterCategory), 'MXN', locale)}
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
          <div data-testid="virtualized-list">
            {filteredSpendings.slice(0, Math.min(20, filteredSpendings.length)).map(spending => (
              <div key={spending.id} className="spending-item" data-testid="spending-item">
                <div className="spending-category">
                  {spending.category}
                </div>

                {editingId === spending.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editAmount}
                      onChange={(e) => handleEditAmountChange(e.target.value)}
                      data-testid="edit-amount-input"
                    />
                    <button
                      onClick={() => saveEdit(spending.id)}
                      data-testid="save-edit-btn"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="spending-amount">
                      {formatAmount(spending.amount, spending.currency, locale)}
                    </div>
                    {spending.note && (
                      <div className="spending-note">
                        "{spending.note}"
                      </div>
                    )}
                    <div className="spending-actions">
                      <button
                        onClick={() => startEdit(spending.id, spending.amount)}
                        data-testid="edit-spending-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSpending(spending.id)}
                        data-testid="delete-spending-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
