'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useUser } from '@/app/context/user-context';
import { Activity, Users, ShieldAlert, FileText, Trash2, CheckCircle } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target_file_id?: number;
  ip_address: string;
  timestamp: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface FileData {
  id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'logs' | 'approvals' | 'users' | 'files'>('logs');
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [approvals, setApprovals] = useState<UserData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userLoading && user?.role !== 'admin') {
      router.push('/home');
    }
  }, [user, userLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'logs') {
        const data = await api.get<AuditLog[]>('/admin/logs');
        setLogs(data);
      } else if (activeTab === 'approvals') {
        const data = await api.get<UserData[]>('/admin/pending-admins');
        setApprovals(data);
      } else if (activeTab === 'users') {
        const data = await api.get<UserData[]>('/admin/users');
        setUsers(data);
      } else if (activeTab === 'files') {
        const data = await api.get<FileData[]>('/admin/files');
        setFiles(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [activeTab, user]);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admin/approve/${id}`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve admin');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleDeleteFile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/admin/files/${id}`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  if (userLoading || user?.role !== 'admin') {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header title="Admin Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header title="Admin Dashboard" showBack />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border p-6 flex flex-col gap-4">
          <Button
            variant={activeTab === 'logs' ? 'default' : 'ghost'}
            className="w-full justify-start text-base"
            onClick={() => setActiveTab('logs')}
          >
            <Activity className="w-5 h-5 mr-3" />
            Event Logs
          </Button>
          <Button
            variant={activeTab === 'approvals' ? 'default' : 'ghost'}
            className="w-full justify-start text-base"
            onClick={() => setActiveTab('approvals')}
          >
            <ShieldAlert className="w-5 h-5 mr-3" />
            Approvals
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            className="w-full justify-start text-base"
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-5 h-5 mr-3" />
            Manage Users
          </Button>
          <Button
            variant={activeTab === 'files' ? 'default' : 'ghost'}
            className="w-full justify-start text-base"
            onClick={() => setActiveTab('files')}
          >
            <FileText className="w-5 h-5 mr-3" />
            Manage Files
          </Button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-foreground/60">Loading data...</p>
          ) : (
            <div className="bg-card rounded-2xl border-2 border-border overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  {activeTab === 'logs' && (
                    <tr>
                      <th className="px-6 py-4 font-bold border-b border-border">Timestamp</th>
                      <th className="px-6 py-4 font-bold border-b border-border">User ID</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Action</th>
                      <th className="px-6 py-4 font-bold border-b border-border">IP Address</th>
                    </tr>
                  )}
                  {activeTab === 'approvals' && (
                    <tr>
                      <th className="px-6 py-4 font-bold border-b border-border">Username</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Email</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Role</th>
                      <th className="px-6 py-4 font-bold border-b border-border text-right">Action</th>
                    </tr>
                  )}
                  {activeTab === 'users' && (
                    <tr>
                      <th className="px-6 py-4 font-bold border-b border-border">ID</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Username</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Role</th>
                      <th className="px-6 py-4 font-bold border-b border-border text-right">Action</th>
                    </tr>
                  )}
                  {activeTab === 'files' && (
                    <tr>
                      <th className="px-6 py-4 font-bold border-b border-border">Filename</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Size (MB)</th>
                      <th className="px-6 py-4 font-bold border-b border-border">Uploaded At</th>
                      <th className="px-6 py-4 font-bold border-b border-border text-right">Action</th>
                    </tr>
                  )}
                </thead>
                <tbody className="text-sm">
                  {activeTab === 'logs' && logs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-foreground/50">No logs found</td></tr>
                  )}
                  {activeTab === 'logs' && logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-card-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 text-card-foreground">{log.user_id || '-'}</td>
                      <td className="px-6 py-4 text-card-foreground font-semibold">{log.action}</td>
                      <td className="px-6 py-4 text-foreground/70">{log.ip_address || '-'}</td>
                    </tr>
                  ))}

                  {activeTab === 'approvals' && approvals.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-foreground/50">No pending approvals</td></tr>
                  )}
                  {activeTab === 'approvals' && approvals.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-card-foreground font-bold">{u.username}</td>
                      <td className="px-6 py-4 text-foreground/70">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleApprove(u.id)}
                          className="bg-accent text-foreground hover:bg-accent/90 rounded-full"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'users' && users.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-foreground/50">No users found</td></tr>
                  )}
                  {activeTab === 'users' && users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-card-foreground">{u.id}</td>
                      <td className="px-6 py-4 text-card-foreground font-bold">{u.username}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'admin' ? 'bg-primary/20 text-primary-foreground' : 'bg-muted text-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleDeleteUser(u.id)}
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                          disabled={u.id === user.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'files' && files.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-foreground/50">No files found</td></tr>
                  )}
                  {activeTab === 'files' && files.map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-card-foreground font-bold">{f.original_filename}</td>
                      <td className="px-6 py-4 text-foreground/70">{(f.file_size / 1024 / 1024).toFixed(2)}</td>
                      <td className="px-6 py-4 text-foreground/70">{new Date(f.uploaded_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleDeleteFile(f.id)}
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
