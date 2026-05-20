'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Download, Globe, Lock, FileText, FileJson, FileArchive, 
  File, FileSpreadsheet, Presentation, Eye, EyeOff, X
} from 'lucide-react';
import { useState } from 'react';

// Mock data for discovered files with password field
const mockDiscoveredFiles = [
  {
    id: 1,
    filename: 'Project_Proposal.pdf',
    uploadedBy: 'john_dev',
    size: 2.4,
    type: 'pdf',
    isPublic: true,
    downloads: 156,
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    password: null,
  },
  {
    id: 2,
    filename: 'Design_System_v2.figma',
    uploadedBy: 'sarah_designer',
    size: 5.8,
    type: 'figma',
    isPublic: true,
    downloads: 89,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    password: null,
  },
  {
    id: 3,
    filename: 'Dataset_Q4_2024.csv',
    uploadedBy: 'analytics_team',
    size: 1.2,
    type: 'csv',
    isPublic: true,
    downloads: 234,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    password: null,
  },
  {
    id: 4,
    filename: 'API_Documentation.md',
    uploadedBy: 'tech_lead',
    size: 0.512,
    type: 'md',
    isPublic: true,
    downloads: 412,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    password: null,
  },
  {
    id: 5,
    filename: 'Marketing_Deck_2024.pptx',
    uploadedBy: 'marketing_hub',
    size: 3.1,
    type: 'pptx',
    isPublic: true,
    downloads: 67,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    password: null,
  },
  {
    id: 6,
    filename: 'Code_Templates.zip',
    uploadedBy: 'dev_community',
    size: 4.3,
    type: 'zip',
    isPublic: true,
    downloads: 523,
    uploadedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    password: null,
  },
  {
    id: 7,
    filename: 'Secret_Report.pdf',
    uploadedBy: 'admin_user',
    size: 2.1,
    type: 'pdf',
    isPublic: false,
    downloads: 45,
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    password: 'secure123',
  },
  {
    id: 8,
    filename: 'Config_Data.json',
    uploadedBy: 'dev_community',
    size: 0.8,
    type: 'json',
    isPublic: false,
    downloads: 23,
    uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    password: 'config456',
  },
];

const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="w-8 h-8 text-accent" />;
    case 'json':
      return <FileJson className="w-8 h-8 text-accent" />;
    case 'csv':
    case 'xlsx':
      return <FileSpreadsheet className="w-8 h-8 text-accent" />;
    case 'pptx':
    case 'presentation':
      return <Presentation className="w-8 h-8 text-accent" />;
    case 'zip':
    case 'rar':
    case 'tar':
      return <FileArchive className="w-8 h-8 text-accent" />;
    case 'md':
    case 'txt':
    case 'figma':
    default:
      return <File className="w-8 h-8 text-accent" />;
  }
};

const formatFileSize = (size: number): string => {
  if (size < 1) return `${(size * 1024).toFixed(0)} KB`;
  if (size < 1024) return `${size.toFixed(1)} MB`;
  return `${(size / 1024).toFixed(1)} GB`;
};

const getDateDaysAgo = (date: Date): number => {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const ITEMS_PER_PAGE = 5;

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState(mockDiscoveredFiles);
  const [sortBy, setSortBy] = useState<'downloads' | 'date' | 'size'>('downloads');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [passwordPrompts, setPasswordPrompts] = useState<{ [key: number]: { show: boolean; input: string } }>({});
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

  const applyFiltersAndSort = (query: string, visibility: 'all' | 'public' | 'private', sort: 'downloads' | 'date' | 'size') => {
    let filtered = mockDiscoveredFiles.filter((file) => {
      const matchesSearch =
        file.filename.toLowerCase().includes(query.toLowerCase()) ||
        file.uploadedBy.toLowerCase().includes(query.toLowerCase());
      const matchesVisibility =
        visibility === 'all' || (visibility === 'public' && file.isPublic) || (visibility === 'private' && !file.isPublic);
      return matchesSearch && matchesVisibility;
    });

    filtered.sort((a, b) => {
      if (sort === 'downloads') return b.downloads - a.downloads;
      if (sort === 'date') return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      if (sort === 'size') return b.size - a.size;
      return 0;
    });

    setFilteredFiles(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFiltersAndSort(query, filterVisibility, sortBy);
  };

  const handleFilterChange = (visibility: 'all' | 'public' | 'private') => {
    setFilterVisibility(visibility);
    applyFiltersAndSort(searchQuery, visibility, sortBy);
  };

  const handleSortChange = (sort: 'downloads' | 'date' | 'size') => {
    setSortBy(sort);
    applyFiltersAndSort(searchQuery, filterVisibility, sort);
  };

  const handleDownload = (file: any) => {
    if (!file.isPublic && file.password) {
      setPasswordPrompts((prev) => ({
        ...prev,
        [file.id]: { show: true, input: '' },
      }));
    } else {
      alert(`Downloading ${file.filename}...`);
    }
  };

  const handlePasswordSubmit = (fileId: number, password: string) => {
    const file = mockDiscoveredFiles.find((f) => f.id === fileId);
    if (file && file.password === password) {
      alert(`Downloading ${file.filename}...`);
      setPasswordPrompts((prev) => ({
        ...prev,
        [fileId]: { show: false, input: '' },
      }));
    } else {
      alert('Incorrect password');
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 py-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Discover Files</h1>
            <p className="text-foreground/60">Explore shared files from the community</p>
          </div>

          {/* Stats Section */}
          <div className="mb-8 grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl p-6 border-2 border-border">
              <div className="text-accent text-2xl font-bold mb-2">{mockDiscoveredFiles.length}</div>
              <p className="text-card-foreground/70">Files available</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border-2 border-border">
              <div className="text-accent text-2xl font-bold mb-2">
                {mockDiscoveredFiles.reduce((sum, f) => sum + f.downloads, 0).toLocaleString()}
              </div>
              <p className="text-card-foreground/70">Total downloads</p>
            </div>
            <div className="bg-card rounded-2xl p-6 border-2 border-border">
              <div className="text-accent text-2xl font-bold mb-2">
                {new Set(mockDiscoveredFiles.map((f) => f.uploadedBy)).size}
              </div>
              <p className="text-card-foreground/70">Active contributors</p>
            </div>
          </div>

          {/* Search Bar */}
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

          {/* Filters and Sort */}
          <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                  filterVisibility === 'all'
                    ? 'bg-accent text-foreground'
                    : 'bg-card border-2 border-border text-card-foreground hover:border-accent'
                }`}
              >
                All Files
              </button>
              <button
                onClick={() => handleFilterChange('public')}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  filterVisibility === 'public'
                    ? 'bg-accent text-foreground'
                    : 'bg-card border-2 border-border text-card-foreground hover:border-accent'
                }`}
              >
                <Globe className="w-4 h-4" />
                Public
              </button>
              <button
                onClick={() => handleFilterChange('private')}
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  filterVisibility === 'private'
                    ? 'bg-accent text-foreground'
                    : 'bg-card border-2 border-border text-card-foreground hover:border-accent'
                }`}
              >
                <Lock className="w-4 h-4" />
                Private
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'downloads' | 'date' | 'size')}
                className="px-4 py-2 rounded-full font-semibold bg-card border-2 border-border text-card-foreground cursor-pointer hover:border-accent transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              >
                <option value="downloads">Sort by Downloads</option>
                <option value="date">Sort by Date</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>
          </div>

          {/* Files Grid */}
          {filteredFiles.length > 0 ? (
            <>
              <div className="grid gap-6 mb-8">
                {paginatedFiles.map((file) => (
                <div key={file.id}>
                  <div className="group relative bg-gradient-to-r from-card to-card/80 rounded-2xl p-6 border-2 border-card hover:border-accent transition-all duration-300 overflow-hidden">
                    {/* Hover background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="relative flex items-center justify-between z-10">
                      {/* Left section - File info */}
                      <div className="flex items-center gap-6 flex-1">
                        {/* File Icon */}
                        <div className="flex-shrink-0 w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors duration-300">
                          {getFileIcon(file.type)}
                        </div>

                        {/* File Details */}
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
                                <>
                                  <Globe className="w-4 h-4 text-accent" />
                                  <span>Public</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4 text-accent" />
                                  <span>Private</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="w-4 h-4 text-accent" />
                              <span>{file.downloads} downloads</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right section - Action button */}
                      <div className="flex-shrink-0 ml-4">
                        <Button
                          onClick={() => handleDownload(file)}
                          className="bg-accent hover:bg-accent/90 text-foreground rounded-full px-8 py-3 font-bold flex items-center gap-2 transition-all duration-300 group-hover:shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Password Prompt Modal */}
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
                              onKeyPress={(e) => {
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
                              onClick={() =>
                                setPasswordPrompts((prev) => ({
                                  ...prev,
                                  [file.id]: { show: false, input: '' },
                                }))
                              }
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full bg-card border-2 border-border text-card-foreground font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent hover:text-accent enabled:hover:border-accent"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1 flex-wrap">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-accent text-foreground'
                            : 'bg-card border-2 border-border text-card-foreground hover:border-accent'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full bg-card border-2 border-border text-card-foreground font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent hover:text-accent enabled:hover:border-accent"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Current Page Info */}
              {totalPages > 1 && (
                <div className="text-center text-card-foreground/60 text-sm mb-8">
                  Page {currentPage} of {totalPages} ({filteredFiles.length} total files)
                </div>
              )}
            </>
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
