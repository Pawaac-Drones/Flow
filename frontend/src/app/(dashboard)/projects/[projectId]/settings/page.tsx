'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Save, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useProjects } from '@/hooks/useProjects';
import { useUsers } from '@/hooks/useUsers';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, 's$1');
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const {
    project,
    updateProject,
    members,
    addMember,
    removeMember,
    workflows,
    addWorkflow,
    deleteWorkflow,
  } = useProjects(projectId);
  const { users } = useUsers();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'workflow' | 'members'>('general');

  // Workflow form state
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');

  // Member form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');

  const handleSave = async () => {
    if (name || description) {
      await updateProject.mutateAsync({
        projectId,
        data: { name: name || undefined, description: description || undefined },
      });
    }
  };

  const handleAddStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    const order = workflows.data?.length ?? 0;
    await addWorkflow.mutateAsync({
      name: newStatusName.trim(),
      slug: slugify(newStatusName),
      order,
      color: newStatusColor,
    });
    setNewStatusName('');
    setNewStatusColor('#6366f1');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await addMember.mutateAsync({ userId: selectedUserId, role: selectedRole });
    setSelectedUserId('');
    setSelectedRole('member');
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'members', label: 'Members' },
  ] as const;

  const memberUserIds = new Set(members.data?.map((m) => m.userId));
  const availableUsers = (users.data ?? []).filter((u) => !memberUserIds.has(u.id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Project Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure project settings, workflows, and members
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="card p-6 max-w-2xl space-y-4">
          <Input
            label="Project name"
            value={name || project.data?.name || ''}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
          />
          <Input
            label="Description"
            value={description || project.data?.description || ''}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Project description"
          />
          <div className="pt-2">
            <Button onClick={handleSave} disabled={updateProject.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateProject.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'workflow' && (
        <div className="card p-6 max-w-2xl">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Status Workflow</h2>
            <p className="text-sm text-slate-500 mt-1">
              Define the statuses tasks can move through on the board.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            {workflows.isLoading && (
              <p className="text-sm text-slate-400">Loading statuses...</p>
            )}
            {workflows.data?.map((status, index) => (
              <div
                key={status.id}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-400">
                    {index + 1}
                  </span>
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color || '#6b7280' }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {status.name}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {status.slug}
                  </span>
                </div>
                <button
                  onClick={() => deleteWorkflow.mutate(status.id)}
                  disabled={deleteWorkflow.isPending}
                  className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                  title="Delete status"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {workflows.data?.length === 0 && (
              <p className="text-sm text-slate-400">No statuses defined yet.</p>
            )}
          </div>

          <form onSubmit={handleAddStatus} className="flex items-end gap-3 border-t border-slate-100 pt-4">
            <div className="flex-1">
              <Input
                label="New status name"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="e.g. Blocked"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="h-10 w-14 rounded-lg border border-slate-200 p-1"
              />
            </div>
            <Button type="submit" size="sm" disabled={addWorkflow.isPending || !newStatusName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Status
            </Button>
          </form>
          {addWorkflow.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(addWorkflow.error as Error)?.message || 'Failed to add status'}
            </p>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card p-6 max-w-2xl">
          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">Team Members</h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage project members and their roles.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            {members.isLoading && (
              <p className="text-sm text-slate-400">Loading members...</p>
            )}
            {members.data?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {member.user?.displayName || member.user?.email || member.userId}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{member.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeMember.mutate(member.userId)}
                  disabled={removeMember.isPending}
                  className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                  title="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {members.data?.length === 0 && (
              <p className="text-sm text-slate-400">No members yet.</p>
            )}
          </div>

          <form onSubmit={handleAddMember} className="flex items-end gap-3 border-t border-slate-100 pt-4">
            <div className="flex-1">
              <Select
                label="User"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Select a user"
                options={availableUsers.map((u) => ({
                  value: u.id,
                  label: u.displayName || u.email,
                }))}
              />
            </div>
            <div className="w-40">
              <Select
                label="Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'member', label: 'Member' },
                  { value: 'viewer', label: 'Viewer' },
                ]}
              />
            </div>
            <Button type="submit" size="sm" disabled={addMember.isPending || !selectedUserId}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </form>
          {addMember.isError && (
            <p className="mt-2 text-sm text-red-600">
              {(addMember.error as Error)?.message || 'Failed to add member'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
