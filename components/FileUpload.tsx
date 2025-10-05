
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload, disabled]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const borderClass = isDragging 
    ? 'border-indigo-600 bg-indigo-50' 
    : 'border-slate-300 hover:border-slate-400';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        htmlFor="file-upload"
        className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center transition-colors duration-200 ${borderClass} ${disabled ? 'cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
      >
        <div 
          className="absolute inset-0"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        ></div>
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            <UploadCloudIcon className="w-12 h-12 text-slate-400" />
            <div className="flex text-sm text-slate-600">
                <span className="font-semibold text-indigo-600">Upload an Excel file</span>
                <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-slate-500">.XLSX or .XLS up to 10MB</p>
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" disabled={disabled} />
      </label>
    </div>
  );
};
