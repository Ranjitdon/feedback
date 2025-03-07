import os
import requests
import traceback
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import google.generativeai as genai

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS to fix frontend issues

# Configure Google Gemini API
genai.configure(api_key="AIzaSyDzRk9cNGYxkoqQzW2iS5ZrtNdK5RIKR0w")
model = genai.GenerativeModel("gemini-1.5-pro-latest")

# Function to download image from Google Drive
def download_image(drive_link):
    try:
        # Extract the file ID from the Google Drive link
        file_id = drive_link.split("/d/")[1].split("/")[0]
        download_url = f"https://drive.google.com/uc?export=download&id={file_id}"

        print(f"Downloading image from: {download_url}")
        response = requests.get(download_url, stream=True)

        # Check if the response is an image
        content_type = response.headers.get('Content-Type', '')
        if 'image' not in content_type:
            print("Error: Downloaded file is not an image.")
            print("Response Content:", response.text[:500])  # Print first 500 chars of response
            raise ValueError("Downloaded file is not an image")

        response.raise_for_status()  # Raise error for bad responses
        return BytesIO(response.content)

    except Exception as e:
        print("🔥 Error downloading image:", e)
        raise


# OMR Extraction API Endpoint
@app.route('/omr-extract', methods=['POST'])
def omr_extract():
    try:
        data = request.get_json()
        if not data or 'drive_link' not in data:
            return jsonify({'error': 'Missing drive_link'}), 400

        drive_link = data['drive_link']
        print("Received Drive link:", drive_link)

        # Download and open the image
        image_file = download_image(drive_link)
        image = Image.open(image_file).convert("RGB")  # Ensure RGB format

        print("Image successfully opened")

        # Send image to Google Gemini API for OMR
        response = model.generate_content([
            image,
            "Perform OMR and provide answers in JSON format (question_num: answer)."
        ])

        print("Response from Gemini:", response.text)

        return jsonify({'success': True, 'omr_results': response.text})

    except Exception as e:
        print("Error in OMR processing:", traceback.format_exc())  # Log full error
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
