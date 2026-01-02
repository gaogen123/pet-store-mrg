import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Eye, X, Upload, FileUp, Download, Trash } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  status: '上架' | '下架';
  description?: string;
  image?: string;
  images?: string[];
  specs?: string[];
}

interface SpecGroup {
  name: string;
  values: string[];
}

export function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('全部分类');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'on_sale' | 'low_stock' | 'sales'>('all');
  const [stats, setStats] = useState({
    total: 0,
    onSale: 0,
    lowStock: 0,
    totalSales: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    category: '猫粮',
    price: '',
    stock: '',
    description: '',
    image: '',
    images: [] as string[],
    specs: [] as string[]
  });

  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8001/admin/categories/');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Parse specs string[] into SpecGroup[]
  const parseSpecs = (specs: string[]) => {
    const groups: { [key: string]: string[] } = {};
    specs.forEach(spec => {
      const separator = spec.includes('：') ? '：' : ':';
      const [name, value] = spec.split(separator);
      if (name && value) {
        if (!groups[name]) groups[name] = [];
        groups[name].push(value);
      } else {
        // Handle cases without separator, maybe put in "其他" or just ignore
        if (!groups['其他']) groups['其他'] = [];
        groups['其他'].push(spec);
      }
    });
    return Object.entries(groups).map(([name, values]) => ({ name, values }));
  };

  // Convert SpecGroup[] back to specs string[]
  const stringifySpecs = (groups: SpecGroup[]) => {
    const specs: string[] = [];
    groups.forEach(group => {
      group.values.forEach(value => {
        if (group.name === '其他') {
          specs.push(value);
        } else {
          specs.push(`${group.name}:${value}`);
        }
      });
    });
    return specs;
  };

  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (categoryFilter && categoryFilter !== '全部分类') params.append('category', categoryFilter);

      // Apply active filter
      if (activeFilter === 'on_sale') params.append('status', '上架');
      if (activeFilter === 'low_stock') params.append('low_stock', 'true');
      if (activeFilter === 'sales') params.append('sort_by', 'sales_desc');

      // Pagination params
      params.append('skip', ((pagination.page - 1) * pagination.size).toString());
      params.append('limit', pagination.size.toString());

      const response = await fetch(`http://localhost:8001/admin/products/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          setProducts(data.items);
          setPagination(prev => ({ ...prev, total: data.total }));
        } else {
          setProducts(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // Fetch stats separately to keep them accurate even when filtering
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8001/admin/products/?limit=1000'); // Fetch all for stats
      if (response.ok) {
        const data = await response.json();
        // Check if paginated
        const allProducts: Product[] = data.items ? data.items : data;

        setStats({
          total: allProducts.length,
          onSale: allProducts.filter(p => p.status === '上架').length,
          lowStock: allProducts.filter(p => p.stock < 50).length,
          totalSales: allProducts.reduce((sum, p) => sum + p.sales, 0)
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []); // Only fetch stats once on mount or when needed (e.g. after add/delete)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to page 1 when filters change
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchProducts();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter, activeFilter]);

  // Effect to fetch when page changes (without resetting page)
  useEffect(() => {
    fetchProducts();
  }, [pagination.page]);

  const filteredProducts = products;

  const resetForm = () => {
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0].name : '',
      price: '',
      stock: '',
      description: '',
      image: '',
      images: [],
      specs: []
    });
    setSpecGroups([]);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const response = await fetch('http://localhost:8001/admin/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          description: formData.description,
          image: formData.image,
          images: formData.images,
          specs: stringifySpecs(specGroups),
          sales: 0,
          rating: 0
        }),
      });

      if (response.ok) {
        fetchProducts(); // Refresh list
        fetchStats(); // Refresh stats
        setShowAddModal(false);
        resetForm();
        toast.success('商品添加成功');
      } else {
        toast.error('添加失败');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('添加失败');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || '',
      image: product.image || '',
      images: product.images || [],
      specs: product.specs || []
    });
    setSpecGroups(parseSpecs(product.specs || []));
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingProduct || !formData.name || !formData.price || !formData.stock) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8001/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          description: formData.description,
          image: formData.image,
          images: formData.images,
          specs: stringifySpecs(specGroups)
        }),
      });

      if (response.ok) {
        fetchProducts();
        fetchStats();
        setShowEditModal(false);
        setEditingProduct(null);
        resetForm();
        toast.success('商品更新成功');
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个商品吗？')) {
      try {
        const response = await fetch(`http://localhost:8001/admin/products/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchProducts();
          fetchStats();
          toast.success('商品删除成功');
        } else {
          toast.error('删除失败');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('删除失败');
      }
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的商品');
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedIds.length} 个商品吗？`)) {
      try {
        const response = await fetch('http://localhost:8001/admin/products/batch-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectedIds),
        });

        if (response.ok) {
          fetchProducts();
          fetchStats();
          setSelectedIds([]);
          toast.success(`成功删除 ${selectedIds.length} 个商品`);
        } else {
          toast.error('批量删除失败');
        }
      } catch (error) {
        console.error('Error batch deleting:', error);
        toast.error('批量删除失败');
      }
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 单选
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === '上架' ? '下架' : '上架';
    try {
      const response = await fetch(`http://localhost:8001/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchProducts();
        fetchStats();
        toast.success(newStatus === '上架' ? '商品已上架' : '商品已下架');
      } else {
        toast.error('状态更新失败');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('状态更新失败');
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8001/admin/products/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('图片上传成功');
        return data.url;
      } else {
        toast.error('图片上传失败');
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('图片上传失败');
      return null;
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => ({ ...prev, image: url }));
      }
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => {
          const newImages = [...prev.images];
          newImages[index] = url;
          return { ...prev, images: newImages };
        });
      }
    }
  };

  const handleAddImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      }
    }
  };

  const downloadTemplate = () => {
    const template = `商品名称,分类,价格,库存,商品描述,图片URL,更多图片(用|分隔),规格(用|分隔)
进口猫粮 5kg,猫粮,198,150,高品质进口猫粮营养均衡,https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400,,
天然狗粮 10kg,狗粮,268,80,天然无添加健康首选,https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400,https://example.com/img2.jpg|https://example.com/img3.jpg,口味:牛肉|重量:10kg`;

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '商品导入模板.csv';
    link.click();
  };

  // 批量上传CSV
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErrors([]); // Clear previous errors

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8001/admin/products/batch-upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
          setUploadErrors(data.errors);
          toast.warning('部分商品导入失败', {
            description: '请查看下方的错误报告',
            duration: 5000,
          });
          // 仍然显示成功导入的数量
          if (data.message) {
            toast.success(data.message);
          }
          // Do not close modal if there are errors
        } else {
          toast.success(data.message);
          setShowBatchUploadModal(false);
        }

        fetchProducts();
      } else {
        const errorData = await response.json();
        toast.error(`导入失败: ${errorData.detail || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error batch uploading:', error);
      toast.error('导入失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-gray-800 mb-1">商品管理</h2>
          <p className="text-gray-700">管理您的宠物商品库存</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBatchUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-400/50 transition-all"
          >
            <FileUp className="w-5 h-5" />
            批量上传
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-400/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            添加商品
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilter('all')}
          className={`rounded-xl p-5 border shadow-lg transition-all cursor-pointer ${activeFilter === 'all'
            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500'
            : 'bg-white/40 backdrop-blur-xl border-white/50 hover:bg-white/50'
            }`}
        >
          <p className="text-gray-600 mb-1">商品总数</p>
          <p className="text-3xl text-gray-900">{stats.total}</p>
        </div>
        <div
          onClick={() => setActiveFilter('on_sale')}
          className={`rounded-xl p-5 border shadow-lg transition-all cursor-pointer ${activeFilter === 'on_sale'
            ? 'bg-green-50 border-green-200 ring-2 ring-green-500'
            : 'bg-white/40 backdrop-blur-xl border-white/50 hover:bg-white/50'
            }`}
        >
          <p className="text-gray-600 mb-1">在售商品</p>
          <p className="text-3xl text-green-600">{stats.onSale}</p>
        </div>
        <div
          onClick={() => setActiveFilter('low_stock')}
          className={`rounded-xl p-5 border shadow-lg transition-all cursor-pointer ${activeFilter === 'low_stock'
            ? 'bg-red-50 border-red-200 ring-2 ring-red-500'
            : 'bg-white/40 backdrop-blur-xl border-white/50 hover:bg-white/50'
            }`}
        >
          <p className="text-gray-600 mb-1">库存不足</p>
          <p className="text-3xl text-red-600">{stats.lowStock}</p>
        </div>
        <div
          onClick={() => setActiveFilter('sales')}
          className={`rounded-xl p-5 border shadow-lg transition-all cursor-pointer ${activeFilter === 'sales'
            ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500'
            : 'bg-white/40 backdrop-blur-xl border-white/50 hover:bg-white/50'
            }`}
        >
          <p className="text-gray-600 mb-1">总销量</p>
          <p className="text-3xl text-orange-600">{stats.totalSales}</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white/40 backdrop-blur-xl rounded-xl p-4 border border-white/50 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品名称或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option>全部分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash className="w-5 h-5" />
              删除选中 ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="text-left py-4 px-6 text-gray-600">图片</th>
                <th className="text-left py-4 px-6 text-gray-600">商品名称</th>
                <th className="text-left py-4 px-6 text-gray-600">分类</th>
                <th className="text-left py-4 px-6 text-gray-600">价格</th>
                <th className="text-left py-4 px-6 text-gray-600">库存</th>
                <th className="text-left py-4 px-6 text-gray-600">销量</th>
                <th className="text-left py-4 px-6 text-gray-600">状态</th>
                <th className="text-left py-4 px-6 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={`http://localhost:3000/?productId=${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                      title="点击查看前台商品详情"
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </a>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <a
                        href={`http://localhost:3000/?productId=${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                      >
                        {product.name}
                      </a>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-900">¥{product.price}</td>
                  <td className="py-4 px-6">
                    <span className={product.stock === 0 ? 'text-red-600' : product.stock < 50 ? 'text-orange-600' : 'text-gray-900'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{product.sales}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleStatus(product.id, product.status)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${product.status === '上架'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {product.status}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:3000/?productId=${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="预览"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </a>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
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
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-xl">
          <div className="text-sm text-gray-600">
            显示 {Math.min((pagination.page - 1) * pagination.size + 1, pagination.total)} 到 {Math.min(pagination.page * pagination.size, pagination.total)} 条，共 {pagination.total} 条
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            {Array.from({ length: Math.ceil(pagination.total / pagination.size) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setPagination(prev => ({ ...prev, page }))}
                className={`px-3 py-1 border rounded-lg ${pagination.page === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(Math.ceil(pagination.total / pagination.size), prev.page + 1) }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.size)}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* 添加商品模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900">添加新商品</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-8 pb-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">商品名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入商品名称"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">商品图片</label>
                  <div className="space-y-3">
                    {/* 图片预览 */}
                    {formData.image && (
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={formData.image}
                          alt="预览"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400?text=图片加载失败';
                          }}
                        />
                        <button
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* 上传按钮 */}
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                        <Upload className="w-5 h-5" />
                        选择图片
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* URL输入 */}
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="或输入图片URL地址"
                      />
                    </div>
                    <p className="text-sm text-gray-500">支持上传本地图片或输入图片URL（建议尺寸：400x400，不超过5MB）</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">更多图片</label>
                  {formData.images.map((img, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="图片URL"
                        />
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAdditionalImageUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <button
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== index);
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> 添加图片链接
                    </button>
                    <label className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 cursor-pointer">
                      <Plus className="w-4 h-4" /> 上传图片
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">商品规格</label>
                  <div className="space-y-4">
                    {specGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => {
                              const newGroups = [...specGroups];
                              newGroups[groupIndex].name = e.target.value;
                              setSpecGroups(newGroups);
                            }}
                            className="font-medium bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-32"
                            placeholder="规格名 (如: 颜色)"
                          />
                          <button
                            onClick={() => {
                              const newGroups = specGroups.filter((_, i) => i !== groupIndex);
                              setSpecGroups(newGroups);
                            }}
                            className="ml-auto text-red-500 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.values.map((value, valueIndex) => (
                            <div key={valueIndex} className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-1">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => {
                                  const newGroups = [...specGroups];
                                  newGroups[groupIndex].values[valueIndex] = e.target.value;
                                  setSpecGroups(newGroups);
                                }}
                                className="bg-transparent border-none focus:outline-none w-20 text-sm"
                                placeholder="值"
                              />
                              <button
                                onClick={() => {
                                  const newGroups = [...specGroups];
                                  newGroups[groupIndex].values = newGroups[groupIndex].values.filter((_, i) => i !== valueIndex);
                                  setSpecGroups(newGroups);
                                }}
                                className="ml-1 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newGroups = [...specGroups];
                              newGroups[groupIndex].values.push('');
                              setSpecGroups(newGroups);
                            }}
                            className="flex items-center gap-1 px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 bg-white"
                          >
                            <Plus className="w-3 h-3" /> 添加值
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setSpecGroups([...specGroups, { name: '', values: [''] }])}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> 添加规格组
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">价格</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入价格"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">库存</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入库存数量"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">商品描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请输入商品描述"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-8 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                确定添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑商品模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900">编辑商品</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-8 pb-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">商品名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入商品名称"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">商品图片</label>
                  <div className="space-y-3">
                    {/* 图片预览 */}
                    {formData.image && (
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={formData.image}
                          alt="预览"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/400?text=图片加载失败';
                          }}
                        />
                        <button
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* 上传按钮 */}
                    <div className="flex gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                        <Upload className="w-5 h-5" />
                        选择图片
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* URL输入 */}
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="或输入图片URL地址"
                      />
                    </div>
                    <p className="text-sm text-gray-500">支持上传本地图片或输入图片URL（建议尺寸：400x400，不超过5MB）</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">更多图片</label>
                  {formData.images.map((img, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
                          placeholder="图片URL"
                        />
                        <label className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAdditionalImageUpload(e, index)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <button
                        onClick={() => {
                          const newImages = formData.images.filter((_, i) => i !== index);
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> 添加图片链接
                    </button>
                    <label className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 cursor-pointer">
                      <Plus className="w-4 h-4" /> 上传图片
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">商品规格</label>
                  <div className="space-y-4">
                    {specGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => {
                              const newGroups = [...specGroups];
                              newGroups[groupIndex].name = e.target.value;
                              setSpecGroups(newGroups);
                            }}
                            className="font-medium bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-32"
                            placeholder="规格名 (如: 颜色)"
                          />
                          <button
                            onClick={() => {
                              const newGroups = specGroups.filter((_, i) => i !== groupIndex);
                              setSpecGroups(newGroups);
                            }}
                            className="ml-auto text-red-500 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.values.map((value, valueIndex) => (
                            <div key={valueIndex} className="flex items-center bg-white border border-gray-200 rounded-full px-3 py-1">
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => {
                                  const newGroups = [...specGroups];
                                  newGroups[groupIndex].values[valueIndex] = e.target.value;
                                  setSpecGroups(newGroups);
                                }}
                                className="bg-transparent border-none focus:outline-none w-20 text-sm"
                                placeholder="值"
                              />
                              <button
                                onClick={() => {
                                  const newGroups = [...specGroups];
                                  newGroups[groupIndex].values = newGroups[groupIndex].values.filter((_, i) => i !== valueIndex);
                                  setSpecGroups(newGroups);
                                }}
                                className="ml-1 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newGroups = [...specGroups];
                              newGroups[groupIndex].values.push('');
                              setSpecGroups(newGroups);
                            }}
                            className="flex items-center gap-1 px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500 bg-white"
                          >
                            <Plus className="w-3 h-3" /> 添加值
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setSpecGroups([...specGroups, { name: '', values: [''] }])}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> 添加规格组
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">价格</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入价格"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">库存</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入库存数量"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">商品描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请输入商品描述"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-8 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                  resetForm();
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

      {/* 批量上传模态框 */}
      {showBatchUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-8 pb-4">
              <h3 className="text-2xl text-gray-900">批量导入商品</h3>
              <button
                onClick={() => {
                  setShowBatchUploadModal(false);
                  setUploadErrors([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-8 pb-8 space-y-6">
              {/* 说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">📋 导入说明：</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>仅支持CSV格式文件</li>
                  <li>文件需包含：商品名称、分类、价格、库存、商品描述、图片URL、更多图片、规格</li>
                  <li>建议先下载模板，按格式填写后上传</li>
                </ul>
              </div>

              {/* 下载模板按钮 */}
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-5 h-5" />
                下载CSV模板
              </button>

              {/* 上传文件 */}
              <div>
                <label className="block text-gray-700 mb-3">选择CSV文件</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all">
                  <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">点击选择文件</span>
                  <span className="text-xs text-gray-400 mt-1">支持 .csv 格式</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBatchUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 错误报告 */}
            {uploadErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-red-800 mb-2">⚠️ 导入错误报告：</p>
                <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}