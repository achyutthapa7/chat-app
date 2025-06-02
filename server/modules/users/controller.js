import jwt from "jsonwebtoken";
import { userModel } from "./model.js";
export const register = async (req, res) => {
  try {
    const { username } = req.body;
    const usernameExist = await userModel.findOne({ username });
    if (usernameExist)
      return res
        .status(400)
        .json({ message: "user with this username already exist" });

    const newUser = new userModel({
      username,
      password: "",
    });
    await newUser.save();
    return res.status(201).json({
      success: true,
      data: username,
      message: "user is created successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

export const createPassword = async (req, res) => {
  try {
    const { username } = req.params;
    const { password, confirmPassword } = req.body;

    if (!username) return res.status(404).json("user not found");
    if (!password || !confirmPassword)
      return res.status(400).json("missing required field");
    if (password !== confirmPassword)
      return res.status(402).json("password and confirm password must match");
    if (password.length < 8)
      return res
        .status(403)
        .json("Password length should not be less that 8 character long");
    const updatedUser = await userModel.findOneAndUpdate(
      { username },
      {
        $set: {
          password,
        },
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: updatedUser.username,
      message: "password created successfully",
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const existingUser = await userModel.findOne({ username });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existingUser.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: existingUser._id }, "mysecretkey", {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 3600000,
    });

    return res.status(200).json({
      success: true,
      data: existingUser.username,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const { id } = req.user;

    const me = await userModel.findById(id).populate({
      path: "conversations",
      populate: {
        path: "messages",
      },
    });
    return res.status(200).json({ success: true, data: me, message: null });
  } catch (error) {}
};

export const getUsers = async (req, res) => {
  try {
    const { id } = req.user;

    const users = await userModel
      .find({ _id: { $ne: id } })
      .populate({
        path: "conversations",
        populate: {
          path: "messages",
        },
      })
      .select("-password");
    return res.status(200).json({ success: true, data: users, message: null });
  } catch (error) {}
};
