import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { api } from '../services/api';

export default function ImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "ticket_id,participant_name,email,phone\n" +
      "ILM-KMCT-MUTD4OFR-2F58F8,Alan Albin,alan@kmct.edu.in,9876543210\n" +
      "ILM-KMCT-MUTEM1C5-8B8FC3,Devanand P,devanand@kmct.edu.in,9876543211\n" +
      "ILM-KMCT-MUTEJ7K1-9F2D3A,Fathima Ranya,ranya@kmct.edu.in,9876543212\n" +
      "ILM-KMCT-MUTXTA94-0A5E67,Mohammed Nihal,nihal@kmct.edu.in,9876543213\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "illuminate_sample_tickets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
      setReport(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.importCsv(file);
      setReport(res);
      if (res.importedCount > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'CSV Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-purple-500/30 p-6 shadow-glow-purple-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-purple-400" />
              Import Existing Registrations
            </h3>
            <p className="text-xs text-purple-300/70 mt-0.5">
              Bulk import existing ticket IDs via CSV file.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-purple-400 hover:text-white rounded-full hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CSV Format Notice */}
        <div className="mt-4 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-start justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-purple-200 block mb-1">Expected CSV Formats:</span>
            <div className="flex flex-col gap-1">
              <code className="text-purple-300 font-mono text-[11px] bg-dark-950 px-2 py-0.5 rounded border border-purple-900/50">
                Standard: ticket_id,participant_name,email,phone
              </code>
              <span className="text-[10px] text-emerald-400 font-medium">
                ✓ Google Sheet CSV export is also supported directly
              </span>
            </div>
          </div>
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sample CSV</span>
          </button>
        </div>

        {/* File Dropzone */}
        <div className="mt-4 border-2 border-dashed border-purple-700/40 hover:border-purple-500/70 rounded-2xl p-6 text-center transition-colors bg-dark-950/40">
          <input
            type="file"
            id="csv-file-input"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block">
            <FileText className="w-10 h-10 text-purple-400 mx-auto mb-2" />
            {file ? (
              <span className="font-medium text-white text-sm block">
                Selected: <span className="text-purple-300">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <div>
                <span className="font-medium text-purple-200 text-sm block">
                  Click to browse or drag & drop CSV file
                </span>
                <span className="text-xs text-purple-400/60 mt-1 block">
                  Only UTF-8 formatted CSV files supported
                </span>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 flex items-center gap-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report Output */}
        {report && (
          <div className="mt-4 p-4 rounded-2xl bg-dark-950 border border-purple-800/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Import Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-900/50">
                <span className="text-purple-300/70 block">Imported</span>
                <span className="text-base font-bold text-emerald-400">{report.importedCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-900/50">
                <span className="text-purple-300/70 block">Duplicates</span>
                <span className="text-base font-bold text-amber-400">{report.duplicateCount}</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-900/50">
                <span className="text-purple-300/70 block">Errors</span>
                <span className="text-base font-bold text-red-400">{report.errorCount}</span>
              </div>
            </div>

            {report.errors?.length > 0 && (
              <div className="max-h-28 overflow-y-auto p-2 rounded-xl bg-red-950/20 border border-red-900/30 text-[11px] text-red-300 space-y-1">
                {report.errors.map((err, i) => (
                  <div key={i}>&bull; {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-purple-300 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? 'Processing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
