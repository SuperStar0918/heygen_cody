import axios from 'axios';
import Cookie from 'universal-cookie';

export async function getTokenOrRefresh() {
    const cookie = new Cookie();
    const speechToken = cookie.get('speech-token');
    const speechKey = process.env.NEXT_PUBLIC_SPEECH_KEY;
    const speechRegion =process.env.NEXT_PUBLIC_SPEECH_RESION;
    const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }; 
    if (speechToken === undefined) {
        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            const token = tokenResponse.data;
            const region = speechRegion;
            cookie.set('speech-token', region + ':' + token, {maxAge: 540, path: '/'});

           
            return { authToken: token, region: region };
        } catch (err) {
            console.log("error");
            return { authToken: null, error: "errors" };
        }
    } else {
   
        const idx = speechToken.indexOf(':');
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
    }
}