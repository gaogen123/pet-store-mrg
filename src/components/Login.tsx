import { useState } from 'react';
import { PawPrint, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: ''
    };

    if (!formData.email) {
      newErrors.email = '请输入账号';
    }
    // Remove strict email validation to allow username
    // else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    //   newErrors.email = '请输入有效的邮箱地址';
    // }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch('http://localhost:8001/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors(prev => ({ ...prev, password: data.detail || '登录失败' }));
          return;
        }

        // Save user info and token if needed
        localStorage.setItem('adminUser', JSON.stringify(data));
        onLogin();
      } catch (error) {
        console.error('Login error:', error);
        setErrors(prev => ({ ...prev, password: '无法连接到服务器' }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-rose-300 relative overflow-hidden flex items-center justify-center p-4">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/3 w-72 h-72 bg-amber-200/35 rounded-full blur-3xl"></div>
      </div>

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/50">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl shadow-lg mb-4">
              <PawPrint className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">宠物商城后台</h1>
            <p className="text-gray-600">欢迎回来，请登录您的账户</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 账号 */}
            <div>
              <label className="block text-gray-700 mb-2">账号</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all`}
                  placeholder="请输入邮箱或用户名"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">记住我</span>
              </label>
              <button
                type="button"
                className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
              >
                忘记密码？
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-200 transition-all transform hover:scale-[1.02]"
            >
              登录
            </button>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">或</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* 注册提示 */}
          <div className="text-center">
            <p className="text-gray-600">
              还没有账户？
              <button
                onClick={onSwitchToRegister}
                className="ml-1 text-orange-600 hover:text-orange-700 transition-colors"
              >
                立即注册
              </button>
            </p>
          </div>


        </div>

        {/* 版权信息 */}
        <p className="text-center text-white/80 mt-6 text-sm">
          © 2026 宠物商城后台管理系统. All rights reserved.
        </p>
      </div>
    </div>
  );
}
