import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentUpload = ({ onDocumentsChange, disabled }) => {
  const [documents, setDocuments] = useState({
    idCard: null,
    utilityBill: null,
  });

  const [errors, setErrors] = useState({});

  const handleFileChange = (type, file) => {
    console.log('[DocumentUpload] File selected:', type, file?.name);

    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [type]: 'Solo se permiten archivos JPG, PNG o PDF'
      }));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        [type]: 'El archivo debe ser menor a 5MB'
      }));
      return;
    }

    // Clear error and set file
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[type];
      return newErrors;
    });

    const newDocuments = {
      ...documents,
      [type]: file,
    };

    setDocuments(newDocuments);
    onDocumentsChange(newDocuments);
    console.log('[DocumentUpload] Documents updated:', newDocuments);
  };

  const removeFile = (type) => {
    const newDocuments = {
      ...documents,
      [type]: null,
    };
    setDocuments(newDocuments);
    onDocumentsChange(newDocuments);
  };

  const DocumentField = ({ type, label, description }) => {
    const file = documents[type];
    const error = errors[type];
    const inputId = `file-${type}`;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500">{description}</p>

        {!file ? (
          <label
            htmlFor={inputId}
            className={`
              relative flex flex-col items-center justify-center w-full h-32
              border-2 border-dashed rounded-xl cursor-pointer
              transition-all duration-200
              ${error
                ? 'border-red-300 bg-red-50 hover:bg-red-100'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-orange-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className={`mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} size={32} />
              <p className="mb-1 text-sm text-gray-600 font-medium">
                Haz clic para subir
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG o PDF (máx. 5MB)
              </p>
            </div>
            <input
              id={inputId}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => handleFileChange(type, e.target.files[0])}
              disabled={disabled}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <FileText className="text-green-600" size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <button
                type="button"
                onClick={() => removeFile(type)}
                disabled={disabled}
                className="p-1 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Documentos requeridos para domiciliarios
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Para verificar tu identidad y garantizar la seguridad de todos los usuarios,
              necesitamos estos documentos. La información será tratada de forma confidencial.
            </p>
          </div>
        </div>
      </div>

      <DocumentField
        type="idCard"
        label="Copia de cédula"
        description="Foto clara de tu documento de identidad (por ambas caras)"
      />

      <DocumentField
        type="utilityBill"
        label="Recibo de servicio público"
        description="Recibo de luz, agua o gas de los últimos 3 meses"
      />
    </div>
  );
};

export default DocumentUpload;
