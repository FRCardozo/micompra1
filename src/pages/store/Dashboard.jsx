import { useState, useEffect } from 'react';
import StoreLayout from '../../components/layouts/StoreLayout';
import { Card, LoadingSpinner } from '../../components/common';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  Eye,
  Star
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByHour, setSalesByHour] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Get the actual store ID first (since store_id != user_id)
      const { data: store, error: storeErr } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', profile?.id)
        .maybeSingle();

      if (storeErr) {
        console.error('[Dashboard] Error fetching store:', storeErr);
        setLoading(false);
        return;
      }

      if (!store) {
        console.warn('[Dashboard] No store found for this user:', profile?.id);
        setLoading(false);
        return;
      }

      const storeId = store.id;

      // Fetch today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      // Calculate today's sales
      const todaySales = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const todayOrdersCount = todayOrders?.length || 0;

      // Build sales by hour series for chart
      const salesMap = (todayOrders || []).reduce((acc, order) => {
        const hour = new Date(order.created_at).getHours();
        const label = `${hour.toString().padStart(2, '0')}:00`;
        const total = parseFloat(order.total || 0);
        acc[label] = (acc[label] || 0) + total;
        return acc;
      }, {});

      const salesSeries = Object.entries(salesMap)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([hour, total]) => ({ hour, total }));

      // Fetch pending orders
      const { data: pending } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .in('status', ['created', 'accepted_by_store']);

      // Fetch total products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      // Fetch recent orders with customer info
      const { data: recent } = await supabase
        .from('orders')
        .select(`
          *,
          client:client_id (full_name, email),
          order_items (
            quantity,
            products (name)
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch top products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('times_ordered', { ascending: false })
        .limit(5);

      // Fetch orders for status distribution
      const { data: statusOrders } = await supabase
        .from('orders')
        .select('status')
        .eq('store_id', storeId);

      const statusCountsMap = (statusOrders || []).reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const statusKeys = ['created', 'accepted_by_store', 'assigned_to_driver', 'delivered', 'cancelled'];
      const statusSeries = statusKeys
        .map((status) => ({
          status,
          label: getStatusText(status),
          value: statusCountsMap[status] || 0,
        }))
        .filter((item) => item.value > 0);

      setStats({
        todaySales,
        todayOrders: todayOrdersCount,
        totalProducts: productsCount || 0,
        pendingOrders: pending?.length || 0
      });

      setRecentOrders(recent || []);
      setTopProducts(products || []);
      setSalesByHour(salesSeries);
      setOrdersByStatus(statusSeries);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      created: 'bg-yellow-100 text-yellow-700',
      accepted_by_store: 'bg-blue-100 text-blue-700',
      assigned_to_driver: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.created;
  };

  const getStatusText = (status) => {
    const texts = {
      created: 'Pendiente',
      accepted_by_store: 'En preparación',
      assigned_to_driver: 'Listo para repartidor',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Resumen de tu tienda del día de hoy
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 2xl:gap-10">
          {/* Today's Sales */}
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Ventas de Hoy</p>
                <p className="text-4xl 2xl:text-5xl font-black text-gray-900 mt-2">
                  ${stats.todaySales.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% vs ayer
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Today's Orders */}
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pedidos de Hoy</p>
                <p className="text-4xl 2xl:text-5xl font-black text-gray-900 mt-2">
                  {stats.todayOrders}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.pendingOrders} pendientes
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Total Products */}
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Productos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalProducts}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Activos
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Pending Orders */}
          <Card padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pedidos Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingOrders}
                </p>
                <p className="text-sm text-orange-600 mt-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Requieren atención
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ventas de Hoy
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Distribución por hora
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="h-64 bg-gray-50 rounded-xl p-4">
              {salesByHour.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm">Aún no hay ventas registradas hoy.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
                      labelFormatter={(label) => `Hora: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Orders Chart */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pedidos por Estado
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Distribución actual
                </p>
              </div>
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div className="h-64 bg-gray-50 rounded-xl p-4">
              {ordersByStatus.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-sm">Aún no hay pedidos para mostrar.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {ordersByStatus.map((entry, index) => {
                        const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];
                        return (
                          <Cell key={`cell-${entry.status}`} fill={colors[index % colors.length]} />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, item) => [
                        `${value} pedidos`,
                        item.payload.label,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Orders & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Pedidos Recientes
              </h3>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay pedidos recientes
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          #{order.id.slice(0, 8)}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.client?.full_name || 'Cliente'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.order_items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(order.total || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Top Products */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Productos Más Vendidos
              </h3>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay datos de productos
                </p>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.times_ordered || 0} pedidos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(product.price || 0).toFixed(2)}
                      </p>
                      {product.is_available ? (
                        <span className="text-xs text-green-600 flex items-center justify-end">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Disponible
                        </span>
                      ) : (
                        <span className="text-xs text-red-600">
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
};

export default Dashboard;
