import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

const LanguagesByCountryChart = ({
    languagesByCountryData,
    selectedCountryLanguage,
    setSelectedCountryLanguage,
    userType,
    isInitialDataLoading,
    isApplyingFilters,
    BarChartSkeleton
}) => {
    const { t } = useTranslation();

    // Get available countries
    const availableCountries = Object.keys(languagesByCountryData);

    // Fix: If selectedCountryLanguage is 'all' or invalid, use first available country
    const currentCountry = (selectedCountryLanguage === 'all' || !availableCountries.includes(selectedCountryLanguage))
        ? availableCountries[0]
        : selectedCountryLanguage;

    // Transform data for the chart - single country only
    const getChartData = () => {
        const countryData = languagesByCountryData[currentCountry] || {};
        return Object.entries(countryData).map(([language, count]) => ({
            language,
            count
        }));
    };

    const chartData = getChartData();

    const generateCountryColor = (country, index) => {
        const hue = (index * 137.5) % 360;
        const saturation = 65 + (index % 3) * 10;
        const lightness = 45 + (index % 4) * 5;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    return (
        <div style={{ width: '100%', height: '440px' }}>
            <div style={{
                height: '100%',
                width: '100%',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
                overflow: 'hidden'
            }}>
                {(isInitialDataLoading || isApplyingFilters) ? (
                    <BarChartSkeleton />
                ) : !languagesByCountryData || Object.keys(languagesByCountryData).length === 0 || chartData.length === 0 || chartData.every(item => item.count === 0) ? (
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
                            }}>{t('dashboard.charts.languages_by_country')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.user_distribution')}</p>
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
                                    <span style={{ fontSize: '24px', color: '#6c757d' }}>🗺️</span>
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
                            }}>{t('dashboard.charts.languages_by_country')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.user_distribution')}</p>
                        </div>

                        {/* Country Filter */}
                        {parseInt(userType) !== 2 && (
                            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                                <select
                                    value={currentCountry}
                                    onChange={(e) => setSelectedCountryLanguage(e.target.value)}
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
                                    {availableCountries.map(country => (
                                        <option key={country} value={country}>
                                            {country}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div style={{ height: '350px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    key="languages-by-country-chart"
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
                                        dataKey="language"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#6c757d' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        interval={0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6c757d' }}
                                        label={{ value: 'Users', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                    />

                                    <Bar
                                        dataKey="count"
                                        fill={generateCountryColor(currentCountry, availableCountries.indexOf(currentCountry))}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={60}
                                        animationDuration={0}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LanguagesByCountryChart;