const recordButton = document.querySelector("#recordButton");
const timer = document.querySelector("#timer");
const recordHint = document.querySelector("#recordHint");
const draft = document.querySelector("#draft");
const preview = document.querySelector("#preview");
const title = document.querySelector("#title");
const notes = document.querySelector("#notes");
let recorder;
let chunks = [];
let startedAt;
let timerId;
let draftBlob;

function formatDuration(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function renderTimer() { timer.textContent = formatDuration(Math.floor((Date.now() - startedAt) / 1000)); }

async function toggleRecording() {
  if (recorder?.state === "recording") { recorder.stop(); return; }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (event) => chunks.push(event.data);
  recorder.onstop = () => { stream.getTracks().forEach((track) => track.stop()); draftBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" }); preview.src = URL.createObjectURL(draftBlob); draft.classList.remove("hidden"); recordHint.textContent = "Review your recording below"; };
  recorder.start(); startedAt = Date.now(); timerId = setInterval(renderTimer, 250); recordButton.classList.add("recording"); recordHint.textContent = "Recording... tap to finish";
}

async function loadNotes() {
  try {
    const response = await fetch("/api/voice-notes");
    if (!response.ok) throw new Error("Unable to load notes");
    const items = await response.json();
    notes.innerHTML = items.length ? items.map((item) => `<article class="note"><div><h2 class="note-title">${escapeHtml(item.title)}</h2><div class="note-meta">${new Date(item.createdTime).toLocaleString()}</div></div><audio controls preload="none" src="${item.url}"></audio></article>`).join("") : '<p class="empty">Your voice archive is quiet.</p>';
  } catch { notes.innerHTML = '<p class="empty">Could not reach the archive.</p>'; }
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

recordButton.addEventListener("click", async () => { try { await toggleRecording(); } catch { recordHint.textContent = "Microphone access is required"; } });
document.querySelector("#discard").addEventListener("click", () => { draft.classList.add("hidden"); preview.removeAttribute("src"); draftBlob = null; });
document.querySelector("#save").addEventListener("click", async () => { if (!draftBlob) return; const button = document.querySelector("#save"); button.disabled = true; const form = new FormData(); form.append("audio", draftBlob, "voice-note.webm"); form.append("title", title.value); const response = await fetch("/api/voice-notes", { method: "POST", body: form }); button.disabled = false; if (!response.ok) { recordHint.textContent = "Could not save this note"; return; } draft.classList.add("hidden"); title.value = ""; timer.textContent = "00:00"; recordHint.textContent = "Tap to begin recording"; loadNotes(); });
document.querySelector("#refresh").addEventListener("click", loadNotes);
loadNotes();
