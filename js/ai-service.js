/**
 * PetMap AI Service
 * Handles direct client-side communication with Gemini API.
 * This version uses a secure-ish (exposed) hardcoded key for GitHub Pages deployment.
 */

const GEMINI_API_KEY = "AIzaSyALdkGLHO9PsBUEvgaWp1PejbmVa9zweD8"; // Exposed for GitHub Pages
const GEMINI_MODELS = [
    "models/gemini-2.5-flash",
    "models/gemini-flash-latest",
    "models/gemini-flash-lite-latest",
    "models/gemini-2.5-flash-lite",
    "models/gemma-3-1b-it",
    "models/gemma-3-4b-it",
    "models/gemma-3-27b-it",
    "models/gemma-3n-e4b-it",
    "models/gemma-3n-e2b-it",
    "models/gemini-3-flash-preview",
    "models/gemini-2.5-flash-preview-09-2025",
    "models/gemini-2.5-flash-lite-preview-09-2025",
    "models/gemini-robotics-er-1.5-preview"
];

async function callGeminiAPI(payload) {
    let lastError = "";

    // Fallback logic to iterate through models
    for (const modelName of GEMINI_MODELS) {
        console.log(`🔍 Client: Trying Gemini model: ${modelName}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success with model: ${modelName}`);
                return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
            } else if (response.status === 429) {
                console.warn(`⚠️ Quota exceeded for model: ${modelName}`);
                lastError = "QUOTA_EXCEEDED";
                continue;
            } else {
                const errorData = await response.json().catch(() => null);
                console.error(`❌ Error ${response.status} with ${modelName}:`, errorData || await response.text());
                lastError = `API Error ${response.status}`;
                continue;
            }
        } catch (err) {
            console.error(`🚀 Request failed for ${modelName}:`, err);
            lastError = err.message;
            continue;
        }
    }

    console.error(`💀 All models failed. Last error: ${lastError}`);
    return lastError === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : null;
}

// Export for use in other scripts
window.callGeminiAPI = callGeminiAPI;
