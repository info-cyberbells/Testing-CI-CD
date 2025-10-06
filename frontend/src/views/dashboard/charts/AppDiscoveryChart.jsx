import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const AppDiscoveryChart = ({
    referralSourceData,
    isInitialDataLoading,
    isApplyingFilters,
    BarChartSkeleton
}) => {
    const { t } = useTranslation();
    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    return (
        <div style={{ width: '50%', height: '480px', padding: '10px' }}>
            <div style={{
                height: '100%',
                backgroundColor: '#f8f9fa',
                border: '2px solid #dee2e6',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden'
            }}>
                {(isInitialDataLoading || isApplyingFilters) ? (
                    <BarChartSkeleton />
                ) : !referralSourceData || referralSourceData.length === 0 || referralSourceData.every(item => item.value === 0) ? (
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
                            }}>{t('dashboard.charts.app_discovery')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.how_users_found')}</p>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '350px',
                            flexDirection: 'column'
                        }}>
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
                                    <span style={{ fontSize: '24px', color: '#6c757d' }}>📱</span>
                                </div>
                                <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                    {t('dashboard.charts.no_discovery_data')}
                                </h6>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                    {t('dashboard.charts.no_discovery_available')}
                                </p>
                            </div>
                        </div>
                    </>
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
                            }}>{t('dashboard.charts.app_discovery')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.how_users_found')}</p>
                        </div>

                        <div style={{ height: '400px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    key="app-discovery-chart"
                                    data={referralSourceData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 100
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="name"
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
                                        label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, 'Percentage']}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#3498DB"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={60}
                                        animationDuration={0}
                                    >
                                        {referralSourceData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
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

export default AppDiscoveryChart;