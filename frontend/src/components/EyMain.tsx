import { TreeDeciduous } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface AudioRecordingState {
  isRecording: boolean;
  chunks: Blob[];
  recorder: MediaRecorder | null;
}

interface LiteracyLevel {
  value: 'poor' | 'good' | 'very good' | null;
  label: string;
}

const EyMain: React.FC = () => {
  // State for managing name recording
  const [nameRecording, setNameRecording] = useState<AudioRecordingState>({
    isRecording: false,
    chunks: [],
    recorder: null,
  });
  const [nameStatus, setNameStatus] = useState<string>('Status: Waiting for input...');
  const [nameProcessing, setNameProcessing] = useState<boolean>(false);

  // State for managing query recording
  const [queryRecording, setQueryRecording] = useState<AudioRecordingState>({
    isRecording: false,
    chunks: [],
    recorder: null,
  });
  const [queryStatus, setQueryStatus] = useState<string>('Query: None');
  const [queryProcessing, setQueryProcessing] = useState<boolean>(false);

  // State for literacy level
  const [literacyLevel, setLiteracyLevel] = useState<LiteracyLevel>({
    value: null,
    label: 'Status: Literacy level not set.',
  });

  // State for response
  const [response, setResponse] = useState<string>('Response will appear here...');
  const [isPlayingResponse, setIsPlayingResponse] = useState<boolean>(false);
  const [detectedLanguageCode, setDetectedLanguageCode] = useState<string>('en');
  const [showPlayButton, setShowPlayButton] = useState<boolean>(false);

  // Audio reference
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);

  // Function to start recording
  const startRecording = async (type: 'name' | 'query') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        processRecording(type, chunks);
      };

      mediaRecorder.start();

      if (type === 'name') {
        setNameRecording({
          isRecording: true,
          chunks: [],
          recorder: mediaRecorder,
        });
        setNameStatus('Recording...');
      } else {
        setQueryRecording({
          isRecording: true,
          chunks: [],
          recorder: mediaRecorder,
        });
        setQueryStatus('Recording...');
      }
    } catch (error) {
      console.error(`Error starting ${type} recording:`, error);
      if (type === 'name') {
        setNameStatus('Error accessing microphone.');
      } else {
        setQueryStatus('Error accessing microphone.');
      }
    }
  };

  // Function to stop recording
  const stopRecording = (type: 'name' | 'query') => {
    if (type === 'name' && nameRecording.recorder) {
      nameRecording.recorder.stop();
      nameRecording.recorder.stream.getTracks().forEach(track => track.stop());
      setNameRecording(prev => ({ ...prev, isRecording: false }));
      setNameStatus('Processing audio...');
      setNameProcessing(true);
    } else if (type === 'query' && queryRecording.recorder) {
      queryRecording.recorder.stop();
      queryRecording.recorder.stream.getTracks().forEach(track => track.stop());
      setQueryRecording(prev => ({ ...prev, isRecording: false }));
      setQueryStatus('Processing audio...');
      setQueryProcessing(true);
    }
  };

  // Function to process recording
  const processRecording = async (type: 'name' | 'query', chunks: Blob[]) => {
    const audioBlob = new Blob(chunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      if (type === 'name') {
        const response = await fetch('http://localhost:5000/ey_get_name', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setNameProcessing(false);

        if (data.error) {
          setNameStatus(data.error);
          console.error(data.error);
          return;
        }

        setNameStatus(`${data.message}`);
      } else if (type === 'query') {
        const response = await fetch('http://localhost:5000/ey_query', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setQueryProcessing(false);

        if (data.error) {
          setQueryStatus(data.error);
          console.error(data.error);
          return;
        }

        setQueryStatus(`Query: ${data.query || 'No query available.'}`);
        setResponse(data.response || 'No response available.');
        setDetectedLanguageCode(data.language_code || 'en');
        if (data.response) setShowPlayButton(true);
      }
    } catch (error) {
      console.error(`Error processing ${type} recording:`, error);
      if (type === 'name') {
        setNameProcessing(false);
        setNameStatus('Error processing audio.');
      } else if (type === 'query') {
        setQueryProcessing(false);
        setQueryStatus('Error processing query.');
      }
    }
  };

  // Function to set literacy level
  const handleSetLiteracyLevel = async (level: 'poor' | 'good' | 'very good') => {
    try {
      const response = await fetch('http://localhost:5000/ey_set_literacy_level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ literacy_level: level }),
      });

      const data = await response.json();
      setLiteracyLevel({
        value: level,
        label: data.message || `Status: Literacy level set to ${level}.`,
      });
    } catch (error) {
      console.error('Error setting literacy level:', error);
      setLiteracyLevel({
        value: null,
        label: 'Status: Error setting literacy level.',
      });
    }
  };

  // Function to play response
  const playResponse = async () => {
    try {
      const apiResponse = await fetch('http://localhost:5000/ey_play_response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: response,
          language_code: detectedLanguageCode,
        }),
      });

      if (!apiResponse.ok) {
        console.error('Error generating audio response.');
        return;
      }

      const audioBlob = await apiResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (responseAudioRef.current) {
        responseAudioRef.current.src = audioUrl;
        responseAudioRef.current.play();
        setIsPlayingResponse(true);
      }
    } catch (error) {
      console.error('Error playing response:', error);
    }
  };

  // Function to stop response playback
  const stopResponse = () => {
    if (responseAudioRef.current) {
      responseAudioRef.current.pause();
      responseAudioRef.current.currentTime = 0;
      setIsPlayingResponse(false);
    }
  };

  // Handle audio ended event
  useEffect(() => {
    const audioElement = responseAudioRef.current;
    
    const handleEnded = () => {
      setIsPlayingResponse(false);
    };

    if (audioElement) {
      audioElement.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audioElement) {
        audioElement.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-[#fccd03]/30 flex flex-col">
      {/* Header/Nav */}
      <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-8">
              <span className="text-3xl font-extrabold text-[#fccd03] font-sans">AgriSakha</span>
              <div className="hidden md:flex space-x-8">
                <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">Home</a>
                <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">Product</a>
                <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">Features</a>
                <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">About</a>
              </div>
            </div>
            {/* <div className="flex items-center space-x-4">
              <button className="text-white hover:text-[#fccd03] transition-colors px-6 py-2 font-medium">Sign In</button>
              <button className="bg-[#fccd03] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#e3b902] transition-colors">
                Sign Up
              </button>
            </div> */}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 justify-center items-center">
        {/* Sidebar */}
        <div className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-black to-gray-900 border-r border-white/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#fccd03] mb-6">Menu</h2>
          <nav className="space-y-4">
            <a href="/" className="flex items-center text-gray-400 hover:text-white transition-colors duration-300">
              <span className="mr-3">🏠</span>
              Home
            </a>
            <a href="/rural-financial-news" className="flex items-center text-gray-400 hover:text-white transition-colors duration-300">
              <span className="mr-3">📰</span>
              Financial News
            </a>
            <a href="/budget-assistant" className="flex items-center text-gray-400 hover:text-white transition-colors duration-300">
              <span className="mr-3">💰</span>
              Budget Assistant
            </a>
            <a href="/agri-assistant" className="flex items-center text-gray-400 hover:text-white transition-colors duration-300">
              <span className="mr-3"><TreeDeciduous className="w-5 h-5" /></span>
              Agricultural Advice
            </a>
            <a href="/loan-assistant" className="flex items-center text-gray-400 hover:text-white transition-colors duration-300">
              <span className="mr-3">💳</span>
              Loan Assistant
            </a>
            <a
                href="http://localhost:8080/"
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-300"
              >
                <span className="mr-3">💬</span>
                Community
              </a>
          </nav>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 ml-64 pt-28 px-12 pb-12">
          <div className="max-w-6xl mx-auto grid grid-cols-2 gap-12">
            {/* Left Column - Steps */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-10 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-[#fccd03]/20 hover:scale-[1.02] hover:-translate-y-1 active:scale-95">
              {/* Step 1: Name Recording */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-[#fccd03] mb-6 transition-transform duration-300 hover:translate-x-2">Step 1: Say Your Name</h2>
                
                {!nameRecording.isRecording ? (
                  <button 
                    onClick={() => startRecording('name')}
                    className="w-full bg-[#fccd03] text-black px-6 py-4 rounded-lg font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                  >
                    🎤 Record Name
                  </button>
                ) : (
                  <button 
                    onClick={() => stopRecording('name')}
                    className="w-full bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                  >
                    ⏹ Stop Recording
                  </button>
                )}
                
                <p className="mt-4 text-gray-300 font-medium transition-all duration-300 hover:translate-x-2">{nameStatus}</p>
                
                {nameProcessing && (
                  <div className="mx-auto my-4 w-8 h-8 border-4 border-[#fccd03] border-t-[#e3b902] rounded-full animate-spin"></div>
                )}
              </div>

              {/* Step 2: Literacy Level */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-[#fccd03] mb-6 transition-transform duration-300 hover:translate-x-2">Step 2: Select Literacy Level</h2>
                
                <div className="flex gap-4">
                  {['poor', 'good', 'very good'].map((level) => (
                    <button 
                      key={level}
                      onClick={() => handleSetLiteracyLevel(level as 'poor' | 'good' | 'very good')}
                      className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20 ${
                        literacyLevel.value === level 
                          ? 'bg-black text-[#fccd03]'
                          : 'bg-[#fccd03] text-black hover:bg-black hover:text-[#fccd03]'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
                
                <p className="mt-4 text-gray-300 font-medium transition-all duration-300 hover:translate-x-2">{literacyLevel.label}</p>
              </div>

              {/* Step 3: Query Recording */}
              <div>
                <h2 className="text-3xl font-bold text-[#fccd03] mb-6 transition-transform duration-300 hover:translate-x-2">Step 3: Ask Your Query</h2>
                
                {!queryRecording.isRecording ? (
                  <button 
                    onClick={() => startRecording('query')}
                    className="w-full bg-[#fccd03] text-black px-6 py-4 rounded-lg font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                  >
                    🎤 Record Query
                  </button>
                ) : (
                  <button 
                    onClick={() => stopRecording('query')}
                    className="w-full bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                  >
                    ⏹ Stop Recording
                  </button>
                )}
                
                <p className="mt-4 text-gray-300 font-medium transition-all duration-300 hover:translate-x-2">{queryStatus}</p>
                
                {queryProcessing && (
                  <div className="mx-auto my-4 w-8 h-8 border-4 border-[#fccd03] border-t-[#e3b902] rounded-full animate-spin"></div>
                )}
              </div>
            </div>

            {/* Right Column - Response */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-10 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-[#fccd03]/20 hover:scale-[1.02] hover:-translate-y-1 active:scale-95">
              <h2 className="text-3xl font-bold text-[#fccd03] mb-6 transition-transform duration-300 hover:translate-x-2">Response</h2>
              
              <div className="bg-black/30 rounded-lg p-8 mb-8 min-h-[400px] font-medium text-lg leading-relaxed transition-all duration-300 hover:bg-black/40">
                {response}
              </div>
              
              <div className="flex gap-4">
                {showPlayButton && !isPlayingResponse && (
                  <button 
                    onClick={playResponse}
                    className="flex-1 bg-[#fccd03] text-black px-6 py-4 rounded-lg font-semibold hover:bg-[#e3b902] transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl shadow-[#fccd03]/20"
                  >
                    🔊 Play Response
                  </button>
                )}
                
                {isPlayingResponse && (
                  <button 
                    onClick={stopResponse}
                    className="flex-1 bg-red-500 text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                  >
                    ⏹ Stop Response
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 text-white py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-[#fccd03] font-bold">AgriSakha</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400 text-sm">Voice Assisted Rural Empowerment Platform</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-[#fccd03] transition-colors text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-[#fccd03] transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-[#fccd03] transition-colors text-sm">Contact</a>
              <span className="text-gray-400 text-sm">&copy; 2024 AgriSakha</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden audio element */}
      <audio ref={responseAudioRef} />
    </div>
  );
};

export default EyMain;