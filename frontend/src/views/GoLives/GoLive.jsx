
import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Button,
  Box,
  Container,
  Paper,
  FormControl,
  InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import SEO from 'views/Seo/SeoMeta';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Styled components remain the same...
const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-input': {
    color: '#47362b',
    fontSize: '16px',
    padding: '14px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  backgroundColor: '#fff',
  marginBottom: theme.spacing(2),
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  '& .MuiSelect-icon': {
    color: '#47362b',
  }
}));

const StyledButton = styled(Button)(({ theme, $recording }) => ({
  backgroundColor: $recording ? '#8B0000' : '#47362b',
  color: '#fff',
  '&:hover': {
    backgroundColor: $recording ? '#660000' : '#3c2a21',
  },
  width: '100%',
  padding: '14px',
  marginTop: theme.spacing(2),
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 'normal',
  boxShadow: 'none',
  borderRadius: '4px',
}));

const TranscriptionBox = styled(Paper)(({ theme }) => ({
  minHeight: 150,
  maxHeight: 150,
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  padding: theme.spacing(2),
  backgroundColor: '#fff',
  margin: theme.spacing(2, 0),
}));

const GoLive = () => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Ready to start');
  const [transcription, setTranscription] = useState('');
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('');
  const [microphones, setMicrophones] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedGender, setSelectedGender] = useState(''); // New gender state
  const [selectedVoice, setSelectedVoice] = useState(''); // New voice state
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentBroadcastId, setCurrentBroadcastId] = useState(null);
  const [shareableUrl, setShareableUrl] = useState('');
  const [showShareBox, setShowShareBox] = useState(false);
  const [churchAlreadyLive, setChurchAlreadyLive] = useState(false);
  const [isCheckingSermons, setIsCheckingSermons] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [popupShown, setPopupShown] = useState(false);

  const [dynamicVoiceOptions, setDynamicVoiceOptions] = useState({
    male: [],
    female: []
  });
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

  const [showListenerPopup, setShowListenerPopup] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(300);
  const [countdownInterval, setCountdownInterval] = useState(null);


  const getAvailableVoices = () => {
    if (!selectedGender || !dynamicVoiceOptions[selectedGender]) {
      return [];
    }
    return dynamicVoiceOptions[selectedGender];
  };

  // Handle gender change
  const handleGenderChange = (event) => {
    const newGender = event.target.value;
    setSelectedGender(newGender);
    setSelectedVoice(''); // Reset voice selection when gender changes
  };

  // Handle voice change
  // Update handleVoiceChange to also set the language for translation
  // Handle voice change
  const handleVoiceChange = (event) => {
    const newVoice = event.target.value;
    setSelectedVoice(newVoice);

    // FIX: Extract language code for translation
    if (newVoice) {
      const langCode = newVoice.split('-')[0]; // e.g., 'hi-IN-ArjunNeural' -> 'hi'
      setSelectedLanguage(langCode);
      console.log(`[VOICE_CHANGE] Set language to: ${langCode}`);
    }

    // FIX: Update speech recognition language if recognition is already initialized
    if (recognitionRef.current) {
      const newLang = getSpeechRecognitionLanguage(newVoice);
      recognitionRef.current.lang = newLang;
      console.log(`[VOICE_CHANGE] Updated speech recognition to: ${newLang}`);
    }
  };

  // All the existing refs and functions remain the same...
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const clientIdRef = useRef(Math.random().toString(36).substring(7));
  const lastSpeechTimestampRef = useRef(Date.now());
  const translationSourceRef = useRef(null);
  const retriesRef = useRef(0);
  const segmentStartTimeRef = useRef(Date.now());
  const lastTranslationApiCallRef = useRef(Date.now());
  const metricsSystemRef = useRef(null);
  const broadcastIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const streamEstablishedRef = useRef(false);
  const instanceIdRef = useRef(`${Date.now()}-${Math.random().toString(36).substring(7)}`);
  const heartbeatIntervalRef = useRef(null);
  const lastHeartbeatRef = useRef(null);
  const [heartbeatStatus, setHeartbeatStatus] = useState('inactive'); // 'active', 'inactive', 'error'
  const broadcastStatusIntervalRef = useRef(null);
  const transcriptionBoxRef = useRef(null);
  const accumulatedTextRef = useRef('');
  const lastProcessedTextRef = useRef('');


  // Sliding window state
  const slidingWindowStateRef = useRef({
    wordBuffer: [],
    lastTranslatedIndex: 0,
    pendingTranslations: new Map(),
    translationResponses: new Map(),
    segmentId: 0,
    lastTranslationTimestamp: Date.now()
  });

  // Sliding window buffer
  const slidingWindowBufferRef = useRef({
    segments: new Map(),
    lastDisplayed: null,
    pendingChunks: 0,
    enabled: true
  });


  const SPEECH_CONFIG = {
    PAUSE_DURATION: 300,
    FINAL_PAUSE_DURATION: 700,
    MAX_DURATION: 5000,
    MIN_SPEECH_LENGTH: 3,
    MIN_NEW_CHARS: 15,
    MAX_INTERIM_LENGTH: 150,
    WORD_COUNT_THRESHOLD: 20,
    MIN_WORDS_FOR_TRANSLATION: 3,
    WINDOW_SIZE: 8,
    WINDOW_OVERLAP: 0,
    WINDOW_MIN_SIZE: 1,
    USE_SLIDING_WINDOW: true,
    SYNTHESIS_DEBOUNCE: 500,
    OVERLAP_BUFFER: 200
  };

  const AUDIO_CONFIG = {
    sampleRate: 16000,
    channelCount: 1,
    processorBufferSize: 8192,
    targetBufferSize: 8192,
    bytesPerSample: 2
  };

  // Create metrics system for performance tracking
  const createMetricsSystem = () => {
    const metricsState = {
      translationCount: 0,
      totalChunks: 0,
      totalWordCount: 0,
      renderTimes: [],
      translationLatencies: [],
      startTime: Date.now(),
      lastReportTime: Date.now()
    };

    const calculateAverage = (array) => {
      if (!array || array.length === 0) return 0;
      return array.reduce((sum, val) => sum + val, 0) / array.length;
    };

    const reportingInterval = setInterval(() => {
      const currentTime = Date.now();
      const timeSpan = (currentTime - metricsState.lastReportTime) / 1000;

      const averageChunkSize = metricsState.totalChunks > 0
        ? metricsState.totalWordCount / metricsState.totalChunks
        : 0;

      const avgRenderTime = calculateAverage(metricsState.renderTimes);
      const avgLatency = calculateAverage(metricsState.translationLatencies);

      console.log(`[SLIDING_WINDOW] Performance Report:
        Time period: ${timeSpan.toFixed(1)}s
        Translations: ${metricsState.translationCount}
        Chunks processed: ${metricsState.totalChunks}
        Avg chunk size: ${averageChunkSize.toFixed(1)} words
        Avg render time: ${avgRenderTime.toFixed(2)}ms
        Avg translation latency: ${avgLatency.toFixed(2)}ms
      `);

      metricsState.translationCount = 0;
      metricsState.totalChunks = 0;
      metricsState.totalWordCount = 0;
      metricsState.renderTimes = [];
      metricsState.translationLatencies = [];
      metricsState.lastReportTime = currentTime;
    }, 30000);

    return {
      recordTranslation: function (wordCount, latency) {
        if (typeof wordCount !== 'number' || isNaN(wordCount)) {
          console.warn('[METRICS] Invalid word count:', wordCount);
          wordCount = 0;
        }

        if (typeof latency !== 'number' || isNaN(latency)) {
          console.warn('[METRICS] Invalid latency:', latency);
          latency = 0;
        }

        metricsState.translationCount++;
        metricsState.totalChunks++;
        metricsState.totalWordCount += wordCount;

        if (latency > 0) {
          metricsState.translationLatencies.push(latency);
        }

        console.log(`[METRICS_DETAIL] Translation recorded: ${wordCount} words, ${latency.toFixed(2)}ms latency`);
      },

      recordRender: function (renderTime) {
        if (typeof renderTime !== 'number' || isNaN(renderTime)) {
          console.warn('[METRICS] Invalid render time:', renderTime);
          renderTime = 0;
        }

        if (renderTime > 0) {
          metricsState.renderTimes.push(renderTime);
          console.log(`[METRICS_DETAIL] Render time recorded: ${renderTime.toFixed(2)}ms`);
        }
      },

      cleanup: function () {
        clearInterval(reportingInterval);
        console.log('[METRICS] Metrics system cleaned up');
      }
    };
  };

  useEffect(() => {
    metricsSystemRef.current = createMetricsSystem();
    console.log('[INIT] Metrics system initialized');

    return () => {
      if (metricsSystemRef.current) {
        metricsSystemRef.current.cleanup();
      }
    };
  }, []);

  const logMicrophoneDetails = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(device => device.kind === 'audioinput');

      console.group('Available Microphones');
      mics.forEach((mic, index) => {
        console.log(`Microphone ${index + 1}:`, {
          label: mic.label,
          deviceId: mic.deviceId.substring(0, 8) + '...',
          isDefault: index === 0
        });
      });
      console.groupEnd();

      return mics;
    } catch (error) {
      console.error('Error getting microphones:', error);
      return [];
    }
  };

  const processSlidingWindow = (transcript, isInterim) => {
    if (!SPEECH_CONFIG.USE_SLIDING_WINDOW) return;

    const processStart = performance.now();
    const formattedTime = new Date().toISOString().split('T')[1].split('Z')[0];

    const words = transcript.trim().split(/\s+/);
    if (words.length === 0) return;

    slidingWindowStateRef.current.wordBuffer = words;

    const slideIncrement = SPEECH_CONFIG.WINDOW_SIZE - SPEECH_CONFIG.WINDOW_OVERLAP;

    let windowsProcessed = 0;
    let totalWordsProcessed = 0;

    while (slidingWindowStateRef.current.lastTranslatedIndex + SPEECH_CONFIG.WINDOW_SIZE <= words.length) {
      const windowStart = slidingWindowStateRef.current.lastTranslatedIndex;
      const windowEnd = windowStart + SPEECH_CONFIG.WINDOW_SIZE;
      const chunk = words.slice(windowStart, windowEnd).join(' ');

      if (chunk.length >= SPEECH_CONFIG.MIN_SPEECH_LENGTH) {
        const translationId = `${Date.now()}-${slidingWindowStateRef.current.segmentId++}`;

        translateChunk(chunk, translationId, windowStart, windowEnd, isInterim);

        windowsProcessed++;
        totalWordsProcessed += (windowEnd - windowStart);

        console.log(`[${formattedTime}] [SLIDING_WINDOW] Processing window ${windowStart}-${windowEnd}: ${words.length} words total`);

        slidingWindowStateRef.current.lastTranslatedIndex += slideIncrement;

        slidingWindowStateRef.current.lastTranslationTimestamp = Date.now();
      } else {
        slidingWindowStateRef.current.lastTranslatedIndex++;
      }
    }

    if (!isInterim && slidingWindowStateRef.current.lastTranslatedIndex < words.length) {
      const remainingWords = words.length - slidingWindowStateRef.current.lastTranslatedIndex;

      if (remainingWords >= SPEECH_CONFIG.WINDOW_MIN_SIZE) {
        const finalChunk = words.slice(slidingWindowStateRef.current.lastTranslatedIndex).join(' ');
        const finalId = `final-${Date.now()}-${slidingWindowStateRef.current.segmentId++}`;

        translateChunk(finalChunk, finalId,
          slidingWindowStateRef.current.lastTranslatedIndex, words.length, false);

        windowsProcessed++;
        totalWordsProcessed += remainingWords;

        console.log(`[${formattedTime}] [SLIDING_WINDOW] Processing final chunk: ${remainingWords} words`);
      }

      slidingWindowStateRef.current.wordBuffer = [];
      slidingWindowStateRef.current.lastTranslatedIndex = 0;
    }

    if (windowsProcessed > 0) {
      const processingTime = performance.now() - processStart;
      console.log(`[${formattedTime}] [METRICS] Processed ${windowsProcessed} windows with ${totalWordsProcessed} words in ${processingTime.toFixed(2)}ms`);
    }
  };

  const translateChunk = async (text, id, startIdx, endIdx, isInterim) => {

    lastTranslationApiCallRef.current = Date.now();

    // Ensure we have a broadcast ID before sending translations
    if (!broadcastIdRef.current) {
      console.error('[TRANSLATION] Cannot translate: Missing broadcast ID');
      return;
    }

    const startTime = performance.now();
    const clientRequestTime = Date.now();
    const wordCount = text.split(/\s+/).length;
    const formattedTime = new Date().toISOString().split('T')[1].split('Z')[0];

    slidingWindowStateRef.current.pendingTranslations.set(id, {
      originalText: text,
      startPosition: startIdx,
      endPosition: endIdx,
      isInterim: isInterim,
      timestamp: Date.now(),
      startTime: startTime,
      wordCount: wordCount
    });

    console.log(`[TRANSLATION_REQUEST] ID: ${id}, Text: "${text}"`);

    try {
      const response = await fetch('https://churchtranslator.com/speech/translate_realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          clientId: clientIdRef.current,
          instanceId: instanceIdRef.current,
          broadcastId: broadcastIdRef.current,
          slidingWindowInfo: {
            segmentId: id,
            startWord: startIdx,
            endWord: endIdx,
            isInterim: isInterim
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Translation request failed: ${response.status}`);
      }
    } catch (error) {
      slidingWindowStateRef.current.pendingTranslations.delete(id);
    }

    const processingTime = performance.now() - startTime;
    console.log(`[SLIDING_WINDOW] Request processing: ${processingTime.toFixed(2)}ms for ${wordCount} words`);

    if (metricsSystemRef.current) {
      metricsSystemRef.current.recordTranslation(wordCount, processingTime);
    }

    console.log(`[${formattedTime}] [METRICS] chunk_sent,${id},${startIdx},${endIdx},${wordCount}`);
  };

  const stitchTranslations = (previousTranslation, currentTranslation, overlapWordCount) => {
    if (!previousTranslation) return currentTranslation;
    if (!currentTranslation) return previousTranslation;

    if (!overlapWordCount || overlapWordCount <= 0) {
      return previousTranslation + ' ' + currentTranslation;
    }

    const prevWords = previousTranslation.split(/\s+/);
    const currWords = currentTranslation.split(/\s+/);

    if (prevWords.length < overlapWordCount || currWords.length < overlapWordCount) {
      return previousTranslation + ' ' + currentTranslation;
    }

    const prevOverlap = prevWords.slice(-overlapWordCount);
    const currOverlap = currWords.slice(0, overlapWordCount);

    let matchCount = 0;
    for (let i = 0; i < overlapWordCount; i++) {
      if (prevOverlap[i].toLowerCase() === currOverlap[i].toLowerCase()) {
        matchCount++;
      }
    }

    const similarityScore = matchCount / overlapWordCount;

    if (similarityScore > 0.5) {
      return prevWords.slice(0, -overlapWordCount).join(' ') + ' ' +
        currWords.join(' ');
    } else {
      return previousTranslation + ' | ' + currentTranslation;
    }
  };

  const handleSlidingWindowTranslation = (data) => {
    const { translation, slidingWindowInfo } = data;
    if (!slidingWindowInfo) return;

    const { segmentId, startWord, endWord, isInterim } = slidingWindowInfo;
    const currentTime = Date.now();
    const formattedTime = new Date(currentTime).toISOString().split('T')[1].split('Z')[0];
    lastTranslationApiCallRef.current = Date.now();

    const translationStart = performance.now();

    const originalRequest = slidingWindowStateRef.current.pendingTranslations.get(segmentId);

    if (originalRequest) {
      const requestToResponseLatency = currentTime - originalRequest.timestamp;
      const processingLatency = performance.now() - originalRequest.startTime;

      if (metricsSystemRef.current) {
        metricsSystemRef.current.recordTranslation(
          originalRequest.wordCount,
          processingLatency
        );
      }

      console.log(`[${formattedTime}] [METRICS] Translation latency: ${processingLatency.toFixed(2)}ms for segment ${segmentId}, ${requestToResponseLatency}ms total`);
    }

    console.log(`[${formattedTime}] [SLIDING_WINDOW] Received translation segment ${segmentId} (${startWord}-${endWord}): "${translation.substring(0, 40)}${translation.length > 40 ? '...' : ''}"`);

    slidingWindowBufferRef.current.segments.set(startWord, {
      id: segmentId,
      startPosition: startWord,
      endPosition: endWord,
      translation: translation,
      timestamp: currentTime,
      isInterim: isInterim,
      processingTime: performance.now() - translationStart
    });

    const allSegments = Array.from(slidingWindowBufferRef.current.segments.entries())
      .sort((a, b) => a[0] - b[0]);

    let previousSegment = null;
    for (let i = allSegments.length - 1; i >= 0; i--) {
      const [prevStartPos, segmentData] = allSegments[i];
      if (prevStartPos < startWord && segmentData.id !== segmentId) {
        previousSegment = segmentData;
        break;
      }
    }

    if (previousSegment && previousSegment.endPosition > startWord) {
      const overlapSize = previousSegment.endPosition - startWord;

      console.log(`[OVERLAP_DETECTED] Between segments ${previousSegment.id} and ${segmentId}`);
      console.log(`  Overlap size: ${overlapSize} words`);
      console.log(`  Previous segment position: ${previousSegment.startPosition}-${previousSegment.endPosition}`);
      console.log(`  Current segment position: ${startWord}-${endWord}`);

      const prevWords = previousSegment.translation.split(/\s+/);
      const currWords = translation.split(/\s+/);

      const prevOverlap = prevWords.slice(-Math.min(overlapSize, prevWords.length)).join(' ');
      const currOverlap = currWords.slice(0, Math.min(overlapSize, currWords.length)).join(' ');

      console.log(`  Previous overlap text: "${prevOverlap}"`);
      console.log(`  Current overlap text: "${currOverlap}"`);

      const similarityScore = calculateSimilarityScore(prevOverlap, currOverlap);
      console.log(`  Similarity score: ${similarityScore.toFixed(2)}`);

      const stitchingStrategy = similarityScore > 0.7 ? "merge_at_overlap" : "append_with_separator";
      console.log(`  Stitching strategy: ${stitchingStrategy}`);
    }

    slidingWindowBufferRef.current.pendingChunks++;

    renderSlidingWindowTranslation();

    if (slidingWindowBufferRef.current.pendingChunks > 20) {
      cleanupOldSegments();
    }
  };

  const calculateSimilarityScore = (text1, text2) => {
    if (!text1 || !text2) return 0;

    const normalize = t => t.toLowerCase().replace(/[.,?!;:'"()]/g, '').trim();
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    if (!norm1 || !norm2) return 0;

    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);

    let matchCount = 0;
    const minLength = Math.min(words1.length, words2.length);

    for (let i = 0; i < minLength; i++) {
      if (words1[i] === words2[i]) matchCount++;
    }

    return minLength > 0 ? matchCount / minLength : 0;
  };


  const sendHeartbeat = async () => {
    if (!isRecording || !broadcastIdRef.current) {
      console.log('[HEARTBEAT] Skipping heartbeat - not recording or no broadcast ID');
      return;
    }

    try {
      const heartbeatData = {
        client_id: clientIdRef.current,
        timestamp: Date.now(),
        instance_id: instanceIdRef.current,
        stream_active: true
      };

      console.log(`[HEARTBEAT] Sending 1-hour heartbeat for broadcast ${broadcastIdRef.current}`);

      const response = await fetch(`https://churchtranslator.com/speech/heartbeat/${broadcastIdRef.current}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heartbeatData),
        signal: AbortSignal.timeout(15000) // 15 second timeout for the request
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // ONLY stop if server explicitly confirms with force_stop: true
        if (response.status === 404 && errorData.force_stop === true && errorData.confirmed_inactive === true) {
          console.error('[HEARTBEAT] Server confirmed broadcast is inactive');
          setHeartbeatStatus('error');
          await stopRecording();
          setError('Stream ended - no activity detected for over 1 hour');
          return;
        }

        // For any other error, just log and continue - don't stop the stream
        console.warn(`[HEARTBEAT] Heartbeat failed with ${response.status}, but continuing stream`);
        return;
      }

      const result = await response.json();
      lastHeartbeatRef.current = Date.now();
      setHeartbeatStatus('active');

      console.log(`[HEARTBEAT] 1-hour heartbeat acknowledged for broadcast ${broadcastIdRef.current}`);

    } catch (error) {
      console.warn('[HEARTBEAT] Heartbeat request failed:', error.message);

      // Never stop streaming on network errors - just log them
      if (error.name === 'AbortError') {
        console.warn('[HEARTBEAT] Heartbeat request timed out - will retry in 1 hour');
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('[HEARTBEAT] Network error - will retry in 1 hour');
      }

    }
  };

  const startHeartbeat = () => {
    console.log('[HEARTBEAT] Starting heartbeat system - every 1 hour');
    setHeartbeatStatus('active');

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up 1-hour interval
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, 3600000); // 1 hour = 3600000 milliseconds

    console.log('[HEARTBEAT] Heartbeat interval established (1 hour)');
  };


  const stopHeartbeat = () => {
    console.log('[HEARTBEAT] Stopping heartbeat system');
    setHeartbeatStatus('inactive');

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('[HEARTBEAT] Heartbeat interval cleared');
    }
  };

  // Add this new useEffect for heartbeat lifecycle management (around line 1200):
  useEffect(() => {
    if (isRecording && broadcastIdRef.current) {
      // Start heartbeat when recording begins
      startHeartbeat();
    } else {
      // Stop heartbeat when recording ends
      stopHeartbeat();
    }

    // Cleanup on unmount or when recording state changes
    return () => {
      stopHeartbeat();
    };
  }, [isRecording, currentBroadcastId]);


  useEffect(() => {
    if (!isRecording) return;

    // Much more relaxed monitoring - only warn after 90 minutes
    const heartbeatHealthCheck = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastHeartbeat = currentTime - (lastHeartbeatRef.current || 0);

      // Only warn after 90 minutes (30 minutes past the 1-hour mark)
      if (timeSinceLastHeartbeat > 5400000) { // 90 minutes
        console.warn(`[HEARTBEAT_HEALTH] No heartbeat sent for ${Math.floor(timeSinceLastHeartbeat / 60000)} minutes`);

        // Try to send a heartbeat immediately, but don't fail if it doesn't work
        sendHeartbeat().catch(() => {
          console.warn('[HEARTBEAT_HEALTH] Emergency heartbeat failed, but continuing');
        });
      }

      // Only show error after 2+ hours of complete failure
      if (heartbeatStatus === 'error' && timeSinceLastHeartbeat > 7200000) { // 2 hours
        console.error('[HEARTBEAT_HEALTH] No heartbeat for over 2 hours');
        setError('Extended connection issues detected');
      }
    }, 1800000); // Check every 30 minutes instead of 15 seconds

    return () => clearInterval(heartbeatHealthCheck);
  }, [isRecording, heartbeatStatus]);

  // Broadcast status checking - completely isolated to prevent transcription interference
  useEffect(() => {
    if (!isRecording || !broadcastIdRef.current) {
      if (broadcastStatusIntervalRef.current) {
        clearInterval(broadcastStatusIntervalRef.current);
        broadcastStatusIntervalRef.current = null;
      }
      return;
    }

    if (broadcastStatusIntervalRef.current) {
      clearInterval(broadcastStatusIntervalRef.current);
    }

    broadcastStatusIntervalRef.current = setInterval(() => {
      if (!isRecording || !broadcastIdRef.current) {
        clearInterval(broadcastStatusIntervalRef.current);
        broadcastStatusIntervalRef.current = null;
        return;
      }

      // Use requestIdleCallback for maximum non-blocking behavior
      if (window.requestIdleCallback) {
        window.requestIdleCallback(async () => {
          try {
            const response = await fetch(`https://churchtranslator.com/speech/broadcast_status/${broadcastIdRef.current}`, {
              signal: AbortSignal.timeout(3000) // 3 second timeout
            });

            if (response.ok) {
              const data = await response.json();
              if (data.status === 'End' || data.force_stop) {
                if (data.error) {
                  setError(data.error);
                }
                stopRecording();
              }
            }
          } catch (error) {
            // Completely silent - no logging to avoid any interference
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          try {
            const response = await fetch(`https://churchtranslator.com/speech/broadcast_status/${broadcastIdRef.current}`, {
              signal: AbortSignal.timeout(3000)
            });

            if (response.ok) {
              const data = await response.json();
              if (data.status === 'End' || data.force_stop) {
                if (data.error) {
                  setError(data.error);
                }
                stopRecording();
              }
            }
          } catch (error) {
            // Silent error handling
          }
        }, 0);
      }
    }, 20000); // 20 seconds

    return () => {
      if (broadcastStatusIntervalRef.current) {
        clearInterval(broadcastStatusIntervalRef.current);
        broadcastStatusIntervalRef.current = null;
      }
    };
  }, [isRecording]);


  const renderSlidingWindowTranslation = () => {
    const renderStart = performance.now();
    const formattedTime = new Date().toISOString().split('T')[1].split('Z')[0];

    if (slidingWindowBufferRef.current.segments.size === 0) {
      return;
    }

    const sortedSegments = Array.from(slidingWindowBufferRef.current.segments.values())
      .sort((a, b) => a.startPosition - b.startPosition);

    // SIMPLE FIX: Just show the LATEST segment instead of stitching
    const latestSegment = sortedSegments[sortedSegments.length - 1];

    if (latestSegment && latestSegment.translation !== slidingWindowBufferRef.current.lastDisplayed) {
      // setTranscription(latestSegment.translation);
      slidingWindowBufferRef.current.lastDisplayed = latestSegment.translation;

      const renderTime = performance.now() - renderStart;
      if (metricsSystemRef.current) {
        metricsSystemRef.current.recordRender(renderTime);
      }

      console.log(`[${formattedTime}] [SLIDING_WINDOW] Rendered latest segment in ${renderTime.toFixed(2)}ms`);
    }
  };

  const cleanupOldSegments = () => {
    const currentTime = Date.now();
    const MAX_AGE_MS = 10000;

    for (const [startPosition, segment] of slidingWindowBufferRef.current.segments.entries()) {
      if (currentTime - segment.timestamp > MAX_AGE_MS) {
        slidingWindowBufferRef.current.segments.delete(startPosition);
      }
    }

    slidingWindowBufferRef.current.pendingChunks = Math.min(
      slidingWindowBufferRef.current.pendingChunks,
      slidingWindowBufferRef.current.segments.size
    );

    console.log(`[SLIDING_WINDOW] Cleaned up old segments. ${slidingWindowBufferRef.current.segments.size} segments remaining.`);
  };



  // This function BEFORE initializeSpeechRecognition
  const getSpeechRecognitionLanguage = (voiceId) => {
    if (!voiceId) return 'en-US';

    // Extract language from voice ID (e.g., 'hi-IN-ArjunNeural' -> 'hi-IN')
    const parts = voiceId.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }

    return languageMap[voiceId] || 'en-US';
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setStatus(t('golive.status.speech_recognition_not_supported'));
      setError(t('golive.errors.browser_not_supported'));
      return false;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.maxAlternatives = 1;

    const speechLang = getSpeechRecognitionLanguage(selectedVoice);
    recognitionRef.current.lang = speechLang;

    console.log(`[SPEECH_RECOGNITION] Set language to: ${speechLang}`);

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setStatus('Listening...');
      setError('');
      lastSpeechTimestampRef.current = Date.now();
      segmentStartTimeRef.current = Date.now();
      retriesRef.current = 0;
    };

    recognitionRef.current.onend = () => {
      console.log('[SPEECH_RECOGNITION] onend triggered, isRecording:', isRecording);
      if (isRecording) {
        if (retriesRef.current >= 5) {
          console.log('Too many consecutive retries, reinitializing recognition');
          setError('Recognition service disconnected. Reconnecting...');

          recognitionRef.current = null;
          setTimeout(() => {
            if (isRecording) {
              retriesRef.current = 0;
              const reinitialized = initializeSpeechRecognition();
              if (reinitialized) {
                try {
                  recognitionRef.current.start();
                  console.log('Recognition reinitialized and restarted');
                  setError('');
                } catch (err) {
                  console.error('Failed to restart after reinitialization:', err);
                  setError('Failed to restart recognition. Please try again.');
                  setIsRecording(false);
                }
              }
            }
          }, 1500);
        } else {
          const delay = 50;
          retriesRef.current++;
          setTimeout(() => {
            if (isRecording && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log(`Recognition restarted after ${delay}ms delay (attempt ${retriesRef.current})`);
              } catch (e) {
                // console.error('Error restarting recognition:', e);
              }
            }
          }, delay);
        }
      } else {
        console.log('[SPEECH_RECOGNITION] onend ignored as recording is stopped');
        retriesRef.current = 0;
      }
    };


    recognitionRef.current.onerror = (event) => {
      if (event.error === 'no-speech') {
        console.log('Speech recognition: No speech detected, restarting');

        if (isRecording) {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Error restarting after no-speech:', e);
            }
          }, 50);
        }
      } else if (event.error === 'audio-capture' || event.error === 'not-allowed') {

        console.error('Microphone error:', event.error);
        setError(t(`golive.errors.microphone_error_${event.error.replace(/-/g, '_')}`,
          `Microphone error: ${event.error}`));
        setIsRecording(false);
      } else {
        // console.error(`Speech recognition error: ${event.error}`, event);
        // setError(t('golive.errors.too_many_restart_attempts'));
      }
    };

    recognitionRef.current.onresult = handleRecognitionResult;
    return true;
  };

 const handleRecognitionResult = (event) => {
  const currentTime = Date.now();
  const formattedTime = new Date(currentTime).toISOString().split('T')[1].split('Z')[0];

  console.log(`[${formattedTime}] Recognition result received`);

  for (let i = event.resultIndex; i < event.results.length; ++i) {
    let transcript = event.results[i][0].transcript;
    const timeSinceLastSpeech = currentTime - lastSpeechTimestampRef.current;
    const segmentDuration = currentTime - segmentStartTimeRef.current;
    const isInterim = !event.results[i].isFinal;

    const wordCount = transcript.trim().split(/\s+/).length;
    const isLongEnough = wordCount >= SPEECH_CONFIG.WORD_COUNT_THRESHOLD;

    if (!isInterim) {
      // ✅ ADD PUNCTUATION TO FINAL RESULTS
      const punctuatedText = addSmartPunctuation(transcript);
      
      console.log(`[PUNCTUATION] Original: "${transcript}"`);
      console.log(`[PUNCTUATION] With punctuation: "${punctuatedText}"`);
      
      if (punctuatedText !== lastProcessedTextRef.current) {
        lastProcessedTextRef.current = punctuatedText;

        // Append new text WITH PUNCTUATION
        accumulatedTextRef.current = accumulatedTextRef.current
          ? accumulatedTextRef.current + ' ' + punctuatedText
          : punctuatedText;

        // Trim if too long
        const words = accumulatedTextRef.current.split(/\s+/);
        if (words.length > 320) {
          const wordsToRemove = Math.ceil(words.length * 0.2);
          accumulatedTextRef.current = words.slice(wordsToRemove).join(' ');
        }
        
        setTranscription(accumulatedTextRef.current);
      }
    } else {
      // Show interim without punctuation
      setTranscription(accumulatedTextRef.current + (accumulatedTextRef.current ? ' ' : '') + transcript + '...');
    }

    if (SPEECH_CONFIG.USE_SLIDING_WINDOW) {
      // ✅ Use punctuated text for translation
      const textForTranslation = isInterim ? transcript : addSmartPunctuation(transcript);
      processSlidingWindow(textForTranslation, isInterim);
      lastTranslationApiCallRef.current = Date.now();

      if (timeSinceLastSpeech >= SPEECH_CONFIG.PAUSE_DURATION) {
        lastSpeechTimestampRef.current = currentTime;
      }

      if (!isInterim) {
        lastSpeechTimestampRef.current = currentTime;

        const hasPunctuation = transcript.match(/[.!?]$/);
        
        if (hasPunctuation ||
            timeSinceLastSpeech > SPEECH_CONFIG.PAUSE_DURATION ||
            isLongEnough) {

          slidingWindowStateRef.current.lastTranslatedIndex = 0;

          let resetReason = '';
          if (hasPunctuation)
            resetReason = 'punctuation';
          else if (timeSinceLastSpeech > SPEECH_CONFIG.PAUSE_DURATION)
            resetReason = `${SPEECH_CONFIG.PAUSE_DURATION}ms pause`;
          else if (isLongEnough)
            resetReason = `word count threshold (${wordCount} words)`;

          segmentStartTimeRef.current = currentTime;
          console.log(`[${formattedTime}] Segment reset: ${resetReason}`);
        }
      }
    } else {
      // Non-sliding window mode
      if (!isInterim) {
        const punctuatedText = addSmartPunctuation(transcript);
        sendTranslationRequest(punctuatedText, true);
      } else if (isLongEnough || timeSinceLastSpeech >= SPEECH_CONFIG.PAUSE_DURATION) {
        sendTranslationRequest(transcript, false);
        lastSpeechTimestampRef.current = currentTime;
      }
    }
  }
};

const addSmartPunctuation = (text) => {
  text = text.trim();
  if (!text) return text;
  
  // ========================================
  // CRITICAL FIX: Normalize Web Speech API quirks
  // ========================================
  
  // Step 1: Remove ALL existing punctuation and normalize case
  text = text
    .replace(/[.!?,;:]/g, ' ')  // Remove all punctuation first
    .replace(/\s+/g, ' ')        // Normalize spaces
    .toLowerCase()               // Convert everything to lowercase
    .trim();
  
  console.log(`[PUNCTUATION] Normalized input: ${text.substring(0, 100)}...`);
  
  // Step 2: Split into words
  const words = text.split(/\s+/);
  
  // Configuration
  const MIN_SENTENCE_LENGTH = 6;
  const MAX_SENTENCE_LENGTH = 15;  // Reduced for more frequent breaks
  const IDEAL_SENTENCE_LENGTH = 11;
  
  // Patterns
  const questionWords = ['what', 'why', 'how', 'who', 'when', 'where', 'which', 'whose', 'whom'];
  const questionHelpers = ['can', 'could', 'would', 'will', 'should', 'shall', 'do', 'does', 'did', 'are', 'is', 'was', 'were', 'have', 'has', 'had', 'am'];
  const sentenceStarters = ['hello', 'hi', 'okay', 'ok', 'well', 'now', 'so', 'but', 'however', 'therefore', 'still', 'yet', 'actually', 'basically', 'first', 'second', 'finally', 'then', 'next', 'also', 'furthermore'];
  const exclamationWords = ['wow', 'amazing', 'great', 'awesome', 'wonderful', 'hallelujah', 'praise', 'amen', 'thank', 'thanks', 'glory', 'blessed'];
  const conjunctions = ['and', 'but', 'or', 'so', 'because', 'while', 'although', 'since', 'unless'];
  
  const sentences = [];
  let currentSentence = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1] || '';
    const nextNextWord = words[i + 2] || '';
    
    currentSentence.push(word);
    const length = currentSentence.length;
    
    let shouldBreak = false;
    let reason = '';
    
    // RULE 1: Maximum length - FORCE BREAK
    if (length >= MAX_SENTENCE_LENGTH) {
      shouldBreak = true;
      reason = 'max_length';
    }
    
    // RULE 2: Sentence starter at ideal length
    else if (length >= MIN_SENTENCE_LENGTH && sentenceStarters.includes(nextWord)) {
      shouldBreak = true;
      reason = 'sentence_starter';
    }
    
    // RULE 3: Question word ahead
    else if (length >= MIN_SENTENCE_LENGTH && questionWords.includes(nextWord)) {
      shouldBreak = true;
      reason = 'question_word';
    }
    
    // RULE 4: Question pattern (helper + pronoun)
    else if (length >= MIN_SENTENCE_LENGTH && 
             questionHelpers.includes(nextWord) && 
             ['you', 'we', 'they', 'i', 'he', 'she', 'it'].includes(nextNextWord)) {
      shouldBreak = true;
      reason = 'question_pattern';
    }
    
    // RULE 5: Conjunction at ideal length
    else if (length >= IDEAL_SENTENCE_LENGTH && conjunctions.includes(nextWord)) {
      shouldBreak = true;
      reason = 'conjunction';
    }
    
    // RULE 6: Long sentence + any good break
    else if (length >= 13 && (sentenceStarters.includes(nextWord) || conjunctions.includes(nextWord))) {
      shouldBreak = true;
      reason = 'long_break';
    }
    
    // RULE 7: Last word
    else if (i === words.length - 1) {
      shouldBreak = true;
      reason = 'last_word';
    }
    
    if (shouldBreak) {
      const sentence = currentSentence.join(' ').trim();
      if (sentence) {
        sentences.push(sentence);
        console.log(`[PUNCTUATION] Sentence (${length} words, ${reason}): ${sentence.substring(0, 40)}...`);
      }
      currentSentence = [];
    }
  }
  
  // Add remaining words
  if (currentSentence.length > 0) {
    sentences.push(currentSentence.join(' ').trim());
  }
  
  // Step 3: Add punctuation to each sentence
  const punctuated = sentences.map(sentence => {
    if (!sentence) return '';
    
    const words = sentence.split(/\s+/);
    const first = words[0];
    const second = words[1] || '';
    const sentenceLower = sentence.toLowerCase();
    
    // Detect question
    const isQuestion = 
      questionWords.includes(first) ||
      (questionHelpers.includes(first) && ['you', 'we', 'they', 'i', 'he', 'she', 'it'].includes(second)) ||
      /\b(what|why|how|who|when|where|which)\b/.test(sentenceLower) ||
      /\b(can|could|would|will|should|do|does|did|are|is|was|were)\s+(you|we|they|i|he|she|it)\b/.test(sentenceLower);
    
    // Detect exclamation
    const isExclamation = 
      exclamationWords.includes(first) ||
      exclamationWords.some(w => sentenceLower.includes(w)) && words.length <= 8;
    
    // Capitalize first letter
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    
    // Add punctuation
    if (isQuestion) {
      return sentence + '?';
    } else if (isExclamation) {
      return sentence + '!';
    } else {
      return sentence + '.';
    }
  });
  
  const result = punctuated.join(' ');
  console.log(`[PUNCTUATION] Final result: ${result.substring(0, 150)}...`);
  
  return result;
};

// Helper function to add commas within sentences
const addCommasToSentence = (sentence, conjunctions) => {
  const words = sentence.split(/\s+/);
  const result = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1] ? words[i + 1].toLowerCase() : '';
    const nextNextWord = words[i + 2] ? words[i + 2].toLowerCase() : '';
    
    result.push(word);
    
    // Add comma before conjunctions if segment is long enough
    if (i >= 5 && i < words.length - 3) {
      // Add comma before "and", "but", "or", "so" in mid-sentence
      if (['and', 'but', 'or', 'so'].includes(nextWord)) {
        result[result.length - 1] += ',';
      }
      // Add comma after "because", "while", "although", "though", "since"
      else if (['because', 'while', 'although', 'though', 'since', 'unless'].includes(word.toLowerCase())) {
        // Comma will be after this word
      }
    }
    
    // Add comma after introductory phrases
    if (i === 0 && ['however', 'therefore', 'moreover', 'furthermore', 'thus', 'consequently'].includes(word.toLowerCase())) {
      result[result.length - 1] += ',';
    }
    
    // Add comma before "which", "who", "where" in relative clauses
    if (i >= 3 && ['which', 'who', 'where', 'when'].includes(nextWord)) {
      result[result.length - 1] += ',';
    }
  }
  
  return result.join(' ');
};
  const checkStreamStatusEvery3Seconds = async () => {
    if (!isRecording) {
      console.log('[STREAM_CHECK] Skipping check - not recording');
      return;
    }

    try {
      const churchId = localStorage.getItem("churchId");
      console.log(`[STREAM_CHECK] Checking stream status for church ${churchId}`);

      const response = await fetch(`${apiBaseUrl}/sermon/checksermon?churchId=${churchId}`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.status === 404) {
        // Only react to 404 if stream has been established for a while
        const recordingDuration = Date.now() - (segmentStartTimeRef.current || Date.now());

        if (streamEstablishedRef.current && recordingDuration > 600000) { // Only after 10 minutes
          console.log("[STREAM_CHECK] Stream confirmed stopped by admin after long establishment");

          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);

          // Update UI only - don't call full stopRecording
          setIsRecording(false);
          setShowShareBox(false);
          setTranscription('');
          accumulatedTextRef.current = '';
          lastProcessedTextRef.current = '';
          setStatus('Your stream was stopped by admin');
          setError('Stream ended by administrator');
          setSelectedMicrophoneId('');
          setSelectedGender('');
          setSelectedVoice('');
          setChurchAlreadyLive(false);

          // Clean up frontend only
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
          }
          if (translationSourceRef.current) {
            translationSourceRef.current.close();
            translationSourceRef.current = null;
          }
          if (wakeLockRef.current) {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
          }

          broadcastIdRef.current = null;
          setCurrentBroadcastId(null);
          setShareableUrl('');
          localStorage.removeItem('currentBroadcastId');
          streamEstablishedRef.current = false;
        } else {
          console.log("[STREAM_CHECK] 404 received but ignoring - stream not established long enough");
        }
      } else if (response.ok) {
        if (!streamEstablishedRef.current) {
          streamEstablishedRef.current = true;
          console.log("[STREAM_CHECK] Stream successfully established");
        }
      } else {
        console.warn(`[STREAM_CHECK] Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("[STREAM_CHECK] Stream status check timed out");
      } else {
        console.error("[STREAM_CHECK] Error checking stream status:", error);
      }
      // Don't show errors to user for network issues
    }
  };

  useEffect(() => {
    if (!isRecording) return;

    console.log('[STREAM_CHECK] Starting relaxed stream monitoring (every 15 minutes)');

    // Wait 10 minutes before starting any checks, then check every 15 minutes
    const firstCheckTimeout = setTimeout(() => {
      console.log('[STREAM_CHECK] Starting periodic checks');

      // Do one initial check
      checkStreamStatusEvery3Seconds();

      // Then check every 15 minutes
      const statusCheckInterval = setInterval(() => {
        console.log('[STREAM_CHECK] Performing periodic stream status check');
        checkStreamStatusEvery3Seconds();
      }, 900000); // 15 minutes instead of 3 seconds

      return () => {
        console.log('[STREAM_CHECK] Cleaning up status check interval');
        clearInterval(statusCheckInterval);
      };
    }, 600000); // Wait 10 minutes before starting

    return () => {
      console.log('[STREAM_CHECK] Cleaning up stream monitoring');
      clearTimeout(firstCheckTimeout);
    };
  }, [isRecording]);

  useEffect(() => {
    if (transcriptionBoxRef.current) {
      transcriptionBoxRef.current.scrollTop = transcriptionBoxRef.current.scrollHeight;
    }
  }, [transcription]);


  const checkExistingLiveSermons = async () => {
    try {
      const churchId = localStorage.getItem("churchId");
      if (!churchId) {
        console.error("No church ID found in local storage");
        setChurchAlreadyLive(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/sermon/checksermon?churchId=${churchId}`);

      if (response.status === 404) {
        console.log("No live sermons found");
        setChurchAlreadyLive(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to check sermon status: ${response.status}`);
      }

      const data = await response.json();

      if (data.liveSermonCount > 0) {
        const churchLiveSermons = data.liveSermons.filter(sermon => sermon.churchId === churchId);

        if (churchLiveSermons.length > 0) {
          const liveSermon = churchLiveSermons[0]; // Get the first live sermon

          // Check if there are no active listeners
          if (liveSermon.listeners === 0 || liveSermon.active_listeners === 0) {
            console.log("Found live sermon with no listeners, stopping it automatically");

            try {
              // Stop the previous sermon
              const stopResponse = await fetch('https://churchtranslator.com/speech/stop_stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ broadcast_id: liveSermon.broadcast_id }),
              });

              if (stopResponse.ok) {
                console.log("Previous sermon stopped successfully");
                setChurchAlreadyLive(false);
              } else {
                console.error("Failed to stop previous sermon");
                setChurchAlreadyLive(true);
              }
            } catch (stopError) {
              console.error("Error stopping previous sermon:", stopError);
              setChurchAlreadyLive(true);
            }
          } else {
            console.log("Another broadcast is already live with active listeners");
            setChurchAlreadyLive(true);
          }
        } else {
          setChurchAlreadyLive(false);
        }
      } else {
        setChurchAlreadyLive(false);
      }
    } catch (error) {
      console.error("Error checking sermon status:", error);
      setChurchAlreadyLive(false);
    }
  };


  const sendTranslationRequest = async (text, isFinal) => {

    lastTranslationApiCallRef.current = Date.now();

    if (!text.trim() || text.length < SPEECH_CONFIG.MIN_SPEECH_LENGTH) return;
    if (!broadcastIdRef.current) {
      console.error('[TRANSLATION] Cannot translate: Missing broadcast ID');
      return;
    }

    try {
      const response = await fetch('https://churchtranslator.com/speech/translate_realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          clientId: clientIdRef.current,
          instanceId: instanceIdRef.current,
          broadcastId: broadcastIdRef.current,
          isFinal,
          wordCountTriggered: text.split(' ').length >= SPEECH_CONFIG.WORD_COUNT_THRESHOLD
        })
      });

      if (!response.ok) {
        throw new Error(`Translation request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (!error.message.includes('Failed to fetch')) {
        setError(t('golive.errors.translation_error', 'Translation error occurred: ' + error.message));
      }
    }
  };

  const initializeTranslationStream = () => {
    if (translationSourceRef.current) {
      translationSourceRef.current.close();
    }

    if (!broadcastIdRef.current) {
      console.error('[TRANSLATION] Cannot initialize stream: Missing broadcast ID');
      setError(t('golive.errors.missing_broadcast_id'));
      return;
    }

    translationSourceRef.current = new EventSource(
      `https://churchtranslator.com/speech/stream_translation/en?client_id=${clientIdRef.current}&role=broadcaster&broadcast_id=${broadcastIdRef.current}&instance_id=${instanceIdRef.current}`
    );
    // Add connection logging
    translationSourceRef.current.onopen = () => {
      console.log('[TRANSLATION_STREAM] Connection established successfully');
      lastTranslationApiCallRef.current = Date.now();
    }

    translationSourceRef.current.onmessage = (event) => {
      try {
        const responseTimestamp = Date.now();
        const data = JSON.parse(event.data);

        if (data.keepalive) return;
        if (!data.translation) return;

        if (data.instance_id && data.instance_id !== instanceIdRef.current) {
          return;
        }

        lastTranslationApiCallRef.current = Date.now();

        if (data.slidingWindowInfo) {
          handleSlidingWindowTranslation(data);
        } else {
          setTranscription(data.translation);
        }
      } catch (error) {
        console.error('Error processing translation:', error);
      }
    };

    translationSourceRef.current.onerror = (error) => {
      console.error('Translation stream error:', error);

      // Close the broken connection immediately
      if (translationSourceRef.current) {
        translationSourceRef.current.close();
        translationSourceRef.current = null;
      }

      // Reconnect faster and more aggressively
      if (isRecording && broadcastIdRef.current) {
        console.log('[TRANSLATION_STREAM] Attempting immediate reconnection...');
        setTimeout(() => {
          if (isRecording && broadcastIdRef.current) {
            console.log('[TRANSLATION_STREAM] Reconnecting translation stream...');
            initializeTranslationStream();
          }
        }, 1000); // Reduced from 2000ms to 1000ms
      }
    };
  };

  // ADD THIS ENTIRE useEffect BLOCK 
  useEffect(() => {
    if (!isRecording) return;

    console.log('[TRANSLATION_MONITOR] Starting translation stream monitoring');

    const streamMonitorInterval = setInterval(() => {
      if (isRecording && broadcastIdRef.current) {
        // Check if translation stream is still connected
        if (!translationSourceRef.current || translationSourceRef.current.readyState === EventSource.CLOSED) {
          console.log('[TRANSLATION_MONITOR] Translation stream disconnected, reconnecting...');
          initializeTranslationStream();
        }

        // Check if we haven't received translations for too long
        const timeSinceLastTranslation = Date.now() - lastTranslationApiCallRef.current;
        if (timeSinceLastTranslation > 30000) { // 30 seconds
          console.log('[TRANSLATION_MONITOR] No translation activity for 30s, restarting stream...');
          if (translationSourceRef.current) {
            translationSourceRef.current.close();
            translationSourceRef.current = null;
          }
          initializeTranslationStream();
          lastTranslationApiCallRef.current = Date.now();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(streamMonitorInterval);
  }, [isRecording]);

  // Add this after your other useEffect hooks

  useEffect(() => {

    if (!isRecording) return;
    console.log('[SILENCE_MONITOR] Starting silence monitoring system');

    const silenceMonitorInterval = setInterval(() => {

      const currentTime = Date.now();

      const timeSinceLastSpeech = currentTime - lastSpeechTimestampRef.current;

      if (timeSinceLastSpeech > 1000 && recognitionRef.current) {
        console.log(`[SILENCE_MONITOR] Detected ${Math.floor(timeSinceLastSpeech / 1000)}s silence, proactively restarting recognition`);
        try {
          recognitionRef.current.stop();
          // Use a short timeout to ensure clean stop/start cycle

          setTimeout(() => {
            if (isRecording && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('[SILENCE_MONITOR] Recognition restarted successfully');
                // Update timestamp to avoid immediate retriggering
                lastSpeechTimestampRef.current = Date.now() - 5000; // Set to 5 seconds ago

              } catch (e) {
                // If we couldn't restart, try to reinitialize completely
                const reinitialized = initializeSpeechRecognition();

                if (reinitialized && isRecording) {

                  recognitionRef.current.start();

                }

              }

            }

          }, 300);

        } catch (e) {

          console.error('[SILENCE_MONITOR] Error in silence monitor:', e);

        }

      }

    }, 3000);



    return () => clearInterval(silenceMonitorInterval);

  }, [isRecording]);


  useEffect(() => {
    const fetchChurchLanguages = async () => {
      try {
        const churchId = localStorage.getItem("churchId");
        if (!churchId) {
          console.error("No church ID found");
          setIsLoadingLanguages(false);
          return;
        }

        console.log("Fetching church languages for churchId:", churchId);
        const response = await fetch(`${apiBaseUrl}/church/detail/${churchId}?languages=goLive`);

        if (!response.ok) {
          throw new Error('Failed to fetch church languages');
        }

        const data = await response.json();
        console.log("Church languages response:", data);

        const goLiveLanguages = data.languageSettings?.goLive || { male: [], female: [] };

        const transformedOptions = {
          male: goLiveLanguages.male.map(lang => ({
            value: lang.id,
            label: `${lang.language} (Male)`
          })),
          female: goLiveLanguages.female.map(lang => ({
            value: lang.id,
            label: `${lang.language} (Female)`
          }))
        };

        setDynamicVoiceOptions(transformedOptions);
        console.log('Loaded dynamic voice options:', transformedOptions);
      } catch (error) {
        console.error('Error fetching church languages:', error);
        setDynamicVoiceOptions({ male: [], female: [] });
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    fetchChurchLanguages();
  }, []);

  useEffect(() => {
    const initializeMicrophones = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(device => device.kind === 'audioinput');
        await logMicrophoneDetails();

        setMicrophones(mics);

        if (mics.length === 0) {
          setError(t('golive.errors.no_microphones_found'));
        } else {
          setError('');
          setSelectedMicrophoneId('');
          const initialized = initializeSpeechRecognition();
          setIsInitialized(initialized);
        }

        if (!isInitialized) {
          const initialized = initializeSpeechRecognition();
          setIsInitialized(initialized);
        }
      } catch (error) {
        console.error('Error initializing microphones:', error);
        setError(t('golive.errors.microphone_permission_denied'));
      }
    };

    initializeMicrophones();
    // checkExistingLiveSermons();
    // setIsCheckingSermons(true);
    // checkExistingLiveSermons().finally(() => setIsCheckingSermons(false));
    navigator.mediaDevices.addEventListener('devicechange', initializeMicrophones);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', initializeMicrophones);
    };
  }, []);




  const formatCountdown = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} minutes ${seconds} seconds`;
  };

  const triggerListenerPopup = () => {
    if (popupShown) return;
    setPopupShown(true);
    setShowListenerPopup(true);
    setCountdownSeconds(300);

    const countdown = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          handleCloseStream();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownInterval(countdown);
  };


  const handleKeepStreaming = () => {
    setShowListenerPopup(false);
    setPopupShown(false);
    setCountdownSeconds(300);
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
  };

  const handleCloseStream = async () => {
    setShowListenerPopup(false);
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    await stopRecording();
  };

  useEffect(() => {
    if (!isRecording || !broadcastIdRef.current) return;

    const initialDelay = setTimeout(() => {
      const listenerCheckInterval = setInterval(async () => {
        try {
          const churchId = localStorage.getItem("churchId");
          const response = await fetch(`${apiBaseUrl}/sermon/checksermon?churchId=${churchId}`);

          if (response.ok) {
            const data = await response.json();
            const currentSermon = data.liveSermons?.find(sermon =>
              sermon.broadcast_id === broadcastIdRef.current
            );

            if (currentSermon && currentSermon.listeners === 0) {
              console.log('[LISTENER_MONITOR] No listeners detected, showing popup');
              triggerListenerPopup();
              clearInterval(listenerCheckInterval);
            }
          }
        } catch (error) {
          console.error('[LISTENER_MONITOR] Error:', error);
        }
      }, 10000); // Check every 10 seconds after initial delay

      return () => clearInterval(listenerCheckInterval);
    }, 2700000);

    return () => clearTimeout(initialDelay);
  }, [isRecording]);



  const startRecording = async () => {
    if (!isInitialized) {
      retriesRef.current = 0;
      const initialized = initializeSpeechRecognition();
      if (!initialized) return;
      setIsInitialized(initialized);
    }

    try {
      // Validation: Check if gender and voice are selected
      if (!selectedGender) {
        setError('Please select a gender before starting');
        return;
      }

      if (!selectedVoice) {
        setError('Please select a voice before starting');
        return;
      }

      // Reset sliding window state
      slidingWindowStateRef.current = {
        wordBuffer: [],
        lastTranslatedIndex: 0,
        pendingTranslations: new Map(),
        translationResponses: new Map(),
        segmentId: 0,
        lastTranslationTimestamp: Date.now()
      };

      slidingWindowBufferRef.current = {
        segments: new Map(),
        lastDisplayed: null,
        pendingChunks: 0,
        enabled: SPEECH_CONFIG.USE_SLIDING_WINDOW
      };

      // Attempt to acquire screen wake lock
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[WAKE_LOCK] Screen wake lock acquired');
          setError(''); // Clear any previous errors
        } catch (err) {
          console.error('[WAKE_LOCK] Failed to acquire wake lock:', err);
          setError(t('golive.errors.wake_lock_not_supported'));
        }
      } else {
        console.warn('[WAKE_LOCK] Screen Wake Lock API not supported in this browser');
        setError(t('golive.errors.wake_lock_not_supported'));
      }

      const userId = localStorage.getItem("userId");
      const churchId = localStorage.getItem("churchId");
      console.log("User ID:", userId);
      console.log("Church ID:", churchId);

      const queryParams = new URLSearchParams({
        userId,
        churchId
      });

      // Start the stream with the backend - including gender and voice information
      const startStreamResponse = await fetch(`https://churchtranslator.com/speech/start_stream?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: selectedMicrophoneId,
          deviceSettings: AUDIO_CONFIG,
          clientId: clientIdRef.current,
          name: 'Sermon Broadcaster',
          language: selectedLanguage,
          gender: selectedGender,        // Include gender
          voiceId: selectedVoice,        // Include selected voice ID
          role: 'broadcaster'            // Specify role as broadcaster
        })
      });

      if (!startStreamResponse.ok) {
        let errorMessage = 'Failed to start stream';
        let shouldShowDetailedError = false;

        try {
          const errorData = await startStreamResponse.json();

          // Handle specific error codes
          if (errorData.error_code === 'INVALID_SPEECH_API_KEY') {
            errorMessage = 'Speech API credentials are invalid. Please contact your administrator to update the Azure Speech Service configuration.';
            shouldShowDetailedError = true;
            console.error('[SPEECH_API_ERROR] Invalid speech credentials:', errorData.error);
          }
          else if (errorData.error_code === 'NO_API_KEYS') {
            errorMessage = 'No API Configurations Found with this Church';
            shouldShowDetailedError = true;
          }
          else if (errorData.error_code === 'CHURCH_NOT_FOUND') {
            errorMessage = 'Church not found';
            shouldShowDetailedError = true;
          }
          else if (errorData.error_code === 'SELECTION_REQUIRED') {
            errorMessage = 'Gender and Voice selection are required before starting';
            shouldShowDetailedError = true;
          }
          else if (errorData.error_code === 'CONFIG_ERROR') {
            errorMessage = 'Church configuration error. Please contact your administrator.';
            shouldShowDetailedError = true;
          }
          else if (errorData.error) {
            errorMessage = errorData.error;
            shouldShowDetailedError = true;
          }

          // Log the full error details for debugging
          console.error('[START_STREAM_ERROR] Full error response:', {
            status: startStreamResponse.status,
            statusText: startStreamResponse.statusText,
            errorCode: errorData.error_code,
            errorMessage: errorData.error,
            fullResponse: errorData
          });

        } catch (parseError) {
          console.error('Error parsing error response:', parseError);

          // Handle HTTP status codes when JSON parsing fails
          if (startStreamResponse.status === 400) {
            errorMessage = 'Invalid request. Please check your configuration and try again.';
          } else if (startStreamResponse.status === 401) {
            errorMessage = 'Authentication failed. Please check your API credentials.';
          } else if (startStreamResponse.status === 403) {
            errorMessage = 'Access denied. Please check your permissions.';
          } else if (startStreamResponse.status === 404) {
            errorMessage = 'Service not found. Please try again later.';
          } else if (startStreamResponse.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = `Request failed with status ${startStreamResponse.status}`;
          }
        }

        throw new Error(errorMessage);
      }

      // Process the response to get broadcast ID and join URL
      const streamData = await startStreamResponse.json();
      if (streamData.success) {
        broadcastIdRef.current = streamData.broadcast_id;
        setCurrentBroadcastId(streamData.broadcast_id);

        streamEstablishedRef.current = false;

        localStorage.setItem('currentBroadcastId', streamData.broadcast_id);

        // --- NEW: Initialize heartbeat tracking immediately after successful stream creation ---
        lastHeartbeatRef.current = Date.now();
        console.log(`[HEARTBEAT] Initialized heartbeat tracking for broadcast ${streamData.broadcast_id}`);

        // Create shareable URL
        const joinUrl = streamData.join_url;
        const fullShareUrl = window.location.origin + joinUrl;
        setShareableUrl(fullShareUrl);
        setShowShareBox(true);

        console.log(`[BROADCAST] Created new broadcast with ID: ${streamData.broadcast_id}`);
        console.log(`[BROADCAST] Shareable URL: ${fullShareUrl}`);
      } else {
        throw new Error('Failed to create broadcast session');
      }

      // Now that we have a broadcast ID, initialize the translation stream
      initializeTranslationStream();

      try {
        await recognitionRef.current.start();
        setIsRecording(true);

        // --- NEW: Start heartbeat system after successfully starting recording ---
        console.log('[HEARTBEAT] Starting heartbeat system after successful recording start');
        // Note: The heartbeat will be started by the useEffect that monitors isRecording state

      } catch (e) {
        console.error('Error starting recognition:', e);
        const reinitialized = initializeSpeechRecognition();
        if (reinitialized) {
          try {
            await recognitionRef.current.start();
            setIsRecording(true);
            console.log('[HEARTBEAT] Recording started successfully after reinitialization');
          } catch (retryError) {
            // Release wake lock if recognition fails after retry
            if (wakeLockRef.current) {
              await wakeLockRef.current.release();
              wakeLockRef.current = null;
              console.log('[WAKE_LOCK] Screen wake lock released due to recognition failure');
            }
            // Stop heartbeat on recognition failure
            stopHeartbeat();
            throw new Error(`Failed to start recognition after retry: ${retryError.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error starting stream:', error);

      let displayError = error.message;
      if (error.message.includes('No API Configurations Found with this Church') || error.message.includes('No API Keys Configured')) {
        displayError = 'No API Configurations Found with this Church';
      } else if (error.message.includes('Church not found')) {
        displayError = 'Church not found';
      } else if (error.message.includes('Failed to start stream')) {
        displayError = 'No API Configurations Found with this Church';
      }

      setError(displayError);
      setIsRecording(false);
      setShowShareBox(false);

      // --- NEW: Ensure heartbeat is stopped on any error ---
      stopHeartbeat();
      console.log('[HEARTBEAT] Stopped heartbeat due to startRecording error');

      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WAKE_LOCK] Screen wake lock released due to error');
      }
    }
  };

  useEffect(() => {
    setIsCheckingSermons(true);
    checkExistingLiveSermons().finally(() => setIsCheckingSermons(false));
  }, []);


  useEffect(() => {
    const storedBroadcastId = localStorage.getItem('currentBroadcastId');
    setIsCheckingSermons(true);
    if (storedBroadcastId) {
      setCurrentBroadcastId(storedBroadcastId);
      const stopBroadcast = async () => {
        try {
          const response = await fetch('https://churchtranslator.com/speech/stop_stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ broadcast_id: storedBroadcastId }),
          });
          if (!response.ok) throw new Error('Failed to stop broadcast');
          console.log('Broadcast stopped successfully on page refresh');
          localStorage.removeItem('currentBroadcastId');
          setCurrentBroadcastId(null);
          // await checkExistingLiveSermons();
        } catch (error) {
          console.error('Error stopping broadcast on page refresh:', error);
          setError(t('golive.errors.error_stopping_stream', 'Error stopping stream: ' + error.message));
          // await checkExistingLiveSermons();
        } finally {
          setIsCheckingSermons(false);
        }
      };
      stopBroadcast();
    } else {
      // checkExistingLiveSermons().finally(() => setIsCheckingSermons(false));
      setIsCheckingSermons(false);
    }
  }, []);


  const stopRecording = async () => {
    try {
      // --- NEW: Stop heartbeat first thing ---
      console.log('[HEARTBEAT] Stopping heartbeat system as part of stopRecording');
      stopHeartbeat();

      setIsRecording(false);
      setShowShareBox(false);
      setTranscription('');
      accumulatedTextRef.current = '';
      lastProcessedTextRef.current = '';
      setStatus('Ready to start');
      setSelectedMicrophoneId('');
      setSelectedGender('');
      setSelectedVoice('');


      streamEstablishedRef.current = false;

      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      // Stop audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Close translation stream
      if (translationSourceRef.current) {
        translationSourceRef.current.close();
        translationSourceRef.current = null;
      }

      // Release wake lock
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WAKE_LOCK] Screen wake lock released');
      }

      // Clear sliding window state
      slidingWindowStateRef.current = {
        wordBuffer: [],
        lastTranslatedIndex: 0,
        pendingTranslations: new Map(),
        translationResponses: new Map(),
        segmentId: 0,
        lastTranslationTimestamp: Date.now(),
      };
      slidingWindowBufferRef.current = {
        segments: new Map(),
        lastDisplayed: null,
        pendingChunks: 0,
        enabled: SPEECH_CONFIG.USE_SLIDING_WINDOW,
      };

      // Stop the broadcast stream
      if (broadcastIdRef.current) {
        console.log(`[BROADCAST] Stopping stream for broadcast ${broadcastIdRef.current}`);
        const stopStreamResponse = await fetch('https://churchtranslator.com/speech/stop_stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ broadcast_id: broadcastIdRef.current }),
        });
        if (!stopStreamResponse.ok) throw new Error('Failed to stop stream');

        console.log(`[BROADCAST] Successfully stopped stream ${broadcastIdRef.current}`);
        broadcastIdRef.current = null;
        setCurrentBroadcastId(null);
        setShareableUrl('');
        localStorage.removeItem('currentBroadcastId');
      }

      // Re-check live sermons
      setIsCheckingSermons(true);
      await checkExistingLiveSermons();
    } catch (error) {
      console.error('Error stopping stream:', error);
      setError(t('golive.errors.error_stopping_stream', 'Error stopping stream: ' + error.message));

      // --- NEW: Ensure heartbeat is stopped even on error ---
      stopHeartbeat();
      console.log('[HEARTBEAT] Ensured heartbeat stopped despite stopRecording error');

      // Ensure wake lock is released on error
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WAKE_LOCK] Screen wake lock released due to error');
      }
    } finally {
      setIsCheckingSermons(false);
      retriesRef.current = 0; // Reset retries to prevent restarts
      setIsInitialized(false); // Force reinitialization on next start
      accumulatedTextRef.current = '';
      lastProcessedTextRef.current = '';

      // --- NEW: Final heartbeat cleanup in finally block ---
      stopHeartbeat();
      console.log('[HEARTBEAT] Final heartbeat cleanup in stopRecording finally block');
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isRecording && !wakeLockRef.current) {
        if ('wakeLock' in navigator) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.log('[WAKE_LOCK] Screen wake lock re-acquired on visibility change');
          } catch (err) {
            console.error('[WAKE_LOCK] Failed to re-acquire wake lock:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording]);

  // ==================================================heartbeat END-===============================================

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (translationSourceRef.current) {
        translationSourceRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // If there's an active broadcast, stop it
      if (broadcastIdRef.current) {
        fetch('https://churchtranslator.com/speech/stop_stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            broadcast_id: broadcastIdRef.current
          })
        }).catch(console.error);
      }
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ pt: 5 }}>
      <SEO
        title={t('golive.seo.title')}
        description={t('golive.seo.description')}
        keywords={t('golive.seo.keywords')}
        canonical="real-time-sermon-translation"
      />
      <Card>
        <CardContent>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            sx={{
              color: '#47362b',
              fontSize: '32px',
              fontWeight: 'normal',
              mb: 4
            }}
          >
            {t('golive.labels.professional_speech_translation')}
          </Typography>

          <Box sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
            <FormControl fullWidth>
              <StyledSelect
                value={selectedMicrophoneId}
                onChange={(e) => {
                  setSelectedMicrophoneId(e.target.value);
                  if (e.target.value && !isInitialized) {
                    const initialized = initializeSpeechRecognition();
                    setIsInitialized(initialized);
                  }
                }}
                disabled={isRecording}
                displayEmpty
              >
                <MenuItem value="">{t('golive.options.choose_microphone')}</MenuItem>
                {microphones.map((mic) => (
                  <MenuItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.substring(0, 8)}`}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>

            {/* <FormControl fullWidth>
              <StyledSelect
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isRecording}
                displayEmpty
              >
                <MenuItem value="en">{t('golive.options.language_english')}</MenuItem>
              </StyledSelect>
            </FormControl> */}

            {/* New Gender Selection Dropdown */}
            <FormControl fullWidth>
              <StyledSelect
                value={selectedGender}
                onChange={handleGenderChange}
                disabled={isRecording}
                displayEmpty
              >
                <MenuItem value="">Choose Gender</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </StyledSelect>
            </FormControl>

            {/* New Voice Selection Dropdown */}
            <FormControl fullWidth>
              <StyledSelect
                value={selectedVoice}
                onChange={handleVoiceChange}
                disabled={isRecording || !selectedGender || isLoadingLanguages}
                displayEmpty
              >
                <MenuItem value="">
                  {isLoadingLanguages
                    ? 'Loading voices...'
                    : selectedGender
                      ? 'Choose Voice'
                      : 'Select Gender First'
                  }
                </MenuItem>
                {!isLoadingLanguages && getAvailableVoices().map((voice) => (
                  <MenuItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>

            <StyledButton
              variant="contained"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!selectedMicrophoneId || !isInitialized || churchAlreadyLive || !selectedGender || !selectedVoice || isLoadingLanguages} $recording={isRecording}
            >
              {isRecording ? t('golive.buttons.stop') : t('golive.buttons.start_speaking')}
            </StyledButton>

            {!isCheckingSermons && churchAlreadyLive && (
              <Typography variant="body2" align="center" color="error" sx={{ mt: 2, mb: 2 }}>
                Another broadcast is already live from your church. Please try again later.
              </Typography>
            )}
          </Box>

          {status && (
            <Typography variant="body2" align="center" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
              {t(`golive.status.${status.replace(/\s+/g, '_').toLowerCase()}`, status)}
            </Typography>
          )}

          {error && (
            <Typography variant="body2" align="center" color="error" sx={{ mb: 2 }}>
              {t(`golive.errors.${error.replace(/\s+/g, '_').toLowerCase()}`, error)}
            </Typography>
          )}

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('golive.labels.current_transcription')}
              </Typography>
              <TranscriptionBox ref={transcriptionBoxRef}>
                {transcription || t('golive.placeholders.transcription_placeholder')}
              </TranscriptionBox>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {showListenerPopup && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Card
            sx={{
              p: 4,
              maxWidth: 380,
              mx: 2,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                color: '#47362b',
                fontWeight: 600,
                mb: 2
              }}
            >
              ⚠️ No Active Listeners
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: '#666',
                lineHeight: 1.5
              }}
            >
              Would you like to keep the stream active?
            </Typography>

            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: countdownSeconds <= 120 ? '#ffebee' : '#f5f5f5',
                borderRadius: 2,
                border: `2px solid ${countdownSeconds <= 120 ? '#8B0000' : '#47362b'}`
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: countdownSeconds <= 120 ? '#8B0000' : '#47362b',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  fontSize: '18px'
                }}
              >
                {formatCountdown(countdownSeconds)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#666',
                  fontSize: '12px'
                }}
              >
                Auto-closing in
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleKeepStreaming}
                size="medium"
                sx={{
                  minWidth: '120px',
                  py: 1,
                  px: 2.5,
                  borderColor: '#47362b',
                  color: '#47362b',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    backgroundColor: '#47362b',
                    color: 'white',
                    borderColor: '#47362b'
                  }
                }}
              >
                Keep Live
              </Button>
              <Button
                variant="contained"
                onClick={handleCloseStream}
                size="medium"
                sx={{
                  minWidth: '120px',
                  py: 1,
                  px: 2.5,
                  backgroundColor: '#8B0000',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontSize: '14px',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#660000',
                    boxShadow: 'none'
                  }
                }}
              >
                Close Now
              </Button>
            </Box>
          </Card>
        </Box>
      )}

      {showToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#ffffff',
            color: '#333333',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #e0e0e0',
            zIndex: 10000,
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideInRight 0.4s ease-out',
            maxWidth: '350px',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#ff5722',
              borderRadius: '50%',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>Sermon Ended</div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Your sermon has been ended by Superadmin
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </Container>
  );
};

export default GoLive;
