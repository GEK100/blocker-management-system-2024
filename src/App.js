import React, { useState, useRef } from 'react';
import { Camera, MapPin, Send, Eye, CheckCircle, Clock, AlertTriangle, User, LogOut, Plus, Filter, Search } from 'lucide-react';

// Mock data for demonstration
const mockUser = {
  id: 1,
  name: "John Smith",
  role: "supervisor",
  email: "john@construction.com",
  company: "ABC Electrical Ltd",
  phone: "+44 7700 900123"
};

const mockContractors = [
  { id: 1, name: "ABC Electrical Ltd", type: "electrical", contact: "john@abcelectrical.com" },
  { id: 2, name: "PlumbPro Services", type: "plumbing", contact: "info@plumbpro.com" },
  { id: 3, name: "BuildRight Construction", type: "general", contact: "jobs@buildright.com" },
  { id: 4, name: "SteelWorks Ltd", type: "structural", contact: "contact@steelworks.com" },
  { id: 5, name: "FloorMasters", type: "flooring", contact: "bookings@floormasters.com" }
];

// Pre-uploaded site drawings
const siteDrawings = [
  { id: 1, name: "Ground Floor", filename: "GF_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 2, name: "1st Floor", filename: "1F_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 3, name: "2nd Floor", filename: "2F_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 4, name: "Basement", filename: "Basement_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" },
  { id: 5, name: "Roof Plan", filename: "Roof_Plan.pdf", uploadedAt: "2025-01-15", url: "/api/placeholder/800/600" }
];

// Authorized users (pre-loaded from admin panel)
const authorizedUsers = [
  { id: 1, name: "John Smith", company: "ABC Electrical Ltd", role: "supervisor", email: "john@abcelectrical.com", phone: "+44 7700 900123" },
  { id: 2, name: "Sarah Wilson", company: "PlumbPro Services", role: "foreman", email: "sarah@plumbpro.com", phone: "+44 7700 900124" },
  { id: 3, name: "Mike Johnson", company: "BuildRight Construction", role: "site_manager", email: "mike@buildright.com", phone: "+44 7700 900125" },
  { id: 4, name: "Emma Davis", company: "SteelWorks Ltd", role: "supervisor", email: "emma@steelworks.com", phone: "+44 7700 900126" },
  { id: 5, name: "Tom Brown", company: "FloorMasters", role: "team_lead", email: "tom@floormasters.com", phone: "+44 7700 900127" }
];

const mockBlockers = [
  {
    id: 1,
    ticketNumber: "BLK-2025-001",
    title: "Ceiling access blocked by pipes",
    description: "Cannot install light fixtures due to exposed plumbing blocking access",
    photo: "/api/placeholder/300/200",
    location: { x: 150, y: 200 },
    floor: "1st Floor",
    status: "open",
    priority: "high",
    createdBy: "John Smith",
    createdByCompany: "ABC Electrical Ltd",
    assignedTo: null,
    createdAt: "2025-01-20T10:30:00Z",
    dueDate: "2025-01-25T17:00:00Z",
    statusHistory: [
      {
        status: "submitted",
        timestamp: "2025-01-20T10:30:00Z",
        user: "John Smith (ABC Electrical Ltd)",
        action: "Blocker submitted to main contractor"
      }
    ]
  },
  {
    id: 2,
    ticketNumber: "BLK-2025-002",
    title: "Power not isolated in panel room",
    description: "Electrical panel still live, cannot proceed with wall modifications",
    photo: "/api/placeholder/300/200",
    location: { x: 300, y: 150 },
    floor: "Ground Floor",
    status: "assigned",
    priority: "critical",
    createdBy: "Sarah Wilson",
    createdByCompany: "PlumbPro Services",
    assignedTo: "ABC Electrical Ltd",
    createdAt: "2025-01-19T14:15:00Z",
    dueDate: "2025-01-22T09:00:00Z",
    statusHistory: [
      {
        status: "submitted",
        timestamp: "2025-01-19T14:15:00Z",
        user: "Sarah Wilson (PlumbPro Services)",
        action: "Blocker submitted to main contractor"
      },
      {
        status: "reviewed",
        timestamp: "2025-01-19T15:30:00Z",
        user: "Main Contractor",
        action: "Blocker reviewed and categorized"
      },
      {
        status: "assigned",
        timestamp: "2025-01-19T15:45:00Z",
        user: "Main Contractor",
        action: "Assigned to ABC Electrical Ltd"
      }
    ]
  }
];

const BlockersApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [blockers, setBlockers] = useState(mockBlockers);
  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [isCreatingBlocker, setIsCreatingBlocker] = useState(false);
  const [newBlocker, setNewBlocker] = useState({
    title: '',
    description: '',
    photo: null,
    location: null,
    priority: 'medium',
    selectedFloor: ''
  });
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isPinModeActive, setIsPinModeActive] = useState(false);
  const [tempPinLocation, setTempPinLocation] = useState(null);
  const [drawingTransform, setDrawingTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [lastTouch, setLastTouch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const drawingRef = useRef(null);

  const statusColors = {
    open: 'bg-red-100 text-red-800 border-red-200',
    assigned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200'
  };

  const priorityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };

  const filteredBlockers = blockers.filter(blocker => {
    const matchesStatus = filterStatus === 'all' || blocker.status === filterStatus;
    const matchesSearch = blocker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blocker.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewBlocker(prev => ({ ...prev, photo: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e) => {
    if (!isCreatingBlocker || !isPinModeActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - drawingTransform.translateX) / drawingTransform.scale;
    const y = (e.clientY - rect.top - drawingTransform.translateY) / drawingTransform.scale;

    setTempPinLocation({ x, y });
  };

  const handleTouchStart = (e) => {
    if (isPinModeActive) return; // Don't interfere with pin mode

    if (e.touches.length === 1) {
      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (isPinModeActive) return;

    if (e.touches.length === 1 && lastTouch) {
      // Single finger - pan
      const deltaX = e.touches[0].clientX - lastTouch.x;
      const deltaY = e.touches[0].clientY - lastTouch.y;

      setDrawingTransform(prev => ({
        ...prev,
        translateX: prev.translateX + deltaX,
        translateY: prev.translateY + deltaY
      }));

      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      });
    } else if (e.touches.length === 2) {
      // Two fingers - zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastTouch && lastTouch.distance) {
        const scaleChange = distance / lastTouch.distance;
        setDrawingTransform(prev => ({
          ...prev,
          scale: Math.max(0.5, Math.min(3, prev.scale * scaleChange))
        }));
      }

      setLastTouch({
        distance,
        time: Date.now()
      });
    }
  };

  const handleTouchEnd = () => {
    setLastTouch(null);
  };

  const resetDrawingView = () => {
    setDrawingTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  };

  const zoomIn = () => {
    setDrawingTransform(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setDrawingTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, prev.scale / 1.2)
    }));
  };

  const activatePinMode = () => {
    setIsPinModeActive(true);
    setTempPinLocation(null);
  };

  const confirmPin = () => {
    if (tempPinLocation) {
      setNewBlocker(prev => ({ ...prev, location: tempPinLocation }));
      setIsPinModeActive(false);
      setTempPinLocation(null);
    }
  };

  const cancelPin = () => {
    setIsPinModeActive(false);
    setTempPinLocation(null);
  };

  const clearPin = () => {
    setNewBlocker(prev => ({ ...prev, location: null }));
    setIsPinModeActive(false);
    setTempPinLocation(null);
  };

  const handleFloorSelection = (floorName) => {
    const drawing = siteDrawings.find(d => d.name === floorName);
    setSelectedDrawing(drawing);
    setNewBlocker(prev => ({ ...prev, selectedFloor: floorName, location: null }));
    setIsPinModeActive(false);
    setTempPinLocation(null);
    setDrawingTransform({
      scale: 1,
      translateX: 0,
      translateY: 0
    });
  };

  const submitBlocker = () => {
    if (!newBlocker.title || !newBlocker.description || !newBlocker.location || !newBlocker.selectedFloor) {
      alert('Please fill in all required fields, select a floor, and mark the location on the drawing');
      return;
    }

    const ticketNumber = `BLK-${new Date().getFullYear()}-${String(blockers.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const blocker = {
      ...newBlocker,
      id: Date.now(),
      ticketNumber,
      status: 'open',
      createdBy: mockUser.name,
      createdByCompany: mockUser.company,
      floor: newBlocker.selectedFloor,
      assignedTo: null,
      createdAt: now,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      statusHistory: [
        {
          status: "submitted",
          timestamp: now,
          user: `${mockUser.name} (${mockUser.company})`,
          action: "Blocker submitted to main contractor"
        }
      ]
    };

    setBlockers(prev => [blocker, ...prev]);
    setNewBlocker({ title: '', description: '', photo: null, location: null, priority: 'medium', selectedFloor: '' });
    setSelectedDrawing(null);
    setIsPinModeActive(false);
    setTempPinLocation(null);
    setIsCreatingBlocker(false);
    setCurrentView('dashboard');

    alert(`🚨 Telegram notification sent to main contractor!\nTicket Number: ${ticketNumber}\nFloor: ${newBlocker.selectedFloor}`);
  };

  const assignBlocker = (blockerId, contractorName) => {
    const now = new Date().toISOString();
    setBlockers(prev => prev.map(blocker =>
      blocker.id === blockerId
        ? {
            ...blocker,
            status: 'assigned',
            assignedTo: contractorName,
            statusHistory: [
              ...blocker.statusHistory,
              {
                status: "assigned",
                timestamp: now,
                user: "Main Contractor",
                action: `Assigned to ${contractorName}`
              }
            ]
          }
        : blocker
    ));

    alert(`📋 Telegram notification sent to ${contractorName}!`);
  };

  const updateBlockerStatus = (blockerId, newStatus) => {
    const now = new Date().toISOString();
    setBlockers(prev => prev.map(blocker =>
      blocker.id === blockerId
        ? {
            ...blocker,
            status: newStatus,
            statusHistory: [
              ...blocker.statusHistory,
              {
                status: newStatus,
                timestamp: now,
                user: blocker.assignedTo || "Contractor",
                action: newStatus === 'resolved' ? 'Marked as resolved' : `Status updated to ${newStatus}`
              }
            ]
          }
        : blocker
    ));
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Blockers</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockers.filter(b => b.status === 'open').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockers.filter(b => b.status === 'assigned').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {blockers.filter(b => b.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{blockers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search blockers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* Blockers List */}
      <div className="space-y-4">
        {filteredBlockers.map(blocker => (
          <div key={blocker.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{blocker.title}</h3>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {blocker.ticketNumber}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${priorityColors[blocker.priority]}`} title={`${blocker.priority} priority`}></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[blocker.status]}`}>
                    {blocker.status.charAt(0).toUpperCase() + blocker.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{blocker.description}</p>
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 text-sm text-gray-500">
                  <span>Created by: {blocker.createdBy} ({blocker.createdByCompany})</span>
                  <span>Floor: {blocker.floor}</span>
                  {blocker.assignedTo && <span>Assigned to: {blocker.assignedTo}</span>}
                  <span>Due: {new Date(blocker.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <button
                  onClick={() => setSelectedBlocker(blocker)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </button>
                {blocker.status === 'open' && (
                  <select
                    onChange={(e) => assignBlocker(blocker.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                    defaultValue=""
                  >
                    <option value="" disabled>Assign to...</option>
                    {mockContractors.map(contractor => (
                      <option key={contractor.id} value={contractor.name}>
                        {contractor.name}
                      </option>
                    ))}
                  </select>
                )}
                {blocker.status === 'assigned' && (
                  <button
                    onClick={() => updateBlockerStatus(blocker.id, 'resolved')}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateBlocker = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Blocker</h2>

        {/* User Info Display */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Submitter Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Name:</span>
              <span className="ml-2 text-blue-700">{mockUser.name}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Company:</span>
              <span className="ml-2 text-blue-700">{mockUser.company}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Role:</span>
              <span className="ml-2 text-blue-700">{mockUser.role}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Phone:</span>
              <span className="ml-2 text-blue-700">{mockUser.phone}</span>
            </div>
          </div>
        </div>

        {/* Floor Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Floor/Area</label>
          <select
            value={newBlocker.selectedFloor}
            onChange={(e) => handleFloorSelection(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Choose a floor...</option>
            {siteDrawings.map(drawing => (
              <option key={drawing.id} value={drawing.name}>
                {drawing.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drawing Display */}
        {selectedDrawing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mark blocker location - {selectedDrawing.name}
                </label>
                {!newBlocker.location && !isPinModeActive && (
                  <p className="text-sm text-gray-500 mt-1">
                    📱 Use gestures to zoom/pan, then activate pin mode to mark location
                  </p>
                )}
              </div>

              {/* Pin Mode Controls */}
              <div className="flex items-center space-x-2">
                {!newBlocker.location && !isPinModeActive && (
                  <button
                    onClick={activatePinMode}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Pin Mode</span>
                  </button>
                )}

                {isPinModeActive && !tempPinLocation && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600 font-medium">📍 Tap to place</span>
                    <button
                      onClick={cancelPin}
                      className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {tempPinLocation && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={confirmPin}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={cancelPin}
                      className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {newBlocker.location && !isPinModeActive && (
                  <button
                    onClick={clearPin}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Clear Pin
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Drawing Controls */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Drawing Controls:</span>
                <button
                  onClick={zoomOut}
                  disabled={isPinModeActive}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  −
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(drawingTransform.scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={isPinModeActive}
                  className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={resetDrawingView}
                disabled={isPinModeActive}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Reset View
              </button>
            </div>

            <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ height: '400px' }}>
              {/* Status indicator */}
              {isPinModeActive && (
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-2 rounded-md shadow-lg z-20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Pin Mode - Tap to place</span>
                  </div>
                </div>
              )}

              {/* Instructions overlay */}
              {!isPinModeActive && !newBlocker.location && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-md shadow-lg z-20">
                  <span className="text-sm">👆 Pinch to zoom • Drag to pan</span>
                </div>
              )}

              <div
                ref={drawingRef}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`w-full h-full relative ${
                  isPinModeActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                }`}
                style={{
                  backgroundImage: `url(${selectedDrawing.url})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  transform: `translate(${drawingTransform.translateX}px, ${drawingTransform.translateY}px) scale(${drawingTransform.scale})`,
                  transformOrigin: 'center',
                  transition: isPinModeActive ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                {/* Temporary pin (during placement) */}
                {tempPinLocation && (
                  <div
                    className="absolute w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 animate-pulse z-10"
                    style={{
                      left: tempPinLocation.x * drawingTransform.scale + drawingTransform.translateX,
                      top: tempPinLocation.y * drawingTransform.scale + drawingTransform.translateY
                    }}
                  >
                    <div className="absolute -top-10 -left-8 bg-yellow-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Confirm this location?
                    </div>
                  </div>
                )}

                {/* Confirmed pin */}
                {newBlocker.location && !isPinModeActive && (
                  <div
                    className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-3 -translate-y-3 z-10"
                    style={{
                      left: newBlocker.location.x * drawingTransform.scale + drawingTransform.translateX,
                      top: newBlocker.location.y * drawingTransform.scale + drawingTransform.translateY
                    }}
                  >
                    <div className="absolute -top-10 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ✓ Blocker Location
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Help Text */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Mobile Tips:</strong> Use two fingers to zoom in/out. Drag with one finger to move around.
                When you've found the right spot, tap "Pin Mode" then tap the exact location.
              </p>
            </div>
          </div>
        )}

        {/* Blocker Details Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={newBlocker.title}
              onChange={(e) => setNewBlocker(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Brief description of the blocker"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={newBlocker.description}
              onChange={(e) => setNewBlocker(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Detailed description of what is blocking the work"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={newBlocker.priority}
              onChange={(e) => setNewBlocker(prev => ({ ...prev, priority: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
            {!newBlocker.photo ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Take Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={newBlocker.photo} alt="Blocker" className="w-full max-w-md rounded-lg" />
                <button
                  onClick={() => setNewBlocker(prev => ({ ...prev, photo: null }))}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={() => {
              setIsCreatingBlocker(false);
              setCurrentView('dashboard');
              setNewBlocker({ title: '', description: '', photo: null, location: null, priority: 'medium', selectedFloor: '' });
              setSelectedDrawing(null);
              setIsPinModeActive(false);
              setTempPinLocation(null);
              setDrawingTransform({ scale: 1, translateX: 0, translateY: 0 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submitBlocker}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
            <span>Submit Blocker</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTrackingView = () => {
    const myBlockers = blockers.filter(blocker => blocker.createdBy === mockUser.name);

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Submitted Blockers</h2>

          {myBlockers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>You haven't submitted any blockers yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myBlockers.map(blocker => (
                <div key={blocker.id} className="border rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:space-x-8">
                    {/* Blocker Info */}
                    <div className="flex-1 mb-6 lg:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{blocker.title}</h3>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {blocker.ticketNumber}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${priorityColors[blocker.priority]}`}></div>
                      </div>
                      <p className="text-gray-600 mb-3">{blocker.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Submitted: {new Date(blocker.createdAt).toLocaleDateString()}</span>
                        <span>Floor: {blocker.floor}</span>
                        {blocker.assignedTo && (
                          <span className="text-blue-600">Assigned to: {blocker.assignedTo}</span>
                        )}
                        <span>Due: {new Date(blocker.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Status Tracker */}
                    <div className="lg:w-80">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Status Tracker</h4>
                      <div className="space-y-3">
                        {blocker.statusHistory.map((entry, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                              index === blocker.statusHistory.length - 1
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {entry.action}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(entry.timestamp).toLocaleString()} • {entry.user}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Future status indicators */}
                        {blocker.status === 'open' && (
                          <div className="flex items-start space-x-3 opacity-40">
                            <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">Waiting for assignment...</p>
                            </div>
                          </div>
                        )}

                        {blocker.status === 'assigned' && (
                          <div className="flex items-start space-x-3 opacity-40">
                            <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-500">Waiting for resolution...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Current Status Badge */}
                      <div className="mt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[blocker.status]}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            blocker.status === 'open' ? 'bg-red-500' :
                            blocker.status === 'assigned' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          {blocker.status.charAt(0).toUpperCase() + blocker.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <button
                      onClick={() => setSelectedBlocker(blocker)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBlockerDetail = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedBlocker.title}</h2>
            <p className="text-sm font-mono text-gray-500 mt-1">{selectedBlocker.ticketNumber}</p>
          </div>
          <button
            onClick={() => setSelectedBlocker(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${priorityColors[selectedBlocker.priority]}`}></div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[selectedBlocker.status]}`}>
                {selectedBlocker.status.charAt(0).toUpperCase() + selectedBlocker.status.slice(1)}
              </span>
            </div>

            <p className="text-gray-600">{selectedBlocker.description}</p>

            {selectedBlocker.photo && (
              <img src={selectedBlocker.photo} alt="Blocker" className="w-full max-w-md rounded-lg" />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created by:</span>
                <span className="ml-2 text-gray-600">{selectedBlocker.createdBy}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Company:</span>
                <span className="ml-2 text-gray-600">{selectedBlocker.createdByCompany}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Floor:</span>
                <span className="ml-2 text-gray-600">{selectedBlocker.floor}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">{new Date(selectedBlocker.createdAt).toLocaleString()}</span>
              </div>
              {selectedBlocker.assignedTo && (
                <div>
                  <span className="font-medium text-gray-700">Assigned to:</span>
                  <span className="ml-2 text-gray-600">{selectedBlocker.assignedTo}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Due date:</span>
                <span className="ml-2 text-gray-600">{new Date(selectedBlocker.dueDate).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Status History</h4>
            <div className="space-y-3">
              {selectedBlocker.statusHistory?.map((entry, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                    index === selectedBlocker.statusHistory.length - 1
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{entry.user}</p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No status history available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Blockers List</h1>
              <span className="text-sm text-gray-500">Field App</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {mockUser.name}</span>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedBlocker(null);
                setIsCreatingBlocker(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'dashboard' && !selectedBlocker
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('tracking');
                setSelectedBlocker(null);
                setIsCreatingBlocker(false);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                currentView === 'tracking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Track My Blockers</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('create');
                setSelectedBlocker(null);
                setIsCreatingBlocker(true);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                isCreatingBlocker
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Create Blocker</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBlocker ? renderBlockerDetail() :
         isCreatingBlocker ? renderCreateBlocker() :
         currentView === 'tracking' ? renderTrackingView() :
         renderDashboard()}
      </main>
    </div>
  );
};

export default BlockersApp;