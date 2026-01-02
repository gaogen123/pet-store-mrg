import { useState } from 'react';
import { PawPrint, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

interface RegisterProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function Register({ onRegister, onSwitchToLogin }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    };

    if (!formData.name) {
      newErrors.name = '请输入用户名';
    } else if (formData.name.length < 2) {
      newErrors.name = '用户名至少需要2个字符';
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.phone) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入有效的手机号';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => !error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch('http://localhost:8001/admin/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.name,
            email: formData.email,
            password: formData.password,
            // phone: formData.phone, // AdminUser model currently doesn't have phone, let's check or add it?
            // Checking models.py... AdminUser has id, username, email, password, avatar, create_time, last_login. No phone.
            // So we should remove phone from request body or add it to model.
            // For now let's remove it to match backend model.
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific errors if possible
          if (data.detail === 'Email already registered') {
            setErrors(prev => ({ ...prev, email: '该邮箱已被注册' }));
          } else {
            setErrors(prev => ({ ...prev, confirmPassword: data.detail || '注册失败' }));
          }
          return;
        }

        // Auto login after register or just redirect to login?
        // Let's auto login or just call onRegister which sets authenticated state
        localStorage.setItem('adminUser', JSON.stringify(data));
        onRegister();
      } catch (error) {
        console.error('Register error:', error);
        setErrors(prev => ({ ...prev, confirmPassword: '无法连接到服务器' }));
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

      {/* 注册卡片 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/50">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl shadow-lg mb-4">
              <PawPrint className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-2">创建账户</h1>
            <p className="text-gray-600">加入我们，开始管理您的宠物商城</p>
          </div>

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 姓名 */}
            <div>
              <label className="block text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all`}
                  placeholder="请输入用户名"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label className="block text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 手机号 */}
            <div>
              <label className="block text-gray-700 mb-2">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    setErrors({ ...errors, phone: '' });
                  }}
                  className={`w-full pl-10 pr-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all`}
                  placeholder="请输入手机号"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
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
                  placeholder="请输入密码（至少6个字符）"
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

            {/* 确认密码 */}
            <div>
              <label className="block text-gray-700 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setErrors({ ...errors, confirmPassword: '' });
                  }}
                  className={`w-full pl-10 pr-12 py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all`}
                  placeholder="请再次输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 用户协议 */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 mt-1 text-orange-500 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                我已阅读并同意
                <button type="button" className="text-orange-600 hover:text-orange-700 transition-colors mx-1">
                  用户协议
                </button>
                和
                <button type="button" className="text-orange-600 hover:text-orange-700 transition-colors ml-1">
                  隐私政策
                </button>
              </label>
            </div>

            {/* 注册按钮 */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-orange-200 transition-all transform hover:scale-[1.02]"
            >
              注册
            </button>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">或</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* 登录提示 */}
          <div className="text-center">
            <p className="text-gray-600">
              已有账户？
              <button
                onClick={onSwitchToLogin}
                className="ml-1 text-orange-600 hover:text-orange-700 transition-colors"
              >
                立即登录
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
