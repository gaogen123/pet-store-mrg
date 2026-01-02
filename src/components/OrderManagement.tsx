import { useState, useEffect } from 'react';
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight, X, Users, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  payment_method: string;
  total_amount: number;
  create_time: string;
  status: string;
  address: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    detail: string;
  };
  items: OrderItem[];
  user?: {
    username: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    completed: 0,
    totalRevenue: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('skip', ((pagination.page - 1) * pagination.size).toString());
      params.append('limit', pagination.size.toString());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('order_number', searchTerm);

      const response = await fetch(`http://localhost:8001/admin/orders/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.items);
        setPagination(prev => ({ ...prev, total: data.total }));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8001/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        // The dashboard stats might not have all we need, but let's use what we have
        // or fetch all orders to calculate (if not too many)
        setStats({
          total: data.order_count || 0,
          pending: 0, // Need separate API for these or calculate from all
          paid: 0,
          completed: 0,
          totalRevenue: data.total_sales || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [pagination.page, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!confirm(`确定要将订单状态更新为 ${getStatusLabel(newStatus)} 吗？`)) return;

    try {
      const response = await fetch(`http://localhost:8001/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        toast.success('状态更新成功');
        fetchStats();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('更新失败');
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'pending': '待付款',
      'paid': '待发货',
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900 mb-1 font-bold">订单管理</h2>
          <p className="text-gray-600">查看和管理所有用户订单</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">订单总数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">待处理订单</p>
              <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'paid').length}</p>
              <p className="text-xs text-gray-400">当前页统计</p>
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">已完成订单</p>
              <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'completed').length}</p>
              <p className="text-xs text-gray-400">当前页统计</p>
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">总营收</p>
              <p className="text-2xl font-bold text-gray-900">¥{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 shadow-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
          >
            <option value="all">全部状态</option>
            <option value="pending">待付款</option>
            <option value="paid">待发货</option>
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600">订单号</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600">总金额</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600">状态</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-600">创建时间</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">暂无订单</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{order.order_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">¥{order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.create_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white/50">
          <div className="text-sm text-gray-500">
            共 <span className="font-bold text-gray-900">{pagination.total}</span> 条订单
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 font-medium">
              第 {pagination.page} 页
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page * pagination.size >= pagination.total}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-8 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">订单详情</h3>
                <p className="text-sm text-gray-600 mt-1">订单号: <span className="font-mono font-bold">{selectedOrder.order_number}</span></p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
              {/* Status Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-gray-900">订单状态</h4>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="flex gap-3">
                  {selectedOrder.status === 'paid' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                    >
                      <Truck className="w-5 h-5" />
                      立即发货
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      完成订单
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                    <button
                      onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-bold"
                    >
                      <XCircle className="w-5 h-5" />
                      取消订单
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info Section */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    下单用户
                  </h4>
                  {selectedOrder.user ? (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-xl text-white font-bold shadow-md">
                        {selectedOrder.user.avatar ? (
                          <img src={selectedOrder.user.avatar} alt={selectedOrder.user.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          selectedOrder.user.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedOrder.user.username}</p>
                        <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                        {selectedOrder.user.phone && <p className="text-sm text-gray-600">{selectedOrder.user.phone}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">用户信息不可用</p>
                  )}
                </div>

                {/* Address Section */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-500" />
                    收货信息
                  </h4>
                  {selectedOrder.address ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">收货人：</span>
                        <span className="text-gray-900 font-bold">{selectedOrder.address.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">联系电话：</span>
                        <span className="text-gray-900 font-bold">{selectedOrder.address.phone}</span>
                      </div>
                      <div className="pt-2 border-t border-orange-100">
                        <span className="text-gray-500 block mb-1">收货地址：</span>
                        <span className="text-gray-900 font-medium leading-relaxed">
                          {selectedOrder.address.province} {selectedOrder.address.city} {selectedOrder.address.district} {selectedOrder.address.detail}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">暂无收货信息</p>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  商品清单
                </h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white/80 rounded-xl border border-orange-100 hover:shadow-md transition-all">
                      <img
                        src={item.product?.image || 'https://via.placeholder.com/100'}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg shadow-sm"
                      />
                      <div className="flex-1">
                        <h5 className="text-base font-bold text-gray-900">{item.product?.name || '未知商品'}</h5>
                        <p className="text-sm text-gray-500 mt-1">单价: ¥{item.price.toFixed(2)}</p>
                        <p className="text-sm font-bold text-orange-600 mt-1">数量: x{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">¥{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6 pt-6 border-t border-orange-200">
                  <div className="text-right">
                    <span className="text-gray-600 mr-3 text-lg">订单总额:</span>
                    <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
                      ¥{selectedOrder.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}