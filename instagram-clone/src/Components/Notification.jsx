import { useEffect, useState } from "react";
import axios from "axios";
import "./Notification.css";

export default function Notification({ token }) {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="notif-dropdown">
      {notifications.length === 0 ? (
        <div className="notif-empty">No notifications</div>
      ) : (
        notifications.map((n) => (
          <div key={n._id} className={`notif-item ${n.read ? "read" : "unread"}`}>
            <b>{n.fromUser.username}</b>{" "}
            {n.type === "like" && n.post ? (
              <>
                liked your post
                {n.post.image && (
                  <img
                    src={n.post.image}
                    alt="post"
                    style={{
                      width: "30px",
                      height: "30px",
                      marginLeft: "5px",
                      borderRadius: "4px",
                    }}
                  />
                )}
              </>
            ) : n.type === "comment" && n.post ? (
              <>
                commented on your post: "{n.text}"
                {n.post.image && (
                  <img
                    src={n.post.image}
                    alt="post"
                    style={{
                      width: "30px",
                      height: "30px",
                      marginLeft: "5px",
                      borderRadius: "4px",
                    }}
                  />
                )}
              </>
            ) : n.type === "follow" ? (
              <>started following you</>
            ) : null}
            <span className="notif-time">
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
