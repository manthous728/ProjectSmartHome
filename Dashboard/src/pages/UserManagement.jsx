import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'

export default function UserManagement() {
    const { user, isAdmin } = useAuth()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Form State
    const [showAddModal, setShowAddModal] = useState(false)
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' })
    const [confirmPassword, setConfirmPassword] = useState('')
    const [submitError, setSubmitError] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await fetch(`${API_BASE_URL}/admin/users`)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.detail || 'Gagal mengambil data user')
            }
            const data = await response.json()
            setUsers(data.users || [])
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setError('Tidak dapat terhubung ke server. Pastikan API berjalan di ' + API_BASE_URL)
            } else {
                setError(err.message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (userId) => {
        if (!window.confirm('Yakin ingin menghapus user ini?')) return

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Gagal menghapus user')
            fetchUsers() // Refresh list
        } catch (err) {
            alert(err.message)
        }
    }

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleAddUser = async (e) => {
        e.preventDefault()
        setSubmitError('')

        if (newUser.password !== confirmPassword) {
            setSubmitError('Password dan Konfirmasi Password tidak cocok.')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Gagal membuat user')
            }

            setShowAddModal(false)
            setNewUser({ username: '', password: '', role: 'user' })
            setConfirmPassword('')
            fetchUsers()
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setSubmitError('Tidak dapat terhubung ke server. Pastikan API berjalan.')
            } else {
                setSubmitError(err.message)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const [resetModal, setResetModal] = useState({ show: false, username: '', tempPassword: '' })

    const handleResetPassword = async (userId, username) => {
        if (!window.confirm(`Reset password untuk user "${username}"?`)) return

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
                method: 'POST'
            })
            const data = await response.json()

            if (!response.ok) throw new Error(data.detail || 'Gagal reset password')

            setResetModal({ show: true, username, tempPassword: data.temporary_password })
        } catch (err) {
            alert(err.message)
        }
    }

    if (!isAdmin) {
        return (
            <div className="page-section">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                    Akses Ditolak. Halaman ini hanya untuk Admin.
                </div>
            </div>
        )
    }

    return (
        <div className="page-section">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manajemen User</h2>
                    <p className="text-slate-600 mt-1">Kelola akses pengguna sistem</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    + Tambah User
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-lg text-red-700">{error}</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dibuat</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">#{u.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleResetPassword(u.id, u.username)}
                                            className="text-amber-600 hover:text-amber-900 mr-4"
                                            title="Reset Password"
                                        >
                                            Reset
                                        </button>
                                        {u.id !== user?.id && (
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Tambah User Baru</h3>

                        {submitError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                                {submitError}
                            </div>
                        )}

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="user">User Biasa</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Memproses...
                                        </>
                                    ) : (
                                        'Buat User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Result Modal */}
            {resetModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Password Berhasil</h3>
                        <p className="text-slate-600 text-sm mb-4">
                            Password sementara untuk user <span className="font-semibold text-slate-900">{resetModal.username}</span>:
                        </p>

                        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 mb-6 font-mono text-xl font-bold text-slate-800 tracking-wider select-all">
                            {resetModal.tempPassword}
                        </div>

                        <button
                            onClick={() => setResetModal({ show: false, username: '', tempPassword: '' })}
                            className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
