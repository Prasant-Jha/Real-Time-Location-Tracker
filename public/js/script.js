const socket = io();

// Store the destination coordinates
let destination = null;

// Watch for geolocation changes
if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("send-location", { latitude, longitude });

        // If a destination is set, update the route
        if (destination) {
            updateRoute([latitude, longitude], destination);
        }
    }, (error) => {
        console.error(error);
    },
    {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}

// Initialize the map
const map = L.map("map").setView([0, 0], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Prasant"
}).addTo(map);

const markers = {};
const circle = {};
let routeControl; // To hold the routing control

// Handle incoming location data
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    map.setView([latitude, longitude], 16);

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]);
        circle[id] = L.circle([latitude, longitude], { radius: 20 });
        const featureGroup = L.featureGroup([markers[id], circle[id]]).addTo(map);
        map.fitBounds(featureGroup.getBounds());
    }
});

// Handle user disconnection
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});

// Function to update the route
function updateRoute(start, end) {
    // If a route already exists, remove it
    if (routeControl) {
        map.removeControl(routeControl);
    }

    // Create a new route
    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(start[0], start[1]),
            L.latLng(end[0], end[1])
        ],
        routeWhileDragging: true,
        show: true,
        fitSelectedRoutes: true,
        addWaypoints: false,

        lineOptions: {
            styles: [
                {
                    color: 'blue',
                    weight: 10,
                    opacity: 0.7
                }
            ]
        }
    }).addTo(map);
}

// Function to set the destination
function setDestination(latitude, longitude) {
    destination = [latitude, longitude];
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            updateRoute([latitude, longitude], destination);
        });
    }
}

// Function to search destination by name using Nominatim API
function searchLocationByName(placeName) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                setDestination(parseFloat(lat), parseFloat(lon));
            } else {
                alert("Location not found. Please try again.");
            }
        })
        .catch(error => {
            console.error("Error fetching location data:", error);
        });
}

// Event listener for the search button
document.getElementById("searchBtn").addEventListener("click", () => {
    const placeName = document.getElementById("place").value;
    if (placeName) {
        searchLocationByName(placeName);
    } else {
        alert("Please enter a valid place name.");
    }
});
