import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_BRANDING = {
  appName: 'MiCompra',
  logoUrl: null,
  colors: {
    primary: '#FF6B35',
    secondary: '#004E89',
    accent: '#F7931E',
  }
};

export const useBranding = () => {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      console.log('[useBranding] Loading branding configuration');
      
      const { data, error } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', 'branding')
        .single();

      if (error) {
        console.error('[useBranding] Error loading branding:', error);
        setBranding(DEFAULT_BRANDING);
        return;
      }

      if (data?.value) {
        console.log('[useBranding] Branding loaded:', data.value);
        setBranding({
          ...DEFAULT_BRANDING,
          ...data.value
        });
      }
    } catch (error) {
      console.error('[useBranding] Error loading branding:', error);
      setBranding(DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    branding,
    isLoading,
    reload: loadBranding
  };
};
