const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const dropHint = document.getElementById('dropHint');
const preview = document.getElementById('preview');
const extractBtn = document.getElementById('extractBtn');
const captureBtn = document.getElementById('captureBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');
const output = document.getElementById('output');

let currentImageFile = null;
let generatedImageUrl = null;

const setStatus = (text) => {
  statusEl.textContent = text;
};

const resetPreviewUrl = () => {
  if (generatedImageUrl) {
    URL.revokeObjectURL(generatedImageUrl);
    generatedImageUrl = null;
  }
};

const setCurrentImage = (file, label) => {
  if (!file || !file.type.startsWith('image/')) {
    setStatus('Please use an image file.');
    return;
  }

  resetPreviewUrl();
  currentImageFile = file;
  generatedImageUrl = URL.createObjectURL(file);
  preview.src = generatedImageUrl;
  preview.hidden = false;
  dropHint.textContent = label;
  extractBtn.disabled = false;
  copyBtn.disabled = output.value.trim().length === 0;
  setStatus('Ready to extract text.');
};

const showImage = (file) => {
  setCurrentImage(file, `Selected: ${file.name || 'image'}`);
};

const handleFiles = (files) => {
  if (!files || files.length === 0) {
    return;
  }
  showImage(files[0]);
};

const captureScreen = async () => {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    setStatus('Screen capture is not supported in this browser.');
    return;
  }

  try {
    setStatus('Choose a screen/window to capture...');
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor' },
      audio: false,
    });

    const track = stream.getVideoTracks()[0];
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

    track.stop();
    stream.getTracks().forEach((streamTrack) => streamTrack.stop());

    if (!blob) {
      setStatus('Could not capture screen.');
      return;
    }

    const file = new File([blob], 'screen-capture.png', { type: 'image/png' });
    setCurrentImage(file, 'Captured: screen-capture.png');
  } catch (error) {
    console.error(error);
    setStatus('Screen capture cancelled or blocked by browser.');
  }
};

imageInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (event) => {
  handleFiles(event.dataTransfer.files);
});

document.addEventListener('paste', (event) => {
  const items = event.clipboardData?.items;
  if (!items) {
    return;
  }

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        showImage(file);
        break;
      }
    }
  }
});

extractBtn.addEventListener('click', async () => {
  if (!currentImageFile) {
    setStatus('Add an image first.');
    return;
  }

  extractBtn.disabled = true;
  setStatus('Extracting text...');

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(currentImageFile, 'eng', {
      logger: (message) => {
        if (typeof message.progress === 'number' && message.status) {
          setStatus(`${message.status} (${Math.round(message.progress * 100)}%)`);
        }
      },
    });

    output.value = text.trim();
    copyBtn.disabled = output.value.length === 0;
    setStatus('Text extracted.');
  } catch (error) {
    console.error(error);
    setStatus('Extraction failed. Try another image.');
  } finally {
    extractBtn.disabled = false;
  }
});

captureBtn.addEventListener('click', captureScreen);

copyBtn.addEventListener('click', async () => {
  if (!output.value.trim()) {
    setStatus('No text to copy yet.');
    return;
  }

  try {
    await navigator.clipboard.writeText(output.value);
    setStatus('Text copied to clipboard.');
  } catch (error) {
    console.error(error);
    setStatus('Clipboard access blocked. Copy manually from the text box.');
  }
});

document.addEventListener('keydown', async (event) => {
  const usesMeta = event.ctrlKey || event.metaKey;

  if (usesMeta && event.shiftKey && event.key.toLowerCase() === 's') {
    event.preventDefault();
    await captureScreen();
    return;
  }

  if (usesMeta && event.key === 'Enter') {
    event.preventDefault();
    extractBtn.click();
    return;
  }

  if (usesMeta && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    copyBtn.click();
  }
});

clearBtn.addEventListener('click', () => {
  currentImageFile = null;
  imageInput.value = '';
  resetPreviewUrl();
  preview.src = '';
  preview.hidden = true;
  output.value = '';
  dropHint.textContent = 'Drop an image here, paste from clipboard, or click to choose a file.';
  extractBtn.disabled = true;
  copyBtn.disabled = true;
  setStatus('Cleared.');
});
