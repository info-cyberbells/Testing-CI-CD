import React from 'react';
import { useTranslation } from 'react-i18next';

const AverageSermonDurationChart = ({
    averageSermonDurationData,
    isInitialDataLoading,
    isApplyingFilters
}) => {
    const { t } = useTranslation();

    const sortedData = Object.entries(averageSermonDurationData || {})
        .sort(([, a], [, b]) => b.averageMinutes - a.averageMinutes);

    return (
        <div style={{ width: '100%', height: '440px' }}>
            <div style={{
                height: '100%',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column' // Fix: Use flexbox layout
            }}>
                {(isInitialDataLoading || isApplyingFilters) ? (
                    // SKELETON EFFECT
                    <>
                        <div style={{ padding: '0 0 8px 0' }}>
                            <div className="skeleton-title" style={{ margin: '0 auto 8px' }}></div>
                            <div className="skeleton-subtitle" style={{ margin: '0 auto' }}></div>
                        </div>

                        <div style={{ flex: 1, marginTop: '10px' }}>
                            {/* Table header skeleton */}
                            <div style={{
                                display: 'flex',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '8px 8px 0 0',
                                padding: '12px 8px',
                                marginBottom: '1px'
                            }}>
                                <div className="skeleton-text" style={{ width: '40%', height: '16px', marginRight: '8px' }}></div>
                                <div className="skeleton-text" style={{ width: '20%', height: '16px', marginRight: '8px' }}></div>
                                <div className="skeleton-text" style={{ width: '20%', height: '16px', marginRight: '8px' }}></div>
                                <div className="skeleton-text" style={{ width: '20%', height: '16px' }}></div>
                            </div>

                            {/* Table rows skeleton */}
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{
                                    display: 'flex',
                                    backgroundColor: i % 2 === 0 ? 'white' : '#f8f9fa',
                                    padding: '12px 8px',
                                    borderBottom: '1px solid #e9ecef',
                                    alignItems: 'center'
                                }}>
                                    <div className="skeleton-text" style={{ width: '40%', height: '14px', marginRight: '8px' }}></div>
                                    <div className="skeleton-text" style={{ width: '20%', height: '14px', marginRight: '8px' }}></div>
                                    <div className="skeleton-text" style={{ width: '20%', height: '14px', marginRight: '8px' }}></div>
                                    <div className="skeleton-text" style={{ width: '20%', height: '14px' }}></div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (!averageSermonDurationData || Object.keys(averageSermonDurationData).length === 0) ? (
                    // NO DATA MESSAGE
                    <>
                        <div style={{ padding: '0 0 8px 0' }}>
                            <h5 className="mb-0" style={{
                                fontWeight: '700',
                                color: '#2c3e50',
                                textAlign: 'center',
                                fontSize: '18px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '2px'
                            }}>{t('dashboard.charts.avg_sermon_duration')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.performance_by_church')}</p>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flex: 1,
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                border: '2px dashed #dee2e6',
                                maxWidth: '300px'
                            }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    margin: '0 auto 16px',
                                    backgroundColor: '#e9ecef',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '24px', color: '#6c757d' }}>⏱️</span>
                                </div>
                                <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                    {t('dashboard.charts.no_sermon_data')}
                                </h6>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                    {t('dashboard.charts.no_sermon_data_message')}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    // ACTUAL CONTENT
                    <>
                        <div style={{ padding: '0 0 8px 0', flexShrink: 0 }}>
                            <h5 className="mb-0" style={{
                                fontWeight: '700',
                                color: '#2c3e50',
                                textAlign: 'center',
                                fontSize: '18px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '2px'
                            }}>{t('dashboard.charts.avg_sermon_duration')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.performance_by_church')}</p>
                        </div>

                        {/* FIXED SCROLLING CONTAINER */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            minHeight: 0, // Important for flex scrolling
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                backgroundColor: 'white'
                            }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                                        <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>{t('dashboard.charts.church')}</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{t('dashboard.charts.avg_duration')}</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{t('dashboard.charts.sermons')}</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{t('dashboard.charts.avg_users')}</th>
                                        <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>{t('dashboard.charts.total_hours')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedData.map(([church, data], index) => (
                                        <tr key={church} style={{
                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                            borderBottom: '1px solid #e9ecef',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'}
                                        >
                                            <td style={{
                                                padding: '12px 8px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: '#2c3e50',
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>{church}</td>
                                            <td style={{
                                                padding: '12px 8px',
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#e74c3c'
                                            }}>{data.averageDuration}</td>
                                            <td style={{
                                                padding: '12px 8px',
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#3498db'
                                            }}>{data.totalSermons}</td>
                                            <td style={{
                                                padding: '12px 8px',
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#c11d1aff'
                                            }}>{data.averageUsers}</td>
                                            <td style={{
                                                padding: '12px 8px',
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#27ae60'
                                            }}>{data.totalHours}h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AverageSermonDurationChart;