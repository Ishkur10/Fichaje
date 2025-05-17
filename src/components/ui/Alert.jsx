import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Alert = ({
  type = 'info',
  message,
  onClose = null,
  className = '',
}) => {

  const config = {
    info: {
      icon: <Info className="h-5 w-5" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700',
    },
    success: {
      icon: <CheckCircle className="h-5 w-5" />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5" />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
    },
  };

  const { icon, bgColor, borderColor, textColor } = config[type];

  return (
    <div
      className={`${bgColor} border-l-4 ${borderColor} p-4 mb-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className={`${textColor} mr-2`}>{icon}</div>
        <div className={`${textColor} flex-grow`}>{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;       