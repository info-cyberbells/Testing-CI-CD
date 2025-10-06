import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Stack,
  CircularProgress,
  Pagination,
  InputAdornment
} from '@mui/material';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import './style.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const User = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const ITEMS_PER_PAGE = 10;


  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [churches, setChurches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentUser, setCurrentUser] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchChurches()]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [i18n.language]);


  const fetchUsers = async () => {
    try {
      const userType = localStorage.getItem('userType');
      const churchId = localStorage.getItem('churchId');
      console.log(`[FETCH USERS] Fetching users with userType=${userType}, churchId=${churchId}`);

      const response = await axios.get(`${apiBaseUrl}/user/fetchAll`);

      if (!Array.isArray(response.data)) {
        console.error('[FETCH USERS] Response data is not an array:', response.data);
        throw new Error('Invalid response format');
      }

      let userData = response.data;

      const filteredUsers = userData
        .filter((user) => {
          try {
            if (!user.churchId || !user.churchId._id) {
              console.warn(
                `[FETCH USERS] Skipping user ${user._id || 'unknown'} with missing/invalid churchId:`,
                user.churchId
              );
              return false;
            }
            if (userType === '1') {
              return user.type === '4' && user.churchId && user.churchId._id;
            } else if (userType === '2') {
              return user.type === '4' && user.churchId && user.churchId._id === churchId;
            } else {
              return user.type === '4' && user.churchId && user.churchId._id === churchId;
            }
          } catch (filterError) {
            console.error(`[FETCH USERS] Error filtering user ${user._id || 'unknown'}:`, filterError);
            return false;
          }
        })
        .sort((a, b) => {
          try {
            return new Date(b.created_at) - new Date(a.created_at);
          } catch (sortError) {
            console.error('[FETCH USERS] Error sorting users:', sortError);
            return 0;
          }
        });

      console.log(`[FETCH USERS] Fetched ${filteredUsers.length} users`);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('[FETCH USERS] Error fetching users:', err);
      const errorMessage = err.message || 'Error fetching users';
      toast.error(
        t(`user.errors.${errorMessage.replace(/\s+/g, '_').toLowerCase()}`, errorMessage)
      );
    } finally {
    }
  };



  const fetchChurches = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/church/fetchAll?exclude=true`);
      setChurches(response.data);
    } catch (err) {
      toast.error(err.message || 'Error fetching churches');
    }
  };


  const handleDelete = async (id) => {
    if (window.confirm(t('user.messages.delete_user_confirmation'))) {
      try {
        await axios.delete(`${apiBaseUrl}/user/delete/${id}`);
        await fetchUsers();
        toast.success(t('user.messages.user_deleted_successfully'));
      } catch (err) {
        toast.error(t(`user.errors.${(err.message || 'Error deleting User').replace(/\s+/g, '_').toLowerCase()}`, err.message || 'Error deleting User'));
      }
    }
  };

  const handleAdd = () => {
    setModalType('Save');
    const userType = localStorage.getItem('userType');
    setCurrentUser({
      type: userType === '2' ? '2' : '4'
    });
    setShowModal(true);
    setError(null);
    setValidationErrors({});
  };

  const handleEdit = (user) => {
    setModalType('Update');
    setCurrentUser({
      ...user,
      churchId: user.churchId?._id || ''
    });
    setShowModal(true);
    setError(null);
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const specialCharRegex = /[^a-zA-Z\s]/;
    const whitespaceRegex = /^\s*$/;

    if (!currentUser.firstName?.trim()) {
      errors.firstName = t('user.errors.first_name_required');
    }

    if (modalType === 'Save') {
      if (!currentUser.password) {
        errors.password = t('user.errors.password_required');
      } else if (currentUser.password.length < 6) {
        errors.password = t('user.errors.password_min_length');
      }
    }

    if (!currentUser.email?.trim()) {
      errors.email = t('user.errors.email_required');
    } else if (!emailRegex.test(currentUser.email)) {
      errors.email = t('user.errors.email_invalid');
    }

    if (!currentUser.suburb?.trim()) {
      errors.suburb = t('user.errors.suburb_required');
    } else if (specialCharRegex.test(currentUser.suburb)) {
      errors.suburb = t('user.errors.suburb_letters_only');
    }

    const userType = localStorage.getItem('userType');
    if (userType === '1' && !currentUser.churchId) {
      errors.churchId = t('user.errors.church_required');
    }

    return errors;
  };

  const handleInputChange = (field, value) => {
    setCurrentUser((prev) => ({
      ...prev,
      [field]: value
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

    try {
      const userType = localStorage.getItem('userType');
      const churchIdFromStorage = localStorage.getItem('churchId');
      const currentLang = i18n.language || 'en'; // Fallback to 'en' if undefined
      let userToSave = { ...currentUser };

      // Translate text fields to English if current language is not English
      if (currentLang !== 'en') {
        console.log(`[USER ${modalType.toUpperCase()}] Translating user data from ${currentLang} to English`);
        const textFields = ['firstName', 'lastName', 'suburb'];
        for (const field of textFields) {
          if (userToSave[field]) {
            try {
              userToSave[field] = await translateText(userToSave[field], 'en', currentLang);
              console.log(`[USER ${modalType.toUpperCase()}] Translated ${field}: ${currentUser[field]} -> ${userToSave[field]}`);
            } catch (translationError) {
              console.error(`[USER ${modalType.toUpperCase()}] Translation error for ${field}:`, translationError);
              throw new Error('Translation failed');
            }
          }
        }
      }

      userToSave = {
        ...userToSave,
        type: '4',
        churchId: userType === '2' || userType === '3' ? churchIdFromStorage : userToSave.churchId || null
      };

      if (!userToSave.churchId) {
        delete userToSave.churchId;
      }

      if (modalType === 'Save' && !userToSave.password) {
        userToSave.password = Math.random().toString(36).slice(-8);
      }

      if (modalType === 'Save') {
        const response = await axios.post(`${apiBaseUrl}/user/add`, userToSave);
        if (response.data) {
          await fetchUsers();
          toast.success(t(`user.messages.user_${modalType.toLowerCase()}_successfully`));
        }
      } else {
        if (userToSave.password === undefined) {
          delete userToSave.password;
        }
        const response = await axios.patch(`${apiBaseUrl}/user/edit/${currentUser._id}`, userToSave);
        if (response.data) {
          await fetchUsers();
          toast.success(t(`user.messages.user_${modalType.toLowerCase()}_successfully`));
        }
      }

      setValidationErrors({});
      setError(null);
      setCurrentUser({});
      setShowModal(false);
      setPage(1); // Reset to first page after adding/updating
    } catch (err) {
      console.error('[USER FORM SUBMIT] Error details:', err);
      const apiError = err.response?.data?.message || err.response?.data?.error || err.message;
      if (err.message === 'Translation failed') {
        setError(t('user.errors.translation_failed'));
        toast.error(t('user.errors.translation_failed'));
      } else {
        setError(apiError);
        toast.error(t(`user.errors.${(apiError || `Error during ${modalType.toLowerCase()} operation`).replace(/\s+/g, '_').toLowerCase()}`, apiError || `Error during ${modalType.toLowerCase()} operation`));
      }
    }
  };
  // Add filtering function
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) {
      return users;
    }

    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase().trim();
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;

      return firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower) ||
        email.includes(searchLower);
    });
  };

  const getPaginatedUsers = () => {
    const filteredUsers = getFilteredUsers();
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return filteredUsers.slice(startIndex, endIndex).map((user, index) => ({
      ...user,
      serialNumber: startIndex + index + 1
    }));
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredUsers().length / ITEMS_PER_PAGE);

  const userType = localStorage.getItem('userType');

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
                placeholder={t('user.search_placeholder') || 'Search by name or email...'}
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
                className="bg-b"
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
                {t('user.buttons.add_new_user')}
              </Button>
            </Box>

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
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell', flexWrap: 'nowrap', whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {t('user.table.serial_number')}
                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('user.table.first_name')}</th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('user.table.last_name')}</th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                      {t('user.table.email')}
                    </th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                      {t('user.table.phone')}
                    </th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell' }}>
                      {t('user.table.suburb')}
                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('user.table.church_name')}</th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>{t('user.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
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
                            {t('user.messages.loading_users')}
                          </Typography>
                        </Box>
                      </td>
                    </tr>
                  ) : getFilteredUsers().length > 0 ? (
                    getPaginatedUsers().map((user) => (
                      <tr key={user._id} style={{ backgroundColor: user.serialNumber % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                          {user.serialNumber}
                        </td>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{user.firstName}</td>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>{user.lastName}</td>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                          {user.phone}
                        </td>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell' }}>
                          {user.suburb}
                        </td>
                        <td style={{ padding: theme.spacing(isMobile ? 1 : 2) }}>
                          {user.churchId?._id
                            ? churches.find(church => church._id === user.churchId._id)?.name || 'N/A'
                            : 'N/A'}
                        </td>
                        <td>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: { xs: '80px', sm: 'auto' } }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              className="bg-b"
                              onClick={() => handleEdit(user)}
                              sx={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                minWidth: '60px',
                                marginBottom: '3px',
                                '&.MuiButton-root': {
                                  minHeight: '24px'
                                }
                              }}
                            >
                              {t('user.buttons.edit')}
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              className="bg-b"
                              onClick={() => handleDelete(user._id)}
                              sx={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                minWidth: '60px',
                                marginLeft: '2px',
                                marginBottom: '3px',
                                '&.MuiButton-root': {
                                  minHeight: '24px'
                                }
                              }}
                            >
                              {t('user.buttons.delete')}
                            </Button>
                          </Stack>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
                        {searchTerm.trim()
                          ? t('user.messages.no_search_results').replace('{searchTerm}', searchTerm)
                          : t('user.messages.no_users_available')
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination - only show if more than ITEMS_PER_PAGE records */}
              {getFilteredUsers().length > ITEMS_PER_PAGE && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={handlePageChange}
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
        <DialogTitle>{t(`user.modal.${modalType.toLowerCase()}_user`)}</DialogTitle>        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <TextField
              label={t('user.fields.first_name')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#231f20' },
                  '&:hover fieldset': { borderColor: '#231f20' },
                  '&.Mui-focused fieldset': { borderColor: '#231f20' }
                },
                '& .MuiInputLabel-root': { color: '#231f20' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
              }}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
            />
            <TextField
              label={t('user.fields.last_name')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#231f20' },
                  '&:hover fieldset': { borderColor: '#231f20' },
                  '&.Mui-focused fieldset': { borderColor: '#231f20' }
                },
                '& .MuiInputLabel-root': { color: '#231f20' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
              }}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
            />
            <TextField
              label={t('user.fields.email')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={modalType === 'Update'}
              inputProps={{ maxLength: 45 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#231f20' },
                  '&:hover fieldset': { borderColor: '#231f20' },
                  '&.Mui-focused fieldset': { borderColor: '#231f20' }
                },
                '& .MuiInputLabel-root': { color: '#231f20' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
              }}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />
            {error && <Typography color="error">{error}</Typography>}
            {modalType === 'Save' && (
              <TextField
                label={t('user.fields.password')}
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                margin="normal"
                value={currentUser.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#231f20' }}
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#231f20' },
                    '&:hover fieldset': { borderColor: '#231f20' },
                    '&.Mui-focused fieldset': { borderColor: '#231f20' }
                  },
                  '& .MuiInputLabel-root': { color: '#231f20' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
                }}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
              />
            )}
            <TextField
              label={t('user.fields.phone')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.phone || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only digits
                if (/^\+?\d*$/.test(value)) {
                  handleInputChange('phone', value);
                }
              }}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#231f20' },
                  '&:hover fieldset': { borderColor: '#231f20' },
                  '&.Mui-focused fieldset': { borderColor: '#231f20' }
                },
                '& .MuiInputLabel-root': { color: '#231f20' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
              }}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone}
            />

            <TextField
              label={t('user.fields.suburb')}
              variant="outlined"
              fullWidth
              margin="normal"
              value={currentUser.suburb || ''}
              onChange={(e) => handleInputChange('suburb', e.target.value)}
              error={!!validationErrors.suburb}
              helperText={validationErrors.suburb}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#231f20' },
                  '&:hover fieldset': { borderColor: '#231f20' },
                  '&.Mui-focused fieldset': { borderColor: '#231f20' }
                },
                '& .MuiInputLabel-root': { color: '#231f20' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
              }}
            />
            {userType !== '2' && userType !== '3' && (
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
                <InputLabel id="formChurchId-label">{t('user.fields.church_name')}</InputLabel>
                <Select
                  labelId="formChurchId-label"
                  label={t('user.fields.church_name')}
                  value={currentUser.churchId || ''}
                  onChange={(e) => handleInputChange('churchId', e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('user.options.select_church')}</em>
                  </MenuItem>
                  {churches.map((church) => (
                    <MenuItem key={church._id} value={church._id}>
                      {church.name}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.churchId && (
                  <Typography color="error" sx={{ fontSize: '0.75rem', marginLeft: '14px' }}>
                    {t(`user.errors.${validationErrors.churchId.replace(/\s+/g, '_').toLowerCase()}`, validationErrors.churchId)}
                  </Typography>
                )}
              </FormControl>
            )}
            <DialogActions>
              <Button onClick={() => setShowModal(false)} variant="outlined" color="secondary">
                {t('user.buttons.cancel')}
              </Button>
              <Button type="submit" variant="contained" className="bg-b" color="primary">
                {t(`user.buttons.${modalType.toLowerCase()}`)}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default User;