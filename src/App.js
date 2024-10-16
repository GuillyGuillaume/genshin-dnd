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
  const [pins, setPins] = useState([]);
  const selectedPinIconRef = useRef(pin1); // Use ref to avoid rerenders

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

    return map;
  };

  const createPinIcon = (iconUrl) => {
    return L.icon({
      iconUrl: iconUrl,
      iconSize: [100, 128],
      iconAnchor: [0, 128],
    });
  };

  const fetchExistingPins = (map) => {
    fetch('http://localhost:5000/pins')
      .then((response) => response.json())
      .then((existingPins) => {
        setPins(existingPins);
        existingPins.forEach((pinData) => {
          const pinIcon = createPinIcon(pinData.iconUrl || selectedPinIconRef.current);
          addPinToMap(pinData, map, pinIcon);
        });
      })
      .catch((error) => {
        console.error('Error fetching pins:', error);
      });
  };

  const addPinToMap = (pinData, map, pinIcon) => {
    const pin = L.marker([pinData.lat, pinData.lng], { icon: pinIcon, draggable: true });
    pin.addTo(map);
    pin.on('click', () => openDeletePopup(pinData.id, pin, map)); 
    pin.on('dragend', () => {
      const { lat, lng } = pin.getLatLng();
      updatePinLocation(pinData.id, lat, lng);
    });
  };

  const placePin = (e, map) => {
    const pinIcon = createPinIcon(selectedPinIconRef.current); // Use ref for pin icon
    const newPinData = { lat: e.latlng.lat, lng: e.latlng.lng, iconUrl: selectedPinIconRef.current };
    const newPin = L.marker(e.latlng, { icon: pinIcon, draggable: true });

    newPin.addTo(map);
    newPin.on('click', () => openDeletePopup(null, newPin, map));
    newPin.on('dragend', () => {
      const { lat, lng } = newPin.getLatLng();
      updatePinLocation(null, lat, lng);
    });

    setPins((prevPins) => [...prevPins, newPinData]);
    sendPinToServer(e.latlng.lat, e.latlng.lng, selectedPinIconRef.current, newPin, map);
  };

  const sendPinToServer = (lat, lng, iconUrl, newPin, map) => {
    fetch('http://localhost:5000/pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng, iconUrl }),
    })
      .then((response) => response.json())
      .then((data) => {
        const { id } = data;
        setPins((prevPins) =>
          prevPins.map((pin) =>
            pin.lat === lat && pin.lng === lng ? { ...pin, id } : pin
          )
        );
        newPin.on('click', () => openDeletePopup(id, newPin, map));
      })
      .catch((error) => {
        console.error('Error sending pin to server:', error);
      });
  };

  const deletePin = (pinId, pin, map) => {
    if (pinId !== null) {
      pin.remove();
      setPins((prevPins) => prevPins.filter((p) => p.id !== pinId));
      fetch(`http://localhost:5000/pins/${pinId}`, {
        method: 'DELETE',
      }).catch((error) => {
        console.error('Error deleting pin:', error);
      });
    } else {
      const pinLatLng = pin.getLatLng();
      pin.remove();
      setPins((prevPins) =>
        prevPins.filter(
          (p) => !(p.lat === pinLatLng.lat && p.lng === pinLatLng.lng)
        )
      );
    }
  };

  const updatePinLocation = (pinId, lat, lng) => {
    if (pinId !== null) {
      fetch(`http://localhost:5000/pins/${pinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      }).catch((error) => {
        console.error('Error updating pin location:', error);
      });
    }
  };

  const openDeletePopup = (pinId, pin, map) => {
    const popupContent = L.DomUtil.create('div', 'pin-popup');
    const deleteButton = L.DomUtil.create('button', '', popupContent);
    deleteButton.innerText = 'Delete Pin';

    const popup = L.popup({
      closeOnClick: false,
      autoClose: true,
      closeButton: true,
      offset: [0, -32],
    })
      .setLatLng(pin.getLatLng())
      .setContent(popupContent)
      .openOn(map);

    L.DomEvent.on(deleteButton, 'click', () => {
      deletePin(pinId, pin, map);
      map.closePopup(); // Close the popup after deletion
    });
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
      </div>
      <div id="map" className="map"></div>
    </div>
  );
}

export default App;
