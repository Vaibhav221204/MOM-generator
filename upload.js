document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const uploadMessage = document.getElementById('uploadMessage');

    if (fileInput.files.length === 0) {
        uploadMessage.textContent = '❌ Please select a file before uploading.';
        uploadMessage.style.color = 'red';
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    uploadMessage.textContent = '⏳ Uploading...';
    uploadMessage.style.color = 'blue';

    try {
        const response = await fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        uploadMessage.textContent = result.message;
        uploadMessage.style.color = response.ok ? 'green' : 'red';

        if (response.ok) {
            uploadMessage.innerHTML += `<br><strong>Transcription:</strong> ${result.transcription}`;
            uploadMessage.innerHTML += `<br><strong>Summary:</strong> ${result.summary}`;

            // Fetch stored summary from MongoDB
            fetchSummary(file.name);
        }
    } catch (error) {
        uploadMessage.textContent = '❌ Upload failed!';
        uploadMessage.style.color = 'red';
    }
});

// ✅ Function to Fetch AI Summary from Backend
async function fetchSummary(filename) {
    try {
        const response = await fetch(`http://localhost:5001/summary/${filename}`);
        const data = await response.json();
        if (response.ok) {
            document.getElementById("uploadMessage").innerHTML += 
                `<br><strong>Stored Summary from DB:</strong> ${data.summary}`;
        } else {
            console.error("Error fetching summary:", data.message);
        }
    } catch (error) {
        console.error("❌ Error fetching stored summary:", error);
    }
}








  