export const translateText = async (text, targetLang = null, fromLang = null) => {

    const userLanguage = targetLang || localStorage.getItem('Language') || 'en';
    console.log("ususbe",userLanguage);
    
    const apiKey = import.meta.env.VITE_TRANSLATOR_API_KEY;
    const region = import.meta.env.VITE_TRANSLATOR_REGION;

    const endpoint = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0';
    const url = `${endpoint}&to=${userLanguage}${fromLang ? `&from=${fromLang}` : ''}`;

    const headers = {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
    };

    const body = [{ Text: text }];

    console.log('[TRANSLATE] Requesting translation:', {
        text,
        targetLang: userLanguage,
        apiKeyExists: !!apiKey,
        region,
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        const data = await response.json();

        console.log('[TRANSLATE] Response:', data);

        return data?.[0]?.translations?.[0]?.text || text;
    } catch (error) {
        console.error('[TRANSLATE ERROR]', error);
        return text;
    }
};