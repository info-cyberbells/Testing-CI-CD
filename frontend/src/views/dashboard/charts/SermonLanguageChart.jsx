import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';

const SermonLanguageChart = ({
    sermonLanguageData,
    isInitialDataLoading,
    isApplyingFilters,
    ChartSkeleton
}) => {
    const { t } = useTranslation();

    // Dynamic color palette - supports 30+ languages
    const COLORS = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
        '#36A2EB', '#FFCE56', '#9966FF', '#FF9F40', '#C9CBCF',
        '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
        '#1ABC9C', '#E67E22', '#95A5A6', '#34495E', '#16A085',
        '#27AE60', '#2980B9', '#8E44AD', '#2C3E50', '#F1C40F'
    ];

    // Transform API data to chart format
    const chartData = (Array.isArray(sermonLanguageData) && !sermonLanguageData[0]?.message)
        ? sermonLanguageData.map(item => ({
            name: item.languageName,
            value: item.percentage,
            count: item.count
        }))
        : [];

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
                    <ChartSkeleton />
                ) : !chartData || chartData.length === 0 || chartData.every(item => item.value === 0) ? (
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
                            }}>
                                {t('dashboard.charts.sermon_languages') || 'Sermon Listening Languages'}
                            </h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>
                                {t('dashboard.charts.language_distribution') || 'Language Usage Distribution'}
                            </p>
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
                                    <span style={{ fontSize: '24px', color: '#6c757d' }}>🌍</span>
                                </div>
                                <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                    {t('dashboard.charts.no_language_data') || 'No Language Data'}
                                </h6>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                    {t('dashboard.charts.no_language_data_available') || 'No sermon listening data available for this period'}
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
                            }}>
                                {t('dashboard.charts.sermon_languages') || 'Sermon Listening Languages'}
                            </h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>
                                {t('dashboard.charts.language_distribution') || 'Language Usage Distribution'}
                            </p>
                        </div>

                        <div style={{ height: '400px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart key="sermon-language-chart">
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={95}
                                        innerRadius={0}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ value }) => value > 2 ? `${value}%` : ''}
                                        labelStyle={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            fill: '#fff',
                                            textAnchor: 'middle',
                                            dominantBaseline: 'middle'
                                        }}
                                        labelLine={false}
                                        animationDuration={0}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke="#fff"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name, props) => [
                                            `${value}% (${props.payload.count} listeners)`,
                                            props.payload.name
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={60}
                                        wrapperStyle={{
                                            fontSize: '11px',
                                            color: '#495057',
                                            paddingTop: '8px',
                                            marginTop: '-10px',
                                            lineHeight: '1.4',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            overflowX: 'auto',
                                            justifyContent: 'center',
                                            maxHeight: '80px'
                                        }}
                                        iconType="circle"
                                        layout="horizontal"
                                        align="center"
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SermonLanguageChart;