import React, { useState, useEffect } from 'react';
import { Upload, Palette, Eye, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/common/Button';
import AdminLayout from '../../components/layouts/AdminLayout';
import toast from 'react-hot-toast';

const BrandingConfig = () => {
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [appName, setAppName] = useState('MiCompra');
  const [colors, setColors] = useState({
    primary: '#FF6B35',
    secondary: '#004E89',
    accent: '#F7931E',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      console.log('[BrandingConfig] Loading branding configuration');

      // Get branding config from database
      const { data, error } = await supabase
        .from('platform_config')
        .select('*')
        .eq('key', 'branding')
        .single();

      if (error) {
        console.error('[BrandingConfig] Error loading branding:', error);
        return;
      }

      if (data?.value) {
        console.log('[BrandingConfig] Branding loaded:', data.value);
        if (data.value.logoUrl) {
          setLogoPreview(data.value.logoUrl);
        }
        if (data.value.appName) {
          setAppName(data.value.appName);
        }
        if (data.value.colors) {
          setColors(data.value.colors);
        }
      }
    } catch (error) {
      console.error('[BrandingConfig] Error loading branding:', error);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('[BrandingConfig] Logo file selected:', file.name);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    setLogo(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      console.log('[BrandingConfig] Logo preview created');
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logo) {
      toast.error('Por favor selecciona un logo primero');
      return null;
    }

    setIsUploading(true);
    console.log('[BrandingConfig] Uploading logo to storage');

    try {
      const fileName = `logo-${Date.now()}.${logo.name.split('.').pop()}`;
      const filePath = `branding/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('platform-assets')
        .upload(filePath, logo, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('[BrandingConfig] Error uploading logo:', error);
        toast.error('Error al subir el logo');
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('platform-assets')
        .getPublicUrl(filePath);

      console.log('[BrandingConfig] Logo uploaded successfully:', publicUrl);
      toast.success('Logo subido correctamente');

      return publicUrl;
    } catch (error) {
      console.error('[BrandingConfig] Error uploading logo:', error);
      toast.error('Error al subir el logo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleColorChange = (colorKey, value) => {
    setColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const saveBranding = async () => {
    setIsSaving(true);
    console.log('[BrandingConfig] Saving branding configuration');

    try {
      let logoUrl = logoPreview;

      // Upload logo if new file selected
      if (logo) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          setIsSaving(false);
          return;
        }
      }

      // Save branding config to database
      const brandingConfig = {
        appName,
        logoUrl,
        colors
      };

      const { error } = await supabase
        .from('platform_config')
        .upsert({
          key: 'branding',
          value: brandingConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('[BrandingConfig] Error saving branding:', error);
        toast.error('Error al guardar la configuración');
        return;
      }

      console.log('[BrandingConfig] Branding saved successfully');
      toast.success('Configuración de branding guardada correctamente');

      // Reload to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('[BrandingConfig] Error saving branding:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Branding</h1>
        <p className="text-gray-600 mt-1">
          Personaliza el logo, nombre y colores de la plataforma
        </p>
      </div>

      {/* Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Los cambios se aplicarán en toda la plataforma</p>
          <p>La página se recargará automáticamente después de guardar para aplicar los nuevos colores y logo.</p>
        </div>
      </div>

      {/* App Name */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xl font-bold">A</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nombre de la Aplicación</h2>
            <p className="text-sm text-gray-600">El nombre que aparecerá en toda la plataforma</p>
          </div>
        </div>

        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="Ej: MiCompra, Rappi Clone, etc."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Logo Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Upload className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Logo de la Plataforma</h2>
            <p className="text-sm text-gray-600">Sube el logo de la plataforma (PNG, JPG, SVG)</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Logo Preview */}
          {logoPreview && (
            <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="max-h-32 object-contain"
              />
            </div>
          )}

          {/* Upload Button */}
          <div>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={(e) => e.target.previousSibling.click()}
                className="w-full"
              >
                <Upload size={18} className="mr-2" />
                {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Tamaño máximo: 2MB. Formatos: PNG, JPG, SVG
            </p>
          </div>
        </div>
      </div>

      {/* Color Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Palette className="text-purple-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Colores del Brand</h2>
            <p className="text-sm text-gray-600">Define la paleta de colores de la plataforma</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Primario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="#FF6B35"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="#004E89"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color de Acento
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="w-16 h-16 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="#F7931E"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Eye className="text-green-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Vista Previa</h2>
            <p className="text-sm text-gray-600">Cómo se verán los colores en la plataforma</p>
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="h-16 rounded-lg flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: colors.primary }}
          >
            Color Primario
          </div>
          <div
            className="h-16 rounded-lg flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: colors.secondary }}
          >
            Color Secundario
          </div>
          <div
            className="h-16 rounded-lg flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: colors.accent }}
          >
            Color de Acento
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveBranding}
          disabled={isUploading || isSaving}
          className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
        >
          {(isUploading || isSaving) ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isUploading ? 'Subiendo...' : 'Guardando...'}
            </>
          ) : (
            <>
              <Check size={18} className="mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
    </AdminLayout>
  );
};

export default BrandingConfig;
