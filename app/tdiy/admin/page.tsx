"use client"
import { useEffect, useState, useRef } from 'react';
import AuthGuard from '../../components/AuthGuard';

interface FavoriteProject {
  id: number;
  project_name: string;
  project_url: string;
  project_description: string;
  keywords: string;
  category: string;
  rating: number;
  is_public: number;
  tags: string;
  favicon_url: string;
  screenshot_url: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  project_name: string;
  project_url: string;
  project_description: string;
  keywords: string;
  category: string;
  rating: number;
  is_public: number;
  tags: string;
  favicon_url: string;
  screenshot_url: string;
}

interface GitHubRepo {
  full_name: string;
  description: string;
  owner: {
    avatar_url: string;
  };
}

export default function AdminPage() {
  const [projects, setProjects] = useState<FavoriteProject[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 表单状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FavoriteProject | null>(null);
  const [formData, setFormData] = useState<FormData>({
    project_name: '',
    project_url: '',
    project_description: '',
    keywords: '',
    category: '',
    rating: 0,
    is_public: 0,
    tags: '',
    favicon_url: '',
    screenshot_url: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, [currentPage, searchKeyword, selectedCategory]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString()
      });
      
      if (searchKeyword) params.append('search', searchKeyword);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/tidy?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data.list);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      } else {
        setError(data.message || '获取项目数据失败');
      }
    } catch (err) {
      setError('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/tidy', { method: 'OPTIONS' });
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (err) {
      console.error('获取分类失败:', err);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProjects();
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setFormData({
      project_name: '',
      project_url: '',
      project_description: '',
      keywords: '',
      category: '',
      rating: 0,
      is_public: 1,
      tags: '',
      favicon_url: '',
      screenshot_url: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (project: FavoriteProject) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      project_url: project.project_url,
      project_description: project.project_description,
      keywords: project.keywords,
      category: project.category,
      rating: project.rating,
      is_public: project.is_public,
      tags: project.tags,
      favicon_url: project.favicon_url,
      screenshot_url: project.screenshot_url
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = '/api/tidy';
      const method = editingProject ? 'PUT' : 'POST';
      const body = editingProject 
        ? { id: editingProject.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        closeForm();
        fetchProjects();
        fetchCategories(); // 重新获取分类，防止新分类未显示
      } else {
        setError(data.message || '操作失败');
      }
    } catch (err) {
      setError('网络请求失败');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个项目吗？')) return;

    try {
      const response = await fetch(`/api/tidy?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchProjects();
      } else {
        setError(data.message || '删除失败');
      }
    } catch (err) {
      setError('网络请求失败');
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // 从GitHub导入项目信息
  const importFromGitHub = async () => {
    const githubUrl = formData.project_url;
    if (!githubUrl) {
      setError('请输入GitHub项目地址');
      return;
    }

    // 解析GitHub URL获取owner和repo
    const githubRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(\/.*)?$/;
    const match = githubUrl.match(githubRegex);
    
    if (!match) {
      setError('请输入有效的GitHub项目地址，格式如: https://github.com/owner/repo');
      return;
    }

    const owner = match[1];
    const repo = match[2];

    setGithubLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API请求失败: ${response.status} ${response.statusText}`);
      }

      const repoData: GitHubRepo = await response.json();

      // 更新表单数据
      setFormData(prev => ({
        ...prev,
        project_name: repoData.full_name,
        project_description: repoData.description || '',
        favicon_url: repoData.owner.avatar_url
      }));

      // 显示成功消息
      // setError('已成功从GitHub导入项目信息');
    } catch (err) {
      setError(err instanceof Error ? err.message : '从GitHub导入失败');
    } finally {
      setGithubLoading(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">项目收藏管理</h1>
              <p className="text-slate-600">管理您的项目收藏，添加、编辑和删除收藏项目</p>
            </div>
            <button
              onClick={openCreateForm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              + 添加项目
            </button>
          </div>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索项目名称、关键词或描述..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="lg:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">所有分类</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  搜索
                </button>
                {(searchKeyword || selectedCategory) && (
                  <button
                    onClick={clearSearch}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
            
            {/* 搜索结果统计 */}
            <div className="mt-4 text-sm text-slate-600">
              共找到 {total} 个项目
              {searchKeyword && ` 包含 "${searchKeyword}"`}
              {selectedCategory && ` 在分类 "${selectedCategory}" 中`}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* 项目列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">暂无项目数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">项目信息</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">分类</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">评分</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">创建时间</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-sm">
                          <h3 className="font-medium text-slate-900 mb-1">
                            <a 
                              href={project.project_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 transition-colors"
                            >
                              {project.project_name}
                            </a>
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">
                            {truncateText(project.project_description, 100)}
                          </p>
                          {project.keywords && (
                            <div className="flex flex-wrap gap-1">
                              {project.keywords.split(',').slice(0, 3).map((keyword, index) => (
                                <span 
                                  key={index}
                                  className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                                >
                                  {keyword.trim()}
                                </span>
                              ))}
                              {project.keywords.split(',').length > 3 && (
                                <span className="inline-block text-slate-500 text-xs px-2 py-1">
                                  +{project.keywords.split(',').length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {project.category || '其他'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-sm text-slate-700">{project.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                          project.is_public 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.is_public ? '公开' : '私有'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(project)}
                            className="px-3 py-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="px-3 py-1 text-red-600 hover:text-red-800 transition-colors text-sm"
                          >
                            删除
                          </button>
                          {/* <a 
                            href={project.project_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-green-600 hover:text-green-800 transition-colors text-sm"
                          >
                            访问
                          </a> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}

        {/* 表单弹窗 */}
        {isFormOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-white/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {editingProject ? '编辑项目' : '添加项目'}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
                    aria-label="关闭弹窗"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        项目名称 *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.project_name}
                        onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入项目名称"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          项目地址 *
                        </label>
                        <button
                          type="button"
                          onClick={importFromGitHub}
                          disabled={githubLoading || !formData.project_url}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {githubLoading ? (
                            <>
                              <span className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full mr-1"></span>
                              导入中...
                            </>
                          ) : '从GitHub导入'}
                        </button>
                      </div>
                      <input
                        type="url"
                        required
                        value={formData.project_url}
                        onChange={(e) => setFormData({...formData, project_url: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入项目地址，如: https://github.com/owner/repo"
                      />
                      <p className="mt-2 text-xs text-slate-500">支持GitHub地址一键导入项目信息</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        项目描述
                      </label>
                      <textarea
                        rows={3}
                        value={formData.project_description}
                        onChange={(e) => setFormData({...formData, project_description: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入项目描述"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        分类
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="输入或选择分类"
                          list="categories"
                        />
                        <datalist id="categories">
                          {categories.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        评分 (0-5)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        关键词 (逗号分隔)
                      </label>
                      <input
                        type="text"
                        value={formData.keywords}
                        onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                        placeholder="如: React, JavaScript, 前端框架"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        标签 (逗号分隔)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入标签"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        网站图标地址
                      </label>
                      <input
                        type="url"
                        value={formData.favicon_url}
                        onChange={(e) => setFormData({...formData, favicon_url: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入网站图标地址"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        截图地址
                      </label>
                      <input
                        type="url"
                        value={formData.screenshot_url}
                        onChange={(e) => setFormData({...formData, screenshot_url: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="请输入截图地址"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_public === 1}
                          onChange={(e) => setFormData({...formData, is_public: e.target.checked ? 1 : 0})}
                          className="mr-2 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">公开项目</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
                    >
                      {formLoading ? '保存中...' : (editingProject ? '更新' : '添加')}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </AuthGuard>
  );
}