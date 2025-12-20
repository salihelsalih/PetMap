/**
 * PetMap Settings Manager
 * Handles API Key storage in LocalStorage
 */

const SETTINGS_HTML = `
<div id="settings-modal" class="modal-overlay" style="display:none;">
    <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
            <h3>⚙️ Ayarlar</h3>
            <button class="close-btn" onclick="closeSettings()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label for="gemini-api-key">Gemini API Anahtarı</label>
                <input type="password" id="gemini-api-key" placeholder="AIzaSy...">
                <small style="color: #666; display: block; margin-top: 8px;">
                    Anahtarınız sadece tarayıcınızda saklanır, sunucuya gönderilmez.
                </small>
            </div>
            <button class="btn btn-primary" style="width: 100%;" onclick="saveSettings()">Kaydet</button>
        </div>
    </div>
</div>
`;

function injectSettingsUI() {
    if (!document.getElementById('settings-modal')) {
        document.body.insertAdjacentHTML('beforeend', SETTINGS_HTML);
    }

    // Add settings button to header if exists
    const nav = document.querySelector('nav');
    if (nav && !document.getElementById('open-settings-btn')) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'open-settings-btn';
        settingsBtn.className = 'btn-settings';
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.onclick = openSettings;
        settingsBtn.title = 'Ayarlar';
        nav.prepend(settingsBtn);
    }
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('gemini-api-key');
    if (modal && input) {
        input.value = localStorage.getItem('PETMAP_GEMINI_KEY') || '';
        modal.style.display = 'flex';
    }
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
}

function saveSettings() {
    const key = document.getElementById('gemini-api-key').value.trim();
    if (key) {
        localStorage.setItem('PETMAP_GEMINI_KEY', key);
        alert('Ayarlar başarıyla kaydedildi!');
        closeSettings();
        // If on index.html, we might want to refresh UI indicators, but not strictly necessary
    } else {
        alert('Lütfen geçerli bir anahtar girin.');
    }
}

// Auto-inject on load
document.addEventListener('DOMContentLoaded', injectSettingsUI);
