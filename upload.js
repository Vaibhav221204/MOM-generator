document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const fileInput = document.getElementById('fileInput');
    const uploadMessage = document.getElementById('uploadMessage');
    uploadMessage.innerHTML = '';
  
    if (fileInput.files.length === 0) {
      uploadMessage.innerHTML = '<p class="error">❌ Please select a file to upload.</p>';
      return;
    }
  
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
  
    // UI: Show Upload Progress Bar
    uploadMessage.innerHTML = `
      <p>📤 Uploading <strong>${file.name}</strong>...</p>
      <div class="progress-bar"><div id="progress-fill"></div></div>
      <p id="progress-text">0%</p>
    `;
  
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:5001/upload", true);
  
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          document.getElementById('progress-fill').style.width = percent + '%';
          document.getElementById('progress-text').textContent = `${percent}% uploaded`;
        }
      };
  
      xhr.onload = async () => {
        const result = JSON.parse(xhr.responseText);
        if (xhr.status === 201) {
          uploadMessage.innerHTML = `
            <p>✅ File uploaded successfully!</p>
            <p>🧠 Transcribing audio using Whisper...</p>
            <p class="spinner"></p>
          `;
  
          // Wait before showing next phase
          await new Promise((r) => setTimeout(r, 2000));
  
          uploadMessage.innerHTML += `<p>💡 Summarizing using LLaMA 3.3 Turbo...</p><p class="spinner"></p>`;
  
          // Wait before showing results
          await new Promise((r) => setTimeout(r, 3000));
  
          uploadMessage.innerHTML = `
            <p class="success">✅ Transcription & Summary Ready!</p>
            <div class="output-section">
              <h3>📝 Transcription:</h3>
              <div class="output-box">${result.transcription}</div>
  
              <h3>🧾 Summary:</h3>
              <div class="output-box">${result.summary}</div>
            </div>
          `;
  
          fetchSummary(result.filename);
        } else {
          uploadMessage.innerHTML = `<p class="error">❌ ${result.message}</p>`;
        }
      };
  
      xhr.onerror = () => {
        uploadMessage.innerHTML = `<p class="error">❌ Upload failed. Please try again.</p>`;
      };
  
      xhr.send(formData);
    } catch (error) {
      uploadMessage.innerHTML = `<p class="error">❌ Something went wrong!</p>`;
    }
  });
  
  async function fetchSummary(filename) {
    try {
      const response = await fetch(`http://localhost:5001/summary/${filename}`);
      const data = await response.json();
      if (response.ok) {
        document.getElementById("uploadMessage").innerHTML += `
          <h3>🗃️ Stored Summary from DB:</h3>
          <div class="output-box">${data.summary}</div>
        `;
      }
    } catch (error) {
      console.error("❌ Error fetching stored summary:", error);
    }
  }
  
  








  