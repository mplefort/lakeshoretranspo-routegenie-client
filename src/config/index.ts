import dotenv from 'dotenv';
dotenv.config();

export const RG_HOST = process.env.RG_HOST!;
export const RG_CLIENT_ID = process.env.RG_CLIENT_ID!;
export const RG_CLIENT_SECRET = process.env.RG_CLIENT_SECRET!;
export const RG_USER_ID = Number(process.env.RG_USER_ID || '37');

