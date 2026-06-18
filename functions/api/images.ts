export async function onRequestGet(context) {
  const { env } = context;

  // 1. 从环境变量里读取密钥（不要写死在代码里）
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  // 这里的逻辑就是你 server.ts 里的逻辑
  // 但要注意：必须通过 context.env 获取变量
  
  const timestamp = Math.round(new Date().getTime() / 1000);
  // 这里需要生成签名（由于 Cloudflare 不支持传统的 cloudinary npm 包，
  // 我们通常直接用 fetch 请求 Cloudinary 的 REST API）
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":" + apiSecret)}`
    }
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
