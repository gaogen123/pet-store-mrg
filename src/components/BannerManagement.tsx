import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  description: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  create_time: string;
}

export function BannerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    sort_order: '0',
    description: '',
    is_active: true
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/admin/banners/');
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      } else {
        toast.error('获取Banner列表失败');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filteredBanners = banners
    .filter(banner =>
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.description && banner.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      sort_order: '0',
      description: '',
      is_active: true
    });
  };

  const handleAdd = async () => {
    if (!formData.title || !formData.image_url) {
      toast.error('请填写标题和图片链接');
      return;
    }

    try {
      const response = await fetch('http://localhost:8001/admin/banners/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sort_order: parseInt(formData.sort_order)
        }),
      });

      if (response.ok) {
        toast.success('添加成功');
        fetchBanners();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error('添加失败');
      }
    } catch (error) {
      toast.error('网络错误');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      sort_order: String(banner.sort_order),
      description: banner.description || '',
      is_active: banner.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingBanner || !formData.title || !formData.image_url) {
      toast.error('请填写标题和图片链接');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/admin/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sort_order: parseInt(formData.sort_order)
        }),
      });

      if (response.ok) {
        toast.success('更新成功');
        fetchBanners();
        setShowEditModal(false);
        setEditingBanner(null);
        resetForm();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('网络错误');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个Banner吗？')) {
      try {
        const response = await fetch(`http://localhost:8001/admin/banners/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success('删除成功');
          fetchBanners();
        } else {
          toast.error('删除失败');
        }
      } catch (error) {
        toast.error('网络错误');
      }
    }
  };

  const toggleStatus = async (banner: Banner) => {
    try {
      const response = await fetch(`http://localhost:8001/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      if (response.ok) {
        toast.success(banner.is_active ? '已禁用' : '已启用');
        fetchBanners();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handlePreview = (banner: Banner) => {
    setPreviewBanner(banner);
    setShowPreviewModal(true);
  };

  const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = filteredBanners.findIndex(b => b.id === banner.id);
    let targetBanner: Banner | null = null;

    if (direction === 'up' && currentIndex > 0) {
      targetBanner = filteredBanners[currentIndex - 1];
    } else if (direction === 'down' && currentIndex < filteredBanners.length - 1) {
      targetBanner = filteredBanners[currentIndex + 1];
    }

    if (targetBanner) {
      try {
        // Swap sort_order
        const newOrder = targetBanner.sort_order;
        const targetNewOrder = banner.sort_order;

        await Promise.all([
          fetch(`http://localhost:8001/admin/banners/${banner.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: newOrder }),
          }),
          fetch(`http://localhost:8001/admin/banners/${targetBanner.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: targetNewOrder }),
          })
        ]);
        fetchBanners();
      } catch (error) {
        toast.error('排序更新失败');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900 mb-1 font-bold">Banner管理</h2>
          <p className="text-gray-600">管理首页轮播图和广告位</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-bold"
        >
          <Plus className="w-5 h-5" />
          添加Banner
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Banner总数</p>
              <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">已启用</p>
              <p className="text-2xl font-bold text-gray-900">{banners.filter(b => b.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-5 border border-white/50 shadow-lg hover:bg-white/50 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">已禁用</p>
              <p className="text-2xl font-bold text-gray-900">{banners.filter(b => !b.is_active).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索 */}
      <div className="bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索Banner标题或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Banner列表 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">预览</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">标题</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">链接</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">排序</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">状态</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">加载中...</td>
                </tr>
              ) : filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                filteredBanners.map((banner, index) => (
                  <tr key={banner.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-24 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                        onClick={() => handlePreview(banner)}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-900 font-medium">{banner.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{banner.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 max-w-xs truncate text-sm">{banner.link_url || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-bold">{banner.sort_order}</span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveOrder(banner, 'up')}
                            disabled={index === 0}
                            className={`p-0.5 rounded ${index === 0 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveOrder(banner, 'down')}
                            disabled={index === filteredBanners.length - 1}
                            className={`p-0.5 rounded ${index === filteredBanners.length - 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(banner)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${banner.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {banner.is_active ? '启用' : '禁用'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(banner)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="预览"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(banner)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加Banner模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">添加新Banner</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Banner标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="请输入Banner标题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">图片链接</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="预览"
                      className="mt-2 w-full h-32 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400?text=图片加载失败';
                      }}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">跳转链接</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="/products/category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">排序</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    placeholder="请输入Banner描述"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border border-orange-300 rounded-xl text-gray-700 hover:bg-white/50 transition-colors font-bold"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAdd}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                  >
                    确定添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑Banner模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">编辑Banner</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBanner(null);
                  resetForm();
                }}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="px-8 pb-8 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Banner标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="请输入Banner标题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">图片链接</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="预览"
                      className="mt-2 w-full h-32 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400?text=图片加载失败';
                      }}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">跳转链接</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="/products/category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">排序</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    placeholder="请输入Banner描述"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingBanner(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border border-orange-300 rounded-xl text-gray-700 hover:bg-white/50 transition-colors font-bold"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预览模态框 */}
      {showPreviewModal && previewBanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{previewBanner.title}</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <img
              src={previewBanner.image_url}
              alt={previewBanner.title}
              className="w-full h-auto rounded-2xl mb-6 shadow-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x400?text=图片加载失败';
              }}
            />

            <div className="space-y-4 text-gray-600 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <p className="flex items-start gap-2">
                <span className="font-bold text-gray-900 min-w-[60px]">描述：</span>
                <span>{previewBanner.description || '无'}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold text-gray-900 min-w-[60px]">链接：</span>
                <span className="text-blue-600 truncate">{previewBanner.link_url || '无'}</span>
              </p>
              <div className="flex gap-8">
                <p className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">排序：</span>
                  <span className="font-mono">{previewBanner.sort_order}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">状态：</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${previewBanner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {previewBanner.is_active ? '启用' : '禁用'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}