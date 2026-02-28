import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Modal from '../components/Modal'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineSearch,
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineOfficeBuilding,
    HiOutlineUserGroup
} from 'react-icons/hi'

const emptyContact = {
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    notes: ''
}

export default function Contacts() {
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ ...emptyContact })
    const [sortField, setSortField] = useState('name')
    const [sortDir, setSortDir] = useState('asc')

    useEffect(() => {
        fetchContacts()
    }, [])

    async function fetchContacts() {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setContacts(data || [])
        } catch (err) {
            console.error('Error fetching contacts:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            if (editing) {
                const { error } = await supabase
                    .from('contacts')
                    .update(form)
                    .eq('id', editing.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('contacts')
                    .insert([form])
                if (error) throw error
            }
            setModalOpen(false)
            setEditing(null)
            setForm({ ...emptyContact })
            fetchContacts()
        } catch (err) {
            console.error('Error saving contact:', err)
            alert('Error saving contact: ' + err.message)
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this contact?')) return
        try {
            const { error } = await supabase.from('contacts').delete().eq('id', id)
            if (error) throw error
            fetchContacts()
        } catch (err) {
            console.error('Error deleting contact:', err)
        }
    }

    function openEdit(contact) {
        setEditing(contact)
        setForm({
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            status: contact.status || 'active',
            notes: contact.notes || ''
        })
        setModalOpen(true)
    }

    function openNew() {
        setEditing(null)
        setForm({ ...emptyContact })
        setModalOpen(true)
    }

    const filtered = contacts
        .filter(c => {
            const q = search.toLowerCase()
            return (
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.company?.toLowerCase().includes(q)
            )
        })
        .sort((a, b) => {
            const aVal = (a[sortField] || '').toString().toLowerCase()
            const bVal = (b[sortField] || '').toString().toLowerCase()
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        })

    function toggleSort(field) {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const sortIndicator = (field) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

    const statusColors = {
        active: '#22c55e',
        inactive: '#94a3b8',
        lead: '#f59e0b',
        customer: '#7c3aed'
    }

    if (loading) {
        return <div className="page-loader"><div className="loading-spinner" /></div>
    }

    return (
        <div className="contacts-page">
            <div className="page-header">
                <div>
                    <h1>Contacts</h1>
                    <p className="page-subtitle">{contacts.length} total contacts</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}>
                    <HiOutlinePlus size={18} /> Add Contact
                </button>
            </div>

            {/* Search bar */}
            <div className="search-bar">
                <HiOutlineSearch size={18} />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Contacts Table */}
            {filtered.length === 0 ? (
                <div className="empty-state">
                    <HiOutlineUserGroup size={48} />
                    <h3>No contacts found</h3>
                    <p>{search ? 'Try a different search term' : 'Add your first contact to get started'}</p>
                    {!search && (
                        <button className="btn btn-primary" onClick={openNew}>
                            <HiOutlinePlus size={18} /> Add Contact
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th onClick={() => toggleSort('name')} className="sortable">
                                    Name{sortIndicator('name')}
                                </th>
                                <th onClick={() => toggleSort('email')} className="sortable">
                                    Email{sortIndicator('email')}
                                </th>
                                <th onClick={() => toggleSort('company')} className="sortable">
                                    Company{sortIndicator('company')}
                                </th>
                                <th>Phone</th>
                                <th onClick={() => toggleSort('status')} className="sortable">
                                    Status{sortIndicator('status')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(contact => (
                                <tr key={contact.id}>
                                    <td>
                                        <div className="contact-name-cell">
                                            <div className="contact-avatar">
                                                {contact.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span>{contact.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="cell-with-icon">
                                            <HiOutlineMail size={14} /> {contact.email || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="cell-with-icon">
                                            <HiOutlineOfficeBuilding size={14} /> {contact.company || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="cell-with-icon">
                                            <HiOutlinePhone size={14} /> {contact.phone || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="status-badge" style={{ '--badge-color': statusColors[contact.status] || '#94a3b8' }}>
                                            {contact.status || 'active'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="icon-btn" onClick={() => openEdit(contact)} title="Edit">
                                                <HiOutlinePencil size={16} />
                                            </button>
                                            <button className="icon-btn danger" onClick={() => handleDelete(contact.id)} title="Delete">
                                                <HiOutlineTrash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditing(null) }}
                title={editing ? 'Edit Contact' : 'New Contact'}
            >
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                placeholder="+1 234 567 890"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Company</label>
                            <input
                                type="text"
                                value={form.company}
                                onChange={e => setForm({ ...form, company: e.target.value })}
                                placeholder="Acme Inc."
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="lead">Lead</option>
                                <option value="customer">Customer</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Additional notes..."
                            rows={3}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => { setModalOpen(false); setEditing(null) }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editing ? 'Update Contact' : 'Create Contact'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
