import React, { useState, useEffect } from 'react'
import { 
  FaDollarSign, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaSpinner,
  FaTimes,
  FaExclamationCircle,
  FaDownload,
  FaChartPie,
  FaList
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../services/api'
import styles from './Expenses.module.css'

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' })
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [summary, setSummary] = useState({
    total: 0,
    byCategory: {},
    average: 0,
    count: 0
  })

  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState({})

  const categories = [
    { value: 'food', label: '🍔 Food', color: '#FF6384' },
    { value: 'utilities', label: '💡 Utilities', color: '#36A2EB' },
    { value: 'maintenance', label: '🔧 Maintenance', color: '#FFCE56' },
    { value: 'staff', label: '👨‍🍳 Staff', color: '#4BC0C0' },
    { value: 'supplies', label: '📦 Supplies', color: '#9966FF' },
    { value: 'other', label: '📋 Other', color: '#FF9F40' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank', label: 'Bank Transfer' }
  ]

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    filterAndSortExpenses()
    calculateSummary()
  }, [expenses, searchTerm, filterCategory, filterDateRange, sortField, sortDirection])

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/expenses')
      setExpenses(response.data)
      setFilteredExpenses(response.data)
    } catch (error) {
      toast.error('Failed to fetch expenses')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortExpenses = () => {
    let result = [...expenses]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(expense =>
        expense.description.toLowerCase().includes(term) ||
        expense.notes?.toLowerCase().includes(term)
      )
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      result = result.filter(expense => expense.category === filterCategory)
    }

    // Apply date range filter
    if (filterDateRange.start) {
      result = result.filter(expense => expense.date >= filterDateRange.start)
    }
    if (filterDateRange.end) {
      result = result.filter(expense => expense.date <= filterDateRange.end)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredExpenses(result)
  }

  const calculateSummary = () => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const byCategory = {}
    filteredExpenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    })
    
    setSummary({
      total,
      byCategory,
      average: filteredExpenses.length > 0 ? total / filteredExpenses.length : 0,
      count: filteredExpenses.length
    })
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
    
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      if (editingExpense) {
        await api.put(`/api/expenses/${editingExpense._id}`, formData)
        toast.success('Expense updated successfully')
      } else {
        await api.post('/api/expenses', formData)
        toast.success('Expense added successfully')
      }
      
      setShowModal(false)
      setEditingExpense(null)
      resetForm()
      fetchExpenses()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!expenseToDelete) return
    
    try {
      await api.delete(`/api/expenses/${expenseToDelete._id}`)
      toast.success('Expense deleted successfully')
      setShowDeleteConfirm(false)
      setExpenseToDelete(null)
      fetchExpenses()
    } catch (error) {
      toast.error('Failed to delete expense')
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      payment_method: expense.payment_method || 'cash',
      notes: expense.notes || ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: 0,
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: ''
    })
    setFormErrors({})
  }

  const getCategoryLabel = (value) => {
    const cat = categories.find(c => c.value === value)
    return cat ? cat.label : value
  }

  const getCategoryColor = (value) => {
    const cat = categories.find(c => c.value === value)
    return cat ? cat.color : '#666'
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
  }

  const exportData = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method']
    const rows = filteredExpenses.map(e => [
      e.date,
      e.description,
      e.category,
      e.amount,
      e.payment_method || 'cash'
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Export successful')
  }

  if (loading && expenses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading expenses...</p>
      </div>
    )
  }

  return (
    <div className={styles.expensesContainer}>
      <div className={styles.expensesHeader}>
        <div>
          <h1 className={styles.expensesTitle}>Expenses</h1>
          <p className={styles.expensesSubtitle}>
            Track and manage all expenses
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FaList />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'chart' ? styles.activeView : ''}`}
              onClick={() => setViewMode('chart')}
              title="Chart View"
            >
              <FaChartPie />
            </button>
          </div>
          <button
            onClick={exportData}
            className={`${styles.actionButton} ${styles.exportBtn}`}
          >
            <FaDownload /> Export
          </button>
          <button
            onClick={() => {
              setEditingExpense(null)
              resetForm()
              setShowModal(true)
            }}
            className={styles.addButton}
          >
            <FaPlus />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
          <div className={styles.summaryIcon}>
            <FaDollarSign />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>₹{summary.total.toFixed(2)}</span>
            <span className={styles.summaryLabel}>Total Expenses</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
          <div className={styles.summaryIcon}>
            <FaList />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>{summary.count}</span>
            <span className={styles.summaryLabel}>Total Entries</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
          <div className={styles.summaryIcon}>
            <FaCalendarAlt />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>₹{summary.average.toFixed(2)}</span>
            <span className={styles.summaryLabel}>Average per Entry</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPurple}`}>
          <div className={styles.summaryIcon}>
            <FaFilter />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>
              {Object.keys(summary.byCategory).length}
            </span>
            <span className={styles.summaryLabel}>Categories Used</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filterDateRange.start}
            onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
            className={styles.filterInput}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filterDateRange.end}
            onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
            className={styles.filterInput}
            placeholder="End Date"
          />
        </div>

        <button
          onClick={() => {
            setFilterCategory('all')
            setFilterDateRange({ start: '', end: '' })
            setSearchTerm('')
          }}
          className={styles.clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.expensesTable}>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className={styles.sortableHeader}>
                Date {getSortIcon('date')}
              </th>
              <th onClick={() => handleSort('description')} className={styles.sortableHeader}>
                Description {getSortIcon('description')}
              </th>
              <th onClick={() => handleSort('category')} className={styles.sortableHeader}>
                Category {getSortIcon('category')}
              </th>
              <th onClick={() => handleSort('amount')} className={styles.sortableHeader}>
                Amount {getSortIcon('amount')}
              </th>
              <th>Payment</th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyState}>
                  <FaDollarSign className={styles.emptyIcon} />
                  <p>No expenses found</p>
                  <span>Add your first expense</span>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td className={styles.descriptionCell}>
                    <span className={styles.descriptionText}>{expense.description}</span>
                    {expense.notes && (
                      <span className={styles.noteText}>{expense.notes}</span>
                    )}
                  </td>
                  <td>
                    <span 
                      className={styles.categoryBadge}
                      style={{ background: `${getCategoryColor(expense.category)}20`, color: getCategoryColor(expense.category) }}
                    >
                      {getCategoryLabel(expense.category)}
                    </span>
                  </td>
                  <td className={styles.amountCell}>
                    <span className={styles.amountText}>₹{expense.amount.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={styles.paymentBadge}>
                      {expense.payment_method || 'cash'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => handleEdit(expense)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Edit expense"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setExpenseToDelete(expense)
                        setShowDeleteConfirm(true)
                      }}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete expense"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.modalClose}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`${styles.formInput} ${formErrors.description ? styles.error : ''}`}
                    placeholder="Enter description"
                  />
                  {formErrors.description && (
                    <span className={styles.errorText}>{formErrors.description}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount (₹) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className={`${styles.formInput} ${formErrors.amount ? styles.error : ''}`}
                    placeholder="0.00"
                  />
                  {formErrors.amount && (
                    <span className={styles.errorText}>{formErrors.amount}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={styles.formInput}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`${styles.formInput} ${formErrors.date ? styles.error : ''}`}
                  />
                  {formErrors.date && (
                    <span className={styles.errorText}>{formErrors.date}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className={styles.formInput}
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={styles.formInput}
                    placeholder="Add any notes..."
                    rows="2"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <><FaSpinner className={styles.spinner} /> Processing...</>
                  ) : (
                    <>{editingExpense ? 'Update' : 'Add'} Expense</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && expenseToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div className={`${styles.modal} ${styles.confirmModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirm Delete</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.modalClose}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.confirmContent}>
              <FaExclamationCircle className={styles.confirmIcon} />
              <p>Delete expense: <strong>{expenseToDelete.description}</strong>?</p>
              <p className={styles.confirmSubtext}>Amount: ₹{expenseToDelete.amount.toFixed(2)}</p>
              <p className={styles.confirmSubtext}>This action cannot be undone.</p>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={`${styles.submitBtn} ${styles.dangerBtn}`}
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses