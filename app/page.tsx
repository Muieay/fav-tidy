"use client"
import { useEffect, useState, useCallback, useRef } from 'react';

// 简单的防抖函数实现
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

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

interface ProjectsByCategory {
  [category: string]: FavoriteProject[];
}

// 分页信息接口
interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function Home() {
  const [projects, setProjects] = useState<FavoriteProject[]>([]);
  const [allProjects, setAllProjects] = useState<FavoriteProject[]>([]); // 用于存储所有项目数据
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 分页状态
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 24,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async (search = '', category = '', page = 1, resetPagination = false) => {
    try {
      if (!search && !category && page === 1) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString()
      });
      
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/tidy?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data.list);
        setPagination(data.data.pagination);
        if (!search && !category && page === 1) {
          setAllProjects(data.data.list); // 存储第一页的项目数据
        }
        setIsSearching(Boolean(search || category));
        
        // 分页切换时滚动到页面顶部
        if (page > 1 || resetPagination) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setError(data.message || '获取项目数据失败');
      }
    } catch (err) {
      setError('网络请求失败');
    } finally {
      setLoading(false);
      setSearchLoading(false);
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

  // 处理搜索
  const handleSearch = (keyword: string, category: string) => {
    setSearchKeyword(keyword);
    setSelectedCategory(category);
    // 搜索时重置到第一页
    fetchProjects(keyword, category, 1, true);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setIsSearching(false);
    // 清除搜索时重置到第一页
    fetchProjects('', '', 1, true);
  };

  // 处理分页
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      fetchProjects(searchKeyword, selectedCategory, newPage);
    }
  };

  // 防抖搜索
  const debouncedSearch = useDebounce((keyword: string, category: string) => {
    handleSearch(keyword, category);
  }, 500);

  // 按分类组织项目
  const projectsByCategory: ProjectsByCategory = projects.reduce((acc, project) => {
    const category = project.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(project);
    return acc;
  }, {} as ProjectsByCategory);

  // 截断文本函数
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-foreground/70">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => fetchProjects()}
            className="px-4 py-2 bg-foreground text-background rounded hover:opacity-80 transition-opacity"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-4">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          {/* <h1 className="text-4xl font-bold mb-4">项目收藏</h1> */}
          <p className="text-foreground/70 text-lg">发现和管理你喜爱的项目</p>
        </div>

        {/* 搜索区域 */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="bg-background border border-foreground/10 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 关键词搜索 */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索项目名称、关键词或描述..."
                    value={searchKeyword}
                    ref={searchInputRef}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchInputRef.current?.value || '', selectedCategory);
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchKeyword(value);
                      // 使用防抖搜索
                      debouncedSearch(value, selectedCategory);
                    }}
                    className="w-full px-4 py-3 pr-10 border border-foreground/20 rounded-lg bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
                    </div>
                  )}
                  {searchKeyword && !searchLoading && (
                    <button
                      onClick={() => setSearchKeyword('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              
              {/* 分类筛选 */}
              <div className="md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory(value);
                    handleSearch(searchKeyword, value);
                  }}
                  className="w-full px-4 py-3 border border-foreground/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">所有分类</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 搜索按钮 */}
              <button
                onClick={() => handleSearch(searchKeyword, selectedCategory)}
                disabled={searchLoading}
                className="px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity whitespace-nowrap disabled:opacity-50"
              >
                搜索
              </button>
              
              {/* 清除搜索按钮 */}
              {(searchKeyword || selectedCategory) && (
                <button
                  onClick={clearSearch}
                  className="px-6 py-3 bg-foreground text-background rounded-lg hover:opacity-80 transition-opacity whitespace-nowrap"
                >
                  清除
                </button>
              )}
            </div>
            
            {/* 搜索结果统计 */}
            {(isSearching || pagination.total > 0) && (
              <div className="mt-4 text-sm text-foreground/60">
                {searchLoading ? (
                  <span>搜索中...</span>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span>
                      {isSearching ? (
                        <>
                          找到 {pagination.total} 个项目
                          {searchKeyword && ` 包含 "${searchKeyword}"`}
                          {selectedCategory && ` 在分类 "${selectedCategory}" 中`}
                        </>
                      ) : (
                        <>共 {pagination.total} 个项目</>
                      )}
                    </span>
                    <span>
                      显示第 {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 项，
                      第 {pagination.page} / {pagination.totalPages || 1} 页
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            {isSearching ? (
              <div>
                <p className="text-foreground/70 text-lg mb-2">未找到匹配的项目</p>
                <p className="text-foreground/50">试试调整搜索条件或清除搜索</p>
              </div>
            ) : (
              <p className="text-foreground/70 text-lg">暂无收藏项目</p>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
              <div key={category} className="">
                {/* 分类标题 */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-foreground border-b-2 border-foreground/20 pb-2 inline-block">
                    {category}
                  </h2>
                  <span className="ml-3 text-sm text-foreground/60">({categoryProjects.length} 个项目)</span>
                </div>

                {/* 项目网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="bg-background border border-foreground/10 rounded-lg p-6 hover:shadow-lg hover:border-foreground/20 transition-all duration-200 group"
                    >
                      {/* 项目头部：favicon + 项目名称 */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3">
                          {/* Favicon 显示 */}
                          {project.favicon_url && (
                            <img 
                              src={project.favicon_url} 
                              alt={`${project.project_name} favicon`}
                              className="w-6 h-6 flex-shrink-0 rounded"
                              onError={(e) => {
                                // 如果 favicon 加载失败，隐藏图片
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          
                          {/* 项目名称 - 可点击链接，限制长度防止溢出 */}
                          <a 
                            href={project.project_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xl font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group-hover:underline flex-1 min-w-0"
                            title={`访问 ${project.project_name}`}
                          >
                            <div className="truncate">
                              {searchKeyword && project.project_name.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: truncateText(project.project_name, 30).replace(
                                      new RegExp(`(${searchKeyword})`, 'gi'),
                                      '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
                                    )
                                  }}
                                />
                              ) : (
                                truncateText(project.project_name, 30)
                              )}
                            </div>
                          </a>
                        </div>
                      </div>

                      {/* 项目详细介绍 */}
                      <div className="mb-4">
                        <div className="relative">
                          <p className="text-foreground/80 leading-relaxed">
                            {truncateText(project.project_description, 80)}
                          </p>
                          {project.project_description && project.project_description.length > 80 && (
                            <div className="absolute invisible group-hover:visible bg-background/90 backdrop-blur-sm text-foreground p-3 rounded-xl shadow-xl border border-foreground/10 z-20 top-full left-0 mt-2 text-sm leading-relaxed w-90 max-h-52 overflow-y-auto transition-all duration-200">
                              <div className="break-words">
                                {project.project_description}
                              </div>
                              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-background/90 border-l border-t border-foreground/10 transform rotate-45 backdrop-blur-sm"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 项目关键词 */}
                      {project.keywords && (
                        <div className="mb-4">
                          <div className="relative">
                            <div className="flex flex-wrap gap-1">
                              {project.keywords.split(',').slice(0, 3).map((keyword, index) => {
                                const trimmedKeyword = keyword.trim();
                                const isHighlighted = searchKeyword && trimmedKeyword.toLowerCase().includes(searchKeyword.toLowerCase());
                                return (
                                  <span 
                                    key={index}
                                    className={`inline-block px-2 py-1 rounded text-xs ${
                                      isHighlighted 
                                        ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                        : 'bg-foreground/10 text-foreground/80'
                                    }`}
                                  >
                                    {trimmedKeyword}
                                  </span>
                                );
                              })}
                              {project.keywords.split(',').length > 3 && (
                                <span className="inline-block text-foreground/60 px-2 py-1 text-xs">
                                  +{project.keywords.split(',').length - 3}
                                </span>
                              )}
                            </div>
                            {project.keywords.split(',').length > 3 && (
                              <div className="absolute invisible group-hover:visible bg-foreground text-background p-3 rounded-lg shadow-lg z-20 top-full left-0 mt-2 text-sm w-72 max-h-24 overflow-y-auto">
                                <div className="flex flex-wrap gap-1">
                                  {project.keywords.split(',').map((keyword, index) => {
                                    const trimmedKeyword = keyword.trim();
                                    const isHighlighted = searchKeyword && trimmedKeyword.toLowerCase().includes(searchKeyword.toLowerCase());
                                    return (
                                      <span 
                                        key={index} 
                                        className={`inline-block px-2 py-1 rounded text-xs ${
                                          isHighlighted
                                            ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                            : 'bg-background/20'
                                        }`}
                                      >
                                        {trimmedKeyword}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 项目标签和评分 */}
                      <div className="flex items-center justify-between text-sm text-foreground/60">
                        <div className="flex items-center space-x-2">
                          {project.rating > 0 && (
                            <div className="flex items-center">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1">{project.rating}</span>
                            </div>
                          )}
                          {project.is_public === 1 && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">
                              公开
                            </span>
                          )}
                        </div>
                        <span className="text-xs">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* 分页组件 */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    上一页
                  </button>
                  
                  {/* 页码按钮 */}
                  <div className="flex items-center space-x-1">
                    {/* 智能显示页码 */}
                    {(() => {
                      const { page, totalPages } = pagination;
                      const pages = [];
                      
                      if (totalPages <= 7) {
                        // 总页数少于等于7页，显示所有页码
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // 总页数大于7页，智能显示
                        if (page <= 4) {
                          // 当前页在前4页
                          pages.push(1, 2, 3, 4, 5, '...', totalPages);
                        } else if (page >= totalPages - 3) {
                          // 当前页在后4页
                          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                          // 当前页在中间
                          pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
                        }
                      }
                      
                      return pages.map((pageNum, index) => {
                        if (pageNum === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 py-2 text-foreground/50">
                              ...
                            </span>
                          );
                        }
                        
                        const isActive = pageNum === page;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum as number)}
                            className={`w-10 h-10 rounded-md transition-all ${
                              isActive
                                ? 'bg-foreground text-background'
                                : 'border border-foreground/20 bg-background text-foreground hover:bg-foreground/5'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      });
                    })()} 
                  </div>
                  
                  {/* 下一页按钮 */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-2 border border-foreground/20 rounded-md bg-background text-foreground hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    下一页
                  </button>
                  
                  {/* 快速跳转 */}
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="text-sm text-foreground/70">跳转到</span>
                    <input
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      className="w-16 px-2 py-1 border border-foreground/20 rounded bg-background text-foreground text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = parseInt((e.target as HTMLInputElement).value);
                          if (value >= 1 && value <= pagination.totalPages) {
                            handlePageChange(value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <span className="text-sm text-foreground/70">页</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Copyright 页脚 */}
        <footer className="mt-16 border-t border-foreground/10 pt-8 pb-6">
          <div className="text-center">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 max-w-4xl mx-auto">
              <div className="text-sm text-foreground/60">
                <p>© 2023 ~ {new Date().getFullYear()} &nbsp;&nbsp;&nbsp;&nbsp;项目收藏夹</p>
              </div>
              <div className="flex items-center space-x-6 text-sm text-foreground/60">
                <a 
                  href="https://github.com/muieay" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <a 
                  href="https://muieay.github.io/WeChat/" 
                  className="hover:text-foreground transition-colors"
                >
                  联系我们
                </a>
                <span className="hover:text-foreground transition-colors cursor-pointer">
                  帮助中心
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-foreground/50">
              <p>用心整理，高效管理 - 让收藏更有价值</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
