const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import cors
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000; // Use environment port if available
const saveFilePath = path.join(__dirname, './saves/pins.json');

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Function to read pins from the JSON file
const readPinsFromFile = () => {
  try {
    const data = fs.readFileSync(saveFilePath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading pins:', error);
    return [];
  }
};

// Function to write pins to the JSON file
const writePinsToFile = (pins) => {
  try {
    fs.writeFileSync(saveFilePath, JSON.stringify(pins, null, 2));
  } catch (error) {
    console.error('Error writing pins:', error);
  }
};

// Route to get all pins
app.get('/pins', (req, res) => {
  const pins = readPinsFromFile();
  res.json(pins);
});

// Route to add a new pin
app.post('/pins', (req, res) => {
  const pins = readPinsFromFile();
  const newPin = { ...req.body, id: pins.length }; // Assign an ID based on current length
  pins.push(newPin); // Add the new pin
  writePinsToFile(pins); // Save to file
  res.status(201).json(newPin); // Send back the created pin
});

// Route to update a pin's location by ID
app.put('/pins/:id', (req, res) => {
  const pinId = parseInt(req.params.id); // Get the pin ID from the URL
  let pins = readPinsFromFile();
  
  // Find the pin and update its location
  const pinIndex = pins.findIndex(pin => pin.id === pinId);
  if (pinIndex !== -1) {
    pins[pinIndex].lat = req.body.lat; // Update latitude
    pins[pinIndex].lng = req.body.lng; // Update longitude
    writePinsToFile(pins); // Save updated pins to file
    res.status(200).json(pins[pinIndex]); // Send back the updated pin
  } else {
    res.status(404).send('Pin not found'); // Handle case where pin does not exist
  }
});

// Route to delete a pin by ID
app.delete('/pins/:id', (req, res) => {
  const pinId = parseInt(req.params.id); // Get the pin ID from the URL
  let pins = readPinsFromFile();
  pins = pins.filter(pin => pin.id !== pinId); // Filter out the deleted pin
  writePinsToFile(pins); // Save updated pins to file
  res.status(204).send(); // Respond with no content
});

// Create server and Socket.io instance
const server = http.createServer(app);
const io = socketIo(server);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('newPin', (pinData) => {
    // Broadcast the new pin to all connected clients
    io.emit('newPin', pinData);
  });

  socket.on('deletePin', (pinId) => {
    // Broadcast the pin deletion to all connected clients
    io.emit('deletePin', pinId);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
