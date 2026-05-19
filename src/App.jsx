import { useState, useRef } from "react";
import './App.css';

const BEAN_SRC = "./src/assets/bean.png";

function App() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(null);
  const [fileType, setFileType] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [doneLocked, setDoneLocked] = useState(false);
  const [doneClicked, setDoneClicked] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [beanBounce, setBeanBounce] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const picked = e.target.files[0];
    if (!picked) return;

    setFile(picked);
    setFileName(picked.name);
    setFileSize((picked.size / 1024).toFixed(1));
    setFileType(picked.type || picked.name.split(".").pop().toUpperCase());
    setDoneLocked(false);
    setDoneClicked(false);
    setReadyToSubmit(false);

    setBeanBounce(true);
    setTimeout(() => setBeanBounce(false), 600);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
    if (doneClicked) setDoneLocked(false);
  };

  const handleDone = () => {
    if (!file || doneLocked) return;
    setDoneLocked(true);
    setDoneClicked(true);
    setReadyToSubmit(true);
  };

  const handleSubmit = async () => {
    if (!readyToSubmit) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);           // ✅ matches upload.single("file")
      formData.append("filename", fileName);   // ✅ matches req.body.filename (lowercase)
      formData.append("isPublic", isPublic);

      const res = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
        // ✅ Do NOT set Content-Type manually — browser sets it with boundary for FormData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data = await res.json();
      if (data.success) alert("✅ File uploaded successfully!");

    } catch (err) {
      alert("❌ Error: " + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const doneDisabled = !file || doneLocked;
  const submitDisabled = !readyToSubmit || uploading;

  return (
    <div className="page">
      {/* ---- UPLOAD CARD ---- */}
      <div className="card upload-card">
        <div className="card-title">Upload a file</div>

        <div
          className="bean-area"
          onClick={() => fileInputRef.current.click()}
          role="button"
          aria-label="Pick a file"
        >
          <span className="bean-word left">Click</span>
          <img
            src={BEAN_SRC}
            alt="bean"
            className={`bean-img${beanBounce ? " bounce" : ""}`}
          />
          <span className="bean-word right">Me</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden-input"
          onChange={handleFileChange}
        />

        <button
          className="submit-btn"
          disabled={submitDisabled}
          onClick={handleSubmit}
        >
          {uploading ? "UPLOADING..." : "SUBMIT"}
        </button>

        {submitDisabled && !uploading && (
          <div className="status-hint">
            {!file ? "Pick a file to begin" : "Confirm details first"}
          </div>
        )}
      </div>

      {/* ---- DETAILS CARD ---- */}
      <div className="card details-card">
        <div className="card-title">Details</div>

        <div className="detail-grid">
          <div className="detail-row">
            <span className="detail-label">File name:</span>
            <input
              className="detail-input"
              type="text"
              value={fileName}
              placeholder="—"
              onChange={handleFileNameChange}
              disabled={!file}
            />
          </div>

          <div className="detail-row">
            <span className="detail-label">File size</span>
            <span className="detail-value">
              {fileSize ? `${fileSize} KB` : "—"}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">File type</span>
            <span className="detail-value">{fileType || "—"}</span>
          </div>
        </div>

        <div className="toggle-row">
          <div className="toggle-group">
            <span className="toggle-label">Public</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => {
                  setIsPublic(e.target.checked);
                  if (e.target.checked) setIsPrivate(false);
                  if (doneClicked) setDoneLocked(false);
                }}
                disabled={!file}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="toggle-group">
            <span className="toggle-label">Private</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => {
                  setIsPrivate(e.target.checked);
                  if (e.target.checked) setIsPublic(false);
                  if (doneClicked) setDoneLocked(false);
                }}
                disabled={!file}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <button
          className="done-btn"
          disabled={doneDisabled}
          onClick={handleDone}
        >
          Done
        </button>

        {doneLocked && (
          <div className="status-hint">Edit filename to make changes</div>
        )}
      </div>
    </div>
  );
}

export default App;