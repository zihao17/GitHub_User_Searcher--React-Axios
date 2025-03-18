// githubService.js
import axios from 'axios';

// 创建axios实例
const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
});

// 添加请求拦截器，设置认证token
githubApi.interceptors.request.use(config => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }
  return config;
});

// 简单的内存缓存实现
const cache = {
  data: new Map(),
  ttl: 5 * 60 * 1000, // 缓存有效期5分钟

  get(key) {
    const item = this.data.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.data.delete(key);
      return null;
    }

    return item.value;
  },

  set(key, value) {
    const expiry = Date.now() + this.ttl;
    this.data.set(key, { value, expiry });
  },

  clear() {
    this.data.clear();
  }
};

// 控制并发请求数量
class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.queue = [];
    this.runningCount = 0;
  }

  add(promiseFactory) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        promiseFactory,
        resolve,
        reject
      });

      this.runNext();
    });
  }

  runNext() {
    if (this.runningCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.runningCount++;
    const { promiseFactory, resolve, reject } = this.queue.shift();

    promiseFactory()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.runningCount--;
        this.runNext();
      });
  }
}

// 创建请求队列实例
const requestQueue = new RequestQueue(5);

/**
 * 搜索GitHub用户
 * @param {string} query - 搜索关键词
 * @param {number} perPage - 每页结果数量，默认30
 * @param {number} page - 页码，默认1
 * @returns {Promise} - 返回搜索结果Promise
 */
export const searchUsers = async (query, perPage = 30, page = 1) => {
  try {
    // 生成缓存键
    const cacheKey = `search:${query}:${perPage}:${page}`;

    // 检查缓存
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      console.log('从缓存获取数据:', cacheKey);
      return cachedResult;
    }

    // 发起搜索请求
    const response = await githubApi.get('/search/users', {
      params: {
        q: query,
        per_page: perPage,
        page: page
      }
    });

    const users = response.data.items;

    // 使用请求队列控制并发获取用户详情
    const detailedUserPromises = users.map(user =>
      requestQueue.add(() => {
        // 为单个用户详情创建缓存键
        const userCacheKey = `user:${user.login}`;
        const cachedUser = cache.get(userCacheKey);

        if (cachedUser) {
          return Promise.resolve({ ...user, ...cachedUser });
        }

        return githubApi.get(`/users/${user.login}`)
          .then(userDetails => {
            // 缓存用户详情
            cache.set(userCacheKey, userDetails.data);
            return { ...user, ...userDetails.data };
          })
          .catch(error => {
            console.error(`获取用户 ${user.login} 详情失败:`, error);
            return user;
          });
      })
    );

    const detailedUsers = await Promise.all(detailedUserPromises);

    const result = {
      users: detailedUsers,
      totalCount: response.data.total_count
    };

    // 缓存搜索结果
    cache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('搜索用户失败:', error);

    // 处理API限制错误
    if (error.response && error.response.status === 403) {
      throw new Error('GitHub API 请求次数超限，请稍后再试或添加个人访问令牌');
    }

    throw error;
  }
};

// 清除缓存的方法
export const clearCache = () => {
  cache.clear();
};

export default {
  searchUsers,
  clearCache
};