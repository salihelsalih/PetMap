// ===== Pet Management System =====

// Generate UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Calculate age from birthdate
function calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Get species emoji
function getSpeciesEmoji(species) {
    const emojiMap = {
        'Köpek': '🐕',
        'Kedi': '🐈',
        'Kuş': '🦜',
        'Tavşan': '🐰',
        'Diğer': '🐾'
    };
    return emojiMap[species] || '🐾';
}

// LocalStorage Management
const PetStorage = {
    KEY: 'petmap_pets',

    getAll() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
    },

    save(pets) {
        localStorage.setItem(this.KEY, JSON.stringify(pets));
    },

    add(pet) {
        const pets = this.getAll();
        pets.push(pet);
        this.save(pets);
    },

    update(id, updatedPet) {
        const pets = this.getAll();
        const index = pets.findIndex(p => p.id === id);
        if (index !== -1) {
            pets[index] = { ...pets[index], ...updatedPet };
            this.save(pets);
        }
    },

    delete(id) {
        const pets = this.getAll().filter(p => p.id !== id);
        this.save(pets);
    },

    getById(id) {
        return this.getAll().find(p => p.id === id);
    }
};

// Initialize demo data if empty
function initializeDemoData() {
    if (PetStorage.getAll().length === 0) {
        const demoPets = [
            {
                id: generateUUID(),
                name: "Karabaş",
                species: "Köpek",
                breed: "Golden Retriever",
                age: 3,
                birthDate: "2021-06-15",
                gender: "Erkek",
                weight: 28.5,
                photo: "",
                microchipId: "TR123456789",
                color: "Altın Sarısı",

                vaccines: [
                    { name: "Kuduz", date: "2024-01-15", nextDate: "2025-01-15", vet: "Dr. Ahmet Yılmaz" },
                    { name: "Karma Aşı", date: "2024-02-10", nextDate: "2025-02-10", vet: "Dr. Ahmet Yılmaz" },
                    { name: "Leptospiroz", date: "2024-03-05", nextDate: "2025-03-05", vet: "Dr. Ahmet Yılmaz" }
                ],

                medications: [
                    { name: "Antibiyotik", dose: "250mg", frequency: "Günde 2", startDate: "2024-12-01", endDate: "2024-12-15", status: "Aktif" },
                    { name: "Vitamin Desteği", dose: "1 tablet", frequency: "Günde 1", startDate: "2024-11-01", endDate: "2025-01-01", status: "Aktif" }
                ],

                diseases: [
                    { name: "Kulak Enfeksiyonu", date: "2024-11-20", status: "İyileşti", severity: "Hafif" },
                    { name: "Mide Hassasiyeti", date: "2024-08-10", status: "Kronik", severity: "Orta" }
                ],

                allergies: ["Tavuk", "Polen", "Buğday"],

                location: { lat: 41.0082, lng: 28.9784, name: "Kadıköy, İstanbul" },
                locationHistory: [
                    { date: "2024-12-16", lat: 41.0082, lng: 28.9784 },
                    { date: "2024-12-15", lat: 41.0095, lng: 28.9800 },
                    { date: "2024-12-14", lat: 41.0070, lng: 28.9770 }
                ],

                gallery: [
                    "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400",
                    "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400",
                    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"
                ],

                feedingInstructions: "Günde 2 öğün, sabah 8:00 ve akşam 18:00. Her öğün 300gr yetişkin köpek maması. Bol su.",
                behaviorNotes: "Çok enerjik ve oyuncu. Yabancılara karşı çekingen ama ısındıktan sonra çok sevecen. Diğer köpeklerle iyi geçinir.",
                vetNotes: "Kalça displazisi riski var, düzenli kontrol gerekli. Aşırı kilo almamasına dikkat edilmeli.",
                emergencyInfo: "Acil durumda: 0555 123 4567 (Sahip: Mehmet Demir)",

                healthScore: 85,
                weightHistory: [
                    { date: "2024-10-01", weight: 29.5 },
                    { date: "2024-10-15", weight: 29.2 },
                    { date: "2024-11-01", weight: 29.0 },
                    { date: "2024-11-15", weight: 28.8 },
                    { date: "2024-12-01", weight: 28.5 },
                    { date: "2024-12-15", weight: 28.5 }
                ],
                activityHistory: [
                    { date: "2024-12-10", steps: 8500, duration: 120 },
                    { date: "2024-12-11", steps: 7200, duration: 95 },
                    { date: "2024-12-12", steps: 9100, duration: 135 },
                    { date: "2024-12-13", steps: 6800, duration: 85 },
                    { date: "2024-12-14", steps: 8900, duration: 115 },
                    { date: "2024-12-15", steps: 8200, duration: 105 }
                ],
                appetiteHistory: [
                    { date: "2024-12-10", level: 5 },
                    { date: "2024-12-11", level: 4 },
                    { date: "2024-12-12", level: 5 },
                    { date: "2024-12-13", level: 3 },
                    { date: "2024-12-14", level: 4 },
                    { date: "2024-12-15", level: 5 }
                ],
                aiAlerts: [
                    {
                        type: "success",
                        severity: "low",
                        message: "Sağlıklı kilo kaybı trendi devam ediyor",
                        recommendation: "Mevcut beslenme programına devam edin",
                        date: "2024-12-15"
                    },
                    {
                        type: "warning",
                        severity: "medium",
                        message: "Kuduz aşısı 1 ay içinde yenilenmelidir",
                        recommendation: "Veteriner randevusu alın",
                        date: "2024-12-14"
                    }
                ]
            },
            {
                id: generateUUID(),
                name: "Minnoş",
                species: "Kedi",
                breed: "British Shorthair",
                age: 2,
                birthDate: "2022-03-20",
                gender: "Dişi",
                weight: 4.2,
                photo: "",
                microchipId: "TR987654321",
                color: "Gri",

                vaccines: [
                    { name: "Kedi Gribi", date: "2024-01-20", nextDate: "2025-01-20", vet: "Dr. Ayşe Kaya" },
                    { name: "Kuduz", date: "2024-02-15", nextDate: "2025-02-15", vet: "Dr. Ayşe Kaya" }
                ],

                medications: [
                    { name: "Pire İlacı", dose: "1 damla", frequency: "Ayda 1", startDate: "2024-12-01", endDate: "2025-12-01", status: "Aktif" }
                ],

                diseases: [],
                allergies: ["Süt ürünleri"],

                location: { lat: 41.0150, lng: 28.9850, name: "Moda, İstanbul" },
                locationHistory: [
                    { date: "2024-12-16", lat: 41.0150, lng: 28.9850 },
                    { date: "2024-12-15", lat: 41.0148, lng: 28.9845 }
                ],

                gallery: [
                    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400",
                    "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400"
                ],

                feedingInstructions: "Günde 3 öğün, küçük porsiyonlar. Kuru mama tercih ediyor.",
                behaviorNotes: "Sakin ve uysal. Kucakta oturmayı sever. Gece aktif olur.",
                vetNotes: "Genel sağlık durumu çok iyi. Düzenli diş kontrolü önerilir.",
                emergencyInfo: "Acil durumda: 0555 987 6543 (Sahip: Zeynep Arslan)",

                healthScore: 92,
                weightHistory: [
                    { date: "2024-10-01", weight: 4.0 },
                    { date: "2024-11-01", weight: 4.1 },
                    { date: "2024-12-01", weight: 4.2 }
                ],
                activityHistory: [
                    { date: "2024-12-10", steps: 2500, duration: 45 },
                    { date: "2024-12-11", steps: 2800, duration: 50 },
                    { date: "2024-12-12", steps: 2400, duration: 42 },
                    { date: "2024-12-13", steps: 2900, duration: 55 },
                    { date: "2024-12-14", steps: 2600, duration: 48 },
                    { date: "2024-12-15", steps: 2700, duration: 50 }
                ],
                appetiteHistory: [
                    { date: "2024-12-10", level: 5 },
                    { date: "2024-12-11", level: 5 },
                    { date: "2024-12-12", level: 4 },
                    { date: "2024-12-13", level: 5 },
                    { date: "2024-12-14", level: 5 },
                    { date: "2024-12-15", level: 5 }
                ],
                aiAlerts: [
                    {
                        type: "success",
                        severity: "low",
                        message: "Tüm sağlık göstergeleri normal aralıkta",
                        recommendation: "Mevcut bakım rutinine devam edin",
                        date: "2024-12-15"
                    }
                ]
            },
            {
                id: generateUUID(),
                name: "Zeytin",
                species: "Kedi",
                breed: "Sokak Kedisi",
                age: 1,
                birthDate: "2023-07-10",
                gender: "Erkek",
                weight: 3.8,
                photo: "",
                microchipId: "TR555444333",
                color: "Siyah-Beyaz",

                vaccines: [
                    { name: "Kedi Gribi", date: "2024-06-10", nextDate: "2025-06-10", vet: "Dr. Can Öztürk" }
                ],

                medications: [],
                diseases: [
                    { name: "Solunum Yolu Enfeksiyonu", date: "2024-09-15", status: "İyileşti", severity: "Hafif" }
                ],
                allergies: [],

                location: { lat: 41.0200, lng: 28.9900, name: "Fenerbahçe, İstanbul" },
                locationHistory: [
                    { date: "2024-12-16", lat: 41.0200, lng: 28.9900 }
                ],

                gallery: [
                    "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400"
                ],

                feedingInstructions: "Günde 2 öğün yaş mama. Su kabını her gün temizleyin.",
                behaviorNotes: "Çok oyuncu ve meraklı. Her yere tırmanmayı sever. İnsanlara çok bağlı.",
                vetNotes: "Sokaktan kurtarıldı, genel sağlık durumu iyi. Kısırlaştırma planlanıyor.",
                emergencyInfo: "Acil durumda: 0555 222 3344 (Sahip: Ali Yıldız)",

                healthScore: 78,
                weightHistory: [
                    { date: "2024-10-01", weight: 3.5 },
                    { date: "2024-11-01", weight: 3.6 },
                    { date: "2024-12-01", weight: 3.8 }
                ],
                activityHistory: [
                    { date: "2024-12-10", steps: 4500, duration: 80 },
                    { date: "2024-12-11", steps: 4800, duration: 85 },
                    { date: "2024-12-12", steps: 4200, duration: 75 },
                    { date: "2024-12-13", steps: 5100, duration: 95 },
                    { date: "2024-12-14", steps: 4600, duration: 82 },
                    { date: "2024-12-15", steps: 4900, duration: 88 }
                ],
                appetiteHistory: [
                    { date: "2024-12-10", level: 4 },
                    { date: "2024-12-11", level: 5 },
                    { date: "2024-12-12", level: 4 },
                    { date: "2024-12-13", level: 4 },
                    { date: "2024-12-14", level: 5 },
                    { date: "2024-12-15", level: 4 }
                ],
                aiAlerts: [
                    {
                        type: "info",
                        severity: "low",
                        message: "Sağlıklı kilo artışı devam ediyor",
                        recommendation: "Gelişim normal seyrinde, takibe devam edin",
                        date: "2024-12-15"
                    },
                    {
                        type: "warning",
                        severity: "medium",
                        message: "Kısırlaştırma işlemi için uygun yaşa geldi",
                        recommendation: "Veteriner ile görüşerek randevu alın",
                        date: "2024-12-10"
                    }
                ]
            }
        ];

        demoPets.forEach(pet => PetStorage.add(pet));
    }
}

// Render pet cards
function renderPets() {
    const pets = PetStorage.getAll();
    const grid = document.getElementById('pets-grid');
    const emptyState = document.getElementById('empty-state');

    if (pets.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = pets.map(pet => {
        const age = calculateAge(pet.birthDate);
        const emoji = getSpeciesEmoji(pet.species);

        return `
            <div class="pet-card">
                <div class="pet-card-image" onclick="viewPetDetail('${pet.id}')">
                    ${pet.photo ? `<img src="${pet.photo}" alt="${pet.name}" style="width:100%; height:100%; object-fit:cover;">` : emoji}
                    <div class="pet-card-badge">${pet.species}</div>
                </div>
                <div class="pet-card-content">
                    <div class="pet-card-header">
                        <div>
                            <h3 class="pet-card-name">${pet.name}</h3>
                            <p class="pet-card-species">${pet.breed || pet.species}</p>
                        </div>
                    </div>
                    <div class="pet-card-info">
                        <div class="pet-info-item">
                            <span>🎂 Yaş:</span>
                            <span>${age ? age + ' yaşında' : 'Bilinmiyor'}</span>
                        </div>
                        <div class="pet-info-item">
                            <span>⚖️ Ağırlık:</span>
                            <span>${pet.weight ? pet.weight + ' kg' : 'Bilinmiyor'}</span>
                        </div>
                        <div class="pet-info-item">
                            <span>🆔 ID:</span>
                            <span style="font-family: monospace; font-size: 0.85rem;">${pet.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                    <div class="pet-card-actions">
                        <button class="btn-icon btn-view" onclick="viewPetDetail('${pet.id}')">
                            👁️ Görüntüle
                        </button>
                        <button class="btn-icon btn-delete" onclick="openDeleteModal('${pet.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Modal functions
function openAddPetModal() {
    document.getElementById('add-pet-modal').classList.add('active');
}

function closeAddPetModal() {
    document.getElementById('add-pet-modal').classList.remove('active');
    document.getElementById('add-pet-form').reset();
}

let petToDelete = null;

function openDeleteModal(petId) {
    petToDelete = petId;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    petToDelete = null;
    document.getElementById('delete-modal').classList.remove('active');
}

function confirmDelete() {
    if (petToDelete) {
        PetStorage.delete(petToDelete);
        closeDeleteModal();
        renderPets();
    }
}

// Handle add pet form
function handleAddPet(event) {
    event.preventDefault();

    const birthDate = document.getElementById('pet-birthdate').value;
    const age = calculateAge(birthDate);

    const newPet = {
        id: generateUUID(),
        name: document.getElementById('pet-name').value,
        species: document.getElementById('pet-species').value,
        breed: document.getElementById('pet-breed').value || '',
        gender: document.getElementById('pet-gender').value,
        birthDate: birthDate,
        age: age,
        weight: parseFloat(document.getElementById('pet-weight').value) || null,
        microchipId: document.getElementById('pet-microchip').value || '',
        photo: document.getElementById('pet-photo').value || '',
        color: '',

        vaccines: [],
        medications: [],
        diseases: [],
        allergies: [],

        location: { lat: 41.0082, lng: 28.9784, name: "İstanbul" },
        locationHistory: [],
        gallery: [],

        feedingInstructions: '',
        behaviorNotes: '',
        vetNotes: '',
        emergencyInfo: '',

        healthScore: 85,
        weightHistory: [],
        activityHistory: [],
        appetiteHistory: [],
        aiAlerts: []
    };

    PetStorage.add(newPet);
    closeAddPetModal();
    renderPets();
}

// Navigate to pet detail
function viewPetDetail(petId) {
    window.location.href = `pet-detail.html?id=${petId}`;
}

// Close modals on outside click
window.onclick = function (event) {
    const addModal = document.getElementById('add-pet-modal');
    const deleteModal = document.getElementById('delete-modal');

    if (event.target === addModal) {
        closeAddPetModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Only run on pets.html
    if (document.getElementById('pets-grid')) {
        initializeDemoData();
        renderPets();
    }

    // Load user profile if logged in
    loadUserProfile();
});

// User profile management
function loadUserProfile() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const profileBadge = document.getElementById('user-profile-badge');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser && profileBadge) {
        profileBadge.style.display = 'flex';
        profileBadge.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px 15px; background: white; border-radius: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    ${currentUser.emoji || '👤'}
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 700; font-size: 0.9rem; color: #2d3748;">${currentUser.name}</span>
                    <span style="font-size: 0.75rem; color: #718096;">${currentUser.role}</span>
                </div>
            </div>
        `;

        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.onclick = function () {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            };
        }
    }
}
