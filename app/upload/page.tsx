'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Download, Lock, Globe } from 'lucide-react';

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [filePassword, setFilePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileName) return;

    setIsSubmitting(true);
    // Simulate file upload
    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedFile(null);
      setFileName('');
      setDescription('');
      setIsPublic(false);
      setFilePassword('');
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header showBack title="Upload a file" />

      <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8">
        {/* Left Column - Upload Zone */}
        <div className="flex-1 flex flex-col">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex-1 flex flex-col gap-6"
          >
          <h2 className="text-3xl font-bold text-foreground">Upload a file</h2>

          <div className="relative rounded-3xl p-12 border-4 border-dashed border-border/50 cursor-pointer transition-all duration-300 flex items-center justify-center min-h-96 overflow-hidden group"
            style={{
              backgroundColor: isDragging ? 'rgba(184, 134, 11, 0.1)' : 'rgba(240, 218, 170, 0.3)',
              borderColor: isDragging ? '#B8860B' : '',
            }}
          >
            {/* Animated background gradient on drag */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
              animation: isDragging ? 'gradient-shift 2s ease-in-out infinite' : 'none'
            }}></div>

            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
              boxShadow: isDragging ? 'inset 0 0 30px rgba(184, 134, 11, 0.2)' : 'none'
            }}></div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />

            <div className="relative z-10">
              {selectedFile ? (
                <div className="text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-accent/40 to-accent/20 flex items-center justify-center" style={{
                    animation: 'subtle-3d 4s ease-in-out infinite'
                  }}>
                    <FileText className="w-8 h-8 text-accent animate-bounce" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-foreground/60">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <img
                    src="/bean.svg"
                    alt="Bean mascot"
                    className="w-20 h-20 mx-auto mb-4 opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
                    style={{
                      animation: 'float 2.5s ease-in-out infinite'
                    }}
                  />
                  <p className="text-3xl font-bold text-foreground mb-2 transition-all duration-300 group-hover:text-accent">
                    Click{' '}
                    <span className="text-accent transition-all duration-300 group-hover:scale-125 inline-block">Me</span>
                  </p>
                  <p className="text-foreground/60 transition-all duration-300 group-hover:text-foreground/80">
                    or drag and drop your file here
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedFile && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-6 w-full bg-input text-foreground hover:bg-muted rounded-full py-6 font-bold text-lg"
            >
              {isSubmitting ? 'Uploading...' : 'SUBMIT'}
            </Button>
          )}
          </div>
        </div>

        {/* Right Column - Details Form */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-3xl font-bold text-foreground mb-8 relative">
            Details
            <div className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-accent to-transparent w-16 rounded-full" style={{
              animation: 'gradient-shift 3s ease-in-out infinite'
            }}></div>
          </h2>

          <div className="relative bg-card rounded-3xl p-8 border-2 border-card flex-1 flex flex-col gap-6 overflow-hidden group" style={{
            boxShadow: '0 10px 40px rgba(184, 134, 11, 0.08)'
          }}>
            {/* Hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            {/* File Name */}
            <div className="relative z-10">
              <label className="block text-card-foreground font-semibold mb-3">
                Filename:
              </label>
              <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
                className="w-full bg-input text-foreground border-border rounded-full px-6 py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              {fileName && (
                <p className="text-xs text-foreground/50 mt-2">
                  {fileName.length} characters
                </p>
              )}
            </div>

            {/* Description */}
            <div className="relative z-10 flex-1 flex flex-col">
              <label className="block text-card-foreground font-semibold mb-3">
                Description:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                className="flex-1 bg-input text-foreground border-2 border-border rounded-2xl px-6 py-4 placeholder:text-foreground/40 focus:border-accent focus:ring-2 focus:ring-accent/30 resize-none"
              />
            </div>

            {/* File Info Display */}
            {selectedFile && (
              <div className="space-y-2 bg-foreground/5 rounded-xl p-4">
                <p className="text-sm text-foreground/70">
                  <span className="font-semibold">File size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-foreground/70">
                  <span className="font-semibold">File type:</span> {selectedFile.type || 'Unknown'}
                </p>
              </div>
            )}

            {/* Access Control Section */}
            <div className="relative z-10 space-y-4 border-t border-border pt-6">
              {/* Public Toggle */}
              <div className="bg-foreground/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-accent" />
                    <span className="text-card-foreground font-semibold">Public</span>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    className="bg-accent/30 data-[state=checked]:bg-accent"
                  />
                </div>
                <p className="text-xs text-card-foreground/60 ml-8">
                  {isPublic ? 'Anyone with the link can access this file' : 'File is private - only you can access'}
                </p>
              </div>

              {/* Password Protection */}
              <div className="mt-4">
                <label className="block text-card-foreground font-semibold mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-accent" />
                    Protection Password
                  </div>
                </label>
                <Input
                  type="password"
                  value={filePassword}
                  onChange={(e) => setFilePassword(e.target.value)}
                  placeholder="Set a password (optional)"
                  className="w-full bg-input text-foreground border-border rounded-full px-6 py-3 focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
                <p className="text-xs text-card-foreground/60 mt-2">
                  Require a password to download this file
                </p>
              </div>
            </div>

            {/* Save Button (for details) */}
            <Button
              className="w-full bg-input text-foreground hover:bg-muted rounded-full py-3 font-bold"
              disabled={!fileName}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
