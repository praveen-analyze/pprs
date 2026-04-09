# Municipal Board - Project Documentation

This comprehensive document serves as the technical explanation of the **Online Complaints Registration and Management System** (Municipal Board). It is divided into 15 logical sections (pages) that explore the system from its architectural foundations to its code-level implementation.

---

## Page 1: Project Overview & Objectives

### The Core Problem
In many developing and developed municipalities, citizens face a significant barrier when attempting to report infrastructure problems such as broken streetlights, potholes, water leaks, or uncollected garbage. The traditional systems are paper-heavy, siloed, and lack an automated feedback loop to the citizen reporting the issue.

### The Solution
The Municipal Board project is a digital-first, full-stack web application aimed at streamlining this process. It acts as a bridge between citizens and government officials. 

### Key Objectives:
1. **Accessibility:** Provide a frictionless, mobile-responsive web form for citizens to report issues.
2. **Transparency:** Implement real-time tracking IDs and automated email updates so citizens know their complaints are being handled.
3. **Efficiency for Admins:** Provide city managers with an interactive dashboard, complete with geographical heatmaps and departmental analytics, allowing for data-driven resource allocation.
4. **AI-Assistance:** Integrate an LLM (Large Language Model) to help users navigate the platform and reduce human support overhead.

---

## Page 2: System Architecture & Technologies

The application utilizes the **MERN** stack (MongoDB, Express.js, React.js, Node.js), chosen for its isomorphic JavaScript nature (using the same language across the entire stack) and high scalability.

### The Technology Stack:
- **Frontend (Client):** 
  - React 18, built with Vite for ultrafast Hot Module Replacement (HMR).
  - Tailwind CSS for rapid, utility-first styling.
  - React-Leaflet for rendering interactive vector maps.
  - Recharts for rendering admin analytic dashboards.
- **Backend (Server):** 
  - Node.js runtime executing the Express.js framework.
  - Mongoose ORM for structured interaction with MongoDB.
- **Database:** MongoDB Atlas, a cloud-hosted NoSQL database ideal for flexible document storage (e.g., storing a variable number of images per complaint).
- **Third-Party Services:**
  - **Cloudinary:** For processing and storing high-resolution complaint images safely off-server.
  - **Google Gemini 1.5 Flash:** Powers the natural language chatbot.
  - **Nodemailer:** Handles SMTP communication for system alerts.

---

## Page 3: Database Design & Schema Models

MongoDB was selected because its document-based structure maps perfectly to complex state changes in an application. Instead of resolving multiple SQL table joins to find the history of a complaint, we use Embedded Documents.

### Complaint Schema (`server/models/Complaint.js`)
We nest a `StatusLogSchema` directly inside the main `ComplaintSchema` array.

```javascript
const mongoose = require('mongoose');

// Embedded Schema for Audit Trail
const StatusLogSchema = new mongoose.Schema({
  oldStatus : String,
  newStatus : String,
  changedBy : String, // System or Admin Name
  note      : String,
  changedAt : { type: Date, default: Date.now },
}, { _id: false });

// Main Schema
const ComplaintSchema = new mongoose.Schema({
  complaintNo   : { type: String, required: true, unique: true },
  category      : { type: String, enum: ['Road','Garbage','Drainage','Water','Other'] },
  description   : { type: String, required: true, minlength: 20 },
  status        : { type: String, default: 'submitted' },
  latitude      : { type: Number, required: true },
  longitude     : { type: Number, required: true },
  images        : [{ imageUrl: String, publicId: String }],
  statusLogs    : [StatusLogSchema], // The embedded array
  reporterEmail : { type: String }
}, { timestamps: true });

// Optimizing database queries for the tracking system
ComplaintSchema.index({ complaintNo: 1 });
ComplaintSchema.index({ status: 1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
```

---

## Page 4: Backend Integration Setup

The backend serves as the stateless coordinator of the application. The entry point (`index.js`) configures middleware and connections before listening for HTTP requests.

### Core Server Configuration (`server/index.js`)
```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Permits cross-origin requests from the React frontend
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Route Registration
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Page 5: API Design & Routing Structure

The project follows a strict RESTful architecture. Controllers contain the business logic, while Routes simply map HTTP verbs (`GET`, `POST`, `PUT`) to those controllers.

### Example: Complaint Routes (`server/routes/complaintRoutes.js`)
We use `multer` to intercept multipart form data (images) before handing it to the controller.

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer to hold files in memory buffer, NOT on disk
const upload = multer({ storage: multer.memoryStorage() }); 

const { submitComplaint, trackComplaint, getCategories } = require('../controllers/complaintController');

router.get('/categories', getCategories);
router.post('/submit', upload.array('images', 3), submitComplaint);
router.get('/track/:complaintNo', trackComplaint);

module.exports = router;
```

---

## Page 6: Security: Authentication & Authorization

The admin dashboard contains sensitive city data. We secure this using JSON Web Tokens (JWT) for stateless authentication and `bcryptjs` for password hashing.

### Authentication Logic (`server/controllers/adminController.js`)
```javascript
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function generateToken(admin) {
  // Signs a token with admin ID and Role, valid for 8 hours
  return jwt.sign(
    { id: admin._id, role: admin.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '8h' }
  );
}

async function login(req, res) {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  
  // Bcrypt compares the plain text to the stored hash
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
  
  res.json({ token: generateToken(admin), admin });
}
```

---

## Page 7: Media Handling Optimizations

Handling image uploads on a Node server is dangerous if done locally (risk of running out of disk space). We implement a "Buffer-to-Stream" pipeline to push images directly to Cloudinary.

### Cloudinary Pipeline (`server/utils/cloudinary.js`)
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(buffer, folder = 'municipal-complaints') {
  return new Promise((resolve, reject) => {
    // Note: We use upload_stream, not upload()
    const stream = cloudinary.uploader.upload_stream(
      { 
        folder, 
        transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto:good' }] 
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );
    // Push the raw buffer into the stream
    stream.end(buffer);
  });
}
```

---

## Page 8: Frontend Architecture & Setup

The client is a Single Page Application (SPA). We utilize `react-router-dom` to shift views instantly without requesting new HTML documents from the server.

### Application Routing (`client/src/App.jsx`)
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ReportForm from './pages/ReportForm';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute'; // JWT Validator

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportForm />} />
        <Route path="/track/:no" element={<TrackComplaint />} />
        
        {/* Admin Routes wrapped in a security component */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Page 9: Multi-Step Reporting Form

The reporting system is a large, complex form. Instead of overwhelming the user, we break it into logical steps using React State.

### Multi-Step State Management
```jsx
import { useState } from 'react';

export default function ReportForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '', description: '', latitude: null, longitude: null, images: []
  });

  const nextStep = () => setStep(prev => prev + 1);

  return (
    <div>
      {/* Conditional rendering based on `step` variable */}
      {step === 1 && <CategorySelect data={formData} set={setFormData} next={nextStep}/>}
      {step === 2 && <LocationPicker data={formData} set={setFormData} next={nextStep}/>}
      {step === 3 && <ReviewSubmit data={formData} submit={handleSubmit}/>}
    </div>
  );
}
```

---

## Page 10: Mapping and Location Intelligence

Capturing accurate geographic data is central to the platform. We utilize `react-leaflet` to display interactive maps where citizens can drop a pin to report a problem.

### The Map Component
```jsx
// Simplified Leaflet integration
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function LocationMarker({ position, setPosition }) {
  // Listen for clicks on the map canvas
  useMapEvents({
    click(e) {
      setPosition(e.latlng); // Set the React state to the clicked coordinate
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// In the main render:
<MapContainer center={[51.505, -0.09]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <LocationMarker position={pinPos} setPosition={setPinPos} />
</MapContainer>
```

---

## Page 11: AI Integration (Google Gemini)

To provide 24/7 support, we integrated Google's Generative AI. We implement a dual-logic system: an exact Regular Expression match for reliable database tracking, falling back to the LLM for natural conversation.

### Chat Controller (`server/controllers/chatController.js`)
```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const handleChat = async (req, res) => {
    const msg = req.body.message;

    // Fast-path: Regex extraction for complaint IDs
    const docMatch = msg.match(/MUN-\d{4}-\d{5}/i);
    if (docMatch) {
       // Perform direct DB lookup bypassing the AI entirely for speed/accuracy.
       return fetchComplaintAndReturn(docMatch[0]);
    }

    // LLM-path: Use Gemini to interpret user intent
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are "Municipal Buddy". Help citizens navigate to /report or /track.`;
    
    const result = await model.generateContent(`${prompt}\nUser: ${msg}`);
    res.json({ response: result.response.text() });
};
```

---

## Page 12: Admin Dashboard & Analytics

The backend utilizes MongoDB's powerful Aggregation pipeline to crunch numbers on the server side, returning clean JSON arrays for the frontend Recharts visualizations to display.

### Aggregation Example
```javascript
// Server-side crunching of Category Totals
const categoryStats = await Complaint.aggregate([
  { $match: { status: { $ne: 'rejected' } } }, // Filter out junk data
  { $group: { _id: '$category', count: { $sum: 1 } } }, // Group by Category enum
  { $sort: { count: -1 } } // Sort largest to smallest
]);
// Returns: [{ _id: 'Road', count: 45 }, { _id: 'Water', count: 12 }]
```

---

## Page 13: Event-Driven Email Notifications

Transparency is achieved by hooking into the complaint update lifecycle. When an admin updates a status, Nodemailer constructs an HTML template and dispatches it via SMTP to the citizen.

### Mailer Utility (`server/utils/mailer.js`)
```javascript
const nodemailer = require('nodemailer');

async function sendStatusUpdateEmail({ to, complaintNo, status }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const htmlBody = `
    <h2>Municipal Alert</h2>
    <p>Your tracking number: <strong>${complaintNo}</strong></p>
    <p>The status is now: <span style="color:blue;">${status}</span></p>
  `;

  await transporter.sendMail({
    from: '"Municipal Board" <no-reply@municipal.gov>',
    to: to,
    subject: `Update on ${complaintNo}`,
    html: htmlBody
  });
}
```

---

## Page 14: Build & Deployment Strategy

For production, the client and server represent two distinct environments that must coordinate. 

1. **Frontend Build:** We run `vite build` which compiles the React JSX and Tailwind into a highly optimized, minified bundle of vanilla JS and CSS in the `dist/` directory.
2. **Backend Config:** The Node.js API must be configured to accept requests from the deployed URL via CORS headers, rather than `localhost:5173`.
3. **Environment Isolation:** Secrets like `JWT_SECRET`, Database URIs, and SMTP credentials are left out of Git repositories and injected securely at runtime via platform variables (e.g., Render, Vercel, or AWS).

---

## Page 15: Conclusion & Future Architectural Scope

The Municipal Board project successfully demonstrates how combining robust traditional web architecture (MERN REST APIs) with Next-Gen Artificial Intelligence (Gemini LLM) can solve systemic civic issues. 

### Future Technical Roadmap:
- **Redis Caching:** Implement a key-value memory store to cache global complaint statistics, reducing load on the MongoDB cluster.
- **Message Queues:** Migrate the Nodemailer dispatch to a background worker queue (like RabbitMQ or BullMQ) to prevent API latency during high-volume email blasts.
- **AI Triage:** Pass the Cloudinary image URL to the Gemini Pro Vision model to automatically confirm if a user-selected category (e.g., "Road") actually matches the image content, reducing false submissions.

---
*End of Documentation*
