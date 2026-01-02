import { LayoutDashboard, Package, ShoppingCart, Users, PawPrint, Tag, Image, Truck, Crown, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { id: 'products', label: '商品管理', icon: Package },
    { id: 'categories', label: '分类管理', icon: Tag },
    { id: 'banners', label: 'Banner管理', icon: Image },
    { id: 'orders', label: '订单管理', icon: ShoppingCart },
    { id: 'shipping', label: '发货管理', icon: Truck },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'vip', label: '会员管理', icon: Crown },
  ];

  return (
    <aside className="w-64 h-screen bg-white/30 backdrop-blur-xl border-r border-white/40 pt-6 px-6 pb-0 shadow-2xl flex flex-col flex-shrink-0">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl shadow-lg">
          <PawPrint className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl text-gray-800 font-bold">宠物后台管理</h1>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg shadow-orange-400/30'
                : 'text-gray-600 hover:bg-white/50 hover:text-orange-500'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 退出登录按钮 */}
      {onLogout && (
        <div className="mt-auto py-6 border-t border-white/40">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      )}
    </aside>
  );
}