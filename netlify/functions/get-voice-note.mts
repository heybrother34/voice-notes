import { getDriveAccessToken, errorResponse, json } from "./_drive-auth.mts";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  try {
    const id = new URL(request.url).pathname.split("/").filter(Boolean).pop();
    if (!id || id === "get-voice-note") return json({ error: "Note id is required" }, 400);
    const token = await getDriveAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return json({ error: "Voice note not found" }, response.status === 404 ? 404 : 502);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    return new Response(btoa(binary), { status: 200, headers: { "content-type": response.headers.get("content-type") || "audio/webm", "content-length": String(bytes.byteLength), "cache-control": "private, max-age=300", "x-nf-encoding": "base64" } });
  } catch (error) {
    return errorResponse(error);
  }
}
