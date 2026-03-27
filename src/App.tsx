/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X, Loader2, Camera, Github, ExternalLink, Search, ArrowUp, Lock, User, ChevronRight } from 'lucide-react';

// Obfuscated credentials to avoid plaintext storage
const _U = [113, 105, 110, 103, 113, 105, 110, 103]; // qingqing
const _P = [113, 105, 110, 103, 113, 105, 110, 103, 109, 105, 109, 97, 49, 50, 51]; // qingqingmima123

interface CloudinaryResource {
  public_id: string;
  version: number;
  format: string;
  width: number;
  height: number;
  type: string;
  created_at: string;
}

interface CloudinaryListResponse {
  resources: CloudinaryResource[];
  updated_at: string;
}

const CATEGORIES = [
  { id: 'selfie', name: '个人写真', tag: 'selfie' },
  { id: 'aurora', name: '极光之约', tag: 'aurora' },
  { id: 'celestial', name: '天空之境', tag: 'celestial' },
  { id: 'sakura', name: '樱花写真', tag: 'sakura' },
  { id: 'dali', name: '大理之旅', tag: 'dali' },
  { id: 'cat', name: '我和猫猫', tag: 'cat' },
  { id: 'cosplay', name: 'Cosplay', tag: 'cosplay' },
];

interface GalleryItemProps {
  key?: string | number;
  resource: CloudinaryResource;
  index: number;
  onClick: () => void;
}

// Gallery Item Component to manage local loading state and prevent flickering
const GalleryItem = ({ 
  resource, 
  index, 
  onClick 
}: GalleryItemProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const CLOUDINARY_CLOUD_NAME = 'drfa9k3ql';

  // Check if image is already cached
  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  const getImageUrl = (res: CloudinaryResource, width?: number) => {
    const transform = width ? `c_limit,w_${width}/` : '';
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transform}v${res.version}/${res.public_id}.${res.format}`;
  };

  return (
    <div
      className="group relative bg-slate-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-white cursor-pointer"
      style={{ 
        aspectRatio: `${resource.width} / ${resource.height}`,
      }}
      onClick={onClick}
    >
      <img
        ref={imgRef}
        src={getImageUrl(resource, 600)}
        alt={resource.public_id}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-sm'
        }`}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 pointer-events-none">
        <div className="flex items-center justify-between text-white">
          <span className="text-sm font-medium truncate pr-4">
            {resource.public_id.split('/').pop()}
          </span>
          <Maximize2 className="w-5 h-5 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('utopia_auth') === 'true');
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [columnCount, setColumnCount] = useState(4);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [resources, setResources] = useState<CloudinaryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(40);
  const [selectedImage, setSelectedImage] = useState<CloudinaryResource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Responsive column count
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 640) setColumnCount(1);
      else if (window.innerWidth < 768) setColumnCount(2);
      else if (window.innerWidth < 1024) setColumnCount(3);
      else setColumnCount(4);
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthenticating(true);

    // Small delay for better UX
    setTimeout(() => {
      const u = username.trim();
      const p = password;

      const isUValid = u.length === _U.length && u.split('').every((char, i) => char.charCodeAt(0) === _U[i]);
      const isPValid = p.length === _P.length && p.split('').every((char, i) => char.charCodeAt(0) === _P[i]);

      if (isUValid && isPValid) {
        setIsLoggedIn(true);
        localStorage.setItem('utopia_auth', 'true');
        setIsAuthenticating(false);
      } else {
        setLoginError('用户名或密码错误');
        setIsAuthenticating(false);
      }
    }, 600);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('utopia_auth');
    setShowLogin(false);
    setResources([]); // Clear resources on logout
  };

  const CLOUDINARY_CLOUD_NAME = 'drfa9k3ql';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      // Clear current resources to prevent "old content flicker" when switching categories
      setResources([]); 
      
      try {
        const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/list/${activeCategory.tag}.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image list: ${response.status} ${response.statusText}`);
        const data: CloudinaryListResponse = await response.json();
        
        if (data && Array.isArray(data.resources)) {
          // Randomize the order of images
          const shuffled = [...data.resources].sort(() => Math.random() - 0.5);
          setResources(shuffled);
          setVisibleCount(40); // Reset visible count on category change
        } else {
          throw new Error('Invalid data format received from Cloudinary');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchData();
    }
  }, [activeCategory, isLoggedIn]);

  const getImageUrl = (resource: CloudinaryResource, width?: number) => {
    const transform = width ? `c_limit,w_${width}/` : '';
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transform}v${resource.version}/${resource.public_id}.${resource.format}`;
  };

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const query = searchQuery.toLowerCase();
    return resources.filter(res => 
      res.public_id.toLowerCase().includes(query)
    );
  }, [resources, searchQuery]);

  // Infinite Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      // Infinite scroll check
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (visibleCount < filteredResources.length) {
          setVisibleCount(prev => prev + 20);
        }
      }
      
      // Scroll top button check
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredResources.length]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleResources = useMemo(() => filteredResources.slice(0, visibleCount), [filteredResources, visibleCount]);

  const columns = useMemo(() => {
    const cols: CloudinaryResource[][] = Array.from({ length: columnCount }, () => []);
    const heights = Array(columnCount).fill(0);

    visibleResources.forEach((resource) => {
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) {
          shortest = i;
        }
      }
      cols[shortest].push(resource);
      // Use aspect ratio to estimate height
      heights[shortest] += resource.height / resource.width;
    });

    return cols;
  }, [visibleResources, columnCount]);

  if (!isLoggedIn) {
    if (!showLogin) {
      return (
        <div className="min-h-screen bg-[#F0F7FF] flex flex-col items-center justify-center p-4 overflow-hidden relative">
          {/* Animated Background Elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 blur-[120px] rounded-full animate-pulse delay-700" />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center z-10 max-w-2xl"
          >
            <div className="w-20 h-20 bg-blue-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 mx-auto mb-8">
              <Camera className="text-white w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">
              清清<span className="text-blue-500">乌托邦</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-12 leading-relaxed font-medium">
              捕捉瞬间的永恒，留住生活的美好。<br className="hidden md:block" />
              欢迎来到我的私人影像空间。
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLogin(true)}
              className="group px-10 py-5 bg-blue-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all flex items-center gap-3 mx-auto"
            >
              进入乌托邦
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          <footer className="absolute bottom-8 text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} 清清乌托邦 • 记录美好生活
          </footer>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 blur-[120px] rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white z-10"
        >
          <button 
            onClick={() => setShowLogin(false)}
            className="mb-8 text-slate-400 hover:text-blue-500 flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            返回首页
          </button>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">身份验证</h2>
          <p className="text-slate-500 mb-8">请输入凭据以进入乌托邦空间</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">用户名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-blue-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-sm font-bold text-center"
              >
                {loginError}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-5 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "验证并进入"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading && resources.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-blue-600 font-medium">正在加载清清乌托邦...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7FF] text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-blue-100/50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Camera className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
              清清乌托邦
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索图片..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-blue-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-48 md:w-64"
              />
            </div>
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95 text-sm md:text-base"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-10 md:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            捕捉瞬间，留住美好
          </h2>
          {resources.length > 0 && (
            <p className="text-xs text-slate-400 mb-2">共发现 {resources.length} 张图片</p>
          )}
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed px-4">
            欢迎来到我的个人影像空间。这里记录了生活中的点滴回忆与独特视角。
          </p>

          {/* Search Mobile */}
          <div className="sm:hidden mb-8 px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索图片..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-blue-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* Categories Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-all duration-300 ${
                  activeCategory.id === cat.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 hover:bg-blue-50 border border-blue-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-20">
        {loading && resources.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-blue-600 font-medium">正在加载 {activeCategory.name}...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-500 mb-4">加载失败: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              重试
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500">未找到与 "{searchQuery}" 相关的图片</p>
          </div>
        ) : (
          <div 
            className="grid gap-6" 
            style={{ 
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` 
            }}
          >
            {columns.map((column, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-6">
                {column.map((resource, index) => (
                  <GalleryItem 
                    key={resource.public_id}
                    resource={resource}
                    index={index}
                    onClick={() => setSelectedImage(resource)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Indicator */}
        {visibleCount < filteredResources.length && (
          <div className="mt-12 flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-300 animate-spin" />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Camera className="text-blue-500 w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800">清清乌托邦</span>
          </div>
          
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} 清清乌托邦. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all">
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-40 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors active:scale-95"
            aria-label="回到顶部"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-6 right-6 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={getImageUrl(selectedImage)}
                alt="Full preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute -bottom-16 left-0 right-0 text-center">
                <p className="text-white font-medium text-lg mb-1">
                  {selectedImage.public_id.split('/').pop()}
                </p>
                <p className="text-slate-400 text-sm">
                  {selectedImage.width} × {selectedImage.height} • {selectedImage.format.toUpperCase()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
