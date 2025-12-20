/**
 * PetMap AI Service
 * Handles direct client-side communication with Gemini API.
 */

function getApiKey() {
    return localStorage.getItem('PETMAP_GEMINI_KEY');
}

const GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemma-3-1b-it",
    "gemma-3-4b-it",
    "gemma-3-27b-it",
    "gemma-3n-e4b-it",
    "gemma-3n-e2b-it",
    "gemini-3-flash-preview",
    "gemini-2.5-flash-preview-09-2025",
    "gemini-2.5-flash-lite-preview-09-2025",
    "gemini-robotics-er-1.5-preview"
];

async function callGeminiAPI(payload) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("❌ API Anahtarı bulunamadı! Lütfen Ayarlar'dan anahtarınızı girin.");
        return "NO_API_KEY";
    }

    let lastError = "";

    // Fallback logic to iterate through models
    for (const modelName of GEMINI_MODELS) {
        const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;

        // Try both v1 and v1beta version
        for (const apiVersion of ['v1beta', 'v1']) {
            console.log(`🔍 Client: Trying ${apiVersion}/${modelPath}...`);
            const url = `https://generativelanguage.googleapis.com/${apiVersion}/${modelPath}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success with ${apiVersion}/${modelName}`);
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const status = response.status;
                    const errMsg = errorData.error?.message || "Unknown error";

                    console.warn(`⚠️ Error ${status} with ${apiVersion}/${modelName}:`, errMsg);

                    if (status === 429) {
                        lastError = "QUOTA_EXCEEDED";
                        // If quota is exceeded, trying another version of the same model usually doesn't help
                        break;
                    } else if (status === 404) {
                        lastError = `NOT_FOUND: ${apiVersion}/${modelName}`;
                        continue; // Try next version of same model
                    } else {
                        lastError = `API_ERROR_${status}: ${errMsg}`;
                        continue; // Try next version or model
                    }
                }
            } catch (err) {
                console.error(`🚀 Connection failed for ${apiVersion}/${modelPath}:`, err);
                lastError = `FETCH_FAILED: ${err.message}`;
                continue;
            }
        }

        // If we got a result or if quota is exceeded, don't try other models if we already have a quota issue
        if (lastError === "QUOTA_EXCEEDED") break;
    }

    console.error(`💀 All models failed. Last error: ${lastError}`);
    return lastError === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : null;
}

// Export for use in other scripts
window.callGeminiAPI = callGeminiAPI;

// Diagnostic tool
window.testPetMapAI = async () => {
    console.log("🧪 Testing AI Connection...");
    const payload = { contents: [{ parts: [{ text: "Hi" }] }] };
    const result = await callGeminiAPI(payload);
    if (result === "NO_API_KEY") {
        console.error("❌ Test Failed: No API Key found in localStorage.");
    } else if (result === "QUOTA_EXCEEDED") {
        console.error("❌ Test Failed: Quota exceeded.");
    } else if (result) {
        console.log("✅ Test Successful! AI responded:", result);
    } else {
        console.error("❌ Test Failed: Unknown error. Check network tab.");
    }
};
