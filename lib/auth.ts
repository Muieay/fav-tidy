import { signJwt,verifyJwt } from './jwt';
import { cookies } from 'next/headers';
// 用户类型定义
export interface User {
  id?: number;
  username: string;
  remark?: string;
}

// 认证结果类型
export interface AuthResult {
  success: boolean;
  token?: string;
}

// 登录验证
export async function authenticateUser(username: string): Promise<AuthResult> {
  const token =  signJwt({ username });

  if (!token) {
    return { success: false };
  }

  return { success: true, token };
}

// 获取当前用户信息
export async function getCurrentUser(): Promise<any> {
      // 检查认证cookie
    const cookieStore =await cookies();
    const authToken = cookieStore.get('auth-token');

  if (!authToken) {
    return null;
  }

  const user = verifyJwt(authToken.value);
  if (!user) {
    return null;
  }
  return user;
}