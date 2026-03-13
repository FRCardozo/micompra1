import { useState } from 'react';
import AdminLayout from '../../components/layouts/AdminLayout';
import { Button } from '../../components/common';
import toast from 'react-hot-toast';

const Support = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Mock data - In production, this would come from Supabase
  const tickets = [
    {
      id: '1',
      subject: 'Problema con el pago',
      description: 'No se procesó mi pago correctamente',
      user: 'Juan Pérez',
      email: 'juan@example.com',
      status: 'open',
      priority: 'high',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      subject: 'Pedido no llegó',
      description: 'Mi pedido fue marcado como entregado pero no lo recibí',
      user: 'María García',
      email: 'maria@example.com',
      status: 'pending',
      priority: 'urgent',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const handleResolveTicket = (ticketId) => {
    toast.success('Ticket marcado como resuelto');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: 'Abierto', color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
      closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
    };
    return statusMap[status] || statusMap.open;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Media', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };
    return priorityMap[priority] || priorityMap.medium;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Centro de soporte</h1>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'tickets' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('tickets')}
            >
              Tickets de soporte
            </Button>
            <Button
              variant={activeTab === 'faq' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('faq')}
            >
              Preguntas frecuentes
            </Button>
          </div>
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-500">No hay tickets de soporte</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => {
                  const statusBadge = getStatusBadge(ticket.status);
                  const priorityBadge = getPriorityBadge(ticket.priority);

                  return (
                    <div key={ticket.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {ticket.subject}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                              {statusBadge.label}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityBadge.color}`}>
                              {priorityBadge.label}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>👤 {ticket.user}</span>
                            <span>✉️ {ticket.email}</span>
                            <span>
                              📅 {new Date(ticket.created_at).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            Ver detalles
                          </Button>
                          {ticket.status !== 'resolved' && (
                            <Button
                              size="sm"
                              onClick={() => handleResolveTicket(ticket.id)}
                            >
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Detalles del ticket
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Asunto:</span> {selectedTicket.subject}
                </p>
                <p>
                  <span className="font-semibold">Descripción:</span> {selectedTicket.description}
                </p>
                <p>
                  <span className="font-semibold">Usuario:</span> {selectedTicket.user} ({selectedTicket.email})
                </p>
                <p>
                  <span className="font-semibold">Creado:</span>{' '}
                  {new Date(selectedTicket.created_at).toLocaleString('es-CO')}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                >
                  Cerrar
                </Button>
                {selectedTicket.status !== 'resolved' && (
                  <Button
                    onClick={() => {
                      handleResolveTicket(selectedTicket.id);
                      setSelectedTicket(null);
                    }}
                  >
                    Marcar como resuelto
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Cómo creo una cuenta?
                </h3>
                <p className="text-gray-600">
                  Para crear una cuenta, haz clic en "Registrarse" en la página principal
                  y completa el formulario con tu información personal.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Cómo realizo un pedido?
                </h3>
                <p className="text-gray-600">
                  Navega por los negocios disponibles, selecciona los productos que deseas,
                  agrégalos al carrito y procede al checkout para completar tu compra.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Cuáles son los métodos de pago disponibles?
                </h3>
                <p className="text-gray-600">
                  Actualmente aceptamos pagos en efectivo y transferencia bancaria directa
                  al negocio.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Cómo me convierto en repartidor?
                </h3>
                <p className="text-gray-600">
                  Durante el registro, selecciona el rol de "Repartidor" y completa la
                  información de tu vehículo. El administrador revisará tu solicitud.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¿Cómo registro mi negocio?
                </h3>
                <p className="text-gray-600">
                  Crea una cuenta seleccionando el rol de "Negocio/Restaurante" y completa
                  todos los datos de tu establecimiento. El administrador aprobará tu
                  registro.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => toast.success('Función de edición próximamente')}
                className="mt-6"
              >
                Editar preguntas frecuentes
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Support;
