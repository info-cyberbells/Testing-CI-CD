import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Card,
  Table,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TableContainer,
  Paper,
  DialogActions,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  Box,
  Stack,
  Select,
  InputLabel,
  Chip,
  MenuItem,
  FormControl,
  CircularProgress
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import './style.css';
import { ToastContainer, toast } from 'react-toastify';
import { Pagination } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';
import CloseIcon from '@mui/icons-material/Close';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Event = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentUser, setCurrentUser] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const churchId = localStorage.getItem('churchId');
  const [isLoading, setIsLoading] = useState(true);
  const [churches, setChurches] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const userType = localStorage.getItem('userType') == '1'; //SuperAdmin
  const userType3 = localStorage.getItem('userType') == '3'; //Staff
  const [eventPage, setEventPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      if (localStorage.getItem('userType') === '1') {
        await fetchChurches();
      }
    };
    fetchData();
  }, []);
  // Updated date formatting function


  const fetchChurches = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/church/fetchAll`);
      console.log('RESPONSE CHURCHES', response.data);
      const churches = response.data || [];

      const lang = i18n.language;
      console.log('[FETCH] Current language:', lang);

      if (lang !== 'en' && churches.length > 0) {
        console.log('[FETCH] Translating church data to:', lang);
        const translatedChurches = await Promise.all(
          churches.map(async (church, i) => {
            console.log(`[TRANSLATING] (${i + 1}) Church: ${church.name}`);
            const fieldsToTranslate = ['name']; // Add other fields like 'description', 'address' if applicable
            const translatedFields = {};

            for (const field of fieldsToTranslate) {
              if (church[field]) {
                console.log(`[TRANSLATING] ${field}: ${church[field]}`);
                translatedFields[field] = await translateText(church[field], lang);
                console.log(`[TRANSLATED] ${field}: ${translatedFields[field]}`);
              }
            }

            return {
              ...church,
              ...translatedFields,
            };
          })
        );
        console.log('[FETCH] Translated churches:', translatedChurches);
        setChurches(translatedChurches);
      } else {
        setChurches(churches);
      }
    } catch (err) {
      console.error('Error fetching churches:', err);
      toast.error(t(`event.errors.${(err.message || 'Error fetching churches').replace(/\s+/g, '_').toLowerCase()}`, err.message || 'Error fetching churches'));
    }
  };



  // Modified handleRemoveImage function with correct indexing
  const handleRemoveImage = async (index, imageUrl) => {
    // Check if the image is from database (starts with http)
    const isDbImage = typeof imageUrl === 'string' && imageUrl.startsWith('http');

    if (isDbImage && currentUser._id) {
      try {
        // Find the index of this image URL in the database images array
        const dbIndex = currentUser.images.findIndex((img) => img === imageUrl);

        if (dbIndex === -1) {
          toast.error(t('event.errors.image_not_found_in_database'));
          return;
        }

        // Call API to delete the image by index
        const response = await axios.post(`${apiBaseUrl}/event/deleteImages/${currentUser._id}`, {
          imageIndices: [dbIndex]
        });

        if (response.data) {
          // If successful, update the current user's images from the response
          if (response.data.remainingImages) {
            setImages(response.data.remainingImages);
            setPreviewImages(response.data.remainingImages);

            // Also update the currentUser state
            setCurrentUser((prev) => ({
              ...prev,
              images: response.data.remainingImages
            }));
          } else {
            // Remove from preview and current images arrays if no response data
            setImages((prevImages) => prevImages.filter((img) => img !== imageUrl));
            setPreviewImages((prevPreviews) => prevPreviews.filter((img) => img !== imageUrl));

            // Also update the currentUser state
            setCurrentUser((prev) => ({
              ...prev,
              images: prev.images.filter((img) => img !== imageUrl)
            }));
          }

          toast.success(t('event.messages.image_deleted_successfully'));
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error(t(`event.errors.${('Failed to delete image: ' + (error.response?.data?.error || error.message)).replace(/\s+/g, '_').toLowerCase()}`, 'Failed to delete image: ' + (error.response?.data?.error || error.message)));
      }
    } else {
      setImages((prevImages) => prevImages.filter((_, i) => i !== index));
      setPreviewImages((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
    }
  };

  const isDateBeforeCurrent = (dateString) => {
    if (!dateString) return false;
    try {
      const eventDate = new Date(dateString);
      if (isNaN(eventDate.getTime())) return false;
      return eventDate < new Date(); // Compare directly
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const userType = localStorage.getItem('userType');
      const endpoint = `${apiBaseUrl}/event/fetchAll${userType !== '1' ? `?churchId=${churchId}` : ''}`;
      const response = await axios.get(endpoint);
      const events = response.data || [];

      const lang = i18n.language;
      console.log('[FETCH] Current language:', lang);

      let sortedEvents;
      if (lang !== 'en' && events.length > 0) {
        console.log('[FETCH] Translating event data to:', lang);
        const translatedEvents = await Promise.all(
          events.map(async (event, i) => {
            console.log(`[TRANSLATING] (${i + 1}) Event: ${event.title}`);
            const fieldsToTranslate = ['title', 'description', 'location'];
            const translatedFields = {};

            for (const field of fieldsToTranslate) {
              if (event[field]) {
                console.log(`[TRANSLATING] ${field}: ${event[field]}`);
                translatedFields[field] = await translateText(event[field], lang);
                console.log(`[TRANSLATED] ${field}: ${translatedFields[field]}`);
              }
            }

            return {
              ...event,
              ...translatedFields,
            };
          })
        );
        console.log('[FETCH] Translated events:', translatedEvents);
        sortedEvents = translatedEvents.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt);
          const dateB = new Date(b.date || b.createdAt);
          return dateB - dateA; // Simple descending order by date
        });
      } else {
        sortedEvents = events.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt);
          const dateB = new Date(b.date || b.createdAt);
          return dateB - dateA; // Simple descending order by date
        });
      }

      setUsers(sortedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast.error(t(`event.errors.${(err.response?.data?.message || 'Error fetching Events').replace(/\s+/g, '_').toLowerCase()}`, err.response?.data?.message || 'Error fetching Events'));
    } finally {
      setIsLoading(false);
    }
  };

  const getPaginatedEvents = () => {
    const startIndex = (eventPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return users.slice(startIndex, endIndex).map((user, index) => ({
      ...user,
      serialNumber: startIndex + index + 1
    }));
  };

  const handleEventPageChange = (event, value) => {
    setEventPage(value);
  };

  const eventTotalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  const handleDelete = async (id) => {
    if (window.confirm(t('event.messages.delete_event_confirmation'))) {
      try {
        await axios.delete(`${apiBaseUrl}/event/delete/${id}`);
        setUsers(users.filter((user) => user._id !== id));
        toast.success(t('event.messages.event_deleted_successfully'));
      } catch (err) {
        toast.error(t(`event.errors.${(err.response?.data?.message || 'Error deleting Event').replace(/\s+/g, '_').toLowerCase()}`, err.response?.data?.message || 'Error deleting Event'));
      }
    }
  };

  const handleAdd = () => {
    setModalType('Save');
    const userType = localStorage.getItem('userType');
    const churchId = localStorage.getItem('churchId');
    setCurrentUser({
      date: new Date().toISOString().slice(0, 16), // Use raw ISO string for datetime-local
      churchId: userType !== '1' ? churchId : ''
    });
    setImages([]);
    setPreviewImages([]);
    setShowModal(true);
    setError(null);
    setValidationErrors({});
  };

  const handleEdit = (user) => {
    setModalType('Update');
    const userType = localStorage.getItem('userType');
    const churchId = localStorage.getItem('churchId');
    const formattedUser = {
      ...user,
      date: user.date ? new Date(user.date).toISOString().slice(0, 16) : '', // Use raw date
      churchId: userType === '1' ? user.churchId : churchId
    };
    setImages(user.images || []);
    setPreviewImages(user.images || []);
    setImagesToDelete([]);
    setCurrentUser(formattedUser);
    setShowModal(true);
    setError(null);
  };


  const validateForm = () => {
    const errors = {};
    const userTypeValue = localStorage.getItem('userType');

    if (!currentUser.name || currentUser.name.trim() === '') {
      errors.name = t('event.errors.event_name_required');
    }

    if (!currentUser.description || currentUser.description.trim() === '') {
      errors.description = t('event.errors.event_description_required');
    }

    if (!currentUser.date) {
      errors.date = t('event.errors.event_date_required');
    } else {
      // Validate date format
      const date = new Date(currentUser.date);
      if (isNaN(date.getTime())) {
        errors.date = t('event.errors.invalid_date_format');
      }
    }

    // Only validate event_church_location for admin users (type 1)
    // OR if it's required for all users but just the UI is conditional
    // if (userTypeValue === '1') {
    // if (!currentUser.event_church_location || currentUser.event_church_location.trim() === '') {
    //   errors.event_church_location = 'Event Church Location is required.';
    // }

    // If admin user, also validate churchId selection
    if (!currentUser.churchId) {
      errors.churchId = t('event.errors.church_name_required');
    }
    // }

    return errors;
  };

  const handleInputChange = (field, value) => {
    setCurrentUser((prevState) => ({
      ...prevState,
      [field]: value
    }));
  };



  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const userTypeValue = localStorage.getItem('userType');
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const churchId = localStorage.getItem('churchId');
      let eventData = {
        ...currentUser,
        churchId: userTypeValue === '1' ? currentUser.churchId : churchId,
        createdAt: currentUser.createdAt || new Date().toISOString(),
        date: currentUser.date, // Send raw ISO string (e.g., "2025-04-12T14:30")
        images: images
      };

      // Translate text fields to English if the current language is not English
      const currentLang = i18n.language;
      if (currentLang !== 'en') {
        console.log(`[SUBMIT] Translating event data from ${currentLang} to English`);
        const fieldsToTranslate = ['title', 'description', 'location']; // Adjust based on actual event fields
        for (const field of fieldsToTranslate) {
          if (eventData[field]) {
            console.log(`[SUBMIT] Translating ${field}: ${eventData[field]}`);
            eventData[field] = await translateText(eventData[field], 'en', currentLang);
            console.log(`[SUBMIT] Translated ${field}: ${eventData[field]}`);
          }
        }
      }

      let response;
      if (modalType === 'Save') {
        response = await axios.post(`${apiBaseUrl}/event/add`, eventData);
        if (response.data) {
          setShowModal(false);
          setCurrentUser({});
          setValidationErrors({});
          setImages([]);
          setPreviewImages([]);
          await fetchUsers();
          toast.success(t(`event.messages.event_${modalType.toLowerCase()}_successfully`));
        }
      } else {
        response = await axios.patch(`${apiBaseUrl}/event/edit/${currentUser._id}`, eventData);
        if (response.data) {
          setShowModal(false);
          setCurrentUser({});
          setValidationErrors({});
          setImages([]);
          setPreviewImages([]);
          await fetchUsers();
          toast.success(t(`event.messages.event_${modalType.toLowerCase()}_successfully`));
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || `Error during ${modalType.toLowerCase()} operation`;
      toast.error(t(`event.errors.${(errorMessage || `Error during ${modalType.toLowerCase()} operation`).replace(/\s+/g, '_').toLowerCase()}`, errorMessage || `Error during ${modalType.toLowerCase()} operation`));
      setError(errorMessage);
    }
  };


  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxImages = 10;
    if (previewImages.length + files.length > maxImages) {
      toast.error(`You can only upload a maximum of ${maxImages} images. Currently you have ${previewImages.length} images.`);
      e.target.value = null;
      return;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
          if (!validTypes.includes(file.type)) {
            toast.error(t('event.errors.invalid_image_type'));
            return null;
          }

          if (file.size > 5 * 1024 * 1024) {
            toast.error(t('event.errors.image_too_large'));
            return null;
          }
          return await imageCompression(file, options);
        })
      );

      const validCompressedFiles = compressedFiles.filter((file) => file !== null);
      validCompressedFiles.forEach((compressedFile) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target.result;
          setImages((prevImages) => [...prevImages, base64String]);
          setPreviewImages((prevPreviews) => [...prevPreviews, base64String]);
        };
        reader.readAsDataURL(compressedFile);
      });

      e.target.value = null;
    } catch (error) {
      console.error('Image compression failed:', error);
      toast.error(t('event.errors.image_compression_failed'));
    }
  };

  // Trigger file input click
  const handleAddPhotoClick = () => {
    fileInputRef.current.click();
  };

  return (
    <React.Fragment>
      <ToastContainer />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Add Button Container */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                p: { xs: 1, sm: 2 }
              }}
            >
              <Button
                variant="contained"
                color="primary"
                className="bg-b"
                onClick={handleAdd}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  mb: { xs: 2, sm: 0 }
                }}
              >
                {t('event.buttons.add_new_event')}
              </Button>
            </Box>

            {/* Table Container */}
            <TableContainer
              component={Paper}
              sx={{
                overflowX: 'auto',
                p: { xs: 1, sm: 2, md: 3 }
              }}
            >
              <Table sx={{ minWidth: { xs: '100%', sm: 650 } }}>
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
                      {t('event.table.serial_number')}
                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('event.table.event_name')}</th>
                    <th
                      style={{
                        padding: theme.spacing(isMobile ? 1 : 2),
                        display: isMobile ? 'none' : 'table-cell', whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t('event.table.event_date')}
                    </th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{t('event.table.status')}</th>
                    {/* {userType && userType3 && <th style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>Event Church Location</th>} */}

                    <th
                      style={{
                        padding: theme.spacing(isMobile ? 1 : 2),
                        paddingLeft: theme.spacing(8), // Adjust this number as needed
                        textAlign: 'left'
                      }}
                    >
                      {t('event.table.actions')}
                    </th>

                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <CircularProgress
                            size={40}
                            sx={{
                              color: '#231f20',
                              '& .MuiCircularProgress-svg': {
                                color: '#231f20'
                              }
                            }}
                          />
                          <Typography variant="body1" color="#231f20">
                            <Typography variant="body1" color="#231f20">
                              {t('event.messages.loading_events')}
                            </Typography>
                          </Typography>
                        </Box>
                      </td>
                    </tr>
                  ) : users.length > 0 ? (
                    getPaginatedEvents().map((user) => {
                      const isDisabled = isDateBeforeCurrent(user.date);
                      return (
                        <tr
                          key={user._id}
                          style={{ backgroundColor: (user.serialNumber - 1) % 2 === 0 ? '#f9f9f9' : '#ffffff' }}
                        >
                          <td style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                            {user.serialNumber}
                          </td>
                          <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{user.name}</td>
                          <td style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                            {user.date ? new Date(user.date).toLocaleString('en-US', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'UTC'
                            }) : 'N/A'}
                          </td>
                          <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>
                            <Chip
                              label={isDisabled ? t('event.status.expired') : t('event.status.active')}
                              color={isDisabled ? 'error' : 'success'}
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                backgroundColor: isDisabled ? '#ffebee' : '#e8f5e9',
                                color: isDisabled ? '#d32f2f' : '#2e7d32'
                              }}
                            />
                          </td>

                          {/* {userType && userType3 && <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{user.event_church_location}</td>} */}

                          <td>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: { xs: '80px', sm: 'auto' } }}>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                className="bg-b"
                                onClick={() => handleEdit(user)}
                                // disabled={userType3}
                                sx={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: '60px',
                                  // opacity: userType3 ? 0.7 : 1,
                                  opacity: 1,
                                  backgroundColor: '#4CAF50',
                                  '&.Mui-disabled': {
                                    backgroundColor: '#4CAF50',
                                    color: 'white'
                                  },
                                  '&:hover': {
                                    backgroundColor: '#45a049'
                                  }
                                }}
                              >
                                {t('event.buttons.edit')}
                              </Button>

                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                className="bg-b"
                                onClick={() => handleDelete(user._id)}
                                // disabled={userType3}
                                sx={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: '60px',
                                  // opacity: userType3 ? 0.7 : 1,
                                  opacity: 1,
                                  backgroundColor: '#ef5350',
                                  '&.Mui-disabled': {
                                    backgroundColor: '#ef5350',
                                    color: 'white'
                                  },
                                  '&:hover': {
                                    backgroundColor: '#d32f2f'
                                  }
                                }}
                              >
                                {t('event.buttons.delete')}
                              </Button>
                            </Stack>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: 'center',
                          padding: theme.spacing(2)
                        }}
                      >
                        {t('event.messages.no_events_available')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
              {users.length > ITEMS_PER_PAGE && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                  <Pagination
                    count={eventTotalPages}
                    page={eventPage}
                    onChange={handleEventPageChange}
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
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogTitle>{t(`event.modal.${modalType.toLowerCase()}_event`)}</DialogTitle>        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <TextField
              label={t('event.fields.name')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#231f20'
                  },
                  '&:hover fieldset': {
                    borderColor: '#231f20'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#231f20'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#231f20'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#231f20'
                }
              }}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
            />
            {/* <TextField
              label="Event Date"
              type="date"
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.createdAt || ''}
              onChange={(e) => handleInputChange('createdAt', e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#231f20'
                  },
                  '&:hover fieldset': {
                    borderColor: '#231f20'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#231f20'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#231f20'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#231f20'
                }
              }}
              error={!!validationErrors.date}
              helperText={validationErrors.date}
            /> */}
            <TextField
              label={t('event.fields.date')}
              type="datetime-local"
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.date || ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
              inputProps={{
                min: new Date().toISOString().slice(0, 16)
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#231f20'
                  },
                  '&:hover fieldset': {
                    borderColor: '#231f20'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#231f20'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#231f20'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#231f20'
                }
              }}
              error={!!validationErrors.date}
              helperText={validationErrors.date}
            />
            <TextField
              label={t('event.fields.description')}
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={currentUser.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#231f20'
                  },
                  '&:hover fieldset': {
                    borderColor: '#231f20'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#231f20'
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#231f20'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#231f20'
                }
              }}
              error={!!validationErrors.description}
              helperText={validationErrors.description}
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('event.labels.event_images')}
              </Typography>

              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" multiple onChange={handleFileChange} />

              <Button variant="outlined" startIcon={<AddPhotoAlternateIcon />} onClick={handleAddPhotoClick} sx={{ mb: 2 }}>
                {t(`event.buttons.${modalType.toLowerCase()}_photos`)}
              </Button>

              <Typography
                variant="caption"
                color={previewImages.length >= 10 ? "textSecondary" : "textSecondary"}
                sx={{
                  mt: 1,
                  mb: 1,
                  display: 'block',
                  fontWeight: previewImages.length >= 10 ? 'bold' : 'normal'
                }}
              >
                {previewImages.length}/10 images uploaded
                {previewImages.length >= 10 && " (Maximum reached)"}
              </Typography>

              {/* Image Preview Section */}
              {previewImages.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 2
                  }}
                >
                  {previewImages.map((img, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        src={img}
                        alt={`Event preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(img)}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          color: 'red',
                          bgcolor: 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.9)'
                          }
                        }}
                        onClick={() => handleRemoveImage(index, img)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {userType && (
              <FormControl
                fullWidth
                margin="normal"
                error={!!validationErrors.churchId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#231f20' },
                    '&:hover fieldset': { borderColor: '#231f20' },
                    '&.Mui-focused fieldset': { borderColor: '#231f20' }
                  },
                  '& .MuiInputLabel-root': { color: '#231f20' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
                }}
              >
                <InputLabel>{t('event.fields.church_name')}</InputLabel>
                <Select
                  value={currentUser.churchId || ''}
                  onChange={(e) => handleInputChange('churchId', e.target.value)}
                  label={t('event.fields.church_name')}
                >
                  <MenuItem value="">
                    <em>{t('event.options.select_church')}</em>
                  </MenuItem>
                  {churches.map((church) => (
                    <MenuItem key={church._id} value={church._id}>
                      {church.name}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.churchId && (
                  <Typography color="error" variant="caption">
                    {validationErrors.churchId}
                  </Typography>
                )}
              </FormControl>
            )}
            {error && <Typography color="error">{error}</Typography>}
            <DialogActions>
              <Button onClick={() => setShowModal(false)} variant="outlined" color="secondary">
                {t('event.buttons.cancel')}
              </Button>
              <Button type="submit" variant="contained" color="primary" className="bg-b">
                {t(`event.buttons.${modalType.toLowerCase()}`)}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      {/* Fullscreen Image Modal */}
      <Dialog
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <IconButton
          onClick={() => setShowImageModal(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: '#000000',
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent sx={{ p: 0, textAlign: 'center' }}>
          <img
            src={selectedImage}
            alt="Full View"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '90vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default Event;
