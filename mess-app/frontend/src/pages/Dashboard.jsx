import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FaUsers, 
  FaUtensils, 
  FaDollarSign, 
  FaTrendingUp,
  FaUserPlus,
  FaCalendarAlt,
  FaFileInvoice,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa'
import { MdDashboard, MdRestaurant, MdMoneyOff } from 'react-icons/md'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import api from '../services/api'
import toast from 'react-hot-toast'
import styles from './Dashboard.module.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalMeals: 0,
    totalExpenses: 0,
    monthlyRevenue: 0,
    activeMembers: 0,
    mealsToday: 0,
    weeklyMeals: 0,
    averageMealsPerMember: 0
  })
  const [mealChartData, setMealChartData] = useState(null)
  const [expenseChartData, setExpenseChartData] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [trends, setTrends] = useState({
    members: { value: 0, isUp: true },
    meals: { value: 0, isUp: true },
    expenses: { value: 0, isUp: false }
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [membersRes, mealsRes, expensesRes] = await Promise.all([
        api.get('/api/users/members'),
        api.get('/api/meals'),
        api.get('/api/expenses')
      ])

      const members = membersRes.data || []
      const meals = mealsRes.data || []
      const expenses = expensesRes.data || []

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]

      const totalMeals = meals.reduce((sum, meal) => sum + meal.meal_count, 0)
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const mealsToday = meals.filter(m => m.date === today).reduce((sum, m) => sum + m.meal_count, 0)
      const weeklyMeals = meals.filter(m => m.date >= weekAgoStr).reduce((sum, m) => sum + m.meal_count, 0)
      
      const uniqueMembers = new Set(meals.map(m => m.member_id))
      
      // Calculate trends (compare with last week)
      const lastWeekStart = new Date()
      lastWeekStart.setDate(lastWeekStart.getDate() - 14)
      const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
      
      const lastWeekMeals = meals.filter(m => 
        m.date >= lastWeekStartStr && m.date < weekAgoStr
      ).reduce((sum, m) => sum + m.meal_count, 0)
      
      const mealTrend = lastWeekMeals > 0 
        ? ((weeklyMeals - lastWeekMeals) / lastWeekMeals * 100)
        : 0

      setStats({
        totalMembers: members.length,
        totalMeals: totalMeals,
        totalExpenses: totalExpenses,
        monthlyRevenue: totalMeals * 50,
        activeMembers: uniqueMembers.size,
        mealsToday: mealsToday,
        weeklyMeals: weeklyMeals,
        averageMealsPerMember: members.length > 0 ? (totalMeals / members.length) : 0
      })

      setTrends({
        members: {
          value: 5, // Mock trend
          isUp: true
        },
        meals: {
          value: Math.abs(Math.round(mealTrend)),
          isUp: mealTrend >= 0
        },
        expenses: {
          value: 8,
          isUp: false
        }
      })

      // Prepare meal chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const mealCounts = last7Days.map(date => {
        return meals
          .filter(meal => meal.date === date)
          .reduce((sum, meal) => sum + meal.meal_count, 0)
      })

      setMealChartData({
        labels: last7Days.map(d => {
          const date = new Date(d)
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        }),
        datasets: [
          {
            label: 'Daily Meals',
            data: mealCounts,
            borderColor: 'rgb(102, 126, 234)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(102, 126, 234)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      })

      // Prepare expense chart data
      const expenseCategories = {}
      expenses.forEach(expense => {
        expenseCategories[expense.category] = 
          (expenseCategories[expense.category] || 0) + expense.amount
      })

      const colors = {
        food: '#FF6384',
        utilities: '#36A2EB',
        maintenance: '#FFCE56',
        other: '#4BC0C0'
      }

      setExpenseChartData({
        labels: Object.keys(expenseCategories).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [
          {
            data: Object.values(expenseCategories),
            backgroundColor: Object.keys(expenseCategories).map(c => colors[c] || '#9966FF'),
            borderColor: '#fff',
            borderWidth: 2,
          }
        ]
      })

      // Mock recent activities
      setRecentActivities([
        { id: 1, type: 'member', message: 'John Doe joined the mess', time: '2 hours ago', icon: 'user' },
        { id: 2, type: 'meal', message: 'Lunch served to 25 members', time: '4 hours ago', icon: 'meal' },
        { id: 3, type: 'expense', message: '₹5,000 spent on groceries', time: '6 hours ago', icon: 'expense' },
        { id: 4, type: 'member', message: 'Sarah left the mess', time: '1 day ago', icon: 'user' },
      ])

    } catch (error) {
      toast.error('Failed to fetch dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch(type) {
      case 'member': return <FaUserPlus className={styles.activityIconBlue} />
      case 'meal': return <FaUtensils className={styles.activityIconGreen} />
      case 'expense': return <FaDollarSign className={styles.activityIconRed} />
      default: return <FaFileInvoice className={styles.activityIconPurple} />
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>Dashboard</h1>
          <p className={styles.dashboardSubtitle}>Welcome back! Here's what's happening with your mess today.</p>
        </div>
        <div className={styles.dashboardActions}>
          <button 
            className={styles.actionBtn}
            onClick={() => navigate('/meals')}
          >
            <FaCalendarAlt /> Log Meals
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={() => navigate('/expenses')}
          >
            <MdMoneyOff /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIconWrapper}>
              <FaUsers />
            </div>
            <div className={styles.statTrend}>
              <span className={trends.members.isUp ? styles.trendUp : styles.trendDown}>
                {trends.members.isUp ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(trends.members.value)}%
              </span>
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.totalMembers}</span>
            <span className={styles.statLabel}>Total Members</span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubText}>{stats.activeMembers} active this week</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIconWrapper}>
              <FaUtensils />
            </div>
            <div className={styles.statTrend}>
              <span className={trends.meals.isUp ? styles.trendUp : styles.trendDown}>
                {trends.meals.isUp ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(trends.meals.value)}%
              </span>
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{stats.totalMeals}</span>
            <span className={styles.statLabel}>Total Meals</span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubText}>{stats.mealsToday} meals today</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardRed}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIconWrapper}>
              <FaDollarSign />
            </div>
            <div className={styles.statTrend}>
              <span className={trends.expenses.isUp ? styles.trendUp : styles.trendDown}>
                {trends.expenses.isUp ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(trends.expenses.value)}%
              </span>
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>₹{stats.totalExpenses}</span>
            <span className={styles.statLabel}>Total Expenses</span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubText}>Last 7 days</span>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
          <div className={styles.statHeader}>
            <div className={styles.statIconWrapper}>
              <FaTrendingUp />
            </div>
            <div className={styles.statTrend}>
              <span className={styles.trendUp}>
                <FaArrowUp /> 12%
              </span>
            </div>
          </div>
          <div className={styles.statBody}>
            <span className={styles.statValue}>₹{stats.monthlyRevenue}</span>
            <span className={styles.statLabel}>Monthly Revenue</span>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubText}>Based on meal count</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Meal Trends</h3>
            <span className={styles.chartSubtitle}>Last 7 days</span>
          </div>
          <div className={styles.chartContainer}>
            {mealChartData && (
              <Line
                data={mealChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.4)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.4)',
                        font: {
                          size: 10
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Expense Distribution</h3>
            <span className={styles.chartSubtitle}>By category</span>
          </div>
          <div className={styles.chartContainer}>
            {expenseChartData && (
              <Doughnut
                data={expenseChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activityCard}>
        <div className={styles.activityHeader}>
          <h3 className={styles.activityTitle}>Recent Activity</h3>
          <button className={styles.viewAllBtn}>View All</button>
        </div>
        <div className={styles.activityList}>
          {recentActivities.map(activity => (
            <div key={activity.id} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityMessage}>{activity.message}</p>
                <span className={styles.activityTime}>{activity.time}</span>
              </div>
              <div className={styles.activityStatus}>
                <FaCheckCircle className={styles.statusIcon} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard