import React, { useState, useRef } from 'react';
import {
  CameraIcon,
  MicrophoneIcon,
  MapPinIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import {
  CameraIcon as CameraIconSolid,
  MicrophoneIcon as MicrophoneIconSolid
} from '@heroicons/react/24/solid';

const MobileInput = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  helper,
  icon: Icon,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-base font-semibold text-slate-700">
          {label}
          {required && <span className="text-safety-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        )}

        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            form-input text-base py-4 w-full touch-manipulation
            ${Icon ? 'pl-12' : 'pl-4'}
            ${type === 'password' ? 'pr-12' : 'pr-4'}
            ${error ? 'form-input-error' : ''}
            min-h-[56px] rounded-xl
          `}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center text-safety-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helper && !error && (
        <div className="flex items-center text-slate-500 text-sm">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{helper}</span>
        </div>
      )}
    </div>
  );
};

const MobileTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helper,
  rows = 4,
  maxLength,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-base font-semibold text-slate-700">
            {label}
            {required && <span className="text-safety-500 ml-1">*</span>}
          </label>
          {maxLength && (
            <span className="text-sm text-slate-500">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`
          form-textarea text-base py-4 px-4 w-full touch-manipulation
          ${error ? 'form-input-error' : ''}
          rounded-xl resize-none
        `}
        {...props}
      />

      {error && (
        <div className="flex items-center text-safety-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helper && !error && (
        <div className="flex items-center text-slate-500 text-sm">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{helper}</span>
        </div>
      )}
    </div>
  );
};

const MobileSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  error,
  helper,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-base font-semibold text-slate-700">
          {label}
          {required && <span className="text-safety-500 ml-1">*</span>}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        className={`
          form-select text-base py-4 px-4 w-full touch-manipulation
          ${error ? 'form-input-error' : ''}
          min-h-[56px] rounded-xl
        `}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <div className="flex items-center text-safety-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helper && !error && (
        <div className="flex items-center text-slate-500 text-sm">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{helper}</span>
        </div>
      )}
    </div>
  );
};

const MobileCheckbox = ({
  label,
  checked,
  onChange,
  required = false,
  error,
  disabled = false,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <label className="flex items-start space-x-3 cursor-pointer touch-manipulation py-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`
            form-checkbox mt-1 w-5 h-5 rounded focus:ring-2 focus:ring-construction-500
            ${error ? 'border-safety-500 focus:border-safety-500 focus:ring-safety-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          {...props}
        />
        <span className={`text-base leading-relaxed ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
          {label}
          {required && <span className="text-safety-500 ml-1">*</span>}
        </span>
      </label>

      {error && (
        <div className="flex items-center text-safety-600 text-sm ml-8">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const MobileRadioGroup = ({
  label,
  value,
  onChange,
  options = [],
  required = false,
  error,
  layout = 'vertical' // 'vertical' or 'horizontal'
}) => {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-base font-semibold text-slate-700">
          {label}
          {required && <span className="text-safety-500 ml-1">*</span>}
        </label>
      )}

      <div className={`space-y-2 ${layout === 'horizontal' ? 'sm:space-y-0 sm:space-x-4 sm:flex' : ''}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center space-x-3 cursor-pointer touch-manipulation py-2"
          >
            <input
              type="radio"
              name={`radio-group-${Date.now()}`}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="form-radio w-5 h-5 cursor-pointer focus:ring-2 focus:ring-construction-500"
            />
            <span className="text-base text-slate-700">{option.label}</span>
          </label>
        ))}
      </div>

      {error && (
        <div className="flex items-center text-safety-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const MobileSlider = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  required = false,
  error,
  helper,
  showValue = true,
  ...props
}) => {
  return (
    <div className="space-y-3">
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-base font-semibold text-slate-700">
            {label}
            {required && <span className="text-safety-500 ml-1">*</span>}
          </label>
          {showValue && (
            <span className="text-base font-semibold text-construction-600">
              {value}
            </span>
          )}
        </div>
      )}

      <div className="px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="
            w-full h-8 bg-slate-200 rounded-lg appearance-none cursor-pointer touch-manipulation
            focus:outline-none focus:ring-2 focus:ring-construction-500
          "
          style={{
            background: `linear-gradient(to right, #ed7611 0%, #ed7611 ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%, #e2e8f0 100%)`
          }}
          {...props}
        />

        <div className="flex justify-between text-sm text-slate-500 mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center text-safety-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helper && !error && (
        <div className="flex items-center text-slate-500 text-sm">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{helper}</span>
        </div>
      )}
    </div>
  );
};

const MobileFileUpload = ({
  label,
  files = [],
  onFileAdd,
  onFileRemove,
  accept = "image/*",
  multiple = true,
  maxFiles = 10,
  required = false,
  error,
  helper,
  captureType = "camera" // "camera", "gallery", or "both"
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach(file => {
      if (files.length < maxFiles) {
        onFileAdd(file);
      }
    });
    // Reset input
    e.target.value = '';
  };

  const triggerFileSelect = (capture = false) => {
    if (fileInputRef.current) {
      if (capture && captureType !== "gallery") {
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-base font-semibold text-slate-700">
            {label}
            {required && <span className="text-safety-500 ml-1">*</span>}
          </label>
          <span className="text-sm text-slate-500">
            {files.length}/{maxFiles}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Buttons */}
      <div className="flex gap-3">
        {(captureType === "camera" || captureType === "both") && (
          <button
            type="button"
            onClick={() => triggerFileSelect(true)}
            disabled={files.length >= maxFiles}
            className="
              flex-1 flex items-center justify-center py-4 px-4
              bg-construction-50 hover:bg-construction-100
              text-construction-700 font-medium rounded-xl
              border-2 border-construction-200 hover:border-construction-300
              transition-colors duration-200 touch-manipulation
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[56px]
            "
          >
            <CameraIconSolid className="h-6 w-6 mr-2" />
            Take Photo
          </button>
        )}

        {(captureType === "gallery" || captureType === "both") && (
          <button
            type="button"
            onClick={() => triggerFileSelect(false)}
            disabled={files.length >= maxFiles}
            className="
              flex-1 flex items-center justify-center py-4 px-4
              bg-slate-50 hover:bg-slate-100
              text-slate-700 font-medium rounded-xl
              border-2 border-slate-200 hover:border-slate-300
              transition-colors duration-200 touch-manipulation
              disabled:opacity-50 disabled:cursor-not-allowed
              min-h-[56px]
            "
          >
            <PlusIcon className="h-6 w-6 mr-2" />
            From Gallery
          </button>
        )}
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          {files.map((file, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
              <img
                src={typeof file === 'string' ? file : URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onFileRemove(index)}
                className="
                  absolute top-2 right-2 w-8 h-8
                  bg-safety-500 hover:bg-safety-600 text-white
                  rounded-full flex items-center justify-center
                  transition-colors duration-200 touch-manipulation
                "
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center text-safety-600 text-sm">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helper && !error && (
        <div className="flex items-center text-slate-500 text-sm">
          <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>{helper}</span>
        </div>
      )}
    </div>
  );
};

const MobileStepIndicator = ({
  steps = [],
  currentStep = 0,
  onStepClick,
  clickable = false
}) => {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <button
                onClick={() => clickable && onStepClick && onStepClick(index)}
                disabled={!clickable}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-colors duration-200 touch-manipulation
                  ${index <= currentStep
                    ? 'bg-construction-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                  }
                  ${clickable && index <= currentStep ? 'hover:bg-construction-700 cursor-pointer' : ''}
                  ${!clickable || index > currentStep ? 'cursor-not-allowed' : ''}
                `}
              >
                {index < currentStep ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </button>
              <span className={`
                mt-2 text-xs font-medium text-center
                ${index <= currentStep ? 'text-construction-600' : 'text-slate-500'}
              `}>
                {step}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-1 mx-2 rounded-full
                ${index < currentStep ? 'bg-construction-600' : 'bg-slate-200'}
              `} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const MobileFormSection = ({ title, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-500 hover:text-slate-700 touch-manipulation"
            >
              {isOpen ? (
                <MinusIcon className="h-5 w-5" />
              ) : (
                <PlusIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      )}

      {(!collapsible || isOpen) && (
        <div className="space-y-6 animate-slide-in-up">
          {children}
        </div>
      )}
    </div>
  );
};

// Export all components
export {
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobileCheckbox,
  MobileRadioGroup,
  MobileSlider,
  MobileFileUpload,
  MobileStepIndicator,
  MobileFormSection
};

// Example usage component
const MobileOptimizedForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    location: '',
    photos: [],
    acceptTerms: false,
    contactMethod: '',
    urgencyLevel: 5
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const steps = ['Basic Info', 'Details', 'Media', 'Review'];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const contactOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'Text Message' },
    { value: 'call', label: 'Phone Call' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileAdd = (file) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, file]
    }));
  };

  const handleFileRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.priority) newErrors.priority = 'Priority is required';
        break;
      case 1: // Details
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        break;
      case 2: // Media
        if (formData.photos.length === 0) newErrors.photos = 'At least one photo is required';
        break;
      case 3: // Review
        if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm">
        <MobileStepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          clickable={true}
        />
      </div>

      <div className="p-6 space-y-8">
        {currentStep === 0 && (
          <MobileFormSection title="Basic Information">
            <MobileInput
              label="Blocker Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter a brief title"
              required
              error={errors.title}
              maxLength={100}
            />

            <MobileSelect
              label="Priority Level"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              options={priorityOptions}
              placeholder="Select priority"
              required
              error={errors.priority}
            />

            <MobileInput
              label="Location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Room, area, or coordinates"
              icon={MapPinIcon}
              helper="Be as specific as possible for faster resolution"
            />
          </MobileFormSection>
        )}

        {currentStep === 1 && (
          <MobileFormSection title="Detailed Information">
            <MobileTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the blocker in detail..."
              required
              error={errors.description}
              maxLength={500}
              rows={5}
            />

            <MobileSlider
              label="Urgency Level"
              value={formData.urgencyLevel}
              onChange={(value) => handleInputChange('urgencyLevel', value)}
              min={1}
              max={10}
              helper="1 = Can wait, 10 = Immediate attention needed"
            />

            <MobileRadioGroup
              label="Preferred Contact Method"
              value={formData.contactMethod}
              onChange={(value) => handleInputChange('contactMethod', value)}
              options={contactOptions}
              layout="vertical"
            />
          </MobileFormSection>
        )}

        {currentStep === 2 && (
          <MobileFormSection title="Photo Documentation">
            <MobileFileUpload
              label="Blocker Photos"
              files={formData.photos}
              onFileAdd={handleFileAdd}
              onFileRemove={handleFileRemove}
              accept="image/*"
              multiple={true}
              maxFiles={5}
              captureType="both"
              required
              error={errors.photos}
              helper="Take clear photos showing the blocker from multiple angles"
            />
          </MobileFormSection>
        )}

        {currentStep === 3 && (
          <MobileFormSection title="Review & Submit">
            <div className="bg-slate-100 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-slate-900">Summary</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Title:</strong> {formData.title}</div>
                <div><strong>Priority:</strong> {priorityOptions.find(o => o.value === formData.priority)?.label}</div>
                <div><strong>Location:</strong> {formData.location || 'Not specified'}</div>
                <div><strong>Description:</strong> {formData.description}</div>
                <div><strong>Photos:</strong> {formData.photos.length} attached</div>
                <div><strong>Urgency:</strong> {formData.urgencyLevel}/10</div>
              </div>
            </div>

            <MobileCheckbox
              label="I confirm that all information provided is accurate and I accept the terms of service"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              required
              error={errors.acceptTerms}
            />
          </MobileFormSection>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-4 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors duration-200 touch-manipulation min-h-[56px]"
            >
              Previous
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-4 px-6 bg-construction-600 hover:bg-construction-700 text-white font-semibold rounded-xl transition-colors duration-200 touch-manipulation min-h-[56px]"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 py-4 px-6 bg-success-600 hover:bg-success-700 text-white font-semibold rounded-xl transition-colors duration-200 touch-manipulation min-h-[56px]"
            >
              Submit Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedForm;