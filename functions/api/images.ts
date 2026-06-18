const MAX_TOTAL = 10000;

async function fetchAll(context, baseUrl) {
  const { env } = context;
  const auth = btoa(env.CLOUDINARY_API_KEY + ":" + env.CLOUDINARY_API_SECRET);
  const allResources = [];
  let nextCursor = null;

  while (allResources.length < MAX_TOTAL) {
    let url = nextCursor
      ? `${baseUrl}&next_cursor=${nextCursor}`
      : baseUrl;

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` }
    });

    if (!res.ok) break;

    const data = await res.json();

    if (Array.isArray(data.resources)) {
      for (const r of data.resources) {
        if (r && r.public_id && r.format && r.version && r.width && r.height) {
          allResources.push(r);
        }
      }
    }

    if (!data.next_cursor) break;
    nextCursor = data.next_cursor;
  }

  return { resources: allResources };
}

export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return new Response(JSON.stringify({ error: "Cloudinary credentials not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const tag = new URL(request.url).searchParams.get("tag");

  let baseUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image?max_results=500`;
  if (tag && tag !== "selfie") {
    baseUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/image/tags/${tag}?max_results=500`;
  }

  const data = await fetchAll(context, baseUrl);

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
