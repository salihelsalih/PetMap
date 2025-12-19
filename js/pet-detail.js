// ===== Pet Detail Page JavaScript =====

let currentPet = null;
let weightChart = null;
let activityChart = null;
let appetiteChart = null;
let isEditMode = false;

// Get pet ID from URL
function getPetIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load and display pet details
function loadPetDetail() {
    console.log("loadPetDetail started, isEditMode:", isEditMode);
    const petId = getPetIdFromURL();
    if (!petId) {
        window.location.href = 'pets.html';
        return;
    }

    currentPet = PetStorage.getById(petId);
    if (!currentPet) {
        alert('Evcil hayvan bulunamadı!');
        window.location.href = 'pets.html';
        return;
    }

    try {
        renderPetHeader();
        renderBasicInfo();
        renderHealthScore();
        renderLocation();
        renderAIAlerts();
        renderHealthCharts();
        renderVaccines();
        renderMedications();
        renderDiseases();
        renderGallery();
        renderNotes();
        console.log("loadPetDetail completed successfully");
    } catch (error) {
        console.error("Error in loadPetDetail:", error);
    }
}

// Render pet header
function renderPetHeader() {
    const emoji = getSpeciesEmoji(currentPet.species);
    const age = calculateAge(currentPet.birthDate);

    document.getElementById('pet-header').innerHTML = `
        <div class="pet-detail-photo">
            ${currentPet.photo ? `<img src="${currentPet.photo}" alt="${currentPet.name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` : emoji}
        </div>
        <div class="pet-detail-info">
            <h1 class="pet-detail-name">${currentPet.name}</h1>
            <div class="pet-detail-meta">
                <div class="pet-meta-item">
                    <span style="font-size: 1.2rem;">${emoji}</span>
                    <span><strong>${currentPet.species}</strong> ${currentPet.breed ? '• ' + currentPet.breed : ''}</span>
                </div>
                <div class="pet-meta-item">
                    <span>🎂</span>
                    <span>${age ? age + ' yaşında' : 'Yaş bilinmiyor'}</span>
                </div>
                <div class="pet-meta-item">
                    <span>${currentPet.gender === 'Erkek' ? '♂️' : '♀️'}</span>
                    <span>${currentPet.gender}</span>
                </div>
            </div>
            <div class="pet-id-badge">
                ID: ${currentPet.id}
            </div>
            <div class="pet-detail-actions">
                <button class="btn ${isEditMode ? 'btn-success' : 'btn-primary'}" onclick="toggleEditMode()">
                    ${isEditMode ? '✅ Düzenlemeyi Bitir' : '📝 Düzenle'}
                </button>
                <button class="btn btn-danger" onclick="deletePet()">
                    🗑️ Sil
                </button>
            </div>
        </div>
    `;
}

// Toggle Edit Mode
function toggleEditMode() {
    isEditMode = !isEditMode;
    loadPetDetail(); // Re-render everything
}

// Render basic info
function renderBasicInfo() {
    const allergiesHTML = currentPet.allergies && currentPet.allergies.length > 0
        ? currentPet.allergies.map(a => `<span class="badge badge-warning">${a}</span>`).join(' ')
        : '<span style="color: #10b981;">Yok</span>';

    document.getElementById('basic-info').innerHTML = `
        <div class="info-row">
            <span class="info-label">Doğum Tarihi</span>
            <span class="info-value">${currentPet.birthDate || 'Bilinmiyor'}</span>
            ${isEditMode ? `<button class="btn-edit-small" onclick="openEditModal('basic', 'birthDate')">✏️</button>` : ''}
        </div>
        <div class="info-row">
            <span class="info-label">Cinsiyet</span>
            <span class="info-value">${currentPet.gender}</span>
            ${isEditMode ? `<button class="btn-edit-small" onclick="openEditModal('basic', 'gender')">✏️</button>` : ''}
        </div>
        <div class="info-row">
            <span class="info-label">Ağırlık</span>
            <span class="info-value">${currentPet.weight ? currentPet.weight + ' kg' : 'Bilinmiyor'}</span>
            ${isEditMode ? `<button class="btn-edit-small" onclick="openEditModal('basic', 'weight')">✏️</button>` : ''}
        </div>
        <div class="info-row">
            <span class="info-label">Renk</span>
            <span class="info-value">${currentPet.color || 'Belirtilmemiş'}</span>
            ${isEditMode ? `<button class="btn-edit-small" onclick="openEditModal('basic', 'color')">✏️</button>` : ''}
        </div>
        <div class="info-row">
            <span class="info-label">Mikroçip</span>
            <span class="info-value" style="font-family: monospace;">${currentPet.microchipId || 'Yok'}</span>
            ${isEditMode ? `<button class="btn-edit-small" onclick="openEditModal('basic', 'microchipId')">✏️</button>` : ''}
        </div>
        <div class="info-row" style="flex-direction: column; align-items: flex-start;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="info-label">Alerjiler</span>
                ${isEditMode ? `<button class="btn-edit-small" onclick="openEditModal('basic', 'allergies')">✏️</button>` : ''}
            </div>
            <div style="margin-top: 8px;">${allergiesHTML}</div>
        </div>
    `;
}

// Render health score with gauge
function renderHealthScore() {
    const score = currentPet.healthScore || 0;
    const scoreDeg = (score / 100) * 360;

    let scoreColor = '#10b981'; // Green
    let scoreLabel = 'Mükemmel';

    if (score < 40) {
        scoreColor = '#dc2626'; // Red
        scoreLabel = 'Acil';
    } else if (score < 60) {
        scoreColor = '#f59e0b'; // Orange
        scoreLabel = 'Uyarı';
    } else if (score < 80) {
        scoreColor = '#eab308'; // Yellow
        scoreLabel = 'Dikkat';
    }

    document.getElementById('health-score-display').innerHTML = `
        <div class="health-score-gauge">
            <div class="score-circle" style="background: conic-gradient(from 0deg, ${scoreColor} 0deg, ${scoreColor} ${scoreDeg}deg, #e5e7eb ${scoreDeg}deg, #e5e7eb 360deg);">
                <div style="width: 160px; height: 160px; background: white; border-radius: 50%; position: absolute;"></div>
                <div class="score-value" style="position: relative; z-index: 1; color: ${scoreColor};">${score}</div>
            </div>
        </div>
        <div class="score-label" style="color: ${scoreColor}; font-weight: 600; font-size: 1.2rem;">
            ${scoreLabel}
        </div>
        <p style="color: #718096; margin-top: 10px; font-size: 0.9rem;">
            Genel sağlık durumu değerlendirmesi
        </p>
    `;
}

// Render location and map
function renderLocation() {
    const loc = currentPet.location;
    document.getElementById('location-info').innerHTML = `
        <div class="info-row">
            <span class="info-label">Son Konum</span>
            <span class="info-value">${loc.name || 'Bilinmiyor'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Koordinatlar</span>
            <span class="info-value" style="font-family: monospace; font-size: 0.85rem;">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</span>
        </div>
    `;

    // Initialize map
    setTimeout(() => {
        const map = L.map('pet-map').setView([loc.lat, loc.lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const petEmoji = getSpeciesEmoji(currentPet.species);
        const customIcon = L.divIcon({
            html: `<div style="font-size: 2rem;">${petEmoji}</div>`,
            className: 'custom-marker',
            iconSize: [40, 40]
        });

        L.marker([loc.lat, loc.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`<b>${currentPet.name}</b><br>${loc.name}`);
    }, 100);
}

// Render AI alerts
function renderAIAlerts() {
    const alerts = currentPet.aiAlerts || [];

    if (alerts.length === 0) {
        document.getElementById('ai-alerts').innerHTML = `
            <div class="ai-alert success">
                <div class="ai-alert-icon">✅</div>
                <div class="ai-alert-content">
                    <div class="ai-alert-message">Herhangi bir uyarı bulunmuyor</div>
                    <div class="ai-alert-recommendation">Tüm sağlık göstergeleri normal aralıkta</div>
                </div>
            </div>
        `;
        return;
    }

    document.getElementById('ai-alerts').innerHTML = alerts.map(alert => {
        const icons = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            danger: '🚨'
        };

        return `
            <div class="ai-alert ${alert.type}">
                <div class="ai-alert-icon">${icons[alert.type] || 'ℹ️'}</div>
                <div class="ai-alert-content">
                    <div class="ai-alert-message">${alert.message}</div>
                    <div class="ai-alert-recommendation">💡 ${alert.recommendation}</div>
                    <div class="ai-alert-date">📅 ${alert.date}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render health charts
function renderHealthCharts() {
    console.log("renderHealthCharts called");

    // Destroy existing charts if they exist
    if (weightChart) weightChart.destroy();
    if (activityChart) activityChart.destroy();
    if (appetiteChart) appetiteChart.destroy();

    // Weight Chart
    if (currentPet.weightHistory && currentPet.weightHistory.length > 0) {
        const canvas = document.getElementById('weight-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            weightChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: currentPet.weightHistory.map(d => d.date),
                    datasets: [{
                        label: 'Ağırlık (kg)',
                        data: currentPet.weightHistory.map(d => d.weight),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function (value) {
                                    return value + ' kg';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Activity Chart
    if (currentPet.activityHistory && currentPet.activityHistory.length > 0) {
        const canvas = document.getElementById('activity-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            activityChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: currentPet.activityHistory.map(d => d.date),
                    datasets: [{
                        label: 'Adım Sayısı',
                        data: currentPet.activityHistory.map(d => d.steps),
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // Appetite Chart
    if (currentPet.appetiteHistory && currentPet.appetiteHistory.length > 0) {
        const canvas = document.getElementById('appetite-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            appetiteChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: currentPet.appetiteHistory.map(d => d.date),
                    datasets: [{
                        label: 'İştah Seviyesi',
                        data: currentPet.appetiteHistory.map(d => d.level),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }
    }
}

// Render vaccines
function renderVaccines() {
    console.log("renderVaccines called, isEditMode:", isEditMode);
    const container = document.getElementById('vaccines-table');
    if (!container) return;

    const vaccines = currentPet.vaccines || [];
    let html = '';

    if (vaccines.length === 0) {
        html = '<p style="color: #718096;">Henüz aşı kaydı bulunmuyor.</p>';
    } else {
        html = `
            <div class="table-responsive">
                <table class="health-table">
                    <thead>
                        <tr>
                            <th>Aşı Adı</th>
                            <th>Tarih</th>
                            <th>Sonraki</th>
                            <th>Veteriner</th>
                            ${isEditMode ? '<th>İşlem</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${vaccines.map((v, index) => `
                            <tr>
                                <td><strong>${v.name}</strong></td>
                                <td>${v.date}</td>
                                <td><span class="badge badge-info">${v.nextDate}</span></td>
                                <td>${v.vet}</td>
                                ${isEditMode ? `
                                    <td>
                                        <div style="display: flex; gap: 5px;">
                                            <button class="btn-edit-small" onclick="openEditModal('vaccine', ${index})">✏️</button>
                                            <button class="btn-edit-small btn-danger-small" onclick="deleteRecord('vaccine', ${index})">🗑️</button>
                                        </div>
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (isEditMode) {
        console.log("Appending Add Vaccine button");
        html += `
            <button class="btn-add-record" onclick="openEditModal('vaccine')">
                ➕ Yeni Aşı Kaydı Ekle
            </button>
        `;
    }

    container.innerHTML = html;
}

// Render medications
function renderMedications() {
    console.log("renderMedications called, isEditMode:", isEditMode);
    const container = document.getElementById('medications-table');
    if (!container) return;

    const medications = currentPet.medications || [];
    let html = '';

    if (medications.length === 0) {
        html = '<p style="color: #718096;">Aktif ilaç kullanımı bulunmuyor.</p>';
    } else {
        html = `
            <div class="table-responsive">
                <table class="health-table">
                    <thead>
                        <tr>
                            <th>İlaç</th>
                            <th>Doz</th>
                            <th>Sıklık</th>
                            <th>Durum</th>
                            ${isEditMode ? '<th>İşlem</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${medications.map((m, index) => `
                            <tr>
                                <td><strong>${m.name}</strong></td>
                                <td>${m.dose}</td>
                                <td>${m.frequency}</td>
                                <td><span class="badge badge-success">${m.status}</span></td>
                                ${isEditMode ? `
                                    <td>
                                        <div style="display: flex; gap: 5px;">
                                            <button class="btn-edit-small" onclick="openEditModal('medication', ${index})">✏️</button>
                                            <button class="btn-edit-small btn-danger-small" onclick="deleteRecord('medication', ${index})">🗑️</button>
                                        </div>
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (isEditMode) {
        console.log("Appending Add Medication button");
        html += `
            <button class="btn-add-record" onclick="openEditModal('medication')">
                ➕ Yeni İlaç Kaydı Ekle
            </button>
        `;
    }

    container.innerHTML = html;
}

// Render diseases
function renderDiseases() {
    console.log("renderDiseases called, isEditMode:", isEditMode);
    const container = document.getElementById('diseases-list');
    if (!container) return;

    const diseases = currentPet.diseases || [];
    let html = '';

    if (diseases.length === 0) {
        html = '<p style="color: #10b981;">✅ Hastalık kaydı bulunmuyor.</p>';
    } else {
        html = diseases.map((d, index) => {
            const badgeClass = d.status === 'İyileşti' ? 'badge-success' : 'badge-warning';
            return `
                <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                        <strong>${d.name}</strong>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="badge ${badgeClass}">${d.status}</span>
                            ${isEditMode ? `
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn-edit-small" onclick="openEditModal('disease', ${index})">✏️</button>
                                    <button class="btn-edit-small btn-danger-small" onclick="deleteRecord('disease', ${index})">🗑️</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: #718096;">
                        📅 ${d.date} • Şiddet: ${d.severity}
                    </div>
                </div>
            `;
        }).join('');
    }

    if (isEditMode) {
        console.log("Appending Add Disease button");
        html += `
            <button class="btn-add-record" onclick="openEditModal('disease')">
                ➕ Yeni Hastalık Kaydı Ekle
            </button>
        `;
    }

    container.innerHTML = html;
}

// Render gallery
function renderGallery() {
    const gallery = currentPet.gallery || [];

    if (gallery.length === 0) {
        document.getElementById('photo-gallery').innerHTML = `
            <div class="gallery-placeholder" style="grid-column: 1 / -1; height: 200px;">
                <div>
                    <div style="font-size: 3rem; margin-bottom: 10px;">📷</div>
                    <p style="color: #718096;">Henüz fotoğraf eklenmemiş</p>
                </div>
            </div>
        `;
        return;
    }

    document.getElementById('photo-gallery').innerHTML = gallery.map(url => `
        <div class="gallery-item">
            <img src="${url}" alt="${currentPet.name}" loading="lazy">
        </div>
    `).join('');
}

// Render notes
function renderNotes() {
    document.getElementById('feeding-instructions').textContent = currentPet.feedingInstructions || 'Belirtilmemiş';
    document.getElementById('behavior-notes').textContent = currentPet.behaviorNotes || 'Belirtilmemiş';
    document.getElementById('vet-notes').textContent = currentPet.vetNotes || 'Belirtilmemiş';
    document.getElementById('emergency-info').textContent = currentPet.emergencyInfo || 'Belirtilmemiş';
}

// AI Health Analysis - Real AI Only
async function performAIAnalysis() {
    const btn = document.getElementById('ai-analyze-btn');
    const resultDiv = document.getElementById('ai-analysis-result');
    const contentDiv = document.getElementById('ai-analysis-content');

    btn.disabled = true;
    btn.textContent = '🤖 Analiz Yapılıyor...';

    // Prepare data for AI
    const age = calculateAge(currentPet.birthDate);

    const prompt = `Sen bir veteriner yapay zeka asistanısın. Aşağıdaki evcil hayvan sağlık verilerini analiz et ve detaylı bir değerlendirme yap:

Hayvan: ${currentPet.name} (${currentPet.species}, ${age} yaşında)
Mevcut Ağırlık: ${currentPet.weight} kg
Sağlık Skoru: ${currentPet.healthScore}/100

Ağırlık Geçmişi: ${JSON.stringify(currentPet.weightHistory)}
Aktivite Geçmişi: ${JSON.stringify(currentPet.activityHistory)}
İştah Geçmişi: ${JSON.stringify(currentPet.appetiteHistory)}

Aşılar: ${JSON.stringify(currentPet.vaccines)}
İlaçlar: ${JSON.stringify(currentPet.medications)}
Hastalıklar: ${JSON.stringify(currentPet.diseases)}
Alerjiler: ${JSON.stringify(currentPet.allergies)}

Lütfen şunları değerlendir:
1. Genel sağlık durumu
2. Ağırlık trendindeki anormallikler
3. Aktivite seviyesi değerlendirmesi
4. İştah değişimleri
5. Aşı ve ilaç takibi
6. Öneriler ve uyarılar

Türkçe, profesyonel ve detaylı bir analiz yap. Yanıtını markdown formatında düzenle.`;

    try {
        const analysis = await window.callGeminiAPI({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        if (!analysis) {
            throw new Error(`AI connection failed`);
        }

        // Render marked down content if possible
        if (typeof marked !== 'undefined') {
            contentDiv.innerHTML = marked.parse(analysis);
        } else {
            contentDiv.innerHTML = analysis.replace(/\n/g, '<br>');
        }

        contentDiv.innerHTML += `
                <div style="margin-top: 20px; padding: 15px; background: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
                    <strong>✅ Gerçek AI Analizi:</strong> Bu analiz Gemini AI tarafından gerçek zamanlı olarak oluşturuldu.
                </div>
            `;
        resultDiv.style.display = 'block';

        // Also refresh alerts based on this analysis if needed
        refreshAIAlerts(analysis);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        contentDiv.innerHTML = `<div style="color: #dc2626; padding: 15px; background: #fee2e2; border-radius: 8px;">
            ⚠️ <strong>Hata:</strong> Yapay zeka analizi şu an gerçekleştirilemiyor. Lütfen API anahtarını ve bağlantınızı kontrol edin.
        </div>`;
        resultDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 AI Sağlık Analizi Yap';
    }
}

// New logic to refresh alerts using AI
async function refreshAIAlerts(optionalContext = "") {
    console.log("Refreshing AI Alerts...");

    const prompt = `
    GÖREV: Evcil hayvanın sağlık verilerine dayanarak 1-3 adet kısa "Akıllı Uyarı" (Alert) oluştur.
    
    VERİLER:
    Hayvan: ${currentPet.name} (${currentPet.species})
    Geçmiş Veriler: ${JSON.stringify({
        weight: currentPet.weightHistory,
        activity: currentPet.activityHistory,
        appetite: currentPet.appetiteHistory,
        vaccines: currentPet.vaccines
    })}
    Ek Bağlam: ${optionalContext.substring(0, 500)}
    
    ÇIKTI FORMATI (SADECE JSON):
    [
        {
            "type": "success|info|warning|danger",
            "severity": "low|medium|high",
            "message": "Kısa uyarı başlığı",
            "recommendation": "Kısa öneri cümlesi",
            "date": "2024-12-18"
        }
    ]
    `;

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
            let text = data.candidates[0].content.parts[0].text;
            let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const alerts = JSON.parse(cleanJson);

            if (Array.isArray(alerts)) {
                currentPet.aiAlerts = alerts;
                PetStorage.update(currentPet.id, { aiAlerts: alerts });
                renderAIAlerts();
            }
        }
    } catch (err) {
        console.error("Alert Refresh Error:", err);
    }
}

// Helper functions removed as we use real AI now
// (Keeping empty block to maintain structure if needed)

// Initial load
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('pet-header')) {
        loadPetDetail();
        loadUserProfile();

        // AI Analysis button
        document.getElementById('ai-analyze-btn').addEventListener('click', performAIAnalysis);
    }
});

// Modal Logic
let currentEditType = null;
let currentEditIndex = null;

function openEditModal(type, target) {
    currentEditType = type;
    currentEditIndex = (typeof target === 'number') ? target : null;
    const isNew = currentEditIndex === null;

    const modal = document.getElementById('edit-record-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-form-content');

    modal.classList.add('active');

    let html = '';

    if (type === 'basic') {
        const field = target;
        title.textContent = 'Temel Bilgi Düzenle';

        if (field === 'birthDate') {
            html = `<div class="form-group"><label>Doğum Tarihi</label><input type="date" name="birthDate" value="${currentPet.birthDate || ''}" required></div>`;
        } else if (field === 'gender') {
            html = `<div class="form-group"><label>Cinsiyet</label><select name="gender" class="form-control"><option value="Erkek" ${currentPet.gender === 'Erkek' ? 'selected' : ''}>Erkek</option><option value="Dişi" ${currentPet.gender === 'Dişi' ? 'selected' : ''}>Dişi</option></select></div>`;
        } else if (field === 'weight') {
            html = `<div class="form-group"><label>Ağırlık (kg)</label><input type="number" step="0.1" name="weight" value="${currentPet.weight || ''}" required></div>`;
        } else if (field === 'color') {
            html = `<div class="form-group"><label>Renk</label><input type="text" name="color" value="${currentPet.color || ''}" required></div>`;
        } else if (field === 'microchipId') {
            html = `<div class="form-group"><label>Mikroçip ID</label><input type="text" name="microchipId" value="${currentPet.microchipId || ''}"></div>`;
        } else if (field === 'allergies') {
            html = `<div class="form-group"><label>Alerjiler (Virgülle ayırın)</label><input type="text" name="allergies" value="${(currentPet.allergies || []).join(', ')}"></div>`;
        }
        currentEditIndex = field; // Use field name as index for basic info
    } else if (type === 'vaccine') {
        title.textContent = isNew ? 'Yeni Aşı Ekle' : 'Aşı Kaydı Düzenle';
        const data = isNew ? { name: '', date: '', nextDate: '', vet: '' } : currentPet.vaccines[currentEditIndex];
        html = `
            <div class="form-group"><label>Aşı Adı</label><input type="text" name="name" value="${data.name}" required></div>
            <div class="form-group"><label>Uyapılma Tarihi</label><input type="date" name="date" value="${data.date}" required></div>
            <div class="form-group"><label>Sonraki Tarih</label><input type="date" name="nextDate" value="${data.nextDate}" required></div>
            <div class="form-group"><label>Veteriner</label><input type="text" name="vet" value="${data.vet}" required></div>
        `;
    } else if (type === 'medication') {
        title.textContent = isNew ? 'Yeni İlaç Ekle' : 'İlaç Kaydı Düzenle';
        const data = isNew ? { name: '', dose: '', frequency: '', status: 'Aktif' } : currentPet.medications[currentEditIndex];
        html = `
            <div class="form-group"><label>İlaç Adı</label><input type="text" name="name" value="${data.name}" required></div>
            <div class="form-group"><label>Dozaj</label><input type="text" name="dose" value="${data.dose}" required></div>
            <div class="form-group"><label>Sıklık</label><input type="text" name="frequency" value="${data.frequency}" required></div>
            <div class="form-group"><label>Durum</label><select name="status" class="form-control"><option value="Aktif" ${data.status === 'Aktif' ? 'selected' : ''}>Aktif</option><option value="Pasif" ${data.status === 'Pasif' ? 'selected' : ''}>Pasif</option><option value="Tamamlandı" ${data.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option></select></div>
        `;
    } else if (type === 'disease') {
        title.textContent = isNew ? 'Yeni Hastalık Kaydı Ekle' : 'Hastalık Kaydı Düzenle';
        const data = isNew ? { name: '', date: '', status: 'Devam Ediyor', severity: 'Orta' } : currentPet.diseases[currentEditIndex];
        html = `
            <div class="form-group"><label>Hastalık/Teşhis</label><input type="text" name="name" value="${data.name}" required></div>
            <div class="form-group"><label>Teşhis Tarihi</label><input type="date" name="date" value="${data.date}" required></div>
            <div class="form-group"><label>Durum</label><select name="status" class="form-control"><option value="Devam Ediyor" ${data.status === 'Devam Ediyor' ? 'selected' : ''}>Devam Ediyor</option><option value="İyileşti" ${data.status === 'İyileşti' ? 'selected' : ''}>İyileşti</option><option value="Kronik" ${data.status === 'Kronik' ? 'selected' : ''}>Kronik</option></select></div>
            <div class="form-group"><label>Şiddet</label><select name="severity" class="form-control"><option value="Hafif" ${data.severity === 'Hafif' ? 'selected' : ''}>Hafif</option><option value="Orta" ${data.severity === 'Orta' ? 'selected' : ''}>Orta</option><option value="Ağır" ${data.severity === 'Ağır' ? 'selected' : ''}>Ağır</option></select></div>
        `;
    }

    content.innerHTML = html;
}

function closeEditModal() {
    document.getElementById('edit-record-modal').classList.remove('active');
    document.getElementById('edit-record-form').reset();
}

function handleSaveRecord(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    if (currentEditType === 'basic') {
        const field = currentEditIndex;
        let value = data[field];
        if (field === 'weight') value = parseFloat(value);
        if (field === 'allergies') value = value.split(',').map(s => s.trim()).filter(s => s !== '');

        currentPet[field] = value;
    } else if (currentEditType === 'vaccine') {
        if (currentEditIndex === null) {
            if (!currentPet.vaccines) currentPet.vaccines = [];
            currentPet.vaccines.push(data);
        } else {
            currentPet.vaccines[currentEditIndex] = data;
        }
    } else if (currentEditType === 'medication') {
        if (currentEditIndex === null) {
            if (!currentPet.medications) currentPet.medications = [];
            currentPet.medications.push(data);
        } else {
            currentPet.medications[currentEditIndex] = data;
        }
    } else if (currentEditType === 'disease') {
        if (currentEditIndex === null) {
            if (!currentPet.diseases) currentPet.diseases = [];
            currentPet.diseases.push(data);
        } else {
            currentPet.diseases[currentEditIndex] = data;
        }
    }

    PetStorage.update(currentPet.id, currentPet);
    closeEditModal();
    loadPetDetail();

    if (typeof showToast === 'function') {
        showToast('Kayıt başarıyla güncellendi', 'success');
    }
}

function deleteRecord(type, index) {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;

    if (type === 'vaccine') {
        currentPet.vaccines.splice(index, 1);
    } else if (type === 'medication') {
        currentPet.medications.splice(index, 1);
    } else if (type === 'disease') {
        currentPet.diseases.splice(index, 1);
    }

    PetStorage.update(currentPet.id, currentPet);
    loadPetDetail();

    if (typeof showToast === 'function') {
        showToast('Kayıt silindi', 'info');
    }
}

// Delete pet
function deletePet() {
    if (confirm(`${currentPet.name} adlı evcil hayvanı silmek istediğinizden emin misiniz?`)) {
        PetStorage.delete(currentPet.id);
        window.location.href = 'pets.html';
    }
}
