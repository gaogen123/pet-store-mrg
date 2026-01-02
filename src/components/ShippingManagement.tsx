import { useState, useEffect } from 'react';
import { Search, Truck, Package, MapPin, Phone, User, Clock, CheckCircle, X, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface ShippingOrder {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  address: string;
  products: string;
  amount: number;
  status: '待揽件' | '运输中' | '派送中' | '已签收';
  shippingCompany: string;
  trackingNumber: string;
  estimatedTime: string;
  date: string;
}

export function ShippingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<ShippingOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ShippingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    address: '',
    products: '',
    amount: '',
    status: '待揽件' as ShippingOrder['status'],
    shippingCompany: '',
    trackingNumber: '',
    estimatedTime: ''
  });
  const [shippings, setShippings] = useState<ShippingOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchShippings = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      const response = await fetch(`http://localhost:8001/admin/shipping/?skip=${skip}&limit=${pageSize}`);
      if (response.ok) {
        const data = await response.json();
        const items = data.items || [];
        setTotal(data.total || 0);

        const mappedData = items.map((item: any) => ({
          id: item.id.toString(),
          orderNumber: item.order?.order_number || '未知订单',
          customer: item.order?.address?.name || '未知客户',
          phone: item.order?.address?.phone || '',
          address: item.order?.address?.detail ?
            `${item.order.address.province || ''}${item.order.address.city || ''}${item.order.address.district || ''}${item.order.address.detail}`
            : '未知地址',
          products: item.order?.items?.map((i: any) => `${i.product?.name} x${i.quantity}`).join(', ') || '无商品',
          amount: item.order?.total_amount || 0,
          status: item.status,
          shippingCompany: item.carrier,
          trackingNumber: item.tracking_number,
          estimatedTime: item.estimated_delivery_time ? item.estimated_delivery_time.split('T')[0] : '',
          date: item.shipping_time ? item.shipping_time.split('T')[0] : ''
        }));
        setShippings(mappedData);
      } else {
        toast.error('获取物流列表失败');
      }
    } catch (error) {
      console.error('Error fetching shippings:', error);
      toast.error('获取物流列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippings();
  }, [currentPage, pageSize]);

  const filteredShippings = shippings.filter(shipping => {
    const matchesSearch = shipping.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipping.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipping.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '全部' || shipping.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, newStatus: ShippingOrder['status']) => {
    try {
      const response = await fetch(`http://localhost:8001/admin/shipping/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('状态更新成功');
        fetchShippings();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('更新失败');
    }
  };

  const handleViewDetail = (shipping: ShippingOrder) => {
    setViewingOrder(shipping);
    setShowDetailModal(true);
  };

  const handleEdit = (shipping: ShippingOrder) => {
    setEditingOrder(shipping);
    setFormData({
      customer: shipping.customer,
      phone: shipping.phone,
      address: shipping.address,
      products: shipping.products,
      amount: String(shipping.amount),
      status: shipping.status,
      shippingCompany: shipping.shippingCompany,
      trackingNumber: shipping.trackingNumber,
      estimatedTime: shipping.estimatedTime
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingOrder || !formData.shippingCompany || !formData.trackingNumber) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/admin/shipping/${editingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carrier: formData.shippingCompany,
          tracking_number: formData.trackingNumber,
          status: formData.status,
          estimated_delivery_time: formData.estimatedTime ? new Date(formData.estimatedTime).toISOString() : null
        }),
      });

      if (response.ok) {
        toast.success('更新成功');
        fetchShippings(); // Refresh list
        setShowEditModal(false);
        setEditingOrder(null);
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Error updating shipping:', error);
      toast.error('更新失败');
    }
  };

  const getStatusColor = (status: ShippingOrder['status']) => {
    switch (status) {
      case '待揽件': return 'bg-orange-100 text-orange-700';
      case '运输中': return 'bg-blue-100 text-blue-700';
      case '派送中': return 'bg-purple-100 text-purple-700';
      case '已签收': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: ShippingOrder['status']) => {
    switch (status) {
      case '待揽件': return Package;
      case '运输中': return Truck;
      case '派送中': return MapPin;
      case '已签收': return CheckCircle;
      default: return Package;
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h2 className="text-2xl text-gray-900 mb-1">发货管理</h2>
        <p className="text-gray-600">管理所有物流配送信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === '待揽件' ? '全部' : '待揽件')}
          className={`bg-white/80 backdrop-blur-lg rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${statusFilter === '待揽件' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200/50 hover:border-orange-300'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">待揽件</p>
              <p className="text-2xl text-gray-900">{shippings.filter(s => s.status === '待揽件').length}</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter(statusFilter === '运输中' ? '全部' : '运输中')}
          className={`bg-white/80 backdrop-blur-lg rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${statusFilter === '运输中' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200/50 hover:border-blue-300'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">运输中</p>
              <p className="text-2xl text-gray-900">{shippings.filter(s => s.status === '运输中').length}</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter(statusFilter === '派送中' ? '全部' : '派送中')}
          className={`bg-white/80 backdrop-blur-lg rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${statusFilter === '派送中' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200/50 hover:border-purple-300'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">派送中</p>
              <p className="text-2xl text-gray-900">{shippings.filter(s => s.status === '派送中').length}</p>
            </div>
          </div>
        </div>
        <div
          onClick={() => setStatusFilter(statusFilter === '已签收' ? '全部' : '已签收')}
          className={`bg-white/80 backdrop-blur-lg rounded-xl p-4 border shadow-sm cursor-pointer transition-all ${statusFilter === '已签收' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200/50 hover:border-green-300'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">已签收</p>
              <p className="text-2xl text-gray-900">{shippings.filter(s => s.status === '已签收').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-gray-200/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、客户名称或快递单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option>全部</option>
            <option>待揽件</option>
            <option>运输中</option>
            <option>派送中</option>
            <option>已签收</option>
          </select>
        </div>
      </div>

      {/* 物流列表 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600">订单号</th>
                <th className="text-left py-3 px-4 text-gray-600">客户信息</th>
                <th className="text-left py-3 px-4 text-gray-600">快递公司</th>
                <th className="text-left py-3 px-4 text-gray-600">快递单号</th>
                <th className="text-left py-3 px-4 text-gray-600">预计送达</th>
                <th className="text-left py-3 px-4 text-gray-600">状态</th>
                <th className="text-left py-3 px-4 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredShippings.map((shipping) => {
                const StatusIcon = getStatusIcon(shipping.status);
                return (
                  <tr key={shipping.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{shipping.orderNumber}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-900">{shipping.customer}</p>
                        <p className="text-sm text-gray-500">{shipping.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">{shipping.shippingCompany}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-700">{shipping.trackingNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{shipping.estimatedTime}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-1.5 ${getStatusColor(shipping.status)}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {shipping.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(shipping)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          查看物流
                        </button>
                        <button
                          onClick={() => handleEdit(shipping)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          编辑
                        </button>
                        {shipping.status === '待揽件' && (
                          <button
                            onClick={() => updateStatus(shipping.id, '运输中')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            揽件
                          </button>
                        )}
                        {shipping.status === '运输中' && (
                          <button
                            onClick={() => updateStatus(shipping.id, '派送中')}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            派送
                          </button>
                        )}
                        {shipping.status === '派送中' && (
                          <button
                            onClick={() => updateStatus(shipping.id, '已签收')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            签收
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* 分页控制 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {currentPage} 页 / 共 {Math.ceil(total / pageSize)} 页
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(total / pageSize)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* 物流详情模态框 */}
      {showDetailModal && viewingOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <div>
                <h3 className="text-2xl text-gray-900">物流详情</h3>
                <p className="text-gray-600 text-sm mt-1">{viewingOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* 物流状态 */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-600 text-sm mb-2">当前状态</p>
                      <span className={`px-4 py-2 rounded-full text-sm inline-flex items-center gap-2 ${getStatusColor(viewingOrder.status)}`}>
                        {(() => {
                          const Icon = getStatusIcon(viewingOrder.status);
                          return <Icon className="w-4 h-4" />;
                        })()}
                        {viewingOrder.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm mb-2">预计���达</p>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {viewingOrder.estimatedTime}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                    <div>
                      <p className="text-gray-600 text-sm">快递公司</p>
                      <p className="text-gray-900 mt-1">{viewingOrder.shippingCompany}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">快递单号</p>
                      <p className="text-gray-900 mt-1 font-mono">{viewingOrder.trackingNumber}</p>
                    </div>
                  </div>
                </div>

                {/* 收件信息 */}
                <div>
                  <h4 className="text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
                    收件信息
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm">收件人</p>
                        <p className="text-gray-900">{viewingOrder.customer}</p>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm">联系电话</p>
                        <p className="text-gray-900">{viewingOrder.phone}</p>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-600 text-sm">收件地址</p>
                        <p className="text-gray-900">{viewingOrder.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 商品信息 */}
                <div>
                  <h4 className="text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
                    商品信息
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-gray-900">{viewingOrder.products}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-gray-600">订单金额</span>
                      <span className="text-xl text-purple-600">¥{viewingOrder.amount}</span>
                    </div>
                  </div>
                </div>

                {/* 物流轨迹 */}
                <div>
                  <h4 className="text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
                    物流轨迹
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <div className="space-y-4">
                      {/* 模拟物流轨迹 */}
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-lg ${viewingOrder.status === '已签收' ? 'bg-green-100' : 'bg-gray-200'
                            }`}>
                            <CheckCircle className={`w-4 h-4 ${viewingOrder.status === '已签收' ? 'text-green-600' : 'text-gray-400'
                              }`} />
                          </div>
                          {viewingOrder.status !== '已签收' && <div className="w-px h-8 bg-gray-300"></div>}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-gray-900">已签收</p>
                          <p className="text-sm text-gray-500">客户已签收，感谢使用</p>
                          {viewingOrder.status === '已签收' && (
                            <p className="text-xs text-gray-400 mt-1">{viewingOrder.estimatedTime} 10:30</p>
                          )}
                        </div>
                      </div>

                      {viewingOrder.status !== '已签收' && (
                        <>
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`p-2 rounded-lg ${viewingOrder.status === '派送中' ? 'bg-purple-100' : 'bg-gray-200'
                                }`}>
                                <MapPin className={`w-4 h-4 ${viewingOrder.status === '派送中' ? 'text-purple-600' : 'text-gray-400'
                                  }`} />
                              </div>
                              {viewingOrder.status !== '派送中' && <div className="w-px h-8 bg-gray-300"></div>}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-gray-900">派送中</p>
                              <p className="text-sm text-gray-500">快递员正在派送</p>
                              {viewingOrder.status === '派送中' && (
                                <p className="text-xs text-gray-400 mt-1">{viewingOrder.date} 08:15</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`p-2 rounded-lg ${viewingOrder.status === '运输中' || viewingOrder.status === '派送中' ? 'bg-blue-100' : 'bg-gray-200'
                                }`}>
                                <Truck className={`w-4 h-4 ${viewingOrder.status === '运输中' || viewingOrder.status === '派送中' ? 'text-blue-600' : 'text-gray-400'
                                  }`} />
                              </div>
                              <div className="w-px h-8 bg-gray-300"></div>
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-gray-900">运输中</p>
                              <p className="text-sm text-gray-500">包裹正在运输途中</p>
                              {(viewingOrder.status === '运输中' || viewingOrder.status === '派送中') && (
                                <p className="text-xs text-gray-400 mt-1">{viewingOrder.date} 14:20</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="p-2 rounded-lg bg-orange-100">
                            <Package className="w-4 h-4 text-orange-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">已揽件</p>
                          <p className="text-sm text-gray-500">快递公司已揽收</p>
                          <p className="text-xs text-gray-400 mt-1">{viewingOrder.date} 09:00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-8 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingOrder(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑发货信息模态框 */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900">编辑发货信息</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOrder(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-8 pb-4 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* 订单号（只读） */}
                <div>
                  <label className="block text-gray-700 mb-2">订单号</label>
                  <input
                    type="text"
                    value={editingOrder.orderNumber}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>

                {/* 快递信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">快递公司</label>
                    <select
                      value={formData.shippingCompany}
                      onChange={(e) => setFormData({ ...formData, shippingCompany: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择快递公司</option>
                      <option value="顺丰速运">顺丰速运</option>
                      <option value="中通快递">中通快递</option>
                      <option value="圆通速递">圆通速递</option>
                      <option value="申通快递">申通快递</option>
                      <option value="韵达快递">韵达快递</option>
                      <option value="京东物流">京东物流</option>
                      <option value="邮政EMS">邮政EMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">快递单号</label>
                    <input
                      type="text"
                      value={formData.trackingNumber}
                      onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入快递单号"
                    />
                  </div>
                </div>

                {/* 预计送达 */}
                <div>
                  <label className="block text-gray-700 mb-2">预计送达时间</label>
                  <input
                    type="date"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 收件人信息 */}
                <div className="border-t pt-5">
                  <h4 className="text-gray-900 mb-4">收件人信息</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 mb-2">收件人姓名</label>
                        <input
                          type="text"
                          value={formData.customer}
                          onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="请输入收件人姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">联系电话</label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="请输入联系电话"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">收件地址</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入收件地址"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* 商品信息 */}
                <div className="border-t pt-5">
                  <h4 className="text-gray-900 mb-4">商品信息</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">商品详情</label>
                      <textarea
                        value={formData.products}
                        onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入商品信息"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">订单金额（¥）</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入订单金额"
                      />
                    </div>
                  </div>
                </div>

                {/* 物流状态 */}
                <div className="border-t pt-5">
                  <label className="block text-gray-700 mb-3">物流状态</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: '待揽件' })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.status === '待揽件'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                    >
                      <Package className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-900">待揽件</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: '运输中' })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.status === '运输中'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                      <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-900">运输中</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: '派送中' })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.status === '派送中'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                    >
                      <MapPin className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-900">派送中</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: '已签收' })}
                      className={`p-4 rounded-lg border-2 transition-all ${formData.status === '已签收'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                    >
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-900">已签收</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-8 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOrder(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}