import React, { useState, useEffect } from 'react'
import { 
  FaUsers, 
  FaUserPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaUserCheck,
  FaUserTimes,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaExclamationCircle
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../services/api'
import styles from './Members.module.css'

const Members = () => {
  const [members, setMembers] = useState([])
  const [filteredMembers, setFilteredMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    phone: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    filterAndSortMembers()
  }, [members, searchTerm, filterRole, sortField, sortDirection])

  const fetchMembers = async () => {
    try {
      const response = await api.get('/api/users/members')
      setMembers(response.data)
      setFilteredMembers(response.data)
    } catch (error) {
      toast.error('Failed to fetch members')
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMembers = () => {
    let result = [...members]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(member => 
        member.name.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term)
      )
    }

    // Apply role filter
    if (filterRole !== 'all') {
      result = result.filter(member => member.role === filterRole)
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

    setFilteredMembers(result)
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
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!editingMember && !formData.password) {
      errors.password = 'Password is required'
    } else if (!editingMember && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
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
      if (editingMember) {
        // Update member
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await api.put(`/api/users/members/${editingMember._id}`, updateData)
        toast.success('Member updated successfully')
      } else {
        // Create member
        await api.post('/api/auth/register', formData)
        toast.success('Member added successfully')
      }
      
      setShowModal(false)
      setEditingMember(null)
      resetForm()
      fetchMembers()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Operation failed'
      toast.error(errorMessage)
      if (error.response?.status === 409) {
        setFormErrors({ email: 'Email already registered' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!memberToDelete) return
    
    try {
      await api.delete(`/api/users/members/${memberToDelete._id}`)
      toast.success('Member deleted successfully')
      setShowDeleteConfirm(false)
      setMemberToDelete(null)
      fetchMembers()
    } catch (error) {
      toast.error('Failed to delete member')
      console.error('Delete error:', error)
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role || 'member',
      phone: member.phone || '',
      address: member.address || '',
      joinDate: member.joinDate || new Date().toISOString().split('T')[0],
      status: member.status || 'active'
    })
    setFormErrors({})
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'member',
      phone: '',
      address: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active'
    })
    setFormErrors({})
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMembers(filteredMembers.map(m => m._id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <span className={`${styles.badge} ${styles.badgeActive}`}><FaUserCheck /> Active</span>
    } else {
      return <span className={`${styles.badge} ${styles.badgeInactive}`}><FaUserTimes /> Inactive</span>
    }
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>
    } else {
      return <span className={`${styles.badge} ${styles.badgeMember}`}>Member</span>
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
  }

  if (loading && members.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading members...</p>
      </div>
    )
  }

  return (
    <div className={styles.membersContainer}>
      <div className={styles.membersHeader}>
        <div>
          <h1 className={styles.membersTitle}>Members</h1>
          <p className={styles.membersSubtitle}>
            Manage all members of your mess
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMember(null)
            resetForm()
            setShowModal(true)
          }}
          className={styles.addButton}
        >
          <FaUserPlus />
          Add Member
        </button>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>

        <div className={styles.statsInfo}>
          <span>{filteredMembers.length} members</span>
        </div>
      </div>

      {/* Members Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.membersTable}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('name')} className={styles.sortableHeader}>
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('email')} className={styles.sortableHeader}>
                Email {getSortIcon('email')}
              </th>
              <th onClick={() => handleSort('role')} className={styles.sortableHeader}>
                Role {getSortIcon('role')}
              </th>
              <th onClick={() => handleSort('status')} className={styles.sortableHeader}>
                Status {getSortIcon('status')}
              </th>
              <th onClick={() => handleSort('joinDate')} className={styles.sortableHeader}>
                Joined {getSortIcon('joinDate')}
              </th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  <FaUsers className={styles.emptyIcon} />
                  <p>No members found</p>
                  <span>Try adjusting your search or filter</span>
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member._id} className={selectedMembers.includes(member._id) ? styles.selectedRow : ''}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member._id)}
                      onChange={() => handleSelectMember(member._id)}
                    />
                  </td>
                  <td className={styles.memberName}>
                    <div className={styles.avatarWrapper}>
                      <div className={styles.avatar}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <span>{member.name}</span>
                  </td>
                  <td>{member.email}</td>
                  <td>{getRoleBadge(member.role)}</td>
                  <td>{getStatusBadge(member.status || 'active')}</td>
                  <td>{new Date(member.joinDate || member.created_at).toLocaleDateString()}</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => handleEdit(member)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Edit member"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setMemberToDelete(member)
                        setShowDeleteConfirm(true)
                      }}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete member"
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
                {editingMember ? 'Edit Member' : 'Add New Member'}
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
                  <label className={styles.formLabel}>Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`${styles.formInput} ${formErrors.name ? styles.error : ''}`}
                    placeholder="Enter full name"
                  />
                  {formErrors.name && (
                    <span className={styles.errorText}>{formErrors.name}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`${styles.formInput} ${formErrors.email ? styles.error : ''}`}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <span className={styles.errorText}>{formErrors.email}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {editingMember ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`${styles.formInput} ${formErrors.password ? styles.error : ''}`}
                    placeholder="Enter password"
                  />
                  {formErrors.password && (
                    <span className={styles.errorText}>{formErrors.password}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={styles.formInput}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Address (Optional)</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={styles.formInput}
                    placeholder="Enter address"
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
                    <>{editingMember ? 'Update' : 'Add'} Member</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && memberToDelete && (
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
              <p>Are you sure you want to delete <strong>{memberToDelete.name}</strong>?</p>
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
                <FaTrash /> Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Members