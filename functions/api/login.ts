import jwt from '@tsndr/cloudflare-worker-jwt';
import { verifyPassword } from '../lib/password';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "用户名或密码不能为空" }), { status: 400 });
    }

    const db = env.DB;
    const user = await db.prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号或密码错误" }), { status: 401 });
    }

    // 比对密码 — 优先哈希比对，兼容明文（迁移过渡期）
    const passwordOk = user.salt
      ? await verifyPassword(password, user.password, user.salt)
      : user.password === password;

    if (!passwordOk) {
      return new Response(JSON.stringify({ error: "账号或密码错误" }), { status: 401 });
    }

    const secret = env.JWT_SECRET || "default_secret_key";
    const token = await jwt.sign({
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    }, secret);

    return new Response(JSON.stringify({ success: true, token }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
