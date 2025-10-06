import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';

const ChurchLocationsMap = ({
    churches,
    selectedChurches,
    selectedCountry,
    setSelectedCountry,
    userType,
    isInitialDataLoading,
    isApplyingFilters,
    getChurchIds
}) => {
    const { t } = useTranslation();

    // Get unique countries from churches
    const countries = [...new Set(churches
        .filter(church => church.country && church.country.trim())
        .map(church => church.country.trim())
    )].sort();

    // Filter churches that have valid coordinates
    let churchesWithLocation = churches.filter(church =>
        church.latitude && church.longitude &&
        church.latitude !== '0' && church.longitude !== '0'
    );

    // Filter by selected churches (if not "select all")
    if (!selectedChurches.includes('select all') && selectedChurches.length > 0) {
        const churchIds = getChurchIds(selectedChurches);
        churchesWithLocation = churchesWithLocation.filter(church =>
            churchIds.includes(church._id)
        );
    }

    if (parseInt(userType) === 2) {
        // For userType 2, show only their church
        const churchId = localStorage.getItem('churchId');
        if (churchId) {
            churchesWithLocation = churchesWithLocation.filter(church =>
                church._id === churchId
            );
        }
    }

    // Apply country filter
    if (selectedCountry !== 'all') {
        churchesWithLocation = churchesWithLocation.filter(church =>
            church.country && church.country.trim() === selectedCountry
        );
    }

    // Calculate center point (average of all coordinates)
    const centerLat = churchesWithLocation.length > 0
        ? churchesWithLocation.reduce((sum, church) => sum + parseFloat(church.latitude), 0) / churchesWithLocation.length
        : 0;
    const centerLng = churchesWithLocation.length > 0
        ? churchesWithLocation.reduce((sum, church) => sum + parseFloat(church.longitude), 0) / churchesWithLocation.length
        : 0;

    // Adjust zoom based on country selection
    const getZoomLevel = () => {
        if (selectedCountry === 'all') return churchesWithLocation.length > 0 ? 2 : 2;
        return 6; // Zoom in more for specific country
    };

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
                    <div>
                        <div className="skeleton-title"></div>
                        <div className="skeleton-subtitle"></div>
                        <div style={{
                            height: '350px',
                            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'loading 1.5s infinite',
                            borderRadius: '8px',
                            marginTop: '20px'
                        }}></div>
                    </div>
                ) : !churches || churches.length === 0 || churchesWithLocation.length === 0 ? (
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
                            }}>{t('dashboard.charts.church_locations')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.distribution')}</p>
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
                                maxWidth: '350px'
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
                                    <span style={{ fontSize: '24px', color: '#6c757d' }}>📍</span>
                                </div>
                                <h6 style={{ color: '#495057', marginBottom: '8px', fontWeight: '600' }}>
                                    {t('dashboard.charts.no_church_locations')}
                                </h6>
                                <p style={{ color: '#6c757d', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>
                                    {parseInt(userType) === 1
                                        ? t('dashboard.charts.add_church_locations')
                                        : t('dashboard.charts.no_location_data')}
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
                            }}>{t('dashboard.charts.church_locations')}</h5>
                            <p style={{
                                color: '#6c757d',
                                textAlign: 'center',
                                fontSize: '12px',
                                marginBottom: '0',
                                marginTop: '0'
                            }}>{t('dashboard.charts.distribution')}</p>
                        </div>

                        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
                            {/* Country Filter - Top Left Corner */}
                            {parseInt(userType) !== 2 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '50px',
                                    zIndex: 1000,
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontSize: '11px',
                                            backgroundColor: 'white',
                                            color: '#333',
                                            minWidth: '110px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <option value="all">{t('dashboard.charts.all_countries')}</option>
                                        {countries.map(country => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <MapContainer
                                key={`${selectedCountry}-${churchesWithLocation.length}`}
                                center={[centerLat || 20, centerLng || 0]}
                                zoom={getZoomLevel()}
                                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {churchesWithLocation.map((church, index) => (
                                    <Marker
                                        key={church._id}
                                        position={[parseFloat(church.latitude), parseFloat(church.longitude)]}
                                        icon={L.icon({
                                            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                                            iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                                            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                                            iconSize: [25, 41],
                                            iconAnchor: [12, 41],
                                        })}
                                    >
                                        <Popup>
                                            <div style={{ textAlign: 'center', padding: '5px' }}>
                                                <strong>{church.name}</strong><br />
                                                <small>{church.city}, {church.state}</small><br />
                                                <small>{church.country}</small>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChurchLocationsMap;