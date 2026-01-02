import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Crown, X, Gift, TrendingUp, Award, Users } from 'lucide-react';
import { toast } from 'sonner';

interface VIPLevel {
  id: string;
  name: string;
  level: number;
  discount: number;
  min_spend: number;
  color: string;
  icon: string;
  benefits: string[];
  memberCount: number;
  monthlyRevenue: number;
}

export function VIPManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingVIP, setEditingVIP] = useState<VIPLevel | null>(null);
  const [viewingVIP, setViewingVIP] = useState<VIPLevel | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    level: '1',
    discount: '95',
    minSpend: '0',
    color: 'gray',
    icon: '👤',
    benefits: ''
  });

  const [vipLevels, setVipLevels] = useState<VIPLevel[]>([]);
  const [loading, setLoading] = useState(false);

  const icons = ['👤', '🥈', '🥇', '💎', '👑', '⭐', '🏆', '🎖️'];
  const colors = [
    { name: 'gray', label: '灰色', class: 'bg-gray-100 text-gray-700 border-gray-300' },
    { name: 'slate', label: '银色', class: 'bg-slate-200 text-slate-700 border-slate-300' },
    { name: 'amber', label: '金色', class: 'bg-amber-100 text-amber-700 border-amber-300' },
    { name: 'blue', label: '蓝色', class: 'bg-blue-100 text-blue-700 border-blue-300' },
    { name: 'purple', label: '紫色', class: 'bg-purple-100 text-purple-700 border-purple-300' },
    { name: 'rose', label: '玫瑰', class: 'bg-rose-100 text-rose-700 border-rose-300' }
  ];

  const fetchVIPLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/admin/vip/');
      if (response.ok) {
        const data = await response.json();
        setVipLevels(data);
      } else {
        console.error('Failed to fetch VIP levels');
      }
    } catch (error) {
      console.error('Error fetching VIP levels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchVIPLevels();
  }, []);

  const getColorClass = (color: string) => {
    return colors.find(c => c.name === color)?.class || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const filteredVIPLevels = vipLevels
    .filter(vip =>
      vip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vip.benefits.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.level - b.level);

  const resetForm = () => {
    setFormData({
      name: '',
      level: '1',
      discount: '95',
      minSpend: '0',
      color: 'gray',
      icon: '👤',
      benefits: ''
    });
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error('请输入会员等级名称');
      return;
    }

    try {
      const response = await fetch('http://localhost:8001/admin/vip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          level: parseInt(formData.level),
          discount: parseInt(formData.discount),
          min_spend: parseFloat(formData.minSpend),
          color: formData.color,
          icon: formData.icon,
          benefits: formData.benefits.split('\n').filter(b => b.trim())
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        fetchVIPLevels();
        toast.success('会员等级添加成功');
      } else {
        const error = await response.json();
        toast.error(error.detail || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handleEdit = (vip: VIPLevel) => {
    setEditingVIP(vip);
    setFormData({
      name: vip.name,
      level: String(vip.level),
      discount: String(vip.discount),
      minSpend: String(vip.min_spend),
      color: vip.color,
      icon: vip.icon,
      benefits: vip.benefits.join('\n')
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingVIP || !formData.name) {
      toast.error('请输入会员等级名称');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/admin/vip/${editingVIP.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          level: parseInt(formData.level),
          discount: parseInt(formData.discount),
          min_spend: parseFloat(formData.minSpend),
          color: formData.color,
          icon: formData.icon,
          benefits: formData.benefits.split('\n').filter(b => b.trim())
        })
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingVIP(null);
        resetForm();
        fetchVIPLevels();
        toast.success('会员等级更新成功');
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    const vip = vipLevels.find(v => v.id === id);
    if (vip && vip.memberCount > 0) {
      toast.warning(`该等级下还有 ${vip.memberCount} 位会员，请先处理会员后再删除等级`);
      return;
    }

    if (confirm('确定要删除这个会员等级吗？')) {
      try {
        const response = await fetch(`http://localhost:8001/admin/vip/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchVIPLevels();
          toast.success('会员等级删除成功');
        } else {
          const error = await response.json();
          toast.error(error.detail || '删除失败');
        }
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const handleViewDetail = (vip: VIPLevel) => {
    setViewingVIP(vip);
    setShowDetailModal(true);
  };

  const totalMembers = vipLevels.reduce((sum, v) => sum + (v.memberCount || 0), 0);
  const totalRevenue = vipLevels.reduce((sum, v) => sum + (v.monthlyRevenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900 mb-1">会员管理</h2>
          <p className="text-gray-600">管理会员等级和权益设置</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          添加会员等级
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
              <Crown className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">会员等级</p>
              <p className="text-2xl text-gray-900">{vipLevels.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">会员总数</p>
              <p className="text-2xl text-gray-900">{totalMembers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">月度营收</p>
              <p className="text-2xl text-gray-900">¥{(totalRevenue / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">平均折扣</p>
              <p className="text-2xl text-gray-900">
                {vipLevels.length > 0 ? (vipLevels.reduce((sum, v) => sum + v.discount, 0) / vipLevels.length / 10).toFixed(1) : 0}折
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-gray-200/50 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索会员等级或权益..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </div>
      </div>

      {/* 会员等级列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredVIPLevels.map((vip) => (
          <div
            key={vip.id}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl border-2 ${getColorClass(vip.color)}`}>
                  {vip.icon}
                </div>
                <div>
                  <h3 className="text-xl text-gray-900">{vip.name}</h3>
                  <p className="text-sm text-gray-500">等级 {vip.level} · {vip.discount / 10}折优惠</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">消费门槛</span>
                <span className="text-gray-900">¥{vip.min_spend.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">会员数量</span>
                <span className="text-gray-900">{vip.memberCount} 人</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">月度营收</span>
                <span className="text-gray-900">¥{vip.monthlyRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">会员权益</p>
              <div className="flex flex-wrap gap-1.5">
                {vip.benefits.slice(0, 3).map((benefit, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-gradient-to-r from-orange-50 to-pink-50 text-orange-700 rounded-full text-xs border border-orange-200"
                  >
                    {benefit}
                  </span>
                ))}
                {vip.benefits.length > 3 && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    +{vip.benefits.length - 3}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewDetail(vip)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 rounded-lg hover:from-orange-100 hover:to-pink-100 transition-colors border border-orange-200"
              >
                <Gift className="w-4 h-4" />
                查看详情
              </button>
              <button
                onClick={() => handleEdit(vip)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => handleDelete(vip.id)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 添加会员等级模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900">添加会员等级</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800 mb-2">等级名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="例如：金卡会员"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">等级</label>
                    <input
                      type="number"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-2">折扣(%)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      placeholder="95"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">消费门槛(¥)</label>
                  <input
                    type="number"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">选择图标</label>
                  <div className="grid grid-cols-4 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${formData.icon === icon
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                          }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">选择颜色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.name })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${formData.color === color.name
                          ? `${color.class} border-current`
                          : 'border-gray-200 hover:border-orange-300'
                          }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">会员权益（每行一个）</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    placeholder="例如：&#10;9折优惠&#10;积分双倍&#10;专属客服"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border border-orange-300 rounded-lg text-gray-700 hover:bg-white/50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAdd}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    确定添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑会员等级模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900">编辑会员等级</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVIP(null);
                  resetForm();
                }}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800 mb-2">等级名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="例如：金卡会员"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 mb-2">等级</label>
                    <input
                      type="number"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-800 mb-2">折扣(%)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      placeholder="95"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">消费门槛(¥)</label>
                  <input
                    type="number"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">选择图标</label>
                  <div className="grid grid-cols-4 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${formData.icon === icon
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                          }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">选择颜色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.name })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${formData.color === color.name
                          ? `${color.class} border-current`
                          : 'border-gray-200 hover:border-orange-300'
                          }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">会员权益（每行一个）</label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    placeholder="例如：&#10;9折优惠&#10;积分双倍&#10;专属客服"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingVIP(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border border-orange-300 rounded-lg text-gray-700 hover:bg-white/50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看详情模态框 */}
      {showDetailModal && viewingVIP && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-8 pb-4">
              <h3 className="text-2xl text-gray-900">会员等级详情</h3>
              <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" onClick={() => setShowDetailModal(false)}>
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl border-2 ${getColorClass(viewingVIP.color)}`}>
                    {viewingVIP.icon}
                  </div>
                  <div>
                    <h4 className="text-xl text-gray-900">{viewingVIP.name}</h4>
                    <p className="text-gray-600">等级 {viewingVIP.level}</p>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">优惠折扣</label>
                  <p className="text-2xl text-gray-900">{viewingVIP.discount / 10} 折</p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">消费门槛</label>
                  <p className="text-lg text-gray-900">¥{viewingVIP.min_spend.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">会员数量</label>
                    <p className="text-xl text-gray-900">{viewingVIP.memberCount} 人</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">月度营收</label>
                    <p className="text-xl text-gray-900">¥{(viewingVIP.monthlyRevenue / 1000).toFixed(1)}k</p>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">会员权益</label>
                  <div className="space-y-2">
                    {viewingVIP.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500"></div>
                        <span className="text-gray-900">{benefit}</span>
                      </div>
                    ))}
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