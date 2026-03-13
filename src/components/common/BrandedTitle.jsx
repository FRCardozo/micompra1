import { useEffect } from 'react';
import { useBranding } from '../../hooks/useBranding';

const BrandedTitle = ({ suffix = '' }) => {
  const { branding } = useBranding();

  useEffect(() => {
    const appName = branding?.appName || 'MiCompra';
    document.title = suffix ? `${appName} - ${suffix}` : appName;
  }, [branding, suffix]);

  return null;
};

export default BrandedTitle;
