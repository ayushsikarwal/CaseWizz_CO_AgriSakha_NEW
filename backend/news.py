import os
import requests
import json
from dotenv import load_dotenv
load_dotenv()
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
from crewai import LLM
import itertools
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import tempfile
from google.cloud import translate_v2 as translate
from groq import Groq
from pydub import AudioSegment
import threading
import time
import logging

app = Flask(__name__)
CORS(app)

# Setup Google Cloud credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r"translation.json"

# API Keys
GROQ_API_KEY = os.getenv('GROQ_API_KEY_NEWS')
GROQ_API_KEY2 = os.getenv('GROQ_API_KEY_NEWS2')
GROQ_API_KEY3 = os.getenv('GROQ_API_KEY_NEWS3')
os.environ["SERPER_API_KEY"] = os.getenv('SERPER_API_KEY')
GEMINI_API_KEY = os.getenv('GOOGLE_API_KEY')

groq_keys = [GROQ_API_KEY, GROQ_API_KEY2, GROQ_API_KEY3]
groq_key_cycle = itertools.cycle(groq_keys)

# Initialize translation and audio clients using your setup
try:
    translate_client = translate.Client()
    print("✅ Google Translate client initialized successfully")
except Exception as e:
    print(f"❌ Translation service initialization error: {e}")
    print("Please ensure translation.json file exists and is valid")
    translate_client = None

try:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("✅ Groq audio client initialized successfully")
except Exception as e:
    print(f"❌ Audio transcription service initialization error: {e}")
    print("Please check your Groq API key")
    groq_client = None

# Global storage for news content
news_storage = {
    "original_content": None,
    "translated_content": {},
    "last_updated": None,
    "is_fetching": False
}

def get_llm():
    """Returns an LLM object with the next API key"""
    api_key = next(groq_key_cycle).strip()
    return LLM(
        model="groq/llama-3.3-70b-versatile",
        temperature=0.5,
        api_key=api_key
    )

# Search tool
search_tool = SerperDevTool(max_results=10, max_depth=1)

# Agents
researcher = Agent(
    role="Agricultural News Researcher",
    goal="Fetch and summarize the latest 8–10 Agricultural news for rural India",
    backstory="You are an expert at finding only the most relevant agricultural updates.",
    llm=get_llm(),
    tools=[search_tool],
    verbose=True,
    allow_delegation=False,
    max_iter=2,
    max_execution_time=15,
)

writer = Agent(
    role="Agricultural Content Writer",
    goal="Turn news into an easy-to-understand article with bullet points",
    backstory="You simplify complex agricultural news into language for rural India.",
    llm=get_llm(),
    verbose=True,
    allow_delegation=False,
    max_iter=2,
    max_execution_time=15,
)

wordsmith = Agent(
    role="Agricultural Glossary Expert",
    goal="Provide 5 Agricultural terms with simple <30 word explanations",
    backstory="You explain agricultural terms in very simple words.",
    llm=get_llm(),
    verbose=True,
    allow_delegation=False,
    max_iter=1,
    max_execution_time=10,
)

# Tasks
task1 = Task(
    description="Search and summarize the latest 8–10 agricultural news relevant for rural Indian people. Keep it within 100 words, use bullet points.",
    expected_output="8-10 concise bullet points with headline + 2 line summary",
    agent=researcher,
)

task2 = Task(
    description="Turn the bullet points from task1 into a simple, engaging agricultural news article with easy language.",
    expected_output="An article with bullet points highlighting the agricultural news in plain language.",
    agent=writer,
)

task3 = Task(
    description="List 5 agricultural terms (bolded) with short explanations under 30 words each, useful for rural Indian people.",
    expected_output="5 terms with short, plain-English definitions.",
    agent=wordsmith,
)

# Crew
crew = Crew(
    agents=[researcher, writer, wordsmith],
    tasks=[task1, task2, task3],
    verbose=True,
    process=Process.sequential
)

def transcribe_audio(audio_file_path):
    """Transcribe audio file using your exact function"""
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                model="whisper-large-v3", 
                file=audio_file
            )
        return transcription.text
    except Exception as e:
        print(f"❌ Transcription error: {e}")
        return f"Error transcribing audio: {str(e)}"

def transcribe_audio_step(audio_file):
    """Process uploaded Flask FileStorage object for transcription"""
    try:
        if not groq_client:
            print("❌ Groq client not initialized")
            return "Audio transcription service not available - Groq client not initialized"
            
        if audio_file is None:
            return "No audio file received."
        
        print("🎤 Starting audio transcription...")
        
        # Save uploaded FileStorage to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio_file:
            print("📁 Saving uploaded audio file...")
            
            # Save the uploaded file first
            temp_input_path = temp_audio_file.name + "_input"
            audio_file.save(temp_input_path)
            
            # Convert to WAV format using pydub
            print("🔄 Converting audio to WAV format...")
            audio = AudioSegment.from_file(temp_input_path)
            audio.export(temp_audio_file.name, format="wav")
            
            print(f"📤 Transcribing audio file: {temp_audio_file.name}")
            
            # Now use your transcription function with the file path
            user_input = transcribe_audio(temp_audio_file.name)
            
            print(f"✅ Transcription successful: {user_input}")
        
        # -------------------------
        # Safe cleanup section
        # -------------------------
        try:
            audio = None  # release reference so file handles close
            time.sleep(0.1)  # tiny delay for Windows to release locks

            if os.path.exists(temp_audio_file.name):
                os.remove(temp_audio_file.name)
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)

        except Exception as cleanup_error:
            print(f"⚠️ Cleanup warning (not fatal): {cleanup_error}")
        
        return user_input
        
    except Exception as e:
        print(f"❌ Audio processing error: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return f"Error processing audio: {str(e)}"

def translate_to_english(text):
    """Your exact translation function"""
    try:
        if not translate_client:
            return text, "en"
            
        detection = translate_client.detect_language(text)
        detected_language = detection['language']

        if detected_language == "hi":  
            print("Detected Hindi, translating to English...")
            translation = translate_client.translate(text, target_language="en")
            return translation['translatedText'], detected_language
        
        print("Detected English, no translation needed.")
        return text, detected_language
        
    except Exception as e:
        print(f"Translation error: {e}")
        return text, "en"
def translate_to_original_language(text, target_language):
    """Enhanced translation that preserves formatting"""
    try:
        if not translate_client or target_language == "en":
            return text
        
        # Preserve markdown formatting during translation
        # Split text into chunks to preserve structure
        lines = text.split('\n')
        translated_lines = []
        
        for line in lines:
            if line.strip():  # Only translate non-empty lines
                # Preserve markdown markers
                if line.startswith('##'):
                    # Translate header but keep ##
                    header_text = line.replace('##', '').strip()
                    translated_header = translate_client.translate(header_text, target_language=target_language)
                    translated_lines.append(f"## {translated_header['translatedText']}")
                elif line.startswith('**') and line.endswith('**'):
                    # Translate bold text but keep **
                    bold_text = line.replace('**', '').strip()
                    translated_bold = translate_client.translate(bold_text, target_language=target_language)
                    translated_lines.append(f"**{translated_bold['translatedText']}**")
                elif line.startswith('•') or line.startswith('-') or line.startswith('*'):
                    # Translate bullet points but keep bullet marker
                    bullet_char = line[0]
                    bullet_text = line[1:].strip()
                    translated_bullet = translate_client.translate(bullet_text, target_language=target_language)
                    translated_lines.append(f"{bullet_char} {translated_bullet['translatedText']}")
                else:
                    # Regular line translation
                    translation = translate_client.translate(line, target_language=target_language)
                    translated_lines.append(translation['translatedText'])
            else:
                # Keep empty lines for structure
                translated_lines.append(line)
        
        return '\n'.join(translated_lines)
        
    except Exception as e:
        print(f"Back-translation error: {e}")
        return text
def detect_language(text):
    """Detect language using the translate_to_english function"""
    try:
        _, detected_language = translate_to_english(text)
        return detected_language
    except Exception as e:
        print(f"Language detection error: {e}")
        return "en"
    """Your exact back-translation function"""
    try:
        if not translate_client or target_language == "en":
            return text
            
        translation = translate_client.translate(text, target_language=target_language)
        return translation['translatedText']
    except Exception as e:
        print(f"Back-translation error: {e}")
        return text

def fetch_latest_news():
    """Fetch latest agricultural news using the crew"""
    global news_storage
    
    print("Fetching latest agricultural news...")
    news_storage["is_fetching"] = True
    
    try:
        # Run the crew to get latest news
        result = crew.kickoff()
        
        # Extract individual task outputs
        research_output = crew.tasks[0].output if len(crew.tasks) > 0 else ""
        article_output = crew.tasks[1].output if len(crew.tasks) > 1 else ""
        glossary_output = crew.tasks[2].output if len(crew.tasks) > 2 else ""
        
        # Store original content
        news_storage["original_content"] = {
            "research_summary": str(research_output),
            "news_article": str(article_output),
            "agricultural_terms": str(glossary_output),
            "full_result": str(result)
        }
        
        news_storage["last_updated"] = time.time()
        news_storage["translated_content"] = {}  # Reset translations
        
        print("News fetched successfully!")
        return news_storage["original_content"]
        
    except Exception as e:
        print(f"Error fetching news: {e}")
        return None
    finally:
        news_storage["is_fetching"] = False

def get_translated_news(target_language):
    """Get news in the specified language using your translation functions"""
    global news_storage
    
    # If English or no translation needed
    if target_language == "en" or not news_storage["original_content"]:
        return news_storage["original_content"]
    
    # Check if already translated
    if target_language in news_storage["translated_content"]:
        return news_storage["translated_content"][target_language]
    
    # Translate the content using your function
    try:
        original = news_storage["original_content"]
        translated = {}
        
        for key, content in original.items():
            translated[key] = translate_to_original_language(content, target_language)
        
        # Store translation
        news_storage["translated_content"][target_language] = translated
        return translated
        
    except Exception as e:
        print(f"Error translating news: {e}")
        return news_storage["original_content"]

@app.route('/')
def home():
    return render_template('voice_news.html')

@app.route('/api/test-transcription', methods=['POST'])
def test_transcription():
    """Test endpoint to debug transcription issues"""
    try:
        print("🧪 Test transcription endpoint called")
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        print(f"📁 Received file: {audio_file}")
        print(f"📊 File type: {type(audio_file)}")
        print(f"📝 File name: {audio_file.filename}")
        print(f"📏 File size: {len(audio_file.read())} bytes")
        
        # Reset file pointer after reading size
        audio_file.seek(0)
        
        # Test basic file operations
        with tempfile.NamedTemporaryFile(delete=False, suffix=".test") as temp_file:
            temp_path = temp_file.name
            print(f"💾 Saving to temp file: {temp_path}")
            
            audio_file.save(temp_path)
            print(f"✅ File saved successfully")
            
            # Check if file exists and has content
            if os.path.exists(temp_path):
                file_size = os.path.getsize(temp_path)
                print(f"📏 Saved file size: {file_size} bytes")
                
                if file_size > 0:
                    # Try to process with pydub
                    try:
                        audio_segment = AudioSegment.from_file(temp_path)
                        print(f"🎵 Audio loaded: {len(audio_segment)}ms duration")
                        
                        # Convert to WAV
                        wav_path = temp_path + ".wav"
                        audio_segment.export(wav_path, format="wav")
                        print(f"🔄 Converted to WAV: {wav_path}")
                        
                        # Test direct Groq transcription
                        if groq_client:
                            print("🎤 Testing Groq transcription...")
                            with open(wav_path, "rb") as audio_file_handle:
                                transcription = groq_client.audio.transcriptions.create(
                                    model="whisper-large-v3", 
                                    file=audio_file_handle
                                )
                            result_text = transcription.text
                            print(f"✅ Transcription result: {result_text}")
                            
                            # Clean up
                            os.unlink(temp_path)
                            os.unlink(wav_path)
                            
                            return jsonify({
                                'success': True,
                                'transcription': result_text,
                                'message': 'Test successful'
                            })
                        else:
                            return jsonify({'error': 'Groq client not available'}), 500
                            
                    except Exception as audio_error:
                        print(f"❌ Audio processing error: {audio_error}")
                        return jsonify({'error': f'Audio processing failed: {str(audio_error)}'}), 500
                else:
                    return jsonify({'error': 'Saved file is empty'}), 500
            else:
                return jsonify({'error': 'Failed to save file'}), 500
        
    except Exception as e:
        print(f"❌ Test transcription error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Test failed: {str(e)}'}), 500

@app.route('/api/voice-transcribe', methods=['POST'])
def voice_transcribe():
    """Handle voice transcription and language detection"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # ✅ Use the correct function for FileStorage
        transcribed_text = transcribe_audio_step(audio_file)
        print(f"Transcribed text: {transcribed_text}")
        
        # Detect language
        detected_language = detect_language(transcribed_text)
        print(f"Detected language: {detected_language}")
        
        return jsonify({
            'transcribed_text': transcribed_text,
            'detected_language': detected_language,
            'success': True
        })
        
    except Exception as e:
        print(f"Voice transcription API error: {e}")
        return jsonify({'error': 'Error processing audio'}), 500

@app.route('/api/get-news', methods=['POST'])
def get_news():
    """Get agricultural news in the specified language"""
    try:
        data = request.get_json()
        language = data.get('language', 'en')
        force_refresh = data.get('force_refresh', False)
        
        # Check if we need to fetch fresh news
        if (news_storage["original_content"] is None or 
            force_refresh or 
            (news_storage["last_updated"] and 
             time.time() - news_storage["last_updated"] > 3600)):  # 1 hour cache
            
            if not news_storage["is_fetching"]:
                # Fetch news in background
                threading.Thread(target=fetch_latest_news).start()
                
                # Wait a moment for the fetch to start
                time.sleep(1)
        
        # If still fetching, return status
        if news_storage["is_fetching"]:
            return jsonify({
                'status': 'fetching',
                'message': 'Fetching latest agricultural news...',
                'language': language
            })
        
        # Get news in requested language
        news_content = get_translated_news(language)
        
        if news_content:
            return jsonify({
                'status': 'success',
                'language': language,
                'news_content': news_content,
                'last_updated': news_storage["last_updated"]
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'No news content available'
            }), 404
        
    except Exception as e:
        print(f"Get news API error: {e}")
        return jsonify({'error': 'Error fetching news'}), 500

@app.route('/api/voice-query', methods=['POST'])
def voice_query():
    """Handle voice query and return news in detected language"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        detected_language = data.get('detected_language', 'en')
        
        print(f"Voice query: {query}")
        print(f"Detected language: {detected_language}")
        
        # Get news in the detected language
        news_content = get_translated_news(detected_language)
        
        if not news_content:
            # If no content, try to fetch fresh news
            if not news_storage["is_fetching"]:
                fetch_latest_news()
                news_content = get_translated_news(detected_language)
        
        news_content = get_translated_news(detected_language)
        
        return jsonify({
            'status': 'success',
            'query': query,
            'detected_language': detected_language,
            'response': news_content,
            'language_name': 'Hindi' if detected_language == 'hi' else 'English'
        })
        
    except Exception as e:
        print(f"Voice query API error: {e}")
        return jsonify({'error': 'Error processing voice query'}), 500

@app.route('/api/change-language', methods=['POST'])
def change_language():
    """Change the language of existing news content"""
    try:
        data = request.get_json()
        target_language = data.get('language', 'en')
        
        if not news_storage["original_content"]:
            return jsonify({
                'status': 'error',
                'message': 'No news content available to translate'
            }), 404
        
        # Get translated content
        translated_content = get_translated_news(target_language)
        
        return jsonify({
            'status': 'success',
            'language': target_language,
            'news_content': translated_content,
            'language_name': 'Hindi' if target_language == 'hi' else 'English'
        })
        
    except Exception as e:
        print(f"Change language API error: {e}")
        return jsonify({'error': 'Error changing language'}), 500

@app.route('/api/refresh-news', methods=['POST'])
def refresh_news():
    """Force refresh the news content"""
    try:
        if not news_storage["is_fetching"]:
            # Start fetching in background
            threading.Thread(target=fetch_latest_news).start()
        
        return jsonify({
            'status': 'success',
            'message': 'News refresh initiated'
        })
        
    except Exception as e:
        print(f"Refresh news API error: {e}")
        return jsonify({'error': 'Error refreshing news'}), 500

if __name__ == "__main__":
    print("🚀 Starting Agricultural Voice News Agent...")
    print("=" * 50)
    
    # Verify API Keys
    print("🔑 Checking API Keys...")
    print(f"   GROQ_API_KEY: {'✅ Set' if GROQ_API_KEY and len(GROQ_API_KEY) > 10 else '❌ Missing/Invalid'}")
    print(f"   GEMINI_API_KEY: {'✅ Set' if GEMINI_API_KEY and len(GEMINI_API_KEY) > 10 else '❌ Missing/Invalid'}")
    print(f"   SERPER_API_KEY: {'✅ Set' if os.environ.get('SERPER_API_KEY') else '❌ Missing/Invalid'}")
    
    # Verify Services
    print("\n🔧 Checking Services...")
    print(f"   Translation Client: {'✅ Ready' if translate_client else '❌ Not Available'}")
    print(f"   Audio Client (Groq): {'✅ Ready' if groq_client else '❌ Not Available'}")
    
    # Check dependencies
    print("\n📦 Checking Dependencies...")
    try:
        import pydub
        print("   ✅ pydub installed")
    except ImportError:
        print("   ❌ pydub missing - run: pip install pydub")
    
    try:
        from google.cloud import translate_v2
        print("   ✅ google-cloud-translate installed")
    except ImportError:
        print("   ❌ google-cloud-translate missing - run: pip install google-cloud-translate")
    
    try:
        from groq import Groq
        print("   ✅ groq installed")
    except ImportError:
        print("   ❌ groq missing - run: pip install groq")
    
    print("\n" + "=" * 50)
    
    if not groq_client:
        print("⚠️  WARNING: Audio transcription will not work without Groq client!")
        print("   Please check your GROQ_API_KEY")
    
    if not translate_client:
        print("⚠️  WARNING: Translation will not work without Google Cloud credentials!")
        print("   Please set up Google Cloud Translation API")
    
    print("\n📰 Fetching initial news content...")
    
    # Fetch initial news
    fetch_latest_news()
    
    print("\n🌐 Starting Flask server...")
    print("   Access the app at: http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=7864)