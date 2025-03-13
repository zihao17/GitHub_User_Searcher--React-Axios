import { useState } from 'react';
import './UserList.css';


const UserList = ({ users, loading, error }) => {
  const [hoveredUser, setHoveredUser] = useState(null);

  if (loading) {
    return (
      <div className="user-list-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-list-container">
        <div className="error-message">
          <h3>出错了！</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="user-list-container">
        <div className="no-results">
          <h3>没有找到用户</h3>
          <p>请尝试其他搜索关键词</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <h2>搜索结果</h2>
      <div className="user-list">
        {users.map((user) => (
          <div
            key={user.id}
            className="user-card"
            onMouseEnter={() => setHoveredUser(user.id)}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <div className="user-avatar">
              <img src={user.avatar_url} alt={`${user.login}的头像`} />
            </div>
            <div className="user-info">
              <h3>{user.login}</h3>
              <p>ID: {user.id}</p>
              {user.name && <p>姓名: {user.name}</p>}
            </div>
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`profile-button ${hoveredUser === user.id ? 'hovered' : ''}`}
            >
              查看主页
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;