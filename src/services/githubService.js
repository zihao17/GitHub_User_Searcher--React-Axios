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

/**
 * 搜索GitHub用户
 * @param {string} query - 搜索关键词
 * @param {number} perPage - 每页结果数量，默认30
 * @param {number} page - 页码，默认1
 * @returns {Promise} - 返回搜索结果Promise
 */
export const searchUsers = async (query, perPage = 30, page = 1) => {
  try {
    const response = await githubApi.get('/search/users', {
      params: {
        q: query,
        per_page: perPage,
        page: page
      }
    });

    // 获取用户详细信息
    const users = response.data.items;
    const detailedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          const userDetails = await githubApi.get(`/users/${user.login}`);
          return { ...user, ...userDetails.data };
        } catch (error) {
          console.error(`获取用户 ${user.login} 详情失败:`, error);
          return user;
        }
      })
    );

    return {
      users: detailedUsers,
      totalCount: response.data.total_count
    };
  } catch (error) {
    console.error('搜索用户失败:', error);

    // 处理API限制错误
    if (error.response && error.response.status === 403) {
      throw new Error('GitHub API 请求次数超限，请稍后再试或添加个人访问令牌');
    }

    throw error;
  }
};

export default {
  searchUsers
};