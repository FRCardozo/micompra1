import React, { useState, useEffect, useRef } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload } from 'lucide-react';

const StoreProducts = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    id: null, name: '', description: '', price: '', image_url: '', category_id: '', is_active: true
  });

  useEffect(() => {
    if (profile?.id) fetchData();
  }, [profile]);

  const fetchData = async () => {
    try {
      const { data: storeData } = await supabase.from('stores').select('id').eq('owner_id', profile.id).single();
      if (storeData) {
        setStore(storeData);
        const { data: prodData } = await supabase.from('products').select('*, store_categories(name)').eq('store_id', storeData.id).order('created_at', { ascending: false });
        setProducts(prodData || []);
        const { data: catData } = await supabase.from('store_categories').select('id, name').eq('store_id', storeData.id).order('name');
        setCategories(catData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !store) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product_images/${fileName}`;
      
      // Aquí estamos SUBIENDO EL ARCHIVO FÍSICO a tu base de datos
      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
      toast.success('¡Foto subida con éxito!');
    } catch (error) {
      toast.error('Error al subir la foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id) return toast.error('Por favor selecciona una categoría');
    try {
      setIsUploading(true);
      
      // Generador automático de SLUG (Soluciona el error 400)
      const generatedSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

      const payload = {
        store_id: store.id, 
        name: formData.name, 
        slug: generatedSlug, // Se envía automáticamente a la base de datos
        description: formData.description,
        price: parseFloat(formData.price), 
        image_url: formData.image_url,
        category_id: formData.category_id, 
        is_active: formData.is_active
      };
      
      if (formData.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', formData.id);
        if (error) throw error;
        toast.success('Producto actualizado');
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
        toast.success('Producto creado exitosamente');
      }
      setShowModal(false);
      fetchData(); 
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Ocurrió un error al guardar el producto');
    } finally {
      setIsUploading(false);
    }
  };

  // BOTÓN DE ELIMINAR PRODUCTO (Bote de basura)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Seguro que deseas ELIMINAR este producto de tu catálogo? Esta acción no se puede deshacer.')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast.success('Producto eliminado del sistema');
      fetchData(); // Recarga la lista automáticamente
    } catch (error) {
      toast.error('No se pudo eliminar el producto');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setFormData(product);
    } else {
      const defaultCategory = categories.length > 0 ? categories[0].id : '';
      setFormData({ id: null, name: '', description: '', price: '', image_url: '', category_id: defaultCategory, is_active: true });
    }
    setShowModal(true);
  };

  if (loading) return <StoreLayout><div className="p-10 text-center">Cargando catálogo...</div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900">Mi Catálogo</h1></div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
            <Plus className="w-5 h-5" /> Agregar Producto
          </button>
        </div>

        {categories.length === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6 text-yellow-700 font-medium">
              Aún no has creado categorías. Ve a "Perfil" en el menú para crearlas antes de añadir productos.
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className={`bg-white rounded-2xl shadow-sm border ${product.is_active ? 'border-gray-100' : 'bg-red-50/30'} overflow-hidden relative group`}>
              <div className="h-48 bg-gray-100 relative">
                {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-10 h-10" /></div>}
                {!product.is_active && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">Agotado</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-1">{product.store_categories?.name || 'Sin categoría'}</p>
                <p className="text-purple-600 font-extrabold text-lg mt-1">${product.price.toLocaleString()}</p>
                
                {/* ZONA DE BOTONES: EDITAR Y ELIMINAR */}
                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar producto">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => openModal(product)} className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors" title="Editar producto">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL PARA CREAR / EDITAR */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/70 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between p-5 border-b"><h3 className="text-xl font-bold">{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h3><button onClick={() => setShowModal(false)}><X/></button></div>
              <div className="overflow-y-auto p-5">
                <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold">Sube una Foto del Producto</label>
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden bg-gray-50 hover:bg-purple-50 transition-colors">
                      {isUploading ? <Upload className="animate-bounce text-purple-600 w-8 h-8" /> : formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <div className="text-gray-500 text-center flex flex-col items-center"><ImageIcon className="w-8 h-8 mb-2 opacity-50"/>Toca para subir foto</div>}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl border outline-none focus:border-purple-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre (Ej: Perro Caliente)" />
                  <select required className="w-full px-4 py-3 rounded-xl border bg-white outline-none focus:border-purple-500" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                      <option value="" disabled>Selecciona una categoría</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <textarea rows="2" className="w-full px-4 py-3 rounded-xl border outline-none focus:border-purple-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ingredientes o descripción breve" />
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <input type="number" required className="w-full px-4 py-3 rounded-xl border font-bold text-purple-900 outline-none focus:border-purple-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Precio ($)" />
                    <div className="flex items-center space-x-2 pt-6">
                      <input type="checkbox" id="isActive" className="w-5 h-5 rounded" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                      <label htmlFor="isActive" className="text-sm font-semibold">Hay Disponibilidad</label>
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-5 bg-gray-50 border-t">
                <button type="submit" form="productForm" disabled={isUploading} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform">{formData.id ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
};

export default StoreProducts;