import { useState, useRef, useCallback } from "react";
import './App.css';


// We embed the bean image as a styled div since we can't import the file
// The user should replace BEAN_SRC with their actual bean.png path
const BEAN_SRC = "./src/assets/bean.png"; // replace with actual path or import

function App() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(null);
  const [fileType, setFileType] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  // Done button: active only when file chosen and details not yet "locked"
  const [doneLocked, setDoneLocked] = useState(false);
  const [doneClicked, setDoneClicked] = useState(false);

  // Submit is active only after Done has been clicked at least once
  const [readyToSubmit, setReadyToSubmit] = useState(false);

  // Bean bounce animation trigger
  const [beanBounce, setBeanBounce] = useState(false);

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
    // Re-enable Done if user edits the filename after clicking Done
    if (doneClicked) {
      setDoneLocked(false);
    }
  };

  const handleDone = () => {
    if (!file || doneLocked) return;
    setDoneLocked(true);
    setDoneClicked(true);
    setReadyToSubmit(true);
  };

  const handleSubmit = async () => {
    if (!readyToSubmit) return;
    // Simulate upload
    const formData = new FormData();
    formData.append('file',file);
    formData.append('filename',fileName);
    formData.append('isPublic',isPublic);

    const res =await fetch('http://localhost:3001/api/upload',{
      method:'POST',
      body:formData,
    });

    const data=await res.json();
    if (data.success) alert('Uploaded!');
  };

  const doneDisabled = !file || doneLocked;
  const submitDisabled = !readyToSubmit;

  return (
    <>
      <style>{`
        
      `}</style>

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
              src={"./src/assets/bean.png"}
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
            SUBMIT
          </button>

          {submitDisabled && (
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
    </>
  );
}


export default App
