import React, { useState, useEffect, useRef } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Filter, Upload, X, Package, Tag, Image as ImageIcon } from 'lucide-react';

const StoreProducts = () => {
  const { profile } = useAuth();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // FILTROS Y BÚSQUEDA
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // MODAL Y FORMULARIO
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // INCLUIMOS EL CAMPO BARCODE
  const [formData, setFormData] = useState({
    id: null, name: '', description: '', price: '', image_url: '', category_id: '', is_active: true, barcode: ''
  });

  useEffect(() => {
    if (profile?.id) fetchData();
  }, [profile]);

  // LÓGICA ORIGINAL PERFECTA
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

  // EL INTERRUPTOR iOS
  const toggleProductStatus = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    // Actualización optimista en la UI
    setProducts(products.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));
    
    try {
      const { error } = await supabase.from('products').update({ is_active: newStatus }).eq('id', productId);
      if (error) throw error;
      toast.success(newStatus ? 'Producto Disponible' : 'Producto Agotado/Pausado', { position: 'bottom-right' });
    } catch (error) {
      // Revertir si hay error
      setProducts(products.map(p => p.id === productId ? { ...p, is_active: currentStatus } : p));
      toast.error('Error al actualizar');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !store) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product_images/${fileName}`; // TU RUTA ORIGINAL
      
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
      
      // TU GENERADOR DE SLUG ORIGINAL (Vital para evitar el error 400)
      const generatedSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

      const payload = {
        store_id: store.id, 
        name: formData.name, 
        slug: generatedSlug, 
        description: formData.description,
        price: parseFloat(formData.price), 
        image_url: formData.image_url,
        category_id: formData.category_id, 
        is_active: formData.is_active,
        barcode: formData.barcode || null // ENVIAMOS EL SKU
      };
      
      if (formData.id) {
        // En edición no actualizamos el slug para no romper links viejos
        delete payload.slug;
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

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Seguro que deseas ELIMINAR este producto de tu catálogo? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast.success('Producto eliminado del sistema');
      fetchData(); 
    } catch (error) {
      toast.error('No se pudo eliminar el producto');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setFormData({
        ...product,
        barcode: product.barcode || ''
      });
    } else {
      const defaultCategory = categories.length > 0 ? categories[0].id : '';
      setFormData({ id: null, name: '', description: '', price: '', image_url: '', category_id: defaultCategory, is_active: true, barcode: '' });
    }
    setShowModal(true);
  };

  // MOTOR DE BÚSQUEDA Y FILTRADO
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = filterCategory === 'all' || product.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <StoreLayout><div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div></div></StoreLayout>;

  return (
    <StoreLayout>
      <div className="space-y-6">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2"><Package className="w-8 h-8 text-orange-500"/> Mi Catálogo</h1>
            <p className="text-gray-500 mt-1">Gestiona tu inventario, precios y disponibilidad.</p>
          </div>
          <button onClick={() => openModal()} className="bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 w-full md:w-auto justify-center">
            <Plus className="w-5 h-5"/> Agregar Producto
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 sticky top-4 z-10">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código de barras..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all font-medium"
            />
          </div>
          <div className="relative shrink-0 md:w-64">
            <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <select 
              value={filterCategory || 'all'}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        {categories.length === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6 text-yellow-700 font-medium">
              Aún no has creado categorías. Ve a "Perfil" en el menú para crearlas antes de añadir productos.
            </div>
        )}

        {/* LISTADO DE PRODUCTOS (Moderna vista en lista optimizada) */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-2 sm:p-6 space-y-3">
            
            {filteredProducts.map(product => (
              <div key={product.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border transition-all ${product.is_active ? 'bg-white border-gray-200 hover:shadow-md' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 ${product.is_active ? '' : 'grayscale'}`}>
                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300"/></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-black text-lg truncate ${product.is_active ? 'text-gray-900' : 'text-gray-500 line-through decoration-gray-300'}`}>{product.name}</h3>
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md hidden sm:inline-block">{product.store_categories?.name}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="text-base font-black text-orange-500">${product.price.toLocaleString()}</p>
                      {product.barcode && (
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                          <span className="font-bold text-gray-400">#</span> {product.barcode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  
                  {/* EL INTERRUPTOR iOS */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 sm:hidden">Disponibilidad:</span>
                    <button onClick={() => toggleProductStatus(product.id, product.is_active)} className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out ${product.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openModal(product)} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"><Edit2 className="w-5 h-5"/></button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5"/></button>
                  </div>
                </div>

              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-3"/>
                <p className="font-bold text-lg text-gray-700">No se encontraron productos</p>
                <p className="text-sm">Intenta buscar con otro término o añade uno nuevo.</p>
              </div>
            )}
            
          </div>
        </div>

      </div>

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h3 className="font-black text-xl text-gray-900">{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
            </div>
            
            <form id="productForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-2xl h-40 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden bg-gray-50 hover:bg-orange-50 transition-colors group">
                {isUploading ? <Upload className="animate-bounce text-orange-500 w-8 h-8" /> : formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="text-center text-gray-400 font-medium text-sm flex flex-col items-center"><ImageIcon className="w-8 h-8 mb-2 opacity-50"/>Toca para subir la foto</div>}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Nombre del Producto *</label>
                  <input type="text" required placeholder="Ej: Hamburguesa Doble" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Precio ($) *</label>
                    <input type="number" required placeholder="Ej: 15000" className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-900 font-black focus:ring-2 focus:ring-orange-500/20 outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block flex items-center gap-1">SKU / Barras</label>
                    <input type="text" placeholder="Opcional" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block flex items-center gap-1"><Tag className="w-3 h-3"/> Categoría *</label>
                  {/* AQUÍ ESTÁ EL FIX: Le añadimos || '' al value para evitar el null warning */}
                  <select required className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none font-medium text-gray-700" value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                    {categories.length === 0 ? <option value="">No hay categorías creadas</option> : categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Descripción corta</label>
                  <textarea placeholder="Ingredientes o detalles..." rows="2" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none resize-none text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
               <button type="submit" form="productForm" disabled={isUploading || categories.length === 0} className="w-full bg-gray-900 text-white font-black py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                 {formData.id ? 'Guardar Cambios' : 'Crear Producto'}
               </button>
            </div>

          </div>
        </div>
      )}

    </StoreLayout>
  );
};

export default StoreProducts;