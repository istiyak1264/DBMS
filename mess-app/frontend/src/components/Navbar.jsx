import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  FaUser, 
  FaSignOutAlt, 
  FaBell, 
  FaCog, 
  FaBars,
  FaTimes,
  FaUserCircle,
  FaChevronDown,
  FaHome,
  FaUsers,
  FaUtensils,
  FaDollarSign,
  FaChartBar
} from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'
import toast from 'react-hot-toast'
import styles from './Navbar.module.css'

const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    // Load notifications (you can fetch from API)
    setNotifications([
      { id: 1, message: 'Welcome to Mess Management System', type: 'info', read: false },
      { id: 2, message: 'New member joined today', type: 'success', read: false },
    ])

    // Click outside handler
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getPageTitle = () => {
    const path = location.pathname
    const titles = {
      '/': 'Dashboard',
      '/members': 'Members',
      '/meals': 'Meals',
      '/expenses': 'Expenses',
      '/reports': 'Reports',
    }
    return titles[path] || 'Mess Management'
  }

  const getPageIcon = () => {
    const path = location.pathname
    const icons = {
      '/': <MdDashboard className={styles.pageIcon} />,
      '/members': <FaUsers className={styles.pageIcon} />,
      '/meals': <FaUtensils className={styles.pageIcon} />,
      '/expenses': <FaDollarSign className={styles.pageIcon} />,
      '/reports': <FaChartBar className={styles.pageIcon} />,
    }
    return icons[path] || <FaHome className={styles.pageIcon} />
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        {/* Left Section */}
        <div className={styles.navbarLeft}>
          <button 
            className={styles.menuToggle}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <FaUtensils />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>Mess Manager</span>
              <span className={styles.brandSub}>Management System</span>
            </div>
          </div>

          <div className={styles.pageInfo}>
            <div className={styles.pageIconWrapper}>
              {getPageIcon()}
            </div>
            <span className={styles.pageTitle}>{getPageTitle()}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles.navbarRight}>
          {/* Search Bar (Optional) */}
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Search..." 
              className={styles.searchInput}
            />
            <button className={styles.searchButton}>
              <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Notifications */}
          <div className={styles.notificationWrapper} ref={notificationRef}>
            <button 
              className={styles.notificationButton}
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <FaBell className={styles.notificationIcon} />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationDropdown}>
                <div className={styles.notificationHeader}>
                  <span className={styles.notificationTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      className={styles.markAllRead}
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyNotification}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className={styles.notificationContent}>
                          <span className={styles.notificationMessage}>
                            {notification.message}
                          </span>
                          <span className={styles.notificationType}>
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className={styles.userWrapper} ref={dropdownRef}>
            <button 
              className={styles.userButton}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="User menu"
            >
              <div className={styles.userAvatar}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className={styles.avatarImage} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {getInitials(user?.name)}
                  </div>
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name || 'User'}</span>
                <span className={styles.userRole}>{user?.role || 'Member'}</span>
              </div>
              <FaChevronDown className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.open : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownAvatar}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className={styles.dropdownAvatarImage} />
                    ) : (
                      <div className={styles.dropdownAvatarPlaceholder}>
                        {getInitials(user?.name)}
                      </div>
                    )}
                  </div>
                  <div className={styles.dropdownUserInfo}>
                    <span className={styles.dropdownUserName}>{user?.name || 'User'}</span>
                    <span className={styles.dropdownUserEmail}>{user?.email || 'user@example.com'}</span>
                  </div>
                </div>

                <div className={styles.dropdownDivider}></div>

                <div className={styles.dropdownMenu}>
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setIsDropdownOpen(false)
                      navigate('/profile')
                    }}
                  >
                    <FaUserCircle className={styles.dropdownItemIcon} />
                    <span>My Profile</span>
                  </button>
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setIsDropdownOpen(false)
                      navigate('/settings')
                    }}
                  >
                    <FaCog className={styles.dropdownItemIcon} />
                    <span>Settings</span>
                  </button>
                </div>

                <div className={styles.dropdownDivider}></div>

                <button 
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className={styles.dropdownItemIcon} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar