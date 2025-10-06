import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const LiveSermonsSkeleton = () => (
    <div>
        <div className="skeleton-title mb-2"></div>
        <div className="skeleton-subtitle mb-2"></div>
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-sermon-card">
                <div className="skeleton-circle"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text-small"></div>
                <div className="skeleton-text-small"></div>
            </div>
        ))}
    </div>
);

const LiveSermons = ({
    apiBaseUrl,
    userType,
    isInitialDataLoading,
    isApplyingFilters,
    setError,
    setTotalLiveChurches
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Local state for live sermons
    const [liveSermons, setLiveSermons] = useState([]);
    const [isInitialLoadingLiveSermons, setIsInitialLoadingLiveSermons] = useState(true);
    const [isLoadingLiveSermonDetails, setIsLoadingLiveSermonDetails] = useState(false);

    const fetchLiveSermons = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setIsInitialLoadingLiveSermons(true);
            }

            const userTypeValue = localStorage.getItem('userType');
            const churchId = localStorage.getItem('churchId');

            let url = `${apiBaseUrl}/listen/liveSermonSummary`;

            if (userTypeValue !== '1' && churchId) {
                url += `?churchId=${churchId}`;
            }

            const response = await axios.get(url);

            // Debug log to see the actual response structure
            console.log('Live sermons API response:', response.data);

            // Ensure we always set an array for sermons
            const sermons = Array.isArray(response.data.sermons) ? response.data.sermons : [];
            setLiveSermons(sermons);
            setTotalLiveChurches(response.data.totalLiveNowChurchs || 0);

        } catch (err) {
            setError(err.message || 'Error fetching live sermons');
            setLiveSermons([]);
            setTotalLiveChurches(0);
        } finally {
            if (isInitialLoad) {
                setIsInitialLoadingLiveSermons(false);
            }
        }
    };

    // Initial load effect
    useEffect(() => {
        fetchLiveSermons(true);
    }, []);

    // Auto-refresh effect
    useEffect(() => {
        if (!isInitialLoadingLiveSermons) {
            const liveSermonInterval = setInterval(() => {
                fetchLiveSermons(false);
            }, 40000);
            return () => {
                clearInterval(liveSermonInterval);
            };
        }
    }, [isInitialLoadingLiveSermons]);

    const handleSermonClick = async (sermon) => {
        try {
            const churchId = localStorage.getItem('churchId');
            let url = `${apiBaseUrl}/listen/getallliveusers`;
            if (churchId && churchId.trim() && churchId !== 'undefined' && churchId !== 'null') {
                url += `?churchId=${churchId}`;
            }

            const response = await axios.get(url);

            navigate("/analytics", {
                state: {
                    liveSermonDetails: response.data || [],
                    selectedSermon: sermon,
                    apiUrl: url
                }
            });
        } catch (error) {
            console.error('Error fetching live sermon details:', error);
            navigate("/analytics", {
                state: {
                    error: 'Failed to load live sermon details'
                }
            });
        }
    };

    const handleViewAllClick = async () => {
        try {
            setIsLoadingLiveSermonDetails(true);
            const churchId = localStorage.getItem('churchId');
            let url = `${apiBaseUrl}/listen/getallliveusers`;
            if (churchId && churchId.trim() && churchId !== 'undefined' && churchId !== 'null') {
                url += `?churchId=${churchId}`;
            }

            console.log('Live Sermons API URL being called:', url);

            const response = await axios.get(url);
            console.log('Live Sermons API Response:', response.data);

            navigate("/analytics", {
                state: {
                    liveSermonDetails: response.data || [],
                    apiUrl: url
                }
            });

        } catch (error) {
            console.error('Error fetching live sermon details:', error);
            navigate("/analytics", {
                state: {
                    error: 'Failed to load live sermon details'
                }
            });
        } finally {
            setIsLoadingLiveSermonDetails(false);
        }
    };

    return (
        <div className="live-sermons-container">
            {(isInitialDataLoading || isApplyingFilters || isInitialLoadingLiveSermons) ? (
                <LiveSermonsSkeleton />
            ) : (
                <>
                    <div className="live-sermons-header mb-2">
                        <h5 className="mb-0" style={{ fontWeight: 'bold', color: '#000' }}>
                            {t('dashboard.live_sermons.title')}
                        </h5>
                    </div>

                    {/* Table Headers */}
                    <div className="table-headers mb-2">
                        <div className="header-item" style={{ width: '50px' }}>
                            {t('dashboard.live_sermons.sr_no')}
                        </div>
                        <div className="header-item" style={{ flex: 1, textAlign: 'center' }}>
                            {t('dashboard.live_sermons.church_name')}
                        </div>
                        <div className="header-item" style={{ width: '110px', textAlign: 'center' }}>
                            {t('dashboard.live_sermons.start_time')}
                        </div>
                        <div className="header-item" style={{ width: '110px', textAlign: 'center' }}>
                            {t('dashboard.live_sermons.active_users')}
                        </div>
                    </div>

                    {/* Church Sermon Cards */}
                    <div className="sermon-cards-container" style={{
                        maxHeight: '300px',
                        overflowY: liveSermons.length > 5 ? 'auto' : 'visible'
                    }}>
                        {!Array.isArray(liveSermons) || liveSermons.length === 0 ? (
                            <div className="text-center p-3" style={{ color: '#6c757d' }}>
                                {t('dashboard.live_sermons.no_live_sermons')}
                            </div>
                        ) : (
                            liveSermons.map((sermon, index) => (
                                <div
                                    className="sermon-card"
                                    key={index}
                                    onClick={() => handleSermonClick(sermon)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="sermon-number">{index + 1}</div>
                                    <div className="sermon-details">
                                        <div className="church-name">{sermon.churchName}</div>
                                    </div>
                                    <div className="sermon-time">
                                        {sermon.startTime ? new Date(sermon.startTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        }) : 'N/A'}
                                    </div>
                                    <div className="sermon-count">{sermon.activeUsers}</div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="view-all-container">
                        {liveSermons.length >= 1 && (
                            <button className="view-all-btn" onClick={handleViewAllClick}>
                                {isLoadingLiveSermonDetails ? t('dashboard.loading') : t('dashboard.live_sermons.view_in_detail')}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default LiveSermons;