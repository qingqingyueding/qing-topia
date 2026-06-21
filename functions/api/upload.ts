const FOLDER_MAP = {
  aurora: "A Rendezvous with the Aurora",
  cosplay: "cosplay",
  celestial: "Mirror of the Sky",
  cat: "Ragdoll cat photo",
  sakura: "Sakura_Photography",
  selfie: "selfie",
  dali: "yunnandali",
};

async function sha1(data) {
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function uploadToCloudinary(env, file, name, tags) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  const timestamp = Math.round(Date.now() / 1000);

  const folder = FOLDER_MAP[tags] || "";

  const params = { timestamp: String(timestamp) };
  if (name) params.public_id = name;
  if (folder) params.folder = folder;
  if (tags) params.tags = tags;

  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  const signature = await sha1(sorted + CLOUDINARY_API_SECRET);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  if (name) formData.append("public_id", name);
  if (folder) formData.append("folder", folder);
  if (tags) formData.append("tags", tags);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  return res.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const name = formData.get("name") || "";
    const tags = formData.get("tags") || "";

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "请选择一张图片" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await uploadToCloudinary(env, file, name, tags);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, resource: result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
