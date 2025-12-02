const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }
    const baseApiUrl = process.env.NEXT_PUBLIC_BASE_API_URL;

    const res = await fetch(`${baseApiUrl}/v1/streaming.create_token`, {
      method: "POST",
      headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      "x-api-key": "sk_V2_hgu_k82EGXaDiiy_QqiAqfj0sOyqhCIY7PPLq1XRTlDUNwS7"
      },
      body: JSON.stringify({})
    });

    console.log("Response:", res);
    console.log(HEYGEN_API_KEY);
    // console.log(data);
    const data = await res.json();
    return new Response(data.data.token, {
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving access token:", error);

    return new Response("Failed to retrieve access token", {
      status: 500,
    });
  }
}
