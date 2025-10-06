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
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import './style.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Administrator = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const ITEMS_PER_PAGE = 10; // Added constant for items per page

  // Add pagination state
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

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
  }, []);


  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/user/fetchAll`);
      const filteredUsers = response.data.filter((user) => user.type === '2');

      filteredUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUsers(filteredUsers); // Set users without translation
    } catch (err) {
      toast.error(err.message || t('administrator.errors.fetch_users'));
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
    if (window.confirm(t('administrator.messages.delete_confirm'))) {
      try {
        await axios.delete(`${apiBaseUrl}/user/delete/${id}`);
        await fetchUsers();
        toast.success(t('administrator.messages.delete_success'));
      } catch (err) {
        toast.error(err.message || t('administrator.errors.delete_error'));
      }
    }
  };

  const handleAdd = () => {
    setModalType('Save');
    setCurrentUser({
      type: '2'
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
    const specialCharRegex = /[^a-zA-Z0-9\s]/;
    const whitespaceRegex = /^\s*$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!currentUser.firstName?.trim()) {
      errors.firstName = t('administrator.errors.first_name_required');
    } else if (currentUser.firstName.trim().length < 3) {
      errors.firstName = t('administrator.errors.first_name_min_length');
    } else if (specialCharRegex.test(currentUser.firstName)) {
      errors.firstName = t('administrator.errors.first_name_letters_only');
    }

    if (currentUser.lastName?.trim()) {
      if (currentUser.lastName.trim().length < 3) {
        errors.lastName = t('administrator.errors.last_name_min_length');
      } else if (specialCharRegex.test(currentUser.lastName)) {
        errors.lastName = t('administrator.errors.last_name_letters_only');
      }
    }

    if (!currentUser.email) {
      errors.email = t('administrator.errors.email_required');
    } else if (!emailRegex.test(currentUser.email)) {
      errors.email = t('administrator.errors.email_invalid');
    }

    if (modalType === 'Save') {
      if (!currentUser.password) {
        errors.password = t('administrator.errors.password_required');
      } else if (currentUser.password.length < 6) {
        errors.password = t('administrator.errors.password_min_length');
      }
    }

    // if (!currentUser.phone) {
    //   errors.phone = t('administrator.errors.phone_required');
    // } else if (!/^\d{10}$/.test(currentUser.phone)) {
    //   errors.phone = t('administrator.errors.phone_invalid');
    // }

    if (!currentUser.suburb) {
      errors.suburb = t('administrator.errors.suburb_required');
    } else if (specialCharRegex.test(currentUser.suburb) || whitespaceRegex.test(currentUser.suburb)) {
      errors.suburb = t('administrator.errors.suburb_invalid');
    }

    if (!currentUser.churchId) {
      errors.churchId = t('administrator.errors.church_name_required');
    }

    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const currentLang = i18n.language;
      let userToSave = { ...currentUser, type: '2' };

      if (currentLang !== 'en') {
        console.log(`[SUBMIT] Translating user data from ${currentLang} to English`);
        const fieldsToTranslate = ['firstName', 'lastName', 'suburb'];
        for (const field of fieldsToTranslate) {
          if (userToSave[field]) {
            console.log(`[SUBMIT] Translating ${field}: ${userToSave[field]}`);
            userToSave[field] = await translateText(userToSave[field], 'en', currentLang);
            console.log(`[SUBMIT] Translated ${field}: ${userToSave[field]}`);
          }
        }
      }

      if (modalType === 'Save') {
        await axios.post(`${apiBaseUrl}/user/add`, userToSave);
        setTimeout(async () => {
          await fetchUsers();
          setPage(1);
        }, 300);
        toast.success(t('administrator.messages.save_success'));
      } else {
        await axios.patch(`${apiBaseUrl}/user/edit/${currentUser._id}`, userToSave);
        setTimeout(async () => {
          await fetchUsers();
        }, 300);
        toast.success(t('administrator.messages.update_success'));
      }

      setValidationErrors({});
      setCurrentUser({});
      setShowModal(false);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(err.response?.data?.error || t('administrator.errors.form_submit', { operation: modalType.toLowerCase() }));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentUser((prevState) => ({
      ...prevState,
      [field]: value
    }));
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

  // Add pagination function
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
                placeholder={t('administrator.search_placeholder') || 'Search by name or email...'}
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
                {t('administrator.buttons.add')}
              </Button>
            </Box>


            <TableContainer
              component={Paper}
              sx={{
                overflowX: 'auto',
                p: { xs: 1, sm: 2 }
              }}
            >
              <Table sx={{ minWidth: { xs: '100%', sm: 650 } }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: theme.spacing(isMobile ? 1 : 2),
                        display: isMobile ? 'none' : 'table-cell',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t('administrator.table_headers.serial_number')}
                    </th>

                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('administrator.fields.first_name')}</th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('administrator.fields.last_name')}</th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                      {t('administrator.fields.email')}
                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell', whiteSpace: 'nowrap',         // Prevent line break
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {t('administrator.fields.phone')}                    </th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell' }}>
                      {t('administrator.fields.suburb')}                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('administrator.fields.church_name')}</th>
                    <th
                      style={{
                        padding: theme.spacing(isMobile ? 1 : 2),
                        textAlign: 'center'
                      }}
                    >
                      {t('administrator.table_headers.actions')}
                    </th>

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
                              '& .MuiCircularProgress-svg': { color: '#231f20' }
                            }}
                          />
                          <Typography variant="body1" color="#231f20">
                            {t('administrator.messages.loading')}                          </Typography>
                        </Box>
                      </td>
                    </tr>
                  ) : getFilteredUsers().length > 0 ? (
                    getPaginatedUsers().map((user) => (
                      <tr
                        key={user._id}
                        style={{
                          backgroundColor: user.serialNumber % 2 === 0 ? '#f9f9f9' : '#ffffff'
                        }}
                      >
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
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                            sx={{ minWidth: { xs: '100px', sm: 'auto' } }}
                          >
                            <Button
                              variant="contained"
                              color="success"
                              size={isMobile ? 'small' : 'medium'}
                              className="bg-b"
                              onClick={() => handleEdit(user)}
                              fullWidth={isMobile}
                              sx={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                minWidth: '60px',
                                marginBottom: '3px'
                              }}
                            >
                              {t('administrator.buttons.edit')}
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size={isMobile ? 'small' : 'medium'}
                              className="bg-b"
                              onClick={() => handleDelete(user._id)}
                              fullWidth={isMobile}
                              sx={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                minWidth: '60px',
                                marginBottom: '3px'
                              }}
                            >
                              {t('administrator.buttons.delete')}                            </Button>
                          </Stack>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
                        {searchTerm.trim()
                          ? t('administrator.messages.no_search_results').replace('{searchTerm}', searchTerm)
                          : t('administrator.messages.no_administrators')
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

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{modalType === 'Save' ? t('administrator.modal.title_save') : t('administrator.modal.title_update')}</DialogTitle>        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  label={t('administrator.fields.first_name')}
                  variant="outlined"
                  fullWidth
                  value={currentUser.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  error={!!validationErrors.firstName}
                  helperText={validationErrors.firstName}
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
              </Grid>
              {/* Rest of the form fields remain unchanged */}
              <Grid item xs={12}>
                <TextField
                  label={t('administrator.fields.last_name')}
                  variant="outlined"
                  fullWidth
                  value={currentUser.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  error={!!validationErrors.lastName}
                  helperText={validationErrors.lastName}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('administrator.fields.email')}
                  variant="outlined"
                  fullWidth
                  value={currentUser.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
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
                />
              </Grid>
              <Grid item xs={12}>
                {modalType === 'Save' && (
                  <TextField
                    label={t('administrator.fields.password')} type={showPassword ? 'text' : 'password'}
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
                          {showPassword ? <VisibilityOff /> : <Visibility />}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('administrator.fields.phone')}
                  variant="outlined"
                  fullWidth
                  type="tel"
                  value={currentUser.phone || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\+?\d*$/.test(value)) {
                      handleInputChange('phone', value);
                    }
                  }}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
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
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label={t('administrator.fields.address')}
                  variant="outlined"
                  fullWidth
                  value={currentUser.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  error={!!validationErrors.address}
                  helperText={validationErrors.address}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('administrator.fields.suburb')}
                  variant="outlined"
                  fullWidth
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
              </Grid>
              <Grid item xs={12}>
                <FormControl
                  fullWidth
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
                  <InputLabel>{t('administrator.fields.church_name')}</InputLabel>                  <Select
                    value={currentUser.churchId || ''}
                    onChange={(e) => handleInputChange('churchId', e.target.value)}
                    label={t('administrator.fields.church_name')}                  >
                    <MenuItem value="">
                      <em>{t('administrator.options.select_church')}</em>                    </MenuItem>
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
              </Grid>
            </Grid>
            <DialogActions sx={{ mt: 3, px: 0 }}>
              <Button onClick={() => setShowModal(false)} variant="outlined" color="secondary" fullWidth={isMobile}>
                {t('administrator.buttons.cancel')}              </Button>
              <Button type="submit" variant="contained" className="bg-b" color="primary" fullWidth={isMobile}>
                {t(`administrator.buttons.${modalType.toLowerCase()}`)}              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default Administrator;