import { hashPassword } from '../lib/password';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 用环境变量 MIGRATE_SECRET 保护此接口，防止任意调用
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.MIGRATE_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  const db = env.DB;
  const users = await db.prepare('SELECT * FROM users').all();

  let migrated = 0;
  for (const user of users.results) {
    // 跳过已经迁移过的用户（有 salt 字段表示已哈希）
    if (user.salt) continue;

    const { hash, salt } = await hashPassword(user.password);
    await db.prepare('UPDATE users SET password = ?, salt = ? WHERE id = ?')
      .bind(hash, salt, user.id)
      .run();
    migrated++;
  }

  return new Response(JSON.stringify({ migrated, total: users.results.length }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
