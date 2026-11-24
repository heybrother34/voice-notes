import { getDriveAccessToken, getDriveFolderId, errorResponse, json } from "./_drive-auth.mts";

const allowedTypes = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"]);

async function readMultipart(request: Request): Promise<{ file: File; title: string }> {
  const form = await request.formData();
  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) throw new Error("Audio file is required");
  if (!allowedTypes.has(file.type)) throw new Error("Unsupported audio format");
  return { file, title: String(form.get("title") || "Untitled voice note").trim().slice(0, 120) };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const { file, title } = await readMultipart(request);
    const token = await getDriveAccessToken();
    const metadata = { name: `${title || "Untitled voice note"} - ${new Date().toISOString()}.${file.type.split("/")[1] || "webm"}`, parents: [getDriveFolderId()], description: JSON.stringify({ title, createdAt: new Date().toISOString() }) };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file, file.name || "voice-note.webm");
    const upload = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,size", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    if (!upload.ok) throw new Error(`Drive upload failed: ${upload.status}`);
    return json(await upload.json(), 201);
  } catch (error) {
    return errorResponse(error);
  }
}