import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineFilter,
    HiOutlineCheck,
    HiOutlineClipboardList
} from 'react-icons/hi'

const TYPES = [
    { id: 'all', label: 'All' },
    { id: 'task', label: '✅ Task' },
    { id: 'call', label: '📞 Call' },
    { id: 'email', label: '📧 Email' },
    { id: 'meeting', label: '🤝 Meeting' },
    { id: 'note', label: '📝 Note' },
]

const emptyActivity = {
    title: '',
    type: 'task',
    description: '',
    due_date: '',
    completed: false,
    contact_name: '',
    deal_name: ''
}

export default function Activities() {
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [showCompleted, setShowCompleted] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ ...emptyActivity })

    useEffect(() => {
        fetchActivities()
    }, [])

    async function fetchActivities() {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .order('due_date', { ascending: true })
            if (error) throw error
            setActivities(data || [])
        } catch (err) {
            console.error('Error fetching activities:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            if (editing) {
                const { error } = await supabase.from('activities').update(form).eq('id', editing.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('activities').insert([form])
                if (error) throw error
            }
            setModalOpen(false)
            setEditing(null)
            setForm({ ...emptyActivity })
            fetchActivities()
        } catch (err) {
            console.error('Error saving activity:', err)
            alert('Error saving activity: ' + err.message)
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this activity?')) return
        try {
            const { error } = await supabase.from('activities').delete().eq('id', id)
            if (error) throw error
            fetchActivities()
        } catch (err) {
            console.error('Error deleting activity:', err)
        }
    }

    async function toggleComplete(activity) {
        try {
            const { error } = await supabase
                .from('activities')
                .update({ completed: !activity.completed })
                .eq('id', activity.id)
            if (error) throw error
            setActivities(prev =>
                prev.map(a => a.id === activity.id ? { ...a, completed: !a.completed } : a)
            )
        } catch (err) {
            console.error('Error toggling activity:', err)
        }
    }

    function openEdit(activity) {
        setEditing(activity)
        setForm({
            title: activity.title || '',
            type: activity.type || 'task',
            description: activity.description || '',
            due_date: activity.due_date || '',
            completed: activity.completed || false,
            contact_name: activity.contact_name || '',
            deal_name: activity.deal_name || ''
        })
        setModalOpen(true)
    }

    function openNew() {
        setEditing(null)
        setForm({ ...emptyActivity })
        setModalOpen(true)
    }

    const now = new Date()
    const filtered = activities
        .filter(a => filter === 'all' || a.type === filter)
        .filter(a => showCompleted || !a.completed)

    const isOverdue = (a) => !a.completed && a.due_date && new Date(a.due_date) < now

    const typeEmoji = {
        task: '✅',
        call: '📞',
        email: '📧',
        meeting: '🤝',
        note: '📝'
    }

    if (loading) {
        return <div className="page-loader"><div className="loading-spinner" /></div>
    }

    return (
        <div className="activities-page">
            <div className="page-header">
                <div>
                    <h1>Activities</h1>
                    <p className="page-subtitle">{activities.length} total activities</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <HiOutlinePlus size={18} /> Add Activity
                </button>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="filter-tabs">
                    {TYPES.map(t => (
                        <button
                            key={t.id}
                            className={`filter-tab ${filter === t.id ? 'active' : ''}`}
                            onClick={() => setFilter(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={showCompleted}
                        onChange={e => setShowCompleted(e.target.checked)}
                    />
                    <span>Show completed</span>
                </label>
            </div>

            {/* Activities List */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <HiOutlineClipboardList size={48} />
                    <h3>No activities found</h3>
                    <p>Add tasks, calls, meetings, and more to stay organized</p>
                    <button className="btn btn-primary" onClick={openNew}>
                        <HiOutlinePlus size={18} /> Add Activity
                    </button>
                </div>
            ) : (
                <div className="activities-list">
                    {filtered.map(activity => (
                        <div
                            key={activity.id}
                            className={`activity-card ${activity.completed ? 'completed' : ''} ${isOverdue(activity) ? 'overdue' : ''}`}
                        >
                            <button
                                className={`check-btn ${activity.completed ? 'checked' : ''}`}
                                onClick={() => toggleComplete(activity)}
                            >
                                {activity.completed && <HiOutlineCheck size={14} />}
                            </button>

                            <div className="activity-card-body">
                                <div className="activity-card-top">
                                    <span className="activity-type-badge">{typeEmoji[activity.type] || '📋'} {activity.type}</span>
                                    {isOverdue(activity) && <span className="overdue-badge">Overdue</span>}
                                </div>
                                <h4 className="activity-card-title">{activity.title}</h4>
                                {activity.description && (
                                    <p className="activity-card-desc">{activity.description}</p>
                                )}
                                <div className="activity-card-meta">
                                    {activity.due_date && (
                                        <span>Due: {new Date(activity.due_date).toLocaleDateString()}</span>
                                    )}
                                    {activity.contact_name && <span>Contact: {activity.contact_name}</span>}
                                    {activity.deal_name && <span>Deal: {activity.deal_name}</span>}
                                </div>
                            </div>

                            <div className="action-btns">
                                <button className="icon-btn" onClick={() => openEdit(activity)} title="Edit">
                                    <HiOutlinePencil size={16} />
                                </button>
                                <button className="icon-btn danger" onClick={() => handleDelete(activity.id)} title="Delete">
                                    <HiOutlineTrash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null) }}
                title={editing ? 'Edit Activity' : 'New Activity'}
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                            placeholder="Follow up with client"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                            >
                                <option value="task">Task</option>
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="meeting">Meeting</option>
                                <option value="note">Note</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={form.due_date}
                                onChange={e => setForm({ ...form, due_date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Name</label>
                            <input
                                type="text"
                                value={form.contact_name}
                                onChange={e => setForm({ ...form, contact_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label>Deal Name</label>
                            <input
                                type="text"
                                value={form.deal_name}
                                onChange={e => setForm({ ...form, deal_name: e.target.value })}
                                placeholder="Enterprise Deal"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Details..."
                            rows={3}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => { setModalOpen(false); setEditing(null) }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editing ? 'Update Activity' : 'Create Activity'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
