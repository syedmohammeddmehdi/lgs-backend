
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const express = require('express');
const app = express();
const port = 3005;
const bodyParser = require('body-parser');
const cors = require('cors');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Connect to the MongoDB database
mongoose.connect('mongodb://localhost:27017/lgs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });

// Schema for registration
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);

// API for registration
app.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, address, message } = req.body;
    if (!name || !email || !phone || !address || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if a user with the provided email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const newUser = new User({
      name,
      email,
      phone,
      address,
      message,
    });

    await newUser.save();

    // Send an email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ecommerceapp8@gmail.com',
        pass: 'cuesoyfbusquxakg',
      },
    });

    const mailOptions = {
      from: 'ecommerceapp8@gmail.com',
      to: email,
      subject: 'Registration Confirmation',
      text: 'Thank you for contacting us. We will get back to you soon.',
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        // Continue to respond to the client even if there is an error with email sending
        res.json({ success: true });
      } else {
        console.log('Email sent:', info.response);
        // Send a response message
        res.json({ success: true });
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
    // Pass the error to the error handling middleware
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
