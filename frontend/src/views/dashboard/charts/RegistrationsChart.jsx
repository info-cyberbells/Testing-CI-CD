import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const RegistrationsChart = ({
    monthlyBreakdown,
    isInitialDataLoading,
    isApplyingFilters,
    BarChartSkeleton
}) => {
    const { t } = useTranslation();

    // Transform data for church-wise display
    const chartData = useMemo(() => {
        if (!monthlyBreakdown || monthlyBreakdown.length === 0) return [];

        // Each church gets its own bar
        return monthlyBreakdown.map(item => ({
            churchName: item.churchName,
            shortName: item.churchName.length > 20 ?
                item.churchName.substring(0, 20) + '...' :
                item.churchName,
            users: item.count,
            period: item.period,
            fullName: `${item.monthName} ${item.year}`,
            churchId: item.churchId
        }));
    }, [monthlyBreakdown]);

    // Generate colors for churches
    const getChurchColor = (index) => {
        const colors = [
            '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#592E83', '#048A81',
            '#54C6EB', '#FFB400', '#6A994E', '#BC4749', '#386641', '#7209B7',
            '#F72585', '#4361EE', '#F77F00', '#06FFA5'
        ];
        return colors[index % colors.length];
    };

    return (
        <div style={{ width: '100%', height: '440px' }}>
            <div style={{
                height: '100%',
                width: '100%',
                backgroundColor: '#f8f9fa',
                padding: '16px',
                overflow: 'hidden'
            }}>
                {(isInitialDataLoading || isApplyingFilters) ? (
                    <BarChartSkeleton />
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
                            }}>{t('dashboard.charts.new_registrations')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.church_wise_breakdown')}</p>
                        </div>
                    </>
                )}

                {chartData.length > 0 ? (
                    <div style={{ height: '400px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 80
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                    dataKey="shortName"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#6c757d' }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6c757d' }}
                                />
                                <Tooltip
                                    formatter={(value, name) => [value, 'Users']}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload[0]) {
                                            const data = payload[0].payload;
                                            return `${data.churchName} - ${data.fullName}`;
                                        }
                                        return label;
                                    }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        maxWidth: '300px'
                                    }}
                                />
                                <Bar
                                    dataKey="users"
                                    fill={(entry, index) => getChurchColor(index)}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={60}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getChurchColor(index)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : isInitialDataLoading ? (
                    <BarChartSkeleton />
                ) : (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '400px',
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
                                <span style={{ fontSize: '24px', color: '#6c757d' }}>👥</span>
                            </div>
                            <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                {t('dashboard.charts.no_registrations')}
                            </h6>
                            <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                {t('dashboard.charts.no_registrations_message')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistrationsChart;