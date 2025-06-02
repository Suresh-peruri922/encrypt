function previewFile() {
  const file = document.getElementById("fileInput").files[0];
  const preview = document.getElementById("preview");
  const img = document.getElementById("previewImg");
  const audio = document.getElementById("previewAudio");

  if (!file) {
    preview.classList.add("hidden");
    img.classList.add("hidden");
    audio.classList.add("hidden");
    return;
  }

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
      img.classList.remove("hidden");
      audio.classList.add("hidden");
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else if (file.type.startsWith("audio/")) {
    const reader = new FileReader();
    reader.onload = () => {
      audio.src = reader.result;
      audio.classList.remove("hidden");
      img.classList.add("hidden");
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    // No preview for other file types
    preview.classList.add("hidden");
    img.classList.add("hidden");
    audio.classList.add("hidden");
  }
}

async function getKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  if (!file || !password) {
    status.textContent = "❗ Please choose a file and enter a password.";
    return;
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);
  const data = await file.arrayBuffer();

  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    const encryptedBytes = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);
    downloadBlob(new Blob([encryptedBytes]), file.name + ".encrypted");
    status.textContent = "✅ File encrypted successfully.";
  } catch (err) {
    status.textContent = "❌ Encryption failed.";
  }
}

async function decryptFile() {
  const file = document.getElementById("fileInput").files[0];
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  if (!file || !password) {
    status.textContent = "❗ Please choose a file and enter a password.";
    return;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);
  const key = await getKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    downloadBlob(new Blob([decrypted]), file.name.replace(".encrypted", ".decrypted"));
    status.textContent = "✅ File decrypted successfully.";
  } catch (err) {
    status.textContent = "❌ Decryption failed. Wrong password or corrupted file.";
  }
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

