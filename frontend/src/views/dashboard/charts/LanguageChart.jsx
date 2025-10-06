import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';

const LanguageChart = ({
    languageData,
    isInitialDataLoading,
    isApplyingFilters,
    ChartSkeleton
}) => {
    const { t } = useTranslation();
    // Modern color palette for language chart
    const COLORS = ['#41B3A3', '#E8A87C', '#85CDCA', '#8860D0', '#5AB9EA'];

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
                ) : !languageData || languageData.length === 0 || languageData.every(item => item.value === 0) ? (
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
                            }}>{t('dashboard.charts.primary_language')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.overall_breakdown')}</p>
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
                                    <span style={{ fontSize: '24px', color: '#6c757d' }}>📊</span>
                                </div>
                                <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                    {t('dashboard.charts.no_language_data')}
                                </h6>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                    {t('dashboard.charts.no_language_available')}
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
                            }}>{t('dashboard.charts.primary_language')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.overall_breakdown')}</p>
                        </div>

                        <div style={{ height: '400px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={languageData}
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={95}
                                        innerRadius={50}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ value, percent }) => value > 2 ? `${(percent * 100).toFixed(1)}%` : ''}
                                        labelStyle={{
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            fill: '#fff',
                                            textAnchor: 'middle',
                                            dominantBaseline: 'middle'
                                        }}
                                        labelLine={false}
                                    >
                                        {languageData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke="#fff"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `${value}%`}
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
                                        height={50}
                                        wrapperStyle={{
                                            fontSize: '11px',
                                            color: '#495057',
                                            paddingTop: '8px',
                                            marginTop: '-10px',
                                            lineHeight: '1.4'
                                        }}
                                        iconType="circle"
                                        layout="horizontal"
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

export default LanguageChart;