export async function onRequestGet(context) {
  const { env, request } = context;

  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "Cloudinary credentials not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");

  let apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`;
  if (tag) {
    apiUrl += `/tags/${tag}`;
  }

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":" + apiSecret)}`
    }
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
