from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import fitz  # PyMuPDF for better text extraction
from io import BytesIO
from urllib.parse import urlparse, parse_qs
import re
import json
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Load API keys
GOOGLE_API_KEY = "AIzaSyD5gyJqBDDe3lVFxRkhxhDw1BwkXiUm4aI"
SUPABASE_URL = "https://rmgfvazyspioitmgeflu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZ2Z2YXp5c3Bpb2l0bWdlZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMTU3NjIsImV4cCI6MjA1NDU5MTc2Mn0.T_hGW9nol1M8q87OIMNUHOhifSsj4Ra6g_Bio8fFwL0"

# Configure AI Model
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# Initialize Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
sentence_model = SentenceTransformer("all-MiniLM-L6-v2")

class DriveTextExtractor:
    def convert_to_download_link(self, drive_link):
        parsed = urlparse(drive_link)
        if 'drive.google.com/file/d/' in drive_link:
            file_id = drive_link.split('/file/d/')[1].split('/')[0]
            return f'https://drive.google.com/uc?export=download&id={file_id}'
        elif 'drive.google.com/open' in drive_link:
            params = parse_qs(parsed.query)
            file_id = params.get('id', [None])[0]
            return f'https://drive.google.com/uc?export=download&id={file_id}' if file_id else drive_link
        return drive_link
    
    def download_pdf(self, drive_link):
        try:
            download_link = self.convert_to_download_link(drive_link)
            response = requests.get(download_link, stream=True)
            response.raise_for_status()
            return BytesIO(response.content)
        except Exception as e:
            raise Exception(f"Error downloading PDF: {str(e)}")
    
    def extract_text(self, pdf_file):
        try:
            doc = fitz.open(stream=pdf_file, filetype="pdf")
            text = "\n".join([page.get_text("text") for page in doc])
            return text.strip()
        except Exception as e:
            raise Exception(f"Error extracting text: {str(e)}")

extractor = DriveTextExtractor()

def search_similar(query, top_k=3):
    try:
        query_embedding = sentence_model.encode(query).tolist()
        response = supabase.rpc("search_documents", {"query_embedding": query_embedding, "top_k": top_k}).execute()
        return response.data if response.data else []
    except Exception as e:
        return []

@app.route('/extract-text', methods=['POST'])
def process_text():
    try:
        data = request.get_json()
        if not data or 'drive_link' not in data or 'topic' not in data:
            return jsonify({'error': 'Missing drive_link or topic in request body'}), 400
        
        drive_link = data['drive_link']
        topic = data['topic']
        
        # Extract text
        pdf_file = extractor.download_pdf(drive_link)
        extracted_text = extractor.extract_text(pdf_file)
        if not extracted_text:
            return jsonify({'error': 'No text extracted from PDF'}), 400
        
        cleaned_text = re.sub(r'\s+', ' ', extracted_text).strip()
        
        # Search similar content
        results = search_similar(topic)
        context = " ".join([i["content"] for i in results]) if results else ""

        # Generate AI response
        ai_query = f"Generate content on the topic: {topic}. Context: {context}"
        ai_response = model.generate_content(ai_query)
        ai_text = ai_response.text.strip() if ai_response.text else ""
        
        # Generate AI feedback
        feedback_query = (
            f"Extracted Content: {cleaned_text}, AI-Generated Content: {ai_text}. "
            "Provide feedback in JSON format with fields: relevance (low, medium, high), "
            "evaluation_score (1-100), overall_feedback, plagiarism (0.0-1.0), "
            "readability_score (0-100), cosine_score (0-1), jaccard_index (0-1), ai_text."
        )
        feedback_response = model.generate_content(feedback_query)
        
        match = re.search(r'\{.*\}', feedback_response.text, re.DOTALL)
        if not match:
            return jsonify({'error': 'Invalid AI feedback response'}), 500
        
        try:
            feedback_json = json.loads(match.group())
            return jsonify({
                'success': True,
                'extracted_text': cleaned_text,
                'ai_generated_text': ai_text,
                'feedback': feedback_json
            })
        except json.JSONDecodeError:
            return jsonify({'error': 'Error parsing AI JSON response'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Service is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
