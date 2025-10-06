import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Typography, Box, FormControl, Select, CircularProgress, TableBody, MenuItem, Paper, TableContainer, Button, Table, TableHead, TableRow, TableCell, Container, Alert, styled, Card, CardContent, CardActions, Grid, Divider, Pagination } from '@mui/material';
import SEO from 'views/Seo/SeoMeta';
import { useTranslation } from 'react-i18next';
import axios from 'axios';


const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Styled Components
const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4)
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  backgroundColor: '#f9fafc'
}));

const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  marginBottom: theme.spacing(3),
  overflow: 'visible'
}));

const LiveIndicator = styled('div')({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '4px',
  backgroundColor: '#e63946',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '12px',
  marginLeft: '10px'
});

const ControlsBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 140,
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '14px',
    '& .MuiSelect-select': {
      padding: '8px 12px'
    }
  },
  '& .MuiMenuItem-root': {
    fontSize: '13px',
    padding: '4px 8px'
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#1a1a1a', // Dark black color
  color: '#ffffff',
  padding: '10px 24px',
  borderRadius: '8px',
  textTransform: 'none',
  fontSize: '16px',
  fontWeight: 500,
  minWidth: 160,
  '&:hover': {
    backgroundColor: '#333333'
  },
  '&.MuiButton-containedError': {
    backgroundColor: '#1a1a1a',
    '&:hover': {
      backgroundColor: '#333333'
    }
  }
}));

const TranscriptionBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  minHeight: '300px',
  maxHeight: '500px',
  overflowY: 'auto',
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  fontSize: '16px',
  lineHeight: 1.6
}));

const StatusText = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  margin: theme.spacing(2, 0),
  color: theme.palette.text.secondary
}));



class AudioManager {
  constructor(onAudioStart, onAudioEnd) {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.currentSource = null;
    this.audioQueue = [];
    this.isProcessing = false;
    this.lastPlaybackFinishTime = 0;
    this.minimumGapBetweenPlaybacks = 0;
    this.onAudioStart = onAudioStart;
    this.onAudioEnd = onAudioEnd;
  }

  async playAudio(audioData, associatedText, textId) {
    if (this.audioQueue.length > 5) {
      this.audioQueue = this.audioQueue.slice(-3);
    }

    this.audioQueue.push({ audioData, text: associatedText, textId: textId });

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.audioQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.audioQueue.length > 0) {
        const { audioData, text, textId } = this.audioQueue.shift();
        await this._playAudioInternal(audioData, text, textId);

        // Comment out the artificial delay code
        // const now = performance.now();
        // const timeSinceLastPlayback = now - this.lastPlaybackFinishTime;
        // if (timeSinceLastPlayback < this.minimumGapBetweenPlaybacks) {
        //   await new Promise((resolve) => setTimeout(resolve, this.minimumGapBetweenPlaybacks - timeSinceLastPlayback));
        // }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async _playAudioInternal(audioData, text, textId) {
    const playStart = performance.now();
    console.log(`[PLAY] Starting audio playback for: ${text?.substring(0, 50)}...`);

    try {
      if (this.currentSource) {
        console.log(`[PLAY] Stopping previous audio`);
        try {
          this.currentSource.disconnect();
        } catch (e) {
          console.log(`[PLAY] Error cleaning up previous audio:`, e);
        }
        this.currentSource = null;
      }

      if (this.audioContext.state === 'suspended') {
        console.log(`[PLAY] Resuming AudioContext`);
        await this.audioContext.resume();
      }

      const arrayBuffer = await audioData.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      this.currentSource = source;
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      // Notify that audio is starting
      if (this.onAudioStart && text) {
        this.onAudioStart(text, textId);
      }

      console.log(`[PLAY] Starting playback`);
      source.start();

      await new Promise((resolve) => {
        source.onended = () => {
          const totalTime = performance.now() - playStart;
          console.log(`[PLAY] Playback finished in ${totalTime}ms`);
          this.lastPlaybackFinishTime = performance.now();

          // Notify that audio has ended
          if (this.onAudioEnd && text) {
            this.onAudioEnd(text, textId);
          }

          if (this.currentSource === source) {
            this.currentSource = null;
          }
          resolve();
        };
      });
    } catch (error) {
      console.error(`[ERROR] Audio playback error:`, error);
      this.currentSource = null;
      if (this.onAudioEnd && text) {
        this.onAudioEnd(text, textId);
      }
      throw error;
    }
  }
}

const GENDER_VOICE_MAP = {
  male: {
    en: 'en-US-AndrewNeural', es: 'es-ES-AlvaroNeural', pt: 'pt-BR-AntonioNeural',
    id: 'id-ID-ArdiNeural', hi: 'hi-IN-ArjunNeural', zh: 'zh-CN-YunxiNeural',
    ar: 'ar-SA-HamedNeural', pa: 'pa-IN-OjasNeural', af: 'af-ZA-WillemNeural',
    de: 'de-DE-ConradNeural', el: 'el-GR-NestorasNeural', fil: 'fil-PH-AngeloNeural',
    fr: 'fr-FR-HenriNeural', it: 'it-IT-DiegoNeural', ja: 'ja-JP-KeitaNeural',
    ko: 'ko-KR-HyunsuNeural', ms: 'ms-MY-OsmanNeural', si: 'si-LK-SameeraNeural',
    ta: 'ta-IN-ValluvarNeural', my: 'my-MM-ThihaNeural', vi: 'vi-VN-NamMinhNeural',
    te: 'te-IN-MohanNeural'
  },
  female: {
    en: 'en-US-AriaNeural', es: 'es-ES-LaiaNeural', pt: 'pt-BR-ManuelaNeural',
    id: 'id-ID-GadisNeural', hi: 'hi-IN-SwaraNeural', zh: 'zh-CN-XiaoxiaoNeural',
    ar: 'ar-SA-ZariyahNeural', pa: 'pa-IN-VaaniNeural', af: 'af-ZA-AdriNeural',
    de: 'de-DE-KatjaNeural', el: 'el-GR-AthinaNeural', fil: 'fil-PH-BlessicaNeural',
    fr: 'fr-FR-DeniseNeural', it: 'it-IT-ElisaNeural', ja: 'ja-JP-NanamiNeural',
    ko: 'ko-KR-SoonBokNeural', ms: 'ms-MY-YasminNeural', si: 'si-LK-ThiliniNeural',
    ta: 'ta-IN-PallaviNeural', my: 'my-MM-NilarNeural', vi: 'vi-VN-HoaiMyNeural',
    te: 'te-IN-ShrutiNeural'
  }
};


const MobileJoinLive = () => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState(t('joinlivesermons.status.ready_to_start'));
  const [error, setError] = useState('');
  const [transcription, setTranscription] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLiveSermonAvailable, setIsLiveSermonAvailable] = useState(false);
  const [previousSessionsPage, setPreviousSessionsPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // Consistent with your other components

  const [sermonData, setSermonData] = useState([]);
  const [liveSermon, setLiveSermon] = useState(null);
  const [showTranslationView, setShowTranslationView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [endedSessionsData, setEndedSessionsData] = useState([]);
  const [userPreviousSession, setUserPreviousSession] = useState(null);
  const [isAdminNameLoading, setIsAdminNameLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [broadcastId, setBroadcastId] = useState(null);

  const [hasClickedJesus, setHasClickedJesus] = useState(false);
  const [broadcastInfo, setBroadcastInfo] = useState(null);
  const [broadcasterGender, setBroadcasterGender] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [textQueue, setTextQueue] = useState([]);
  const [synthesisQueue, setSynthesisQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [userIdState, setUserIdState] = useState(null);
  const [churchIdState, setChurchIdState] = useState(null);
  const [churchLanguageSettings, setChurchLanguageSettings] = useState(null);

  const [stableAdminInfo, setStableAdminInfo] = useState({
    name: '',
    isLoaded: false
  });

  const clientIdRef = useRef(generateUUID());
  const audioManagerRef = useRef(null);
  const eventSourceRef = useRef(null);
  const checkSermonIntervalRef = useRef(null);
  const checkSermonRef = useRef(null);
  const backendSessionIdRef = useRef(null);
  const adminUserRef = useRef(null);
  const broadcastIdRef = useRef(null);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const textIdCounter = useRef(0);
  const lastTextRef = useRef('');
  const lastReceivedTextRef = useRef('');

  const wakeLockRef = useRef(null);


  const LANGUAGE_OPTIONS = useMemo(() => {
    // If we don't have church language settings or broadcaster gender, return empty array
    if (!churchLanguageSettings || !broadcasterGender) {
      return [];
    }

    // Get the appropriate gender settings from church language settings
    const genderSettings = churchLanguageSettings[broadcasterGender];

    if (!genderSettings || !Array.isArray(genderSettings)) {
      console.warn(`[LANGUAGE_OPTIONS] No settings found for gender: ${broadcasterGender}`);
      return [];
    }

    const languageOptions = genderSettings.map(setting => {
      const languageCode = setting.id.split('-').slice(0, 2).join('-');

      return {
        value: languageCode,
        label: setting.language,
        voiceId: setting.id
      };
    });

    console.log(`[LANGUAGE_OPTIONS] Generated options for ${broadcasterGender}:`, languageOptions);
    return languageOptions;
  }, [churchLanguageSettings, broadcasterGender]);

  // Auto-select broadcaster's language when broadcast info and language options are available

  useEffect(() => {

    if (broadcastInfo && LANGUAGE_OPTIONS.length > 0 && !selectedLanguage) {

      let targetLanguage = LANGUAGE_OPTIONS[0].value; // default fallback

      // Try to match broadcaster's language first

      if (broadcastInfo.voice_id) {

        const broadcasterLanguageCode = broadcastInfo.voice_id.split('-').slice(0, 2).join('-');

        const matchingOption = LANGUAGE_OPTIONS.find(option =>

          option.value === broadcasterLanguageCode

        );

        if (matchingOption) {

          targetLanguage = matchingOption.value;

          console.log(`[AUTO_SELECT] Selected broadcaster's language: ${targetLanguage}`);

        }

      } else if (broadcastInfo.language) {

        const matchingOption = LANGUAGE_OPTIONS.find(option =>

          option.value.startsWith(broadcastInfo.language + '-')

        );

        if (matchingOption) {

          targetLanguage = matchingOption.value;

        }

      }

      setSelectedLanguage(targetLanguage);

    }

  }, [broadcastInfo, LANGUAGE_OPTIONS, selectedLanguage]);


  const handleAudioStart = useCallback((text) => {
    if (isMountedRef.current) {
      setCurrentlyPlaying(text);
      setIsPlayingAudio(true);
    }
  }, []);

  const handleAudioEnd = useCallback((text) => {
    if (isMountedRef.current) {
      setCurrentlyPlaying('');
      setIsPlayingAudio(false);
    }
  }, []);

  const handleAudioPlayStart = useCallback((text, textId) => {
    if (isMountedRef.current) {
      setCurrentlyPlaying(text);
    }
  }, []);

  const handleAudioPlayEnd = useCallback((text, textId) => {
    if (isMountedRef.current) {
      setCurrentlyPlaying('');
      setTextQueue(prev => prev.filter(item => item.id !== textId));
    }
  }, []);


  const fetchChurchLanguageSettings = useCallback(async (churchId) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const churchId = urlParams.get('churchId');
      console.log(`[CHURCH_SETTINGS] Fetching language settings for church: ${churchId}`);

      const response = await fetch(`${apiBaseUrl}/church/detail/${churchId}?languages=joinLive`);

      if (response.ok) {
        const data = await response.json();
        if (data && data.languageSettings && data.languageSettings.joinLive) {
          setChurchLanguageSettings(data.languageSettings.joinLive);
          console.log(`[CHURCH_SETTINGS] Retrieved language settings:`, data.languageSettings.joinLive);
          return data.languageSettings.joinLive;
        }
      } else {
        console.warn(`[CHURCH_SETTINGS] Failed to fetch church settings: ${response.status}`);
      }
    } catch (error) {
      console.error(`[CHURCH_SETTINGS] Error fetching church language settings:`, error);
    }
    return null;
  }, [apiBaseUrl]);

  useEffect(() => {
    const path = window.location.pathname;
    let extractedBroadcastId = null;

    // Check for /join/:broadcastId
    if (path.startsWith('/join/')) {
      extractedBroadcastId = path.split('/join/')[1];
    }
    // Check for /sermon/join/:broadcastId
    else if (path.startsWith('/sermon/join/')) {
      extractedBroadcastId = path.split('/sermon/join/')[1];
    }

    // Check for ?id=:broadcastId
    const urlParams = new URLSearchParams(window.location.search);
    const paramBroadcastId = urlParams.get('id');
    extractedBroadcastId = extractedBroadcastId || paramBroadcastId;

    // Save userId and churchId from URL params to state
    const userIdFromUrl = urlParams.get('userId');
    const churchIdFromUrl = urlParams.get('churchId');

    if (userIdFromUrl) {
      setUserIdState(userIdFromUrl);
      console.log('[PARAMS] Saved userId to state:', userIdFromUrl);
    }

    if (churchIdFromUrl) {
      setChurchIdState(churchIdFromUrl);
      console.log('[PARAMS] Saved churchId to state:', churchIdFromUrl);
      // Fetch church language settings when churchId is available
      fetchChurchLanguageSettings(churchIdFromUrl);
    }

    if (extractedBroadcastId) {
      setBroadcastId(extractedBroadcastId);
      broadcastIdRef.current = extractedBroadcastId;
      console.log(`[BROADCAST] Extracted broadcast ID: ${extractedBroadcastId}`);

      fetchBroadcastInfo(extractedBroadcastId);
    } else {
      console.warn('[BROADCAST] No broadcast ID found in URL:', path);
    }
  }, [fetchChurchLanguageSettings]);

  // NEW: Fetch broadcast info including gender
  const fetchBroadcastInfo = useCallback(async (broadcastIdToFetch) => {
    try {
      console.log(`[BROADCAST_INFO] Fetching info for: ${broadcastIdToFetch}`);
      console.log(`[BROADCAST_INFO] API URL: ${apiBaseUrl}/speech/broadcast_info/${broadcastIdToFetch}`);

      const response = await fetch(`https://churchtranslator.com/speech/broadcast_info/${broadcastIdToFetch}`);

      console.log(`[BROADCAST_INFO] Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.broadcast) {
          setBroadcastInfo(data.broadcast);
          setBroadcasterGender(data.broadcast.gender || '');

          console.log(`[BROADCAST_INFO] Retrieved info for ${broadcastIdToFetch}:`, {
            gender: data.broadcast.gender,
            voice_id: data.broadcast.voice_id,
            language: data.broadcast.source_language
          });

          return data.broadcast;
        }
      } else if (response.status === 404) {
        const errorData = await response.json();
        console.log(`[BROADCAST_INFO] 404 Error details:`, errorData);
        setBroadcastInfo(null);
        setBroadcasterGender('');
        return null;
      }
    } catch (error) {
      console.error(`[BROADCAST_INFO] Error fetching broadcast info:`, error);
    }

    return null;
  }, [apiBaseUrl]);


  useEffect(() => {
    if (isProcessingQueue || synthesisQueue.length === 0) {
      return;
    }

    const processNextInQueue = async () => {
      setIsProcessingQueue(true);

      const nextItem = synthesisQueue[0];
      const { textToSynthesize, textId } = nextItem;

      try {
        const churchId = churchIdState;
        const currentBroadcastId = broadcastIdRef.current || broadcastId;

        let synthesisVoiceId;
        if (broadcastInfo && broadcastInfo.gender && churchLanguageSettings) {
          const gender = broadcastInfo.gender;
          const sourceLanguage = broadcastInfo.source_language || (broadcastInfo.voice_id ? broadcastInfo.voice_id.split('-')[0] : 'en');
          if (selectedLanguage === sourceLanguage) {
            synthesisVoiceId = broadcastInfo.voice_id;
          } else {
            const genderSettings = churchLanguageSettings[gender];
            if (genderSettings) {
              const targetLanguageVoice = genderSettings.find(setting => setting.id.startsWith(selectedLanguage + '-'));
              if (targetLanguageVoice) synthesisVoiceId = targetLanguageVoice.id;
            }
          }
        }
        if (!synthesisVoiceId) {
          synthesisVoiceId = (GENDER_VOICE_MAP['male'] && GENDER_VOICE_MAP['male'][selectedLanguage]) || 'en-US-AndrewNeural';
        }

        const response = await fetch('https://churchtranslator.com/speech/synthesize_speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({
            text: textToSynthesize,
            language: selectedLanguage,
            voiceId: synthesisVoiceId,
            churchId: churchId,
            broadcastId: currentBroadcastId,
          }),
        });

        if (!response.ok) throw new Error(`Speech synthesis failed: ${response.status}`);
        const audioBlob = await response.blob();
        if (audioBlob.size === 0) throw new Error('Received empty audio response');

        audioManagerRef.current.playAudio(audioBlob, textToSynthesize, textId);

      } catch (error) {
        console.error('Error processing synthesis queue:', error);
        setError(`Synthesis queue error: ${error.message}`);
        setTimeout(() => setError(''), 4000);
      } finally {
        setSynthesisQueue(prevQueue => prevQueue.slice(1));
        setIsProcessingQueue(false);
      }
    };

    processNextInQueue();

  }, [synthesisQueue, isProcessingQueue, broadcastId, broadcastInfo, churchLanguageSettings, selectedLanguage]);



  const getPaginatedSessions = () => {
    if (!userPreviousSession) return [];
    const startIndex = (previousSessionsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return userPreviousSession.slice(startIndex, endIndex);
  };

  // Handle page change for previous sessions
  const handlePreviousSessionsPageChange = (event, value) => {
    setPreviousSessionsPage(value);
  };

  // Calculate total pages for previous sessions
  const totalPreviousSessionPages = Math.ceil((userPreviousSession?.length || 0) / ITEMS_PER_PAGE);

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Add this useEffect to detect if we're on a join URL
  useEffect(() => {
    const pathName = window.location.pathname;

    // Check if pathname contains /join/ pattern
    if (pathName.includes('/join/')) {
      // We're already on a join URL, so show translation view
      setShowTranslationView(true);
    }
  }, []);

  const fetchLiveSermonData = useCallback(async () => {
    try {
      if (!stableAdminInfo.isLoaded) {
        setIsAdminNameLoading(true);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const churchId = urlParams.get('churchId');
      // console.log("ecdcfv", churchId);

      if (!churchId) {
        throw new Error('No church ID provided');
      }

      // Include churchId in the API call
      const response = await axios.get(`${apiBaseUrl}/sermon/checksermon?churchId=${churchId}`);
      // console.log("Check Sermon API Response:", response.data);

      if (response.status !== 200) {
        throw new Error('Failed to fetch live sermons');
      }

      // Check if there's a live sermon
      const isLive = response.data.liveSermonCount > 0;

      // Get live sermon data if available
      const liveSermonData = response.data.liveSermons.length > 0 ? response.data.liveSermons[0] : null;

      // If we're in translation view and no live sermon is available, reset
      if (showTranslationView && !isLive) {
        setIsStreaming(false);
        setStatus(t('joinlivesermons.status.disconnected'));
        setShowTranslationView(false);
        setTranscription('');
        setLiveSermon(null);
        setIsLiveSermonAvailable(false);
        backendSessionIdRef.current = null;
        setError('');
        setStableAdminInfo({
          name: '',
          isLoaded: false
        });
      }

      // Process admin info directly from the API response
      if (liveSermonData && liveSermonData.broadcaster_info && liveSermonData.broadcaster_info.userDetails) {
        setStableAdminInfo({
          name: `${liveSermonData.broadcaster_info.userDetails.firstName} ${liveSermonData.broadcaster_info.userDetails.lastName}`,
          isLoaded: true
        });
        setAdminUser({
          firstName: liveSermonData.broadcaster_info.userDetails.firstName,
          lastName: liveSermonData.broadcaster_info.userDetails.lastName,
          _id: liveSermonData.broadcaster_info.user_id
        });
      }

      setLiveSermon(liveSermonData);
      setIsLiveSermonAvailable(isLive || !!broadcastId);
      setIsLoading(false);
      setIsAdminNameLoading(false);
    }
    catch (error) {
      console.error('Error fetching live sermon data:', error);
      console.log('showTranslationView:', showTranslationView);
      console.log('broadcastId:', broadcastId);
      console.log('broadcastIdRef.current:', broadcastIdRef.current);
      console.log('window.location.pathname:', window.location.pathname);

      const isOnTranslationView = showTranslationView ||
        broadcastId ||
        broadcastIdRef.current ||
        window.location.pathname.includes('/join/');

      if (error.response && error.response.status === 404 && isOnTranslationView) {
        console.log('[REDIRECT] 404 detected, forcing redirect...');

        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        if (checkSermonIntervalRef.current) {
          clearInterval(checkSermonIntervalRef.current);
        }

        console.log('[REDIRECT] Going back in history...');

        const urlParams = new URLSearchParams(window.location.search);
        const churchId = urlParams.get('churchId');
        const userId = urlParams.get('userId');
        let redirectUrl = '/joinlive';
        if (churchId && userId) {
          redirectUrl = `/joinlive?churchId=${churchId}&userId=${userId}`;
        }
        window.location.href = redirectUrl;
        return;
      }

      setIsLiveSermonAvailable(false);
      setIsLoading(false);
      setIsAdminNameLoading(false);
    }
  }, [stableAdminInfo.isLoaded, apiBaseUrl, showTranslationView, t]);

  useEffect(() => {
    fetchLiveSermonData();
    checkSermonIntervalRef.current = setInterval(fetchLiveSermonData, 3000);

    return () => {
      if (checkSermonIntervalRef.current) {
        clearInterval(checkSermonIntervalRef.current);
      }
      if (isStreaming && backendSessionIdRef.current) {
        stopBackendSession().catch(console.error);
      }
    };
  }, [fetchLiveSermonData, isStreaming]);

  useEffect(() => {
    audioManagerRef.current = new AudioManager(handleAudioPlayStart, handleAudioPlayEnd);
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [handleAudioPlayStart, handleAudioPlayEnd]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isStreaming && !wakeLockRef.current) {
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
  }, [isStreaming]);

  // New function to start backend session
  const startBackendSession = async () => {
    try {
      let sermonId = liveSermon?._id;

      console.log("=== STARTING BACKEND SESSION ===");
      console.log("user calling from handlestart");

      if (!sermonId) {
        console.log("liveSermon is null or missing _id, fetching sermon data...");

        // Use churchId from state instead of URL params
        if (!churchIdState) {
          console.warn("No church ID available in state.");
          setError(t('joinlivesermons.errors.no_church_id'));
          return null;
        }

        const response = await axios.get(`${apiBaseUrl}/sermon/checksermon?churchId=${churchIdState}`);
        console.log("Check Sermon API Response:", response.data);

        if (response.status !== 200) {
          console.warn("Failed to fetch live sermons.");
          setError(t('joinlivesermons.errors.no_live_sermon_available'));
          return null;
        }

        const liveSermonData = response.data.liveSermons.length > 0 ? response.data.liveSermons[0] : null;
        if (!liveSermonData || !liveSermonData._id) {
          console.warn("No live sermon or sermon ID found in API response.");
          setError(t('joinlivesermons.errors.no_live_sermon_available'));
          return null;
        }

        sermonId = liveSermonData._id;
        setLiveSermon(liveSermonData);
        setIsLiveSermonAvailable(response.data.liveSermonCount > 0);
      }

      // Use state variables instead of localStorage
      const churchId = churchIdState;
      const userId = userIdState;

      console.log("churchId from state:", churchId);
      console.log("userId from state:", userId);

      if (!userId) {
        console.warn("No user ID found in state.");
        setError(t('joinlivesermons.errors.no_user_id'));
        return null;
      }

      if (!churchId) {
        console.warn("No church ID found in state.");
        setError(t('joinlivesermons.errors.no_church_id'));
        return null;
      }

      const startDateTime = new Date().toISOString();
      console.log("sermonId:", sermonId);

      console.log("=== CALLING /listen/users API ===");
      const response = await fetch(`${apiBaseUrl}/listen/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          churchId,
          userId,
          startDateTime,
          status: 'Live',
          sermonId
        })
      });

      if (!response.ok) throw new Error('Failed to create backend session');
      const data = await response.json();
      backendSessionIdRef.current = data._id;
      console.log('Backend session started:', data._id);
      return data;
    } catch (error) {
      console.error('Error in starting backend session:', error);
      setError(t('joinlivesermons.errors.failed_to_start_backend_session'));
      return null;
    }
  };


  const stopBackendSession = async () => {
    if (!backendSessionIdRef.current) return;

    try {
      const getCurrentTime = () => {
        const now = new Date();
        return now.toISOString();
      };

      const endDateTime = getCurrentTime();

      const response = await fetch(`${apiBaseUrl}/listen/${backendSessionIdRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endDateTime,
          status: 'End'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update backend session');
      }

      console.log('Backend session stopped');
      backendSessionIdRef.current = null;
    } catch (error) {
      console.error('Backend session stop error:', error);
    }
  };



  const fetchEndedSessions = useCallback(async () => {
    try {
      const endedSessionsResponse = await axios.get(`${apiBaseUrl}/listen/getallusers`);
      // console.log("Ended Sessions API Response:", endedSessionsResponse.data);
      setEndedSessionsData(endedSessionsResponse.data);

      // Get current user ID from localStorage
      const currentUserId = userIdState;

      if (currentUserId && endedSessionsResponse.data.length > 0) {
        const userSessions = [];

        // Loop through all sermons
        for (const sermon of endedSessionsResponse.data) {
          // Check if this user exists in any sermon's listeners array
          const sessions = sermon.listeners.filter(
            listener => listener.userId === currentUserId
          );

          if (sessions.length > 0) {
            // Add all sessions for this user
            userSessions.push(...sessions.map(session => ({
              ...session,
              sermonId: sermon.sermonId,
              adminName: sermon.adminName,
              churchName: sermon.churchName,
              seniorPastor: sermon.seniorPastor
            })));
          }
        }

        // Set all previous sessions
        setUserPreviousSession(userSessions);
      }
    } catch (error) {
      console.error("Error fetching ended sessions:", error);
    }
  }, [apiBaseUrl, userIdState]);

  useEffect(() => {
    if (!showTranslationView && userIdState) {
      fetchEndedSessions();
    }
  }, [fetchEndedSessions, showTranslationView, userIdState]);

  // Fetch sermon data on component mount - memoized to prevent unnecessary re-renders
  const fetchSermonData = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/sermon/fetchAll`);
      console.log("Sermon API Response:", response.data);

      if (response.status !== 200) {
        throw new Error('Failed to fetch sermons');
      }

      // Check if there's any actual change before updating state
      const liveSermonFound = response.data.find(sermon => sermon.status === 'Live');
      const hasSermonDataChanged = !sermonData.length ||
        JSON.stringify(sermonData) !== JSON.stringify(response.data);
      const hasLiveSermonChanged = !liveSermon ||
        !liveSermonFound ||
        liveSermon._id !== liveSermonFound._id;

      // Only update state if there are actual changes
      if (hasSermonDataChanged) {
        setSermonData(response.data);
      }

      if (hasLiveSermonChanged) {
        setLiveSermon(liveSermonFound);
        setIsLiveSermonAvailable(!!liveSermonFound || !!broadcastId);
      }

      // Set loading to false only once
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching sermon data:', error);
      if (isLoading) {
        setError(t('joinlivesermons.errors.failed_to_fetch_sermon_data'));
        setIsLiveSermonAvailable(!!broadcastId); // Keep true if we have a broadcast ID
        setIsLoading(false);
      }
    }
  }, [sermonData, liveSermon, isLoading, broadcastId]);

  useEffect(() => {
    fetchLiveSermonData();
    checkSermonIntervalRef.current = setInterval(fetchLiveSermonData, 3000);

    return () => {
      if (checkSermonIntervalRef.current) {
        clearInterval(checkSermonIntervalRef.current);
      }
    };
  }, [fetchLiveSermonData]);

  useEffect(() => {
    return () => {
      if (backendSessionIdRef.current) {
        stopBackendSession().catch(console.error);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
          console.log('[WAKE_LOCK] Screen wake lock released on component unmount');
        }).catch((err) => {
          console.error('[WAKE_LOCK] Error releasing wake lock on unmount:', err);
        });
      }
    };
  }, []);


  const isSingificantChange = (newText, oldText) => {
    if (!newText || !oldText) return false;
    if (Math.abs(newText.length - oldText.length) < 5) return false;
    if (newText.length < oldText.length) return false;
    const newWords = newText.split(' ').length;
    const oldWords = oldText.split(' ').length;
    return newWords >= oldWords + 2;
  };

  const connectTranslationStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const currentBroadcastId = broadcastIdRef.current || broadcastId;

    if (!currentBroadcastId) {
      console.error('[TRANSLATION] Cannot connect: Missing broadcast ID');
      setError(t('joinlivesermons.errors.missing_broadcast_id'));
      return;
    }


    const baseLanguageCode = selectedLanguage.split('-')[0];
    const streamUrl = `https://churchtranslator.com/speech/stream_translation/${baseLanguageCode}?client_id=${clientIdRef.current}&role=listener&broadcast_id=${currentBroadcastId}`;
    console.log(`[TRANSLATION] Connecting to stream: ${streamUrl}`);

    eventSourceRef.current = new EventSource(streamUrl);

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.keepalive) return;

        const currentBroadcastId = broadcastIdRef.current || broadcastId;
        if (data.broadcast_id && data.broadcast_id !== currentBroadcastId) {
          return;
        }

        if (data.translation) {
          let newText = data.translation.trim();
          const lastText = lastReceivedTextRef.current;

          if (lastText && newText) {
            let overlapLength = 0;
            for (let i = Math.min(lastText.length, newText.length, 50); i > 3; i--) {
              if (lastText.endsWith(newText.substring(0, i))) {
                const lastChar = newText[i - 1];
                const nextChar = newText[i];
                if (lastChar === ' ' || (nextChar && nextChar === ' ')) {
                  overlapLength = i;
                  break;
                }
              }
            }
            if (overlapLength > 0) {
              newText = newText.substring(overlapLength).trim();
            }
          }

          lastReceivedTextRef.current = data.translation.trim();

          if (newText.length > 0) {
            setTranscription(prev => {
              let updatedText = prev ? prev + ' ' + newText : newText;

              const estimatedLines = updatedText.length / 50;

              if (estimatedLines > 27) {
                const words = updatedText.split(' ');
                const wordsToRemove = Math.floor(words.length * 0.3);
                updatedText = words.slice(wordsToRemove).join(' ');
              }

              return updatedText;
            });
            const textId = ++textIdCounter.current;
            setSynthesisQueue(prevQueue => [...prevQueue, { textToSynthesize: newText, textId }]);
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        setError(`Stream error: ${error.message}`);
      }
    };

    eventSourceRef.current.onopen = () => {
      setStatus(t('joinlivesermons.status.connected'));
    };

    eventSourceRef.current.onerror = () => {
      setStatus(t('joinlivesermons.status.connection_lost'));
    };
  };

  const handleStart = async () => {
    console.log('[START] Attempting to start translation:', { isLiveSermonAvailable, broadcastId });

    const currentBroadcastId = broadcastIdRef.current || broadcastId;
    if (currentBroadcastId && !broadcastInfo) {
      console.log('[START] Fetching broadcast info before starting...');
      await fetchBroadcastInfo(currentBroadcastId);
    }

    if (!isLiveSermonAvailable && !broadcastId) {
      console.warn('[START] Cannot start: No live sermon or broadcast ID');
      setError(t('joinlivesermons.errors.no_live_sermon_available'));
      return;
    }

    try {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('[WAKE_LOCK] Screen wake lock acquired');
          setError('');
        } catch (err) {
          console.error('[WAKE_LOCK] Failed to acquire wake lock:', err);
          setError(t('joinlivesermons.errors.wake_lock_failed'));
        }
      } else {
        console.warn('[WAKE_LOCK] Wake Lock API not supported');
        setError(t('joinlivesermons.errors.wake_lock_not_supported'));
      }

      let backendSessionPromise = null;

      if (userIdState && churchIdState) {
        console.log('[HANDLE_START] Calling startBackendSession with state data');
        backendSessionPromise = startBackendSession();
      } else {
        console.warn('[HANDLE_START] Missing user data in state:', { userId: !!userIdState, churchId: !!churchIdState });
      }
      const streamBroadcastId = broadcastIdRef.current || broadcastId;
      if (!streamBroadcastId) {
        throw new Error('No broadcast ID available');
      }

      // Get churchId for the request
      const urlParams = new URLSearchParams(window.location.search);
      const churchId = urlParams.get('churchId')

      const streamPromise = fetch('https://churchtranslator.com/speech/start_stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          role: 'listener',
          broadcastId: streamBroadcastId,
          churchId: churchId
        })
      });

      const [backendSessionResult, streamResponse] = await Promise.all([
        backendSessionPromise,
        streamPromise
      ]);

      if (!streamResponse.ok) {
        throw new Error('Failed to start stream');
      }

      if ((liveSermon || broadcastId) && !backendSessionResult) {
        console.warn('Backend session creation failed');
      }

      setIsStreaming(true);
      setStatus(t('joinlivesermons.status.connected'));
      setError('');
      setTranscription('');
      connectTranslationStream();
    } catch (error) {
      console.error('[START] Error:', error);
      setError(t('joinlivesermons.errors.failed_to_start_streaming', `Failed to start streaming: ${error.message}`));
      setIsStreaming(false);

      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WAKE_LOCK] Screen wake lock released due to start failure');
      }

      if (backendSessionIdRef.current) {
        stopBackendSession();
      }
    }
  };

  const handleJesusClick = async () => {
    // UI animation part
    const button = document.getElementById('acceptButton');
    const messageElement = document.getElementById('acceptMessage');

    button.classList.add('clicked');
    messageElement.style.display = 'block';

    // API call part
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('userId');

      const response = await axios.post(`${apiBaseUrl}/jesusclick/addstatus`, {
        userId,
        jesusClicked: "Yes"
      });

      if (response.status === 200) {
        console.log('Jesus clicked successfully');
      }
    } catch (error) {
      console.error('Error in Jesus button click:', error);
    }
    setHasClickedJesus(true);

    // Reset animation after 3 seconds
    setTimeout(() => {
      messageElement.style.display = 'none';
      button.classList.remove('clicked');
    }, 3000);
  };



  const handleStop = async () => {
    try {
      // Release the screen wake lock
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WAKE_LOCK] Screen wake lock released');
      }

      // Include the broadcast ID when stopping the stream
      const streamBroadcastId = broadcastIdRef.current || broadcastId;

      // Stop stream and backend session simultaneously
      const streamStopPromise = fetch('https://churchtranslator.com/speech/stop_stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          broadcastId: streamBroadcastId
        })
      });

      // Make sure to await this
      await stopBackendSession();
      await streamStopPromise;

      // Close event source
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setIsStreaming(false);
      setStatus(t('joinlivesermons.status.disconnected'));
      setShowTranslationView(false);
      setTranscription('');
      fetchLiveSermonData();
      const urlParams = new URLSearchParams(window.location.search);
      const churchId = urlParams.get('churchId');
      const userId = urlParams.get('userId');
      let redirectUrl = '/joinlive';
      if (churchId && userId) {
        redirectUrl = `/joinlive?churchId=${churchId}&userId=${userId}`;
      }
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Stop error:', error);
      setError(t('joinlivesermons.errors.failed_to_stop_streaming'));
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WAKE_LOCK] Screen wake lock released due to stop error');
      }
    }
  };


  const handleLeaveSermon = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }

      const streamBroadcastId = broadcastIdRef.current || broadcastId;

      const streamStopPromise = fetch('https://churchtranslator.com/speech/stop_stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          broadcastId: streamBroadcastId
        })
      });

      await stopBackendSession();
      await streamStopPromise;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setIsStreaming(false);
      setStatus(t('joinlivesermons.status.disconnected'));
      setTranscription('');
    } catch (error) {
      console.error('Stop error:', error);
      setError(t('joinlivesermons.errors.failed_to_stop_streaming'));
    }
  };

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
    if (isStreaming) {
      connectTranslationStream();
    }
  };

  const handleJoinSermon = () => {
    if (isLiveSermonAvailable && liveSermon && liveSermon.join_url) {
      // Extract the broadcast ID from the join_url
      const broadcastId = liveSermon.join_url.split('/join/')[1];

      if (broadcastId) {
        setBroadcastId(broadcastId);
        broadcastIdRef.current = broadcastId;

        // GET CURRENT URL PARAMS AND PRESERVE THEM
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const churchId = urlParams.get('churchId');

        // Construct URL with preserved parameters
        let newJoinUrl = `${window.location.origin}/sermon/join/${broadcastId}`;

        if (userId || churchId) {
          const params = new URLSearchParams();
          if (userId) params.append('userId', userId);
          if (churchId) params.append('churchId', churchId);
          newJoinUrl += `?${params.toString()}`;
        }

        console.log('[NAVIGATION] Joining sermon at:', newJoinUrl);
        window.location.href = newJoinUrl;
      } else {
        // Fallback to the original URL if we can't extract the broadcast ID
        const baseUrl = liveSermon.join_url.startsWith('/')
          ? `${window.location.origin}${liveSermon.join_url}`
          : liveSermon.join_url;
        console.warn('[NAVIGATION] Fallback URL:', baseUrl);
        window.location.href = baseUrl;
      }
    } else {
      console.warn('[NAVIGATION] Cannot join sermon:', { isLiveSermonAvailable, liveSermon });
      setError(t('joinlivesermons.errors.no_live_sermon_available'));
    }
  };

  const renderSermonSelectionScreen = () => {
    // If we have a broadcast ID from URL, go directly to translation view
    if (broadcastId) {
      return renderTranslationView();
    }

    let adminNameDisplay;

    if (!stableAdminInfo.isLoaded && liveSermon) {
      adminNameDisplay = (
        <Box component="span" display="inline-flex" alignItems="center">
          <CircularProgress size={16} thickness={5} sx={{ mr: 1 }} />
          {t('joinlivesermons.messages.loading')}
        </Box>
      );
    } else if (liveSermon && liveSermon.broadcaster_info && liveSermon.broadcaster_info.userDetails) {
      // Use broadcaster info directly from the liveSermon object
      adminNameDisplay = `${liveSermon.broadcaster_info.userDetails.firstName} ${liveSermon.broadcaster_info.userDetails.lastName}`;
    } else {
      adminNameDisplay = stableAdminInfo.name || "Unknown";
    }
    const sermonStartTime = liveSermon ? formatDate(liveSermon.startDateTime) : 'N/A';
    const sermonTitle = 'Live Sermon';

    return (
      <StyledContainer maxWidth="lg">
        <SEO
          title={t('joinlivesermons.seo.selection.title')}
          description={t('joinlivesermons.seo.selection.description')}
          keywords={t('joinlivesermons.seo.selection.keywords')}
          canonical="http://localhost:3000/live-sermon-translator"
        />

        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" maxWidth="auto" mx="auto" mb={2}>
            <Typography variant="h4" component="h1">
              {t('joinlivesermons.labels.live_sermons')}
            </Typography>
          </Box>
        </>


        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Typography>{t('joinlivesermons.messages.loading_sermon_data')}</Typography>
          </Box>
        ) : (
          <Box mt={4} display="flex" justifyContent="center">
            {!isLiveSermonAvailable ? (
              <Alert severity="info" sx={{ mb: 3, width: "100%", maxWidth: "auto", textAlign: "center" }}>
                {t('joinlivesermons.messages.no_live_sermons')}
              </Alert>
            ) : (
              <StyledCard sx={{ width: "100%", maxWidth: "auto", padding: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2">
                      {t('joinlivesermons.labels.live_sermon')}
                    </Typography>
                    <LiveIndicator>{t('joinlivesermons.labels.live_now')}</LiveIndicator>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: { xs: 1, sm: 0 }
                    }}
                  >
                    {liveSermon && ( // Only show Initiator if liveSermon exists
                      <Typography variant="subtitle1" color="text.secondary">
                        {t('joinlivesermons.labels.initiator')}: <b>{adminNameDisplay}</b>
                      </Typography>
                    )}
                    {liveSermon && ( // Only show Start Time if liveSermon exists
                      <Typography variant="subtitle1" color="text.secondary">
                        {t('joinlivesermons.labels.start_time')}: <b>{sermonStartTime}</b>
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, justifyContent: "center" }}>
                  <StyledButton variant="contained" onClick={handleJoinSermon}>
                    {t('joinlivesermons.buttons.join_sermon')}
                  </StyledButton>
                </CardActions>
              </StyledCard>
            )}
          </Box>
        )}

        {userPreviousSession && (
          <StyledCard sx={{ width: "100%", maxWidth: "auto", padding: 2, margin: "20px auto 24px auto" }}>
            <CardContent sx={{ padding: '12px !important' }}>
              <Typography variant="h6" component="h3" gutterBottom align="center">
                {t('joinlivesermons.labels.your_previous_sessions')}
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 600, color: '#444', fontSize: '0.85rem', padding: '8px 10px' } }}>
                      <TableCell><b>{t('joinlivesermons.table.serial_number')}</b></TableCell>
                      <TableCell><b>{t('joinlivesermons.table.church_name')}</b></TableCell>
                      <TableCell><b>{t('joinlivesermons.table.initiator_name')}</b></TableCell>
                      <TableCell><b>{t('joinlivesermons.table.start_date_time')}</b></TableCell>
                      <TableCell><b>{t('joinlivesermons.table.end_date_time')}</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedSessions().map((session, index) => {
                      const startIndex = (previousSessionsPage - 1) * ITEMS_PER_PAGE;

                      return (
                        <TableRow
                          key={`${session.sermonId}-${session.startDateTime}-${index}`}
                          sx={{
                            '& .MuiTableCell-body': { padding: '6px 10px', fontSize: '0.8rem' },
                            backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent'
                          }}
                        >
                          <TableCell>{startIndex + index + 1}</TableCell>
                          <TableCell>{session.churchName}</TableCell>
                          <TableCell>{session.adminName}</TableCell>
                          <TableCell>{formatDate(session.startDateTime)}</TableCell>
                          <TableCell>{formatDate(session.endDateTime)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {userPreviousSession.length > ITEMS_PER_PAGE && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Pagination
                    count={totalPreviousSessionPages}
                    page={previousSessionsPage}
                    onChange={handlePreviousSessionsPageChange}
                    color="primary"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: '#231f20',
                      },
                      '& .Mui-selected': {
                        backgroundColor: '#231f20 !important',
                        color: 'white !important',
                      }
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </StyledCard>
        )}
      </StyledContainer>
    );
  };

  const renderTranslationView = () => {
    const sermonTitle = liveSermon?.sermonName || "Live Sermon";

    // Display broadcast ID if available
    const currentBroadcastDisplay = broadcastIdRef.current || broadcastId
      ? ``
      : '';

    return (
      <StyledContainer maxWidth="lg">
        <SEO
          title={t('joinlivesermons.seo.translation.title')}
          description={t('joinlivesermons.seo.translation.description')}
          keywords={t('joinlivesermons.seo.translation.keywords')}
          canonical="http://localhost:3000/live-sermon-translator"
        />
        <StyledPaper>

          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              {t('joinlivesermons.labels.live_sermon')} {currentBroadcastDisplay}
              <LiveIndicator>{t('joinlivesermons.labels.live_now')}</LiveIndicator>
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={2} mb={2} className="mobile-hand-container">

            <StyledButton
              variant="contained"
              color="error"
              onClick={handleStop}
              size="small"
            >
              {t('joinlivesermons.buttons.leave_sermon')}
            </StyledButton>

            <div className="button-container">
              <div style={{ textAlign: "center" }}>
                <div
                  id="acceptButton"
                  onClick={handleJesusClick}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: "black",
                    color: "yellow",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    margin: "0 auto"
                  }}
                >
                  ✋
                </div>
                {!hasClickedJesus && (
                  <small style={{ fontSize: "10px", marginTop: "4px", display: "block" }}>
                    I have decided to follow Jesus
                  </small>
                )}
              </div>

              <div id="acceptMessage">{t('joinlivesermons.labels.accept_jesus')}</div>
            </div>
          </Box>



          <style jsx>{`
  .button-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  #acceptButton {
    position: relative;
    background-color: #333;
    color: white;
    font-size: 28px;
    padding: 12px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.3s ease, background-color 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #acceptButton:hover {
    background-color: #4C3628;
  }
  #acceptButton.clicked {
    transform: scale(1.3) rotate(360deg);
  }
  #acceptMessage {
    position: absolute;
    top: 100%;
    margin-top: 8px;
    background-color: #333;
    color: white;
    padding: 8px 16px;
    border-radius: 5px;
    display: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    text-align: center;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
  }
  
  /* Mobile styles only */
  @media (max-width: 600px) {
    .mobile-hand-container {
      justify-content: space-between !important;
    }
    #acceptButton {
      font-size: 20px;
      width: 44px;
      height: 44px;
      padding: 8px;
    }
    #acceptMessage {
      right: 0;
      left: auto;
      transform: none;
      font-size: 12px;
      padding: 6px 10px;
      margin-top: 5px;
    }
  }
`}</style>

          <ControlsBox>
            <StyledFormControl>
              <Select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                disabled={isStreaming}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    sx={{ fontSize: '13px', padding: '6px 12px' }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px' }}>{option.label}</span>
                      {broadcasterGender && (
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          ({broadcasterGender} voice)
                        </span>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>

            <StyledButton
              variant="contained"
              onClick={isStreaming ? handleLeaveSermon : handleStart}
              disabled={!isLiveSermonAvailable && !broadcastId}
            >
              {isStreaming ? t('joinlivesermons.buttons.stop_translation') : t('joinlivesermons.buttons.start_translation')}
            </StyledButton>
          </ControlsBox>

          <StatusText variant="body2">
            {t('joinlivesermons.labels.status')}: {t(`joinlivesermons.status.${status.replace(/\s+/g, '_').toLowerCase()}`, status)}
          </StatusText>

          {/* {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t(`joinlivesermons.errors.${error.replace(/\s+/g, '_').toLowerCase()}`, error)}
            </Alert>
          )} */}

          <TranscriptionBox elevation={0}>
            {transcription ? (
              <div>
                {(() => {
                  if (!currentlyPlaying || currentlyPlaying.trim() === '') {
                    // No audio playing, show normal text
                    return transcription;
                  }

                  // Find the last occurrence of the currently playing text in transcription
                  const playingText = currentlyPlaying.trim();
                  const lastIndex = transcription.lastIndexOf(playingText);

                  if (lastIndex === -1) {
                    // Currently playing text not found, show normal text
                    return transcription;
                  }

                  // Split transcription into three parts: before, highlighted, after
                  const beforeText = transcription.substring(0, lastIndex);
                  const highlightedText = transcription.substring(lastIndex, lastIndex + playingText.length);
                  const afterText = transcription.substring(lastIndex + playingText.length);

                  return (
                    <>
                      {beforeText}
                      <span
                        style={{
                          backgroundColor: '#f0f8ff',
                          color: '#2c5282',
                          fontWeight: '600',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          borderLeft: '3px solid #4299e1',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {highlightedText}
                      </span>
                      {afterText}
                    </>
                  );
                })()}
              </div>
            ) : (
              t('joinlivesermons.placeholders.transcription_placeholder')
            )}
          </TranscriptionBox>
        </StyledPaper>
      </StyledContainer>
    );
  };

  // If we have a broadcast ID and the component just loaded, go straight to translation view
  useEffect(() => {
    if (broadcastId && !showTranslationView && !isLoading) {
      setShowTranslationView(true);
    }
  }, [broadcastId, showTranslationView, isLoading]);

  // Main render method
  return showTranslationView || broadcastId ? renderTranslationView() : renderSermonSelectionScreen();
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default MobileJoinLive;