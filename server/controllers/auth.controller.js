import bcrypt from "bcrypt";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.render("auth/register", { error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role });

    res.redirect("/login");
  } catch (err) {
    res.render("auth/register", { error: "Something went wrong" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).lean();
    if (!user) return res.render("auth/login", { error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.render("auth/login", { error: "Incorrect password" });
    req.session.user = {
      _id: user._id,
      name: user.name,
      role: user.role,
    };

    // Temporary logic: redirect based on role
    if (user.role === "teacher") {
      res.redirect("/dashboard/teacher");
    } else {
      res.redirect("/dashboard/student");
    }
  } catch (err) {
    res.render("auth/login", { error: "Login failed" });
  }
};
