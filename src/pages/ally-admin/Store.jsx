import { useState, useEffect } from 'react';
import AllyAdminLayout from '../../components/layouts/AllyAdminLayout';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AllyAdminStore = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'info'
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        available: true,
    });

    useEffect(() => {
        fetchStoreAndProducts();
    }, []);

    const fetchStoreAndProducts = async () => {
        try {
            setLoading(true);

            // 1. Get Store linked to this user
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', profile.id)
                .maybeSingle();

            if (storeError) {
                console.error('Error fetching store:', storeError);
                toast.error('Error al verificar tu tienda');
                return;
            }

            if (!store) {
                toast.error('No se encontró una tienda asociada a tu cuenta.');
                return;
            }

            // 2. Fetch Products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', store.id)
                .order('name', { ascending: true });

            if (productsError) throw productsError;

            setProducts(productsData || []);
        } catch (error) {
            console.error('Error loading store data:', error);
            toast.error('Error al cargar datos de la tienda');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Get Store again simply to be safe or store in state
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', profile.id)
                .single();

            if (!store) return toast.error("No tienes tienda");

            const slug = formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            const productPayload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category, // using category string col for simplicity if schema allows or null
                image_url: formData.image_url,
                is_available: formData.available,
                store_id: store.id,
                slug: editingProduct ? editingProduct.slug : `${slug}-${Date.now()}`
            };

            if (editingProduct) {
                const { error } = await supabase
                    .from('products')
                    .update(productPayload)
                    .eq('id', editingProduct.id);
                if (error) throw error;
                toast.success('Producto actualizado');
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productPayload]);
                if (error) throw error;
                toast.success('Producto creado');
            }

            setShowModal(false);
            setEditingProduct(null);
            fetchStoreAndProducts();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar producto');
        }
    };

    // ... (Reusable logic for delete/toggle as in Store pages)
    const handleDelete = async (productId) => {
        if (!confirm('¿Eliminar producto?')) return;
        try {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
            toast.success('Producto eliminado');
            fetchStoreAndProducts();
        } catch (e) { toast.error('Error al eliminar'); }
    };

    const toggleAvailability = async (product) => {
        try {
            await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
            fetchStoreAndProducts();
            toast.success('Disponibilidad actualizada');
        } catch (e) { toast.error('Error al actualizar'); }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AllyAdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
                        <p className="text-gray-600">Gestiona tus productos e información</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setFormData({ name: '', description: '', price: '', category: '', image_url: '', available: true });
                            setShowModal(true);
                        }}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-orange-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Producto
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-10">Cargando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="h-48 bg-gray-100 relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Package className="w-12 h-12 text-gray-300" />
                                        </div>
                                    )}
                                    {!product.is_available && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">No Disponible</div>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                                        <span className="font-bold text-orange-600">${product.price.toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{product.description}</p>

                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => {
                                                setEditingProduct(product);
                                                setFormData({
                                                    name: product.name,
                                                    description: product.description || '',
                                                    price: product.price,
                                                    category: product.category || '',
                                                    image_url: product.image_url || '',
                                                    available: product.is_available
                                                });
                                                setShowModal(true);
                                            }}
                                            className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => toggleAvailability(product)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${product.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {product.is_available ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar' : 'Crear'} Producto</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input type="text" required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea className="w-full border rounded-lg p-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Precio</label>
                                    <input type="number" required className="w-full border rounded-lg p-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Categoría</label>
                                    <input type="text" className="w-full border rounded-lg p-2" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Imagen URL</label>
                                <input type="text" className="w-full border rounded-lg p-2" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AllyAdminLayout>
    );
};

export default AllyAdminStore;
