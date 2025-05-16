// index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Load environment variables
dotenv.config();

const app = express();
// Try multiple ports if one is in use
const PORTS = [8000, 8080, 3000, 5000];
let currentPortIndex = 0;

// Use MongoDB Atlas connection with database name
const MONGOURL = process.env.MONGO_URI;

// Handle ES module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Storage for in-memory form submissions when MongoDB is unavailable
let formSubmissions = [];

// Function to start server with error handling for port in use
const startServer = (port) => {
  const server = app
    .listen(port)
    .on("listening", () => {
      // Update the port in form-submit.js to match the actual port
      updateFormSubmitPort(port);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        currentPortIndex++;
        if (currentPortIndex < PORTS.length) {
          startServer(PORTS[currentPortIndex]);
        }
      }
    });
  return server;
};

// Function to update the port in form-submit.js
const updateFormSubmitPort = (port) => {
  try {
    const formSubmitFile = path.join(__dirname, "public", "form-submit.js");

    fs.readFile(formSubmitFile, "utf8", (err, data) => {
      if (err) {
        return;
      }

      // Replace the port in the fetch URL
      const updatedData = data.replace(
        /fetch\("http:\/\/localhost:\d+\/register"/,
        `fetch("http://localhost:${port}/register"`
      );

      fs.writeFile(formSubmitFile, updatedData, "utf8", (err) => {});
    });
  } catch (error) {}
};

// MongoDB connect with timeout and options
mongoose
  .connect(MONGOURL, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  })
  .then(() => {
    // Start server with the first port
    startServer(PORTS[currentPortIndex]);
  })
  .catch((error) => {
    // Start the server even if MongoDB connection fails, for testing the frontend
    startServer(PORTS[currentPortIndex]);
  });

// Schema
const eventSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  eventType: String,
  eventDate: Date,
  guestCount: String,
  specialRequests: String,
});

const Event = mongoose.model("Event", eventSchema);

// Register route
app.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      eventType,
      eventDate,
      guestCount,
      specialRequests,
    } = req.body;

    if (!firstName || !lastName || !email || !eventDate || !guestCount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newEvent = {
      firstName,
      lastName,
      email,
      phone: phone || "Not provided",
      eventType: eventType || "wedding",
      eventDate: new Date(eventDate),
      guestCount,
      specialRequests: specialRequests || "None",
      createdAt: new Date(),
    };

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Connected to MongoDB
      const eventDoc = new Event(newEvent);
      await eventDoc.save();
      res.status(201).json({
        success: true,
        message: "Event registration successful!",
        data: eventDoc,
      });
    } else {
      // Not connected, save in memory
      formSubmissions.push(newEvent);
      res.status(201).json({
        success: true,
        message: "Event registration stored temporarily!",
        data: newEvent,
        note: "Database connection unavailable. Data stored in memory only.",
      });
    }
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Error processing registration",
      error: err.message,
    });
  }
});
