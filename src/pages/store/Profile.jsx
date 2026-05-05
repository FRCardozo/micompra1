import React, { useState, useEffect, useRef } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Store, MapPin, Phone, Upload, Image as ImageIcon, Plus, Trash2, Zap } from 'lucide-react';

const StoreProfile = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const logoInputRef = useRef(null);
  const banner1InputRef = useRef(null);
  const banner2InputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', description: '', address: '', phone: '', logo_url: '', banner_url_1: '', banner_url_2: ''
  });

  useEffect(() => {
    if (profile?.id) fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', profile.id)
        .single();

      if (storeError) throw storeError;

      if (storeData) {
        setStore(storeData);
        setFormData({
          name: storeData.name || '', description: storeData.description || '', address: storeData.address || '',
          phone: storeData.phone || '', logo_url: storeData.logo_url || '', banner_url_1: storeData.banner_url_1 || '', banner_url_2: storeData.banner_url_2 || ''
        });

        const { data: catData } = await supabase.from('store_categories').select('*').eq('store_id', storeData.id).order('name');
        setCategories(catData || []);
      }
    } catch (error) {
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('stores').update({
        name: formData.name, description: formData.description, address: formData.address, phone: formData.phone,
      }).eq('id', store.id);
      if (error) throw error;
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file || !store) return;
    try {
      toast.loading(`Subiendo imagen...`, { id: 'upload' });
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}_${fieldName}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `store_images/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('stores').update({ [fieldName]: publicUrl }).eq('id', store.id);
      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, [fieldName]: publicUrl }));
      toast.success('Imagen guardada', { id: 'upload' });
    } catch (error) {
      toast.error('Error al subir la imagen', { id: 'upload' });
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !store) return;
    try {
      const { data, error } = await supabase.from('store_categories').insert([{ store_id: store.id, name: newCategoryName.trim() }]).select().single();
      if (error) throw error;
      setCategories([...categories, data]);
      setNewCategoryName('');
      toast.success('Categoría agregada');
    } catch (error) {
      toast.error('Error al agregar categoría');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    try {
      const { error } = await supabase.from('store_categories').delete().eq('id', categoryId);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== categoryId));
      toast.success('Categoría eliminada');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  if (loading) return <StoreLayout><div className="p-10 text-center">Cargando...</div></StoreLayout>;
  if (!store) return <StoreLayout><div className="p-10 text-center">No tienes tienda asignada</div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <div><h1 className="text-2xl font-bold text-gray-900">Configuración del Negocio</h1></div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4"><Zap className="w-6 h-6 text-purple-600" /><h2 className="text-lg font-bold text-gray-900">Tablón de Anuncios (Banners)</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => banner1InputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 relative overflow-hidden group">
              {formData.banner_url_1 ? ( <><img src={formData.banner_url_1} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="text-white font-bold">Cambiar Imagen</span></div></>) : ( <div className="text-center text-gray-500">Banner Principal</div> )}
              <input type="file" ref={banner1InputRef} onChange={(e) => handleImageUpload(e, 'banner_url_1')} accept="image/*" className="hidden" />
            </div>
            <div onClick={() => banner2InputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 relative overflow-hidden group">
              {formData.banner_url_2 ? ( <><img src={formData.banner_url_2} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="text-white font-bold">Cambiar Imagen</span></div></>) : ( <div className="text-center text-gray-500">Banner Secundario</div> )}
              <input type="file" ref={banner2InputRef} onChange={(e) => handleImageUpload(e, 'banner_url_2')} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Información General</h2>
            <div className="flex flex-col sm:flex-row gap-6 mb-6 items-center sm:items-start">
              <div onClick={() => logoInputRef.current?.click()} className="w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center overflow-hidden cursor-pointer relative group bg-gray-50">
                {formData.logo_url ? <img src={formData.logo_url} className="w-full h-full object-cover" /> : <Store className="w-12 h-12 text-gray-300" />}
                <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo_url')} accept="image/*" className="hidden" />
              </div>
              <form id="profileForm" onSubmit={handleUpdateProfile} className="flex-1 space-y-4 w-full">
                <input type="text" name="name" required className="w-full px-4 py-3 rounded-xl border border-gray-300" value={formData.name} onChange={handleChange} placeholder="Nombre del Negocio" />
                <input type="text" name="description" className="w-full px-4 py-3 rounded-xl border border-gray-300" value={formData.description} onChange={handleChange} placeholder="Descripción Breve" />
              </form>
            </div>
            <div className="space-y-4">
              <input type="text" name="address" className="w-full px-4 py-3 rounded-xl border border-gray-300" value={formData.address} onChange={handleChange} placeholder="Dirección" />
              <input type="text" name="phone" className="w-full px-4 py-3 rounded-xl border border-gray-300" value={formData.phone} onChange={handleChange} placeholder="Teléfono" />
            </div>
            <button type="submit" form="profileForm" disabled={saving} className="mt-6 w-full bg-purple-600 text-white font-bold py-3 rounded-xl">{saving ? 'Guardando...' : 'Guardar Datos'}</button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Categorías</h2>
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input type="text" placeholder="Nueva categoría..." className="flex-1 px-3 py-2 text-sm rounded-lg border" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <button type="submit" disabled={!newCategoryName.trim()} className="bg-purple-600 text-white p-2 rounded-lg"><Plus className="w-5 h-5" /></button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border group">
                  <span className="font-medium text-gray-700 text-sm truncate">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default StoreProfile;