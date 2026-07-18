import React, { useState, useEffect } from 'react'
import { 
  FaUtensils, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaExclamationCircle,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaDownload,
  FaPrint
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../services/api'
import styles from './Meals.module.css'

const Meals = () => {
  const [meals, setMeals] = useState([])
  const [filteredMeals, setFilteredMeals] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterMember, setFilterMember] = useState('all')
  const [sortField, setSortField] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mealToDelete, setMealToDelete] = useState(null)
  const [summary, setSummary] = useState({
    totalMeals: 0,
    totalCost: 0,
    averagePerMember: 0,
    todayMeals: 0
  })

  const [formData, setFormData] = useState({
    member_id: '',
    meal_count: 1,
    date: new Date().toISOString().split('T')[0],
    cost: 50,
    meal_type: 'lunch',
    notes: ''
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterAndSortMeals()
    calculateSummary()
  }, [meals, searchTerm, filterDate, filterMember, sortField, sortDirection])

  const fetchData = async () => {
    try {
      const [mealsRes, membersRes] = await Promise.all([
        api.get('/api/meals'),
        api.get('/api/users/members')
      ])
      setMeals(mealsRes.data)
      setFilteredMeals(mealsRes.data)
      setMembers(membersRes.data)
    } catch (error) {
      toast.error('Failed to fetch data')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMeals = () => {
    let result = [...meals]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(meal => {
        const member = members.find(m => m._id === meal.member_id)
        return member?.name.toLowerCase().includes(term) ||
               meal.notes?.toLowerCase().includes(term)
      })
    }

    // Apply date filter
    if (filterDate) {
      result = result.filter(meal => meal.date === filterDate)
    }

    // Apply member filter
    if (filterMember !== 'all') {
      result = result.filter(meal => meal.member_id === filterMember)
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      
      if (sortField === 'member_name') {
        const aMember = members.find(m => m._id === a.member_id)
        const bMember = members.find(m => m._id === b.member_id)
        aVal = aMember?.name || ''
        bVal = bMember?.name || ''
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredMeals(result)
  }

  const calculateSummary = () => {
    const totalMeals = filteredMeals.reduce((sum, m) => sum + m.meal_count, 0)
    const totalCost = filteredMeals.reduce((sum, m) => sum + (m.cost || m.meal_count * 50), 0)
    const today = new Date().toISOString().split('T')[0]
    const todayMeals = filteredMeals
      .filter(m => m.date === today)
      .reduce((sum, m) => sum + m.meal_count, 0)
    
    const uniqueMembers = new Set(filteredMeals.map(m => m.member_id))
    
    setSummary({
      totalMeals,
      totalCost,
      averagePerMember: uniqueMembers.size > 0 ? Math.round(totalMeals / uniqueMembers.size * 10) / 10 : 0,
      todayMeals
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
    
    if (!formData.member_id) {
      errors.member_id = 'Please select a member'
    }
    
    if (!formData.meal_count || formData.meal_count < 1) {
      errors.meal_count = 'Meal count must be at least 1'
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
      if (editingMeal) {
        await api.put(`/api/meals/${editingMeal._id}`, formData)
        toast.success('Meal updated successfully')
      } else {
        await api.post('/api/meals', formData)
        toast.success('Meal added successfully')
      }
      
      setShowModal(false)
      setEditingMeal(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!mealToDelete) return
    
    try {
      await api.delete(`/api/meals/${mealToDelete._id}`)
      toast.success('Meal deleted successfully')
      setShowDeleteConfirm(false)
      setMealToDelete(null)
      fetchData()
    } catch (error) {
      toast.error('Failed to delete meal')
    }
  }

  const handleEdit = (meal) => {
    setEditingMeal(meal)
    setFormData({
      member_id: meal.member_id,
      meal_count: meal.meal_count,
      date: meal.date,
      cost: meal.cost || meal.meal_count * 50,
      meal_type: meal.meal_type || 'lunch',
      notes: meal.notes || ''
    })
    setFormErrors({})
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      member_id: '',
      meal_count: 1,
      date: new Date().toISOString().split('T')[0],
      cost: 50,
      meal_type: 'lunch',
      notes: ''
    })
    setFormErrors({})
  }

  const getMemberName = (memberId) => {
    const member = members.find(m => m._id === memberId)
    return member?.name || 'Unknown'
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
  }

  const getMealTypeBadge = (type) => {
    const types = {
      breakfast: { color: '#f59e0b', label: 'Breakfast' },
      lunch: { color: '#10b981', label: 'Lunch' },
      dinner: { color: '#667eea', label: 'Dinner' },
      snack: { color: '#8b5cf6', label: 'Snack' }
    }
    const t = types[type] || types.lunch
    return (
      <span className={styles.mealTypeBadge} style={{ background: `${t.color}20`, color: t.color }}>
        {t.label}
      </span>
    )
  }

  const exportData = () => {
    const headers = ['Date', 'Member', 'Meals', 'Cost', 'Type']
    const rows = filteredMeals.map(m => [
      m.date,
      getMemberName(m.member_id),
      m.meal_count,
      m.cost || m.meal_count * 50,
      m.meal_type || 'lunch'
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meals_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Export successful')
  }

  if (loading && meals.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading meals...</p>
      </div>
    )
  }

  return (
    <div className={styles.mealsContainer}>
      <div className={styles.mealsHeader}>
        <div>
          <h1 className={styles.mealsTitle}>Meals</h1>
          <p className={styles.mealsSubtitle}>
            Track and manage daily meals
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={exportData}
            className={`${styles.actionButton} ${styles.exportBtn}`}
          >
            <FaDownload /> Export
          </button>
          <button
            onClick={() => {
              setEditingMeal(null)
              resetForm()
              setShowModal(true)
            }}
            className={styles.addButton}
          >
            <FaPlus />
            Add Meal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
          <div className={styles.summaryIcon}>
            <FaUtensils />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>{summary.totalMeals}</span>
            <span className={styles.summaryLabel}>Total Meals</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
          <div className={styles.summaryIcon}>
            <FaClock />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>{summary.todayMeals}</span>
            <span className={styles.summaryLabel}>Today's Meals</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPurple}`}>
          <div className={styles.summaryIcon}>
            <FaUser />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>{summary.averagePerMember}</span>
            <span className={styles.summaryLabel}>Avg per Member</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
          <div className={styles.summaryIcon}>
            <FaCalendarAlt />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>₹{summary.totalCost}</span>
            <span className={styles.summaryLabel}>Total Cost</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={styles.filterInput}
          />
          
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Members</option>
            {members.map(member => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setFilterDate('')
            setFilterMember('all')
            setSearchTerm('')
          }}
          className={styles.clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.mealsTable}>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className={styles.sortableHeader}>
                Date {getSortIcon('date')}
              </th>
              <th onClick={() => handleSort('member_name')} className={styles.sortableHeader}>
                Member {getSortIcon('member_name')}
              </th>
              <th onClick={() => handleSort('meal_count')} className={styles.sortableHeader}>
                Meals {getSortIcon('meal_count')}
              </th>
              <th onClick={() => handleSort('meal_type')} className={styles.sortableHeader}>
                Type {getSortIcon('meal_type')}
              </th>
              <th onClick={() => handleSort('cost')} className={styles.sortableHeader}>
                Cost {getSortIcon('cost')}
              </th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeals.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyState}>
                  <FaUtensils className={styles.emptyIcon} />
                  <p>No meals found</p>
                  <span>Add your first meal record</span>
                </td>
              </tr>
            ) : (
              filteredMeals.map((meal) => (
                <tr key={meal._id}>
                  <td>{new Date(meal.date).toLocaleDateString()}</td>
                  <td className={styles.memberCell}>
                    <div className={styles.memberAvatar}>
                      {getMemberName(meal.member_id).charAt(0).toUpperCase()}
                    </div>
                    {getMemberName(meal.member_id)}
                  </td>
                  <td className={styles.mealCount}>
                    <span className={styles.mealCountBadge}>
                      {meal.meal_count}
                    </span>
                  </td>
                  <td>{getMealTypeBadge(meal.meal_type)}</td>
                  <td>₹{meal.cost || meal.meal_count * 50}</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => handleEdit(meal)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Edit meal"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setMealToDelete(meal)
                        setShowDeleteConfirm(true)
                      }}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete meal"
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
                {editingMeal ? 'Edit Meal' : 'Add New Meal'}
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
                  <label className={styles.formLabel}>Member *</label>
                  <select
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                    className={`${styles.formInput} ${formErrors.member_id ? styles.error : ''}`}
                  >
                    <option value="">Select Member</option>
                    {members.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.member_id && (
                    <span className={styles.errorText}>{formErrors.member_id}</span>
                  )}
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
                  <label className={styles.formLabel}>Meal Count *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.meal_count}
                    onChange={(e) => setFormData({ ...formData, meal_count: parseInt(e.target.value) || 1 })}
                    className={`${styles.formInput} ${formErrors.meal_count ? styles.error : ''}`}
                  />
                  {formErrors.meal_count && (
                    <span className={styles.errorText}>{formErrors.meal_count}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Meal Type</label>
                  <select
                    value={formData.meal_type}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cost per Meal</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className={styles.formInput}
                  />
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
                    <>{editingMeal ? 'Update' : 'Add'} Meal</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && mealToDelete && (
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
              <p>Delete meal record for <strong>{getMemberName(mealToDelete.member_id)}</strong>?</p>
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

export default Meals