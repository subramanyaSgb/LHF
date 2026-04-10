import { useState, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  Eye,
  Wrench,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Toggle } from '@/components/common/Toggle';
import { Table, type TableColumn } from '@/components/common/Table';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { mockUsers } from '@/utils/mock-data';
import { useAuthStore } from '@/stores/authStore';
import type { User, UserRole } from '@/types';

// ---------------------------------------------------------------------------
//  Role styling
// ---------------------------------------------------------------------------

const roleBadgeClass: Record<UserRole, string> = {
  admin: 'bg-purple-500/15 text-purple-400 border-purple-400/30',
  operator: 'bg-status-info-bg text-status-info border-status-info/30',
  viewer: 'bg-bg-tertiary text-text-secondary border-border-default',
};

const roleIcon: Record<UserRole, React.ReactNode> = {
  admin: <Shield className="w-3.5 h-3.5" />,
  operator: <Wrench className="w-3.5 h-3.5" />,
  viewer: <Eye className="w-3.5 h-3.5" />,
};

// ---------------------------------------------------------------------------
//  Form state
// ---------------------------------------------------------------------------

interface UserFormData {
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  password: string;
}

const emptyForm: UserFormData = {
  username: '',
  displayName: '',
  email: '',
  role: 'viewer',
  password: '',
};

// ---------------------------------------------------------------------------
//  Main component
// ---------------------------------------------------------------------------

export default function UsersPage(): React.JSX.Element {
  const { hasMinRole } = useAuthStore();
  const isAdmin = hasMinRole('admin');

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Open add modal
  const handleAdd = useCallback(() => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  // Open edit modal
  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      password: '',
    });
    setModalOpen(true);
  }, []);

  // Submit form
  const handleSubmit = useCallback(() => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                username: form.username,
                displayName: form.displayName,
                email: form.email,
                role: form.role,
                updatedAt: new Date().toISOString(),
              }
            : u,
        ),
      );
    } else {
      const newUser: User = {
        id: `u${Date.now()}`,
        username: form.username,
        displayName: form.displayName,
        email: form.email,
        role: form.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  }, [editingUser, form]);

  // Delete user
  const handleDelete = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setDeleteConfirmId(null);
  }, []);

  // Toggle active status
  const handleToggleActive = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() } : u,
      ),
    );
  }, []);

  // Update form field
  const updateField = useCallback(
    <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Form validation
  const isFormValid =
    form.username.trim() !== '' &&
    form.displayName.trim() !== '' &&
    form.email.trim() !== '' &&
    (editingUser || form.password.trim() !== '');

  // Table columns
  const columns: TableColumn<User>[] = [
    {
      key: 'displayName',
      header: 'User',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-text-primary text-lg">{row.displayName}</div>
          <div className="text-sm text-text-muted">@{row.username}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-full border',
            roleBadgeClass[row.role],
          )}
        >
          {roleIcon[row.role]}
          {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) => <span className="text-text-secondary">{row.email}</span>,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: (row) => (
        <span className="text-text-secondary text-sm">
          {row.lastLogin ? formatDateTime(row.lastLogin) : 'Never'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active',
      render: (row) => (
        <Toggle
          checked={row.isActive}
          onChange={() => handleToggleActive(row.id)}
          size="sm"
          disabled={!isAdmin}
        />
      ),
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (row: User) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Pencil className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row);
                  }}
                  aria-label={`Edit ${row.displayName}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Trash2 className="w-4 h-4 text-status-critical" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(row.id);
                  }}
                  aria-label={`Delete ${row.displayName}`}
                />
              </div>
            ),
          } satisfies TableColumn<User>,
        ]
      : []),
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-brand-primary" />
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <Badge variant="info" size="sm">
            {users.length} users
          </Badge>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            iconLeft={<UserPlus className="w-5 h-5" />}
            onClick={handleAdd}
          >
            Add User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card variant="bordered" noPadding>
        <Table
          columns={columns}
          data={users}
          rowKey={(row) => row.id}
          clientSort
          striped
          emptyContent="No users found"
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
          setForm(emptyForm);
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingUser(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!isFormValid}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => updateField('username', e.target.value)}
            placeholder="e.g. operator2"
            disabled={!!editingUser}
            fullWidth
          />
          <Input
            label="Display Name"
            value={form.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            placeholder="e.g. Ramesh Operator"
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="e.g. ramesh@jsw.in"
            fullWidth
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => updateField('role', e.target.value as UserRole)}
            options={[
              { value: 'viewer', label: 'Viewer' },
              { value: 'operator', label: 'Operator' },
              { value: 'admin', label: 'Admin' },
            ]}
            fullWidth
          />
          <Input
            label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
            fullWidth
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete User
            </Button>
          </>
        }
      >
        <p className="text-text-secondary text-lg">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
