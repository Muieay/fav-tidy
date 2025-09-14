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

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async (search = '', category = '') => {
    try {
      if (!search && !category) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const params = new URLSearchParams({
        pageSize: '100'
      });
      
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/tidy?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data.list);
        if (!search && !category) {
          setAllProjects(data.data.list); // 存储所有项目数据
        }
        setIsSearching(Boolean(search || category));
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
    fetchProjects(keyword, category);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchKeyword('');
    setSelectedCategory('');
    setProjects(allProjects);
    setIsSearching(false);
  };

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">项目收藏</h1>
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
                    onChange={(e) => setSearchKeyword(e.target.value)}
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
                  onChange={(e) => setSelectedCategory(e.target.value)}
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
            {isSearching && (
              <div className="mt-4 text-sm text-foreground/60">
                {searchLoading ? (
                  <span>搜索中...</span>
                ) : (
                  <span>
                    找到 {projects.length} 个项目
                    {searchKeyword && ` 包含 "${searchKeyword}"`}
                    {selectedCategory && ` 在分类 "${selectedCategory}" 中`}
                  </span>
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
                      {/* 项目名称 - 可点击链接 */}
                      <div className="mb-4">
                        <a 
                          href={project.project_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xl font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block group-hover:underline"
                          title={`访问 ${project.project_name}`}
                        >
                          {searchKeyword && project.project_name.toLowerCase().includes(searchKeyword.toLowerCase()) ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: project.project_name.replace(
                                  new RegExp(`(${searchKeyword})`, 'gi'),
                                  '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
                                )
                              }}
                            />
                          ) : (
                            project.project_name
                          )}
                        </a>
                      </div>

                      {/* 项目详细介绍 */}
                      <div className="mb-4">
                        <div className="relative">
                          <p 
                            className="text-foreground/80 leading-relaxed cursor-help" 
                            title={project.project_description}
                          >
                            {truncateText(project.project_description, 120)}
                          </p>
                          {project.project_description && project.project_description.length > 120 && (
                            <div className="absolute invisible group-hover:visible bg-foreground text-background p-3 rounded-lg shadow-lg z-10 top-full left-0 right-0 mt-2 text-sm leading-relaxed max-w-md">
                              {project.project_description}
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
                              <div className="absolute invisible group-hover:visible bg-foreground text-background p-3 rounded-lg shadow-lg z-10 top-full left-0 mt-2 text-sm whitespace-nowrap">
                                <div className="flex flex-wrap gap-1 max-w-xs">
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
          </div>
        )}
      </div>
    </div>
  );
}
