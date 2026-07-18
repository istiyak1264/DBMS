import React, { useState, useEffect } from 'react'
import { 
  FaChartBar, 
  FaChartPie, 
  FaChartLine,
  FaDownload,
  FaPrint,
  FaCalendarAlt,
  FaSpinner,
  FaUsers,
  FaUtensils,
  FaDollarSign,
  FaFileInvoice,
  FaArrowUp,
  FaArrowDown,
  FaFilter
} from 'react-icons/fa'
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2'
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
import toast from 'react-hot-toast'
import api from '../services/api'
import styles from './Reports.module.css'

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

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = useState('overview')
  const [mealData, setMealData] = useState([])
  const [expenseData, setExpenseData] = useState([])
  const [members, setMembers] = useState([])
  const [summary, setSummary] = useState({
    totalMeals: 0,
    totalExpenses: 0,
    totalMembers: 0,
    revenue: 0,
    profit: 0,
    averageMealCost: 0
  })
  const [trends, setTrends] = useState({
    meals: { data: [], labels: [] },
    expenses: { data: [], labels: [] },
    categories: { labels: [], data: [] }
  })

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const [mealRes, expenseRes, memberRes] = await Promise.all([
        api.get(`/api/meals/summary?start_date=${dateRange.start}&end_date=${dateRange.end}`),
        api.get(`/api/expenses/summary?start_date=${dateRange.start}&end_date=${dateRange.end}`),
        api.get('/api/users/members')
      ])

      setMealData(mealRes.data || [])
      setExpenseData(expenseRes.data?.summary || [])
      setMembers(memberRes.data || [])

      // Calculate summary
      const totalMeals = mealRes.data.reduce((sum, m) => sum + m.total_meals, 0)
      const totalExpenses = expenseRes.data?.total || 0
      const totalMembers = memberRes.data.length
      const revenue = totalMeals * 50
      const profit = revenue - totalExpenses

      setSummary({
        totalMeals,
        totalExpenses,
        totalMembers,
        revenue,
        profit,
        averageMealCost: totalMeals > 0 ? totalExpenses / totalMeals : 0
      })

      // Prepare trends
      const mealTrends = mealRes.data.map(m => ({
        label: m.member?.name || 'Unknown',
        meals: m.total_meals,
        cost: m.total_cost || 0
      }))

      const expenseTrends = expenseRes.data?.summary || []
      const categoryLabels = expenseTrends.map(e => e._id)
      const categoryData = expenseTrends.map(e => e.total_amount)

      setTrends({
        meals: {
          data: mealTrends.map(m => m.meals),
          labels: mealTrends.map(m => m.label)
        },
        expenses: {
          data: mealTrends.map(m => m.cost),
          labels: mealTrends.map(m => m.label)
        },
        categories: {
          labels: categoryLabels,
          data: categoryData
        }
      })

    } catch (error) {
      toast.error('Failed to fetch report data')
      console.error('Report error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    })
  }

  const exportReport = () => {
    const reportData = {
      dateRange,
      summary,
      mealData,
      expenseData,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${dateRange.start}_to_${dateRange.end}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Report exported successfully')
  }

  const printReport = () => {
    window.print()
  }

  const mealChartData = {
    labels: trends.meals.labels,
    datasets: [
      {
        label: 'Meals',
        data: trends.meals.data,
        backgroundColor: 'rgba(102, 126, 234, 0.5)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  }

  const expenseChartData = {
    labels: trends.meals.labels,
    datasets: [
      {
        label: 'Cost',
        data: trends.expenses.data,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 4
      }
    ]
  }

  const categoryChartData = {
    labels: trends.categories.labels.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    datasets: [
      {
        data: trends.categories.data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Generating reports...</p>
      </div>
    )
  }

  return (
    <div className={styles.reportsContainer}>
      <div className={styles.reportsHeader}>
        <div>
          <h1 className={styles.reportsTitle}>Reports</h1>
          <p className={styles.reportsSubtitle}>
            Comprehensive analytics and insights
          </p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={exportReport} className={`${styles.actionBtn} ${styles.exportBtn}`}>
            <FaDownload /> Export
          </button>
          <button onClick={printReport} className={`${styles.actionBtn} ${styles.printBtn}`}>
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className={styles.dateRangeCard}>
        <div className={styles.dateRangeContent}>
          <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>Start Date</label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>End Date</label>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              className={styles.dateInput}
            />
          </div>
          <button onClick={fetchReportData} className={styles.generateBtn}>
            <FaCalendarAlt /> Generate Report
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${reportType === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setReportType('overview')}
        >
          <FaChartBar /> Overview
        </button>
        <button
          className={`${styles.tab} ${reportType === 'meals' ? styles.activeTab : ''}`}
          onClick={() => setReportType('meals')}
        >
          <FaUtensils /> Meals
        </button>
        <button
          className={`${styles.tab} ${reportType === 'expenses' ? styles.activeTab : ''}`}
          onClick={() => setReportType('expenses')}
        >
          <FaDollarSign /> Expenses
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
          <div className={styles.summaryIcon}>
            <FaUsers />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>{summary.totalMembers}</span>
            <span className={styles.summaryLabel}>Total Members</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
          <div className={styles.summaryIcon}>
            <FaUtensils />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>{summary.totalMeals}</span>
            <span className={styles.summaryLabel}>Total Meals</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
          <div className={styles.summaryIcon}>
            <FaDollarSign />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>₹{summary.totalExpenses.toFixed(2)}</span>
            <span className={styles.summaryLabel}>Total Expenses</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPurple}`}>
          <div className={styles.summaryIcon}>
            <FaFileInvoice />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryValue}>₹{summary.revenue.toFixed(2)}</span>
            <span className={styles.summaryLabel}>Revenue</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Meals by Member</h3>
            <span className={styles.chartSubtitle}>Bar Chart</span>
          </div>
          <div className={styles.chartContainer}>
            <Bar
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
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Cost by Member</h3>
            <span className={styles.chartSubtitle}>Bar Chart</span>
          </div>
          <div className={styles.chartContainer}>
            <Bar
              data={expenseChartData}
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
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      {trends.categories.labels.length > 0 && (
        <div className={styles.categoryCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Expense Distribution by Category</h3>
            <span className={styles.chartSubtitle}>Doughnut Chart</span>
          </div>
          <div className={styles.categoryChartContainer}>
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
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
          </div>
        </div>
      )}

      {/* Detailed Data Table */}
      <div className={styles.detailsCard}>
        <div className={styles.detailsHeader}>
          <h3 className={styles.detailsTitle}>Detailed Report</h3>
          <span className={styles.detailsCount}>
            {mealData.length} members
          </span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.detailsTable}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Meals</th>
                <th>Cost</th>
                <th>Average per Meal</th>
              </tr>
            </thead>
            <tbody>
              {mealData.length === 0 ? (
                <tr>
                  <td colSpan="4" className={styles.emptyState}>
                    <p>No data available for this period</p>
                  </td>
                </tr>
              ) : (
                mealData.map((item, index) => (
                  <tr key={index}>
                    <td className={styles.memberCell}>
                      <div className={styles.memberAvatar}>
                        {item.member?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {item.member?.name || 'Unknown'}
                    </td>
                    <td>{item.total_meals}</td>
                    <td className={styles.costCell}>₹{item.total_cost?.toFixed(2) || '0.00'}</td>
                    <td>
                      ₹{(item.total_cost / item.total_meals || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports