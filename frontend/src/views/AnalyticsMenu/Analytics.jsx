import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Collapse,
  Stack,
  CircularProgress,
  Pagination,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Analytics = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State for sermon details
  const [sermonDetailsData, setSermonDetailsData] = useState([]);
  const [expandedSermons, setExpandedSermons] = useState({});
  const [sermonDetailsPage, setSermonDetailsPage] = useState(1);
  const [salvationData, setSalvationData] = useState([]);
  const [salvationPage, setSalvationPage] = useState(1);

  const [liveSermonData, setLiveSermonData] = useState([]);
  const [liveSermonPage, setLiveSermonPage] = useState(1);
  const [expandedLiveSermons, setExpandedLiveSermons] = useState({});

  // State for new users details
  const [newUsersData, setNewUsersData] = useState([]);
  const [newUsersPage, setNewUsersPage] = useState(1);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState(''); // 'sermons' or 'users'

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (location.state?.sermonDetails) {
      console.log('Received sermon details from dashboard:', location.state.sermonDetails);
      setSermonDetailsData(location.state.sermonDetails);
      setCurrentView('sermons');
    }

    if (location.state?.newUsersDetails) {
      console.log('Received new users details from dashboard:', location.state.newUsersDetails);
      setNewUsersData(location.state.newUsersDetails);
      setCurrentView('users');
    }
    if (location.state?.salvationDetails) {
      console.log('Received salvation details from dashboard:', location.state.salvationDetails);
      setSalvationData(location.state.salvationDetails);
      setCurrentView('salvations');
    }
    if (location.state?.liveSermonDetails) {
      console.log('Received live sermon details from dashboard:', location.state.liveSermonDetails);
      setLiveSermonData(location.state.liveSermonDetails);
      setCurrentView('liveSermons');
    }
    if (location.state?.error) {
      console.error('Error from dashboard:', location.state.error);
    }
  }, [location.state]);

  // Helper functions for sermons
  const toggleSermonExpand = (sermonId) => {
    setExpandedSermons(prev => ({
      ...prev,
      [sermonId]: !prev[sermonId]
    }));
  };

  const getPaginatedSermons = () => {
    const startIndex = (sermonDetailsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sermonDetailsData.slice(startIndex, endIndex).map((sermon, index) => ({
      ...sermon,
      serialNumber: startIndex + index + 1
    }));
  };

  const handleSermonPageChange = (event, value) => {
    setSermonDetailsPage(value);
  };

  // Helper functions for users
  const getPaginatedUsers = () => {
    const startIndex = (newUsersPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return newUsersData.slice(startIndex, endIndex).map((user, index) => ({
      ...user,
      serialNumber: startIndex + index + 1
    }));
  };

  const handleUsersPageChange = (event, value) => {
    setNewUsersPage(value);
  };

  // Helper functions for salvations
  const getPaginatedSalvations = () => {
    const startIndex = (salvationPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return salvationData.slice(startIndex, endIndex).map((salvation, index) => ({
      ...salvation,
      serialNumber: startIndex + index + 1
    }));
  };

  const handleSalvationPageChange = (event, value) => {
    setSalvationPage(value);
  };

  const handleStopStream = async (sermonId, broadcastId) => {
    const confirmStop = window.confirm("Are you sure you want to end this live sermon?");

    if (confirmStop) {
      try {
        setIsLoading(true);

        const response = await axios.post('https://churchtranslator.com/speech/stop_stream', {
          broadcast_id: broadcastId,
          status: "stopped"
        });

        if (response.status === 200) {
          toast.success("Live sermon ended successfully");
          setLiveSermonData(prevLive =>
            prevLive.filter(sermon => sermon.sermonId !== sermonId)
          );

          setTimeout(async () => {
            setIsLoading(false);
          }, 5000);
        }
      } catch (error) {
        console.error("Error stopping stream:", error);
        toast.error(error.response?.data?.message || "Failed to end live sermon");
        setIsLoading(false);
      }
    }
  };

  // Helper functions for live sermons
  const getPaginatedLiveSermons = () => {
    const startIndex = (liveSermonPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return liveSermonData.slice(startIndex, endIndex).map((sermon, index) => ({
      ...sermon,
      serialNumber: startIndex + index + 1
    }));
  };

  const handleLiveSermonPageChange = (event, value) => {
    setLiveSermonPage(value);
  };

  const toggleLiveSermonExpand = (sermonId) => {
    setExpandedLiveSermons(prev => ({
      ...prev,
      [sermonId]: !prev[sermonId]
    }));
  };

  // Utility functions
  const formatDateTime = (dateString) => {
    if (!dateString) return t('analytics.not_available');
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // Render sermon details table
  const renderSermonDetailsTable = () => {
    const sermonTotalPages = Math.ceil(sermonDetailsData.length / ITEMS_PER_PAGE);

    return (
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 'bold' }}>
          {t('analytics.sermon_details')}
        </Typography>
        <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
            <Table sx={{ minWidth: { xs: '100%', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '5%', whiteSpace: 'nowrap', fontWeight: 'bold', textAlign: "center" }}>
                    {t('analytics.table.sr_no')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', display: isTablet ? 'none' : 'table-cell', fontWeight: 'bold' }}>
                    {t('analytics.table.church_name')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', fontWeight: 'bold' }}>
                    {t('analytics.table.admin_name')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', display: isTablet ? 'none' : 'table-cell', fontWeight: 'bold' }}>
                    {t('analytics.table.start_time')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '15%', fontWeight: 'bold', textAlign: "center" }}>
                    {t('analytics.table.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: '#231f20' }} />
                        <Typography variant="body1" color="#231f20">{t('analytics.loading')}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : sermonDetailsData.length > 0 ? (
                  getPaginatedSermons().map((sermon) => (
                    <React.Fragment key={sermon.sermonId}>
                      <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>
                          {sermon.serialNumber}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                          {sermon.churchName}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'left' }}>
                          {sermon.adminName}
                        </TableCell>
                        <TableCell sx={{ padding: (theme) => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                          {formatDateTime(sermon.SermonStartDateTime)}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>
                          <Stack direction="row" spacing={0} justifyContent="center" alignItems="center">
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => toggleSermonExpand(sermon.sermonId)}
                              sx={{
                                padding: '4px 6px',
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                minWidth: '85px',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#231f20',
                                '&:hover': { backgroundColor: '#000' }
                              }}
                            >
                              {t('analytics.buttons.view_details')}
                            </Button>
                            <IconButton
                              aria-label="expand row"
                              size="small"
                              onClick={() => toggleSermonExpand(sermon.sermonId)}
                            >
                              {expandedSermons[sermon.sermonId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ padding: 0, border: 'none' }}>
                          <Collapse in={expandedSermons[sermon.sermonId]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1, backgroundColor: '#f5f5f5', borderRadius: 1, p: 2 }}>
                              <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1rem' }}>
                                {t('analytics.members.listeners')} ({sermon.listeners ? sermon.listeners.length : 0})
                              </Typography>
                              <Table size="small" aria-label="listeners">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center', fontWeight: 'bold' }}>
                                      {t('analytics.table.sr_no')}
                                    </TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>
                                      {t('analytics.table.user_name')}
                                    </TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>
                                      {t('analytics.table.email')}
                                    </TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>
                                      {t('analytics.table.phone')}
                                    </TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>
                                      {t('analytics.table.start_time')}
                                    </TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>
                                      {t('analytics.table.end_time')}
                                    </TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center', fontWeight: 'bold' }}>
                                      {t('analytics.table.duration')}
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sermon.listeners && sermon.listeners.length > 0 ? (
                                    sermon.listeners.map((listener, index) => (
                                      <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center' }}>
                                          {index + 1}
                                        </TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>
                                          {listener.userName}
                                        </TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>
                                          {listener.userEmail}
                                        </TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>
                                          {listener.userPhone || 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>
                                          {formatDateTime(listener.startDateTime)}
                                        </TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>
                                          {listener.endDateTime ? formatDateTime(listener.endDateTime) : 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center' }}>
                                          {listener.endDateTime ? calculateDuration(listener.startDateTime, listener.endDateTime) : 'N/A'}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={7} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                                        {t('analytics.messages.no_listeners')}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                      {t('analytics.messages.no_sermon_details')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {sermonDetailsData.length > ITEMS_PER_PAGE && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                <Pagination
                  count={sermonTotalPages}
                  page={sermonDetailsPage}
                  onChange={handleSermonPageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': { color: '#231f20' },
                    '& .Mui-selected': { backgroundColor: '#231f20 !important', color: 'white !important' }
                  }}
                />
              </Box>
            )}
          </TableContainer>
        </Card>
      </Grid>
    );
  };

  const renderSalvationTable = () => {
    const salvationTotalPages = Math.ceil(salvationData.length / ITEMS_PER_PAGE);

    return (
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 'bold' }}>
          {t('analytics.new_salvations_details')}
        </Typography>
        <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
            <Table sx={{ minWidth: { xs: '100%', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: "center" }}>{t('analytics.table.sr_no')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('analytics.table.user_name')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: isTablet ? 'none' : 'table-cell' }}>{t('analytics.table.email')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: isTablet ? 'none' : 'table-cell' }}>{t('analytics.table.phone')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('analytics.table.church')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('analytics.table.faith_level')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>{t('analytics.table.click_count')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: isTablet ? 'none' : 'table-cell' }}>{t('analytics.table.salvation_date')}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {salvationData.length > 0 ? (
                  getPaginatedSalvations().map((salvation) => (
                    <TableRow key={salvation.salvationId} sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell sx={{ textAlign: 'center' }}>{salvation.serialNumber}</TableCell>
                      <TableCell sx={{ fontWeight: '600', color: '#2c3e50' }}>{salvation.userName}</TableCell>
                      <TableCell sx={{ display: isTablet ? 'none' : 'table-cell', color: '#6c757d' }}>{salvation.userEmail}</TableCell>
                      <TableCell sx={{ display: isTablet ? 'none' : 'table-cell', color: '#6c757d' }}>{salvation.userPhone}</TableCell>
                      <TableCell sx={{ color: '#495057' }}>{salvation.churchName}</TableCell>
                      <TableCell>
                        <span style={{
                          backgroundColor: '#f8f9fa',
                          color: '#495057',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: '1px solid #dee2e6'
                        }}>
                          {salvation.userFaithLevel}
                        </span>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: '#231f20',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          minWidth: '24px',
                          display: 'inline-block'
                        }}>
                          {salvation.clickCount}
                        </span>
                      </TableCell>
                      <TableCell sx={{ display: isTablet ? 'none' : 'table-cell', color: '#6c757d', fontSize: '13px' }}>
                        {salvation.salvationDate}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', padding: 2, color: '#6c757d' }}>
                      {t('analytics.messages.no_salvations')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {salvationData.length > ITEMS_PER_PAGE && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                <Pagination
                  count={salvationTotalPages}
                  page={salvationPage}
                  onChange={handleSalvationPageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': { color: '#231f20' },
                    '& .Mui-selected': { backgroundColor: '#231f20 !important', color: 'white !important' }
                  }}
                />
              </Box>
            )}
          </TableContainer>
        </Card>
      </Grid>
    );
  };

  // Render new users table
  const renderNewUsersTable = () => {
    const usersTotalPages = Math.ceil(newUsersData.length / ITEMS_PER_PAGE);

    return (
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 'bold' }}>
          {t('analytics.new_users_details')}
        </Typography>
        <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
            <Table sx={{ minWidth: { xs: '100%', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold', textAlign: "center" }}>
                    {t('analytics.table.sr_no')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold' }}>
                    {t('analytics.table.full_name')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold', display: isTablet ? 'none' : 'table-cell' }}>
                    {t('analytics.table.email')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold', display: isTablet ? 'none' : 'table-cell' }}>
                    {t('analytics.table.phone')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold' }}>
                    {t('analytics.table.church')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold' }}>
                    {t('analytics.table.faith_level')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), fontWeight: 'bold', display: isTablet ? 'none' : 'table-cell' }}>
                    {t('analytics.table.registration_date')}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: '#231f20' }} />
                        <Typography variant="body1" color="#231f20">{t('analytics.loading')}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : newUsersData.length > 0 ? (
                  getPaginatedUsers().map((user) => (
                    <TableRow key={user.userId} sx={{ backgroundColor: '#f9f9f9' }}>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>
                        {user.serialNumber}
                      </TableCell>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'left' }}>
                        {user.fullName}
                      </TableCell>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                        {user.email}
                      </TableCell>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                        {user.phone}
                      </TableCell>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'left' }}>
                        {user.churchName}
                      </TableCell>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'left' }}>
                        {user.faithLevel}
                      </TableCell>
                      <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                        {user.registrationDate}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                      {t('analytics.messages.no_users')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {newUsersData.length > ITEMS_PER_PAGE && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                <Pagination
                  count={usersTotalPages}
                  page={newUsersPage}
                  onChange={handleUsersPageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': { color: '#231f20' },
                    '& .Mui-selected': { backgroundColor: '#231f20 !important', color: 'white !important' }
                  }}
                />
              </Box>
            )}
          </TableContainer>
        </Card>
      </Grid>
    );
  };


  const renderLiveSermonTable = () => {
    const liveTotalPages = Math.ceil(liveSermonData.length / ITEMS_PER_PAGE);

    return (
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          {t('analytics.live_sermons_details')}
        </Typography>
        <Card sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
            <Table sx={{ minWidth: { xs: '100%', sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '5%', whiteSpace: 'nowrap', textAlign: 'center', fontWeight: 'bold' }}>
                    {t('analytics.table.sr_no')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', display: isTablet ? 'none' : 'table-cell', textAlign: 'left', fontWeight: 'bold' }}>
                    {t('analytics.table.church_name')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', display: isTablet ? 'none' : 'table-cell', textAlign: 'left', fontWeight: 'bold' }}>
                    {t('analytics.table.hosted_by')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', display: isTablet ? 'none' : 'table-cell', textAlign: 'left', fontWeight: 'bold' }}>
                    {t('analytics.table.start_datetime')}
                  </TableCell>
                  <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), width: '20%', textAlign: 'center', fontWeight: 'bold' }}>
                    {t('analytics.table.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={40} sx={{ color: '#231f20' }} />
                        <Typography variant="body1" color="#231f20">{t('analytics.loading')}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : liveSermonData.length > 0 ? (
                  getPaginatedLiveSermons().map((sermon) => (
                    <React.Fragment key={sermon.sermonId}>
                      <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>
                          {sermon.serialNumber}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                          {sermon.churchName}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                          {sermon.adminName}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), display: isTablet ? 'none' : 'table-cell', textAlign: 'left' }}>
                          {formatDateTime(sermon.SermonStartDateTime)}
                        </TableCell>
                        <TableCell sx={{ padding: theme => theme.spacing(isMobile ? 1 : 2), textAlign: 'center' }}>
                          <Stack direction="row" spacing={0} justifyContent="center">
                            <Button
                              onClick={() => toggleLiveSermonExpand(sermon.sermonId)}
                              variant="contained"
                              color="primary"
                              sx={{
                                padding: '5px 10px',
                                minHeight: '30px',
                                fontSize: '0.875rem',
                                textTransform: 'none',
                                width: 'auto',
                                backgroundColor: '#231f20',
                                '&:hover': { backgroundColor: '#000' }
                              }}
                            >
                              {t('analytics.buttons.view_details')}
                            </Button>
                            <IconButton
                              aria-label="expand row"
                              size="small"
                              onClick={() => toggleLiveSermonExpand(sermon.sermonId)}
                            >
                              {expandedLiveSermons[sermon.sermonId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ padding: 0, border: 'none' }}>
                          <Collapse in={expandedLiveSermons[sermon.sermonId]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1, backgroundColor: '#f5f5f5', borderRadius: 1, p: 2 }}>
                              {sermon.sermonStatus === "Live" && localStorage.getItem("userType") === "1" && (
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                  {console.log("Sermon object:", sermon)}
                                  <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleStopStream(sermon.sermonId, sermon.broadcast_id)}
                                    sx={{
                                      backgroundColor: '#d32f2f',
                                      '&:hover': { backgroundColor: '#b71c1c' },
                                      fontWeight: 'bold',
                                      borderRadius: '6px',
                                      px: 2,
                                      py: 0.5,
                                      fontSize: '0.75rem',
                                      minHeight: '32px',
                                      textTransform: 'none'
                                    }}
                                  >
                                    {t('analytics.buttons.end_sermon')}
                                  </Button>
                                </Box>
                              )}
                              <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1rem' }}>
                                {t('analytics.members.joined')} ({sermon.listeners ? sermon.listeners.length : 0}) |
                                {t('analytics.members.active')} ({sermon.activeListeners || 0}) |
                                {t('analytics.members.inactive')} ({sermon.inactiveListeners || 0})
                              </Typography>
                              <Table size="small" aria-label="all listeners">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center', fontWeight: 'bold' }}>{t('analytics.table.sr_no')}</TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>{t('analytics.table.user_name')}</TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>{t('analytics.table.email')}</TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left', fontWeight: 'bold' }}>{t('analytics.table.start_datetime')}</TableCell>
                                    <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center', fontWeight: 'bold' }}>{t('analytics.table.status')}</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sermon.listeners && sermon.listeners.length > 0 ? (
                                    sermon.listeners.map((listener, index) => (
                                      <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>{listener.userName}</TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>{listener.userEmail}</TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'left' }}>{formatDateTime(listener.startDateTime)}</TableCell>
                                        <TableCell sx={{ padding: theme => theme.spacing(1), textAlign: 'center' }}>
                                          <span style={{
                                            backgroundColor: listener.status === "Live" ? '#e8f5e9' : '#ffebee',
                                            color: listener.status === "Live" ? '#2e7d32' : '#c62828',
                                            fontWeight: 'bold',
                                            borderRadius: '20px',
                                            minWidth: '80px',
                                            padding: '4px 8px',
                                            fontSize: '12px'
                                          }}>
                                            {listener.status === "Live" ? t('analytics.status.active') : t('analytics.status.inactive')}

                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                                        {t('analytics.messages.no_listeners')}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', padding: theme => theme.spacing(2) }}>
                      {t('analytics.messages.no_live_sermons')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {liveSermonData.length > ITEMS_PER_PAGE && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1, pr: 2 }}>
                <Pagination
                  count={liveTotalPages}
                  page={liveSermonPage}
                  onChange={handleLiveSermonPageChange}
                  color="primary"
                  sx={{
                    '& .MuiPaginationItem-root': { color: '#231f20' },
                    '& .Mui-selected': { backgroundColor: '#231f20 !important', color: 'white !important' }
                  }}
                />
              </Box>
            )}
          </TableContainer>
        </Card>
      </Grid>
    );
  };

  return (
    <React.Fragment>
      <ToastContainer />
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        mb: 1,
        mt: 1,
        mr: 1
      }}>
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => navigate(-1)}
          startIcon={<KeyboardArrowUpIcon style={{ transform: 'rotate(-90deg)' }} />}
          sx={{
            borderColor: '#231f20',
            color: '#231f20',
            '&:hover': {
              borderColor: '#000',
              backgroundColor: 'rgba(35, 31, 32, 0.04)'
            },
            textTransform: 'none',
            fontWeight: 500,
            padding: '4px 10px'
          }}
        >
          {t('analytics.buttons.back')}
        </Button>
      </Box>
      <Grid container spacing={3}>
        {currentView === 'sermons' && renderSermonDetailsTable()}
        {currentView === 'users' && renderNewUsersTable()}
        {currentView === 'salvations' && renderSalvationTable()}
        {currentView === 'liveSermons' && renderLiveSermonTable()}

        {!currentView && (
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2, mt: 4, fontWeight: 'bold', textAlign: 'center' }}>
              {t('analytics.dashboard_title')}
            </Typography>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {t('analytics.dashboard_prompt')}
              </Typography>
            </Card>
          </Grid>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default Analytics;