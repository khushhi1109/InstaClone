import { useNavigate } from "react-router-dom";
import "./Home.css";


export default function Home() {
const navigate = useNavigate();


return (
<div className="landing">
<header className="landing-header">
<h1 className="landing-logo">Instagram</h1>
<div className="landing-actions">
<button className="btn-outline" onClick={() => navigate('/login')}>
Sign In
</button>
<button className="btn-primary" onClick={() => navigate('/signup')}>
Sign Up
</button>
</div>
</header>


<main className="landing-main">
<h2>Capture and Share the World’s Moments</h2>
<p>
Instagram is a simple, fun, and creative way to capture, edit, and share
photos, videos, and messages with friends and the world.
</p>


<div className="landing-features">
  <div className="feature">
    <h3>📸 Share Photos & Videos</h3>
    <p>Post your favorite moments and memories instantly.</p>
  </div>

  <div className="feature">
    <h3>💬 Connect with People</h3>
    <p>Follow friends, creators, and communities you love.</p>
  </div>

  <div className="feature">
    <h3>🔥 Discover New Content</h3>
    <p>Explore trending posts, reels, and stories worldwide.</p>
  </div>

 
  <div className="feature">
    <h3>🎥 Watch Reels</h3>
    <p>Enjoy short, entertaining videos from creators around the world.</p>
  </div>
</div>

</main>
</div>
);
}