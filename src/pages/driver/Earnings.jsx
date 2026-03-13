import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DriverLayout from '../../components/layouts/DriverLayout';
import toast from 'react-hot-toast';

const Earnings = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, [user]);

  const loadEarnings = async () => {
    try {
      // Load all completed deliveries
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, delivery_cost, status, created_at, store:stores(name)')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeliveries(orders || []);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayEarnings = orders
        .filter(o => new Date(o.created_at) >= today)
        .reduce((sum, o) => sum + o.delivery_cost, 0);

      const weekEarnings = orders
        .filter(o => new Date(o.created_at) >= weekAgo)
        .reduce((sum, o) => sum + o.delivery_cost, 0);

      const monthEarnings = orders
        .filter(o => new Date(o.created_at) >= monthAgo)
        .reduce((sum, o) => sum + o.delivery_cost, 0);

      const totalEarnings = orders.reduce((sum, o) => sum + o.delivery_cost, 0);

      setStats({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings,
        total: totalEarnings,
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Error al cargar las ganancias');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis ganancias</h1>
          <p className="text-gray-500">Resumen de tus ingresos por entregas</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-blue-100 text-sm mb-1">Hoy</p>
            <p className="text-2xl font-bold">${stats.today.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-green-100 text-sm mb-1">Esta semana</p>
            <p className="text-2xl font-bold">${stats.week.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-purple-100 text-sm mb-1">Este mes</p>
            <p className="text-2xl font-bold">${stats.month.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-orange-100 text-sm mb-1">Total histórico</p>
            <p className="text-2xl font-bold">${stats.total.toLocaleString()}</p>
          </div>
        </div>

        {/* Delivery History */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Historial de entregas ({deliveries.length})
          </h2>

          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500">No tienes entregas completadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{delivery.store.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(delivery.created_at).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +${delivery.delivery_cost.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Entregado</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
};

export default Earnings;
