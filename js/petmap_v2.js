// App Logic for PetMap

document.addEventListener('DOMContentLoaded', () => {
    // Toast Notification System
    const showToast = (message, type = 'info') => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span> ${message}`;
        container.appendChild(toast);

        // Remove from DOM after animation
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 5000);
    };

    // Smooth scroll for nav links
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Check Login State
    // UPDATED: Use sessionStorage for proper multi-tab isolation
    const userRole = sessionStorage.getItem('userRole');
    // UPDATED: Get full user object
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    const nav = document.querySelector('nav');
    const headerLeftGroup = document.querySelector('.header-left-group');

    if (userRole && headerLeftGroup) {
        // 1. Try to find and remove login button (if it exists)
        if (nav) {
            const loginBtn = nav.querySelector('a[href="login.html"]');
            if (loginBtn) loginBtn.remove();
        }

        // 2. Create and Append Badge (only if not already there)
        if (!document.querySelector('.user-profile-badge')) {
            const badge = document.createElement('div');
            badge.className = 'user-profile-badge';

            const roleLabels = {
                veteriner: 'Veteriner',
                hayvansever: 'Hayvansever',
                sahip: 'Hayvan Sahibi',
                barinak: 'Barınak'
            };

            const roleAvatars = {
                veteriner: '👨‍⚕️',
                hayvansever: '💙',
                sahip: '🏠',
                barinak: '🏢'
            };

            const avatar = roleAvatars[userRole] || '👤';
            const name = currentUser.name || currentUser.email.split('@')[0] || 'Kullanıcı';
            const roleLabel = roleLabels[userRole] || 'Üye';

            badge.innerHTML = `
                <div class="profile-avatar">${avatar}</div>
                <div class="profile-info">
                    <span class="profile-name">${name}</span>
                    <span class="profile-role">${roleLabel}</span>
                </div>
                <button onclick="logout()" class="btn-logout" title="Çıkış Yap">Çıkış</button>
            `;

            headerLeftGroup.prepend(badge);
        }
    }

    // Expose Logout
    window.logout = () => {
        sessionStorage.removeItem('userRole'); // UPDATED
        sessionStorage.removeItem('currentUser');
        window.location.reload();
    };

    // Pet Data
    const pets = {
        boncuk: {
            name: "Boncuk",
            type: "cat",
            lat: 40.982989,
            lng: 29.027987,
            startLat: 40.982989,
            startLng: 29.027987,
            icon: '🐈',
            distance: 0,
            risk: 0,
            routeIndex: 0,
            // Route: Heading East (Moda -> Fenerbahce direction) avoiding sea
            route: [
                { lat: 40.982989, lng: 29.027987 }, // Start
                { lat: 40.983500, lng: 29.029000 },
                { lat: 40.984000, lng: 29.031000 },
                { lat: 40.984500, lng: 29.033000 },
                { lat: 40.985000, lng: 29.035000 }, // Near Yoğurtçu Parkı
                { lat: 40.985500, lng: 29.038000 },
                { lat: 40.986000, lng: 29.041000 }, // Fenerbahçe Stadı
                { lat: 40.986500, lng: 29.044000 },
                { lat: 40.987000, lng: 29.047000 },
                { lat: 40.987500, lng: 29.050000 } // Kalamış
            ]
        },
        kahve: {
            name: "Kahve",
            type: "dog",
            lat: 40.985000,
            lng: 29.025000,
            startLat: 40.985000,
            startLng: 29.025000,
            icon: '🐕',
            distance: 0,
            risk: 0,
            routeIndex: 0,
            // Route: Heading North (Moda -> Rihtim/Kadikoy Center)
            route: [
                { lat: 40.985000, lng: 29.025000 }, // Start
                { lat: 40.986000, lng: 29.025000 },
                { lat: 40.987000, lng: 29.025000 },
                { lat: 40.988000, lng: 29.025500 },
                { lat: 40.989000, lng: 29.026000 },
                { lat: 40.990000, lng: 29.026500 }, // Rihtim
                { lat: 40.991000, lng: 29.027000 },
                { lat: 40.992000, lng: 29.027500 }
            ]
        }
    };

    let activePetId = 'boncuk';
    let simulationInterval;
    let lastRiskState = 'normal'; // tracks: normal, warning, critical

    // Map Elements (Panel)
    const distanceVal = document.getElementById('distance-val');
    const mapRiskScore = document.getElementById('map-risk-score');
    const actionTitle = document.getElementById('action-title');
    const actionDesc = document.getElementById('action-desc');
    const petSelect = document.getElementById('pet-select');
    const findBtn = document.getElementById('find-btn');
    const overlay = document.getElementById('warning-overlay');
    const overlayMsg = document.getElementById('overlay-msg');
    const closeOverlayBtn = document.getElementById('close-overlay-btn');

    // --- LEAFLET MAP SETUP ---
    const map = L.map('city-map').setView([pets.boncuk.lat, pets.boncuk.lng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Custom Icons Construction
    const createPetIcon = (emoji) => L.divIcon({
        className: 'pet-marker-leaflet',
        html: `<div class="pet-emoji">${emoji}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const userIcon = L.divIcon({
        className: 'user-marker-leaflet',
        html: `<div class="user-dot"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    // Markers
    const userMarker = L.marker([pets.boncuk.lat, pets.boncuk.lng], { icon: userIcon }).addTo(map);
    let petMarker = L.marker([pets.boncuk.lat, pets.boncuk.lng], { icon: createPetIcon(pets.boncuk.icon) }).addTo(map);

    // -------------------------

    // Simulation Logic
    function startSimulation() {
        simulationInterval = setInterval(() => {
            updateSimulationState();
        }, 500); // Faster updates (0.5s)
    }

    function updateSimulationState() {
        Object.keys(pets).forEach(key => {
            const pet = pets[key];

            // Advance along route
            let idx = Math.floor(pet.routeIndex);
            let nextIdx = idx + 1;

            if (nextIdx < pet.route.length) {
                const p1 = pet.route[idx];
                const p2 = pet.route[nextIdx];

                // Progress
                pet.routeIndex += 0.2; // Move 20% along segment per tick (Fast!)

                // Lerp
                const t = pet.routeIndex - idx; // 0.0 -> 1.0
                pet.lat = p1.lat + (p2.lat - p1.lat) * t;
                pet.lng = p1.lng + (p2.lng - p1.lng) * t;
            } else {
                // Reached end of defined route, stop or wander slightly
                pet.lat += (Math.random() - 0.5) * 0.0001;
                pet.lng += (Math.random() - 0.5) * 0.0001;
            }

            // Calculate Distance
            pet.distance = getDistanceFromLatLonInKm(pet.startLat, pet.startLng, pet.lat, pet.lng);

            // Calculate Risk
            let baseRisk = pet.distance * 15;
            if (Math.random() > 0.7) baseRisk += 10;
            pet.risk = Math.min(99, Math.max(5, Math.round(baseRisk)));
        });

        updateActivePetUI();
    }

    async function updateActivePetUI() {
        const pet = pets[activePetId];

        petMarker.setLatLng([pet.lat, pet.lng]);

        distanceVal.innerText = `${pet.distance.toFixed(2)} km`;
        mapRiskScore.innerText = `${Math.ceil(pet.risk / 10)}/10`;

        if (pet.risk > 70) mapRiskScore.className = 'score-value warning';
        else mapRiskScore.className = 'score-value';

        // Check for State Change to Trigger AI
        let currentLevel = 'normal';
        if (pet.distance > 1.0) currentLevel = 'critical';
        else if (pet.distance > 0.5) currentLevel = 'warning';

        if (currentLevel !== lastRiskState) {
            lastRiskState = currentLevel;
            triggerAIRiskAnalysis(pet, currentLevel);
        }

        // UI Updates (Immediate)
        if (currentLevel === 'critical') {
            actionTitle.innerText = "🚨 KRİTİK UYARI";
            // actionDesc will be updated by AI, but set a placeholder first
            if (actionDesc.innerText.includes('normal')) {
                actionDesc.innerText = `${pet.name} 1km sınırını aştı! Analiz ediliyor...`;
            }
            document.querySelector('.action-box').style.background = "#fff3cd";

            // Show Overlay
            overlay.style.display = 'flex';
            overlayMsg.innerText = `${pet.name} güvenli bölgeden 1km uzaklaştı!`;
        } else if (currentLevel === 'warning') {
            actionTitle.innerText = "⚠️ Ayrılma Uyarısı";
            if (actionDesc.innerText.includes('normal')) {
                actionDesc.innerText = "Mesafe artıyor. Analiz ediliyor...";
            }
            document.querySelector('.action-box').style.background = "#fdfefe";
        } else {
            actionTitle.innerText = "Durum Analizi";
            actionDesc.innerText = `Şu an ${pet.name} için her şey normal.`;
            document.querySelector('.action-box').style.background = "#fdfefe";
        }
    }

    async function triggerAIRiskAnalysis(pet, level) {
        if (level === 'normal') return; // Don't call AI for normal states if already known

        const prompt = `
        GÖREV: Bir evcil hayvanın risk durumunu analiz et ve kısa, etkileyici bir uyarı mesajı oluştur.
        
        VERİLER:
        - Hayvan Adı: ${pet.name}
        - Tür: ${pet.type === 'cat' ? 'Kedi' : 'Köpek'}
        - Mesafe: ${pet.distance.toFixed(2)} km
        - Risk Seviyesi: ${level === 'critical' ? 'Kritik (Yüksek)' : 'Uyarı (Orta)'}
        
        KURALLAR:
        1. Yanıtın SADECE uyarı cümlesi olmalı (max 15 kelime).
        2. Profesyonel ama aciliyet hissettiren bir dil kullan.
        3. Türkçe yanıt ver.
        4. Örn: "${pet.name} çok uzaklaştı! Hemen konumunu kontrol edin ve geri çağırın."
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 50, temperature: 0.7 }
        };

        try {
            const aiText = await callGeminiAPI(payload);
            if (aiText) {
                actionDesc.innerText = aiText;
            }
        } catch (err) {
            console.error("Risk AI Error:", err);
        }
    }

    // "BUL" Button Logic
    findBtn.addEventListener('click', () => {
        const selectedValue = petSelect.value;
        const previousPetId = activePetId;
        activePetId = selectedValue;

        const pet = pets[activePetId];

        if (previousPetId !== activePetId) {
            petMarker.setIcon(createPetIcon(pet.icon));
        }

        map.setView([pet.lat, pet.lng], 16, { animate: true });
        updateActivePetUI();
    });

    // Manual Start Button
    const runBtn = document.getElementById('run-sim-btn');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            if (!simulationInterval) {
                // Reset routes
                pets.boncuk.routeIndex = 0;
                pets.kahve.routeIndex = 0;
                pets.boncuk.lat = pets.boncuk.startLat;
                pets.boncuk.lng = pets.boncuk.startLng;
                pets.kahve.lat = pets.kahve.startLat;
                pets.kahve.lng = pets.kahve.startLng;

                startSimulation();
                runBtn.innerText = "Kaçış Başladı...";
                runBtn.disabled = true;
            }
        });
    }

    // Close Overlay Logic (Scoped correctly)
    if (closeOverlayBtn) {
        closeOverlayBtn.addEventListener('click', () => {
            overlay.style.display = 'none';

            // Stop Simulation
            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
            }

            // Reset Button
            if (runBtn) {
                runBtn.innerText = "Kaçışı Başlat";
                runBtn.disabled = false;
            }
        });
    }

    // Helper: Haversine Distance
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
    // POI Data (Hardcoded Realistic Locations)
    const poiData = {
        food: [
            { lat: 40.9845, lng: 29.0285, title: "Moda Parkı Otomatı" },
            { lat: 40.9872, lng: 29.0350, title: "Yoğurtçu Parkı Otomatı" },
            { lat: 40.9910, lng: 29.0230, title: "Rıhtım Otomatı" }
        ],
        vet: [
            { lat: 40.9855, lng: 29.0305, title: "Moda Veteriner kliniği" },
            { lat: 40.9890, lng: 29.0340, title: "Şifa Veteriner" },
            { lat: 40.9830, lng: 29.0260, title: "Sahil Veteriner" }
        ],
        shelter: [
            { lat: 40.9950, lng: 29.0320, title: "Kadıköy Barınağı" },
            { lat: 40.9810, lng: 29.0400, title: "Fenerbahçe Rehabilitasyon" }
        ],
        park: [
            { lat: 40.9840, lng: 29.0260, title: "Moda Parkı" },
            { lat: 40.9855, lng: 29.0325, title: "Yoğurtçu Parkı" },
            { lat: 40.9825, lng: 29.0350, title: "Kalamış Parkı" }
        ]
    };

    // Active Layers Registry
    let activeLayers = {};

    // Expose togglePOI to global scope
    window.togglePOI = (category) => {
        const btn = document.getElementById(`btn-${category}`);

        // If already active, remove it
        if (activeLayers[category]) {
            map.removeLayer(activeLayers[category]);
            delete activeLayers[category];
            btn.classList.remove('active');
        } else {
            // Add it properly
            const icons = {
                food: '🥣',
                vet: '🏥',
                shelter: '🏠',
                park: '🌳'
            };

            const markers = poiData[category].map(p => {
                const icon = L.divIcon({
                    className: 'poi-marker',
                    html: `<div style="font-size: 24px;">${icons[category]}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                return L.marker([p.lat, p.lng], { icon: icon }).bindPopup(p.title);
            });

            const layerGroup = L.layerGroup(markers).addTo(map);
            activeLayers[category] = layerGroup;
            btn.classList.add('active');
        }
    };

    // ===== ZONE MANAGEMENT SYSTEM =====

    // Zone Database (localStorage)
    const ZoneDB = {
        saveZone: (zone) => {
            const zones = ZoneDB.getZones();
            zones.push(zone);
            localStorage.setItem('petmap_zones', JSON.stringify(zones));
        },
        // ADDED: Clear existing zones for the update request
        clearAllZones: () => {
            localStorage.removeItem('petmap_zones');
        },
        getZones: () => {
            const z = localStorage.getItem('petmap_zones');
            return z ? JSON.parse(z) : [];
        },
        deleteZone: (id) => {
            let zones = ZoneDB.getZones();
            zones = zones.filter(z => z.id !== id);
            localStorage.setItem('petmap_zones', JSON.stringify(zones));
        }
    };

    // Zone layer group
    let zoneLayerGroup = L.layerGroup().addTo(map);
    let zonesVisible = true;
    let drawControl = null;
    let drawnItems = new L.FeatureGroup();
    let isDrawing = false;
    let zoneEventRegistered = false;

    // Get zone color based on category
    function getZoneColor(category) {
        const colors = {
            dangerous: { fill: 'rgba(255, 68, 68, 0.4)', stroke: 'rgba(255, 68, 68, 0.8)' },
            safe: { fill: 'rgba(68, 255, 68, 0.4)', stroke: 'rgba(68, 255, 68, 0.8)' },
            fun: { fill: 'rgba(68, 136, 255, 0.4)', stroke: 'rgba(68, 136, 255, 0.8)' }
        };
        return colors[category] || colors.safe;
    }

    // Get zone label
    function getZoneLabel(category) {
        const labels = {
            dangerous: '🔴 Tehlikeli Bölge',
            safe: '🟢 Güvenli Bölge',
            fun: '🔵 Eğlenceli Bölge'
        };
        return labels[category] || category;
    }

    // Render all zones from database
    function renderZones() {
        zoneLayerGroup.clearLayers();
        const zones = ZoneDB.getZones();

        zones.forEach(zone => {
            try {
                const color = getZoneColor(zone.category);

                // Create circle (instead of polygon)
                // Convert radius to number (localStorage stores as string)
                const radius = parseFloat(zone.radius);

                // Validate radius
                if (isNaN(radius) || radius <= 0) {
                    console.warn('⚠️ Skipping zone with invalid radius:', zone);
                    return; // Skip this zone
                }

                // Validate center
                if (!zone.center || !Array.isArray(zone.center) || zone.center.length !== 2) {
                    console.warn('⚠️ Skipping zone with invalid center:', zone);
                    return; // Skip this zone
                }

                const circle = L.circle(zone.center, {
                    radius: radius,
                    color: color.stroke,
                    fillColor: color.fill,
                    fillOpacity: 0.4,
                    weight: 2
                });

                // Create popup content
                const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
                const isCreator = currentUser.email === zone.creator;
                const createdDate = new Date(zone.createdAt).toLocaleDateString('tr-TR');

                let popupContent = `
                    <div class="zone-popup">
                        <div class="zone-popup-header">${getZoneLabel(zone.category)}</div>
                        <div class="zone-popup-info">📅 ${createdDate}</div>
                        <div class="zone-popup-info">👤 ${zone.creatorName || zone.creator}</div>
                        <div class="zone-popup-info">📏 ${Math.round(radius)}m yarıçap</div>
                `;

                if (zone.description) {
                    popupContent += `<div class="zone-popup-info">📝 ${zone.description}</div>`;
                }

                if (isCreator) {
                    popupContent += `
                        <button class="zone-popup-delete" data-zone-id="${zone.id}">
                            🗑️ Sil
                        </button>
                    `;
                }

                popupContent += `</div>`;

                circle.bindPopup(popupContent);

                // Add click event listener for delete button after popup opens
                circle.on('popupopen', function () {
                    const deleteBtn = document.querySelector('.zone-popup-delete');
                    console.log('🔍 Delete button found:', deleteBtn);

                    if (deleteBtn) {
                        console.log('✅ Attaching click event to delete button');
                        deleteBtn.onclick = function () {
                            const zoneId = this.getAttribute('data-zone-id');

                            // Direct deletion without confirm (confirm may be blocked)
                            ZoneDB.deleteZone(zoneId);
                            map.closePopup();
                            renderZones();

                            // Show success message
                            setTimeout(() => {
                                showToast('Bölge başarıyla silindi!', 'success');
                            }, 100);
                        };
                    }
                });

                zoneLayerGroup.addLayer(circle);
            } catch (error) {
                console.error('❌ Error rendering zone:', zone, error);
                // Continue with next zone instead of crashing
            }
        });
    }

    // Initialize draw control
    function initDrawControl() {
        if (drawControl) {
            map.removeControl(drawControl);
        }

        // Add drawnItems to map if not already added
        if (!map.hasLayer(drawnItems)) {
            map.addLayer(drawnItems);
        }

        drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                circle: {
                    shapeOptions: {
                        color: '#3388ff'
                    },
                    showRadius: true,
                    metric: true,
                    feet: false
                },
                polygon: false,
                polyline: false,
                rectangle: false,
                marker: false,
                circlemarker: false
            },
            edit: {
                featureGroup: drawnItems,
                remove: false
            }
        });

        map.addControl(drawControl);

        // Register zone creation event listener only once
        if (!zoneEventRegistered) {
            zoneEventRegistered = true;

            map.on(L.Draw.Event.CREATED, function (e) {
                const layer = e.layer;

                // Get circle center and radius
                const center = layer.getLatLng();
                const radius = layer.getRadius();

                // Get selected category
                const category = document.getElementById('zone-category').value;

                // Get current user
                const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
                const creator = currentUser.email || 'anonymous';
                const creatorName = currentUser.name || creator.split('@')[0];

                // Create zone object
                const zone = {
                    id: 'zone_' + Date.now(),
                    category: category,
                    type: 'circle',
                    center: [center.lat, center.lng],
                    radius: radius,
                    creator: creator,
                    creatorName: creatorName,
                    createdAt: Date.now(),
                    description: ''
                };

                // Save to database
                ZoneDB.saveZone(zone);

                // Re-render zones
                renderZones();

                // Stop drawing mode
                stopDrawing();

                // Show success message
                showToast(`${getZoneLabel(category)} başarıyla oluşturuldu!`, 'success');
            });
        }
    }

    // Custom drag-to-draw variables
    let customDrawing = false;
    let drawStartPoint = null;
    let tempCircle = null;

    // Start drawing mode (CUSTOM DRAG-TO-DRAW)
    function startDrawing() {
        // ADDED: Check login state before allowing drawing
        const userRole = sessionStorage.getItem('userRole');
        if (!userRole) {
            showToast('Bölge işaretlemek için lütfen giriş yapın!', 'error');
            // Optional: Redirect to login page if desired
            // window.location.href = 'login.html';
            return;
        }

        if (!isDrawing) {
            isDrawing = true;
            document.getElementById('btn-create-zone').classList.add('active');
            document.getElementById('btn-create-zone').textContent = '⏹️ Çizimi İptal Et';

            // Show instruction to user
            showToast('📍 Haritaya tıklayıp sürükleyerek bölgeyi çizin.', 'info');

            // Enable custom drag drawing
            map.dragging.disable(); // Disable map dragging during zone creation

            // Mouse down - start drawing
            map.on('mousedown', onDrawMouseDown);
        } else {
            stopDrawing();
        }
    }

    // Mouse down handler
    function onDrawMouseDown(e) {
        if (!isDrawing || customDrawing) return;

        customDrawing = true;
        drawStartPoint = e.latlng;

        // Create temporary circle
        const category = document.getElementById('zone-category').value;
        const color = getZoneColor(category);

        tempCircle = L.circle(drawStartPoint, {
            radius: 10,
            color: color.stroke,
            fillColor: color.fill,
            fillOpacity: 0.4,
            weight: 2
        }).addTo(map);

        // Add mouse move and mouse up handlers
        map.on('mousemove', onDrawMouseMove);
        map.on('mouseup', onDrawMouseUp);
    }

    // Mouse move handler - update circle radius
    function onDrawMouseMove(e) {
        if (!customDrawing || !tempCircle || !drawStartPoint) return;

        // Calculate radius
        const radius = drawStartPoint.distanceTo(e.latlng);
        tempCircle.setRadius(radius);
    }

    // Mouse up handler - finalize zone
    function onDrawMouseUp(e) {
        if (!customDrawing || !tempCircle || !drawStartPoint) return;

        try {
            console.log('🎯 Zone creation started...');

            // Calculate final radius
            const radius = drawStartPoint.distanceTo(e.latlng);
            console.log('📏 Radius:', radius);

            // Minimum radius check (at least 10 meters)
            if (radius < 10) {
                showToast('Bölge çok küçük! Lütfen daha büyük bir alan çizin.', 'warning');
                map.removeLayer(tempCircle);
                cleanupDrawing();
                return;
            }

            // Get selected category
            const category = document.getElementById('zone-category').value;
            console.log('📂 Category:', category);

            // Get current user
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            const creator = currentUser.email || 'anonymous';
            const creatorName = currentUser.name || creator.split('@')[0];
            console.log('👤 Creator:', creatorName);

            // Create zone object
            const zone = {
                id: 'zone_' + Date.now(),
                category: category,
                type: 'circle',
                center: [drawStartPoint.lat, drawStartPoint.lng],
                radius: radius,
                creator: creator,
                creatorName: creatorName,
                createdAt: Date.now(),
                description: ''
            };
            console.log('💾 Zone object created:', zone);

            // Save to database
            ZoneDB.saveZone(zone);
            console.log('✅ Zone saved to database');

            // Re-render zones BEFORE removing temp circle
            renderZones();
            console.log('🎨 Zones re-rendered');

            // Remove temporary circle AFTER rendering
            map.removeLayer(tempCircle);
            console.log('🗑️ Temp circle removed');

            // Clean up
            cleanupDrawing();

            // Start drawing mode
            stopDrawing();

            // Show success message
            showToast(`${getZoneLabel(category)} başarıyla oluşturuldu!`, 'success');
        } catch (error) {
            console.error('❌ Error creating zone:', error);
            showToast('Bölge oluşturulurken hata oluştu!', 'error');

            // Clean up on error
            if (tempCircle) {
                map.removeLayer(tempCircle);
            }
            cleanupDrawing();
            stopDrawing();
        }
    }

    // Clean up drawing state
    function cleanupDrawing() {
        customDrawing = false;
        drawStartPoint = null;
        tempCircle = null;

        // Remove event listeners
        map.off('mousedown', onDrawMouseDown);
        map.off('mousemove', onDrawMouseMove);
        map.off('mouseup', onDrawMouseUp);
    }


    // Stop drawing mode
    function stopDrawing() {
        isDrawing = false;

        // Clean up any temporary drawing state
        if (tempCircle) {
            map.removeLayer(tempCircle);
        }
        cleanupDrawing();

        // Re-enable map dragging
        map.dragging.enable();

        // Update button
        document.getElementById('btn-create-zone').classList.remove('active');
        document.getElementById('btn-create-zone').textContent = '🎨 Bölge Oluştur';
    }

    // Toggle zones visibility
    function toggleZonesVisibility() {
        const btn = document.getElementById('btn-toggle-zones');
        if (zonesVisible) {
            map.removeLayer(zoneLayerGroup);
            zonesVisible = false;
            btn.textContent = '👁️ Bölgeleri Göster';
            btn.classList.remove('active');
        } else {
            map.addLayer(zoneLayerGroup);
            zonesVisible = true;
            btn.textContent = '👁️ Bölgeleri Gizle';
            btn.classList.add('active');
        }
    }

    // Delete zone (exposed to global scope for popup button)
    window.deleteZone = (zoneId) => {
        if (confirm('Bu bölgeyi silmek istediğinizden emin misiniz?')) {
            ZoneDB.deleteZone(zoneId);
            renderZones();
            showToast('Bölge başarıyla silindi!', 'success');
        }
    };

    // Event listeners for zone controls
    const btnCreateZone = document.getElementById('btn-create-zone');
    const btnToggleZones = document.getElementById('btn-toggle-zones');

    if (btnCreateZone) {
        btnCreateZone.addEventListener('click', startDrawing);
    }

    if (btnToggleZones) {
        btnToggleZones.addEventListener('click', toggleZonesVisibility);
        btnToggleZones.classList.add('active'); // Start with zones visible
    }

    // Initial render of zones
    // UPDATED: Clear existing zones as requested (one-time or until removed)
    // To only clear once, you could use a flag, but user said "delete existing", 
    // implying they want a fresh start.
    const zonesCleared = localStorage.getItem('petmap_zones_cleanup_v1');
    if (!zonesCleared) {
        ZoneDB.clearAllZones();
        localStorage.setItem('petmap_zones_cleanup_v1', 'true');
    }
    renderZones();

    // ===== END ZONE MANAGEMENT SYSTEM =====


    // --- AI Module Logic (Real Gemini API) ---
    // --- AI Module Logic (Secure Backend Proxy) ---
    // API Key is now hidden in the Python Backend!
    const API_URL = '/api/gemini';

    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('pet-image-input');
    const previewImg = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const scanningOverlay = document.getElementById('scanning-overlay');
    const aiResult = document.getElementById('ai-result');

    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatWindow = document.getElementById('chat-window');

    // System Prompt for Chat (Strict Topic Restriction)
    const SYSTEM_PROMPT = `
    Kritik Görev: Sen PetMap adında, sadece evcil hayvanlar, hayvan sağlığı, bakımı ve veterinerlik konularında uzmanlaşmış bir yapay zeka asistanısın. 
    
    KURALLAR:
    1. Konu Sınırı: SADECE hayvanlar, evcil hayvan sağlığı, beslenmesi, davranışı ve PetMap uygulaması hakkında bilgi ver.
    2. Konu Dışı Engelleme: Eğer kullanıcı hayvanlar dışındaki konular (politika, teknoloji, spor, yemek tarifleri, genel sohbet, felsefe vb.) hakkında soru sorarsa, KESİNLİKLE yanıt verme.
    3. Uyarı Mesajı: Konu dışı sorularda şu cevabı ver: "Üzgünüm, ben sadece evcil hayvan sağlığı ve bakımı konusunda uzmanlaşmış bir asistanım. Bu konu hakkında bilgi veremem. Size evcil hayvanınızın sağlığı hakkında nasıl yardımcı olabilirim?"
    4. Kimlik: Adın PetMap. Asla farklı bir kimlik üstlenme.
    5. Üslup: Kısa, net, profesyonel ve yardımsever ol.
    `;

    // History for Chat (Starts empty to use system_instruction efficiently)
    let chatHistory = [];

    // Real AI Response Handler (through Backend Proxy)
    async function callGeminiAPI(payload) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (errorText === "QUOTA_EXCEEDED") return "QUOTA_EXCEEDED";
                throw new Error(`API Error: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Handle different response structures if necessary
            // Gemini API return format: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            }

            return JSON.stringify(data); // Return raw if structure is unknown
        } catch (err) {
            console.error("AI API Error:", err);
            return null;
        }
    }


    // Trigger file input
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    // Handle File (Vision Analysis)
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // UI Updates
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    scanningOverlay.style.display = 'block';
                    aiResult.style.display = 'none';

                    // Clear previous results
                    document.getElementById('result-breed').innerText = "Analiz ediliyor...";
                    document.getElementById('result-disease').innerText = "...";
                    document.getElementById('result-recommendation').innerText = "";
                    document.getElementById('result-confidence').innerText = "";
                    document.getElementById('vet-btn').style.display = 'none';
                }
                reader.readAsDataURL(file);

                // Convert to Base64 (remove prefix)
                const base64Data = await new Promise((resolve) => {
                    const r = new FileReader();
                    r.onloadend = () => resolve(r.result.split(',')[1]);
                    r.readAsDataURL(file);
                });

                // Vision Analysis Prompt
                const prompt = `
                GÖREV: Bu evcil hayvan fotoğrafını (kedi, köpek vb.) analiz et ve sonuçları SADECE aşağıdaki JSON formatında döndür. 
                
                ANALİZ KURALLARI:
                1. Hayvanın türünü ve ırkını belirle.
                2. Herhangi bir sağlık sorunu (göz akıntısı, deri problemi, halsizlik belirtisi vb.) olup olmadığını kontrol et.
                3. Severity (şiddet) değerini 'none', 'low' veya 'high' olarak belirle. (Örn: Ciddi bir yara varsa 'high', hafif kızarıklık varsa 'low', sağlıklıysa 'none').
                4. Kullanıcıya kısa ve profesyonel bir öneri ver.
                
                JSON FORMATI ÖRNEĞİ:
                {
                    "species": "Golden Retriever Köpek",
                    "condition": "Sağlıklı",
                    "severity": "none",
                    "recommendation": "Düzenli kontrollerine devam edin, diş sağlığına dikkat edin.",
                    "confidence": 95
                }
                
                NOT: Yanıtında JSON dışında hiçbir metin, açıklama veya markdown kodu (json yazısı hariç) BULUNMAMALIDIR.
                `;

                const payload = {
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: file.type, data: base64Data } }
                        ]
                    }]
                };

                const resultText = await callGeminiAPI(payload);

                // HANDLE QUOTA EXCEEDED OR CONNECTION ERROR
                if (resultText === "QUOTA_EXCEEDED" || !resultText) {
                    scanningOverlay.style.display = 'none';
                    aiResult.style.display = 'block';
                    aiResult.innerHTML = `<div style="padding: 20px; color: #721c24; background: #f8d7da; border-radius: 12px; margin-top: 15px;">
                        <strong>⚠️ API Bağlantı Hatası:</strong><br>
                        Lütfen backend sunucusunda API anahtarının (.env) doğru şekilde yapılandırıldığından emin olun.
                    </div>`;
                    return;
                }

                // Parse and Display
                try {
                    // Robust JSON cleanup
                    let cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
                    const data = JSON.parse(cleanJson);

                    document.getElementById('result-breed').innerText = data.species;
                    const disEl = document.getElementById('result-disease');
                    disEl.innerText = data.condition;
                    disEl.style.color = data.severity === 'high' ? 'var(--danger)' : '#28a745';

                    document.getElementById('result-recommendation').innerHTML = `<strong>Öneri:</strong> ${data.recommendation}`;
                    document.getElementById('result-confidence').innerText = `Güven: %${data.confidence}`;

                    // Auto-show Vet Button if high severity
                    const vetBtn = document.getElementById('vet-btn');
                    if (data.severity === 'high') {
                        vetBtn.style.display = 'block';
                        addBotMessage(`⚠️ Dikkat: ${data.condition} tespit edildi. Durum ciddi görünüyor, lütfen hemen bir veterinere başvurun.`);
                    } else {
                        vetBtn.style.display = 'none';
                    }

                } catch (err) {
                    console.error("Parse Error", err);
                    document.getElementById('result-breed').innerText = "Format Hatası";
                    document.getElementById('result-disease').innerText = "Veri Okunamadı";
                    document.getElementById('result-recommendation').innerText = "Yapay zeka yanıtı bozuk geldi.";
                }

                scanningOverlay.style.display = 'none';
                aiResult.style.display = 'block';
            }
        });
    }

    // Chat Logic
    // Chat Logic (Refactored)
    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-message user';
        div.innerText = text;
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        // Don't modify history here, handleChatSend does it to ensure sync
    }

    function addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-message bot';

        // Basit formatlama (Kütüphanesiz)
        if (text) {
            let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            formatted = formatted.replace(/\*(.*?)\*/g, '<i>$1</i>');
            div.innerHTML = formatted;
        }

        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }


    // Removal of fallback logic to ensure only real AI responses are used
    async function handleChatSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. UI Update
        addUserMessage(text);
        chatInput.value = '';
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message bot loading';
        loadingMsg.innerText = '...';
        chatWindow.appendChild(loadingMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // 2. Add to History
        chatHistory.push({ role: "user", parts: [{ text: text }] });

        // 3. Use Backend Proxy API with System Instruction
        const payload = {
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: chatHistory,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7
            }
        };

        const responseText = await callGeminiAPI(payload);

        // Remove loading
        loadingMsg.remove();

        // 4. Handle Response (No more local fallback)
        if (responseText === "QUOTA_EXCEEDED") {
            const errorMsg = "⚠️ Tüm AI modellerinin kotası doldu. Lütfen daha sonra tekrar deneyiniz.";
            chatHistory.push({ role: "model", parts: [{ text: errorMsg }] });
            addBotMessage(errorMsg);
        } else if (!responseText) {
            const errorMsg = "❌ AI bağlantısı kurulamadı. Lütfen internet bağlantınızı ve API anahtarını kontrol edin.";
            chatHistory.push({ role: "model", parts: [{ text: errorMsg }] });
            addBotMessage(errorMsg);
        } else {
            // Real AI response
            chatHistory.push({ role: "model", parts: [{ text: responseText }] });
            addBotMessage(responseText);
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleChatSend);
        // Add Enter key support
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSend();
        });
    }

    // Go To Vet Function
    window.goToVet = () => {
        document.getElementById('city-map').scrollIntoView({ behavior: 'smooth' });
        if (window.togglePOI) window.togglePOI('vet');
        if (map) map.setZoom(16);
    };

    // --- FOUND ANIMAL REPORT MODULE ---

    // Toggle ID Input visibility
    window.toggleIdInput = (checkbox) => {
        const group = document.getElementById('id-input-group');
        group.style.display = checkbox.checked ? 'block' : 'none';
    };

    // Image Preview for Report
    const reportUploadArea = document.getElementById('report-upload-area');
    const reportFileInput = document.getElementById('report-file-input');
    const reportPreview = document.getElementById('report-preview');

    if (reportUploadArea && reportFileInput) {
        reportUploadArea.addEventListener('click', () => reportFileInput.click());
        reportFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    reportPreview.src = ev.target.result;
                    reportPreview.style.display = 'block';
                    reportUploadArea.querySelector('span').style.display = 'none';
                    reportUploadArea.querySelector('p').style.display = 'none';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Auto-Geolocation (Mock)
    const locInput = document.getElementById('report-location');
    if (locInput) {
        // Simulate fetching location
        setTimeout(() => {
            locInput.value = "40.9855° N, 29.0325° E (Moda, Kadıköy)";
            locInput.style.color = 'var(--success)';
            locInput.style.fontWeight = '600';
        }, 1500);
    }

    // --- MOCK BACKEND (LocalStorage) ---
    // --- MOCK BACKEND (LocalStorage) ---
    const DB = {
        saveReport: (report) => {
            const reports = DB.getReports();
            reports.push(report);
            localStorage.setItem('petmap_reports', JSON.stringify(reports));
            // Initialize empty chat for this report
            localStorage.setItem(`petmap_chat_messages_${report.id}`, JSON.stringify([]));

            // Set as active immediately
            localStorage.setItem('petmap_active_report_id', report.id);
        },
        getReports: () => {
            const r = localStorage.getItem('petmap_reports');
            return r ? JSON.parse(r) : [];
        },
        getReport: (id) => {
            const reports = DB.getReports();
            return reports.find(r => r.id == id) || null;
        },
        getActiveReportId: () => {
            return localStorage.getItem('petmap_active_report_id');
        },
        setActiveReportId: (id) => {
            localStorage.setItem('petmap_active_report_id', id);
        },
        deleteReport: (id) => {
            let reports = DB.getReports();
            reports = reports.filter(r => r.id != id);
            localStorage.setItem('petmap_reports', JSON.stringify(reports));
            localStorage.removeItem(`petmap_chat_messages_${id}`);

            // If deleted active, reset active
            if (DB.getActiveReportId() == id) {
                localStorage.removeItem('petmap_active_report_id');
            }
        },
        saveMessage: (reportId, msg) => {
            const msgs = DB.getMessages(reportId);
            msgs.push(msg);
            localStorage.setItem(`petmap_chat_messages_${reportId}`, JSON.stringify(msgs));
            // Trigger update timestamp for sorting if needed
            const reports = DB.getReports();
            const rIndex = reports.findIndex(r => r.id == reportId);
            if (rIndex > -1) {
                reports[rIndex].lastUpdate = Date.now();
                localStorage.setItem('petmap_reports', JSON.stringify(reports));
            }
        },
        getMessages: (reportId) => {
            const m = localStorage.getItem(`petmap_chat_messages_${reportId}`);
            return m ? JSON.parse(m) : [];
        }
    };

    // Helper: Resize and Convert to Base64 for LocalStorage
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // --- REAL-TIME SYNC (Cross-Tab) ---
    // Listen for changes in other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'petmap_reports' || e.key.startsWith('petmap_chat_messages_')) {
            checkUpdates();
        }
    });

    // Polling as backup
    setInterval(checkUpdates, 2000);

    let previousReportCount = 0;

    function checkUpdates() {
        const role = sessionStorage.getItem('userRole');
        const reports = DB.getReports();

        // 1. Shelter Auto-Open Logic (New Report)
        if (role === 'barinak') {
            if (reports.length > previousReportCount) {
                // New report arrived!
                // Auto-switch to chat view
                const infoView = document.getElementById('report-info-view');
                const chatContainer = document.getElementById('report-chat-mode-container');

                // If chat view is hidden, show it
                if (chatContainer.style.display === 'none') {
                    infoView.style.display = 'none';
                    chatContainer.style.display = 'flex';
                    chatContainer.classList.add('slide-in');
                }

                // Ensure sidebar is rendered
                renderSidebar();

                // Auto-select the newest report
                reports.sort((a, b) => b.id - a.id);
                const latest = reports[0];
                const activeId = DB.getActiveReportId();

                if (latest && activeId != latest.id) {
                    window.switchChat(latest.id);
                }
            }
            previousReportCount = reports.length;
        }

        // 2. Chat Sync Logic
        // Check container visibility to know if we are in chat mode
        const chatContainer = document.getElementById('report-chat-mode-container');
        if (chatContainer && chatContainer.style.display !== 'none') {
            const activeId = DB.getActiveReportId();
            if (activeId) {
                syncChatMessages(activeId);
            }
        }
    }

    // Render Sidebar
    function renderSidebar() {
        const sidebar = document.getElementById('report-chat-sidebar');
        if (!sidebar) {
            console.error("Sidebar element not found!");
            return;
        }

        const reports = DB.getReports();
        const activeId = DB.getActiveReportId();
        const amIShelter = isShelter();

        // Sort by newest first
        reports.sort((a, b) => b.id - a.id);

        let html = '';
        if (reports.length === 0) {
            html = '<div style="padding:20px; text-align:center; color:#999;">Henüz rapor yok.</div>';
        } else {
            reports.forEach(r => {
                const isActive = (r.id == activeId);

                // Logic: What to show?
                // If I am Shelter -> Show Reporter Name & Avatar
                // If I am Finder -> Show "Barınak Destek" & Shelter Avatar? 
                //    But reports don't have shelter info stored yet? 
                //    We can hardcode Shelter info for now.

                let displayName = r.reporterName;
                let displayAvatar = r.reporterAvatar;
                let displayRole = r.reporterRole;

                if (!amIShelter) {
                    // I am the Finder, so I want to see who I am talking to (The Shelter)
                    displayName = "Barınak Yetkilisi";
                    displayRole = "Kurum";
                    displayAvatar = "🏢";
                }

                html += `
                    <div class="report-list-item ${isActive ? 'active' : ''}" onclick="switchChat(${r.id})">
                        <div class="report-item-avatar">${displayAvatar || '👤'}</div>
                        <div class="report-item-info">
                            <div class="report-item-name">${displayName}</div>
                            <div class="report-item-role">${displayRole}</div>
                        </div>
                        ${isActive ? '<div class="active-dot"></div>' : ''}
                        
                        <!-- Delete Button (Stop Propagation to prevent switching when clicking delete) -->
                        <div class="delete-report-btn" onclick="deleteReportById(${r.id}, event)" title="Bu raporu sil">✕</div>
                    </div>
                `;
            });
        }
        sidebar.innerHTML = html;
        // Reset manual overrides so class handles it
        sidebar.style.display = 'flex';
        sidebar.style.flexDirection = '';
        sidebar.style.width = '';
        sidebar.style.flexShrink = '';
    }

    // New Delete Logic
    window.deleteReportById = (id, event) => {
        if (event) event.stopPropagation();

        if (confirm("Bu ihbarı silmek istediğinize emin misiniz?")) {
            DB.deleteReport(id);

            // If we deleted the active report, switch to another or clear
            const activeId = DB.getActiveReportId();
            if (activeId == id) {
                const reports = DB.getReports();
                if (reports.length > 0) {
                    window.switchChat(reports[0].id);
                } else {
                    // No reports left
                    document.getElementById('report-chat-window').innerHTML = '';
                    localStorage.removeItem('petmap_active_report_id');
                    renderSidebar();
                }
            } else {
                renderSidebar();
            }
        }
    };

    window.deleteReport = () => { // Legacy wrapper if still needed
        const id = DB.getActiveReportId();
        if (id) window.deleteReportById(id);
    };
    // Switch Chat
    window.switchChat = (reportId) => {
        DB.setActiveReportId(reportId);
        renderSidebar();

        // DRAWER LOGIC: Hide sidebar (Slide Right)
        document.getElementById('report-chat-sidebar').classList.add('sidebar-hidden');

        // Clear chat and load new
        document.getElementById('report-chat-window').innerHTML = '';
        lastMsgCount = 0;
        syncChatMessages(reportId);

        // Update Header Info based on report?
        const report = DB.getReport(reportId);
        if (report && isShelter()) {
            const header = document.querySelector('#report-chat-view h4');
            if (header) header.innerText = `İhbar: ${report.reporterName}`;
        }
    };

    // DRAWER LOGIC: Show Sidebar (Slide Left/In)
    window.toggleSidebar = () => {
        document.getElementById('report-chat-sidebar').classList.remove('sidebar-hidden');
    };

    // Helper: Sync Chat UI
    let lastMsgCount = 0;
    let lastSyncedReportId = null;

    function syncChatMessages(reportId) {
        if (!reportId) return;

        // If we switched reports, reset counter
        if (lastSyncedReportId != reportId) {
            lastMsgCount = 0;
            document.getElementById('report-chat-window').innerHTML = '';
            lastSyncedReportId = reportId;
        }

        const msgs = DB.getMessages(reportId);
        const currentUserIsShelter = isShelter();

        if (msgs.length > lastMsgCount) {
            const chatWindow = document.getElementById('report-chat-window');
            // Only append new messages
            for (let i = lastMsgCount; i < msgs.length; i++) {
                const msg = msgs[i];
                const div = document.createElement('div');

                // Logic: Blue if I sent it, Gray if I received it
                let isMe = false;
                if (currentUserIsShelter) {
                    // I am Shelter -> Blue if sender is 'shelter'
                    isMe = (msg.sender === 'shelter');
                } else {
                    // I am Finder -> Blue if sender is 'finder'
                    isMe = (msg.sender === 'finder');
                }

                div.style.alignSelf = isMe ? 'flex-end' : 'flex-start';
                div.style.background = isMe ? '#007bff' : '#f1f0f0';
                div.style.color = isMe ? 'white' : '#333';
                div.style.padding = '10px 15px';
                div.style.borderRadius = isMe ? '15px 15px 0 15px' : '15px 15px 15px 0';

                div.style.maxWidth = '80%';
                div.style.marginBottom = '10px';
                div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
                div.style.fontSize = '14px';

                div.innerHTML = msg.text;
                chatWindow.appendChild(div);
            }
            chatWindow.scrollTop = chatWindow.scrollHeight;
            lastMsgCount = msgs.length;
        }
    }

    function isShelter() {
        return sessionStorage.getItem('userRole') === 'barinak';
    }

    // DEBUG: Role Switching Helpers
    window.becomeShelter = () => {
        sessionStorage.setItem('userRole', 'barinak');
        window.location.reload();
    };

    window.becomeFinder = () => {
        sessionStorage.removeItem('userRole');
        window.location.reload();
    };

    // Expose this for notification click 
    // (Still kept for legacy compatibility or manual join if needed)
    window.joinShelterChat = () => {
        const infoView = document.getElementById('report-info-view');
        const chatContainer = document.getElementById('report-chat-mode-container');
        const chatView = document.getElementById('report-chat-view'); // Inner view for header update if needed

        infoView.style.display = 'none';
        chatContainer.style.display = 'flex';

        // Initialize Sidebar
        renderSidebar();

        chatContainer.classList.add('slide-in');

        // If no active report, maybe select the first one?
        const activeId = DB.getActiveReportId();
        if (!activeId) {
            const reports = DB.getReports();
            if (reports.length > 0) {
                window.switchChat(reports[0].id);
            }
        } else {
            syncChatMessages(activeId);
        }
    };

    window.deleteReport = () => {
        const id = DB.getActiveReportId();
        if (id && confirm("Bu ihbarı ve tüm konuşmaları silmek istediğinize emin misiniz?")) {
            DB.deleteReport(id);
            renderSidebar();
            document.getElementById('report-chat-window').innerHTML = ''; // Request clear
            // If more reports exist, switch to next, else show empty
            const reports = DB.getReports();
            if (reports.length > 0) window.switchChat(reports[0].id);
        }
    };

    // DEBUG: Reset Function
    window.resetApp = () => {
        if (confirm("Tüm veri silinecek. Emin misiniz?")) {
            localStorage.clear();
            window.location.reload();
        }
    };
    // Auto-expose for easy console access

    // --- UPDATED REPORT LOGIC ---
    window.handleReport = async (e) => {
        e.preventDefault();

        const file = reportFileInput.files[0];
        // ... (validation skipped for brevity, assumed checked)

        // Show processing
        const btn = e.target.querySelector('button');
        btn.innerText = "Gönderiliyor...";
        btn.disabled = true;

        setTimeout(async () => {
            btn.innerText = "Rapor İletildi! ⏳";
            btn.style.background = "#ffc107"; // Yellow for pending
            btn.style.color = "black";

            // Convert Image to Base64 for Mock DB
            let base64Img = null;
            if (file) {
                try {
                    base64Img = await toBase64(file);
                } catch (err) { console.error("Img Error", err); }
            }

            // Capture Reporter Info
            let reporterAvatar = "👤";
            let reporterRole = "Misafir";

            const role = sessionStorage.getItem('userRole');
            const roleAvatars = {
                veteriner: '👨‍⚕️',
                hayvansever: '💙',
                sahip: '🏠',
                barinak: '🏢'
            };
            if (role) {
                reporterAvatar = roleAvatars[role] || "👤";
                const roleLabels = { veteriner: 'Veteriner', hayvansever: 'Hayvansever', sahip: 'Hayvan Sahibi', barinak: 'Barınak' };
                reporterRole = roleLabels[role] || "Vatandaş";
            }

            // Save to Mock DB
            const reportId = Date.now();
            const reportData = {
                id: reportId,
                location: document.getElementById('report-location').value,
                status: 'pending',
                photo: base64Img,
                reporterName: currentUser.name || (role ? reporterRole : "Anonim"),
                reporterAvatar: reporterAvatar,
                reporterRole: reporterRole,
                timestamp: Date.now()
            };

            DB.saveReport(reportData);

            // Initial Finder Message
            let fileHtml = "";
            if (base64Img) {
                fileHtml = `<img src="${base64Img}" style="max-width:100%; border-radius:8px; margin-top:5px; display:block;">`;
            }
            const initialText = `Merhaba, bu konumda bu hayvanı buldum. Lütfen gelip alır mısınız? ${fileHtml}`;
            DB.saveMessage(reportId, { sender: 'finder', text: initialText });

            // Transition UI for Finder (Waiting Mode)
            const infoView = document.getElementById('report-info-view');
            const chatContainer = document.getElementById('report-chat-mode-container');

            infoView.classList.add('slide-out');
            setTimeout(() => {
                infoView.style.display = 'none';
                chatContainer.style.display = 'flex';

                // Ensure sidebar is visible for Finder too
                const sibebar = document.getElementById('report-chat-sidebar');
                sibebar.style.display = 'flex';
                renderSidebar();

                // AUTO-OPEN CHAT: Slide sidebar out immediately so Finder sees the chat they just started
                sibebar.classList.add('sidebar-hidden');

                chatContainer.classList.add('slide-in');

                // Clear chat window initially
                document.getElementById('report-chat-window').innerHTML = '';

                // Set Header
                const chatView = document.getElementById('report-chat-view');
                const header = chatView.querySelector('h4');
                header.innerText = "Barınak Yanıtı Bekleniyor...";
                chatView.querySelector('small').innerText = "Raporunuz iletildi";

                // Start Sync
                syncChatMessages(reportId);

            }, 500);

        }, 1000);

        // 5. Simulate Shelter Auto-Reply (After 4 seconds)
        setTimeout(() => {
            const activeId = DB.getActiveReportId();
            if (activeId == reportId) {
                const replyText = "Merhaba! İhbarınızı aldık. Ekip arkadaşlarımız konumu inceliyor, lütfen bekleyiniz.";
                DB.saveMessage(reportId, { sender: 'shelter', text: replyText });

                // Trigger sync if we are looking at it
                syncChatMessages(reportId);

                // Optional: Play notification sound if we had one
            }
        }, 5000);
    };

    // Send Message Logic
    window.sendReportMessage = () => {
        const input = document.getElementById('report-chat-input');
        const text = input.value.trim();
        if (!text) return;

        const activeId = DB.getActiveReportId();
        if (!activeId) {
            alert("Aktif bir rapor/sohbet seçili değil.");
            return;
        }

        const sender = isShelter() ? 'shelter' : 'finder';
        DB.saveMessage(activeId, { sender, text });
        input.value = '';
    };

    // Initialize Sidebar if already in chat view (e.g. reload)
    const chatContainer = document.getElementById('report-chat-mode-container');
    if (chatContainer && chatContainer.style.display !== 'none') {
        renderSidebar();
        const activeId = DB.getActiveReportId();
        if (activeId) syncChatMessages(activeId);
    }
});
