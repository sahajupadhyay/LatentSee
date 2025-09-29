'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { usePerformanceDashboard } from '@/lib/context/PerformanceDashboardContext';
import { format } from 'date-fns';

interface DataExportProps {
  showQuickExport?: boolean;
  showAdvancedOptions?: boolean;
}

type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';
type ExportScope = 'all' | 'current' | 'custom';

interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeMetadata: boolean;
  includeAnalytics: boolean;
  includeStatistics: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
  selectedModels: string[];
}

const exportFormats = [
  { 
    id: 'csv' as const, 
    label: 'CSV (Excel Compatible)', 
    icon: Icons.FileSpreadsheet,
    description: 'Comma-separated values for spreadsheet analysis',
    academic: true
  },
  { 
    id: 'json' as const, 
    label: 'JSON (API Format)', 
    icon: Icons.FileCode,
    description: 'Structured data for programmatic analysis',
    academic: true
  },
  { 
    id: 'xlsx' as const, 
    label: 'Excel Workbook', 
    icon: Icons.FileSpreadsheet,
    description: 'Native Excel format with multiple sheets',
    academic: false,
    comingSoon: true
  },
  { 
    id: 'pdf' as const, 
    label: 'Research Report', 
    icon: Icons.FileText,
    description: 'Academic report with charts and analysis',
    academic: true,
    comingSoon: true
  }
];

const scopeOptions = [
  { 
    id: 'all' as const, 
    label: 'All Data', 
    description: 'Export complete performance dataset'
  },
  { 
    id: 'current' as const, 
    label: 'Current View', 
    description: 'Export data matching current filters'
  },
  { 
    id: 'custom' as const, 
    label: 'Custom Range', 
    description: 'Select specific time range and models'
  }
];

// Quick action buttons
const QuickExportButtons = ({ onExport }: { onExport: (options: ExportOptions) => void }) => {
  const { state } = usePerformanceDashboard();

  const quickExportOptions: ExportOptions[] = [
    {
      format: 'csv',
      scope: 'all',
      includeMetadata: true,
      includeAnalytics: true,
      includeStatistics: false,
      selectedModels: state.selectedModels
    },
    {
      format: 'json',
      scope: 'current',
      includeMetadata: true,
      includeAnalytics: true,
      includeStatistics: true,
      selectedModels: state.selectedModels
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {quickExportOptions.map((options, index) => {
        const format = exportFormats.find(f => f.id === options.format)!;
        const IconComponent = format.icon;
        
        return (
          <motion.button
            key={index}
            onClick={() => onExport(options)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-4 bg-primary-800/30 hover:bg-primary-700/40 border border-primary-600/20 hover:border-accent-400/40 rounded-xl transition-all duration-200 text-left"
          >
            <div className="p-2 bg-accent-500/20 rounded-lg">
              <IconComponent className="w-5 h-5 text-accent-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white text-sm">
                Quick {format.label}
              </div>
              <div className="text-xs text-neutral-400">
                {options.scope === 'all' ? 'All data' : 'Current view'} • {state.metrics.length} records
              </div>
            </div>
            <Icons.Download className="w-4 h-4 text-neutral-400" />
          </motion.button>
        );
      })}
    </div>
  );
};

// Advanced export configuration
const AdvancedExportConfig = ({ 
  options, 
  onChange, 
  onExport 
}: { 
  options: ExportOptions;
  onChange: (options: ExportOptions) => void;
  onExport: (options: ExportOptions) => void;
}) => {
  const { state } = usePerformanceDashboard();

  const handleChange = (key: keyof ExportOptions, value: any) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <h4 className="font-semibold text-white mb-3">Export Format</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exportFormats.map((format) => {
            const IconComponent = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => handleChange('format', format.id)}
                disabled={format.comingSoon}
                className={`flex items-center gap-3 p-4 border rounded-xl transition-all text-left ${
                  options.format === format.id
                    ? 'bg-accent-500/20 border-accent-400 text-white'
                    : 'bg-primary-800/30 border-primary-600/20 hover:border-primary-500/40 text-neutral-300'
                } ${format.comingSoon ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                <IconComponent className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">
                    {format.label}
                    {format.comingSoon && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-75">{format.description}</div>
                </div>
                {format.academic && (
                  <Icons.GraduationCap className="w-4 h-4 text-accent-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope Selection */}
      <div>
        <h4 className="font-semibold text-white mb-3">Data Scope</h4>
        <div className="space-y-2">
          {scopeOptions.map((scope) => (
            <button
              key={scope.id}
              onClick={() => handleChange('scope', scope.id)}
              className={`flex items-center justify-between w-full p-3 border rounded-lg transition-all text-left ${
                options.scope === scope.id
                  ? 'bg-accent-500/20 border-accent-400 text-white'
                  : 'bg-primary-800/30 border-primary-600/20 hover:border-primary-500/40 text-neutral-300'
              }`}
            >
              <div>
                <div className="font-medium">{scope.label}</div>
                <div className="text-xs opacity-75">{scope.description}</div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                {options.scope === scope.id && (
                  <div className="w-2 h-2 rounded-full bg-accent-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      {options.scope !== 'all' && (
        <div>
          <h4 className="font-semibold text-white mb-3">Models to Include</h4>
          <div className="space-y-2">
            {['Neural Authority', 'Neural Cache', 'Smart Memory'].map((model) => (
              <label
                key={model}
                className="flex items-center gap-3 p-3 bg-primary-800/30 border border-primary-600/20 rounded-lg hover:border-primary-500/40 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={options.selectedModels.includes(model)}
                  onChange={(e) => {
                    const newModels = e.target.checked
                      ? [...options.selectedModels, model]
                      : options.selectedModels.filter(m => m !== model);
                    handleChange('selectedModels', newModels);
                  }}
                  className="w-4 h-4 rounded border-primary-500 bg-primary-700 text-accent-500 focus:ring-accent-500 focus:ring-2"
                />
                <span className="text-white">{model}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Include Options */}
      <div>
        <h4 className="font-semibold text-white mb-3">Include in Export</h4>
        <div className="space-y-2">
          {[
            { key: 'includeMetadata', label: 'Request Metadata', description: 'IDs, timestamps, headers' },
            { key: 'includeAnalytics', label: 'Performance Analytics', description: 'Hit rates, efficiency metrics' },
            { key: 'includeStatistics', label: 'Statistical Analysis', description: 'Mean, median, standard deviation' }
          ].map((option) => (
            <label
              key={option.key}
              className="flex items-center gap-3 p-3 bg-primary-800/30 border border-primary-600/20 rounded-lg hover:border-primary-500/40 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={options[option.key as keyof ExportOptions] as boolean}
                onChange={(e) => handleChange(option.key as keyof ExportOptions, e.target.checked)}
                className="w-4 h-4 rounded border-primary-500 bg-primary-700 text-accent-500 focus:ring-accent-500 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-white font-medium">{option.label}</div>
                <div className="text-xs text-neutral-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <motion.button
        onClick={() => onExport(options)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={options.selectedModels.length === 0}
        className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 disabled:from-neutral-600 disabled:to-neutral-700 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
      >
        <Icons.Download className="w-5 h-5" />
        Export {exportFormats.find(f => f.id === options.format)?.label}
        {state.metrics.length > 0 && (
          <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
            {state.metrics.length} records
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default function DataExport({ 
  showQuickExport = true,
  showAdvancedOptions = true 
}: DataExportProps) {
  const { state, exportToCSV, exportToJSON } = usePerformanceDashboard();
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [advancedOptions, setAdvancedOptions] = useState<ExportOptions>({
    format: 'csv',
    scope: 'all',
    includeMetadata: true,
    includeAnalytics: true,
    includeStatistics: false,
    selectedModels: state.selectedModels
  });

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (options: ExportOptions) => {
    if (state.metrics.length === 0) {
      setExportStatus({
        type: 'error',
        message: 'No data available to export. Run some API tests first.'
      });
      return;
    }

    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      let content: string;
      let filename: string;
      let contentType: string;

      if (options.format === 'csv') {
        content = exportToCSV();
        filename = `latentsee_performance_${timestamp}.csv`;
        contentType = 'text/csv';
      } else if (options.format === 'json') {
        content = exportToJSON();
        filename = `latentsee_performance_${timestamp}.json`;
        contentType = 'application/json';
      } else {
        throw new Error('Export format not yet implemented');
      }

      downloadFile(content, filename, contentType);
      
      setExportStatus({
        type: 'success',
        message: `Successfully exported ${state.metrics.length} records as ${options.format.toUpperCase()}`
      });

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExporting(false);
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setExportStatus({ type: null, message: '' });
      }, 5000);
    }
  };

  const dataStats = useMemo(() => {
    if (state.metrics.length === 0) return null;
    
    const dateRange = {
      start: new Date(Math.min(...state.metrics.map(m => m.timestamp.getTime()))),
      end: new Date(Math.max(...state.metrics.map(m => m.timestamp.getTime())))
    };

    const modelCounts = state.metrics.reduce((acc, metric) => {
      acc[metric.modelName] = (acc[metric.modelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRecords: state.metrics.length,
      dateRange,
      modelCounts
    };
  }, [state.metrics]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary-900/50 backdrop-blur-sm border border-primary-700/30 rounded-2xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icons.Download className="w-6 h-6 text-accent-400" />
          <div>
            <h3 className="text-xl font-heading font-semibold text-white">
              Data Export & Research Tools
            </h3>
            <p className="text-sm text-neutral-400">
              Export performance data for academic analysis
            </p>
          </div>
        </div>
        
        {showAdvancedOptions && (
          <button
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700/30 hover:bg-primary-600/40 border border-primary-600/20 hover:border-primary-500/40 rounded-lg transition-all text-sm text-neutral-300 hover:text-white"
          >
            <Icons.Settings className="w-4 h-4" />
            {isAdvancedMode ? 'Quick Export' : 'Advanced Options'}
          </button>
        )}
      </div>

      {/* Data Statistics */}
      {dataStats && (
        <div className="bg-primary-800/30 rounded-xl p-4 mb-6 border border-primary-600/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent-400">
                {dataStats.totalRecords}
              </div>
              <div className="text-sm text-neutral-400">Total Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-400">
                {Object.keys(dataStats.modelCounts).length}
              </div>
              <div className="text-sm text-neutral-400">Models</div>
            </div>
            <div>
              <div className="text-lg font-bold text-accent-400">
                {format(dataStats.dateRange.start, 'MMM dd')}
              </div>
              <div className="text-sm text-neutral-400">Start Date</div>
            </div>
            <div>
              <div className="text-lg font-bold text-accent-400">
                {format(dataStats.dateRange.end, 'MMM dd')}
              </div>
              <div className="text-sm text-neutral-400">End Date</div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      <AnimatePresence>
        {exportStatus.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border mb-6 ${
              exportStatus.type === 'success'
                ? 'bg-green-500/20 border-green-400/40 text-green-300'
                : 'bg-red-500/20 border-red-400/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {exportStatus.type === 'success' ? (
                <Icons.CheckCircle className="w-5 h-5" />
              ) : (
                <Icons.AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{exportStatus.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isExporting && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-accent-400">
            <div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Exporting data...</span>
          </div>
        </div>
      )}

      {/* Export Interface */}
      {!isExporting && (
        <AnimatePresence mode="wait">
          {!isAdvancedMode && showQuickExport ? (
            <motion.div
              key="quick"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <QuickExportButtons onExport={handleExport} />
            </motion.div>
          ) : (
            <motion.div
              key="advanced"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AdvancedExportConfig
                options={advancedOptions}
                onChange={setAdvancedOptions}
                onExport={handleExport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary-700/30">
        <div className="text-sm text-neutral-400">
          Academic research data export • Compatible with statistical software
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Icons.Shield className="w-4 h-4" />
          Privacy-safe local download
        </div>
      </div>
    </motion.div>
  );
}