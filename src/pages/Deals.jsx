import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCurrencyDollar } from 'react-icons/hi'

const STAGES = [
    { id: 'lead', label: 'Lead', color: '#94a3b8' },
    { id: 'qualified', label: 'Qualified', color: '#06b6d4' },
    { id: 'proposal', label: 'Proposal', color: '#7c3aed' },
    { id: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
    { id: 'won', label: 'Won', color: '#22c55e' },
    { id: 'lost', label: 'Lost', color: '#ef4444' },
]

const emptyDeal = {
    title: '',
    value: '',
    stage: 'lead',
    contact_name: '',
    expected_close: '',
    description: ''
}

export default function Deals() {
    const [deals, setDeals] = useState([])
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ ...emptyDeal })
    const dragItem = useRef(null)
    const dragOverStage = useRef(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const [dealsRes, contactsRes] = await Promise.all([
                supabase.from('deals').select('*').order('created_at', { ascending: false }),
                supabase.from('contacts').select('id, name')
            ])
            setDeals(dealsRes.data || [])
            setContacts(contactsRes.data || [])
        } catch (err) {
            console.error('Error fetching deals:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            const payload = {
                ...form,
                value: parseFloat(form.value) || 0
            }
            if (editing) {
                const { error } = await supabase.from('deals').update(payload).eq('id', editing.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('deals').insert([payload])
                if (error) throw error
            }
            setModalOpen(false)
            setEditing(null)
            setForm({ ...emptyDeal })
            fetchData()
        } catch (err) {
            console.error('Error saving deal:', err)
            alert('Error saving deal: ' + err.message)
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this deal?')) return
        try {
            const { error } = await supabase.from('deals').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (err) {
            console.error('Error deleting deal:', err)
        }
    }

    async function handleDrop(stageId) {
        if (!dragItem.current || dragItem.current.stage === stageId) {
            dragItem.current = null
            return
        }
        try {
            const { error } = await supabase
                .from('deals')
                .update({ stage: stageId })
                .eq('id', dragItem.current.id)
            if (error) throw error
            setDeals(prev =>
                prev.map(d => d.id === dragItem.current.id ? { ...d, stage: stageId } : d)
            )
        } catch (err) {
            console.error('Error updating deal stage:', err)
        }
        dragItem.current = null
        dragOverStage.current = null
    }

    function openEdit(deal) {
        setEditing(deal)
        setForm({
            title: deal.title || '',
            value: deal.value?.toString() || '',
            stage: deal.stage || 'lead',
            contact_name: deal.contact_name || '',
            expected_close: deal.expected_close || '',
            description: deal.description || ''
        })
        setModalOpen(true)
    }

    function openNew(stage = 'lead') {
        setEditing(null)
        setForm({ ...emptyDeal, stage })
        setModalOpen(true)
    }

    const getStageValue = (stageId) => {
        return deals
            .filter(d => d.stage === stageId)
            .reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
    }

    if (loading) {
        return <div className="page-loader"><div className="loading-spinner" /></div>
    }

    return (
        <div className="deals-page">
            <div className="page-header">
                <div>
                    <h1>Deals Pipeline</h1>
                    <p className="page-subtitle">{deals.length} deals in pipeline</p>
                </div>
                <button className="btn btn-primary" onClick={() => openNew()}>
                    <HiOutlinePlus size={18} /> Add Deal
                </button>
            </div>

            {/* Kanban Board */}
            <div className="kanban-board">
                {STAGES.map(stage => {
                    const stageDeals = deals.filter(d => d.stage === stage.id)
                    const stageValue = getStageValue(stage.id)

                    return (
                        <div
                            key={stage.id}
                            className="kanban-column"
                            onDragOver={e => { e.preventDefault(); dragOverStage.current = stage.id }}
                            onDrop={() => handleDrop(stage.id)}
                        >
                            <div className="kanban-column-header" style={{ '--col-color': stage.color }}>
                                <div className="kanban-col-title">
                                    <span className="stage-dot" style={{ background: stage.color }} />
                                    <span>{stage.label}</span>
                                    <span className="kanban-count">{stageDeals.length}</span>
                                </div>
                                <span className="kanban-value">${stageValue.toLocaleString()}</span>
                            </div>

                            <div className="kanban-cards">
                                {stageDeals.map(deal => (
                                    <div
                                        key={deal.id}
                                        className="kanban-card"
                                        draggable
                                        onDragStart={() => { dragItem.current = deal }}
                                        onDragEnd={() => { dragItem.current = null }}
                                    >
                                        <div className="kanban-card-header">
                                            <span className="kanban-card-title">{deal.title}</span>
                                            <div className="action-btns">
                                                <button className="icon-btn sm" onClick={() => openEdit(deal)} title="Edit">
                                                    <HiOutlinePencil size={14} />
                                                </button>
                                                <button className="icon-btn sm danger" onClick={() => handleDelete(deal.id)} title="Delete">
                                                    <HiOutlineTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="kanban-card-value">
                                            <HiOutlineCurrencyDollar size={14} />
                                            ${(parseFloat(deal.value) || 0).toLocaleString()}
                                        </div>
                                        {deal.contact_name && (
                                            <div className="kanban-card-contact">{deal.contact_name}</div>
                                        )}
                                        {deal.expected_close && (
                                            <div className="kanban-card-date">
                                                Close: {new Date(deal.expected_close).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button className="kanban-add-btn" onClick={() => openNew(stage.id)}>
                                    <HiOutlinePlus size={16} /> Add Deal
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null) }}
                title={editing ? 'Edit Deal' : 'New Deal'}
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            required
                            placeholder="Enterprise License Deal"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Value ($)</label>
                            <input
                                type="number"
                                value={form.value}
                                onChange={e => setForm({ ...form, value: e.target.value })}
                                placeholder="10000"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label>Stage</label>
                            <select
                                value={form.stage}
                                onChange={e => setForm({ ...form, stage: e.target.value })}
                            >
                                {STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
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
                            <label>Expected Close</label>
                            <input
                                type="date"
                                value={form.expected_close}
                                onChange={e => setForm({ ...form, expected_close: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Deal details..."
                            rows={3}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => { setModalOpen(false); setEditing(null) }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editing ? 'Update Deal' : 'Create Deal'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
