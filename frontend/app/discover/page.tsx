'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Download, Globe, Lock, FileText, FileJson, FileArchive, 
  File, FileSpreadsheet, Presentation, Eye, EyeOff, X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface DiscoveredFile {
  id: number;
  filename: string;
  uploadedBy: string;
  size: number;
  type: string;
  isPublic: boolean;
  downloads: number;
  uploadedAt: string;
  password: string | null;
}

const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf': return <FileText className="w-8 h-8 text-accent" />;
    case 'json': return <FileJson className="w-8 h-8 text-accent" />;
    case 'csv': case 'xlsx': return <FileSpreadsheet className="w-8 h-8 text-accent" />;
    case 'pptx': case 'presentation': return <Presentation className="w-8 h-8 text-accent" />;
    case 'zip': case 'rar': case 'tar': return <FileArchive className="w-8 h-8 text-accent" />;
    default: return <File className="w-8 h-8 text-accent" />;
  }
};

const formatFileSize = (size: number): string => {
  if (size < 1) return `${(size * 1024).toFixed(0)} KB`;
  if (size < 1024) return `${size.toFixed(1)} MB`;
  return `${(size / 1024).toFixed(1)} GB`;
};

const getDateDaysAgo = (dateStr: string): number => {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

const ITEMS_PER_PAGE = 5;

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<DiscoveredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'downloads' | 'date' | 'size'>('downloads');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [passwordPrompts, setPasswordPrompts] = useState<{ [key: number]: { show: boolean; input: string } }>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const data = await api.get<{ files: DiscoveredFile[]; total: number }>(
          `/files/public/list?search=${searchQuery}&sort=${sortBy}&page=${currentPage}&per_page=${ITEMS_PER_PAGE}`
        );
        setFiles(data.files);
      } catch {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [searchQuery, sortBy, currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const sortedFiles = files
    .filter(f => filterVisibility === 'all' || (filterVisibility === 'public' && f.isPublic) || (filterVisibility === 'private' && !f.isPublic));

  const handleDownload = async (file: DiscoveredFile) => {
    if (!file.isPublic && file.password) {
      setPasswordPrompts((prev) => ({
        ...prev,
        [file.id]: { show: true, input: '' },
      }));
    } else {
      try {
        const token = getToken();
        const res = await fetch(`/api/files/${file.id}/download`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        alert('Download failed');
      }
    }
  };

  const handlePasswordSubmit = async (fileId: number, password: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/files/${fileId}/download?password=${encodeURIComponent(password)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Incorrect password');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const file = files.find(f => f.id === fileId);
      a.download = file?.filename || 'download';
      a.click();
      URL.revokeObjectURL(url);
      setPasswordPrompts((prev) => ({ ...prev, [fileId]: { show: false, input: '' } }));
    } catch {
      alert('Incorrect password');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex flex-col">
        <Header title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground/60">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header title="Discover Files" />

      <div className="flex-1 flex flex-col px-4 py-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Discover Files</h1>
            <p className="text-foreground/60">Explore shared files from the community</p>
          </div>

          <div className="mb-8 grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl p-6 border-2 border-border">
              <div className="text-accent text-2xl font-bold mb-2">{files.length}</div>
              <p className="text-card-foreground/70">Files available</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-card-foreground/60" />
              <Input
                type="text"
                placeholder="Search files or users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 bg-card border-2 border-border rounded-full py-3 text-card-foreground placeholder-foreground/60 focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterVisibility('all')}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${filterVisibility === 'all' ? 'bg-accent text-foreground' : 'bg-card border-2 border-border text-card-foreground hover:border-accent'}`}>
                All Files
              </button>
              <button onClick={() => setFilterVisibility('public')}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${filterVisibility === 'public' ? 'bg-accent text-foreground' : 'bg-card border-2 border-border text-card-foreground hover:border-accent'}`}>
                <Globe className="w-4 h-4" /> Public
              </button>
              <button onClick={() => setFilterVisibility('private')}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${filterVisibility === 'private' ? 'bg-accent text-foreground' : 'bg-card border-2 border-border text-card-foreground hover:border-accent'}`}>
                <Lock className="w-4 h-4" /> Private
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'downloads' | 'date' | 'size')}
                className="px-4 py-2 rounded-full font-semibold bg-card border-2 border-border text-card-foreground cursor-pointer hover:border-accent transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              >
                <option value="downloads">Sort by Downloads</option>
                <option value="date">Sort by Date</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
          </div>

          {sortedFiles.length > 0 ? (
            <div className="grid gap-6 mb-8">
              {sortedFiles.map((file) => (
                <div key={file.id}>
                  <div className="group relative bg-gradient-to-r from-card to-card/80 rounded-2xl p-6 border-2 border-card hover:border-accent transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between z-10">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex-shrink-0 w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors duration-300">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-card-foreground truncate group-hover:text-accent transition-colors duration-300">
                              {file.filename}
                            </h3>
                            {!file.isPublic && <Lock className="w-4 h-4 text-accent flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm text-card-foreground/60">
                            <span className="font-semibold text-card-foreground/80">@{file.uploadedBy}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{getDateDaysAgo(file.uploadedAt)} days ago</span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs text-card-foreground/70">
                            <div className="flex items-center gap-1">
                              {file.isPublic ? (
                                <><Globe className="w-4 h-4 text-accent" /><span>Public</span></>
                              ) : (
                                <><Lock className="w-4 h-4 text-accent" /><span>Private</span></>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="w-4 h-4 text-accent" />
                              <span>{file.downloads} downloads</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Button
                          onClick={() => handleDownload(file)}
                          className="bg-accent hover:bg-accent/90 text-foreground rounded-full px-8 py-3 font-bold flex items-center gap-2 transition-all duration-300 group-hover:shadow-lg"
                        >
                          <Download className="w-4 h-4" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  {passwordPrompts[file.id]?.show && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-card rounded-2xl p-8 border-2 border-border max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                          <Lock className="w-6 h-6 text-accent" />
                          <h2 className="text-xl font-bold text-card-foreground">Password Required</h2>
                        </div>
                        <p className="text-card-foreground/60 mb-6">This file is protected. Enter the password to download.</p>
                        <div className="space-y-4">
                          <div className="relative">
                            <input
                              type="password"
                              value={passwordPrompts[file.id]?.input || ''}
                              onChange={(e) =>
                                setPasswordPrompts((prev) => ({
                                  ...prev,
                                  [file.id]: { ...prev[file.id], input: e.target.value },
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handlePasswordSubmit(file.id, passwordPrompts[file.id].input);
                                }
                              }}
                              placeholder="Enter password"
                              className="w-full px-4 py-3 bg-input border-2 border-border rounded-full text-foreground placeholder-foreground/40 focus:border-accent focus:ring-2 focus:ring-accent/30"
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setPasswordPrompts((prev) => ({ ...prev, [file.id]: { show: false, input: '' } }))}
                              className="flex-1 px-4 py-2 bg-card border-2 border-border text-card-foreground rounded-full font-semibold hover:border-accent transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handlePasswordSubmit(file.id, passwordPrompts[file.id].input)}
                              className="flex-1 px-4 py-2 bg-accent text-foreground rounded-full font-semibold hover:bg-accent/90 transition-colors"
                            >
                              Unlock
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="w-16 h-16 text-foreground/20 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No files found</h3>
              <p className="text-foreground/60 text-center">Try a different search or adjust your filters</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
