const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET); // Removed expiresIn
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, phoneNumber, password } = req.body;

  console.log("Signup attempt:", { name, email, phoneNumber }); // Debug log

  // Check if user with same email already exists
  const existingUserByEmail = await User.findOne({ email });
  console.log("Existing user by email:", existingUserByEmail); // Debug log
  
  if (existingUserByEmail) {
    console.log("Email already exists, returning error"); // Debug log
    return next(new AppError(`Email "${email}" is already registered. Please use a different email address.`, 400));
  }

  // Check if user with same phone number already exists
  const existingUserByPhone = await User.findOne({ phoneNumber });
  console.log("Existing user by phone:", existingUserByPhone); // Debug log
  
  if (existingUserByPhone) {
    console.log("Phone already exists, returning error"); // Debug log
    return next(new AppError(`Phone number "${phoneNumber}" is already registered. Please use a different phone number.`, 400));
  }

  // Check if there are any users in database
  const userCount = await User.countDocuments();

  // Determine if current user being added is the first user
  const isAdmin = userCount === 0;

  console.log("Creating new user..."); // Debug log
  
  try {
    const newUser = await User.create({
      name,
      email,
      phoneNumber,
      password,
      isAdmin,
    });
    createSendToken(newUser, 201, res);
  } catch (error) {
    console.log("User.create error:", error); // Debug log
    
    // Handle MongoDB duplicate key errors specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      
      let message;
      if (field === 'email') {
        message = `Email "${value}" is already registered. Please use a different email address.`;
      } else if (field === 'phoneNumber') {
        message = `Phone number "${value}" is already registered. Please use a different phone number.`;
      } else {
        message = `Duplicate ${field}: "${value}". Please use another value!`;
      }
      
      return next(new AppError(message, 400));
    }
    
    return next(error);
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  const correct = await user && await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        "The user belonging to this token no longer exists.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});
