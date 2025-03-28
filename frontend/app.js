const startButton = document.getElementById('start-button');
const transcriptDiv = document.getElementById('transcript');
const statusDiv = document.getElementById('status');

let recognition;
let isRecording = false;

function initRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        isRecording = true;
        updateStatus("Listening...", "recording");
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        showMessage(transcript, 'user');
        sendToBackend(transcript);
    };
    
    recognition.onerror = (event) => {
        showError(`Recognition error: ${event.error}`);
        stopRecording();
    };
}

async function sendToBackend(message) {
    try {
        updateStatus("Processing...", "processing");
        showLoading();
        
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) throw new Error(await response.text());
        
        const data = await response.json();
        showMessage(data.response, 'ai');
    } catch (error) {
        showError(error.message);
    } finally {
        updateStatus("Ready", "idle");
    }
}

// Helper functions
function updateStatus(text, state) {
    statusDiv.textContent = text;
    statusDiv.className = `status-${state}`;
}

function showMessage(text, type) {
    const div = document.createElement('div');
    div.className = type === 'user' ? 'user-message' : 'ai-response';
    div.textContent = text;
    transcriptDiv.appendChild(div);
}

function showLoading() {
    const div = document.createElement('div');
    div.className = 'loading';
    div.textContent = "Processing...";
    transcriptDiv.appendChild(div);
}

function showError(message) {
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = message;
    transcriptDiv.appendChild(div);
}

function startRecording() {
    if (!recognition) initRecognition();
    recognition.start();
}

function stopRecording() {
    isRecording = false;
    recognition.stop();
}

// Event listeners
startButton.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
        startButton.textContent = "Start Recording";
    } else {
        startRecording();
        startButton.textContent = "Stop Recording";
    }
});

updateStatus("Ready", "idle");