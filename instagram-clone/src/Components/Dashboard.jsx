import { useState, useEffect } from "react";
import axios from "axios";
import Notification from "./Notification";
import "./Dashboard.css";

export default function Dashboard() {
  const [showUpload, setShowUpload] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const fetchPosts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  const handleUpload = async () => {
    if (!imageFile) return alert("Please select an image");
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("caption", caption);

      await axios.post("http://localhost:5000/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setImageFile(null);
      setCaption("");
      setShowUpload(false);
      fetchPosts();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "/login"; 

};

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? res.data : p))
      );
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/users/${targetUserId}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const isNowFollowing = res.data.following;

      setPosts((prev) =>
        prev.map((post) => {
          if (post.user._id === targetUserId) {
            const followers = post.user.followers.map((f) =>
              f._id ? f._id.toString() : f.toString()
            );
            const updatedFollowers = isNowFollowing
              ? [...new Set([...followers, userId])]
              : followers.filter((id) => id !== userId);

            return {
              ...post,
              user: {
                ...post.user,
                followers: updatedFollowers,
              },
            };
          }
          return post;
        })
      );

      setSearchResults((prev) =>
        prev.map((user) => {
          if (user._id === targetUserId) {
            const followers = user.followers.map((f) =>
              f._id ? f._id.toString() : f.toString()
            );
            const updatedFollowers = isNowFollowing
              ? [...new Set([...followers, userId])]
              : followers.filter((id) => id !== userId);

            return { ...user, followers: updatedFollowers };
          }
          return user;
        })
      );
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text) return;

    try {
      const res = await axios.post(
        `http://localhost:5000/posts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: [...(p.comments || []), res.data],
              }
            : p
        )
      );

      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(
        `http://localhost:5000/users/search?query=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  return (
    <div className="dashboard">
      {}
      <header className="dash-header">
        <h1 className="dash-logo">Instagram</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((user) => {
                const followers = user.followers?.map((f) =>
                  f._id ? f._id.toString() : f.toString()
                ) || [];
                const isFollowing = followers.includes(userId);

                return (
                  <div key={user._id} className="search-item">
                    <span>{user.username}</span>
                    {user._id !== userId && (
                      <button
                        className={`follow-btn ${isFollowing ? "following" : ""}`}
                        onClick={() => handleFollow(user._id)}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="dash-actions">
          <button className="bbtn">🏠</button>
          <button className="bbtn" onClick={() => setShowUpload(true)}>➕</button>
          <button className="bbtn" onClick={() => setShowNotifications(!showNotifications)}>❤️</button>
          <button className="bbtn" onClick={handleLogout}>Logout</button>

        </div>
      </header>

      {}
      {showNotifications && <Notification token={token} />}

      {}
      <main className="dash-feed">
        {posts.map((post) => {
          const isLiked = post.likes.some(
            (like) => like._id === userId || like === userId
          );

          const followers = post.user?.followers?.map((f) =>
            f._id ? f._id.toString() : f.toString()
          ) || [];
          const isFollowing = followers.includes(userId);

          return (
            <div className="dash-post" key={post._id}>
              <div className="post-header">
                <div className="post-user">
                  <div className="avatar"></div>
                  <span>{post.user.username}</span>
                </div>

                {post.user?._id !== userId && (
                  <button
                    className={`follow-btn ${isFollowing ? "following" : ""}`}
                    onClick={() => handleFollow(post.user._id)}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>

              <div
                className="post-image"
                style={{ backgroundImage: `url(${post.image})` }}
              />

              <div className="post-actions">
                <button
                  className={`like-btn ${isLiked ? "liked" : ""}`}
                  onClick={() => handleLike(post._id)}
                >
                  {isLiked ? "❤️" : "🤍"} {post.likes.length}
                </button>

                <button
                  className="comment-icon-btn"
                  onClick={() =>
                    setShowComments((prev) => ({
                      ...prev,
                      [post._id]: !prev[post._id],
                    }))
                  }
                >
                  💬
                </button>
              </div>

              <div className="post-caption">
                <b>{post.user.username}</b> {post.caption}
              </div>

              {showComments[post._id] && (
                <>
                  <div className="post-comments">
                    {(post.comments || []).map((c) => (
                      <div key={c._id} className="comment">
                        <b>{c.user.username}</b> {c.text}
                      </div>
                    ))}
                  </div>

                  <div className="comment-input">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText[post._id] || ""}
                      onChange={(e) =>
                        setCommentText((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                    />
                    <button onClick={() => handleComment(post._id)}>Post</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </main>

      {}
      {showUpload && (
        <div className="upload-modal">
          <div className="upload-box">
            <h2>Create Post</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            <input
              type="text"
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="upload-actions">
              <button onClick={handleUpload} className="btn-primary">
                Upload
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

