import { hashPassword } from '../lib/password';

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { status: 400 });
    }

    const { hash, salt } = await hashPassword(password);

    const db = env.DB;
    const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (existing) {
      return new Response(JSON.stringify({ error: '用户已存在' }), { status: 409 });
    }

    await db.prepare('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)')
      .bind(username, hash, salt)
      .run();

    return new Response(JSON.stringify({ success: true, username }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
