import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FaSpinner } from 'react-icons/fa'

// Components
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Members = lazy(() => import('./pages/Members'))
const Meals = lazy(() => import('./pages/Meals'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Reports = lazy(() => import('./pages/Reports'))

// Loading component
const LoadingFallback = () => (
  <div className="loading-fallback">
    <FaSpinner className="loading-spinner" />
    <p>Loading...</p>
  </div>
)

// Private Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  // Check if token is expired (optional)
  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]))
    if (tokenData.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return <Navigate to="/login" replace />
    }
  } catch (error) {
    // Invalid token
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Main App Component
const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Handle sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + B to toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && isMobile && isSidebarOpen) {
        toggleSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, isSidebarOpen])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <Router>
      <div className="app">
        {/* Toaster for notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              style: {
                borderColor: '#10b981',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                borderColor: '#ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="app-layout">
                    <Sidebar 
                      isOpen={isSidebarOpen} 
                      toggleSidebar={toggleSidebar}
                      onClose={closeSidebar}
                    />
                    <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                      <Navbar 
                        toggleSidebar={toggleSidebar} 
                        isSidebarOpen={isSidebarOpen}
                      />
                      <div className="page-content">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/members" element={<Members />} />
                          <Route path="/meals" element={<Meals />} />
                          <Route path="/expenses" element={<Expenses />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </div>
                      <Footer />
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App