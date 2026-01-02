import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProductManagement } from './components/ProductManagement';
import { OrderManagement } from './components/OrderManagement';
import { UserManagement } from './components/UserManagement';
import { CategoryManagement } from './components/CategoryManagement';
import { BannerManagement } from './components/BannerManagement';
import { ShippingManagement } from './components/ShippingManagement';
import { VIPManagement } from './components/VIPManagement';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Register } from './components/Register';

import { Toaster } from 'sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>(() => {
    const savedUser = localStorage.getItem('adminUser');
    return savedUser ? 'authenticated' : 'login';
  });

  const handleLogin = () => {
    setAuthState('authenticated');
  };

  const handleRegister = () => {
    setAuthState('authenticated');
  };

  const handleSwitchToRegister = () => {
    setAuthState('register');
  };

  const handleSwitchToLogin = () => {
    setAuthState('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setAuthState('login');
    setActiveTab('dashboard');
  };

  // 如果未登录，显示登录或注册页面
  if (authState === 'login') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Login onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
      </>
    );
  }

  if (authState === 'register') {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Register onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
      </>
    );
  }

  // 已登录，显示主应用
  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-rose-300 relative overflow-hidden">
      <Toaster position="top-center" richColors />
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-amber-200/35 rounded-full blur-3xl"></div>
      </div>

      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard onTabChange={setActiveTab} />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'banners' && <BannerManagement />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'shipping' && <ShippingManagement />}
          {activeTab === 'vip' && <VIPManagement />}
        </div>
      </main>
    </div>
  );
}