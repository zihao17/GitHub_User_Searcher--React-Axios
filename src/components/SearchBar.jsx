import { useState, useRef, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // 清除防抖定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 验证输入是否合法
  const validateInput = (input) => {
    // 检查是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(input)) {
      return '用户名不能包含中文字符';
    }

    // 检查是否包含特殊字符（GitHub用户名规则：只允许字母、数字、连字符）
    if (!/^[a-zA-Z0-9-]*$/.test(input)) {
      return '用户名只能包含字母、数字和连字符(-)';
    }

    // 检查长度限制
    if (input.length > 39) {
      return '用户名长度不能超过39个字符';
    }

    return '';
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);

    // 实时验证输入
    if (newValue.trim()) {
      const validationError = validateInput(newValue);
      setError(validationError);
    } else {
      setError('');
    }
  };

  // 处理搜索逻辑*****
  const handleSearch = () => {
    // 如果输入框为空，则不进行搜索
    if (!query.trim()) return;

    // 验证输入
    const validationError = validateInput(query);
    if (validationError) {
      setError(validationError);
      return;
    }

    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;
    const minSearchInterval = 2000; // 最少2秒间隔

    // 设置搜索状态为正在搜索
    setIsSearching(true);

    if (timeSinceLastSearch < minSearchInterval) {
      // 如果距离上次搜索不足2秒，设置延迟, 并清除上一次的定时器
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const delay = minSearchInterval - timeSinceLastSearch;

      searchTimeoutRef.current = setTimeout(() => {
        onSearch(query);
        setLastSearchTime(Date.now());
        setIsSearching(false);
      }, delay);
    } else {
      // 直接搜索
      onSearch(query);
      setLastSearchTime(now);
      setIsSearching(false);
    }
  };

  // 处理按键事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar">
      <h1>GitHub用户搜索</h1>
      <div className="search-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="输入GitHub用户名..."
          className={`search-input ${error ? 'input-error' : ''}`}
          disabled={isSearching}
        />
        <button
          onClick={handleSearch}
          className="search-button"
          disabled={isSearching || !query.trim() || !!error}
        >
          {isSearching ? '搜索中...' : '搜索'}
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {isSearching && <p className="search-hint">请稍等，正在搜索中...</p>}
    </div>
  );
};

export default SearchBar;