import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Carousel } from 'react-bootstrap';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './DashDefault.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChurch, FaUser, FaUsers, FaUserCheck, FaChartLine, FaMoneyBillAlt, FaVideo, FaCalendarAlt, FaMoon, FaSun } from 'react-icons/fa';

import FaithChart from './charts/FaithChart.jsx';
import RegistrationsChart from './charts/RegistrationsChart.jsx';
import ChurchLocationsMap from './charts/ChurchLocationsMap.jsx';
import LanguageChart from './charts/LanguageChart.jsx';
import AppDiscoveryChart from './charts/AppDiscoveryChart.jsx';
import LanguagesByCountryChart from './charts/LanguagesByCountryChart.jsx';
import ActiveUsersByChurchChart from './charts/ActiveUsersByChurchChart.jsx';
import AverageSermonDurationChart from './charts/AverageSermonDurationChart.jsx';
import SermonLanguageChart from './charts/SermonLanguageChart.jsx';
import LiveSermons from './LiveSermons';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;


const ChartSkeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-title"></div>
    <div className="skeleton-subtitle"></div>
    <div className="skeleton-chart-area">
      <div className="skeleton-chart-element"></div>
    </div>
  </div>
);

const BarChartSkeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-title"></div>
    <div className="skeleton-subtitle"></div>
    <div className="skeleton-bars">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="skeleton-bar" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
      ))}
    </div>
  </div>
);

const TileSkeleton = () => (
  <Col className="mb-2">
    <Card
      className="dashboard-card h-100"
      style={{
        maxWidth: '220px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '10px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        minHeight: '50px'
      }}
    >
      <Card.Body className="d-flex flex-column justify-content-center text-center p-2">
        <div className="mb-1">
          <div className="skeleton-tile-title"></div>
        </div>
        <div>
          <div className="skeleton-tile-number"></div>
        </div>
      </Card.Body>
    </Card>
  </Col>
);

const RightTileSkeleton = () => (
  <div className="right-side-tile">
    <div className="tile-content">
      <div className="skeleton-tile-title"></div>
      <div className="skeleton-tile-subtitle"></div>
      <div className="skeleton-tile-number"></div>
    </div>
  </div>
);

const FilterSkeleton = ({ title, itemCount = 5 }) => (
  <div className="date-filter-container mb-2">
    <div className="date-filter-header">
      <div className="skeleton-filter-title"></div>
      <span>▼</span>
    </div>
    <div className="date-filter-content p-3">
      {[...Array(itemCount)].map((_, i) => (
        <div key={i} className="form-check mb-1">
          <div className="skeleton-checkbox"></div>
          <div className="skeleton-filter-label"></div>
        </div>
      ))}
    </div>
  </div>
);

const DashDefault = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const iconColor = isDarkMode ? '#FFFFFF' : '#000000';
  const [dateFilter, setDateFilter] = useState('thisWeek');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(true);
  const [selectedChurches, setSelectedChurches] = useState(['select all']);
  const [showChurchFilter, setShowChurchFilter] = useState(true);
  const [isLoadingSermonDetails, setIsLoadingSermonDetails] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(false);
  const [isLoadingNewUsersDetails, setIsLoadingNewUsersDetails] = useState(false);
  const [faithLevelData, setFaithLevelData] = useState([]);
  const [isLoadingFaithData, setIsLoadingFaithData] = useState(false);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [isLoadingSalvationDetails, setIsLoadingSalvationDetails] = useState(false);
  const [languageData, setLanguageData] = useState([]);
  const [isLoadingLanguageData, setIsLoadingLanguageData] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [referralSourceData, setReferralSourceData] = useState([]);
  const [languagesByCountryData, setLanguagesByCountryData] = useState({});
  const [isLoadingLanguagesByCountry, setIsLoadingLanguagesByCountry] = useState(false);
  const [selectedCountryLanguage, setSelectedCountryLanguage] = useState('all');
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState(true);
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(true);
  const [activeUsersByChurchData, setActiveUsersByChurchData] = useState({});
  const [isLoadingActiveUsers, setIsLoadingActiveUsers] = useState(false);
  const [selectedActiveUsersChurch, setSelectedActiveUsersChurch] = useState('all');
  const [averageSermonDurationData, setAverageSermonDurationData] = useState({});
  const [isLoadingAverageSermonDuration, setIsLoadingAverageSermonDuration] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [adminStatsData, setAdminStatsData] = useState(null);
  const getColoredIcon = (IconComponent) => <IconComponent color="#000000" size={24} />;
  const [dashSalesData, setDashSalesData] = useState([
    { title: t('dashboard.totalChurches'), icon: getColoredIcon(FaChurch), count: 0 },
    { title: t('dashboard.totalAdmins'), icon: getColoredIcon(FaUser), count: 0 },
    { title: t('dashboard.totalStaff'), icon: getColoredIcon(FaUsers), count: 0 },
    { title: t('dashboard.totalUsers'), icon: getColoredIcon(FaUserCheck), count: 0 },
    { title: t('dashboard.totalEvents'), icon: getColoredIcon(FaCalendarAlt), count: 0 }
  ]);
  const [churches, setChurches] = useState([]);
  const [superadminTotalUsers, setSuperadminTotalUsers] = useState(0);
  const [sermonCount, setSermonCount] = useState(0);
  const [userSermonCount, setUserSermonCount] = useState(0);
  const [error, setError] = useState(null);
  const [newUsers, setNewUsers] = useState(0);
  const [newSalvations, setNewSalvations] = useState(0);
  const [newSermons, setNewSermons] = useState(0);
  const [totalSalvations, setTotalSalvations] = useState(0);
  const [totalLiveChurches, setTotalLiveChurches] = useState(0);
  const [sermonLanguageData, setSermonLanguageData] = useState([]);


  const fetchChurchStats = async () => {
    try {
      const userType = localStorage.getItem('userType');
      const churchId = localStorage.getItem('churchId');

      let url = `${apiBaseUrl}/church/stats`;
      let params = [];

      // Add period or custom dates
      if (dateFilter === 'past24Hours') {
        params.push('period=today');
      } else if (dateFilter === 'thisWeek') {
        params.push('period=week');
      } else if (dateFilter === 'thisMonth') {
        params.push('period=month');
      } else if (dateFilter === 'thisYear') {
        params.push('period=year');
      } else if (dateFilter === 'custom' && startDate && endDate) {
        params.push(`startDate=${startDate}&endDate=${endDate}`);
      } else {
        params.push('period=week');
      }
      if (userType === '1') {
        // Super admin - use selected churches
        if (!selectedChurches.includes('select all') && selectedChurches.length > 0) {
          // Convert church names to IDs (you'll need a mapping)
          const churchIds = getChurchIds(selectedChurches);
          if (churchIds.length > 0) {
            params.push(`churchId=${churchIds.join(',')}`);
          }
        }
      } else {
        // Other users - use their church
        if (churchId) {
          params.push(`churchId=${churchId}`);
        }
      }

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      let data, adminStatsData = null;

      if ([2, 3, 4].includes(parseInt(userType)) && churchId && churchId.trim() && churchId !== 'undefined' && churchId !== 'null') {
        // For userType 2: Make both calls in parallel
        let adminUrl = `${apiBaseUrl}/church/adminStats?churchId=${churchId}`;

        if (userType === '4') {
          const userId = localStorage.getItem('userId');
          if (userId && userId !== 'undefined' && userId !== 'null') {
            adminUrl += `&userId=${userId}`;
          }
        }

        // Add same period
        if (dateFilter === 'past24Hours') {
          adminUrl += '&period=today';
        } else if (dateFilter === 'thisWeek') {
          adminUrl += '&period=week';
        } else if (dateFilter === 'thisMonth') {
          adminUrl += '&period=month';
        } else if (dateFilter === 'thisYear') {
          adminUrl += '&period=year';
        } else if (dateFilter === 'custom' && startDate && endDate) {
          adminUrl += `&startDate=${startDate}&endDate=${endDate}`;
        } else {
          adminUrl += '&period=week';
        }

        try {
          // Parallel API calls
          const [generalResponse, adminResponse] = await Promise.all([
            axios.get(url),
            axios.get(adminUrl)
          ]);

          data = generalResponse.data;
          adminStatsData = adminResponse.data;
          setAdminStatsData(adminStatsData);
        } catch (err) {
          console.error('Error fetching stats:', err);
          // Fallback to general API only
          const response = await axios.get(url);
          data = response.data;
        }
      } else {
        // For other user types: Single API call
        const response = await axios.get(url);
        data = response.data;
      }
      // Update dashboard data
      setDashSalesData([
        { title: t('dashboard.totalChurches'), icon: getColoredIcon(FaChurch), count: data.totalChurches },
        { title: t('dashboard.totalAdmins'), icon: getColoredIcon(FaUser), count: dashSalesData[1].count },
        { title: t('dashboard.totalStaff'), icon: getColoredIcon(FaUsers), count: data.totalStaff },
        { title: t('dashboard.totalUsers'), icon: getColoredIcon(FaUserCheck), count: data.totalUsers },
        { title: t('dashboard.totalEvents'), icon: getColoredIcon(FaCalendarAlt), count: data.totalEvents }
      ]);

      if (data.faithLevelStats) {
        const chartData = Object.entries(data.faithLevelStats).map(([name, percentage]) => ({
          name,
          value: parseFloat(percentage.replace('%', '')),
          percentage: percentage
        }));
        setFaithLevelData(chartData);
      }

      if (data.languageStats) {
        const languageChartData = Object.entries(data.languageStats).map(([name, percentage]) => ({
          name,
          value: parseFloat(percentage.replace('%', '')),
          percentage: percentage
        }));
        setLanguageData(languageChartData);
      }

      if (data.referralSourceStats) {
        const referralChartData = Object.entries(data.referralSourceStats).map(([name, percentage]) => ({
          name,
          value: parseFloat(percentage.replace('%', '')),
          percentage: percentage
        }));
        setReferralSourceData(referralChartData);
      }

      if (data.languagesByCountry) {
        setLanguagesByCountryData(data.languagesByCountry);
      }

      if (data.activeUsersByChurch) {
        setActiveUsersByChurchData(data.activeUsersByChurch);
      }

      if (data.averageSermonDuration) {
        setAverageSermonDurationData(data.averageSermonDuration);
        console.log('Average Sermon Duration Data:', data.averageSermonDuration);
      }

      if (data.sermonListeningLanguages) {
        setSermonLanguageData(data.sermonListeningLanguages);
      }

      setSermonCount(data.totalSermons);
      setUserSermonCount(data.totalSermons);
      setSuperadminTotalUsers(data.totalUsers);

      // Set new stats
      setNewUsers(data.newUsers);
      setNewSalvations(data.newSalvations);
      setNewSermons(data.newSermons);
      setTotalSalvations(data.totalSalvations);
      setMonthlyBreakdown(data.monthlyBreakdown || []);

      setIsLoadingDashboardData(false);

    }
    catch (err) {
      setError(err.message || 'Error fetching stats');
      setIsLoadingDashboardData(false);
    }
  };

  const handleApplyFilters = async () => {
    setIsApplyingFilters(true);
    setHasPendingChanges(false);
    try {
      await fetchChurchStats();
    } finally {
      setIsApplyingFilters(false);
    }
  };
  const fetchChurches = async () => {
    try {
      setIsLoadingChurches(true);
      const userType = localStorage.getItem('userType');
      const churchId = localStorage.getItem('churchId');

      let response;
      if (userType === '4') {
        // User type 4 - fetch only their specific church
        if (!churchId) {
          setError('Church ID not found in local storage');
          return;
        }
        response = await axios.get(`${apiBaseUrl}/church/detail/${churchId}`);
        setChurches([response.data]); // Wrap in array for consistency
      } else {
        // Other user types - fetch all churches
        response = await axios.get(`${apiBaseUrl}/church/fetchAll?exclude=true`);
        setChurches(response.data);
      }
    } catch (err) {
      setError(err.message || 'Error fetching churches');
      setChurches([]);
    } finally {
      setIsLoadingChurches(false);
    }
  };

  useEffect(() => {
    fetchAllInitialData();
  }, []);

  useEffect(() => {
    if (!isInitialDataLoading && churches.length > 0) {
      fetchChurchStats();
    }
  }, []);

  const fetchAllInitialData = async () => {
    try {
      setIsInitialDataLoading(true);
      await fetchChurches();
      await fetchChurchStats();
      setIsInitialDataLoading(false);
    } catch (err) {
      setError(err.message || 'Error loading dashboard data');
      setIsInitialDataLoading(false);
    }
  };

  const getChurchIds = (selectedChurches) => {
    if (selectedChurches.includes('select all')) {
      return churches.map(church => church._id);
    }
    return selectedChurches.filter(id => id !== 'select all');
  };

  const userType = localStorage.getItem('userType');

  const ChurchImageCarousel = () => (
    <Row className="mb-5">
      <Col className="d-flex justify-content-center">
        <Card style={{ maxWidth: '800px', width: '100%' }}>
          <Card.Body className="p-4">
            {(isInitialDataLoading || isApplyingFilters) ? (
              <div className="church-carousel-skeleton">
                <div className="church-slide">
                  <div className="church-image-container">
                    <div className="skeleton-church-image"></div>
                  </div>
                  <div className="church-name-container">
                    <div className="skeleton-church-name"></div>
                  </div>
                </div>
              </div>
            ) : (
              // Actual carousel
              <Carousel
                indicators={true}
                controls={churches.length > 1}
                interval={4000}
                className="church-carousel enhanced-carousel"
                fade={true}
              >
                {churches.map((church, index) => (
                  <Carousel.Item key={index}>
                    <div className="church-slide enhanced-slide">
                      <div className="church-image-container enhanced-image-container">
                        {church.image ? (
                          <img
                            src={church.image}
                            alt={church.name}
                            className="church-image enhanced-image"
                          />
                        ) : (
                          <div className="church-icon enhanced-icon">
                            <FaChurch size={200} color="#231f20" />
                          </div>
                        )}
                      </div>
                      <div className="church-name-container enhanced-name-container">
                        <h2 className="church-name enhanced-name">
                          {church.name || 'Church Name Not Available'}
                        </h2>
                      </div>
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderCards = (dataSet) => {
    return dataSet.map((data, index) => (
      <Col key={index} className="mb-2">
        <Card
          className="dashboard-card h-100"
          style={{
            maxWidth: '220px',
            cursor: data.onClick ? 'pointer' : 'default',
            backgroundColor: '#f8f9fa',
            color: '#495057',
            transition: 'all 0.3s ease',
            border: '1px solid #dee2e6',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            minHeight: '50px'
          }}
          onClick={data.onClick}
        >
          <Card.Body className="d-flex flex-column justify-content-center text-center p-2">
            <div className="mb-1">
              <p
                className="mb-0"
                style={{
                  color: '#2c2c33ff',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  fontSize: 'bold',
                  lineHeight: '1',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {data.title}
              </p>
            </div>
            <div>
              <h3
                className="mb-0 fw-bold"
                style={{
                  color: 'black',
                  fontSize: '40px',
                  fontWeight: '700'
                }}
              >
                {data.count !== undefined ? data.count : 0}
              </h3>
            </div>
          </Card.Body>
        </Card>
      </Col>
    ));
  };

  const renderDashboard = () => {
    // Show skeletons while loading
    if (isInitialDataLoading || isApplyingFilters) {
      if (parseInt(userType) === 1) {
        // Super admin - 5 skeleton tiles
        return (
          <Row className="g-3">
            {[1, 2, 3, 4, 5].map(i => <TileSkeleton key={i} />)}
          </Row>
        );
      }
      if (parseInt(userType) === 4) {
        // User - 1 skeleton tile
        return (
          <>
            <ChurchImageCarousel />
            <Row className="g-3">
              <TileSkeleton />
            </Row>
          </>
        );
      }
      if (parseInt(userType) === 3) {
        // Staff - 3 skeleton tiles
        return (
          <Row className="g-3">
            {[1, 2, 3].map(i => <TileSkeleton key={i} />)}
          </Row>
        );
      }
      if (parseInt(userType) === 2) {
        // Admin - 4 skeleton tiles
        return (
          <Row className="g-3">
            {[1, 2, 3, 4, 5].map(i => <TileSkeleton key={i} />)}
          </Row>
        );
      }
      return (
        <Row className="g-3">
          <TileSkeleton />
        </Row>
      );
    }

    if (parseInt(userType) === 1) {
      // Super admin - show all 5 tiles
      const superadminData = [
        { title: t('dashboard.totalSermons'), icon: getColoredIcon(FaMoneyBillAlt), count: sermonCount },
        { title: t('dashboard.totalSalvations'), icon: getColoredIcon(FaUserCheck), count: totalSalvations },
        { title: t('dashboard.totalUsers'), icon: getColoredIcon(FaUserCheck), count: superadminTotalUsers },
        { title: t('dashboard.totalChurches'), icon: getColoredIcon(FaChurch), count: dashSalesData[0].count },
        { title: t('dashboard.totalLiveChurches'), icon: getColoredIcon(FaVideo), count: totalLiveChurches }
      ];
      return (
        <Row className="g-3">
          {renderCards(superadminData)}
        </Row>
      );
    }

    if (parseInt(userType) === 4) {
      // User - show church carousel + 1 tile
      const userData = [
        { title: t('dashboard.totalSermons'), icon: getColoredIcon(FaMoneyBillAlt), count: adminStatsData?.totalSermonsAttendedByUser || 0 }
      ];
      return (
        <>
          <ChurchImageCarousel />
          <Row className="g-3">
            {renderCards(userData)}
          </Row>
        </>
      );
    }

    if (parseInt(userType) === 3) {
      // Staff - show 3 tiles
      const staffData = [
        { title: t('dashboard.totalUsers'), icon: getColoredIcon(FaUserCheck), count: adminStatsData?.totalUsers || 0 },
        { title: t('dashboard.totalEvents'), icon: getColoredIcon(FaCalendarAlt), count: adminStatsData?.totalEvents || 0 },
        { title: t('dashboard.totalSermons'), icon: getColoredIcon(FaMoneyBillAlt), count: adminStatsData?.totalSermons || 0 }
      ];
      return (
        <Row className="g-3">
          {renderCards(staffData)}
        </Row>
      );
    }

    if (parseInt(userType) === 2) {
      const adminData = [
        { title: t('dashboard.totalSermons'), icon: getColoredIcon(FaMoneyBillAlt), count: adminStatsData?.totalSermons || 0 },
        { title: t('dashboard.totalStaff'), icon: getColoredIcon(FaUsers), count: adminStatsData?.totalStaff || 0 },
        { title: t('dashboard.totalSalvations'), icon: getColoredIcon(FaUserCheck), count: adminStatsData?.totalSalvations || 0 },
        { title: t('dashboard.totalUsers'), icon: getColoredIcon(FaUserCheck), count: adminStatsData?.totalUsers || 0 },
        { title: t('dashboard.totalEvents'), icon: getColoredIcon(FaCalendarAlt), count: adminStatsData?.totalEvents || 0 },
      ];
      return (
        <Row className="g-3">
          {renderCards(adminData)}
        </Row>
      );
    }

    return (
      <Row className="g-3">
        {renderCards([])}
      </Row>
    );
  };

  return (
    <React.Fragment>

      {renderDashboard()}

      {(userType === "1" || userType === "2") && (
        <hr className="dashboard-divider" />
      )}


      {(parseInt(userType) === 1 || parseInt(userType) === 2) && (
        <div className="main-dashboard-layout">
          {/* Left side filters */}
          <div className="tiles-column">
            {(isInitialDataLoading || isApplyingFilters) ? (
              <>
                <FilterSkeleton title="Select Date Range" itemCount={5} />
                <FilterSkeleton title="Select Church" itemCount={4} />
                {/* Apply Button Skeleton */}
                <div className="button-container">
                  <div
                    className="w-100"
                    style={{
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #dee2e6',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'loading 1.5s infinite',
                      height: '40px',
                      maxWidth: '92%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '12px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '6px',
                        background: 'linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'loading 1.5s infinite'
                      }}
                    ></div>
                  </div>
                </div>

              </>
            ) : (
              <>
                <div className="date-filter-container mb-2">
                  <div
                    className="date-filter-header"
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">{t('dashboard.filters.date_range')}</h6>
                    <span>{showDateFilter ? '▼' : '▶'}</span>
                  </div>

                  {showDateFilter && (
                    <div className="date-filter-content p-3">
                      <div className="form-check mb-1">
                        <input type="radio" className="form-check-input" name="dateRange" value="past24Hours"
                          checked={dateFilter === 'past24Hours'} onChange={(e) => {
                            setDateFilter(e.target.value);
                            setHasPendingChanges(true);
                          }} />
                        <label className="form-check-label">{t('dashboard.filters.past_24_hours')}</label>
                      </div>

                      <div className="form-check mb-1">
                        <input type="radio" className="form-check-input" name="dateRange" value="thisWeek"
                          checked={dateFilter === 'thisWeek'} onChange={(e) => {
                            setDateFilter(e.target.value);
                            setHasPendingChanges(true);
                          }} />
                        <label className="form-check-label">{t('dashboard.filters.this_week')}</label>
                      </div>

                      <div className="form-check mb-1">
                        <input type="radio" className="form-check-input" name="dateRange" value="thisMonth"
                          checked={dateFilter === 'thisMonth'} onChange={(e) => {
                            setDateFilter(e.target.value);
                            setHasPendingChanges(true);
                          }} />
                        <label className="form-check-label">{t('dashboard.filters.this_month')}</label>
                      </div>

                      <div className="form-check mb-1">
                        <input type="radio" className="form-check-input" name="dateRange" value="thisYear"
                          checked={dateFilter === 'thisYear'} onChange={(e) => {
                            setDateFilter(e.target.value);
                            setHasPendingChanges(true);
                          }} />
                        <label className="form-check-label">{t('dashboard.filters.this_year')}</label>
                      </div>

                      <div className="form-check mb-1">
                        <input type="radio" className="form-check-input" name="dateRange" value="custom"
                          checked={dateFilter === 'custom'} onChange={(e) => {
                            setDateFilter(e.target.value);
                            setHasPendingChanges(true);
                          }} />
                        <label className="form-check-label">{t('dashboard.filters.custom_range')}</label>                      </div>

                      {dateFilter === 'custom' && (
                        <div className="mt-2">
                          <input type="date" className="form-control form-control-sm mb-2"
                            value={startDate} onChange={(e) => {
                              setStartDate(e.target.value);
                              setHasPendingChanges(true);
                            }} />
                          <input type="date" className="form-control form-control-sm"
                            value={endDate} onChange={(e) => {
                              setEndDate(e.target.value);
                              setHasPendingChanges(true);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Church Filter Section */}
                <div className="date-filter-container">
                  <div
                    className="date-filter-header"
                    onClick={() => setShowChurchFilter(!showChurchFilter)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h6 className="mb-0">{t('dashboard.filters.select_church')}</h6>
                    <span>{showChurchFilter ? '▼' : '▶'}</span>
                  </div>

                  {showChurchFilter && (
                    <div className="date-filter-content p-3">
                      {(isInitialDataLoading || isApplyingFilters) ? (
                        <>
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="form-check mb-1">
                              <div className="skeleton-checkbox"></div>
                              <div className="skeleton-filter-label"></div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {parseInt(userType) === 2 ? (
                            // UserType 2 - Show only their church, checked and disabled
                            (() => {
                              const userChurchId = localStorage.getItem('churchId');
                              const userChurch = churches.find(church => church._id === userChurchId);
                              return userChurch ? (
                                <div className="form-check mb-1">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    value={userChurch._id}
                                    checked={true}
                                    disabled={true}
                                    style={{ opacity: 0.7 }}
                                  />
                                  <label
                                    className="form-check-label church-name-small"
                                    style={{ fontWeight: 'bold', color: '#6c757d' }}
                                  >
                                    {userChurch.name} {t('dashboard.filters.your_church')}

                                  </label>
                                </div>
                              ) : (
                                <div style={{ color: '#6c757d', fontSize: '12px' }}>
                                  {t('dashboard.filters.no_church_assigned')}
                                </div>
                              );
                            })()
                          ) : (
                            <>
                              {/* Select All - Fixed at top */}
                              <div className="form-check mb-1">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  value="select all"
                                  checked={selectedChurches.includes('select all')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedChurches(['select all']);
                                    } else {

                                      setSelectedChurches([]);
                                    }
                                    setHasPendingChanges(true);
                                  }}
                                />
                                <label className="form-check-label church-name-small" style={{ fontWeight: 'bold' }}>{t('dashboard.filters.select_all')}</label>
                              </div>

                              {/* Scrollable area for ALL churches */}
                              <div className="churches-scroll-container">
                                {churches.map((church) => (
                                  <div className="form-check mb-1" key={church._id}>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      value={church._id}
                                      checked={selectedChurches.includes('select all') || selectedChurches.includes(church._id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // Remove 'select all' and add this church
                                          const newSelection = selectedChurches.filter(id => id !== 'select all');
                                          setSelectedChurches([...newSelection, church._id]);
                                        } else {
                                          // If "select all" was checked, uncheck it and select all churches except the current one
                                          if (selectedChurches.includes('select all')) {
                                            const allOtherChurches = churches
                                              .filter(c => c._id !== church._id)
                                              .map(c => c._id);
                                            setSelectedChurches(allOtherChurches);
                                          } else {
                                            // Normal unchecking behavior
                                            const remainingSelections = selectedChurches.filter(id => id !== church._id);

                                            // Check if this would leave no selections
                                            if (remainingSelections.length === 0) {
                                              alert("You need at least one checkbox to apply filter");
                                              return; // Prevent unchecking
                                            }

                                            setSelectedChurches(remainingSelections);
                                          }
                                        }
                                        setHasPendingChanges(true);
                                      }}
                                    />
                                    <label className="form-check-label church-name-small">{church.name}</label>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Apply Filters Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    className={`w-100 apply-filters-button ${hasPendingChanges && selectedChurches.length > 0 ? 'apply-filters-button-active' : 'apply-filters-button-inactive'}`}
                    onClick={handleApplyFilters}
                    disabled={!hasPendingChanges || selectedChurches.length === 0}
                  >
                    {hasPendingChanges ? 'Apply Filters' : 'Filters Applied'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Side Tiles */}
          <div className="filters-column">
            {(isInitialDataLoading || isApplyingFilters) ? (
              <>
                <RightTileSkeleton />
                <RightTileSkeleton />
                <RightTileSkeleton />
              </>
            ) : (
              <>
                <div className="right-side-tile">
                  <div className="tile-content" onClick={async () => {
                    try {
                      setIsLoadingNewUsersDetails(true);
                      const userType = localStorage.getItem('userType');
                      const churchId = localStorage.getItem('churchId');
                      let url = `${apiBaseUrl}/church/newUsersDetails`;
                      let params = [];

                      // Add date filter
                      if (dateFilter === 'past24Hours') params.push('period=today');
                      else if (dateFilter === 'thisWeek') params.push('period=week');
                      else if (dateFilter === 'thisMonth') params.push('period=month');
                      else if (dateFilter === 'thisYear') params.push('period=year');
                      else if (dateFilter === 'custom' && startDate && endDate) {
                        params.push(`startDate=${startDate}&endDate=${endDate}`);
                      } else params.push('period=week');

                      // Add church filter
                      if (userType === '1' && !selectedChurches.includes('select all') && selectedChurches.length > 0) {
                        const churchIds = getChurchIds(selectedChurches);
                        if (churchIds.length > 0) params.push(`churchId=${churchIds.join(',')}`);
                      } else if (userType !== '1' && churchId) {
                        params.push(`churchId=${churchId}`);
                      }

                      if (params.length > 0) url += '?' + params.join('&');

                      const response = await axios.get(url);

                      navigate("/analytics", {
                        state: {
                          newUsersDetails: response.data.users || [],
                          dateFilter, startDate, endDate, selectedChurches
                        }
                      });

                    } catch (error) {
                      console.error('Error fetching new users details:', error);
                      navigate("/analytics");
                    } finally {
                      setIsLoadingNewUsersDetails(false);
                    }
                  }} style={{ cursor: 'pointer' }}>
                    <h6 className="tile-title">{t('dashboard.tiles.new_users')}</h6>
                    <p className="tile-subtitle">
                      {isLoadingNewUsersDetails ? t('dashboard.loading') : t('dashboard.click_to_view')}
                    </p>
                    <h3 className="tile-number">{newUsers}</h3>
                  </div>
                </div>

                <div className="right-side-tile">
                  <div className="tile-content" onClick={async () => {
                    try {
                      setIsLoadingSalvationDetails(true);
                      const userType = localStorage.getItem('userType');
                      const churchId = localStorage.getItem('churchId');
                      let url = `${apiBaseUrl}/church/salvationDetails`;
                      let params = [];

                      // Add date filter
                      if (dateFilter === 'past24Hours') params.push('period=today');
                      else if (dateFilter === 'thisWeek') params.push('period=week');
                      else if (dateFilter === 'thisMonth') params.push('period=month');
                      else if (dateFilter === 'thisYear') params.push('period=year');
                      else if (dateFilter === 'custom' && startDate && endDate) {
                        params.push(`startDate=${startDate}&endDate=${endDate}`);
                      } else params.push('period=week');

                      // Add church filter
                      if (userType === '1' && !selectedChurches.includes('select all') && selectedChurches.length > 0) {
                        const churchIds = getChurchIds(selectedChurches);
                        if (churchIds.length > 0) params.push(`churchId=${churchIds.join(',')}`);
                      } else if (userType !== '1' && churchId) {
                        params.push(`churchId=${churchId}`);
                      }

                      if (params.length > 0) url += '?' + params.join('&');

                      const response = await axios.get(url);

                      navigate("/analytics", {
                        state: {
                          salvationDetails: response.data.salvations || [],
                          salvationSummary: response.data.summary || {},
                          dateFilter, startDate, endDate, selectedChurches
                        }
                      });

                    } catch (error) {
                      console.error('Error fetching salvation details:', error);
                      navigate("/analytics");
                    } finally {
                      setIsLoadingSalvationDetails(false);
                    }
                  }} style={{ cursor: 'pointer' }}>
                    <h6 className="tile-title">{t('dashboard.tiles.new_salvations')}</h6>
                    <p className="tile-subtitle">
                      {isLoadingSalvationDetails ? t('dashboard.loading') : t('dashboard.click_to_view')}
                    </p>
                    <h3 className="tile-number">{newSalvations}</h3>
                  </div>
                </div>

                <div className="right-side-tile">
                  <div className="tile-content" onClick={async () => {
                    try {
                      setIsLoadingSermonDetails(true);

                      // Build API URL with current filters
                      const userType = localStorage.getItem('userType');
                      const churchId = localStorage.getItem('churchId');
                      let url = `${apiBaseUrl}/church/sermonDetails`;
                      let params = [];

                      // Add date filter
                      if (dateFilter === 'past24Hours') params.push('period=today');
                      else if (dateFilter === 'thisWeek') params.push('period=week');
                      else if (dateFilter === 'thisMonth') params.push('period=month');
                      else if (dateFilter === 'thisYear') params.push('period=year');
                      else if (dateFilter === 'custom' && startDate && endDate) {
                        params.push(`startDate=${startDate}&endDate=${endDate}`);
                      } else params.push('period=week');

                      // Add church filter
                      if (userType === '1' && !selectedChurches.includes('select all') && selectedChurches.length > 0) {
                        const churchIds = getChurchIds(selectedChurches);
                        if (churchIds.length > 0) params.push(`churchId=${churchIds.join(',')}`);
                      } else if (userType !== '1' && churchId) {
                        params.push(`churchId=${churchId}`);
                      }

                      if (params.length > 0) url += '?' + params.join('&');

                      console.log('API URL being called:', url);

                      const response = await axios.get(url);
                      console.log('API Response:', response.data);

                      navigate("/analytics", {
                        state: {
                          sermonDetails: response.data.sermons || [],
                          dateFilter,
                          startDate,
                          endDate,
                          selectedChurches,
                          apiUrl: url // Pass the API URL for reference
                        }
                      });

                    } catch (error) {
                      console.error('Error fetching sermon details:', error);
                      // Still navigate to analytics even if API fails
                      navigate("/analytics", {
                        state: {
                          error: 'Failed to load sermon details',
                          dateFilter,
                          startDate,
                          endDate,
                          selectedChurches
                        }
                      });
                    } finally {
                      setIsLoadingSermonDetails(false);
                    }
                  }} style={{ cursor: 'pointer' }}>
                    <h6 className="tile-title">{t('dashboard.tiles.new_sermons')}</h6>
                    <p className="tile-subtitle">
                      {isLoadingSermonDetails ? t('dashboard.loading') : t('dashboard.click_to_view')}
                    </p>
                    <h3 className="tile-number">{newSermons}</h3>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="live-sermons-column">
            <LiveSermons
              apiBaseUrl={apiBaseUrl}
              userType={userType}
              isInitialDataLoading={isInitialDataLoading}
              isApplyingFilters={isApplyingFilters}
              setError={setError}
              setTotalLiveChurches={setTotalLiveChurches}
            />
          </div>
        </div>
      )}


      {(parseInt(userType) === 1 || parseInt(userType) === 2) && (
        <>
          {selectedChurches.length === 0 && (
            <div className="no-church-message">
              <div className="message-inner">
                <div className="message-icon-circle">
                  <span style={{ fontSize: '32px', color: '#6c757d' }}>⛪</span>
                </div>
                <h4 className="message-title">
                  {t('dashboard.messages.no_church_selected')}
                </h4>
                <p className="message-description">
                  {t('dashboard.messages.select_church_description')}
                </p>
              </div>
            </div>
          )}

          {hasPendingChanges && selectedChurches.length > 0 && (
            <div className="no-church-message">
              <div className="message-inner-apply">
                <div className="message-icon-circle-dark">
                  <span style={{ fontSize: '32px', color: 'white' }}>⚡</span>
                </div>
                <h4 className="message-title">
                  {t('dashboard.messages.apply_filters_title')}
                </h4>
                <p className="message-description">
                  {t('dashboard.messages.apply_filters_description')}
                </p>
              </div>
            </div>
          )}

          {/* Always render charts but hide when no churches selected */}
          <div className={`charts-display-container ${(isApplyingFilters || hasPendingChanges || selectedChurches.length === 0) ? 'charts-display-hidden' : ''}`}>            <div className="mt-3">
            <div className="charts-row">
              <div className="chart-half">
                <FaithChart
                  faithLevelData={faithLevelData}
                  isInitialDataLoading={isInitialDataLoading}
                  isApplyingFilters={isApplyingFilters}
                  ChartSkeleton={ChartSkeleton}
                />
              </div>
              <div className="chart-half">
                <RegistrationsChart
                  monthlyBreakdown={monthlyBreakdown}
                  isInitialDataLoading={isInitialDataLoading}
                  isApplyingFilters={isApplyingFilters}
                  BarChartSkeleton={BarChartSkeleton}
                />
              </div>
            </div>
          </div>

            <div className="d-flex mt-3" style={{ gap: '20px' }}>
              <ChurchLocationsMap
                churches={churches}
                selectedChurches={selectedChurches}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                userType={userType}
                isInitialDataLoading={isInitialDataLoading}
                isApplyingFilters={isApplyingFilters}
                getChurchIds={getChurchIds}
              />
              <AppDiscoveryChart
                referralSourceData={referralSourceData}
                isInitialDataLoading={isInitialDataLoading}
                isApplyingFilters={isApplyingFilters}
                BarChartSkeleton={BarChartSkeleton}
              />
            </div>

            <div className="mt-3">
              <div className="charts-row">
                <div className="chart-half">
                  <LanguagesByCountryChart
                    languagesByCountryData={languagesByCountryData}
                    selectedCountryLanguage={selectedCountryLanguage}
                    setSelectedCountryLanguage={setSelectedCountryLanguage}
                    userType={userType}
                    isInitialDataLoading={isInitialDataLoading}
                    isApplyingFilters={isApplyingFilters}
                    BarChartSkeleton={BarChartSkeleton}
                  />
                </div>
                <div className="chart-half">
                  <LanguageChart
                    languageData={languageData}
                    isInitialDataLoading={isInitialDataLoading}
                    isApplyingFilters={isApplyingFilters}
                    ChartSkeleton={ChartSkeleton}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="charts-row">
                <div className="chart-half">
                  <ActiveUsersByChurchChart
                    activeUsersByChurchData={activeUsersByChurchData}
                    selectedActiveUsersChurch={selectedActiveUsersChurch}
                    setSelectedActiveUsersChurch={setSelectedActiveUsersChurch}
                    userType={userType}
                    isInitialDataLoading={isInitialDataLoading}
                    isApplyingFilters={isApplyingFilters}
                    BarChartSkeleton={BarChartSkeleton}
                  />
                </div>
                <div className="chart-half">
                  <SermonLanguageChart
                    sermonLanguageData={sermonLanguageData}
                    isInitialDataLoading={isInitialDataLoading}
                    isApplyingFilters={isApplyingFilters}
                    ChartSkeleton={ChartSkeleton}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="charts-row">
                <div className="chart-half">
                  <AverageSermonDurationChart
                    averageSermonDurationData={averageSermonDurationData}
                    isInitialDataLoading={isInitialDataLoading}
                    isApplyingFilters={isApplyingFilters}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
    </React.Fragment >
  );
};

export default DashDefault;