import { cookies } from 'next/headers';

export async function POST() {
  try {
    // 清除认证cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    // 返回成功响应
    return Response.json({
      success: true,
      message: '已成功登出',
    });
  } catch (error) {
    console.error('登出错误:', error);
    return Response.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}