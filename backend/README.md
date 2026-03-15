# Backend Server Setup

This backend server handles AI/OCR functionality using DeepSeek-OCR-2.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Python 3.8+** with required packages for DeepSeek-OCR-2
3. **CUDA** (optional, for GPU acceleration)

## Installation

1. Install Node.js dependencies:
```bash
cd backend
npm install
```

2. Install Python dependencies for OCR:
```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers==4.46.3
pip install Pillow numpy
```

3. Download DeepSeek-OCR-2 model (will be downloaded automatically on first use):
   - Model: `deepseek-ai/DeepSeek-OCR-2`
   - This will be downloaded from HuggingFace on first run

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
EMAIL=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/ai/analyze` - Analyze medical report (requires image file upload)

## Note about Chrome DevTools Errors

If you see CSP (Content Security Policy) errors in the browser console related to Chrome DevTools, these are harmless and can be ignored. They occur when Chrome DevTools tries to connect to the server for debugging purposes.

## Troubleshooting

1. **404 Errors**: Make sure the backend server is running on port 5000
2. **OCR Not Working**: Ensure Python dependencies are installed and DeepSeek-OCR-2 model can be loaded
3. **Port Already in Use**: Change the PORT in `.env` file or kill the process using the port
