import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Camera, MapPin, AlertTriangle, CheckCircle, Clock, Eye,
  Send, Filter, Search, User, Menu, X, Home, List, Settings,
  ChevronRight, ChevronDown, Star, Zap, Tool, FileText,
  Phone, Mail, Calendar, Navigation, Maximize2
} from 'lucide-react';
import { subcontractorAPI } from '../lib/subcontractorAPI';
import FieldWorkerDrawings from './drawings/FieldWorkerDrawings';

const FieldWorkerDashboard = ({ user, currentProject }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [myBlockers, setMyBlockers] = useState([]);
  const [assignedBlockers, setAssignedBlockers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [availableSubcontractors, setAvailableSubcontractors] = useState([]);

  // Create blocker form state
  const [newBlocker, setNewBlocker] = useState({
    title: '',
    description: '',
    priority: 'medium',
    location: null,
    photos: [],
    floor: '',
    assignedSubcontractor: '',
    tradeType: ''
  });

  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isPinModeActive, setIsPinModeActive] = useState(false);
  const [tempPinLocation, setTempPinLocation] = useState(null);

  const cameraInputRef = useRef(null);
  const drawingCanvasRef = useRef(null);

  useEffect(() => {
    loadWorkerData();
  }, []);

  const loadWorkerData = async () => {
    // Load blockers created by this worker and assigned to them
    // Connect to Supabase API

    // Load available subcontractors
    try {
      const companyId = user?.companyId || currentProject?.companyId || 'demo_company';

      // Initialize demo data if none exists
      const result = await subcontractorAPI.getSubcontractors(companyId);
      if (result.success && result.subcontractors.length === 0) {
        // Create some demo subcontractors
        await subcontractorAPI.createDemoData(companyId);
        const updatedResult = await subcontractorAPI.getSubcontractors(companyId);
        if (updatedResult.success) {
          setAvailableSubcontractors(updatedResult.subcontractors.filter(sub => sub.status === 'active'));
        }
      } else if (result.success) {
        setAvailableSubcontractors(result.subcontractors.filter(sub => sub.status === 'active'));
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error);
    }
  };

  const siteDrawings = [
    { id: 1, name: "Ground Floor", url: "/api/placeholder/800/600" },
    { id: 2, name: "1st Floor", url: "/api/placeholder/800/600" },
    { id: 3, name: "2nd Floor", url: "/api/placeholder/800/600" },
    { id: 4, name: "Basement", url: "/api/placeholder/800/600" }
  ];

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewBlocker(prev => ({
          ...prev,
          photos: [...prev.photos, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrawingClick = (e) => {
    if (!isPinModeActive || !drawingCanvasRef.current) return;

    const rect = drawingCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTempPinLocation({ x, y });
  };

  const confirmPin = () => {
    if (tempPinLocation) {
      setNewBlocker(prev => ({
        ...prev,
        location: tempPinLocation,
        floor: selectedDrawing.name
      }));
      setTempPinLocation(null);
      setIsPinModeActive(false);
      setShowDrawingModal(false);
    }
  };

  const submitBlocker = async () => {
    if (!newBlocker.title || !newBlocker.description) {
      alert('Please fill in title and description');
      return;
    }

    if (!newBlocker.assignedSubcontractor) {
      alert('Please select a subcontractor to assign this blocker to');
      return;
    }

    try {
      // Create blocker with subcontractor assignment
      const blockerData = {
        ...newBlocker,
        id: `blocker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending_review',
        createdBy: user?.id || 'field_worker',
        createdAt: new Date().toISOString(),
        projectId: currentProject?.id,
        companyId: user?.companyId || currentProject?.companyId
      };

      console.log('Submitting blocker to subcontractor:', blockerData);

      // In a real app, this would be submitted to the API
      // For now, just store in localStorage for demo purposes
      const existingBlockers = JSON.parse(localStorage.getItem('blockers') || '[]');
      existingBlockers.push(blockerData);
      localStorage.setItem('blockers', JSON.stringify(existingBlockers));

      // Reset form
      setNewBlocker({
        title: '',
        description: '',
        priority: 'medium',
        location: null,
        photos: [],
        floor: '',
        assignedSubcontractor: '',
        tradeType: ''
      });
      setShowCreateModal(false);

      alert(`Blocker submitted successfully and assigned to ${availableSubcontractors.find(s => s.id === newBlocker.assignedSubcontractor)?.name}!`);
      loadWorkerData(); // Refresh data
    } catch (error) {
      console.error('Error submitting blocker:', error);
      alert('Failed to submit blocker');
    }
  };

  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {user?.name || 'Field Worker'}!</h2>
            <p className="text-blue-100 mt-1">{currentProject?.name || 'No project selected'}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Today</p>
            <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Blockers</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <List className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">8</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-800">Report Issue</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg border-2 border-green-200 hover:bg-green-100 transition-colors">
            <Camera className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-800">Quick Photo</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200 hover:bg-orange-100 transition-colors">
            <MapPin className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-800">Site Map</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200 hover:bg-purple-100 transition-colors">
            <FileText className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-800">My Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { type: 'resolved', title: 'Electrical panel issue', time: '2 hours ago', status: 'resolved' },
            { type: 'created', title: 'Water leak in basement', time: '1 day ago', status: 'assigned' },
            { type: 'updated', title: 'HVAC system malfunction', time: '2 days ago', status: 'in_progress' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`h-2 w-2 rounded-full ${
                activity.status === 'resolved' ? 'bg-green-500' :
                activity.status === 'assigned' ? 'bg-blue-500' :
                activity.status === 'in_progress' ? 'bg-orange-500' : 'bg-gray-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                activity.status === 'resolved' ? 'bg-green-100 text-green-800' :
                activity.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                activity.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activity.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBlockers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">My Blockers</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {['all', 'open', 'assigned', 'in_progress', 'resolved'].map((filter) => (
          <button
            key={filter}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Blockers List */}
      <div className="space-y-3">
        {[
          { id: 1, title: 'Electrical panel access blocked', priority: 'high', status: 'pending_review', floor: '2nd Floor', created: '2 hours ago', assignedTo: 'Waiting for assignment' },
          { id: 2, title: 'Water leak near main entrance', priority: 'critical', status: 'assigned', floor: 'Ground Floor', created: '1 day ago', assignedTo: 'Mike Johnson - Elite Plumbing' },
          { id: 3, title: 'Scaffolding blocking emergency exit', priority: 'medium', status: 'in_progress', floor: '1st Floor', created: '2 days ago', assignedTo: 'Sarah Davis - ProFraming LLC' },
          { id: 4, title: 'HVAC unit making loud noise', priority: 'low', status: 'resolved', floor: 'Basement', created: '3 days ago', assignedTo: 'Tom Wilson - TechFlow HVAC' }
        ].map((blocker) => (
          <div key={blocker.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 flex-1">{blocker.title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                blocker.priority === 'critical' ? 'bg-red-100 text-red-800' :
                blocker.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                blocker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {blocker.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {blocker.floor}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {blocker.created}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  blocker.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  blocker.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                  blocker.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                  blocker.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {blocker.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span className="text-sm">Assigned to: {blocker.assignedTo}</span>
              </div>
            </div>

            <div className="mt-3 flex space-x-2">
              <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Details
              </button>
              {blocker.status === 'assigned' && (
                <button className="flex-1 text-sm text-green-600 hover:text-green-800 font-medium">
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-lg sm:rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Report Issue</h2>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
            <input
              type="text"
              value={newBlocker.title}
              onChange={(e) => setNewBlocker(prev => ({...prev, title: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
            <textarea
              value={newBlocker.description}
              onChange={(e) => setNewBlocker(prev => ({...prev, description: e.target.value}))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the issue and impact"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={newBlocker.priority}
              onChange={(e) => setNewBlocker(prev => ({...prev, priority: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Trade Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
            <select
              value={newBlocker.tradeType}
              onChange={(e) => {
                const selectedTrade = e.target.value;
                setNewBlocker(prev => ({
                  ...prev,
                  tradeType: selectedTrade,
                  assignedSubcontractor: '' // Reset subcontractor when trade changes
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select trade type...</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="hvac">HVAC</option>
              <option value="flooring">Flooring</option>
              <option value="drywall">Drywall</option>
              <option value="painting">Painting</option>
              <option value="roofing">Roofing</option>
              <option value="concrete">Concrete</option>
              <option value="framing">Framing</option>
              <option value="insulation">Insulation</option>
              <option value="glazing">Glazing</option>
              <option value="landscaping">Landscaping</option>
            </select>
          </div>

          {/* Subcontractor Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Subcontractor*</label>
            <select
              value={newBlocker.assignedSubcontractor}
              onChange={(e) => setNewBlocker(prev => ({...prev, assignedSubcontractor: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!newBlocker.tradeType}
            >
              <option value="">
                {!newBlocker.tradeType ? 'Select trade type first...' : 'Select subcontractor...'}
              </option>
              {availableSubcontractors
                .filter(sub => !newBlocker.tradeType || sub.trade_type === newBlocker.tradeType)
                .map((subcontractor) => (
                  <option key={subcontractor.id} value={subcontractor.id}>
                    {subcontractor.name} - {subcontractor.company_name} ({subcontractor.trade_type})
                  </option>
                ))
              }
            </select>
            {availableSubcontractors.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No subcontractors available. Contact your project manager.</p>
            )}
            {newBlocker.tradeType && availableSubcontractors.filter(sub => sub.trade_type === newBlocker.tradeType).length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">No subcontractors available for {newBlocker.tradeType} trade.</p>
            )}
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <button
              onClick={() => setShowDrawingModal(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {newBlocker.floor && newBlocker.location
                ? `${newBlocker.floor} (${newBlocker.location.x}, ${newBlocker.location.y})`
                : "Select location on site drawing"}
            </button>
          </div>

          {/* Photo Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Camera className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Take Photo</p>
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {newBlocker.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {newBlocker.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-20 object-cover rounded" />
                    <button
                      onClick={() => setNewBlocker(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== index)
                      }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex space-x-3">
          <button
            onClick={() => setShowCreateModal(false)}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submitBlocker}
            disabled={!newBlocker.title || !newBlocker.description || !newBlocker.assignedSubcontractor}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Submit to Subcontractor
          </button>
        </div>
      </div>
    </div>
  );

  const renderDrawingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Select Location</h2>
          <button
            onClick={() => setShowDrawingModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Floor Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Floor</label>
            <div className="flex flex-wrap gap-2">
              {siteDrawings.map((drawing) => (
                <button
                  key={drawing.id}
                  onClick={() => setSelectedDrawing(drawing)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    selectedDrawing?.id === drawing.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {drawing.name}
                </button>
              ))}
            </div>
          </div>

          {/* Drawing Canvas */}
          {selectedDrawing && (
            <div className="relative">
              <div className="mb-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {isPinModeActive ? 'Click on the drawing to mark the location' : 'Selected: ' + selectedDrawing.name}
                </span>
                <button
                  onClick={() => setIsPinModeActive(!isPinModeActive)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    isPinModeActive ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isPinModeActive ? 'Cancel Pin Mode' : 'Pin Mode'}
                </button>
              </div>
              <div
                className="relative border rounded-lg overflow-hidden cursor-crosshair"
                onClick={handleDrawingClick}
              >
                <img
                  ref={drawingCanvasRef}
                  src={selectedDrawing.url}
                  alt={selectedDrawing.name}
                  className="w-full h-64 object-contain bg-gray-50"
                />
                {tempPinLocation && (
                  <div
                    className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: tempPinLocation.x,
                      top: tempPinLocation.y
                    }}
                  ></div>
                )}
                {newBlocker.location && selectedDrawing.name === newBlocker.floor && (
                  <div
                    className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: newBlocker.location.x,
                      top: newBlocker.location.y
                    }}
                  ></div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={() => setShowDrawingModal(false)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          {tempPinLocation && (
            <button
              onClick={confirmPin}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirm Location
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sm:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-600"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Construction Blockers</h1>
        <button className="text-gray-600">
          <User className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'blockers', label: 'My Blockers', icon: List },
                { id: 'drawings', label: 'Drawings', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden sm:block bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Field Worker Dashboard</h1>
            <p className="text-gray-600">{currentProject?.name || 'No project selected'}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4 mr-2 inline" />
              Report Issue
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Desktop Navigation */}
        <div className="hidden sm:block mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'blockers', label: 'My Blockers', icon: List },
              { id: 'drawings', label: 'Drawings', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'home' && renderHome()}
        {activeTab === 'blockers' && renderBlockers()}
        {activeTab === 'drawings' && <FieldWorkerDrawings />}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Settings panel coming soon</p>
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modals */}
      {showCreateModal && renderCreateModal()}
      {showDrawingModal && renderDrawingModal()}
    </div>
  );
};

export default FieldWorkerDashboard;