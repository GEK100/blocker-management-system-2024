import React, { useState, useRef, useEffect } from 'react';
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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import {
  CameraIcon as CameraIconSolid,
  MicrophoneIcon as MicrophoneIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

const MobileTab = ({ icon: Icon, iconSolid: IconSolid, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-all duration-200 ${
      active
        ? 'text-construction-600 bg-construction-50'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`}
  >
    <div className="relative">
      {active && IconSolid ? (
        <IconSolid className="h-6 w-6" />
      ) : (
        <Icon className="h-6 w-6" />
      )}
      {badge && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-construction-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </div>
    <span className="text-xs font-medium mt-1 leading-tight">{label}</span>
  </button>
);

const TouchButton = ({ children, onClick, variant = 'primary', size = 'lg', className = '', disabled = false }) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-construction-600 hover:bg-construction-700 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-slate-600 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl",
    success: "bg-success-600 hover:bg-success-700 text-white shadow-lg hover:shadow-xl",
    danger: "bg-safety-600 hover:bg-safety-700 text-white shadow-lg hover:shadow-xl",
    outline: "bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 hover:border-slate-400 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-800"
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
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
        <div className="text-center">
          <div className="mb-6">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${isRecording ? 'bg-safety-100' : 'bg-construction-100'} mb-4`}>
              <MicrophoneIcon className={`h-12 w-12 ${isRecording ? 'text-safety-600' : 'text-construction-600'}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {isRecording ? 'Recording...' : 'Voice Note'}
            </h3>
            {isRecording && (
              <div className="text-2xl font-mono text-construction-600 mb-4">
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
                className="bg-construction-600 hover:bg-construction-700"
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
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX || e.touches[0].clientX) - rect.left - offset.x) / scale;
    const y = ((e.clientY || e.touches[0].clientY) - rect.top - offset.y) / scale;

    onMarkerAdd({ x, y });
  };

  return (
    <div className="relative h-full bg-slate-100 overflow-hidden touch-manipulation">
      {/* Floor Plan Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative"
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
            <div className="w-8 h-8 bg-construction-500 border-4 border-white rounded-full shadow-lg animate-bounce-gentle">
              <div className="w-full h-full bg-construction-600 rounded-full flex items-center justify-center">
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
          className="bg-white/90 backdrop-blur-sm mb-2 w-12 h-12 rounded-full"
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
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mx-4 text-center">
            <MapPinIcon className="h-8 w-8 text-construction-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Tap on the floor plan to add blocker locations
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const MobileFieldWorkerInterface = ({ user, project, blockers = [], onCreateBlocker, onUpdateBlocker }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSubmitBlocker = () => {
    if (!newBlocker.title.trim()) {
      alert('Please enter a blocker title');
      return;
    }

    onCreateBlocker({
      ...newBlocker,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      created_by: user,
      status: 'pending_review'
    });

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

  const renderHomeTab = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-construction p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Field Worker</h1>
        <p className="text-construction-100">
          {project?.name || 'Construction Site'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>

        <TouchButton
          onClick={() => setActiveTab('create')}
          variant="primary"
          size="xl"
          className="w-full"
        >
          <PlusIcon className="h-6 w-6 mr-3" />
          Report New Blocker
        </TouchButton>

        <div className="grid grid-cols-2 gap-4">
          <TouchButton
            onClick={() => setShowPhotoCapture(true)}
            variant="outline"
            size="lg"
            className="flex-col py-6"
          >
            <CameraIcon className="h-8 w-8 mb-2" />
            Take Photo
          </TouchButton>

          <TouchButton
            onClick={() => setActiveTab('floor-plan')}
            variant="outline"
            size="lg"
            className="flex-col py-6"
          >
            <DocumentIcon className="h-8 w-8 mb-2" />
            Floor Plan
          </TouchButton>
        </div>
      </div>

      {/* Recent Blockers */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h2>
        {blockers.length > 0 ? (
          <div className="space-y-3">
            {blockers.slice(0, 3).map(blocker => (
              <div key={blocker.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900 flex-1">{blocker.title}</h3>
                  <span className={`status-badge ml-2 ${
                    blocker.status === 'pending_review' ? 'status-pending' :
                    blocker.status === 'assigned' ? 'status-assigned' :
                    blocker.status === 'completed' ? 'status-completed' :
                    'status-verified'
                  }`}>
                    {blocker.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 text-sm line-clamp-2">{blocker.description}</p>
                <div className="flex items-center mt-2 text-sm text-slate-500">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {blocker.location || 'No location'}
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">New Blocker</h1>
          <TouchButton
            onClick={() => setActiveTab('home')}
            variant="ghost"
            size="md"
          >
            <XMarkIcon className="h-6 w-6" />
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
            className="form-input text-base py-4"
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
            rows={4}
            className="form-textarea text-base py-4"
          />
        </div>

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
            className="form-input text-base py-4"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['low', 'medium', 'high'].map(priority => (
              <TouchButton
                key={priority}
                onClick={() => setNewBlocker(prev => ({ ...prev, priority }))}
                variant={newBlocker.priority === priority ? 'primary' : 'outline'}
                size="md"
                className="capitalize"
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
          <div className="grid grid-cols-3 gap-3">
            <TouchButton
              onClick={() => setShowPhotoCapture(true)}
              variant="outline"
              size="lg"
              className="aspect-square flex-col"
            >
              <CameraIcon className="h-8 w-8 mb-1" />
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
                  className="absolute top-1 right-1 w-6 h-6 rounded-full p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
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
            className="w-full"
          >
            <MicrophoneIcon className="h-5 w-5 mr-2" />
            Add Voice Note
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

        {/* Submit Button */}
        <TouchButton
          onClick={handleSubmitBlocker}
          variant="primary"
          size="xl"
          className="w-full mt-8"
        >
          <CheckCircleIcon className="h-6 w-6 mr-2" />
          Submit Blocker Report
        </TouchButton>
      </div>
    </div>
  );

  const renderBlockersTab = () => (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Blockers</h1>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search blockers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 text-base py-4"
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
                  <h3 className="font-semibold text-slate-900 flex-1 text-lg">{blocker.title}</h3>
                  <span className={`status-badge ml-2 ${
                    blocker.status === 'pending_review' ? 'status-pending' :
                    blocker.status === 'assigned' ? 'status-assigned' :
                    blocker.status === 'completed' ? 'status-completed' :
                    'status-verified'
                  }`}>
                    {blocker.status.replace('_', ' ')}
                  </span>
                </div>

                {blocker.description && (
                  <p className="text-slate-600 mb-3 leading-relaxed">{blocker.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {blocker.location || 'No location'}
                  </div>
                  <span>{new Date(blocker.created_at).toLocaleDateString()}</span>
                </div>

                {blocker.photos && blocker.photos.length > 0 && (
                  <div className="flex items-center mt-3 text-sm text-success-600">
                    <PhotoIcon className="h-4 w-4 mr-1" />
                    {blocker.photos.length} photo{blocker.photos.length !== 1 ? 's' : ''}
                  </div>
                )}
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
    <div className="flex-1">
      <FloorPlanViewer
        floorPlan={project?.floorPlan}
        markers={project?.blockerMarkers || []}
        onMarkerAdd={(position) => {
          console.log('Add marker at:', position);
        }}
        onMarkerSelect={(marker) => {
          console.log('Selected marker:', marker);
        }}
      />
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'blockers' && renderBlockersTab()}
        {activeTab === 'floor-plan' && renderFloorPlanTab()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-200 safe-area-bottom">
        <div className="grid grid-cols-4">
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
            icon={DocumentIcon}
            label="Floor Plan"
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
    </div>
  );
};

export default MobileFieldWorkerInterface;