"use client"
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function Navigation() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      await logout();
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-xl font-bold text-slate-800 hover:text-slate-600 transition-colors"
            >
              项目收藏
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link 
                  href="/" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  首页
                </Link>
                <Link 
                  href="/tdiy/admin" 
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  管理后台
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-600 text-sm">
                  欢迎, <span className="font-medium text-slate-800">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  退出登录
                </button>
              </div>
            ) : (
              // <Link
              //   href="/login"
              //   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              // >
              //   {/* 登录 */}
              // </Link>
              <></>
            )}
          </div>
        </div>

        {/* 移动端菜单 */}
        {user && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200">
            <div className="flex space-x-4">
              <Link 
                href="/" 
                className="text-slate-600 hover:text-slate-800 transition-colors text-sm"
              >
                首页
              </Link>
              <Link 
                href="/tdiy/admin" 
                className="text-slate-600 hover:text-slate-800 transition-colors text-sm"
              >
                管理后台
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}