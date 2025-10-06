import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  Grid,
  Card,
  Table,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  Box,
  Stack,
  MenuItem,
  CircularProgress,
  Pagination,
  InputAdornment
} from '@mui/material';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { translateText } from '../../utils/translate';
import { Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import { Chip } from '@mui/material';
import imageCompression from 'browser-image-compression';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import LanguageSelectionDialog from './LanguageSelectionDialog';
import CreateLanguageDialog from './CreateLanguageDialog';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Church = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVoiceType, setSelectedVoiceType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [editableFields, setEditableFields] = useState({
    speech_location: false,
    speech_key: false,
    translator_key: false,
    translator_location: false
  });

  const [showAddLanguageModal, setShowAddLanguageModal] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newMaleVoices, setNewMaleVoices] = useState(['']);
  const [newFemaleVoices, setNewFemaleVoices] = useState(['']);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [churches, setChurches] = useState([]);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentChurch, setCurrentChurch] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    contact_no: '',
    senior_pastor_name: '',
    senior_pastor_phone_number: '',
    api_key: '',
    image: null,
    latitude: '',
    longitude: '',
    speech_location: '',
    speech_key: '',
    translator_key: '',
    translator_location: '',
    stream_limit_minutes: '',
    stream_used_minutes: '',
    languageSettings: {
      goLive: {
        male: [],
        female: []
      },
      joinLive: {
        male: [],
        female: []
      }
    }
  });


  const handleEnableFieldEdit = (fieldName, fieldLabel) => {
    const isConfirmed = window.confirm(
      `⚠️ CONFIDENTIAL FIELD\n\nYou are about to edit "${fieldLabel}" which is a sensitive API configuration field.\n\nAre you sure you want to edit this field?`
    );

    if (isConfirmed) {
      setEditableFields(prev => ({
        ...prev,
        [fieldName]: true
      }));
    }
  };

  useEffect(() => {
    fetchChurches();
    fetchAvailableLanguages();
  }, []);

  useEffect(() => {
    let previewUrl;
    if (currentChurch.image instanceof File) {
      previewUrl = URL.createObjectURL(currentChurch.image);
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [currentChurch.image]);


  const fetchChurches = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/church/fetchAll`);

      const sortedChurches = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChurches(sortedChurches);
    } catch (err) {
      toast.error(err.message || 'Error fetching churches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableLanguages = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/language/getAllLanguage`);
      setAvailableLanguages(response.data.profiles || []);

      // Add this code to auto-populate all churches with all languages
      const languages = response.data.profiles || [];
      if (languages.length > 0) {
        // Create language settings with all available languages
        const allLanguageSettings = {
          goLive: { male: [], female: [] },
          joinLive: { male: [], female: [] }
        };

        // Add all languages to the settings object
        languages.forEach(language => {
          // Add male voices
          if (language.genderVoices?.male?.length > 0) {
            language.genderVoices.male.forEach(voiceId => {
              allLanguageSettings.goLive.male.push({
                id: voiceId,
                language: language.voiceName
              });
              allLanguageSettings.joinLive.male.push({
                id: voiceId,
                language: language.voiceName
              });
            });
          }

          // Add female voices
          if (language.genderVoices?.female?.length > 0) {
            language.genderVoices.female.forEach(voiceId => {
              allLanguageSettings.goLive.female.push({
                id: voiceId,
                language: language.voiceName
              });
              allLanguageSettings.joinLive.female.push({
                id: voiceId,
                language: language.voiceName
              });
            });
          }
        });

        churches.forEach(async (church) => {
          const hasNoLanguageSettings = !church.languageSettings ||
            ((!church.languageSettings.goLive?.male?.length &&
              !church.languageSettings.goLive?.female?.length &&
              !church.languageSettings.joinLive?.male?.length &&
              !church.languageSettings.joinLive?.female?.length));

          if (hasNoLanguageSettings) {
            await axios.patch(`${apiBaseUrl}/church/edit/${church._id}`, {
              languageSettings: allLanguageSettings
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast.error(t('church.failedToLoad'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this church?')) {
      try {
        await axios.delete(`${apiBaseUrl}/church/delete/${id}`);
        setChurches(churches.filter((church) => church._id !== id));
        toast.success(t('church.deleteSuccess'));
      } catch (err) {
        toast.success(t('church.deleteSuccess'));
      }
    }
  };

  const handleAdd = () => {
    setModalType('Save');

    // Create language settings with all available languages
    const allLanguageSettings = {
      goLive: { male: [], female: [] },
      joinLive: { male: [], female: [] }
    };

    // Add all languages to the settings object
    availableLanguages.forEach(language => {
      // Add male voices
      if (language.genderVoices?.male?.length > 0) {
        language.genderVoices.male.forEach(voiceId => {
          allLanguageSettings.goLive.male.push({
            id: voiceId,
            language: language.voiceName
          });
          allLanguageSettings.joinLive.male.push({
            id: voiceId,
            language: language.voiceName
          });
        });
      }

      // Add female voices
      if (language.genderVoices?.female?.length > 0) {
        language.genderVoices.female.forEach(voiceId => {
          allLanguageSettings.goLive.female.push({
            id: voiceId,
            language: language.voiceName
          });
          allLanguageSettings.joinLive.female.push({
            id: voiceId,
            language: language.voiceName
          });
        });
      }
    });

    setCurrentChurch({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      contact_no: '',
      senior_pastor_name: '',
      senior_pastor_phone_number: '',
      api_key: '',
      speech_location: '',
      speech_key: '',
      translator_key: '',
      translator_location: '',
      stream_limit_minutes: '',
      stream_used_minutes: '',
      image: null,
      languageSettings: allLanguageSettings
    });
    setEditableFields({
      speech_location: false,
      speech_key: false,
      translator_key: false,
      translator_location: false
    });

    setShowModal(true);
    setValidationErrors({});
  };

  const handleEdit = (church) => {
    setModalType('Update');
    setCurrentChurch({
      ...church,
      api_key: church.api_key || '',
      image: church.image || null,
      languageSettings: church.languageSettings || {
        goLive: { male: [], female: [] },
        joinLive: { male: [], female: [] }
      }
    });
    setShowModal(true);
    setValidationErrors({});
  };

  const sanitizeInput = (input, field) => {
    if (field === 'name' || field === 'senior_pastor_name') {
      return input
        .replace(/[^a-zA-Z\s.]/g, '')
        .replace(/\.+/g, '.')
        .replace(/\s\s+/g, ' ');
    } else if (field === 'address') {
      return input
        .replace(/[^a-zA-Z0-9,\s\-\.\@\#\&\'\"\(\)\/]/g, ' ')
        .replace(/,+/g, ',')
        .replace(/\-+/g, '-')
        .replace(/\.+/g, '.')
        .replace(/^\s+|\s+$/g, ' ');
    } else if (field === 'city' || field === 'state' || field === 'country') {
      return input.replace(/[^a-zA-Z\s]/g, '').trim();
    } else if (field === 'contact_no' || field === 'senior_pastor_phone_number') {
      return input.replace(/[^0-9]/g, '').trim();
    } else {
      return input.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }
  };

  const validateForm = () => {
    const errors = {};
    const nameFormat = /^[a-zA-Z][a-zA-Z\s.]*$/;
    const cityStateCountryFormat = /^[a-zA-Z\s]+$/;
    const contactNumberFormat = /^\d{10}$/;

    if (!currentChurch.name?.trim()) {
      errors.name = t('church.errors.nameRequired');
    }

    if (!currentChurch.address?.trim()) {
      errors.address = t('church.errors.addressRequired');
    }


    if (!currentChurch.city?.trim()) {
      errors.city = t('church.errors.cityRequired');
    }


    if (!currentChurch.state?.trim()) {
      errors.state = t('church.errors.stateRequired');
    }

    if (!currentChurch.country?.trim()) {
      errors.country = t('church.errors.countryRequired');
    }

    if (!currentChurch.contact_no?.trim()) {
      errors.contact_no = t('church.errors.contactRequired');
    }

    if (!currentChurch.senior_pastor_name?.trim()) {
      errors.senior_pastor_name = t('church.errors.pastorNameRequired');
    }
    if (!currentChurch.senior_pastor_phone_number?.trim()) {
      errors.senior_pastor_phone_number = t('church.errors.pastorPhoneRequired');
    }

    if (!currentChurch.stream_limit_minutes) {
      errors.stream_limit_minutes = t('church.errors.streamLimitRequired');
    }


    if (currentChurch.image && currentChurch.image instanceof File) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(currentChurch.image.type)) {
        errors.image = t('church2.errors.invalidImageType');
      }
      if (currentChurch.image.size > 5 * 1024 * 1024) {
        errors.image = t('church2.errors.imageTooLarge');
      }
    }

    return errors;
  };

  const handleInputChange = (field, value) => {
    let newValue = value;
    if (field !== 'image') {
      newValue = sanitizeInput(value, field);
    }
    setCurrentChurch((prev) => ({
      ...prev,
      [field]: newValue
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    let imageBase64 = null;
    if (currentChurch.image instanceof File) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(currentChurch.image, options);
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(compressedFile);
        });
      } catch (error) {
        console.error('Image compression failed:', error);
        toast.dismiss();
        toast.error(t('church.errors.imageCompressionFailed'));
        return;
      }
    } else if (currentChurch.image === null && modalType === 'Update') {
      imageBase64 = null;
    }
    let payload = {
      name: currentChurch.name.trim(),
      senior_pastor_name: currentChurch.senior_pastor_name.trim(),
      senior_pastor_phone_number: currentChurch.senior_pastor_phone_number.trim(),
      address: currentChurch.address.trim(),
      city: currentChurch.city.trim(),
      contact_no: currentChurch.contact_no.trim(),
      state: currentChurch.state.trim(),
      country: currentChurch.country.trim(),
      latitude: currentChurch.latitude,
      longitude: currentChurch.longitude,
      speech_key: currentChurch.speech_key,
      speech_location: currentChurch.speech_location,
      translator_key: currentChurch.translator_key,
      stream_limit_minutes: currentChurch.stream_limit_minutes,
      translator_location: currentChurch.translator_location,
      ...(imageBase64 !== undefined && { image: imageBase64 }),
      languageSettings: currentChurch.languageSettings
    };

    if (currentChurch.api_key?.trim()) {
      payload.api_key = currentChurch.api_key.trim();
    }

    // Translate text fields to English if the current language is not English
    const currentLang = i18n.language;
    if (currentLang !== 'en') {
      console.log(`[SUBMIT] Translating church data from ${currentLang} to English`);
      const fieldsToTranslate = ['name', 'senior_pastor_name', 'address', 'city', 'state', 'country'];
      for (const field of fieldsToTranslate) {
        if (payload[field]) {
          console.log(`[SUBMIT] Translating ${field}: ${payload[field]}`);
          payload[field] = await translateText(payload[field], 'en', currentLang);
          console.log(`[SUBMIT] Translated ${field}: ${payload[field]}`);
        }
      }
    }

    try {
      if (modalType === 'Save') {
        const response = await axios.post(`${apiBaseUrl}/church/add`, payload);
        if (response.data) {
          // Ensure the new church object matches the expected structure
          const newChurch = {
            ...response.data.church, // Assuming response.data.church contains the church object
            name: response.data.church.name || payload.name,
            address: response.data.church.address || payload.address,
            city: response.data.church.city || payload.city,
            created_at: response.data.church.created_at || new Date().toISOString(),
            image: response.data.church.image || null // Include image URL
          };
          setChurches((prevChurches) => [newChurch, ...prevChurches]);
          toast.dismiss();
          toast.success(t('church.addSuccess'));
        }
      } else {
        const originalChurch = churches.find((c) => c._id === currentChurch._id);
        const changedFields = Object.keys(payload).reduce((acc, key) => {
          // Handle image comparison
          if (key === 'image') {
            if (payload.image) { // Only include image if it was changed
              acc.image = payload.image;
            }
          } else if (payload[key] !== originalChurch[key]) {
            acc[key] = payload[key];
          }
          return acc;
        }, {});

        if (Object.keys(changedFields).length > 0) {
          await axios.patch(`${apiBaseUrl}/church/edit/${currentChurch._id}`, changedFields);
          toast.dismiss();
          toast.success(t('church.updateSuccess'));
          await fetchChurches();
        } else {
          toast.info(t('church.noChanges'));
          setShowModal(false);
          return;
        }
      }

      setShowModal(false);
      setEditableFields({
        speech_location: false,
        speech_key: false,
        translator_key: false,
        translator_location: false
      });
      setCurrentChurch({
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        contact_no: '',
        senior_pastor_name: '',
        senior_pastor_phone_number: '',
        api_key: '',
        image: null,
        speech_location: '',
        latitude: '',
        longitude: '',
        speech_key: '',
        translator_key: '',
        translator_location: '',
        stream_limit_minutes: '',
        languageSettings: {
          goLive: { male: [], female: [] },
          joinLive: { male: [], female: [] }
        }
      });
      setValidationErrors({});
      setPage(1);
    } catch (err) {
      console.error('Error submitting church data:', err);
      toast.dismiss();
      toast.error(t('church.errors.operationFailed', { operation: modalType.toLowerCase(), message: err.message }));
    }
  };

  // Minimal Search Control Component - Replace only the SearchControl component
  const SearchControl = ({ setPosition }) => {
    const map = useMapEvents({});

    useEffect(() => {
      const provider = new OpenStreetMapProvider();

      const searchControl = new GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: true,
        showPopup: false,
        autoComplete: true,
        autoCompleteDelay: 250,
        keepResult: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'Search for location...',
        notFoundMessage: 'Sorry, that address could not be found.',
        maxMarkers: 1, // Only allow 1 marker
      });

      map.addControl(searchControl);

      // Listen for search results
      map.on('geosearch/showlocation', function (result) {
        const { x, y } = result.location;
        setPosition([y, x]);
      });

      return () => {
        map.removeControl(searchControl);
      };
    }, [map, setPosition]);

    return null;
  };

  const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return position ? (
      <Marker
        position={position}
        icon={L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })}
      />
    ) : null;
  };

  // Function to handle map position changes
  const handlePositionChange = (newPosition) => {
    setCurrentChurch(prev => ({
      ...prev,
      latitude: newPosition[0],
      longitude: newPosition[1]
    }));

    // Reverse geocode to get address from coordinates
    fetchAddressFromCoordinates(newPosition[0], newPosition[1]);
  };

  // Function to fetch address from coordinates (reverse geocoding)
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        const address = data.display_name || '';
        const city = data.address.city || data.address.town || data.address.village || '';
        const state = data.address.state || '';
        const country = data.address.country || '';

        setCurrentChurch(prev => ({
          ...prev,
          address: address,
          city: city,
          state: state,
          country: country
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };


  const handleRemoveLanguage = async (category, voiceType, index) => {
    try {

      const updated = { ...currentChurch };


      updated.languageSettings[category][voiceType].splice(index, 1);

      if (currentChurch._id) {
        await axios.patch(`${apiBaseUrl}/church/edit/${currentChurch._id}`, {
          languageSettings: updated.languageSettings
        });
        toast.dismiss();
        toast.success(t('church.languageRemoved'));
      }

      setCurrentChurch(updated);

    } catch (error) {
      console.error('Error removing language:', error);
      toast.dismiss();
      toast.error(t('church.failedToRemove'));
    }
  };

  const handleAddLanguage = (category, voiceType) => {
    setSelectedCategory(category);
    setSelectedVoiceType(voiceType);
    setSelectedLanguage('');
    setSelectedVoiceId('');
    setShowLanguageDialog(true);
  };

  const handleLanguageSubmit = async () => {
    if (!selectedLanguage || !selectedVoiceId) {
      toast.dismiss();
      toast.error(t('church.pleaseSelectLanguage'));
      return;
    }

    try {
      const newLang = {
        id: selectedVoiceId,
        language: selectedLanguage
      };

      const updated = { ...currentChurch };
      updated.languageSettings[selectedCategory][selectedVoiceType].push(newLang);

      // Use existing update API
      await axios.patch(`${apiBaseUrl}/church/edit/${currentChurch._id}`, {
        languageSettings: updated.languageSettings
      });

      setCurrentChurch(updated);
      setShowLanguageDialog(false);
      setSelectedLanguage('');
      setSelectedVoiceId('');
      toast.dismiss();
      toast.success(`${selectedLanguage} ${t('church.languageAdded')}`);
    } catch (error) {
      console.error('Error adding language:', error);
      toast.dismiss();
      toast.error(t('church.failedToAdd'));
    }
  };

  // Function to create new language
  const handleCreateLanguage = async () => {
    if (!newLanguageName.trim()) {
      toast.error(t('church.pleaseEnterLanguageName'));
      return;
    }

    // Filter out empty voice IDs
    const maleVoices = newMaleVoices.filter(voice => voice.trim() !== '');
    const femaleVoices = newFemaleVoices.filter(voice => voice.trim() !== '');

    if (maleVoices.length === 0 && femaleVoices.length === 0) {
      toast.error(t('church.pleaseAddVoiceId'));
      return;
    }

    try {
      const payload = {
        voiceName: newLanguageName.trim(),
        genderVoices: {
          male: maleVoices,
          female: femaleVoices
        }
      };

      await axios.post(`${apiBaseUrl}/language/addLanguage`, payload);

      // Refresh available languages
      await fetchAvailableLanguages();

      // Reset form
      setNewLanguageName('');
      setNewMaleVoices(['']);
      setNewFemaleVoices(['']);
      setShowAddLanguageModal(false);

      toast.success(t('church.languageCreated'));
    } catch (error) {
      console.error('Error creating language:', error);
      toast.error(t('church.failedToCreate'));
    }
  };


  // Add filtering function (search by name only)
  const getFilteredChurches = () => {
    if (!searchTerm.trim()) {
      return churches;
    }

    return churches.filter(church => {
      const searchLower = searchTerm.toLowerCase().trim();
      const churchName = (church.name || '').toLowerCase();

      return churchName.includes(searchLower);
    });
  };

  // Add pagination function
  const getPaginatedChurches = () => {
    const filteredChurches = getFilteredChurches();
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredChurches.slice(startIndex, endIndex).map((church, index) => ({
      ...church,
      serialNumber: startIndex + index + 1
    }));
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredChurches().length / ITEMS_PER_PAGE);

  const getTextFieldStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#231f20' },
      '&:hover fieldset': { borderColor: '#231f20' },
      '&.Mui-focused fieldset': { borderColor: '#231f20' }
    },
    '& .MuiInputLabel-root': { color: '#231f20' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
  };

  return (
    <React.Fragment>
      <ToastContainer />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                p: { xs: 1, sm: 2 }
              }}
            >
              <TextField
                variant="outlined"
                placeholder={t('church.search_placeholder') || 'Search by church name...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                size="small"
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', sm: '350px' },
                  '& .MuiOutlinedInput-root': {
                    height: '40px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    fontSize: '14px',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#231f20',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#231f20',
                      borderWidth: '2px',
                    },
                    '& input': {
                      padding: '8px 12px',
                      fontSize: '14px',
                      color: '#231f20',
                      '&::placeholder': {
                        color: '#666',
                        opacity: 1,
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666', fontSize: '20px' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <ClearIcon
                        sx={{
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: '18px',
                          '&:hover': { color: '#231f20' }
                        }}
                        onClick={() => {
                          setSearchTerm('');
                          setPage(1);
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAdd}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  height: '40px',
                  px: 3,
                  backgroundColor: '#231f20',
                  '&:hover': { backgroundColor: '#3d3a3b' },
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {t('church.addButton')}
              </Button>
            </Box>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              {error && <Typography color="error">{error}</Typography>}
              <TableContainer
                component={Paper}
                sx={{
                  overflowX: 'auto',
                  '& .MuiTable-root': { minWidth: { xs: '100%', sm: 650 } }
                }}
              >
                <Table>
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: theme.spacing(isMobile ? 1 : 2),
                          display: isMobile ? 'none' : 'table-cell', whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t('church.table.srNo')}                      </th>
                      <th style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{t('church.table.name')}</th>
                      <th
                        style={{
                          padding: theme.spacing(isMobile ? 1 : 2),
                          display: isMobile ? 'none' : 'table-cell'
                        }}
                      >
                        {t('church.table.address')}
                      </th>
                      <th
                        style={{
                          padding: theme.spacing(isMobile ? 1 : 2),
                          display: isTablet ? 'none' : 'table-cell'
                        }}
                      >
                        {t('church.table.suburb')}
                      </th>
                      <th
                        style={{
                          padding: theme.spacing(isMobile ? 1 : 2),
                          display: isTablet ? 'none' : 'table-cell'
                        }}
                      >
                        {t('church.table.languages')}
                      </th>
                      <th style={{ padding: theme.spacing(isMobile ? 1 : 2), textAlign: "center" }}>{t('church.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress
                              size={40}
                              sx={{ color: '#231f20', '& .MuiCircularProgress-svg': { color: '#231f20' } }}
                            />
                            <Typography variant="body1" color="#231f20">
                              {t('church.loading')}
                            </Typography>
                          </Box>
                        </td>
                      </tr>
                    ) : getFilteredChurches().length > 0 ? (
                      getPaginatedChurches().map((church) => (
                        <tr key={church._id} style={{ backgroundColor: church.serialNumber % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                          <td
                            style={{
                              padding: theme.spacing(isMobile ? 1 : 2),
                              display: isMobile ? 'none' : 'table-cell'
                            }}
                          >
                            {church.serialNumber}
                          </td>
                          <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{church.name || 'N/A'}</td>
                          <td
                            style={{
                              padding: theme.spacing(isMobile ? 1 : 2),
                              display: isMobile ? 'none' : 'table-cell'
                            }}
                          >
                            {church.address || 'N/A'}
                          </td>
                          <td
                            style={{
                              padding: theme.spacing(isMobile ? 1 : 2),
                              display: isTablet ? 'none' : 'table-cell'
                            }}
                          >
                            {church.city || 'N/A'}
                          </td>
                          <td
                            style={{
                              padding: theme.spacing(isMobile ? 1 : 2),
                              display: isTablet ? 'none' : 'table-cell'
                            }}
                          >
                            {(() => {
                              if (!church.languageSettings) return 'No languages';
                              const goLiveMale = church.languageSettings.goLive?.male?.length || 0;
                              const goLiveFemale = church.languageSettings.goLive?.female?.length || 0;
                              const joinLiveMale = church.languageSettings.joinLive?.male?.length || 0;
                              const joinLiveFemale = church.languageSettings.joinLive?.female?.length || 0;
                              const total = goLiveMale + goLiveFemale + joinLiveMale + joinLiveFemale;
                              return total > 0 ? `${total} languages` : 'No languages';
                            })()}
                          </td>
                          <td>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: { xs: '80px', sm: 'auto' } }}>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                className="bg-b"
                                onClick={() => handleEdit(church)}
                                sx={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: '60px',
                                  marginBottom: '3px',
                                  '&.MuiButton-root': { minHeight: '24px' }
                                }}
                              >
                                {t('church.actions.edit')}
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleDelete(church._id)}
                                className="bg-b"
                                sx={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: '60px',
                                  marginLeft: { xs: 0, sm: '2px' },
                                  marginBottom: '3px',
                                  '&.MuiButton-root': { minHeight: '24px' }
                                }}
                              >
                                {t('church.actions.delete')}
                              </Button>
                            </Stack>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
                          {searchTerm.trim()
                            ? t('church.messages.no_search_results').replace('{searchTerm}', searchTerm)
                            : t('church.noChurches')
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                {/* Pagination - only show if more than ITEMS_PER_PAGE records */}
                {getFilteredChurches().length > ITEMS_PER_PAGE && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      sx={{
                        '& .MuiPaginationItem-root': { color: '#231f20' },
                        '& .Mui-selected': { backgroundColor: '#231f20 !important', color: 'white !important' }
                      }}
                    />
                  </Box>
                )}
              </TableContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={showModal} onClose={() => {
        setShowModal(false);
        setEditableFields({
          speech_location: false,
          speech_key: false,
          translator_key: false,
          translator_location: false
        });
      }} fullWidth maxWidth="sm">
        <DialogTitle>{modalType === 'Save' ? t('church.dialog.addTitle') : t('church.dialog.editTitle')}</DialogTitle>        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <TextField
              label={t('church.form.name')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              sx={getTextFieldStyles}
            />

            <TextField
              label={t('church.form.contactNo')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.contact_no}
              onChange={(e) => handleInputChange('contact_no', e.target.value)}
              error={!!validationErrors.contact_no}
              helperText={validationErrors.contact_no}
              sx={getTextFieldStyles}
            />
            <TextField
              label={t('church.form.pastorName')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.senior_pastor_name}
              onChange={(e) => handleInputChange('senior_pastor_name', e.target.value)}
              error={!!validationErrors.senior_pastor_name}
              helperText={validationErrors.senior_pastor_name}
              sx={getTextFieldStyles}
            />
            <TextField
              label={t('church.form.pastorPhone')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.senior_pastor_phone_number}
              onChange={(e) => handleInputChange('senior_pastor_phone_number', e.target.value)}
              error={!!validationErrors.senior_pastor_phone_number}
              helperText={validationErrors.senior_pastor_phone_number}
              sx={getTextFieldStyles}
            />

            <Box sx={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '50px' }}>
              <div>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="church-image-upload"
                  type="file"
                  onChange={(e) => handleInputChange('image', e.target.files[0])}
                />
                <label htmlFor="church-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    sx={{ color: '#231f20', borderColor: '#231f20' }}
                  >
                    {t('church2.form.uploadImage')}
                  </Button>
                </label>
                <Box sx={{ fontSize: '12px', color: 'gray', mt: 0.5 }}>
                  Only JPG, PNG, and GIF formats are allowed.
                </Box>
              </div>

              {currentChurch.image && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={typeof currentChurch.image === 'string'
                      ? currentChurch.image
                      : URL.createObjectURL(currentChurch.image)}
                    alt="Church preview"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                </Box>
              )}
            </Box>



            <Box sx={{ mt: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#231f20' }}>
                {t('church.selectLocation') || 'Select Church Location'}
              </Typography>

              <Box sx={{ height: '400px', width: '100%', position: 'relative' }}>
                <MapContainer
                  center={currentChurch.latitude && currentChurch.longitude
                    ? [currentChurch.latitude, currentChurch.longitude]
                    : [0, 0]}
                  zoom={3}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <SearchControl setPosition={handlePositionChange} />
                  <LocationMarker
                    position={currentChurch.latitude && currentChurch.longitude
                      ? [currentChurch.latitude, currentChurch.longitude]
                      : null}
                    setPosition={handlePositionChange}
                  />
                </MapContainer>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  label={t('church.form.latitude') || 'Latitude'}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={currentChurch.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  InputProps={{
                    readOnly: true,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={getTextFieldStyles}
                />
                <TextField
                  label={t('church.form.longitude') || 'Longitude'}
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={currentChurch.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  InputProps={{
                    readOnly: true,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={getTextFieldStyles}
                />
              </Box>

              <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                {t('church.locationInstructions') || 'Click on the map to set the church location. The address fields will be automatically updated.'}
              </Typography>
            </Box>


            <TextField
              label={t('church.form.address')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              error={!!validationErrors.address}
              helperText={validationErrors.address}
              sx={getTextFieldStyles}
              multiline
              rows={3}
            />

            <TextField
              label={t('church.form.state')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              error={!!validationErrors.state}
              helperText={validationErrors.state}
              sx={getTextFieldStyles}
            />
            <TextField
              label={t('church.form.country')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              error={!!validationErrors.country}
              helperText={validationErrors.country}
              sx={getTextFieldStyles}
            />
            <TextField
              label={t('church.form.suburb')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentChurch.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              error={!!validationErrors.city}
              helperText={validationErrors.city}
              sx={getTextFieldStyles}
            />


            <Box>
              <TextField
                label={t('church.form.church_stream_Limit(per week)')}
                variant="outlined"
                fullWidth
                margin="normal"
                type="number"
                inputProps={{
                  min: 30,
                  max: 10080,
                  step: 30
                }}
                value={currentChurch.stream_limit_minutes}
                onChange={(e) => handleInputChange('stream_limit_minutes', e.target.value)}
                onKeyDown={(e) => {
                  // Allow all keyboard input including any numbers
                  // Remove step validation for keyboard input
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const currentValue = parseInt(currentChurch.stream_limit_minutes) || 0;
                    const step = 30;

                    if (e.key === 'ArrowUp') {
                      const newValue = Math.min(currentValue + step, 10080);
                      handleInputChange('stream_limit_minutes', newValue.toString());
                    } else if (e.key === 'ArrowDown') {
                      const newValue = Math.max(currentValue - step, 1);
                      handleInputChange('stream_limit_minutes', newValue.toString());
                    }
                  }
                }}
                error={!!validationErrors.stream_limit_minutes}
                helperText={
                  validationErrors.stream_limit_minutes ||
                  `${currentChurch.stream_limit_minutes ?
                    `≈ ${Math.round((currentChurch.stream_limit_minutes / 60) * 10) / 10} hours` :
                    'Enter duration in minutes'}`
                }
                sx={getTextFieldStyles}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>
                }}
              />
            </Box>

            {modalType === 'Update' && currentChurch?.stream_used_minutes >= 0 && (
              <TextField
                label={t('church.form.used_stream_Limit')}
                variant="outlined"
                fullWidth
                margin="normal"
                value={currentChurch.stream_used_minutes}
                onChange={(e) => handleInputChange('stream_used_minutes', e.target.value)}
                error={!!validationErrors.stream_used_minutes}
                helperText={validationErrors.stream_used_minutes}
                disabled
                sx={getTextFieldStyles}
                InputProps={{
                  endAdornment: <InputAdornment position="end">minutes</InputAdornment>
                }}
              />

            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <TextField
                label={t('church.form.speech_location')}
                variant="outlined"
                fullWidth
                margin="normal"
                value={currentChurch.speech_location}
                onChange={(e) => handleInputChange('speech_location', e.target.value)}
                error={!!validationErrors.speech_location}
                helperText={validationErrors.speech_location}
                sx={getTextFieldStyles}
                disabled={modalType === 'Update' && !editableFields.speech_location}
              />
              {modalType === 'Update' && !editableFields.speech_location && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEnableFieldEdit('speech_location', 'Speech Location')}
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    color: '#231f20',
                    borderColor: '#231f20',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                      borderColor: '#231f20'
                    }
                  }}
                >
                  <Edit2 size={16} />
                </Button>
              )}
            </Box>


            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <TextField
                label={t('church.form.speech_key')}
                variant="outlined"
                fullWidth
                margin="normal"
                value={currentChurch.speech_key}
                onChange={(e) => handleInputChange('speech_key', e.target.value)}
                error={!!validationErrors.speech_key}
                helperText={validationErrors.speech_key}
                sx={getTextFieldStyles}
                disabled={modalType === 'Update' && !editableFields.speech_key}
              />
              {modalType === 'Update' && !editableFields.speech_key && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEnableFieldEdit('speech_key', 'Speech Key')}
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    color: '#231f20',
                    borderColor: '#231f20',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                      borderColor: '#231f20'
                    }
                  }}
                >
                  <Edit2 size={16} />
                </Button>
              )}
            </Box>


            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <TextField
                label={t('church.form.translator_key')}
                variant="outlined"
                fullWidth
                margin="normal"
                value={currentChurch.translator_key}
                onChange={(e) => handleInputChange('translator_key', e.target.value)}
                error={!!validationErrors.translator_key}
                helperText={validationErrors.translator_key}
                sx={getTextFieldStyles}
                disabled={modalType === 'Update' && !editableFields.translator_key}
              />
              {modalType === 'Update' && !editableFields.translator_key && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEnableFieldEdit('translator_key', 'Translator Key')}
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    color: '#231f20',
                    borderColor: '#231f20',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                      borderColor: '#231f20'
                    }
                  }}
                >
                  <Edit2 size={16} />
                </Button>
              )}
            </Box>


            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <TextField
                label={t('church.form.translator_location')}
                variant="outlined"
                fullWidth
                margin="normal"
                value={currentChurch.translator_location}
                onChange={(e) => handleInputChange('translator_location', e.target.value)}
                error={!!validationErrors.translator_location}
                helperText={validationErrors.translator_location}
                sx={getTextFieldStyles}
                disabled={modalType === 'Update' && !editableFields.translator_location}
              />
              {modalType === 'Update' && !editableFields.translator_location && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleEnableFieldEdit('translator_location', 'Translator Location')}
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    color: '#231f20',
                    borderColor: '#231f20',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                      borderColor: '#231f20'
                    }
                  }}
                >
                  <Edit2 size={16} />
                </Button>
              )}
            </Box>

            {/* Language Settings Section */}
            <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#231f20' }}>
                {t('church.languageSettings')}
              </Typography>

              {/* Go Live Languages */}
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                {t('church.goLiveLanguages')}
              </Typography>

              {/* Male Go Live Languages */}
              <Box sx={{ ml: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                  {t('church.maleVoices')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {currentChurch.languageSettings?.goLive?.male?.map((lang, index) => (
                    <Chip
                      key={lang._id || index}
                      label={lang.language}
                      onDelete={() => handleRemoveLanguage('goLive', 'male', index)}
                      sx={{
                        backgroundColor: '#e3f2fd',
                        '& .MuiChip-deleteIcon': { color: '#666' }
                      }}
                    />
                  ))}
                  {modalType === 'Update' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddLanguage('goLive', 'male')}
                      sx={{
                        color: '#231f20',
                        borderColor: '#231f20',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {t('church.addlangButton')}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Female Go Live Languages */}
              <Box sx={{ ml: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                  {t('church.femaleVoices')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {currentChurch.languageSettings?.goLive?.female?.map((lang, index) => (
                    <Chip
                      key={lang._id || index}
                      label={lang.language}
                      onDelete={() => handleRemoveLanguage('goLive', 'female', index)}
                      sx={{
                        backgroundColor: '#fce4ec',
                        '& .MuiChip-deleteIcon': { color: '#666' }
                      }}
                    />
                  ))}
                  {modalType === 'Update' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddLanguage('goLive', 'female')}
                      sx={{
                        color: '#231f20',
                        borderColor: '#231f20',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {t('church.addlangButton')}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Join Live Languages */}
              <Typography variant="subtitle1" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                {t('church.joinLiveLanguages')}
              </Typography>
              {/* Male Join Live Languages */}
              <Box sx={{ ml: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                  {t('church.maleVoices')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {currentChurch.languageSettings?.joinLive?.male?.map((lang, index) => (
                    <Chip
                      key={lang._id || index}
                      label={lang.language}
                      onDelete={() => handleRemoveLanguage('joinLive', 'male', index)}
                      sx={{
                        backgroundColor: '#f3e5f5',
                        '& .MuiChip-deleteIcon': { color: '#666' }
                      }}
                    />
                  ))}
                  {modalType === 'Update' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddLanguage('joinLive', 'male')}
                      sx={{
                        color: '#231f20',
                        borderColor: '#231f20',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {t('church.addlangButton')}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Female Join Live Languages */}
              <Box sx={{ ml: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                  {t('church.femaleVoices')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {currentChurch.languageSettings?.joinLive?.female?.map((lang, index) => (
                    <Chip
                      key={lang._id || index}
                      label={lang.language}
                      onDelete={() => handleRemoveLanguage('joinLive', 'female', index)}
                      sx={{
                        backgroundColor: '#fff3e0',
                        '& .MuiChip-deleteIcon': { color: '#666' }
                      }}
                    />
                  ))}
                  {modalType === 'Update' && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleAddLanguage('joinLive', 'female')}
                      sx={{
                        color: '#231f20',
                        borderColor: '#231f20',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {t('church.addlangButton')}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            <DialogActions>
              <Button onClick={() => {
                setShowModal(false);
                setEditableFields({
                  speech_location: false,
                  speech_key: false,
                  translator_key: false,
                  translator_location: false
                });
              }} variant="outlined" sx={{ color: '#231f20', borderColor: '#231f20' }}>
                {t('church.form.cancel')}              </Button>
              <Button type="submit" variant="contained" sx={{ backgroundColor: '#231f20', color: 'white' }}>
                {t(`church.form.${modalType.toLowerCase()}`)}              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Language Selection Dialog */}
      <LanguageSelectionDialog
        showLanguageDialog={showLanguageDialog}
        setShowLanguageDialog={setShowLanguageDialog}
        selectedCategory={selectedCategory}
        selectedVoiceType={selectedVoiceType}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedVoiceId={selectedVoiceId}
        setSelectedVoiceId={setSelectedVoiceId}
        availableLanguages={availableLanguages}
        currentChurch={currentChurch}
        handleLanguageSubmit={handleLanguageSubmit}
        setShowAddLanguageModal={setShowAddLanguageModal}
      />

      {/* Create New Language Dialog */}
      <CreateLanguageDialog
        showAddLanguageModal={showAddLanguageModal}
        setShowAddLanguageModal={setShowAddLanguageModal}
        newLanguageName={newLanguageName}
        setNewLanguageName={setNewLanguageName}
        newMaleVoices={newMaleVoices}
        setNewMaleVoices={setNewMaleVoices}
        newFemaleVoices={newFemaleVoices}
        setNewFemaleVoices={setNewFemaleVoices}
        handleCreateLanguage={handleCreateLanguage}
      />

    </React.Fragment>
  );
};

export default Church;