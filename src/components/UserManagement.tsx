import { useState, useEffect } from 'react';
import { Search, Eye, Mail, Phone, MapPin, Edit2, Trash2, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: number;
  totalSpent: number;
  joinDate: string;
  status: '活跃' | '非活跃';
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState('全部状态');
  const [loading, setLoading] = useState(false);

  // Pagination
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: '活跃' as '活跃' | '非活跃',
    password: '' // Added for creation
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      let url = `http://localhost:8001/admin/users/?skip=${skip}&limit=${pageSize}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (statusFilter !== '全部状态') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTotal(data.total || 0);
        const items = data.items || [];

        const mappedUsers = items.map((item: any) => ({
          id: item.id,
          name: item.username,
          email: item.email,
          phone: item.phone || '',
          address: item.address_str || '未知地址',
          orders: item.orders_count || 0,
          totalSpent: item.total_spent || 0,
          joinDate: item.register_time ? item.register_time.split('T')[0] : '',
          status: item.is_active ? '活跃' : '非活跃'
        }));

        setUsers(mappedUsers);
      } else {
        toast.error('获取用户列表失败');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      status: '活跃',
      password: ''
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const response = await fetch('http://localhost:8001/admin/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'user'
        })
      });

      if (response.ok) {
        toast.success('用户添加成功');
        setShowAddModal(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || '添加用户失败');
      }
    } catch (error) {
      toast.error('添加用户失败');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      status: user.status,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      // Update basic info
      const updateData: any = {
        username: formData.name,
        email: formData.email,
        phone: formData.phone
      };

      const response = await fetch(`http://localhost:8001/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      // Update status if changed
      if (editingUser.status !== formData.status) {
        await fetch(`http://localhost:8001/admin/users/${editingUser.id}/status?status=${encodeURIComponent(formData.status)}`, {
          method: 'PUT'
        });
      }

      if (response.ok) {
        toast.success('用户更新成功');
        setShowEditModal(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        toast.error('更新用户失败');
      }
    } catch (error) {
      toast.error('更新用户失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个用户吗？')) {
      try {
        const response = await fetch(`http://localhost:8001/admin/users/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('用户删除成功');
          fetchUsers();
        } else {
          toast.error('删除用户失败');
        }
      } catch (error) {
        toast.error('删除用户失败');
      }
    }
  };

  const handleViewDetail = (user: User) => {
    setViewingUser(user);
    setShowDetailModal(true);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === '活跃' ? '非活跃' : '活跃';
    try {
      const response = await fetch(`http://localhost:8001/admin/users/${id}/status?status=${encodeURIComponent(newStatus)}`, {
        method: 'PUT'
      });

      if (response.ok) {
        toast.success(`用户状态已更新为${newStatus}`);
        fetchUsers();
      } else {
        toast.error('更新状态失败');
      }
    } catch (error) {
      toast.error('更新状态失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800 mb-1">用户管理</h2>
          <p className="text-gray-700">管理您的客户信息</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-400/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          添加用户
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <p className="text-gray-600 mb-2">用户总数</p>
          <p className="text-3xl text-gray-900">{total}</p>
          <p className="text-sm text-green-600 mt-2">当前页: {users.length}</p>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <p className="text-gray-600 mb-2">活跃用户</p>
          <p className="text-3xl text-gray-900">{users.filter(u => u.status === '活跃').length}</p>
          <p className="text-sm text-gray-500 mt-2">当前页统计</p>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <p className="text-gray-600 mb-2">平均消费</p>
          <p className="text-3xl text-gray-900">¥{users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.totalSpent, 0) / users.length) : 0}</p>
          <p className="text-sm text-orange-600 mt-2">当前页平均</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户名、邮箱或手机号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option>全部状态</option>
            <option>活跃</option>
            <option>非活跃</option>
          </select>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-gray-600">用户信息</th>
                <th className="text-left py-4 px-6 text-gray-600">联系方式</th>
                <th className="text-left py-4 px-6 text-gray-600">地址</th>
                <th className="text-left py-4 px-6 text-gray-600">订单数</th>
                <th className="text-left py-4 px-6 text-gray-600">消费总额</th>
                <th className="text-left py-4 px-6 text-gray-600">注册时间</th>
                <th className="text-left py-4 px-6 text-gray-600">状态</th>
                <th className="text-left py-4 px-6 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-gray-900">{user.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{user.address}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">{user.orders}</td>
                  <td className="py-4 px-6 text-gray-900">¥{user.totalSpent}</td>
                  <td className="py-4 px-6 text-gray-600">{user.joinDate}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleStatus(user.id, user.status)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${user.status === '活跃'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(user)}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              第 {currentPage} 页 / 共 {Math.ceil(total / pageSize) || 1} 页
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

      {/* 添加用户模态框 */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 ${showAddModal ? 'block' : 'hidden'}`}>
        <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl p-8 border border-orange-200 shadow-2xl w-[480px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl text-gray-900">添加用户</h3>
            <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" onClick={() => setShowAddModal(false)}>
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">用户名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">手机号</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">地址</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as '活跃' | '非活跃' })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="活跃">活跃</option>
                <option value="非活跃">非活跃</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all mt-6"
            >
              添加用户
            </button>
          </form>
        </div>
      </div>

      {/* 编辑用户模态框 */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 ${showEditModal ? 'block' : 'hidden'}`}>
        <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl p-8 border border-orange-200 shadow-2xl w-[480px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl text-gray-900">编辑用户</h3>
            <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" onClick={() => setShowEditModal(false)}>
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">用户名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">手机号</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">地址</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as '活跃' | '非活跃' })}
                className="w-full px-4 py-2.5 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              >
                <option value="活跃">活跃</option>
                <option value="非活跃">非活跃</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleUpdate}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all mt-6"
            >
              更新用户
            </button>
          </form>
        </div>
      </div>

      {/* 查看用户详情模态框 */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${showDetailModal ? 'block' : 'hidden'}`}>
        <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-[480px] max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-8 pb-4">
            <h3 className="text-2xl text-gray-900">用户详情</h3>
            <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" onClick={() => setShowDetailModal(false)}>
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {viewingUser && (
            <div className="px-8 pb-8 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                  <p className="text-lg text-gray-900">{viewingUser.name}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <p className="text-gray-900">{viewingUser.email}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <p className="text-gray-900">{viewingUser.phone}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <p className="text-gray-900">{viewingUser.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">订单数</label>
                    <p className="text-xl text-gray-900">{viewingUser.orders}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">消费总额</label>
                    <p className="text-xl text-gray-900">¥{viewingUser.totalSpent}</p>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">注册时间</label>
                  <p className="text-gray-900">{viewingUser.joinDate}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm ${viewingUser.status === '活跃'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-400 text-white'
                    }`}>
                    {viewingUser.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}