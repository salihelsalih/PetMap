// ===== Pet Detail Page JavaScript =====

let currentPet = null;
let weightChart = null;
let activityChart = null;
let appetiteChart = null;

// Get pet ID from URL
function getPetIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load and display pet details
function loadPetDetail() {
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
                <button class="btn btn-secondary" onclick="window.location.href='pets.html'">
                    ← Listeye Dön
                </button>
                <button class="btn btn-danger" onclick="deletePet()">
                    🗑️ Sil
                </button>
            </div>
        </div>
    `;
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
        </div>
        <div class="info-row">
            <span class="info-label">Cinsiyet</span>
            <span class="info-value">${currentPet.gender}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Ağırlık</span>
            <span class="info-value">${currentPet.weight ? currentPet.weight + ' kg' : 'Bilinmiyor'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Renk</span>
            <span class="info-value">${currentPet.color || 'Belirtilmemiş'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Mikroçip</span>
            <span class="info-value" style="font-family: monospace;">${currentPet.microchipId || 'Yok'}</span>
        </div>
        <div class="info-row" style="flex-direction: column; align-items: flex-start;">
            <span class="info-label">Alerjiler</span>
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
    // Weight Chart
    if (currentPet.weightHistory && currentPet.weightHistory.length > 0) {
        const ctx = document.getElementById('weight-chart').getContext('2d');
        const data = currentPet.weightHistory;

        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Ağırlık (kg)',
                    data: data.map(d => d.weight),
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

    // Activity Chart
    if (currentPet.activityHistory && currentPet.activityHistory.length > 0) {
        const ctx = document.getElementById('activity-chart').getContext('2d');
        const data = currentPet.activityHistory;

        activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Adım Sayısı',
                    data: data.map(d => d.steps),
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

    // Appetite Chart
    if (currentPet.appetiteHistory && currentPet.appetiteHistory.length > 0) {
        const ctx = document.getElementById('appetite-chart').getContext('2d');
        const data = currentPet.appetiteHistory;

        appetiteChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'İştah Seviyesi',
                    data: data.map(d => d.level),
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

// Render vaccines
function renderVaccines() {
    const vaccines = currentPet.vaccines || [];

    if (vaccines.length === 0) {
        document.getElementById('vaccines-table').innerHTML = '<p style="color: #718096;">Henüz aşı kaydı bulunmuyor.</p>';
        return;
    }

    document.getElementById('vaccines-table').innerHTML = `
        <table class="health-table">
            <thead>
                <tr>
                    <th>Aşı Adı</th>
                    <th>Tarih</th>
                    <th>Sonraki</th>
                    <th>Veteriner</th>
                </tr>
            </thead>
            <tbody>
                ${vaccines.map(v => `
                    <tr>
                        <td><strong>${v.name}</strong></td>
                        <td>${v.date}</td>
                        <td><span class="badge badge-info">${v.nextDate}</span></td>
                        <td>${v.vet}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render medications
function renderMedications() {
    const medications = currentPet.medications || [];

    if (medications.length === 0) {
        document.getElementById('medications-table').innerHTML = '<p style="color: #718096;">Aktif ilaç kullanımı bulunmuyor.</p>';
        return;
    }

    document.getElementById('medications-table').innerHTML = `
        <table class="health-table">
            <thead>
                <tr>
                    <th>İlaç</th>
                    <th>Doz</th>
                    <th>Sıklık</th>
                    <th>Durum</th>
                </tr>
            </thead>
            <tbody>
                ${medications.map(m => `
                    <tr>
                        <td><strong>${m.name}</strong></td>
                        <td>${m.dose}</td>
                        <td>${m.frequency}</td>
                        <td><span class="badge badge-success">${m.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render diseases
function renderDiseases() {
    const diseases = currentPet.diseases || [];

    if (diseases.length === 0) {
        document.getElementById('diseases-list').innerHTML = '<p style="color: #10b981;">✅ Hastalık kaydı bulunmuyor.</p>';
        return;
    }

    document.getElementById('diseases-list').innerHTML = diseases.map(d => {
        const badgeClass = d.status === 'İyileşti' ? 'badge-success' : 'badge-warning';
        return `
            <div style="padding: 12px; background: #f7fafc; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <strong>${d.name}</strong>
                    <span class="badge ${badgeClass}">${d.status}</span>
                </div>
                <div style="font-size: 0.85rem; color: #718096;">
                    📅 ${d.date} • Şiddet: ${d.severity}
                </div>
            </div>
        `;
    }).join('');
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

// AI Health Analysis - HYBRID SYSTEM (tries real API, falls back to default)
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

Türkçe, anlaşılır ve detaylı bir analiz yap.`;

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const analysis = data.candidates[0].content.parts[0].text;
            contentDiv.innerHTML = `
                <div style="line-height: 1.8;">
                    ${analysis.replace(/\n/g, '<br>')}
                    <div style="margin-top: 20px; padding: 15px; background: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981;">
                        <strong>✅ Gerçek AI Analizi:</strong> Bu analiz Gemini AI tarafından gerçek zamanlı olarak oluşturuldu.
                    </div>
                </div>
            `;
            resultDiv.style.display = 'block';
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.warn('⚠️ Real API failed, using default analysis:', error.message);

        // Fallback to default intelligent analysis
        await new Promise(resolve => setTimeout(resolve, 1000));

        const weightTrend = analyzeWeightTrend();
        const activityLevel = analyzeActivityLevel();
        const vaccineStatus = checkVaccineStatus();

        const analysis = `
            <div style="line-height: 1.8;">
                <h4 style="color: var(--primary); margin-bottom: 15px;">📋 Genel Sağlık Değerlendirmesi</h4>
                <p><strong>${currentPet.name}</strong> (${currentPet.species}, ${age} yaşında) için yapılan kapsamlı sağlık analizi sonuçları:</p>
                
                <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">🎯 Sağlık Skoru: ${currentPet.healthScore}/100</h4>
                <p>${getHealthScoreComment(currentPet.healthScore)}</p>
                
                <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">⚖️ Ağırlık Analizi</h4>
                <p>${weightTrend}</p>
                
                <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">🏃 Aktivite Değerlendirmesi</h4>
                <p>${activityLevel}</p>
                
                <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">💉 Aşı ve İlaç Takibi</h4>
                <p>${vaccineStatus}</p>
                
                ${currentPet.allergies && currentPet.allergies.length > 0 ? `
                    <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">⚠️ Alerjiler</h4>
                    <p>Tespit edilen alerjiler: <strong>${currentPet.allergies.join(', ')}</strong>. Bu maddelere maruz kalmaktan kaçının.</p>
                ` : ''}
                
                <h4 style="color: var(--primary); margin-top: 20px; margin-bottom: 10px;">💡 Öneriler</h4>
                <ul style="margin-left: 20px;">
                    ${getRecommendations().map(rec => `<li>${rec}</li>`).join('')}
                </ul>
                
                <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <strong>ℹ️ Yerel Analiz:</strong> Bu analiz yerel veri işleme ile oluşturuldu. Gerçek AI bağlantısı şu anda kullanılamıyor.
                </div>
                
                <div style="margin-top: 15px; padding: 15px; background: #e0f2fe; border-radius: 8px; border-left: 4px solid #0284c7;">
                    <strong>📌 Not:</strong> Bu analiz genel bir değerlendirmedir. Herhangi bir sağlık endişeniz varsa mutlaka veteriner hekiminize danışın.
                </div>
            </div>
        `;

        contentDiv.innerHTML = analysis;
        resultDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 AI Sağlık Analizi Yap';
    }
}

// Helper functions for AI analysis
function analyzeWeightTrend() {
    if (!currentPet.weightHistory || currentPet.weightHistory.length < 2) {
        return `Mevcut ağırlık: ${currentPet.weight} kg. Trend analizi için yeterli veri bulunmuyor.`;
    }

    const history = currentPet.weightHistory;
    const firstWeight = history[0].weight;
    const lastWeight = history[history.length - 1].weight;
    const change = lastWeight - firstWeight;
    const changePercent = ((change / firstWeight) * 100).toFixed(1);

    if (Math.abs(change) < 0.3) {
        return `Ağırlık stabil seyrediyor (${currentPet.weight} kg). Son ${history.length} ölçümde önemli bir değişiklik gözlenmedi. Bu, sağlıklı bir durumdur.`;
    } else if (change > 0) {
        return `Son ${history.length} ölçümde ${Math.abs(change).toFixed(1)} kg artış tespit edildi (%${Math.abs(changePercent)}). ${change > 1 ? '⚠️ Kilo artışı hızlı görünüyor, beslenme programını gözden geçirin.' : '✅ Normal gelişim seyri içinde.'}`;
    } else {
        return `Son ${history.length} ölçümde ${Math.abs(change).toFixed(1)} kg azalma tespit edildi (%${Math.abs(changePercent)}). ${Math.abs(change) > 1 ? '⚠️ Kilo kaybı dikkat gerektiriyor, veteriner kontrolü önerilir.' : '✅ Sağlıklı kilo kaybı trendi.'}`;
    }
}

function analyzeActivityLevel() {
    if (!currentPet.activityHistory || currentPet.activityHistory.length === 0) {
        return 'Aktivite verisi bulunmuyor.';
    }

    const avgSteps = currentPet.activityHistory.reduce((sum, day) => sum + day.steps, 0) / currentPet.activityHistory.length;
    const avgDuration = currentPet.activityHistory.reduce((sum, day) => sum + day.duration, 0) / currentPet.activityHistory.length;

    let assessment = `Ortalama günlük aktivite: ${Math.round(avgSteps)} adım, ${Math.round(avgDuration)} dakika. `;

    if (currentPet.species === 'Köpek') {
        if (avgSteps > 7000) {
            assessment += '✅ Köpekler için mükemmel aktivite seviyesi!';
        } else if (avgSteps > 5000) {
            assessment += '✅ İyi bir aktivite seviyesi, böyle devam edin.';
        } else {
            assessment += '⚠️ Aktivite seviyesi düşük, daha fazla yürüyüş ve oyun önerilir.';
        }
    } else if (currentPet.species === 'Kedi') {
        if (avgSteps > 3000) {
            assessment += '✅ Kediler için harika aktivite seviyesi!';
        } else if (avgSteps > 2000) {
            assessment += '✅ Normal aktivite seviyesi.';
        } else {
            assessment += 'ℹ️ Kediler için normal bir aktivite seviyesi, oyun teşvik edilebilir.';
        }
    }

    return assessment;
}

function checkVaccineStatus() {
    let status = '';

    if (currentPet.vaccines && currentPet.vaccines.length > 0) {
        const upcomingVaccines = currentPet.vaccines.filter(v => {
            const nextDate = new Date(v.nextDate);
            const today = new Date();
            const daysUntil = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));
            return daysUntil <= 60 && daysUntil >= 0;
        });

        if (upcomingVaccines.length > 0) {
            status += `⚠️ <strong>${upcomingVaccines.length} aşı</strong> yakında yenilenmelidir: ${upcomingVaccines.map(v => v.name).join(', ')}. `;
        } else {
            status += '✅ Tüm aşılar güncel. ';
        }
    }

    if (currentPet.medications && currentPet.medications.length > 0) {
        const activeMeds = currentPet.medications.filter(m => m.status === 'Aktif');
        status += `Aktif ${activeMeds.length} ilaç kullanımı devam ediyor. Dozlara düzenli uyulmalı.`;
    } else {
        status += 'Aktif ilaç kullanımı bulunmuyor.';
    }

    return status;
}

function getHealthScoreComment(score) {
    if (score >= 90) {
        return '🌟 Mükemmel sağlık durumu! Tüm göstergeler ideal aralıkta. Mevcut bakım rutinine devam edin.';
    } else if (score >= 80) {
        return '✅ Çok iyi sağlık durumu. Küçük iyileştirmeler yapılabilir ancak genel durum mükemmel.';
    } else if (score >= 70) {
        return '👍 İyi sağlık durumu. Bazı alanlarda iyileştirme fırsatları var.';
    } else if (score >= 60) {
        return '⚠️ Orta düzey sağlık durumu. Veteriner kontrolü ve bakım rutini gözden geçirilmeli.';
    } else {
        return '🚨 Dikkat gerektiren sağlık durumu. Acil veteriner konsültasyonu önerilir.';
    }
}

function getRecommendations() {
    const recommendations = [];

    // Weight-based recommendations
    if (currentPet.weightHistory && currentPet.weightHistory.length >= 2) {
        const change = currentPet.weightHistory[currentPet.weightHistory.length - 1].weight - currentPet.weightHistory[0].weight;
        if (Math.abs(change) > 1) {
            recommendations.push('Ağırlık değişimi nedeniyle beslenme programını veterinerinizle gözden geçirin');
        }
    }

    // Activity-based recommendations
    if (currentPet.activityHistory && currentPet.activityHistory.length > 0) {
        const avgSteps = currentPet.activityHistory.reduce((sum, day) => sum + day.steps, 0) / currentPet.activityHistory.length;
        if (currentPet.species === 'Köpek' && avgSteps < 5000) {
            recommendations.push('Günlük yürüyüş süresini artırın (hedef: 60-90 dakika)');
        }
    }

    // Vaccine recommendations
    if (currentPet.vaccines && currentPet.vaccines.length > 0) {
        const needsVaccine = currentPet.vaccines.some(v => {
            const nextDate = new Date(v.nextDate);
            const today = new Date();
            return (nextDate - today) / (1000 * 60 * 60 * 24) <= 30;
        });
        if (needsVaccine) {
            recommendations.push('Aşı takvimini kontrol edin ve randevu alın');
        }
    }

    // General recommendations
    recommendations.push('Düzenli veteriner kontrolleri yaptırın (yılda en az 1 kez)');
    recommendations.push('Diş sağlığına dikkat edin, düzenli diş temizliği yapın');
    recommendations.push('Bol su tüketimini sağlayın');

    if (currentPet.allergies && currentPet.allergies.length > 0) {
        recommendations.push('Alerji yapan maddelere maruz kalmaktan kaçının');
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
}

// AI Health Analysis
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('pet-header')) {
        loadPetDetail();
        loadUserProfile();

        // AI Analysis button
        document.getElementById('ai-analyze-btn').addEventListener('click', performAIAnalysis);
    }
});

// Delete pet
function deletePet() {
    if (confirm(`${currentPet.name} adlı evcil hayvanı silmek istediğinizden emin misiniz?`)) {
        PetStorage.delete(currentPet.id);
        window.location.href = 'pets.html';
    }
}
