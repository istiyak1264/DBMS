import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  FaHome, 
  FaUsers, 
  FaUtensils, 
  FaDollarSign, 
  FaChartBar,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUser,
  FaChevronRight,
  FaChevronLeft,
  FaFileAlt,
  FaCalendarAlt,
  FaClipboardList,
  FaExclamationTriangle
} from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'
import { IoMdSettings } from 'react-icons/io'
import styles from './Sidebar.module.css'

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: MdDashboard,
      exact: true
    },
    {
      path: '/members',
      label: 'Members',
      icon: FaUsers
    },
    {
      path: '/meals',
      label: 'Meals',
      icon: FaUtensils
    },
    {
      path: '/expenses',
      label: 'Expenses',
      icon: FaDollarSign
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: FaChartBar
    }
  ]

  const bottomItems = [
    {
      path: '/settings',
      label: 'Settings',
      icon: IoMdSettings
    },
    {
      path: '/help',
      label: 'Help',
      icon: FaQuestionCircle
    }
  ]

  const toggleExpand = (path) => {
    setExpandedItems(prev =>
      prev.includes(path)
        ? prev.filter(item => item !== path)
        : [...prev, path]
    )
  }

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
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

  return (
    <>
      <div className={`${styles.sidebarOverlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={toggleSidebar} />
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <FaUtensils />
            </div>
            <div className={`${styles.logoText} ${!isOpen ? styles.logoHidden : ''}`}>
              <span className={styles.logoName}>Mess Manager</span>
              <span className={styles.logoSub}>Management System</span>
            </div>
          </div>
          <button 
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        <div className={styles.sidebarContent}>
          <nav className={styles.navMenu}>
            <div className={styles.navSection}>
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`${styles.navItem} ${isActive(item.path, item.exact) ? styles.active : ''}`}
                  title={!isOpen ? item.label : ''}
                >
                  <item.icon className={styles.navIcon} />
                  <span className={`${styles.navLabel} ${!isOpen ? styles.navLabelHidden : ''}`}>
                    {item.label}
                  </span>
                  {isActive(item.path, item.exact) && (
                    <div className={styles.activeIndicator} />
                  )}
                </NavLink>
              ))}
            </div>

            <div className={styles.navDivider}></div>

            <div className={styles.navSection}>
              {bottomItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  title={!isOpen ? item.label : ''}
                >
                  <item.icon className={styles.navIcon} />
                  <span className={`${styles.navLabel} ${!isOpen ? styles.navLabelHidden : ''}`}>
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.userAvatarImage} />
              ) : (
                <div className={styles.userAvatarPlaceholder}>
                  {getInitials(user?.name)}
                </div>
              )}
            </div>
            <div className={`${styles.userInfo} ${!isOpen ? styles.userInfoHidden : ''}`}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userRole}>{user?.role || 'Member'}</span>
            </div>
          </div>
          
          <button 
            className={`${styles.logoutButton} ${!isOpen ? styles.logoutButtonCollapsed : ''}`}
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            title={!isOpen ? 'Logout' : ''}
          >
            <FaSignOutAlt className={styles.logoutIcon} />
            <span className={`${styles.logoutLabel} ${!isOpen ? styles.navLabelHidden : ''}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar