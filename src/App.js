import { database } from './firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapImage from './img/map.jpeg';
// pins
import pin1 from './img/icons/guilly.png';
import pin2 from './img/icons/vivi.png';
import pin3 from './img/icons/jelly.png';
import pin4 from './img/icons/liz.png';
import pin5 from './img/icons/blank.png';
// pins
import './App.css';

function App() {
  const selectedPinIconRef = useRef(pin1); // Use ref to avoid rerenders
  const [selectedPin, setSelectedPin] = useState(null); // State for selected pin

  useEffect(() => {
    const map = initializeMap();
    fetchExistingPins(map);

    // Map click handler using ref instead of state
    map.on('click', (e) => placePin(e, map));

    return () => {
      map.remove();
    };
  }, []);

  const initializeMap = () => {
    const map = L.map('map', {
      center: [50, 100],
      zoom: 1,
      maxZoom: 10,
      minZoom: 5,
      attributionControl: false,
      maxBounds: [[0, 0], [100, 200]],
      maxBoundsVisibilty: true,
    });

    const bounds = [[0, 0], [100, 200]];
    L.imageOverlay(mapImage, bounds).addTo(map);
    map.fitBounds(bounds);

    map.whenReady(() => {
      fetchExistingPins(map);
    });

    return map;
  };

  const createPinIconWithCounter = (iconUrl, hp, sp, pinId) => {
    const pinWidth = 100;
    const pinHeight = 128;

    const svgIcon = 
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pinWidth}" height="${pinHeight}">
      <image href="${iconUrl}" width="${pinWidth}" height="${pinHeight}" />
      <text x="10" y="90" fill="green" stroke="black" stroke-width="0.5" font-size="16" font-weight="900">${hp}</text>
      <text x="10" y="110" fill="yellow" stroke="black" stroke-width="0.5" font-size="16" font-weight="900">${sp}</text>
    </svg>`;

    return L.divIcon({
      html: svgIcon,
      iconSize: [pinWidth, pinHeight],
      iconAnchor: [0, pinHeight],
      className: 'custom-div-icon',
    });
  };

  const fetchExistingPins = (map) => {
    const pinsRef = ref(database, 'pins');
    onValue(pinsRef, (snapshot) => {
      const existingPins = snapshot.val() || {};
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          layer.remove(); // Clear all markers on update
        }
      });
      Object.keys(existingPins).forEach((key) => {
        const pinData = { id: key, ...existingPins[key] };
        const pinIcon = createPinIconWithCounter(pinData.iconUrl || selectedPinIconRef.current, pinData.hp, pinData.sp, pinData.id);
        addPinToMap(pinData, map, pinIcon);
      });
    });
  };

  const addPinToMap = (pinData, map, pinIcon) => {
    const pin = L.marker([pinData.lat, pinData.lng], { icon: pinIcon, draggable: true });
    pin.addTo(map);

    pin.on('dragend', () => {
      const { lat, lng } = pin.getLatLng();
      updatePinLocation(pinData.id, lat, lng);
    });

    // Add click event to set selected pin
    pin.on('click', () => {
      setSelectedPin(pinData);
    });
  };

  const placePin = (e, map) => {
    const pinId = Date.now(); // Generate a unique ID for the new pin
    const newPinData = {
      id: pinId, // Add pinId to newPinData
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      iconUrl: selectedPinIconRef.current,
      hp: 0,
      sp: 0,
    };
  
    const pinIcon = createPinIconWithCounter(newPinData.iconUrl, newPinData.hp, newPinData.sp, pinId);
  
    const newPin = L.marker(e.latlng, { icon: pinIcon, draggable: true });
    newPin.addTo(map);
    
    newPin.on('dragend', () => {
      const { lat, lng } = newPin.getLatLng();
      updatePinLocation(null, lat, lng);
    });
  
    const newPinRef = ref(database, `pins/${pinId}`);
    set(newPinRef, newPinData)
      .then(() => {
        newPin.on('dragend', () => {
          const { lat, lng } = newPin.getLatLng();
          updatePinLocation(newPinRef.key, lat, lng);
        });
      })
      .catch((error) => {
        console.error('Error saving pin:', error);
      });
    
    // Set the newly created pin as the selected pin
    setSelectedPin(newPinData);
  };

  const updatePinLocation = (pinId, lat, lng) => {
    if (pinId !== null) {
      update(ref(database, `pins/${pinId}`), { lat, lng }).catch((error) => {
        console.error('Error updating pin location:', error);
      });
    }
  };

  const updatePinCounters = (pinId, hp, sp) => {
    if (pinId !== null) {
      update(ref(database, `pins/${pinId}`), { hp, sp }).catch((error) => {
        console.error('Error updating pin counters:', error);
      });
    }
  };

  const deletePin = (pinId, pin) => {
    // Remove the pin from Firebase
    remove(ref(database, `pins/${pinId}`))
      .then(() => {
        pin.remove(); // Remove the pin from the map
        setSelectedPin(null); // Clear selected pin
      })
      .catch((error) => {
        console.error('Error deleting pin:', error);
      });
  };

  // Handlers for the action buttons
  const handleIncrementHp = () => {
    if (selectedPin) {
      const newHp = selectedPin.hp + 1;
      updatePinCounters(selectedPin.id, newHp, selectedPin.sp);
      setSelectedPin({ ...selectedPin, hp: newHp }); // Update the selected pin state
    }
  };

  const handleDecrementHp = () => {
    if (selectedPin) {
      const newHp = Math.max(selectedPin.hp - 1, 0); // Prevent HP from going below 0
      updatePinCounters(selectedPin.id, newHp, selectedPin.sp);
      setSelectedPin({ ...selectedPin, hp: newHp }); // Update the selected pin state
    }
  };

  const handleIncrementSp = () => {
    if (selectedPin) {
      const newSp = selectedPin.sp + 1;
      updatePinCounters(selectedPin.id, selectedPin.hp, newSp);
      setSelectedPin({ ...selectedPin, sp: newSp }); // Update the selected pin state
    }
  };

  const handleDecrementSp = () => {
    if (selectedPin) {
      const newSp = Math.max(selectedPin.sp - 1, 0); // Prevent SP from going below 0
      updatePinCounters(selectedPin.id, selectedPin.hp, newSp);
      setSelectedPin({ ...selectedPin, sp: newSp }); // Update the selected pin state
    }
  };

  const handleDeletePin = () => {
    if (selectedPin) {
      deletePin(selectedPin.id);
    }
  };


  return (
    <div>
      <div className="pin-selector">
        <h3>Select Pin Type</h3>
        <button onClick={() => (selectedPinIconRef.current = pin1)}>
          <img src={pin1} alt="Pin Type 1" />
        </button>
        <button onClick={() => (selectedPinIconRef.current = pin2)}>
          <img src={pin2} alt="Pin Type 2" />
        </button>
        <button onClick={() => (selectedPinIconRef.current = pin3)}>
          <img src={pin3} alt="Pin Type 3" />
        </button>
        <button onClick={() => (selectedPinIconRef.current = pin4)}>
          <img src={pin4} alt="Pin Type 4" />
        </button>
        <button onClick={() => (selectedPinIconRef.current = pin5)}>
          <img src={pin5} alt="Pin Type 5" />
        </button>
        {selectedPin && (
          <div className="pin-actions">
            <h3>Selected Pin Actions</h3>
            <button onClick={handleDecrementHp}>-HP</button>
            <button onClick={handleIncrementHp}>+HP</button>

            <button onClick={handleDecrementSp}>-SP</button>
            <button onClick={handleIncrementSp}>+SP</button>

            <button onClick={handleDeletePin}>Delete</button>
          </div>
        )}
      </div>
      <div id="map" style={{ height: '100vh', width: '100%' }}></div>
    </div>
  );
}

export default App;
