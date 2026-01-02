import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Tag, X, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
  icon: string;
  color: string;
}

export function CategoryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🐱',
    color: 'blue'
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8001/admin/categories/');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const icons = ['🐱', '🐶', '🐰', '🐹', '🐦', '🐠', '🎾', '🦴', '🛍️', '🏠', '🍖', '🥕'];
  const colors = [
    { name: 'blue', label: '蓝色', class: 'bg-blue-100 text-blue-700 border-blue-300' },
    { name: 'green', label: '绿色', class: 'bg-green-100 text-green-700 border-green-300' },
    { name: 'orange', label: '橙色', class: 'bg-orange-100 text-orange-700 border-orange-300' },
    { name: 'purple', label: '紫色', class: 'bg-purple-100 text-purple-700 border-purple-300' },
    { name: 'pink', label: '粉色', class: 'bg-pink-100 text-pink-700 border-pink-300' },
    { name: 'red', label: '红色', class: 'bg-red-100 text-red-700 border-red-300' },
  ];

  const getColorClass = (color: string) => {
    return colors.find(c => c.name === color)?.class || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '🐱',
      color: 'blue'
    });
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error('请输入分类名称');
      return;
    }

    try {
      const response = await fetch('http://localhost:8001/admin/categories/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCategories();
        setShowAddModal(false);
        resetForm();
        toast.success('添加成功');
      } else {
        const errorData = await response.json();
        toast.error(`添加失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('添加失败，请重试');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !formData.name) {
      toast.error('请输入分类名称');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCategories();
        setShowEditModal(false);
        setEditingCategory(null);
        resetForm();
        toast.success('更新成功');
      } else {
        const errorData = await response.json();
        toast.error(`更新失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('更新失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个分类吗？')) {
      try {
        const response = await fetch(`http://localhost:8001/admin/categories/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchCategories();
          toast.success('删除成功');
        } else {
          toast.error('删除失败');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('删除失败，请重试');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-900 mb-1 font-bold">分类管理</h2>
          <p className="text-gray-600">管理您的商品分类和展示方式</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          添加分类
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">分类总数</p>
              <p className="text-2xl text-gray-900 font-bold">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <LayoutGrid className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">商品总数</p>
              <p className="text-2xl text-gray-900 font-bold">{categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl p-5 border border-gray-200/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">平均商品数</p>
              <p className="text-2xl text-gray-900 font-bold">
                {categories.length > 0 ? Math.round(categories.reduce((sum, c) => sum + (c.productCount || 0), 0) / categories.length) : 0}
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
            placeholder="搜索分类名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* 分类列表 (表格) */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-gray-600 font-medium">图标</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">分类名称</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">描述</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">商品数</th>
                <th className="text-left py-4 px-6 text-gray-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border ${getColorClass(category.color)}`}>
                      {category.icon}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 font-medium">{category.name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-600 text-sm max-w-xs truncate">{category.description || '-'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {category.productCount || 0}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    未找到相关分类
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 添加分类模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900 font-bold">添加新分类</h3>
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
                  <label className="block text-gray-800 mb-2 font-medium">分类名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="请输入分类名称"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2 font-medium">分类描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    placeholder="请输入分类描述"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2 font-medium">选择图标</label>
                  <div className="grid grid-cols-6 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${formData.icon === icon
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
                  <label className="block text-gray-800 mb-2 font-medium">选择颜色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.name })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.color === color.name
                          ? `${color.class} border-current`
                          : 'border-gray-200 hover:border-orange-300'
                          }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border border-orange-300 rounded-lg text-gray-700 hover:bg-white/50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAdd}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    确定添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑分类模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl border border-orange-200 shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900 font-bold">编辑分类</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
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
                  <label className="block text-gray-800 mb-2 font-medium">分类名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    placeholder="请输入分类名称"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2 font-medium">分类描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    placeholder="请输入分类描述"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2 font-medium">选择图标</label>
                  <div className="grid grid-cols-6 gap-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${formData.icon === icon
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
                  <label className="block text-gray-800 mb-2 font-medium">选择颜色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.name })}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.color === color.name
                          ? `${color.class} border-current`
                          : 'border-gray-200 hover:border-orange-300'
                          }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCategory(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 border border-orange-300 rounded-lg text-gray-700 hover:bg-white/50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}