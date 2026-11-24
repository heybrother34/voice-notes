import { getDriveAccessToken, errorResponse, json } from "./_drive-auth.mts";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  try {
    const id = new URL(request.url).pathname.split("/").filter(Boolean).pop();
    if (!id || id === "get-voice-note") return json({ error: "Note id is required" }, 400);
    const token = await getDriveAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return json({ error: "Voice note not found" }, response.status === 404 ? 404 : 502);
    const audio = await response.arrayBuffer();
    return new Response(audio, { status: 200, headers: { "content-type": response.headers.get("content-type") || "audio/webm", "content-length": String(audio.byteLength), "cache-control": "private, max-age=300" } });
  } catch (error) {
    return errorResponse(error);
  }
}
