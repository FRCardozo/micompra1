import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    console.log('[AuthContext] Initializing auth check');

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);
        if (session?.user) {
          setUser(session.user);
          // Fetch profile in background
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      console.log('[AuthContext] Checking current user session');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthContext] Error getting session:', error);
      }

      if (session?.user) {
        console.log('[AuthContext] User session found:', session.user.id);
        setUser(session.user);
        // Fetch profile in background
        fetchProfile(session.user.id);
      } else {
        console.log('[AuthContext] No user session found');
      }
    } catch (error) {
      console.error('[AuthContext] Error in checkUser:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    console.log('[AuthContext] Starting profile fetch for user:', userId);
    setProfileLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found yet (might be creating via trigger)');
        }
        setProfile(null);
        return;
      }

      console.log('[AuthContext] Profile fetched successfully:', data?.role);
      setProfile(data);
    } catch (error) {
      console.error('[AuthContext] Profile fetch error:', error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const signUp = async (email, password, userData, documents = null) => {
    try {
      console.log('[AuthContext] Starting signup process for role:', userData.role);

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role || 'client',
            phone: userData.phone,
          },
          emailRedirectTo: 'https://www.nuevonerd.lat/auth/supabase-auth-callback',
        },
      });

      if (error) throw error;

      console.log('[AuthContext] User created successfully:', data.user?.id);

      // Upload documents for delivery drivers
      if (userData.role === 'delivery_driver' && documents && data.user) {
        // ... (Document upload logic retained if needed, but omitted here for brevity as it was correct)
        console.log('[AuthContext] Uploading documents logic skipped for brevity, keeping original if possible or assuming simple flow');
        // WAIT - I need to keep the document upload logic! The replace_file_content replaces the BLOCK.
        // Ill put the document upload logic back in strictly.
        await handleDocumentUpload(data.user.id, documents);
      }

      toast.success('Cuenta creada exitosamente. Revisa tu email para confirmar.');
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Signup error:', error);
      toast.error(error.message);
      return { data: null, error };
    }
  };

  // Helper for documents to keep signUp clean
  const handleDocumentUpload = async (userId, documents) => {
    console.log('[AuthContext] Uploading driver documents for user:', userId);
    try {
      const uploadPromises = [];
      if (documents.idCard) {
        const idCardPath = `${userId}/id-card-${Date.now()}.${documents.idCard.name.split('.').pop()}`;
        uploadPromises.push(supabase.storage.from('driver-documents').upload(idCardPath, documents.idCard));
      }
      if (documents.utilityBill) {
        const utilityBillPath = `${userId}/utility-bill-${Date.now()}.${documents.utilityBill.name.split('.').pop()}`;
        uploadPromises.push(supabase.storage.from('driver-documents').upload(utilityBillPath, documents.utilityBill));
      }
      await Promise.all(uploadPromises);
    } catch (e) {
      console.error('Document upload error', e);
      toast.error('Error subiendo documentos');
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Sesión iniciada exitosamente');
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      toast.error(error.message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Si hay un error, PERO es porque la sesión ya no existe (403 o MissingError), 
      // lo ignoramos porque el objetivo de cerrar sesión ya se cumplió en el servidor.
      if (error && error.name !== 'AuthSessionMissingError' && !error.message.includes('403')) {
        throw error;
      }
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error);
    } finally {
      // MAGIA: Pase lo que pase con el servidor, SIEMPRE destruimos la sesión 
      // visual en el navegador localmente.
      setUser(null);
      setProfile(null);
      
      // Limpiamos cualquier rastro extra que haya quedado en la memoria del navegador
      localStorage.removeItem('userLocation');
      localStorage.removeItem('returnUrl');
    }
  };

  const value = {
    user,
    profile,
    loading,
    profileLoading, // Exposed new state
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
