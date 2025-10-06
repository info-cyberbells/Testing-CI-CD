import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const ActiveUsersByChurchChart = ({
    activeUsersByChurchData,
    selectedActiveUsersChurch,
    setSelectedActiveUsersChurch,
    userType,
    isInitialDataLoading,
    isApplyingFilters,
    BarChartSkeleton
}) => {
    const { t } = useTranslation();

    // Get available churches from the data
    const churchNames = Object.keys(activeUsersByChurchData || {});

    // Transform data for the chart
    const getChartData = () => {
        if (selectedActiveUsersChurch === 'all') {
            // Show all churches - create bar data
            return churchNames.map(church => ({
                church: church,
                activeUsers: activeUsersByChurchData[church] || 0
            }));
        } else {
            // Show single church - create single bar data
            return [{
                church: selectedActiveUsersChurch,
                activeUsers: activeUsersByChurchData[selectedActiveUsersChurch] || 0
            }];
        }
    };

    const chartData = getChartData();

    // Colors for different churches
    const churchColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    return (
        <div style={{ width: '100%', height: '440px' }}>
            <div style={{
                height: '100%',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
                overflow: 'hidden'
            }}>
                {(isInitialDataLoading || isApplyingFilters) ? (
                    <BarChartSkeleton />
                ) : !activeUsersByChurchData || Object.keys(activeUsersByChurchData).length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '350px', flexDirection: 'column' }}>
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            borderRadius: '12px',
                            backgroundColor: '#f8f9fa',
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
                                <span style={{ fontSize: '24px', color: '#6c757d' }}>📊</span>
                            </div>
                            <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                {t('dashboard.charts.no_active_users')}
                            </h6>
                            <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                {t('dashboard.charts.no_active_users_message')}
                            </p>
                        </div>
                    </div>
                ) : (
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
                            }}>{t('dashboard.charts.active_users_by_church')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.users_active_period')}</p>
                        </div>

                        {/* Church Filter */}
                        {parseInt(userType) !== 2 && (
                            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                                <select
                                    value={selectedActiveUsersChurch}
                                    onChange={(e) => setSelectedActiveUsersChurch(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #dee2e6',
                                        fontSize: '12px',
                                        backgroundColor: 'white',
                                        color: '#495057',
                                        fontWeight: '600',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="all">{t('dashboard.charts.all_churches')}</option>
                                    {churchNames.map(church => (
                                        <option key={church} value={church}>
                                            {church}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ height: '350px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 60
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="church"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#6c757d' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        interval={0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6c757d' }}
                                        label={{ value: 'Active Users', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [value, 'Active Users']}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                    />

                                    <Bar
                                        dataKey="activeUsers"
                                        fill="#3498DB"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={60}
                                        animationDuration={0}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={churchColors[index % churchColors.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActiveUsersByChurchChart;