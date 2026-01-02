import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Users, Package, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const [statsData, setStatsData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, salesRes, categoryRes, ordersRes] = await Promise.all([
          fetch('http://localhost:8001/admin/dashboard/stats'),
          fetch('http://localhost:8001/admin/dashboard/sales-chart'),
          fetch('http://localhost:8001/admin/dashboard/category-chart'),
          fetch('http://localhost:8001/admin/dashboard/recent-orders')
        ]);

        if (statsRes.ok) setStatsData(await statsRes.json());
        if (salesRes.ok) setSalesData(await salesRes.json());
        if (categoryRes.ok) setCategoryData(await categoryRes.json());
        if (ordersRes.ok) setRecentOrders(await ordersRes.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { label: '总销售额', value: statsData ? `¥${statsData.total_sales.toLocaleString()}` : '¥0', change: '+12.5%', icon: TrendingUp, color: 'blue', tab: 'orders' },
    { label: '订单数量', value: statsData ? statsData.order_count.toLocaleString() : '0', change: '+8.2%', icon: ShoppingCart, color: 'green', tab: 'orders' },
    { label: '用户总数', value: statsData ? statsData.user_count.toLocaleString() : '0', change: '+15.3%', icon: Users, color: 'purple', tab: 'users' },
    { label: '商品总数', value: statsData ? statsData.product_count.toLocaleString() : '0', change: '+3.1%', icon: Package, color: 'orange', tab: 'products' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-800 mb-1">仪表盘</h2>
        <p className="text-gray-700">欢迎回来，查看您的商城数据概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={() => onTabChange(stat.tab)}
              className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:bg-white/50 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <span className="text-green-600 text-sm">{stat.change}</span>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl text-gray-900 font-semibold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* 图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 销售趋势 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg">
          <h3 className="text-lg text-gray-800 mb-4">销售趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000020" />
              <XAxis dataKey="name" stroke="#374151" />
              <YAxis stroke="#374151" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffffdd', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
              <Line type="monotone" dataKey="销售额" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 商品分类占比 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg">
          <h3 className="text-lg text-gray-800 mb-4">商品分类占比</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffffdd', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近订单 */}
      <div className="bg-white/40 backdrop-blur-xl rounded-xl p-6 border border-white/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-gray-800">最近订单</h3>
          <button
            onClick={() => onTabChange('orders')}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            查看全部
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 text-gray-700">订单号</th>
                <th className="text-left py-3 px-4 text-gray-700">客户</th>
                <th className="text-left py-3 px-4 text-gray-700">商品</th>
                <th className="text-left py-3 px-4 text-gray-700">金额</th>
                <th className="text-left py-3 px-4 text-gray-700">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <tr
                  key={index}
                  onClick={() => onTabChange('orders')}
                  className="border-b border-gray-200 hover:bg-white/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-gray-900">{order.id}</td>
                  <td className="py-3 px-4 text-gray-900">{order.customer}</td>
                  <td className="py-3 px-4 text-gray-600">{order.product}</td>
                  <td className="py-3 px-4 text-gray-900">{order.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${order.status === 'completed' || order.status === '已完成' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' || order.status === '配送中' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {order.status === 'completed' ? '已完成' :
                        order.status === 'pending' ? '待付款' :
                          order.status === 'paid' ? '待发货' :
                            order.status === 'shipped' ? '已发货' : order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">暂无最近订单</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}