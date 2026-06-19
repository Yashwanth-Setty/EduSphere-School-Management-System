import { Role } from "./roles";
export interface JwtPayload {
    sub: string;
    email: string;
    roles: Role[];
    schoolId: string;
    iat?: number;
    exp?: number;
}
export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
    roles: Role[];
    schoolId: string;
}
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
}
export interface RefreshResponse {
    accessToken: string;
    expiresIn: number;
}
