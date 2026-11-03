import { env } from 'cloudflare:workers';
import { handleCampRequest } from '@/lib/camp-api.mjs';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) => handleCampRequest(request, env);
export const POST = (request: Request) => handleCampRequest(request, env);
