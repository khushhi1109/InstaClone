import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Post from "./models/Post.js";       

import Comment from "./models/Comment.js"; 

import multer from "multer";
import Notification from "./models/Notification.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

app.get("/notifications", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ toUser: req.userId })
      .populate("fromUser", "username profilePic")
      .populate({
        path: "post",
        select: "image",
      })
      .sort({ createdAt: -1 })
      .limit(20); 

    res.json(notifications);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

app.post("/signup", async (req, res) => {
  try {
    console.log(req.body); 

    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, username, email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error signing up", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

app.post("/posts", protect, upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const imagePath = `http://localhost:5000/uploads/${req.file.filename}`;

    const post = await Post.create({
      user: req.userId,
      image: imagePath,
      caption,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err); 

    res.status(500).json({ message: "Error creating post", error: err.message });
  }
});

app.use("/uploads", express.static("uploads"));

app.get("/posts", protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePic followers")
      .populate("likes", "username")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profilePic" },
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", error: err.message });
  }
});

app.post("/posts/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.userId;
    const alreadyLiked = post.likes.some((id) => id.equals(userId));

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => !id.equals(userId));
    } else {
      post.likes.push(userId);

      if (userId !== post.user.toString()) {
        await Notification.create({
          type: "like",
          post: post._id,
          fromUser: userId,
          toUser: post.user,
        });
      }
    }

    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate("user", "username profilePic followers")
      .populate("likes", "username")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profilePic" },
      });

    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: "Error liking post", error: err.message });
  }
});

app.post("/posts/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: post._id,
      user: req.userId,
      text,
    });

    post.comments.push(comment._id);
    await post.save();

    await comment.populate("user", "username profilePic");

    if (req.userId !== post.user.toString()) {
      await Notification.create({
        type: "comment",
        post: post._id,
        fromUser: req.userId,
        toUser: post.user,
        text,
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment", error: err.message });
  }
});

app.post("/users/:id/follow", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const target = await User.findById(req.params.id);

    if (!user || !target)
      return res.status(404).json({ message: "User not found" });

    const isFollowing = user.following.includes(target._id);

    if (isFollowing) {
      user.following.pull(target._id);
      target.followers.pull(req.userId);
    } else {
      user.following.push(target._id);
      target.followers.push(req.userId);

      await Notification.create({
        type: "follow",
        fromUser: req.userId,
        toUser: target._id,
      });
    }

    await user.save();
    await target.save();

    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: "Follow error", error: err.message });
  }
});

app.get("/users/search", protect, async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ message: "Query is required" });

  try {

    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("username profilePic followers"); 

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error searching users", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

