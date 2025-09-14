import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth';
import mysql from 'mysql2/promise'

// 创建 MySQL 连接池（推荐）
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  port: Number(process.env.MYSQL_PORT) || 3306,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: { "rejectUnauthorized": true },
  waitForConnections: true,
  connectionLimit: 10,
})

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // 验证请求数据
    if (!username || !password) {
      return Response.json(
        { success: false, message: '账号和密码不能为空' },
        { status: 400 }
      );
    }

      
  const sql = `
    SELECT id,username,password  FROM fav_user WHERE username = ? AND password = ?
  `
  const [rows] = await pool.query(sql, [username, password]) as [any[], any];

  if (rows.length !== 1) {
    return Response.json(
      { success: false, message: '账号或密码错误' },
      { status: 401 }
    );
  }

    const authResult = await authenticateUser(username);
    if (!authResult.success) {
      return Response.json(
        { success: false },
        { status: 401 }
      );
    }

    // 设置认证cookie
    // 在实际应用中，这里应该设置一个安全的JWT令牌
    const cookieStore = await cookies();
    cookieStore.set('auth-token', `${authResult.token}`, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1周
      path: '/',
    });

    // 返回成功响应
    return Response.json({
      success: true,
      user: {
        id: rows[0].id,
        username: rows[0].username,
        token: authResult.token,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    return Response.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}