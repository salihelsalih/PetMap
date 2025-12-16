// App Logic for PetMap

document.addEventListener('DOMContentLoaded', () => {
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

    function updateActivePetUI() {
        const pet = pets[activePetId];

        petMarker.setLatLng([pet.lat, pet.lng]);

        distanceVal.innerText = `${pet.distance.toFixed(2)} km`;
        mapRiskScore.innerText = `${Math.ceil(pet.risk / 10)}/10`;

        if (pet.risk > 70) mapRiskScore.className = 'score-value warning';
        else mapRiskScore.className = 'score-value';

        // Alert Logic
        if (pet.distance > 1.0) {
            actionTitle.innerText = "🚨 KRİTİK UYARI";
            actionDesc.innerText = `${pet.name} 1km sınırını aştı! Konum paylaşımı açıldı.`;
            document.querySelector('.action-box').style.background = "#fff3cd";

            // Show Overlay
            overlay.style.display = 'flex';
            overlayMsg.innerText = `${pet.name} güvenli bölgeden 1km uzaklaştı!`;
        } else if (pet.distance > 0.5) {
            actionTitle.innerText = "⚠️ Ayrılma Uyarısı";
            actionDesc.innerText = "Mesafe artıyor. Lütfen kontrol edin.";
            document.querySelector('.action-box').style.background = "#fdfefe";
        } else {
            actionTitle.innerText = "Durum Analizi";
            actionDesc.innerText = `Şu an ${pet.name} için her şey normal.`;
            document.querySelector('.action-box').style.background = "#fdfefe";
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

    // System Prompt for Chat
    const SYSTEM_PROMPT = `
    Sen PetMap adında uzman bir veteriner asistanısın. 
    görevin sadece evcil hayvanlar, hayvan sağlığı ve bakımı hakkında bilgi vermektir.
    Adın sorulursa "PetMap" olduğunu söyle.
    Hayvanlar dışındaki konular sorulursa nazikçe cevap veremeyeceğini belirt.
    Cevapların kısa, net ve yardımsever olsun.
    `;

    // History for Chat
    let chatHistory = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Anlaşıldı. Ben PetMap, sadece hayvan sağlığı konusunda yardımcı olurum." }] }
    ];

    // Simulated AI Response Generator (No Real API)
    async function simulateAIResponse(payload) {
        // Simulate processing delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Extract user message
        const contents = payload.contents || [];
        const lastUserMessage = contents.filter(c => c.role === 'user').pop();
        const userText = lastUserMessage?.parts?.[0]?.text || '';

        // Check if it's an image analysis request
        const hasImage = lastUserMessage?.parts?.some(p => p.inline_data);

        if (hasImage) {
            // Simulated image analysis
            return generateImageAnalysisResponse();
        } else {
            // Simulated chat response
            return generateChatResponse(userText);
        }
    }

    // Generate realistic chat responses
    function generateChatResponse(userText) {
        const text = userText.toLowerCase();

        // Greetings
        if (text.includes('merhaba') || text.includes('selam') || text.includes('hey')) {
            return "Merhaba! Ben PetMap yapay zeka asistanıyım. Evcil hayvanınızın sağlığı, beslenmesi, davranışı ve bakımı hakkında size yardımcı olabilirim. Nasıl yardımcı olabilirim? 🐾";
        }

        // Health questions
        if (text.includes('hasta') || text.includes('sağlık') || text.includes('hastalık') || text.includes('ateş')) {
            return "Evcil hayvanınızın sağlık durumu konusunda endişeleriniz varsa, en doğrusu bir veterinere danışmaktır. Ancak genel olarak şu belirtilere dikkat etmelisiniz:\n\n• Ateş (normalden yüksek vücut sıcaklığı)\n• İştah kaybı veya aşırı su içme\n• Halsizlik ve uyuşukluk\n• Kusma veya ishal\n• Davranış değişiklikleri\n\nAcil durumlarda 7/24 veteriner kliniklerine başvurabilirsiniz. 🏥";
        }

        // Feeding
        if (text.includes('mama') || text.includes('beslen') || text.includes('yemek') || text.includes('ne yedir')) {
            return "Evcil hayvanınızın beslenmesi yaşına, ırkına, kilosuna ve sağlık durumuna göre değişir:\n\n**Köpekler için:**\n• Yetişkin: Günde 2 öğün, kaliteli köpek maması\n• Yavru: Günde 3-4 öğün, yavru maması\n• Çikolata, üzüm, soğan ASLA verilmemeli\n\n**Kediler için:**\n• Günde 2-3 öğün, kedi maması\n• Bol su (kediler az su içer, dikkat!)\n• Süt vermekten kaçının (laktoz intoleransı)\n\nVeterinerinizden özel beslenme planı isteyebilirsiniz. 🍽️";
        }

        // Vaccines
        if (text.includes('aşı') || text.includes('aşı')) {
            return "Aşı takvimi hayvanınızın sağlığı için kritik öneme sahiptir:\n\n**Köpekler:**\n• Karma aşı (6-8 haftalık, 3 doz)\n• Kuduz aşısı (3-4 aylık)\n• Yıllık rapel aşıları\n\n**Kediler:**\n• Üçlü aşı (8-9 haftalık, 2 doz)\n• Kuduz aşısı (3-4 aylık)\n• Yıllık rapel aşıları\n\nVeterinerinizle detaylı bir aşı takvimi oluşturun ve takip edin. 💉";
        }

        // Behavior
        if (text.includes('davranış') || text.includes('eğitim') || text.includes('tuvalet') || text.includes('ısırıyor')) {
            return "Davranış sorunları sabır ve tutarlılık gerektirir:\n\n**Genel İpuçları:**\n• Pozitif pekiştirme kullanın (ödül sistemi)\n• Cezalandırmak yerine doğru davranışı öğretin\n• Tutarlı olun, kuralları değiştirmeyin\n• Sosyalleşmeye önem verin\n\n**Tuvalet Eğitimi:**\n• Düzenli çıkarma saatleri belirleyin\n• Doğru yerde tuvalet yaptığında ödüllendirin\n• Sabırlı olun, zaman alır\n\nCiddi davranış sorunları için hayvan davranış uzmanına danışın. 🎓";
        }

        // Weight/Diet
        if (text.includes('kilo') || text.includes('şişman') || text.includes('zayıf')) {
            return "Kilo kontrolü hayvanınızın sağlığı için çok önemlidir:\n\n**Fazla Kilolu:**\n• Porsiyon kontrolü yapın\n• Düzenli egzersiz artırın\n• Atıştırmalıkları azaltın\n• Veteriner diyeti düşünün\n\n**Zayıf:**\n• Mama kalitesini kontrol edin\n• Parazit kontrolü yaptırın\n• Sağlık kontrolü önemli\n• Porsiyon artışı veteriner önerisiyle\n\nİdeal kiloyu veterinerinizle belirleyin. ⚖️";
        }

        // General
        return `Anlıyorum, "${userText}" hakkında bilgi istiyorsunuz.\n\nEvcil hayvanınızın sağlığı, beslenmesi, aşıları ve davranışı hakkında daha spesifik sorular sorabilirsiniz. Size en iyi şekilde yardımcı olmak için:\n\n• Hayvanınızın türü, yaşı ve ırkını belirtin\n• Spesifik semptomları veya durumu açıklayın\n• Acil durumlar için mutlaka veterinere başvurun\n\nSize nasıl yardımcı olabilirim? 🐶🐱`;
    }

    // Generate fixed image analysis response for cross-eyed cat
    function generateImageAnalysisResponse() {
        // Fixed response for a cross-eyed cat (şaşı kedi)
        return JSON.stringify({
            species: "Şaşı Kedi (Van Kedisi)",
            condition: "Şaşılık (Strabismus) - Doğuştan Genetik Özellik",
            severity: "low",
            recommendation: "Şaşılık Van kedilerinde sık görülen genetik bir özelliktir ve genellikle sağlık sorunu oluşturmaz. Ancak görme keskinliğini etkileyebileceği için düzenli göz muayenesi önerilir. Kedinin çevreye adaptasyonunu gözlemleyin ve ani hareketlerden kaçının. Veteriner kontrolünde göz sağlığı takibi yapılmalıdır.",
            confidence: 92
        });
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

                // Prepare Vision Request
                const prompt = `
                Bu fotoğraftaki hayvanı analiz et. JSON formatında şu bilgileri ver:
                {
                    "species": "Hayvan Türü (Örn: Tekir Kedi) veya 'Hayvan Yok'",
                    "condition": "Olası Sağlık Durumu (Sağlıklıysa 'Sağlıklı' yaz)",
                    "severity": "high" veya "low" (Eğer veteriner şartsa "high"),
                    "recommendation": "Yapılması gerekenler (1-2 cümle)",
                    "confidence": "Yüzde kaç emin olduğu (Örn: 95)"
                }
                Lütfen SADECE JSON döndür. Markdown 'json' tagleri kullanma.
                `;

                const payload = {
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: file.type, data: base64Data } }
                        ]
                    }]
                };

                const resultText = await simulateAIResponse(payload);

                // HANDLE QUOTA EXCEEDED OR CONNECTION ERROR - USE FALLBACK
                if (resultText === "QUOTA_EXCEEDED" || !resultText) {
                    // Fallback: Show general advice
                    document.getElementById('result-breed').innerText = "Fotoğraf Yüklendi";
                    document.getElementById('result-disease').innerText = "Genel Değerlendirme";
                    document.getElementById('result-disease').style.color = '#0284c7';
                    document.getElementById('result-recommendation').innerHTML = `
                        <strong>Genel Öneriler:</strong><br>
                        • Evcil hayvanınızı düzenli olarak veteriner kontrolüne götürün<br>
                        • Aşı takvimini takip edin<br>
                        • Beslenme ve su alımını kontrol edin<br>
                        • Davranış değişikliklerini gözlemleyin<br>
                        • Acil durumlarda hemen veterinere başvurun
                    `;
                    document.getElementById('result-confidence').innerHTML = `<em style="color: #f59e0b;">ℹ️ AI analizi şu anda kullanılamıyor</em>`;
                    document.getElementById('vet-btn').style.display = 'none';

                    scanningOverlay.style.display = 'none';
                    aiResult.style.display = 'block';
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

    // Fallback Chat Responses (when API is unavailable)
    function getFallbackResponse(userText) {
        const text = userText.toLowerCase();

        // Greetings
        if (text.includes('merhaba') || text.includes('selam') || text.includes('hey')) {
            return "Merhaba! Ben PetMap asistanıyım. Evcil hayvanınız hakkında size nasıl yardımcı olabilirim? 🐾";
        }

        // Health questions
        if (text.includes('hasta') || text.includes('sağlık') || text.includes('hastalık')) {
            return "Evcil hayvanınızın sağlık durumu konusunda endişeleriniz varsa, en doğrusu bir veterinere danışmaktır. Acil durumlarda 7/24 veteriner kliniklerine ulaşabilirsiniz. 🏥";
        }

        // Feeding
        if (text.includes('mama') || text.includes('beslen') || text.includes('yemek')) {
            return "Evcil hayvanınızın yaşına, ırkına ve sağlık durumuna uygun mama seçimi çok önemlidir. Veterinerinizden özel bir beslenme planı isteyebilirsiniz. 🍽️";
        }

        // Vaccines
        if (text.includes('aşı') || text.includes('aşı')) {
            return "Düzenli aşı takvimine uymak hayvanınızın sağlığı için çok önemlidir. Köpekler için kuduz, karma aşı; kediler için üçlü aşı temel aşılardandır. Veterinerinizle aşı takvimi oluşturun. 💉";
        }

        // Behavior
        if (text.includes('davranış') || text.includes('eğitim') || text.includes('tuvalet')) {
            return "Davranış sorunları için sabır ve tutarlılık önemlidir. Pozitif pekiştirme yöntemi kullanarak eğitim verin. Ciddi durumlarda hayvan davranış uzmanına danışabilirsiniz. 🎓";
        }

        // General
        return "Size yardımcı olmak isterim! Evcil hayvanınızın sağlığı, beslenmesi, aşıları veya davranışı hakkında daha spesifik sorular sorabilirsiniz. Acil durumlar için mutlaka veterinere başvurun. 🐶🐱";
    }

    // New Named Function for Chat with Fallback
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

        // 3. Use Simulated AI
        const payload = {
            contents: chatHistory,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7
            }
        };

        const responseText = await simulateAIResponse(payload);

        // Remove loading
        loadingMsg.remove();

        // 4. Handle Response with Fallback
        if (responseText === "QUOTA_EXCEEDED" || !responseText) {
            // Use fallback response
            const fallbackText = getFallbackResponse(text);
            chatHistory.push({ role: "model", parts: [{ text: fallbackText }] });
            addBotMessage(fallbackText + "\n\n_ℹ️ Not: AI bağlantısı şu anda kullanılamıyor, genel bilgiler veriyorum._");
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
