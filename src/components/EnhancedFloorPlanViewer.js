import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  MinusIcon,
  HomeIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  EyeIcon,
  Cog6ToothIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  PhotoIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  MapPinIcon as MapPinIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';

const MarkerIcon = ({ type = 'blocker', priority = 'medium', index, size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const colors = {
    blocker: {
      high: 'bg-safety-500 border-safety-600',
      medium: 'bg-warning-500 border-warning-600',
      low: 'bg-success-500 border-success-600'
    },
    completed: 'bg-success-500 border-success-600',
    location: 'bg-blue-500 border-blue-600',
    reference: 'bg-slate-500 border-slate-600'
  };

  const getColor = () => {
    if (type === 'blocker') {
      return colors.blocker[priority] || colors.blocker.medium;
    }
    return colors[type] || colors.location;
  };

  return (
    <div
      className={`
        ${sizes[size]} ${getColor()}
        border-4 border-white rounded-full shadow-lg
        flex items-center justify-center text-white font-bold
        animate-bounce-gentle
      `}
      style={{ animation: 'bounce 2s ease-in-out infinite' }}
    >
      {type === 'blocker' && priority === 'high' ? (
        <ExclamationTriangleIconSolid className="h-4 w-4" />
      ) : (
        <span className="text-xs">{index + 1}</span>
      )}
    </div>
  );
};

const ZoomControls = ({ scale, onZoomIn, onZoomOut, onReset, onFitToScreen, isVisible, onToggle }) => {
  const controls = [
    { icon: PlusIcon, action: onZoomIn, label: 'Zoom In', disabled: scale >= 5 },
    { icon: MinusIcon, action: onZoomOut, label: 'Zoom Out', disabled: scale <= 0.25 },
    { icon: ArrowsPointingOutIcon, action: onFitToScreen, label: 'Fit to Screen' },
    { icon: HomeIcon, action: onReset, label: 'Reset View' }
  ];

  return (
    <div className="absolute top-4 right-4 z-20">
      <button
        onClick={onToggle}
        className="
          w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200
          rounded-full shadow-lg flex items-center justify-center
          text-slate-600 hover:text-slate-800 hover:bg-white
          transition-all duration-200 touch-manipulation mb-2
        "
      >
        {isVisible ? <ChevronUpIcon className="h-5 w-5" /> : <Cog6ToothIcon className="h-5 w-5" />}
      </button>

      {isVisible && (
        <div className="space-y-2 animate-slide-in-up">
          {controls.map((control, index) => (
            <button
              key={index}
              onClick={control.action}
              disabled={control.disabled}
              title={control.label}
              className="
                w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200
                rounded-full shadow-lg flex items-center justify-center
                text-slate-600 hover:text-slate-800 hover:bg-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 touch-manipulation
              "
            >
              <control.icon className="h-5 w-5" />
            </button>
          ))}

          {/* Scale Indicator */}
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 text-center">
            <span className="text-xs font-semibold text-slate-700">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const MarkerDetailsPopup = ({ marker, onClose, onEdit, onDelete, position }) => {
  if (!marker) return null;

  const priorityColors = {
    high: 'text-safety-600 bg-safety-50 border-safety-200',
    medium: 'text-warning-600 bg-warning-50 border-warning-200',
    low: 'text-success-600 bg-success-50 border-success-200'
  };

  return (
    <div
      className="absolute z-30 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-80 max-w-sm animate-fade-in"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.max(20, position.y - 100)
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-slate-900 flex-1 mr-2">
          {marker.title || `Marker ${marker.index + 1}`}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded touch-manipulation"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {marker.type === 'blocker' && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium border
            ${priorityColors[marker.priority] || priorityColors.medium}
          `}>
            {marker.priority} priority
          </span>
          <span className="text-xs text-slate-500">
            {marker.status || 'Pending'}
          </span>
        </div>
      )}

      {marker.description && (
        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
          {marker.description}
        </p>
      )}

      <div className="text-xs text-slate-500 mb-3">
        Position: ({Math.round(marker.x)}, {Math.round(marker.y)})
        {marker.created_at && (
          <span className="block">
            Created: {new Date(marker.created_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {marker.photos && marker.photos.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <PhotoIcon className="h-4 w-4 text-slate-500 mr-1" />
            <span className="text-xs text-slate-500">{marker.photos.length} photo(s)</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {marker.photos.slice(0, 3).map((photo, index) => (
              <img
                key={index}
                src={photo.thumbnail || photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-12 object-cover rounded border"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onEdit(marker)}
          className="flex-1 px-3 py-2 bg-construction-50 text-construction-600 rounded-lg text-sm font-medium hover:bg-construction-100 transition-colors touch-manipulation"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(marker)}
          className="flex-1 px-3 py-2 bg-safety-50 text-safety-600 rounded-lg text-sm font-medium hover:bg-safety-100 transition-colors touch-manipulation"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

const EnhancedFloorPlanViewer = ({
  floorPlan,
  markers = [],
  onMarkerAdd,
  onMarkerUpdate,
  onMarkerDelete,
  onMarkerSelect,
  mode = 'view', // 'view', 'edit', 'measure'
  showGrid = false,
  showMeasurements = false,
  allowZoom = true,
  allowPan = true,
  className = ''
}) => {
  // State management
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });
  const lastTapRef = useRef(0);

  // Image loading
  useEffect(() => {
    if (floorPlan) {
      const img = new Image();
      img.onload = () => {
        setIsLoading(false);
        fitToScreen();
      };
      img.onerror = () => {
        setError('Failed to load floor plan');
        setIsLoading(false);
      };
      img.src = floorPlan;
    }
  }, [floorPlan]);

  // Touch and mouse event handlers
  const getEventCoordinates = (e) => {
    const isTouch = e.touches && e.touches.length > 0;
    return {
      x: isTouch ? e.touches[0].clientX : e.clientX,
      y: isTouch ? e.touches[0].clientY : e.clientY
    };
  };

  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleInteractionStart = useCallback((e) => {
    e.preventDefault();
    const coords = getEventCoordinates(e);

    if (e.touches && e.touches.length === 2) {
      // Pinch to zoom
      touchStartRef.current.distance = getTouchDistance(e.touches);
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: coords.x - offset.x,
      y: coords.y - offset.y
    });
    touchStartRef.current = { x: coords.x, y: coords.y };
  }, [offset]);

  const handleInteractionMove = useCallback((e) => {
    e.preventDefault();

    if (e.touches && e.touches.length === 2 && allowZoom) {
      // Handle pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      const deltaScale = (currentDistance - touchStartRef.current.distance) * 0.01;
      const newScale = Math.max(0.25, Math.min(5, scale + deltaScale));

      if (newScale !== scale) {
        setScale(newScale);
        touchStartRef.current.distance = currentDistance;
      }
      return;
    }

    if (isDragging && allowPan) {
      const coords = getEventCoordinates(e);
      setOffset({
        x: coords.x - dragStart.x,
        y: coords.y - dragStart.y
      });
    }
  }, [isDragging, dragStart, scale, allowPan, allowZoom]);

  const handleInteractionEnd = useCallback((e) => {
    if (isDragging) {
      const coords = getEventCoordinates(e.changedTouches ? e.changedTouches[0] : e);
      const moveDistance = Math.sqrt(
        Math.pow(coords.x - touchStartRef.current.x, 2) +
        Math.pow(coords.y - touchStartRef.current.y, 2)
      );

      // Handle tap/click if minimal movement
      if (moveDistance < 10 && mode === 'edit') {
        handleFloorPlanTap(e);
      }
    }

    setIsDragging(false);
    setSelectedMarker(null);
  }, [isDragging, mode]);

  const handleFloorPlanTap = (e) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    const coords = getEventCoordinates(e.changedTouches ? e.changedTouches[0] : e);

    // Convert screen coordinates to image coordinates
    const x = (coords.x - imgRect.left) / scale;
    const y = (coords.y - imgRect.top) / scale;

    // Check if tap is within image bounds
    if (x >= 0 && x <= imageRef.current.naturalWidth && y >= 0 && y <= imageRef.current.naturalHeight) {
      // Check for double tap
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap - zoom in
        zoomToPoint(coords.x - rect.left, coords.y - rect.top);
      } else if (mode === 'edit' && onMarkerAdd) {
        // Single tap - add marker
        onMarkerAdd({ x, y });
      }
      lastTapRef.current = now;
    }
  };

  const handleMarkerClick = (marker, index, e) => {
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    setPopupPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectedMarker({ ...marker, index });
    onMarkerSelect?.(marker, index);
  };

  // Zoom and pan controls
  const zoomIn = () => setScale(prev => Math.min(prev * 1.5, 5));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.5, 0.25));

  const zoomToPoint = (screenX, screenY) => {
    const newScale = Math.min(scale * 2, 5);
    const scaleRatio = newScale / scale;

    // Calculate new offset to zoom into the point
    const newOffset = {
      x: screenX - (screenX - offset.x) * scaleRatio,
      y: screenY - (screenY - offset.y) * scaleRatio
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const img = imageRef.current;
    const imageWidth = img.naturalWidth || img.width;
    const imageHeight = img.naturalHeight || img.height;

    if (imageWidth && imageHeight) {
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% of container

      setScale(newScale);
      setOffset({
        x: (containerWidth - imageWidth * newScale) / 2,
        y: (containerHeight - imageHeight * newScale) / 2
      });
    }
  }, []);

  // Event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add event listeners
    container.addEventListener('wheel', (e) => {
      if (!allowZoom) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.25, Math.min(5, scale * zoomFactor));

      if (newScale !== scale) {
        const scaleRatio = newScale / scale;
        setOffset({
          x: mouseX - (mouseX - offset.x) * scaleRatio,
          y: mouseY - (mouseY - offset.y) * scaleRatio
        });
        setScale(newScale);
      }
    }, { passive: false });

    return () => {
      // Cleanup handled by useEffect cleanup
    };
  }, [scale, offset, allowZoom]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-slate-100 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-construction-200 border-t-construction-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-slate-100 ${className}`}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-full bg-slate-100 overflow-hidden touch-manipulation select-none ${className}`}
      onMouseDown={handleInteractionStart}
      onMouseMove={handleInteractionMove}
      onMouseUp={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchMove={handleInteractionMove}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Floor Plan Image */}
      {floorPlan && (
        <img
          ref={imageRef}
          src={floorPlan}
          alt="Floor plan"
          className="max-w-none select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            cursor: isDragging ? 'grabbing' : mode === 'edit' ? 'crosshair' : 'grab'
          }}
          draggable={false}
        />
      )}

      {/* Grid Overlay */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${50 * scale}px ${50 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`
          }}
        />
      )}

      {/* Markers */}
      {markers.map((marker, index) => {
        const screenX = marker.x * scale + offset.x;
        const screenY = marker.y * scale + offset.y;

        return (
          <div
            key={marker.id || index}
            className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: screenX,
              top: screenY,
              visibility: screenX > -50 && screenX < window.innerWidth + 50 &&
                         screenY > -50 && screenY < window.innerHeight + 50 ? 'visible' : 'hidden'
            }}
            onClick={(e) => handleMarkerClick(marker, index, e)}
          >
            <MarkerIcon
              type={marker.type}
              priority={marker.priority}
              index={index}
              size={scale > 2 ? 'lg' : scale > 1 ? 'md' : 'sm'}
            />
          </div>
        );
      })}

      {/* Zoom Controls */}
      {allowZoom && (
        <ZoomControls
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetView}
          onFitToScreen={fitToScreen}
          isVisible={showZoomControls}
          onToggle={() => setShowZoomControls(!showZoomControls)}
        />
      )}

      {/* Marker Details Popup */}
      {selectedMarker && (
        <MarkerDetailsPopup
          marker={selectedMarker}
          position={popupPosition}
          onClose={() => setSelectedMarker(null)}
          onEdit={(marker) => {
            onMarkerUpdate?.(marker);
            setSelectedMarker(null);
          }}
          onDelete={(marker) => {
            onMarkerDelete?.(marker);
            setSelectedMarker(null);
          }}
        />
      )}

      {/* Instructions */}
      {markers.length === 0 && mode === 'edit' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mx-4 text-center animate-fade-in">
            <MapPinIcon className="h-8 w-8 text-construction-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Tap on the floor plan to add markers
            </p>
            <p className="text-xs text-slate-500">
              Double tap to zoom • Pinch to zoom • Drag to pan
            </p>
          </div>
        </div>
      )}

      {/* Mode Indicator */}
      {mode !== 'view' && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-construction-100 text-construction-800 px-3 py-1 rounded-full text-sm font-medium">
            {mode === 'edit' ? 'Edit Mode' : 'Measure Mode'}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFloorPlanViewer;