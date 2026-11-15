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
      setMsg('Cuenta privada creada correctamente.');
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
        <GlassCard className="p-3 bg-emerald-100 border-emerald-700 text-emerald-900 text-sm font-bold">
          {msg}
        </GlassCard>
      ) : null}
      {err ? (
        <GlassCard className="p-3 bg-red-100 border-red-600 text-red-800 text-sm font-bold">
          {err}
        </GlassCard>
      ) : null}

      {isAdmin ? (
        <GlassCard className="space-y-4">
          <h2 className="text-xl font-black text-dark flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-secondary" /> Crear Cuenta Privada (Solo Admin)
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
              <span className="block text-xs font-black text-dark/90">Rol</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-2xl border-2 border-dark/70 bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <SacButton type="submit" variant="secondary" className="w-full">
                Crear Cuenta
              </SacButton>
            </div>
          </form>
        </GlassCard>
      ) : null}

      <GlassCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-black text-dark">Cuentas Registradas ({users.length})</h3>
          <div className="relative w-64">
            <Search className="h-4 w-4 text-dark/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario..."
              className="w-full rounded-full border-2 border-dark/40 bg-white pl-9 pr-4 py-1.5 text-xs font-bold text-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-xs font-bold text-dark/60 py-6 text-center">Cargando usuarios...</p>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dark/25 bg-white/85 p-3"
                >
                  <div className="flex items-center gap-3">
                    <SacAvatar src={u.avatarUrl} name={u.displayName} size={40} />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-sm text-slate-900">{u.displayName}</span>
                        <SacBadge variant="primary">{u.role}</SacBadge>
                        {u.isActive === false ? <SacBadge variant="dark">BLOQUEADO</SacBadge> : null}
                        {u.isMuted ? <SacBadge variant="secondary">SILENCIADO</SacBadge> : null}
                      </div>
                      <div className="text-xs font-bold text-slate-500">
                        @{u.username} {u.email ? `• ${u.email}` : ''}
                      </div>
                    </div>
                  </div>

                  {isAdmin && !isSelf ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SacButton
                        size="sm"
                        variant="glass"
                        onClick={() => void patchUser(u.id, { isMuted: !u.isMuted })}
                        title={u.isMuted ? 'Quitar silencio' : 'Silenciar en chats/comentarios'}
                      >
                        {u.isMuted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                      </SacButton>
                      <SacButton
                        size="sm"
                        variant="glass"
                        onClick={() => void patchUser(u.id, { isActive: !(u.isActive !== false) })}
                        title={u.isActive === false ? 'Reactivar' : 'Suspender acceso'}
                      >
                        {u.isActive === false ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </SacButton>
                      <SacButton size="sm" variant="danger" onClick={() => void deleteUser(u.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </SacButton>
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
