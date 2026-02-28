import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    HiOutlineUserGroup,
    HiOutlineCurrencyDollar,
    HiOutlineClipboardList,
    HiOutlineTrendingUp,
    HiOutlineClock,
    HiOutlineCheckCircle
} from 'react-icons/hi'

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalContacts: 0,
        activeDeals: 0,
        pipelineValue: 0,
        tasksDue: 0,
        wonDeals: 0,
        completedActivities: 0
    })
    const [recentActivities, setRecentActivities] = useState([])
    const [dealsByStage, setDealsByStage] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
                supabase.from('contacts').select('*'),
                supabase.from('deals').select('*'),
                supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(8)
            ])

            const contacts = contactsRes.data || []
            const deals = dealsRes.data || []
            const activities = activitiesRes.data || []

            const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage))
            const wonDeals = deals.filter(d => d.stage === 'won')
            const pipelineValue = activeDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
            const now = new Date()
            const tasksDue = activities.filter(a => a.type === 'task' && !a.completed && new Date(a.due_date) <= now).length
            const completedActivities = activities.filter(a => a.completed).length

            const stages = {}
            deals.forEach(d => {
                stages[d.stage] = (stages[d.stage] || 0) + 1
            })

            setStats({
                totalContacts: contacts.length,
                activeDeals: activeDeals.length,
                pipelineValue,
                tasksDue,
                wonDeals: wonDeals.length,
                completedActivities
            })
            setDealsByStage(stages)
            setRecentActivities(activities.slice(0, 5))
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }

    const kpiCards = [
        { label: 'Total Contacts', value: stats.totalContacts, icon: HiOutlineUserGroup, color: '#7c3aed' },
        { label: 'Active Deals', value: stats.activeDeals, icon: HiOutlineCurrencyDollar, color: '#06b6d4' },
        { label: 'Pipeline Value', value: `$${stats.pipelineValue.toLocaleString()}`, icon: HiOutlineTrendingUp, color: '#10b981' },
        { label: 'Tasks Overdue', value: stats.tasksDue, icon: HiOutlineClock, color: '#f59e0b' },
        { label: 'Deals Won', value: stats.wonDeals, icon: HiOutlineCheckCircle, color: '#22c55e' },
        { label: 'Done Activities', value: stats.completedActivities, icon: HiOutlineClipboardList, color: '#ec4899' },
    ]

    const stageLabels = {
        lead: 'Lead',
        qualified: 'Qualified',
        proposal: 'Proposal',
        negotiation: 'Negotiation',
        won: 'Won',
        lost: 'Lost'
    }

    const stageColors = {
        lead: '#94a3b8',
        qualified: '#06b6d4',
        proposal: '#7c3aed',
        negotiation: '#f59e0b',
        won: '#22c55e',
        lost: '#ef4444'
    }

    const getActivityIcon = (type) => {
        switch (type) {
            case 'call': return '📞'
            case 'email': return '📧'
            case 'meeting': return '🤝'
            case 'task': return '✅'
            case 'note': return '📝'
            default: return '📋'
        }
    }

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loading-spinner" />
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's your CRM overview.</p>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                {kpiCards.map((card, i) => (
                    <div key={i} className="kpi-card" style={{ '--accent': card.color }}>
                        <div className="kpi-icon-wrap">
                            <card.icon size={24} />
                        </div>
                        <div className="kpi-info">
                            <span className="kpi-value">{card.value}</span>
                            <span className="kpi-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                {/* Pipeline Overview */}
                <div className="card pipeline-card">
                    <h3 className="card-title">Pipeline Overview</h3>
                    <div className="pipeline-bars">
                        {Object.entries(stageLabels).map(([stage, label]) => {
                            const count = dealsByStage[stage] || 0
                            const total = Object.values(dealsByStage).reduce((s, v) => s + v, 0) || 1
                            const pct = (count / total) * 100
                            return (
                                <div key={stage} className="pipeline-bar-row">
                                    <div className="pipeline-bar-label">
                                        <span className="stage-dot" style={{ background: stageColors[stage] }} />
                                        <span>{label}</span>
                                    </div>
                                    <div className="pipeline-bar-track">
                                        <div
                                            className="pipeline-bar-fill"
                                            style={{ width: `${pct}%`, background: stageColors[stage] }}
                                        />
                                    </div>
                                    <span className="pipeline-bar-count">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card activity-card">
                    <h3 className="card-title">Recent Activity</h3>
                    {recentActivities.length === 0 ? (
                        <div className="empty-state-sm">
                            <p>No recent activities</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {recentActivities.map(activity => (
                                <div key={activity.id} className="activity-item">
                                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                                    <div className="activity-details">
                                        <span className="activity-title">{activity.title}</span>
                                        <span className="activity-meta">
                                            {activity.type} • {new Date(activity.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
