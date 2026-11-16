'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle, Search, Trash2, UserPlus, Volume2, VolumeX } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { User, UserRole } from '@/types/nuba';
import { GlassCard, SacAvatar, SacBadge, SacButton, SacInput } from '@/components/ui/SacPrimitives';

const ROLES: UserRole[] = ['USER', 'MODERATOR', 'ADMIN', 'SUPERADMIN'];

export function AdminUsersSection() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: { search: search.trim() || undefined },
      });
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await api.post('/admin/users', {
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim() || null,
        password,
        role,
      });
      setUsername('');
      setDisplayName('');
      setEmail('');
      setPassword('');
      setRole('USER');
      setMsg('Cuenta privada creada exitosamente.');
      await loadUsers();
    } catch (e: any) {
      setErr(e?.message || 'No se pudo crear la cuenta.');
    }
  };

  const patchUser = async (id: string, body: Partial<{ isActive: boolean; isMuted: boolean; role: UserRole }>) => {
    setErr(null);
    try {
      await api.patch(`/admin/users/${id}`, body);
      await loadUsers();
    } catch (e: any) {
      setErr(e?.message || 'Acción rechazada.');
    }
  };

  const deleteUser = async (id: string) => {
    setErr(null);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      setErr(e?.message || 'No se pudo eliminar el usuario.');
    }
  };

  return (
    <div className="space-y-6">
      {msg ? (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
          {err}
        </div>
      ) : null}

      {isAdmin ? (
        <GlassCard className="p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" /> Crear Cuenta Privada
          </h2>
          <form onSubmit={handleCreateUser} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SacInput
              label="Usuario (sin espacios)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <SacInput
              label="Nombre Visible"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <SacInput
              label="Email (opcional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <SacInput
              label="Contraseña inicial (mín. 6)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Rol</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <SacButton type="submit" variant="primary" className="w-full">
                Crear Cuenta
              </SacButton>
            </div>
          </form>
        </GlassCard>
      ) : null}

      <GlassCard className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Cuentas Registradas ({users.length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Cargando usuarios...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SacAvatar src={u.avatarUrl} name={u.displayName} size={36} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {u.displayName}
                        </span>
                        <SacBadge variant="primary">{u.role}</SacBadge>
                        {u.isActive === false ? <SacBadge variant="dark">BLOQUEADO</SacBadge> : null}
                        {u.isMuted ? <SacBadge variant="accent">SILENCIADO</SacBadge> : null}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        @{u.username} {u.email ? `• ${u.email}` : ''}
                      </div>
                    </div>
                  </div>

                  {isAdmin && !isSelf ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => void patchUser(u.id, { isMuted: !u.isMuted })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title={u.isMuted ? 'Quitar silencio' : 'Silenciar'}
                      >
                        {u.isMuted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void patchUser(u.id, { isActive: !(u.isActive !== false) })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title={u.isActive === false ? 'Reactivar' : 'Suspender'}
                      >
                        {u.isActive === false ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(u.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
