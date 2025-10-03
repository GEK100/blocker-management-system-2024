import React, { useState, useRef, useEffect } from 'react';
import { subcontractorAPI } from '../lib/subcontractorAPI';
import notificationService from '../lib/notificationService';
import offlineDataService from '../lib/offlineDataService';
import OfflineIndicator from './OfflineIndicator';
import {
  CameraIcon,
  MapPinIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  MicrophoneIcon,
  PhotoIcon,
  DocumentIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  EyeIcon,
  SpeakerWaveIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ClockIcon,
  UserPlusIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  CameraIcon as CameraIconSolid,
  MicrophoneIcon as MicrophoneIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

const MobileTab = ({ icon: Icon, iconSolid: IconSolid, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-3 px-2 mobile-tap-target transition-all duration-300 touch-manipulation rounded-xl hover-lift ${
      active
        ? 'nav-tab-active'
        : 'nav-tab-inactive'
    }`}
  >
    <div className="relative">
      {active && IconSolid ? (
        <IconSolid className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
      {badge && (
        <span className="badge badge-primary absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs font-bold">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium mt-1 leading-tight text-center">{label}</span>
  </button>
);

const TouchButton = ({ children, onClick, variant = 'primary', size = 'lg', className = '', disabled = false }) => {
  const baseClasses = "active:scale-95";

  const variants = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    success: "btn btn-success",
    danger: "btn btn-danger",
    outline: "btn btn-outline",
    ghost: "btn btn-ghost"
  };

  const sizes = {
    sm: "px-4 py-3 text-sm min-h-[44px]",
    md: "px-6 py-3 text-base min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
    xl: "px-10 py-5 text-xl min-h-[64px]"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const PhotoCaptureOverlay = ({ isOpen, onClose, onCapture, onGallerySelect }) => {
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Camera access denied. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob(blob => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }, 'image/jpeg', 0.8);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View */}
      <div className="relative h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Controls Overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Top Controls */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="text-white hover:bg-white/20"
            >
              <XMarkIcon className="h-6 w-6" />
            </TouchButton>

            <div className="flex items-center space-x-3">
              <TouchButton
                onClick={() => {}}
                variant="ghost"
                size="md"
                className="text-white hover:bg-white/20"
              >
                <EyeIcon className="h-6 w-6" />
              </TouchButton>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex-1 flex items-end">
            <div className="w-full p-6 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center justify-between">
                {/* Gallery Button */}
                <TouchButton
                  onClick={onGallerySelect}
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 w-16 h-16 rounded-full"
                >
                  <PhotoIcon className="h-8 w-8" />
                </TouchButton>

                {/* Capture Button */}
                <TouchButton
                  onClick={capturePhoto}
                  variant="ghost"
                  size="xl"
                  className="w-20 h-20 rounded-full border-4 border-white text-white hover:bg-white/20"
                >
                  <CameraIconSolid className="h-10 w-10" />
                </TouchButton>

                {/* Switch Camera Button */}
                <TouchButton
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 w-16 h-16 rounded-full"
                >
                  <ArrowLeftIcon className="h-8 w-8 rotate-180" />
                </TouchButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VoiceRecordingOverlay = ({ isOpen, onClose, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onRecordingComplete(event.data);
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Microphone access denied. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="card card-premium p-8 w-full max-w-sm">
        <div className="text-center">
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 transition-all duration-300 ${isRecording ? 'bg-red-50 shadow-glow' : 'bg-emerald-50 shadow-soft'}`}>
              <MicrophoneIcon className={`h-12 w-12 ${isRecording ? 'text-safety-600' : 'text-emerald-600'}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {isRecording ? 'Recording...' : 'Voice Note'}
            </h3>
            {isRecording && (
              <div className="text-2xl font-mono text-emerald-600 mb-4">
                {formatTime(recordingTime)}
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <TouchButton
              onClick={onClose}
              variant="outline"
              size="lg"
            >
              Cancel
            </TouchButton>

            {!isRecording ? (
              <TouchButton
                onClick={startRecording}
                variant="primary"
                size="lg"
                className="btn btn-primary"
              >
                <MicrophoneIconSolid className="h-5 w-5 mr-2" />
                Start
              </TouchButton>
            ) : (
              <TouchButton
                onClick={stopRecording}
                variant="danger"
                size="lg"
              >
                <CheckCircleIconSolid className="h-5 w-5 mr-2" />
                Stop
              </TouchButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FloorPlanViewer = ({ floorPlan, markers = [], onMarkerAdd, onMarkerSelect }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (isDragging && e.touches.length === 1) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handlePinch = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      // Implement pinch-to-zoom logic
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleFloorPlanTap = (e) => {
    if (isDragging || !isAddingMarker) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX || e.touches[0].clientX) - rect.left - offset.x) / scale;
    const y = ((e.clientY || e.touches[0].clientY) - rect.top - offset.y) / scale;

    onMarkerAdd({ x, y });
    setIsAddingMarker(false);
  };

  return (
    <div className="relative h-full bg-slate-100 overflow-hidden touch-manipulation">
      {/* Add Marker Toggle */}
      <div className="absolute top-4 left-4 z-30">
        <TouchButton
          onClick={() => setIsAddingMarker(!isAddingMarker)}
          variant={isAddingMarker ? "primary" : "outline"}
          size="md"
          className="glass rounded-full hover-lift"
        >
          <PlusIcon className="h-5 w-5" />
        </TouchButton>
      </div>

      {/* Floor Plan Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative mobile-scroll"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleFloorPlanTap}
      >
        {floorPlan && (
          <img
            src={floorPlan}
            alt="Floor plan"
            className="max-w-none"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: '0 0'
            }}
            draggable={false}
          />
        )}

        {/* Markers */}
        {markers.map((marker, index) => (
          <div
            key={index}
            className="absolute z-10"
            style={{
              left: marker.x * scale + offset.x,
              top: marker.y * scale + offset.y,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onMarkerSelect(marker)}
          >
            <div className="w-8 h-8 bg-gradient-construction border-4 border-white rounded-full shadow-glow animate-bounce-gentle">
              <div className="w-full h-full bg-gradient-construction rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Controls */}
      <div className="absolute top-4 right-4 z-20">
        <TouchButton
          onClick={() => setShowControls(!showControls)}
          variant="outline"
          size="md"
          className="glass mb-2 w-12 h-12 rounded-full hover-lift"
        >
          {showControls ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </TouchButton>

        {showControls && (
          <div className="space-y-2 animate-slide-in-up">
            <TouchButton
              onClick={zoomIn}
              variant="outline"
              size="md"
              className="bg-white/90 backdrop-blur-sm w-12 h-12 rounded-full"
            >
              <PlusIcon className="h-5 w-5" />
            </TouchButton>
            <TouchButton
              onClick={zoomOut}
              variant="outline"
              size="md"
              className="bg-white/90 backdrop-blur-sm w-12 h-12 rounded-full"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
            <TouchButton
              onClick={resetView}
              variant="outline"
              size="md"
              className="bg-white/90 backdrop-blur-sm w-12 h-12 rounded-full"
            >
              <HomeIcon className="h-5 w-5" />
            </TouchButton>
          </div>
        )}
      </div>

      {/* Instructions */}
      {markers.length === 0 && !floorPlan && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mx-4 text-center">
            <DocumentIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Floor Plan</h3>
            <p className="text-sm text-slate-600">
              Upload a floor plan to start marking blocker locations
            </p>
          </div>
        </div>
      )}

      {markers.length === 0 && floorPlan && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mx-4 text-center">
            <MapPinIcon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              {isAddingMarker ? "Tap on the floor plan to add a marker" : "Toggle marker mode to add blocker locations"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const MobileFieldWorkerInterface = ({ user, project, projects = [], blockers = [], allSubcontractors = [], projectDrawings = [], onCreateBlocker, onUpdateBlocker, onUpdateSubcontractor }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState(project);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBlocker, setSelectedBlocker] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: '',
    assignmentType: 'subcontractor', // 'subcontractor' or 'manager'
    priority: 'medium',
    dueDate: '',
    notes: ''
  });
  const [subcontractors, setSubcontractors] = useState([]);
  const [loadingSubcontractors, setLoadingSubcontractors] = useState(true);
  const [siteManagers, setSiteManagers] = useState([]);
  const [loadingSiteManagers, setLoadingSiteManagers] = useState(true);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Site Manager',
    specialization: '',
    department: ''
  });
  const [showSubcontractorBlockerModal, setShowSubcontractorBlockerModal] = useState(false);
  const [selectedSubcontractorBlocker, setSelectedSubcontractorBlocker] = useState(null);
  const [blockerAction, setBlockerAction] = useState(''); // 'accept', 'reject', 'reassign'
  const [rejectionReason, setRejectionReason] = useState('');
  const [reassignmentData, setReassignmentData] = useState({
    assignedTo: '',
    notes: '',
    priority: 'medium'
  });
  const [showSubcontractorManagementModal, setShowSubcontractorManagementModal] = useState(false);
  const [selectedSubcontractorForProject, setSelectedSubcontractorForProject] = useState(null);
  const [newSubcontractorUser, setNewSubcontractorUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [showDrawingsModal, setShowDrawingsModal] = useState(false);
  const [selectedDrawingCategory, setSelectedDrawingCategory] = useState('all');

  // New blocker state
  const [newBlocker, setNewBlocker] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium',
    photos: [],
    voiceNotes: []
  });

  const pendingBlockers = blockers.filter(b => b.status === 'pending_review').length;

  // Filter projects that the user is assigned to
  const userProjects = projects.filter(project =>
    project.assignedUsers && project.assignedUsers.includes(user?.email)
  );

  // Use the first assigned project if no project is selected
  useEffect(() => {
    if (!selectedProject && userProjects.length > 0) {
      setSelectedProject(userProjects[0]);
    }
  }, [userProjects, selectedProject]);

  // Load subcontractors and site managers on component mount
  useEffect(() => {
    const loadSubcontractors = async () => {
      if (!user?.companyId) return;

      setLoadingSubcontractors(true);
      try {
        const result = await subcontractorAPI.getSubcontractors(user.companyId);
        if (result.success) {
          // Filter subcontractors who have access to this project or all active ones if no specific project
          const availableSubcontractors = result.subcontractors.filter(sub =>
            sub.status === 'active' &&
            (!selectedProject?.id || sub.project_access.includes(selectedProject.id) || sub.project_access.length === 0)
          );
          setSubcontractors(availableSubcontractors);
        }
      } catch (error) {
        console.error('Error loading subcontractors:', error);
      } finally {
        setLoadingSubcontractors(false);
      }
    };

    const loadSiteManagers = async () => {
      setLoadingSiteManagers(true);
      try {
        // Mock site managers data - in a real implementation, this would be an API call
        const mockSiteManagers = [
          {
            id: 'mgr_1',
            name: 'John Smith',
            email: 'john.smith@company.com',
            phone: '+1-555-0101',
            specialization: 'General Construction',
            projects: [selectedProject?.id].filter(Boolean)
          },
          {
            id: 'mgr_2',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            phone: '+1-555-0102',
            specialization: 'Safety & Compliance',
            projects: [selectedProject?.id].filter(Boolean)
          }
        ];

        // Filter managers assigned to current project or all if no specific project
        const availableManagers = mockSiteManagers.filter(manager =>
          !selectedProject?.id || manager.projects.includes(selectedProject.id) || manager.projects.length === 0
        );
        setSiteManagers(availableManagers);
      } catch (error) {
        console.error('Error loading site managers:', error);
      } finally {
        setLoadingSiteManagers(false);
      }
    };

    loadSubcontractors();
    loadSiteManagers();
  }, [user?.companyId, selectedProject?.id]);

  const handlePhotoCapture = (file) => {
    const url = URL.createObjectURL(file);
    setNewBlocker(prev => ({
      ...prev,
      photos: [...prev.photos, { file, url }]
    }));
    setShowPhotoCapture(false);
  };

  const handleVoiceRecording = (audioBlob) => {
    const url = URL.createObjectURL(audioBlob);
    setNewBlocker(prev => ({
      ...prev,
      voiceNotes: [...prev.voiceNotes, { blob: audioBlob, url }]
    }));
    setShowVoiceRecording(false);
  };

  const handleSubmitBlocker = async () => {
    if (!newBlocker.title.trim()) {
      alert('Please enter a blocker title');
      return;
    }

    const blockerData = {
      ...newBlocker,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      created_by: user,
      status: 'pending_review'
    };

    try {
      // Save using offline data service (works both online and offline)
      await offlineDataService.createBlocker(blockerData);

      // Also call the parent callback if provided
      if (onCreateBlocker) {
        onCreateBlocker(blockerData);
      }

      // If this is from a main contractor, notify ALL subcontractors
      if (user?.role === 'main_contractor' || user?.role === 'project_manager' || user?.role === 'company_admin') {
        try {
          await notificationService.notifyBlockerToAllSubcontractors(blockerData);
        } catch (error) {
          console.error('Error sending blocker notification to all subcontractors:', error);
        }
      }

      // Show success message
      alert('Blocker created successfully! It will sync when connection is available.');

    } catch (error) {
      console.error('Failed to create blocker:', error);
      alert('Failed to create blocker. Please try again.');
      return;
    }

    setNewBlocker({
      title: '',
      description: '',
      location: '',
      priority: 'medium',
      photos: [],
      voiceNotes: []
    });

    setActiveTab('home');
  };

  const handleAssignBlocker = (blocker) => {
    setSelectedBlocker(blocker);
    setAssignmentData({
      assignedTo: '',
      assignmentType: 'subcontractor',
      priority: blocker.priority || 'medium',
      dueDate: '',
      notes: ''
    });
    setShowAssignModal(true);
  };

  const handleSubmitAssignment = () => {
    if (!assignmentData.assignedTo) {
      alert(`Please select a ${assignmentData.assignmentType === 'subcontractor' ? 'subcontractor' : 'site manager'}`);
      return;
    }

    const updatedBlocker = {
      ...selectedBlocker,
      status: 'assigned',
      assignedTo: assignmentData.assignedTo,
      assignmentType: assignmentData.assignmentType,
      assignedAt: new Date().toISOString(),
      dueDate: assignmentData.dueDate,
      assignmentNotes: assignmentData.notes,
      priority: assignmentData.priority
    };

    onUpdateBlocker(updatedBlocker);
    setShowAssignModal(false);
    setSelectedBlocker(null);
    setAssignmentData({
      assignedTo: '',
      assignmentType: 'subcontractor',
      priority: 'medium',
      dueDate: '',
      notes: ''
    });
  };

  const handleAddManager = () => {
    if (!newManager.name.trim() || !newManager.email.trim()) {
      alert('Please enter manager name and email');
      return;
    }

    const manager = {
      id: `mgr_${Date.now()}`,
      ...newManager,
      projects: [selectedProject?.id].filter(Boolean),
      addedAt: new Date().toISOString(),
      addedBy: user?.email
    };

    // Add to site managers list
    setSiteManagers(prev => [...prev, manager]);

    // Reset form
    setNewManager({
      name: '',
      email: '',
      phone: '',
      role: 'Site Manager',
      specialization: '',
      department: ''
    });

    setShowAddManagerModal(false);
    alert('Manager added successfully!');
  };

  const handleSubcontractorBlockerAction = (blocker, action) => {
    setSelectedSubcontractorBlocker(blocker);
    setBlockerAction(action);
    setShowSubcontractorBlockerModal(true);
  };

  const handleSubcontractorBlockerSubmit = () => {
    if (!selectedSubcontractorBlocker) return;

    let updatedBlocker = { ...selectedSubcontractorBlocker };

    switch (blockerAction) {
      case 'accept':
        updatedBlocker = {
          ...updatedBlocker,
          status: 'pending_review',
          acceptedAt: new Date().toISOString(),
          acceptedBy: user?.email,
          reviewNotes: 'Accepted by field worker'
        };
        break;

      case 'reject':
        if (!rejectionReason.trim()) {
          alert('Please provide a reason for rejection');
          return;
        }
        updatedBlocker = {
          ...updatedBlocker,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: user?.email,
          rejectionReason: rejectionReason
        };
        break;

      case 'reassign':
        if (!reassignmentData.assignedTo) {
          alert('Please select a subcontractor to reassign to');
          return;
        }
        updatedBlocker = {
          ...updatedBlocker,
          status: 'assigned',
          assignedTo: reassignmentData.assignedTo,
          assignedAt: new Date().toISOString(),
          assignedBy: user?.email,
          assignmentNotes: reassignmentData.notes,
          priority: reassignmentData.priority,
          assignmentType: 'subcontractor'
        };
        break;

      default:
        return;
    }

    // Update the blocker
    onUpdateBlocker(updatedBlocker);

    // Reset state
    setShowSubcontractorBlockerModal(false);
    setSelectedSubcontractorBlocker(null);
    setBlockerAction('');
    setRejectionReason('');
    setReassignmentData({
      assignedTo: '',
      notes: '',
      priority: 'medium'
    });

    const actionText = blockerAction === 'accept' ? 'accepted' :
                      blockerAction === 'reject' ? 'rejected' : 'reassigned';
    alert(`Blocker ${actionText} successfully!`);
  };

  const handleSubcontractorSelection = (subcontractor) => {
    setSelectedSubcontractorForProject(subcontractor);
    setShowSubcontractorManagementModal(true);
  };

  const handleAddSubcontractorUser = async () => {
    if (!newSubcontractorUser.name.trim() || !newSubcontractorUser.email.trim()) {
      alert('Please enter user name and email');
      return;
    }

    const updatedSubcontractor = {
      ...selectedSubcontractorForProject,
      users: [
        ...selectedSubcontractorForProject.users,
        {
          id: `user_${Date.now()}`,
          ...newSubcontractorUser,
          addedAt: new Date().toISOString(),
          addedBy: user?.email
        }
      ]
    };

    // Update the subcontractor in the allSubcontractors list
    onUpdateSubcontractor(updatedSubcontractor);

    // Reset form
    setNewSubcontractorUser({
      name: '',
      email: '',
      phone: '',
      role: ''
    });

    setShowSubcontractorManagementModal(false);
    setSelectedSubcontractorForProject(null);
    // Save user using offline data service and notify subcontractors
    const newUserData = {
      id: `user_${Date.now()}`,
      ...newSubcontractorUser,
      addedAt: new Date().toISOString(),
      addedBy: user?.email,
      companyId: selectedSubcontractorForProject.companyId || 'default_company'
    };

    try {
      // Save user offline
      await offlineDataService.saveUser(newUserData);

      // Send notification
      await notificationService.notifyUserAddition(newUserData);
    } catch (error) {
      console.error('Error saving user or sending notification:', error);
    }

    alert('Subcontractor user added successfully!');
  };

  const renderHomeTab = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-construction p-4 sm:p-6 text-white flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Field Worker</h1>

        {userProjects.length === 0 ? (
          <div className="mt-2">
            <p className="text-emerald-100 text-sm sm:text-base mb-2">
              No projects assigned
            </p>
            <p className="text-emerald-200 text-xs">
              Contact your admin to be assigned to projects
            </p>
          </div>
        ) : (
          <>
            <p className="text-emerald-100 text-sm sm:text-base">
              {selectedProject?.name || 'Select a project'}
            </p>

            {/* Project Selector */}
            {userProjects.length > 1 && (
              <div className="mt-3">
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = userProjects.find(p => p.id === e.target.value);
                    setSelectedProject(project);
                  }}
                  className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 min-w-[200px]"
                >
                  <option value="">Select Project</option>
                  {userProjects.map(project => (
                    <option key={project.id} value={project.id} className="text-slate-900">
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 sm:p-6 space-y-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>

        <TouchButton
          onClick={() => setActiveTab('create')}
          variant="primary"
          size="xl"
          className="w-full"
          disabled={!selectedProject}
        >
          <PlusIcon className="h-6 w-6 mr-3" />
          Report New Blocker
        </TouchButton>

        {!selectedProject && (
          <p className="text-sm text-slate-500 text-center mt-2">
            Select a project to start reporting blockers
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <TouchButton
            onClick={() => setShowPhotoCapture(true)}
            variant="outline"
            size="lg"
            className="flex-col py-3 sm:py-4"
          >
            <CameraIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <span className="text-xs sm:text-sm">Take Photo</span>
          </TouchButton>

          <TouchButton
            onClick={() => setShowDrawingsModal(true)}
            variant="outline"
            size="lg"
            className="flex-col py-3 sm:py-4"
            disabled={!selectedProject}
          >
            <DocumentIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <span className="text-xs sm:text-sm">Drawings</span>
          </TouchButton>

          <TouchButton
            onClick={() => setActiveTab('floor-plan')}
            variant="outline"
            size="lg"
            className="flex-col py-3 sm:py-4"
          >
            <PhotoIcon className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
            <span className="text-xs sm:text-sm">Floor Plan</span>
          </TouchButton>
        </div>

        {/* Manager Management Section */}
        {selectedProject && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-md font-semibold text-slate-900 mb-3">Project Management</h3>
            <TouchButton
              onClick={() => setShowAddManagerModal(true)}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Main Contractor Manager
            </TouchButton>

            {/* Current Managers List */}
            {siteManagers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Current Managers</h4>
                <div className="space-y-2">
                  {siteManagers
                    .filter(manager => !selectedProject?.id || manager.projects.includes(selectedProject.id) || manager.projects.length === 0)
                    .map(manager => (
                    <div key={manager.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-emerald-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{manager.name}</div>
                          <div className="text-xs text-slate-600">{manager.specialization || 'Site Manager'}</div>
                        </div>
                      </div>
                      <div className="text-xs text-emerald-600 font-medium">
                        {manager.addedBy === user?.email ? 'Added by you' : 'Active'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subcontractor Management Section */}
        {selectedProject && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-md font-semibold text-slate-900 mb-3">Subcontractor Management</h3>
            <p className="text-sm text-slate-600 mb-4">
              Add users from subcontractors that have been approved by company admin
            </p>

            {/* Available Subcontractors */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">Available Subcontractors</h4>
              {allSubcontractors
                .filter(sub => sub.status === 'active')
                .map(subcontractor => {
                  const userCount = subcontractor.users ? subcontractor.users.length : 0;
                  const hasProjectAccess = subcontractor.project_access.includes(selectedProject.id) || subcontractor.project_access.length === 0;

                  return (
                    <div key={subcontractor.id} className={`p-3 rounded-lg border ${hasProjectAccess ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="text-sm font-medium text-slate-900">{subcontractor.company_name}</h5>
                            <span className="badge badge-primary text-xs">
                              {subcontractor.trade_type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{subcontractor.name} • {subcontractor.email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {userCount} user{userCount !== 1 ? 's' : ''} •
                            {hasProjectAccess ? ' Has project access' : ' No project access'}
                          </p>
                        </div>
                        {hasProjectAccess && (
                          <TouchButton
                            onClick={() => handleSubcontractorSelection(subcontractor)}
                            variant="outline"
                            size="sm"
                            className="text-xs px-3 py-1"
                          >
                            <UserPlusIcon className="h-4 w-4 mr-1" />
                            Add User
                          </TouchButton>
                        )}
                      </div>
                    </div>
                  );
                })}

              {allSubcontractors.filter(sub => sub.status === 'active').length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <UserGroupIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No subcontractors available</p>
                  <p className="text-xs">Contact admin to add subcontractors</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subcontractor Blockers - Pending Review */}
      {selectedProject && (() => {
        const subcontractorBlockers = blockers.filter(blocker =>
          blocker.raisedBy === 'subcontractor' &&
          blocker.status === 'subcontractor_pending' &&
          (blocker.projectId === selectedProject.id || blocker.project_id === selectedProject.id)
        );

        return subcontractorBlockers.length > 0 && (
          <div className="px-4 sm:px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Subcontractor Reports</h2>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                {subcontractorBlockers.length} pending
              </span>
            </div>
            <div className="space-y-3">
              {subcontractorBlockers.map(blocker => (
                <div key={blocker.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 flex-1 text-sm sm:text-base pr-2">{blocker.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      blocker.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      blocker.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      blocker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {blocker.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-3">{blocker.description}</p>

                  <div className="flex items-center text-xs text-slate-500 mb-3">
                    <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate mr-4">{blocker.location || 'No location'}</span>
                    <span className="text-emerald-600 font-medium">
                      By: {blocker.created_by?.company} ({blocker.created_by?.trade})
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                    <TouchButton
                      onClick={() => handleSubcontractorBlockerAction(blocker, 'accept')}
                      variant="success"
                      size="lg"
                      className="w-full sm:flex-1 text-sm py-4 sm:py-3 font-medium min-h-[48px] hover-lift"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Accept
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleSubcontractorBlockerAction(blocker, 'reassign')}
                      variant="outline"
                      size="lg"
                      className="w-full sm:flex-1 text-sm py-4 sm:py-3 font-medium min-h-[48px] hover-lift"
                    >
                      <ArrowPathIcon className="h-5 w-5 mr-2" />
                      Reassign
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleSubcontractorBlockerAction(blocker, 'reject')}
                      variant="danger"
                      size="lg"
                      className="w-full sm:flex-1 text-sm py-4 sm:py-3 font-medium min-h-[48px] hover-lift"
                    >
                      <XMarkIcon className="h-5 w-5 mr-2" />
                      Reject
                    </TouchButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Recent Blockers */}
      <div className="px-4 sm:px-6 pb-6 flex-1 min-h-0">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h2>
        {blockers.length > 0 ? (
          <div className="space-y-3">
            {blockers.slice(0, 3).map(blocker => (
              <div key={blocker.id} className="card p-4 relative">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900 flex-1 text-sm sm:text-base pr-2">{blocker.title}</h3>
                  <span className={`status-badge ml-2 text-xs ${
                    blocker.status === 'pending_review' ? 'status-pending' :
                    blocker.status === 'assigned' ? 'status-assigned' :
                    blocker.status === 'completed' ? 'status-completed' :
                    'status-verified'
                  }`}>
                    {blocker.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-3">{blocker.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs sm:text-sm text-slate-500">
                    <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{blocker.location || 'No location'}</span>
                  </div>
                  {blocker.status === 'pending_review' && (
                    <TouchButton
                      onClick={() => handleAssignBlocker(blocker)}
                      variant="outline"
                      size="sm"
                      className="ml-2 px-3 py-1 text-xs"
                    >
                      Assign
                    </TouchButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardDocumentListIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">No blockers reported yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateTab = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between sticky top-0 bg-slate-50 py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">New Blocker</h1>
          <TouchButton
            onClick={() => setActiveTab('home')}
            variant="ghost"
            size="md"
            className="p-2"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </TouchButton>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Blocker Title *
          </label>
          <input
            type="text"
            value={newBlocker.title}
            onChange={(e) => setNewBlocker(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief description of the issue"
            className="form-input text-sm sm:text-base py-3 sm:py-4"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Description
          </label>
          <textarea
            value={newBlocker.description}
            onChange={(e) => setNewBlocker(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description of the blocker..."
            rows={3}
            className="form-textarea text-sm sm:text-base py-3 sm:py-4 resize-none"
          />
        </div>

        {/* Referenced Drawing */}
        {newBlocker.relatedDrawing && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentIcon className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Referenced Drawing</p>
                  <p className="text-xs text-blue-700">{newBlocker.relatedDrawingName}</p>
                </div>
              </div>
              <TouchButton
                onClick={() => setNewBlocker(prev => ({
                  ...prev,
                  relatedDrawing: '',
                  relatedDrawingName: ''
                }))}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 p-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </TouchButton>
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={newBlocker.location}
            onChange={(e) => setNewBlocker(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Room, area, or specific location"
            className="form-input text-sm sm:text-base py-3 sm:py-4"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {['low', 'medium', 'high'].map(priority => (
              <TouchButton
                key={priority}
                onClick={() => setNewBlocker(prev => ({ ...prev, priority }))}
                variant={newBlocker.priority === priority ? 'primary' : 'outline'}
                size="md"
                className="capitalize text-sm py-3"
              >
                {priority}
              </TouchButton>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Photos ({newBlocker.photos.length})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <TouchButton
              onClick={() => setShowPhotoCapture(true)}
              variant="outline"
              size="lg"
              className="aspect-square flex-col py-4"
            >
              <CameraIcon className="h-6 w-6 sm:h-8 sm:w-8 mb-1" />
              <span className="text-xs">Add Photo</span>
            </TouchButton>

            {newBlocker.photos.map((photo, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <TouchButton
                  onClick={() => setNewBlocker(prev => ({
                    ...prev,
                    photos: prev.photos.filter((_, i) => i !== index)
                  }))}
                  variant="danger"
                  size="sm"
                  className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full p-0"
                >
                  <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </TouchButton>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Voice Notes ({newBlocker.voiceNotes.length})
          </label>
          <TouchButton
            onClick={() => setShowVoiceRecording(true)}
            variant="outline"
            size="lg"
            className="w-full py-3 sm:py-4"
          >
            <MicrophoneIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="text-sm sm:text-base">Add Voice Note</span>
          </TouchButton>

          {newBlocker.voiceNotes.map((note, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mt-2">
              <div className="flex items-center">
                <SpeakerWaveIcon className="h-5 w-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-700">Voice note {index + 1}</span>
              </div>
              <TouchButton
                onClick={() => setNewBlocker(prev => ({
                  ...prev,
                  voiceNotes: prev.voiceNotes.filter((_, i) => i !== index)
                }))}
                variant="ghost"
                size="sm"
              >
                <XMarkIcon className="h-4 w-4" />
              </TouchButton>
            </div>
          ))}
        </div>

        {/* Project Drawings */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Project References
          </label>
          <TouchButton
            onClick={() => setShowDrawingsModal(true)}
            variant="outline"
            size="lg"
            className="w-full py-3 sm:py-4"
            disabled={!selectedProject}
          >
            <DocumentIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="text-sm sm:text-base">Browse Project Drawings</span>
          </TouchButton>
          {!selectedProject && (
            <p className="text-xs text-slate-500 mt-1">Select a project to access drawings</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <TouchButton
            onClick={handleSubmitBlocker}
            variant="primary"
            size="xl"
            className="w-full"
          >
            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
            <span className="text-sm sm:text-base">Submit Blocker Report</span>
          </TouchButton>
        </div>
      </div>
    </div>
  );

  const renderBlockersTab = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">My Blockers</h1>

        {/* Search */}
        <div className="relative mb-4 sm:mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blockers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-9 sm:pl-10 text-sm sm:text-base py-3 sm:py-4"
          />
        </div>

        {/* Blockers List */}
        <div className="space-y-4">
          {blockers
            .filter(blocker =>
              blocker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              blocker.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(blocker => (
              <div key={blocker.id} className="card p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-slate-900 flex-1 text-sm sm:text-lg pr-2">{blocker.title}</h3>
                  <span className={`status-badge ml-2 text-xs ${
                    blocker.status === 'pending_review' ? 'status-pending' :
                    blocker.status === 'assigned' ? 'status-assigned' :
                    blocker.status === 'completed' ? 'status-completed' :
                    'status-verified'
                  }`}>
                    {blocker.status.replace('_', ' ')}
                  </span>
                </div>

                {blocker.description && (
                  <p className="text-slate-600 mb-3 leading-relaxed text-sm">{blocker.description}</p>
                )}

                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-3">
                  <div className="flex items-center flex-1 mr-2">
                    <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{blocker.location || 'No location'}</span>
                  </div>
                  <span className="flex-shrink-0">{new Date(blocker.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {blocker.photos && blocker.photos.length > 0 && (
                      <div className="flex items-center text-xs sm:text-sm text-success-600">
                        <PhotoIcon className="h-4 w-4 mr-1" />
                        {blocker.photos.length} photo{blocker.photos.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {blocker.assignedTo && (
                      <div className="text-xs text-emerald-600">
                        Assigned: {
                          blocker.assignmentType === 'manager'
                            ? (siteManagers.find(m => m.id === blocker.assignedTo)?.name || 'Unknown Manager')
                            : (subcontractors.find(s => s.id === blocker.assignedTo)?.name || 'Unknown Subcontractor')
                        }
                        {blocker.assignmentType === 'manager' && ' (Site Manager)'}
                      </div>
                    )}
                  </div>
                  {blocker.status === 'pending_review' && (
                    <TouchButton
                      onClick={() => handleAssignBlocker(blocker)}
                      variant="primary"
                      size="sm"
                      className="px-3 py-1 text-xs"
                    >
                      Assign
                    </TouchButton>
                  )}
                </div>
              </div>
            ))
          }
        </div>

        {blockers.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No blockers yet</h3>
            <p className="text-slate-600 mb-6">Start by reporting your first blocker</p>
            <TouchButton
              onClick={() => setActiveTab('create')}
              variant="primary"
              size="lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Blocker
            </TouchButton>
          </div>
        )}
      </div>
    </div>
  );

  const renderFloorPlanTab = () => (
    <div className="flex-1 overflow-y-auto">
      <FloorPlanViewer
        floorPlan={selectedProject?.floorPlan}
        markers={selectedProject?.blockerMarkers || []}
        onMarkerAdd={(position) => {
          console.log('Add marker at:', position);
        }}
        onMarkerSelect={(marker) => {
          console.log('Selected marker:', marker);
        }}
      />
    </div>
  );

  const renderAnalyticsTab = () => {
    // Filter blockers for the selected project only
    const projectBlockers = blockers.filter(blocker =>
      blocker.projectId === selectedProject?.id || blocker.project_id === selectedProject?.id
    );

    // Calculate analytics for the specific project
    const totalBlockers = projectBlockers.length;
    const pendingCount = projectBlockers.filter(b => b.status === 'pending_review').length;
    const assignedCount = projectBlockers.filter(b => b.status === 'assigned').length;
    const completedCount = projectBlockers.filter(b => b.status === 'completed').length;

    // Priority breakdown
    const highPriority = projectBlockers.filter(b => b.priority === 'high').length;
    const mediumPriority = projectBlockers.filter(b => b.priority === 'medium').length;
    const lowPriority = projectBlockers.filter(b => b.priority === 'low').length;

    // Recent activity (last 7 days)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentBlockers = projectBlockers.filter(b => new Date(b.created_at) >= lastWeek).length;

    // Average resolution time (for completed blockers)
    const completedBlockers = projectBlockers.filter(b => b.status === 'completed' && b.assignedAt && b.completedAt);
    const avgResolutionTime = completedBlockers.length > 0
      ? completedBlockers.reduce((sum, b) => {
          const assigned = new Date(b.assignedAt);
          const completed = new Date(b.completedAt);
          return sum + (completed - assigned) / (1000 * 60 * 60 * 24); // days
        }, 0) / completedBlockers.length
      : 0;

    return (
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Project Analytics</h1>
            {selectedProject && (
              <div className="text-right">
                <p className="text-sm font-medium text-slate-600">Current Project</p>
                <p className="text-lg font-bold text-emerald-600">{selectedProject.name}</p>
              </div>
            )}
          </div>

          {!selectedProject ? (
            <div className="text-center py-12">
              <ChartBarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Project Selected</h3>
              <p className="text-slate-600 mb-6">Select a project to view analytics</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900">{totalBlockers}</div>
                  <div className="text-sm text-slate-600">Total Blockers</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                  <div className="text-sm text-slate-600">Pending</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
                  <div className="text-sm text-slate-600">In Progress</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Priority Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-slate-700">High Priority</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{highPriority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-slate-700">Medium Priority</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{mediumPriority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-slate-700">Low Priority</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{lowPriority}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {totalBlockers > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Progress</h3>
                  <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(completedCount / totalBlockers) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{completedCount} completed</span>
                    <span>{Math.round((completedCount / totalBlockers) * 100)}% complete</span>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                <div className="flex items-center">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-emerald-600 mr-3" />
                  <div>
                    <div className="text-lg font-bold text-slate-900">{recentBlockers}</div>
                    <div className="text-sm text-slate-600">New blockers in last 7 days</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {avgResolutionTime > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance</h3>
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-lg font-bold text-slate-900">{avgResolutionTime.toFixed(1)} days</div>
                      <div className="text-sm text-slate-600">Average resolution time</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Blockers List */}
              {projectBlockers.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Blockers</h3>
                  <div className="space-y-3">
                    {projectBlockers.slice(0, 5).map(blocker => (
                      <div key={blocker.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">{blocker.title}</div>
                          <div className="text-xs text-slate-600">{blocker.location || 'No location'}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          blocker.status === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                          blocker.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          blocker.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {blocker.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalBlockers === 0 && (
                <div className="text-center py-12">
                  <ChartBarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Data Available</h3>
                  <p className="text-slate-600 mb-6">No blockers have been reported for this project yet</p>
                  <TouchButton
                    onClick={() => setActiveTab('create')}
                    variant="primary"
                    size="lg"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Report First Blocker
                  </TouchButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const DrawingsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // Filter drawings for the selected project
    const currentProjectDrawings = projectDrawings.filter(drawing =>
      drawing.projectId === selectedProject?.id && drawing.status === 'active'
    );

    // Filter by category
    const filteredDrawings = selectedDrawingCategory === 'all'
      ? currentProjectDrawings
      : currentProjectDrawings.filter(drawing => drawing.category === selectedDrawingCategory);

    const categories = [
      { value: 'all', label: 'All Categories' },
      { value: 'architectural', label: 'Architectural' },
      { value: 'structural', label: 'Structural' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'mechanical', label: 'Mechanical' },
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'survey', label: 'Survey' }
    ];

    const getCategoryColor = (category) => {
      const colors = {
        architectural: 'bg-blue-100 text-blue-800',
        structural: 'bg-green-100 text-green-800',
        electrical: 'bg-yellow-100 text-yellow-800',
        mechanical: 'bg-purple-100 text-purple-800',
        plumbing: 'bg-indigo-100 text-indigo-800',
        survey: 'bg-gray-100 text-gray-800'
      };
      return colors[category] || 'bg-slate-100 text-slate-800';
    };

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Project Drawings</h3>
              {selectedProject && (
                <p className="text-sm text-slate-600">{selectedProject.name}</p>
              )}
            </div>
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedDrawingCategory}
              onChange={(e) => setSelectedDrawingCategory(e.target.value)}
              className="form-select w-full py-2 text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Drawings List */}
          <div className="space-y-3">
            {filteredDrawings.length > 0 ? (
              filteredDrawings.map(drawing => (
                <div key={drawing.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 text-sm">{drawing.name}</h4>
                      <p className="text-xs text-slate-600 mt-1">{drawing.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(drawing.category)}`}>
                        {drawing.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full">
                        {drawing.version}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Uploaded by: {drawing.uploadedBy}</span>
                    <span>{new Date(drawing.uploadedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:gap-2">
                    <TouchButton
                      onClick={() => {
                        // In a real app, this would open the drawing file
                        alert(`Opening ${drawing.name} - ${drawing.fileUrl}`);
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full sm:flex-1 text-sm py-3 font-medium min-h-[44px] hover-lift"
                    >
                      <EyeIcon className="h-5 w-5 mr-2" />
                      View
                    </TouchButton>
                    <TouchButton
                      onClick={() => {
                        // Add drawing reference to blocker form if in create mode
                        setNewBlocker(prev => ({
                          ...prev,
                          relatedDrawing: drawing.id,
                          relatedDrawingName: drawing.name
                        }));
                        setShowDrawingsModal(false);
                        setActiveTab('create');
                      }}
                      variant="primary"
                      size="lg"
                      className="w-full sm:flex-1 text-sm py-3 font-medium min-h-[44px] hover-lift"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Reference in Blocker
                    </TouchButton>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-slate-900 mb-1">No Drawings Found</h4>
                <p className="text-xs text-slate-600">
                  {selectedDrawingCategory === 'all'
                    ? 'No drawings have been uploaded for this project'
                    : `No ${selectedDrawingCategory} drawings found`}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 mt-6">
            <TouchButton
              onClick={onClose}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Close
            </TouchButton>
          </div>
        </div>
      </div>
    );
  };

  const SubcontractorManagementModal = ({ isOpen, onClose, subcontractor, onSubmit }) => {
    if (!isOpen || !subcontractor) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Add Subcontractor User</h3>
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          <div className="space-y-4">
            {/* Subcontractor Details */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-medium text-slate-900 text-sm">{subcontractor.company_name}</h4>
                <span className="badge badge-primary text-xs">
                  {subcontractor.trade_type}
                </span>
              </div>
              <p className="text-xs text-slate-600">Contact: {subcontractor.name}</p>
              <p className="text-xs text-slate-500">Current Users: {subcontractor.users ? subcontractor.users.length : 0}</p>
            </div>

            {/* Existing Users */}
            {subcontractor.users && subcontractor.users.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">Current Users</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {subcontractor.users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-600">{user.email}</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {user.role || 'Worker'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New User Form */}
            <div className="border-t border-slate-200 pt-4">
              <h5 className="text-sm font-medium text-slate-700 mb-3">Add New User</h5>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    User Name *
                  </label>
                  <input
                    type="text"
                    value={newSubcontractorUser.name}
                    onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter user's full name"
                    className="form-input w-full py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newSubcontractorUser.email}
                    onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@company.com"
                    className="form-input w-full py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newSubcontractorUser.phone}
                    onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1-555-0123"
                    className="form-input w-full py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role/Position
                  </label>
                  <input
                    type="text"
                    value={newSubcontractorUser.role}
                    onChange={(e) => setNewSubcontractorUser(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g., Lead Technician, Supervisor, Worker"
                    className="form-input w-full py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-600 bg-blue-50 p-3 rounded-lg">
              <strong>Note:</strong> This user will be added to {subcontractor.company_name} and will have access to assigned projects.
            </div>

            <div className="flex space-x-3 pt-4">
              <TouchButton
                onClick={onClose}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancel
              </TouchButton>
              <TouchButton
                onClick={onSubmit}
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!newSubcontractorUser.name.trim() || !newSubcontractorUser.email.trim()}
              >
                Add User
              </TouchButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SubcontractorBlockerModal = ({ isOpen, onClose, blocker, action, onSubmit }) => {
    if (!isOpen || !blocker) return null;

    const actionTitle = action === 'accept' ? 'Accept Blocker' :
                       action === 'reject' ? 'Reject Blocker' : 'Reassign Blocker';

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">{actionTitle}</h3>
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          <div className="space-y-4">
            {/* Blocker Details */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 text-sm mb-1">{blocker.title}</h4>
              <p className="text-xs text-slate-600 mb-2">{blocker.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">By: {blocker.created_by?.company}</span>
                <span className={`px-2 py-1 rounded-full font-medium ${
                  blocker.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  blocker.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  blocker.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {blocker.priority}
                </span>
              </div>
            </div>

            {/* Action-specific content */}
            {action === 'accept' && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    This blocker will be accepted and moved to pending review for assignment.
                  </span>
                </div>
              </div>
            )}

            {action === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejecting this blocker..."
                  rows={3}
                  className="form-textarea w-full py-3 text-sm resize-none"
                />
              </div>
            )}

            {action === 'reassign' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reassign to Subcontractor *
                  </label>
                  <select
                    value={reassignmentData.assignedTo}
                    onChange={(e) => setReassignmentData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="form-select w-full py-3 text-sm"
                    disabled={loadingSubcontractors}
                  >
                    <option value="">
                      {loadingSubcontractors ? 'Loading subcontractors...' : 'Select a subcontractor...'}
                    </option>
                    {subcontractors.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.company_name}) - {sub.trade_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(priority => (
                      <TouchButton
                        key={priority}
                        onClick={() => setReassignmentData(prev => ({ ...prev, priority }))}
                        variant={reassignmentData.priority === priority ? 'primary' : 'outline'}
                        size="md"
                        className="capitalize text-sm py-2"
                      >
                        {priority}
                      </TouchButton>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assignment Notes
                  </label>
                  <textarea
                    value={reassignmentData.notes}
                    onChange={(e) => setReassignmentData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional instructions or notes for the assigned subcontractor..."
                    rows={3}
                    className="form-textarea w-full py-3 text-sm resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <TouchButton
                onClick={onClose}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancel
              </TouchButton>
              <TouchButton
                onClick={onSubmit}
                variant={action === 'reject' ? 'danger' : 'primary'}
                size="lg"
                className="flex-1"
                disabled={
                  (action === 'reject' && !rejectionReason.trim()) ||
                  (action === 'reassign' && !reassignmentData.assignedTo)
                }
              >
                {action === 'accept' ? 'Accept Blocker' :
                 action === 'reject' ? 'Reject Blocker' : 'Reassign Blocker'}
              </TouchButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddManagerModal = ({ isOpen, onClose, onSubmit }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Add Main Contractor Manager</h3>
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Manager Name *
              </label>
              <input
                type="text"
                value={newManager.name}
                onChange={(e) => setNewManager(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter manager's full name"
                className="form-input w-full py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager(prev => ({ ...prev, email: e.target.value }))}
                placeholder="manager@company.com"
                className="form-input w-full py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={newManager.phone}
                onChange={(e) => setNewManager(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1-555-0123"
                className="form-input w-full py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                value={newManager.role}
                onChange={(e) => setNewManager(prev => ({ ...prev, role: e.target.value }))}
                className="form-select w-full py-3 text-sm"
              >
                <option value="Site Manager">Site Manager</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Safety Manager">Safety Manager</option>
                <option value="Operations Manager">Operations Manager</option>
                <option value="Construction Manager">Construction Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={newManager.specialization}
                onChange={(e) => setNewManager(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="e.g., General Construction, Safety & Compliance"
                className="form-input w-full py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={newManager.department}
                onChange={(e) => setNewManager(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., Construction, Safety, Operations"
                className="form-input w-full py-3 text-sm"
              />
            </div>

            <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
              <strong>Note:</strong> This manager will be added to the current project ({selectedProject?.name}) and will be available for blocker assignments.
            </div>

            <div className="flex space-x-3 pt-4">
              <TouchButton
                onClick={onClose}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancel
              </TouchButton>
              <TouchButton
                onClick={onSubmit}
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={!newManager.name.trim() || !newManager.email.trim()}
              >
                Add Manager
              </TouchButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AssignmentModal = ({ isOpen, onClose, blocker, onSubmit }) => {
    if (!isOpen || !blocker) return null;

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full sm:w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900">Assign Blocker</h3>
            <TouchButton
              onClick={onClose}
              variant="ghost"
              size="md"
              className="p-2"
            >
              <XMarkIcon className="h-5 w-5" />
            </TouchButton>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 text-sm">{blocker.title}</h4>
              <p className="text-xs text-slate-600 mt-1">{blocker.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assignment Type *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <TouchButton
                  onClick={() => setAssignmentData(prev => ({ ...prev, assignmentType: 'subcontractor', assignedTo: '' }))}
                  variant={assignmentData.assignmentType === 'subcontractor' ? 'primary' : 'outline'}
                  size="md"
                  className="text-sm py-2"
                >
                  Subcontractor
                </TouchButton>
                <TouchButton
                  onClick={() => setAssignmentData(prev => ({ ...prev, assignmentType: 'manager', assignedTo: '' }))}
                  variant={assignmentData.assignmentType === 'manager' ? 'primary' : 'outline'}
                  size="md"
                  className="text-sm py-2"
                >
                  Site Manager
                </TouchButton>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                {assignmentData.assignmentType === 'subcontractor' ? 'Select Subcontractor *' : 'Select Site Manager *'}
              </label>
              <select
                value={assignmentData.assignedTo}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="form-select w-full py-3 text-sm"
                disabled={assignmentData.assignmentType === 'subcontractor' ? loadingSubcontractors : loadingSiteManagers}
              >
                <option value="">
                  {assignmentData.assignmentType === 'subcontractor'
                    ? (loadingSubcontractors ? 'Loading subcontractors...' : 'Select a subcontractor...')
                    : (loadingSiteManagers ? 'Loading site managers...' : 'Select a site manager...')
                  }
                </option>
                {assignmentData.assignmentType === 'subcontractor'
                  ? subcontractors.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.company_name}) - {sub.trade_type}
                      </option>
                    ))
                  : siteManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} - {manager.specialization}
                      </option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map(priority => (
                  <TouchButton
                    key={priority}
                    onClick={() => setAssignmentData(prev => ({ ...prev, priority }))}
                    variant={assignmentData.priority === priority ? 'primary' : 'outline'}
                    size="md"
                    className="capitalize text-sm py-2"
                  >
                    {priority}
                  </TouchButton>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={assignmentData.dueDate}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="form-input w-full py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assignment Notes
              </label>
              <textarea
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional instructions or notes..."
                rows={3}
                className="form-textarea w-full py-3 text-sm resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <TouchButton
                onClick={onClose}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Cancel
              </TouchButton>
              <TouchButton
                onClick={onSubmit}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Assign Blocker
              </TouchButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-viewport bg-slate-50 flex flex-col touch-manipulation no-zoom">
      {/* Offline Status Indicator */}
      <div className="sticky top-0 z-40 p-2 bg-slate-50 border-b border-slate-200">
        <OfflineIndicator className="sm:hidden" />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'blockers' && renderBlockersTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'floor-plan' && renderFloorPlanTab()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 safe-area-bottom flex-shrink-0">
        <div className="grid grid-cols-5">
          <MobileTab
            icon={HomeIcon}
            label="Home"
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <MobileTab
            icon={PlusIcon}
            label="Create"
            active={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
          />
          <MobileTab
            icon={ClipboardDocumentListIcon}
            label="Blockers"
            active={activeTab === 'blockers'}
            onClick={() => setActiveTab('blockers')}
            badge={pendingBlockers > 0 ? pendingBlockers : null}
          />
          <MobileTab
            icon={ChartBarIcon}
            label="Analytics"
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <MobileTab
            icon={DocumentIcon}
            label="Plan"
            active={activeTab === 'floor-plan'}
            onClick={() => setActiveTab('floor-plan')}
          />
        </div>
      </nav>

      {/* Overlays */}
      <PhotoCaptureOverlay
        isOpen={showPhotoCapture}
        onClose={() => setShowPhotoCapture(false)}
        onCapture={handlePhotoCapture}
        onGallerySelect={() => {}}
      />

      <VoiceRecordingOverlay
        isOpen={showVoiceRecording}
        onClose={() => setShowVoiceRecording(false)}
        onRecordingComplete={handleVoiceRecording}
      />

      <AssignmentModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        blocker={selectedBlocker}
        onSubmit={handleSubmitAssignment}
      />

      <AddManagerModal
        isOpen={showAddManagerModal}
        onClose={() => setShowAddManagerModal(false)}
        onSubmit={handleAddManager}
      />

      <SubcontractorBlockerModal
        isOpen={showSubcontractorBlockerModal}
        onClose={() => setShowSubcontractorBlockerModal(false)}
        blocker={selectedSubcontractorBlocker}
        action={blockerAction}
        onSubmit={handleSubcontractorBlockerSubmit}
      />

      <SubcontractorManagementModal
        isOpen={showSubcontractorManagementModal}
        onClose={() => setShowSubcontractorManagementModal(false)}
        subcontractor={selectedSubcontractorForProject}
        onSubmit={handleAddSubcontractorUser}
      />

      <DrawingsModal
        isOpen={showDrawingsModal}
        onClose={() => setShowDrawingsModal(false)}
      />
    </div>
  );
};

export default MobileFieldWorkerInterface;