import { Netlify } from "@netlify/functions";

const driveScope = "https://www.googleapis.com/auth/drive";

function required(name: string): string {
  const value = Netlify.env.get(name);
  if (!value) {
    throw new Error(`Missing Netlify environment variable: ${name}`);
  }
  return value;
}

export async function getDriveAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: required("GOOGLE_CLIENT_ID"),
    client_secret: required("GOOGLE_CLIENT_SECRET"),
    refresh_token: required("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
    scope: driveScope,
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Google OAuth failed: ${response.status}`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google OAuth returned no access token");
  return data.access_token;
}

export function getDriveFolderId(): string {
  return required("GOOGLE_DRIVE_FOLDER_ID");
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function errorResponse(error: unknown): Response {
  console.error(error);
  return json({ error: "Unable to process voice note" }, 500);
}