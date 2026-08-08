import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  Building,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Store,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { useStoreSelectorStore } from '../../store-location/store/useStoreSelectorStore';
import type { ManagedUser, UserRole, UserStatus } from '../../../types';
import { TableSkeleton } from '../../../components/common/AdminSkeletons';

export const UsersManagementView: React.FC = () => {
  const { users, fetchUsers, addUser, updateUser, toggleUserStatus, deleteUser, isLoadingData } = useAdminStore();
  const { stores } = useStoreSelectorStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Add / Edit User State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [status, setStatus] = useState<UserStatus>('active');
  const [assignedStoreId, setAssignedStoreId] = useState<string>('');

  const handleOpenAdd = () => {
    setUserToEdit(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('customer');
    setStatus('active');
    setAssignedStoreId(stores[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setUserToEdit(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setRole(user.role);
    setStatus(user.status);
    setAssignedStoreId(user.assignedStoreId || stores[0]?.id || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, userName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) {
      deleteUser(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const assignedStore = stores.find((s) => s.id === assignedStoreId);

    const userData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '0812-0000-0000',
      role,
      status,
      assignedStoreId: role === 'admin_store' ? assignedStoreId : undefined,
      assignedStoreName: role === 'admin_store' ? assignedStore?.name : undefined,
      joinedDate: userToEdit ? userToEdit.joinedDate : new Date().toISOString().split('T')[0],
      totalOrdersOrSales: userToEdit ? userToEdit.totalOrdersOrSales : 0,
      avatarUrl:
        userToEdit?.avatarUrl ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    };

    if (userToEdit) {
      updateUser(userToEdit.id, userData);
    } else {
      addUser(userData);
    }

    setIsModalOpen(false);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  // Role Statistics
  const totalCustomers = users.filter((u) => u.role === 'customer').length;
  const totalStoreAdmins = users.filter((u) => u.role === 'admin_store').length;
  const totalSuperadmins = users.filter((u) => u.role === 'superadmin').length;

  const renderRoleBadge = (userRole: UserRole, storeName?: string) => {
    switch (userRole) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-700" />
            <span>Superadmin</span>
          </span>
        );
      case 'admin_store':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-200">
            <Store className="w-3 h-3 text-blue-700" />
            <span>Admin Store ({storeName || 'Cabang'})</span>
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-[#063104] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
            <UserCheck className="w-3 h-3 text-[#063104]" />
            <span>Customer</span>
          </span>
        );
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace(/\s/g, ' ');

  if (isLoadingData) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Top Bar Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="hidden md:block">
          <h1 className="text-2xl font-black text-gray-900">Manajemen User (Pengguna)</h1>
          <p className="text-xs text-gray-500">
            Kelola hak akses role Superadmin, Admin Store (Pengelola Cabang Toko), dan Pelanggan/Customer.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-4 py-2.5 md:px-4.5 md:py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2 md:gap-2.5 shrink-0 active:scale-95 border border-emerald-900/30 cursor-pointer self-start sm:self-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Tambah User</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-bold block">Total User</span>
            <span className="text-xl md:text-2xl font-black text-gray-900">{users.length}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-bold block">Customer</span>
            <span className="text-xl md:text-2xl font-black text-[#063104]">{totalCustomers}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-100 text-[#063104] flex items-center justify-center">
            <UserCheck className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-bold block">Admin Store</span>
            <span className="text-xl md:text-2xl font-black text-blue-800">{totalStoreAdmins}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <Building className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] md:text-xs text-gray-500 font-bold block">Superadmin</span>
            <span className="text-xl md:text-2xl font-black text-purple-800">{totalSuperadmins}</span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <Shield className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Header */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'customer', label: 'Customer' },
            { id: 'admin_store', label: 'Admin' },
            { id: 'superadmin', label: 'Super' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-extrabold transition-all whitespace-nowrap ${roleFilter === tab.id
                ? 'bg-[#063104] text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, atau HP..."
            className="w-full bg-gray-50 text-xs rounded-xl py-2.5 pl-9 pr-3 border border-gray-200 focus:outline-none focus:border-[#063104] focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Mobile User Cards */}
      <div className="md:hidden space-y-2.5">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs">Tidak ada data user yang sesuai.</div>
        ) : (
          filteredUsers.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
              <div className="flex items-center gap-3">
                <img
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                  alt={u.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-extrabold text-gray-900 text-xs truncate">{u.name}</h4>
                    {renderRoleBadge(u.role, u.assignedStoreName)}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium block truncate">{u.email}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(u.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${u.status === 'active' ? 'bg-[#063104]' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ${u.status === 'active' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span>{u.phone}</span>
                  <span>{u.joinedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(u)} className="p-1.5 rounded-lg bg-gray-100 text-gray-700 active:scale-95"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 rounded-lg bg-gray-100 text-gray-700 active:scale-95"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Users Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] text-gray-700 text-xs font-extrabold uppercase border-b border-gray-200/80">
                <th className="py-3.5 px-4">Informasi User</th>
                <th className="py-3.5 px-4">Kontak (Phone)</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">Tanggal Bergabung</th>
                <th className="py-3.5 px-4">Aktivitas / Omzet</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Tidak ada data user yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-extrabold text-gray-900">{u.name}</h4>
                          <span className="text-[11px] text-gray-500 font-medium">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">{u.phone}</td>
                    <td className="py-3.5 px-4">{renderRoleBadge(u.role, u.assignedStoreName)}</td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{u.joinedDate}</td>
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      {u.role === 'admin_store' ? formatCurrency(u.totalOrdersOrSales) : `${u.totalOrdersOrSales} Pesanan`}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(u.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${u.status === 'active' ? 'bg-[#063104]' : 'bg-gray-300'}`}
                        title={u.status === 'active' ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${u.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className="block text-[10px] font-bold text-gray-500 mt-0.5">
                        {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="button" onClick={() => handleOpenEdit(u)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#063104] hover:text-white text-gray-700 transition-colors" title="Edit User">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(u.id, u.name)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 transition-colors" title="Hapus User">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit User */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[3000] bg-black/60 flex items-end md:items-center justify-center md:p-4 overflow-y-auto animate-fade-in"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:my-auto max-h-[92vh] md:max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F9F8F6]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#063104]" />
                <h3 className="font-extrabold text-gray-900 text-lg">
                  {userToEdit ? 'Edit Akun User' : 'Tambah User Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap User <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmad Fauzi"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ahmad@waroengkita.id"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Role Akses <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-bold"
                  >
                    <option value="customer">Pelanggan / Customer</option>
                    <option value="admin_store">Admin Store (Cabang Toko)</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status Akun <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    className="w-full bg-white text-sm rounded-xl px-3.5 py-2.5 border border-gray-200 focus:outline-none focus:border-[#063104] font-bold"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Conditional Assigned Store Select if Role is admin_store */}
              {role === 'admin_store' && (
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1 animate-fade-in">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Pilih Cabang Toko Yang Dikelola <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignedStoreId}
                    onChange={(e) => setAssignedStoreId(e.target.value)}
                    className="w-full bg-white text-xs rounded-xl px-3 py-2 border border-blue-300 focus:outline-none focus:border-blue-700 font-extrabold text-blue-900"
                  >
                    {stores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white text-[#063104] border border-[#063104] font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#063104] hover:bg-[#084205] text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
