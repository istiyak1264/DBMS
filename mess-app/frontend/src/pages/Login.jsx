import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  FaUser, 
  FaLock, 
  FaEnvelope, 
  FaUserPlus, 
  FaSignInAlt,
  FaGoogle,
  FaGithub,
  FaFacebook,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaUtensils
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import api from '../services/api'
import styles from './Login.module.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member'
  })
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/')
    }
  }, [navigate])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required'
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const response = await api.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        })

        const { access_token, user } = response.data
        
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }

        toast.success('Welcome back! Login successful.')
        
        // Redirect to previous page or dashboard
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        // Register
        const response = await api.post('/api/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })

        toast.success('Account created successfully! Please login.')
        setIsLogin(true)
        setFormData({
          ...formData,
          name: '',
          password: '',
          confirmPassword: ''
        })
        setErrors({})
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'An error occurred'
      toast.error(errorMessage)
      
      // Handle specific errors
      if (error.response?.status === 409) {
        setErrors({ email: 'Email already registered' })
      } else if (error.response?.status === 401) {
        setErrors({ password: 'Invalid credentials' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login coming soon!`)
    // Implement social login here
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginWrapper}>
        {/* Left Panel - Branding */}
        <div className={styles.loginLeft}>
          <div className={styles.brandSection}>
            <div className={styles.brandIcon}>
              <FaUtensils />
            </div>
            <h1 className={styles.brandTitle}>Mess Manager</h1>
            <p className={styles.brandSubtitle}>
              Complete Mess Management Solution
            </p>
          </div>
          
          <div className={styles.featuresSection}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📊</div>
              <div>
                <h3>Smart Dashboard</h3>
                <p>Real-time insights and analytics</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>👥</div>
              <div>
                <h3>Member Management</h3>
                <p>Easy member tracking and management</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🍽️</div>
              <div>
                <h3>Meal Tracking</h3>
                <p>Efficient meal planning and records</p>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>💰</div>
              <div>
                <h3>Expense Management</h3>
                <p>Track and optimize expenses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className={styles.loginRight}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className={styles.formSubtitle}>
                {isLogin 
                  ? 'Sign in to continue to your dashboard' 
                  : 'Join us and start managing your mess'}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className={styles.socialButtons}>
              <button 
                className={styles.socialBtn}
                onClick={() => handleSocialLogin('Google')}
              >
                <FaGoogle className={styles.socialIcon} />
                <span className={styles.socialBtnText}>Google</span>
              </button>
              <button 
                className={styles.socialBtn}
                onClick={() => handleSocialLogin('GitHub')}
              >
                <FaGithub className={styles.socialIcon} />
                <span className={styles.socialBtnText}>GitHub</span>
              </button>
              <button 
                className={styles.socialBtn}
                onClick={() => handleSocialLogin('Facebook')}
              >
                <FaFacebook className={styles.socialIcon} />
                <span className={styles.socialBtnText}>Facebook</span>
              </button>
            </div>

            <div className={styles.divider}>
              <span className={styles.dividerLine}></span>
              <span className={styles.dividerText}>or continue with email</span>
              <span className={styles.dividerLine}></span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Name Field - Register only */}
              {!isLogin && (
                <div className={styles.formGroup}>
                  <div className={styles.inputWrapper}>
                    <FaUser className={styles.inputIcon} />
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.name && (
                    <span className={styles.errorText}>{errors.name}</span>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className={styles.formGroup}>
                <div className={styles.inputWrapper}>
                  <FaEnvelope className={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className={styles.formGroup}>
                <div className={styles.inputWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errorText}>{errors.password}</span>
                )}
              </div>

              {/* Confirm Password - Register only */}
              {!isLogin && (
                <div className={styles.formGroup}>
                  <div className={styles.inputWrapper}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className={styles.errorText}>{errors.confirmPassword}</span>
                  )}
                </div>
              )}

              {/* Role - Register only */}
              {!isLogin && (
                <div className={styles.formGroup}>
                  <div className={styles.inputWrapper}>
                    <FaUser className={styles.inputIcon} />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={styles.input}
                      disabled={loading}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password - Login only */}
              {isLogin && (
                <div className={styles.formOptions}>
                  <label className={styles.rememberMe}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Remember me</span>
                  </label>
                  <button 
                    type="button" 
                    className={styles.forgotPassword}
                    onClick={() => toast.info('Password reset coming soon!')}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className={styles.spinner} />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>

              {/* Toggle Login/Register */}
              <div className={styles.formFooter}>
                <p>
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setErrors({})
                      setFormData({
                        ...formData,
                        password: '',
                        confirmPassword: ''
                      })
                    }}
                    disabled={loading}
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login