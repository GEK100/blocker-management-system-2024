import React, { useState, useEffect } from 'react';
import { gdprAPI } from '../api/gdpr-api';
import './DataExportTool.css';

const DataExportTool = ({ user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  const exportFormats = [
    { value: 'json', label: 'JSON', description: 'Machine-readable format' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet format' },
    { value: 'pdf', label: 'PDF', description: 'Human-readable format' }
  ];

  useEffect(() => {
    loadExportHistory();
  }, [user]);

  const loadExportHistory = async () => {
    try {
      const requests = await gdprAPI.getUserGDPRRequests(user.id);
      const exportRequests = requests.filter(r => r.request_type === 'export');
      setExportHistory(exportRequests);
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  const generateExport = async () => {
    setLoading(true);
    try {
      const userData = await gdprAPI.exportUserData(user.id);

      // Filter by date range if specified
      if (dateRange.startDate) {
        userData.data = filterDataByDateRange(userData.data, dateRange.startDate, dateRange.endDate);
      }

      setExportData(userData);

      // Submit export request for tracking
      await gdprAPI.submitGDPRRequest(user.id, 'export', {
        format: selectedFormat,
        includeDeleted: includeDeleted,
        dateRange: dateRange
      });

      // Refresh export history
      await loadExportHistory();
    } catch (error) {
      console.error('Error generating export:', error);
      alert('Failed to generate data export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterDataByDateRange = (data, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date

    const filteredData = { ...data };

    // Filter arrays by date
    const dateFilterArrays = ['blockers', 'statusHistory', 'auditLogs', 'gdprRequests'];

    dateFilterArrays.forEach(key => {
      if (filteredData[key]) {
        filteredData[key] = filteredData[key].filter(item => {
          const itemDate = new Date(item.created_at || item.updated_at || item.timestamp);
          return itemDate >= start && itemDate <= end;
        });
      }
    });

    return filteredData;
  };

  const downloadExport = () => {
    if (!exportData) return;

    let content;
    let filename;
    let mimeType;

    switch (selectedFormat) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        content = convertToCSV(exportData);
        filename = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;

      case 'pdf':
        // For PDF, we'll generate a formatted text version
        content = convertToPDFText(exportData);
        filename = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;

      default:
        content = JSON.stringify(exportData, null, 2);
        filename = `user-data-export-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    const csvSections = [];

    // Profile data
    if (data.data.profile) {
      csvSections.push('Profile Information');
      csvSections.push(objectToCSV([data.data.profile]));
      csvSections.push('');
    }

    // Companies data
    if (data.data.companies && data.data.companies.length > 0) {
      csvSections.push('Companies');
      csvSections.push(objectToCSV(data.data.companies));
      csvSections.push('');
    }

    // Projects data
    if (data.data.projects && data.data.projects.length > 0) {
      csvSections.push('Projects');
      csvSections.push(objectToCSV(data.data.projects));
      csvSections.push('');
    }

    // Blockers data
    if (data.data.blockers && data.data.blockers.length > 0) {
      csvSections.push('Blockers');
      csvSections.push(objectToCSV(data.data.blockers));
      csvSections.push('');
    }

    return csvSections.join('\n');
  };

  const objectToCSV = (objects) => {
    if (!objects || objects.length === 0) return '';

    const headers = Object.keys(objects[0]);
    const csvContent = [
      headers.join(','),
      ...objects.map(obj =>
        headers.map(header => {
          const value = obj[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/"/g, '""');
        }).map(field => `"${field}"`).join(',')
      )
    ];

    return csvContent.join('\n');
  };

  const convertToPDFText = (data) => {
    const sections = [];

    sections.push('PERSONAL DATA EXPORT');
    sections.push('===================');
    sections.push(`Export Date: ${data.exportedAt}`);
    sections.push(`User ID: ${data.userId}`);
    sections.push('');

    if (data.data.profile) {
      sections.push('PROFILE INFORMATION');
      sections.push('-------------------');
      Object.entries(data.data.profile).forEach(([key, value]) => {
        sections.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      });
      sections.push('');
    }

    if (data.data.companies && data.data.companies.length > 0) {
      sections.push('COMPANIES');
      sections.push('---------');
      data.data.companies.forEach((company, index) => {
        sections.push(`Company ${index + 1}:`);
        Object.entries(company).forEach(([key, value]) => {
          sections.push(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        });
        sections.push('');
      });
    }

    if (data.data.blockers && data.data.blockers.length > 0) {
      sections.push('BLOCKERS');
      sections.push('--------');
      data.data.blockers.forEach((blocker, index) => {
        sections.push(`Blocker ${index + 1}:`);
        Object.entries(blocker).forEach(([key, value]) => {
          sections.push(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        });
        sections.push('');
      });
    }

    return sections.join('\n');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      completed: '#10b981',
      failed: '#ef4444'
    };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: statusColors[status] || '#6b7280' }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="data-export-tool">
      <div className="export-header">
        <h2>Export Your Data</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="export-content">
        <div className="export-options">
          <h3>Export Options</h3>

          <div className="option-group">
            <label>Export Format:</label>
            <div className="format-options">
              {exportFormats.map(format => (
                <label key={format.value} className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  />
                  <div className="format-info">
                    <strong>{format.label}</strong>
                    <span>{format.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="option-group">
            <label>Date Range (Optional):</label>
            <div className="date-range">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                placeholder="Start date"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                placeholder="End date"
              />
            </div>
          </div>

          <div className="option-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              Include deleted records (where available)
            </label>
          </div>

          <div className="export-actions">
            <button
              onClick={generateExport}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Generating...' : 'Generate Export'}
            </button>

            {exportData && (
              <button
                onClick={downloadExport}
                className="btn-secondary"
              >
                Download Export
              </button>
            )}
          </div>
        </div>

        {exportData && (
          <div className="export-preview">
            <h3>Export Preview</h3>
            <div className="preview-stats">
              <div className="stat">
                <span className="stat-label">Profile Data:</span>
                <span className="stat-value">✓ Included</span>
              </div>
              <div className="stat">
                <span className="stat-label">Companies:</span>
                <span className="stat-value">{exportData.data.companies?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Projects:</span>
                <span className="stat-value">{exportData.data.projects?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Blockers:</span>
                <span className="stat-value">{exportData.data.blockers?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Audit Logs:</span>
                <span className="stat-value">{exportData.data.auditLogs?.length || 0}</span>
              </div>
            </div>
          </div>
        )}

        <div className="export-history">
          <h3>Export History</h3>
          {exportHistory.length > 0 ? (
            <div className="history-list">
              {exportHistory.map((request) => (
                <div key={request.id} className="history-item">
                  <div className="history-info">
                    <div className="history-date">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    <div className="history-details">
                      Format: {request.additional_info?.format || 'JSON'}
                      {request.additional_info?.dateRange?.startDate && (
                        <span> | Date range: {request.additional_info.dateRange.startDate} to {request.additional_info.dateRange.endDate}</span>
                      )}
                    </div>
                  </div>
                  <div className="history-status">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <p>No export history found.</p>
            </div>
          )}
        </div>

        <div className="export-info">
          <h3>What's Included</h3>
          <ul>
            <li>Your profile information and account settings</li>
            <li>Companies you own or are associated with</li>
            <li>Projects you have access to</li>
            <li>Blockers you've created or been assigned</li>
            <li>Status changes and updates you've made</li>
            <li>Audit logs of your activities</li>
            <li>Your GDPR consent preferences</li>
            <li>Previous data export requests</li>
          </ul>

          <div className="legal-note">
            <p><strong>Legal Note:</strong> This export includes all personal data we have associated with your account.
            The data is provided in accordance with GDPR Article 20 (Right to Data Portability).
            You can use this data to transfer your information to another service or for your own records.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportTool;