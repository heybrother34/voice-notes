import { getDriveAccessToken, getDriveFolderId, errorResponse, json } from "./_drive-auth.mts";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  try {
    const token = await getDriveAccessToken();
    const params = new URLSearchParams({ q: `'${getDriveFolderId()}' in parents and trashed = false`, fields: "files(id,name,mimeType,createdTime,size,description)", orderBy: "createdTime desc", pageSize: "100" });
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Drive list failed: ${response.status}`);
    const data = (await response.json()) as { files?: Array<{ id: string; name: string; mimeType: string; createdTime: string; size?: string; description?: string }> };
    const notes = (data.files || []).filter((file) => file.mimeType.startsWith("audio/")).map((file) => {
      let title = file.name.replace(/\s-\s[^-]+\.[^.]+$/, "");
      try { title = JSON.parse(file.description || "{}").title || title; } catch { /* filename is the fallback */ }
      return { ...file, title, url: `/api/voice-notes/${file.id}` };
    });
    return json(notes);
  } catch (error) {
    return errorResponse(error);
  }
}
