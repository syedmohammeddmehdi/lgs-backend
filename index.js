



const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const multer = require('multer');

// Connect to the MongoDB database
mongoose.connect('mongodb+srv://sumar3115:1tBcmQF7IHz3mbA6@lgswebsite.om6meue.mongodb.net/Lgs?retryWrites=true&w=majority', {
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

  },
  phone: {
    type: String,
    required: true,
  },
  service: { // Add the service field to the schema
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);
// Schema for tracking website visits
const visitSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
  },
});

const Visit = mongoose.model('Visit', visitSchema);
//schema for form
const careerFormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  totalExp: {
    type: String,
    required: true,
  },
  careerGap: {
    type: String,
    required: true,
  },
  currentLocation: {
    type: String,
    required: true,
  },
  preferredLocation: {
    type: String,
    required: true,
  },
  reasonForJobChange: {
    type: String,
    required: true,
  },
  jobProfile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  relevantExp: {
    type: String,
    required: true,
  },
  currentCTC: {
    type: String,
    required: true,
  },
  expectedCTC: {
    type: String,
    required: true,
  },
  noticePeriod: {
    type: String,
    required: true,
  },
  resume: {
    type: String,
    required: true,
  },
});

const CareerForm = mongoose.model('CareerForm', careerFormSchema);

const adminEmail = '160419733122@mjcollege.ac.in'; // Replace with the admin's email address

// API for registration
app.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, service, message } = req.body;
    console.log(name, email, phone, service, message)
    if (!name || !email || !phone || !service || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (phone.length !== 10) {
      return res.status(400).json({ error: 'Phone and WhatsApp numbers must be 10 digits long' });
    }

    const newUser = new User({
      name,
      email,
      phone,
      service,
      message,
    });

    await newUser.save();

    // Send an email to the user
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ecommerceapp8@gmail.com',
        pass: 'cuesoyfbusquxakg',
      },
    });

    const userMailOptions = {
      from: 'ecommerceapp8@gmail.com',
      to: email,
      subject: 'Registration Confirmation',
      text: `Thank you for contacting us. You have selected the service: ${service}. We will get back to you soon.`,
    };

    transporter.sendMail(userMailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email to user:', error);
        // Continue to respond to the client even if there is an error with email sending
        res.json({ success: true });
      } else {
        console.log('Email sent to user:', info.response);
        // Send a response message
        res.json({ success: true });

        // Now, send an email to the admin with user details
        const adminMailOptions = {
          from: 'ecommerceapp8@gmail.com',
          to: adminEmail,
          subject: 'New User Registration',
          text: `A new user has registered with the following details:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\nMessage: ${message}`,
        };

        transporter.sendMail(adminMailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email to admin:', error);
          } else {
            console.log('Email sent to admin:', info.response);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Internal Server Error');
    // Pass the error to the error handling middleware
    next(error);
  }
});

// Set up the storage for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder where uploaded resumes will be stored
    cb(null, 'uploads/resumes');
  },
  filename: function (req, file, cb) {

    // You can use a unique name for the file or keep the original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

// Set up the multer middleware with the storage configuration
const upload = multer({ storage: storage });
// API for career form submission
app.post('/career-form', upload.single('resume'), async (req, res, next) => {
  try {

    // Extract the career form data from the request body
    const {
      name,
      phone,
      totalExp,
      careerGap,
      currentLocation,
      preferredLocation,
      reasonForJobChange,
      jobProfile,
      email,
      relevantExp,
      currentCTC,
      expectedCTC,
      noticePeriod,
    } = req.body;

    // Create a new career form instance using the Mongoose model
    const newCareerForm = new CareerForm({

      name,
      phone,
      totalExp,
      careerGap,
      currentLocation,
      preferredLocation,
      reasonForJobChange,
      jobProfile,
      email,
      relevantExp,
      currentCTC,
      expectedCTC,
      noticePeriod,
      resume: req.file.path, // Replace with the actual path to the uploaded resume file
    });

    // Save the career form to the database
    await newCareerForm.save();

    // Send confirmation emails to user and admin
    await sendConfirmationEmailToUser(newCareerForm);
    await sendConfirmationEmailToAdmin(newCareerForm, req.file.path);

    res.json({ success: true, message: 'Career form submitted successfully' });
  } catch (error) {
    console.error('Error submitting career form:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to send confirmation email to the user
const sendConfirmationEmailToUser = async (careerFormData) => {
  try {
    const { email } = careerFormData;

    // Create the transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ecommerceapp8@gmail.com',
        pass: 'cuesoyfbusquxakg',
      },
    });

    // Email options for the user
    const userMailOptions = {
      from: 'ecommerceapp8@gmail.com',
      to: email,
      subject: 'Career Form Submission Confirmation',
      text: `Thank you for submitting the career form. We have received your details and will get back to you soon.`,
    };


    // Send the email to the user
    const info = await transporter.sendMail(userMailOptions);
    console.log('Email sent to user:', info.response);
  } catch (error) {
    console.error('Error sending email to user:', error);
  }
};

// Function to send confirmation email to the admin (HR)
const sendConfirmationEmailToAdmin = async (careerFormData) => {
  try {
    const { name, email, phone, jobProfile, resume } = careerFormData;
    const adminEmail = '160419733122@mjcollege.ac.in'; // Replace with the admin's email address

    // Create the transporter for sending emails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ecommerceapp8@gmail.com',
        pass: 'cuesoyfbusquxakg',
      },
    });

    // Email options for the admin
    const adminMailOptions = {
      from: 'ecommerceapp8@gmail.com',
      to: adminEmail,
      subject: 'New Career Form Submission',
      text: `A new career form has been submitted with the following details:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nJob Profile: ${jobProfile}`,
      attachments: [
        {
          filename: 'resume.pdf', // Set the filename for the attachment
          path: resume, // Provide the path to the resume file
        },
      ],
    };

    // Send the email to the admin
    const info = await transporter.sendMail(adminMailOptions);
    console.log('Email sent to admin:', info.response);
  } catch (error) {
    console.error('Error sending email to admin:', error);
  }
};



// Endpoint to increment the website visit count
// Increment the visit count in the database and return the updated count
const incrementVisit = async () => {
  try {
    // Find the visit document in the database (there should only be one)
    const visitDoc = await Visit.findOne();

    // If the document doesn't exist, create one
    if (!visitDoc) {
      await Visit.create({ count: 1 });
      return 1;
    } else {
      // If the document exists, increment the count
      await Visit.updateOne({}, { $inc: { count: 1 } });
      return visitDoc.count + 1;
    }
  } catch (err) {
    console.error('Error incrementing visit count:', err);
    return 0;
  }
};

// Route to fetch the visit count
app.get('/api/visit-count', async (req, res) => {
  try {
    // Fetch the visit count from the database
    const visitDoc = await Visit.findOne();
    if (!visitDoc) {
      // If there's no visit count document, create one with the initial count as 0
      await Visit.create({ count: 0 });
      return res.json({ visitCount: 0 });
    }

    // Return the current visit count
    res.json({ visitCount: visitDoc.count });
  } catch (error) {
    console.error('Error fetching visit count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for the homepage ("/")
app.get('/', async (req, res) => {
  try {
    // Increment the visit count on every request to the home page
    const updatedVisitCount = await incrementVisit();
    res.json({ success: true, visitCount: updatedVisitCount });
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});
const port = process.env.PORT || 3005;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
