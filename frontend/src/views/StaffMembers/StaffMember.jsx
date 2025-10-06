import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  Grid,
  Card,
  Table,
  Button,
  Paper,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Stack,
  CircularProgress,
  TableContainer,
  Pagination,
  TextField,
  InputAdornment
} from '@mui/material';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import './style.css';
import StaffMemberModal from './StaffMemberModal';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const StaffMember = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isLoading, setIsLoading] = useState(true);
  const ITEMS_PER_PAGE = 10;


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
      const userType = 3;
      const rawChurchId = localStorage.getItem("churchId");
      console.log("churchId to get:", rawChurchId);

      const isValidChurchId =
        rawChurchId !== null &&
        rawChurchId !== undefined &&
        rawChurchId !== "undefined" &&
        rawChurchId.trim() !== "";

      const apiUrl = isValidChurchId
        ? `${apiBaseUrl}/user/${userType}?churchId=${rawChurchId}`
        : `${apiBaseUrl}/user/${userType}`;

      const response = await axios.get(apiUrl);

      const filteredUsers = response.data;

      const sortedUsers = filteredUsers.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setUsers(sortedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error(err.message || t("staffmember.errors.fetch_users"));
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
    if (window.confirm(t('staffmember.messages.delete_confirm'))) {
      try {
        await axios.delete(`${apiBaseUrl}/user/delete/${id}`);
        await fetchUsers();
        toast.success(t('staffmember.messages.delete_success'));
      } catch (err) {
        toast.error(err.message || t('staffmember.errors.delete_error'));
      }
    }
  };

  const handleAdd = () => {
    setModalType('Save');
    const userType = localStorage.getItem('userType');
    const churchIdFromStorage = localStorage.getItem('churchId');

    setCurrentUser({
      type: '3',
      churchId: userType === '2' ? churchIdFromStorage : ''
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
      errors.firstName = t('staffmember.errors.first_name_required');
    }

    if (!currentUser.email) {
      errors.email = t('staffmember.errors.email_required');
    } else if (!/@/.test(currentUser.email)) {
      errors.email = t('staffmember.errors.email_invalid');
    }

    if (modalType === 'Save') {
      if (!currentUser.password) {
        errors.password = t('staffmember.errors.password_required');
      } else if (currentUser.password.length < 6) {
        errors.password = t('staffmember.errors.password_min_length');
      }
    }

    if (!currentUser.suburb) {
      errors.suburb = t('staffmember.errors.suburb_required');
    } else if (specialCharRegex.test(currentUser.suburb) || whitespaceRegex.test(currentUser.suburb)) {
      errors.suburb = t('staffmember.errors.suburb_invalid');
    }

    const userType = localStorage.getItem('userType');
    if (userType === '1' && !currentUser.churchId) {
      errors.churchId = t('staffmember.errors.church_name_required');
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
      const userType = localStorage.getItem('userType');
      const churchIdFromStorage = localStorage.getItem('churchId');

      let userToSave = {
        ...currentUser,
        type: '3'
      };

      if (userType === '2') {
        userToSave.churchId = churchIdFromStorage;
      } else if (userType === '1') {
        userToSave.churchId = currentUser.churchId;
      }

      // Translate text fields to English if the current language is not English
      const currentLang = i18n.language;
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
        if (!userToSave.password) {
          userToSave.password = Math.random().toString(36).slice(-8);
        }

        const response = await axios.post(`${apiBaseUrl}/user/add`, userToSave);
        if (response.data) {
          await fetchUsers();
          toast.success(t(`staffmember.messages.${modalType.toLowerCase()}_success`));
        }
      } else {
        if (!userToSave.password) {
          delete userToSave.password;
        }
        const response = await axios.patch(`${apiBaseUrl}/user/edit/${currentUser._id}`, userToSave);
        if (response.data) {
          await fetchUsers(); // Refetch to maintain sorting after update
          toast.success(t(`staffmember.messages.${modalType.toLowerCase()}_success`));
        }
      }

      setValidationErrors({});
      setError(null);
      setCurrentUser({});
      setShowModal(false);
      setPage(1);
    } catch (err) {
      const apiError = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(apiError);
      toast.error(apiError || t('staffmember.errors.form_submit', { operation: modalType.toLowerCase() }));
      console.error('Error details:', err);
    }
  };


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
                placeholder={t('staffmember.search_placeholder') || 'Search by name or email...'}
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
                {t('staffmember.buttons.add')}
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
                      padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell', whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {t('staffmember.table_headers.serial_number')}
                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}> {t('staffmember.table_headers.first_name')}</th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}> {t('staffmember.table_headers.last_name')}</th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                      {t('staffmember.table_headers.email')}
                    </th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isMobile ? 'none' : 'table-cell' }}>
                      {t('staffmember.table_headers.phone')}                    </th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell' }}>
                      {t('staffmember.table_headers.suburb')}                    </th>
                    <th style={{
                      padding: theme.spacing(isMobile ? 1 : 2), whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>{t('staffmember.table_headers.church_name')}</th>
                    <th style={{ padding: theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>{t('staffmember.table_headers.actions')}</th>                  </tr>
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
                            Loading staff members...
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
                                backgroundColor: '#231f20',
                                '&:hover': { backgroundColor: '#3d3a3b' },
                                '&.MuiButton-root': { minHeight: '24px' }
                              }}
                            >
                              {t('staffmember.buttons.edit')}
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
                                backgroundColor: '#d32f2f',
                                '&:hover': { backgroundColor: '#b71c1c' },
                                '&.MuiButton-root': { minHeight: '24px' }
                              }}
                            >
                              {t('staffmember.buttons.delete')}
                            </Button>
                          </Stack>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: theme.spacing(2) }}>
                        {searchTerm.trim()
                          ? t('staffmember.messages.no_search_results').replace('{searchTerm}', searchTerm)
                          : t('staffmember.messages.no_staff')
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

      <StaffMemberModal
        open={showModal}
        onClose={() => setShowModal(false)}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        modalType={modalType}
        validationErrors={validationErrors}
        handleFormSubmit={handleFormSubmit}
        churches={churches}
        userType={userType}
        error={error}
      />
    </React.Fragment>
  );
};

export default StaffMember;