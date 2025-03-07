from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import requests
import PyPDF2
from io import BytesIO
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

class DriveTextExtractor:
    def __init__(self):
        """Initialize the text extractor"""
        self.session = requests.Session()

    def convert_to_download_link(self, drive_link):
        """Convert Google Drive sharing link to a direct download link"""
        parsed = urlparse(drive_link)
        
        if 'drive.google.com/file/d/' in drive_link:
            file_id = drive_link.split('/file/d/')[1].split('/')[0]
            return f'https://drive.google.com/uc?export=download&id={file_id}'
        
        elif 'drive.google.com/open' in drive_link:
            params = parse_qs(parsed.query)
            file_id = params.get('id', [None])[0]
            if file_id:
                return f'https://drive.google.com/uc?export=download&id={file_id}'
            
        return drive_link
    
    def download_pdf(self, drive_link):
        """Download PDF from Google Drive"""
        try:
            download_link = self.convert_to_download_link(drive_link)
            response = self.session.get(download_link, stream=True)
            response.raise_for_status()

            content_type = response.headers.get('content-type', '')

            if 'text/html' in content_type:
                for line in response.iter_lines():
                    if b'confirm=' in line:
                        confirm_token = line.decode().split('confirm=')[1].split('"')[0]
                        response = self.session.get(
                            f"{download_link}&confirm={confirm_token}",
                            stream=True
                        )
                        response.raise_for_status()
                        break
            
            return BytesIO(response.content)
        except Exception as e:
            raise Exception(f"Error downloading PDF: {str(e)}")
    
    def extract_text(self, pdf_file):
        """Extract text from PDF"""
        try:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = "\n".join([page.extract_text() or "" for page in pdf_reader.pages])
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text: {str(e)}")

extractor = DriveTextExtractor()

@app.route('/extract-text', methods=['POST'])
def extract_text():
    """API endpoint to extract text from Google Drive PDF"""
    try:
        data = request.get_json()
        if not data or 'drive_link' not in data:
            return jsonify({'error': 'Missing drive_link in request body'}), 400
        
        drive_link = data['drive_link']
        pdf_file = extractor.download_pdf(drive_link)
        text = extractor.extract_text(pdf_file)

        return jsonify({'success': True, 'text': text})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Service is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Ensure it runs on port 5001
