// import React, { useState, useEffect } from 'react';
// import {
//   Grid,
//   Card,
//   CardContent,
//   Typography,
//   Box,
//   CardHeader,
//   Divider,
//   Button,
//   Collapse,
//   CardMedia,
//   Chip
// } from '@mui/material';
// import { CalendarToday, Description, AccessTime, ExpandMore, ExpandLess, Place } from '@mui/icons-material';
// import axios from 'axios';

// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// const Event = () => {
//   const [events, setEvents] = useState([]);
//   const [error, setError] = useState(null);
//   const [expandedIds, setExpandedIds] = useState({});
//   const churchId = localStorage.getItem('churchId');

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const fetchEvents = async () => {
//     try {
//       const response = await axios.get(`${apiBaseUrl}/event/fetchAll/${churchId}`);
//       console.log("response", response);
//       setEvents(response.data);
//     } catch (err) {
//       setError(err.message || "Error fetching Events");
//       console.error("Error fetching events:", err);
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   const formatTime = (dateString) => {
//     return new Date(dateString).toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleExpandClick = (eventId) => {
//     setExpandedIds(prev => ({
//       ...prev,
//       [eventId]: !prev[eventId]
//     }));
//   };

//   if (error) {
//     return (
//       <Box p={3}>
//         <Typography color="error" align="center">
//           Error loading events: {error}
//         </Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box p={3}>
//       <Typography
//         variant="h4"
//         align="center"
//         className='black'
//         gutterBottom
//         sx={{
//           fontWeight: 'bold',
//           color: '#1a237e',
//           marginBottom: '32px'
//         }}
//       >
//         Upcoming Events
//       </Typography>

//       <Grid container spacing={3}>
//         {events.length > 0 ? (
//           events.map((event) => (
//             <Grid item xs={12} sm={6} md={4} key={event._id}>
//               <Card
//                 sx={{
//                   height: '100%',
//                   display: 'flex',
//                   flexDirection: 'column',
//                   transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
//                   '&:hover': {
//                     transform: 'translateY(-4px)',
//                     boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
//                   },
//                   borderRadius: '12px',
//                   overflow: 'hidden',
//                 }}
//               >
//                 {/* Display first image if available */}
//                 {/* {event.images && event.images.length > 0 && (
//                   <CardMedia
//                     component="img"
//                     height="180"
//                     image={event.images[0]}
//                     alt={event.name}
//                     sx={{ objectFit: 'cover' }}
//                   />
//                 )} */}

//                 <CardHeader
//                   title={
//                     <Typography
//                       className='black'
//                       variant="h6"
//                       sx={{
//                         fontWeight: 'bold',
//                         color: '#1a237e',
//                         fontSize: '1.1rem'
//                       }}
//                     >
//                       {event.name}
//                     </Typography>
//                   }
//                 />
//                 <Divider />
//                 <CardContent sx={{ flexGrow: 1 }}>
//                   {/* Date */}
//                   <Box
//                     className='black'
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       marginBottom: '12px',
//                       color: '#1976d2'
//                     }}
//                   >
//                     <CalendarToday
//                       fontSize="small"
//                       sx={{ marginRight: '8px' }}
//                     />
//                     <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
//                       {formatDate(event.date)}
//                     </Typography>
//                   </Box>

//                   {/* Time */}
//                   <Box
//                     className='black'
//                     sx={{
//                       display: 'flex',
//                       alignItems: 'center',
//                       marginBottom: '12px',
//                       color: '#1976d2'
//                     }}
//                   >
//                     <AccessTime
//                       fontSize="small"
//                       sx={{ marginRight: '8px' }}
//                     />
//                     <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
//                       {formatTime(event.date)}
//                     </Typography>
//                   </Box>

//                   {/* Location */}
//                   {event.event_church_location && (
//                     <Box
//                       className='black'
//                       sx={{
//                         display: 'flex',
//                         alignItems: 'center',
//                         marginBottom: '12px',
//                         color: '#1976d2'
//                       }}
//                     >
//                       <Place
//                         fontSize="small"
//                         sx={{ marginRight: '8px' }}
//                       />
//                       <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
//                         {event.event_church_location}
//                       </Typography>
//                     </Box>
//                   )}

//                   {/* Description with expand/collapse */}
//                   {event.description && (
//                     <Box>
//                       <Box
//                         sx={{
//                           display: 'flex',
//                           alignItems: 'flex-start',
//                           marginTop: 2,
//                           marginBottom: 1
//                         }}
//                       >
//                         <Box
//                           sx={{
//                             backgroundColor: '#f5f5f5',
//                             borderRadius: '50%',
//                             padding: '8px',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                             marginRight: '12px'
//                           }}
//                         >
//                           <Description fontSize="small" />
//                         </Box>

//                         <Box sx={{ flexGrow: 1 }}>
//                           <Typography variant="body2" 
//                             sx={{
//                               color: 'rgba(0, 0, 0, 0.6)',
//                               lineHeight: 1.6,
//                               overflow: 'hidden',
//                               display: expandedIds[event._id] ? 'block' : '-webkit-box',
//                               WebkitBoxOrient: 'vertical',
//                               WebkitLineClamp: 3,
//                             }}
//                           >
//                             {event.description}
//                           </Typography>
//                         </Box>
//                       </Box>

//                       <Button
//                         onClick={() => handleExpandClick(event._id)}
//                         fullWidth
//                         size="small"
//                         sx={{ 
//                           textTransform: 'none', 
//                           color: '#1976d2',
//                           mt: 1 
//                         }}
//                         endIcon={expandedIds[event._id] ? <ExpandLess /> : <ExpandMore />}
//                       >
//                         {expandedIds[event._id] ? 'Show less' : 'Read more'}
//                       </Button>
//                     </Box>
//                   )}

//                   {/* Additional images when expanded */}

//                   {expandedIds[event._id] && event.images && event.images.length > 1 && (

//                     <Box mt={2}>
//                       <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
//                         Event Photos
//                       </Typography>
//                       <Box 
//                         sx={{ 
//                           display: 'flex', 
//                           flexWrap: 'wrap', 
//                           gap: 1 
//                         }}
//                       >
//                         {event.images.slice(1).map((img, index) => (
//                           <Box
//                             key={index}
//                             sx={{
//                               width: 80,
//                               height: 80,
//                               borderRadius: 1,
//                               overflow: 'hidden'
//                             }}
//                           >
//                             <img
//                               src={img}
//                               alt={`Event image ${index + 2}`}
//                               style={{
//                                 width: '100%',
//                                 height: '100%',
//                                 objectFit: 'cover'
//                               }}
//                             />
//                           </Box>
//                         ))}
//                       </Box>
//                     </Box>
//                   )}
//                 </CardContent>
//               </Card>
//             </Grid>
//           ))
//         ) : (
//           <Grid item xs={12}>
//             <Box
//               sx={{
//                 display: 'flex',
//                 justifyContent: 'center',
//                 alignItems: 'center',
//                 minHeight: '200px'
//               }}
//             >
//               <Typography
//                 variant="h6"
//                 sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
//               >
//                 No events available at the moment
//               </Typography>
//             </Box>
//           </Grid>
//         )}
//       </Grid>
//     </Box>
//   );
// };

// export default Event;


import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CardHeader,
  Divider,
  Button,
  Dialog,
  IconButton,
  DialogContent,
  Chip,
} from '@mui/material';
import { CalendarToday, Description, AccessTime, ExpandMore, ExpandLess, Place, Close } from '@mui/icons-material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Event = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null);
  const churchId = localStorage.getItem('churchId');
  const descriptionRefs = useRef({});

  useEffect(() => {
    fetchEvents();
  }, []);

  // Check if description needs "Read more" button after events are loaded
  useEffect(() => {
    setTimeout(() => {
      events.forEach(event => {
        if (descriptionRefs.current[event._id]) {
          const element = descriptionRefs.current[event._id];
          // Check if content height exceeds 2 lines (approx 48px with 1.6 line height)
          const needsReadMore = element.scrollHeight > 48;

          // Only add to expandedIds if not already there and needs read more
          if (needsReadMore && expandedIds[event._id] === undefined) {
            setExpandedIds(prev => ({
              ...prev,
              [event._id]: false
            }));
          }
        }
      });
    }, 100); // Small delay to ensure DOM is fully rendered
  }, [events]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/event/fetchAll?churchId=${churchId}`);
      console.log("response", response);
      const events = response.data || [];

      const lang = i18n.language;
      console.log('[FETCH] Current language:', lang);

      if (lang !== 'en' && events.length > 0) {
        console.log('[FETCH] Translating event data to:', lang);
        const translatedEvents = await Promise.all(
          events.map(async (event, i) => {
            console.log(`[TRANSLATING] (${i + 1}) Event: ${event.title}`);
            const fieldsToTranslate = ['title', 'description', 'location']; // Adjust based on actual event fields
            const translatedFields = {};

            for (const field of fieldsToTranslate) {
              if (event[field]) {
                console.log(`[TRANSLATING] ${field}: ${event[field]}`);
                translatedFields[field] = await translateText(event[field], lang);
                console.log(`[TRANSLATED] ${field}: ${translatedFields[field]}`);
              }
            }

            return {
              ...event,
              ...translatedFields,
            };
          })
        );
        console.log('[FETCH] Translated events:', translatedEvents);
        setEvents(translatedEvents);
      } else {
        setEvents(events);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message || t('events.errors.error_fetching_events'));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };
  const formatTime = (dateString) => {

    const date = new Date(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();

    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const handleExpandClick = (eventId) => {
    setExpandedIds(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleImageClick = (imageUrl) => {
    setZoomedImage(imageUrl);
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" align="center">
          {t('events.errors.error_loading_events', { error })}        </Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        align="center"
        className='black'
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: '#1a237e',
          marginBottom: '32px'
        }}
      >
        {t('events.labels.upcoming_events')}
      </Typography>

      <Grid container spacing={3} alignItems="flex-start">
        {events.length > 0 ? (
          events.map((event) => {
            const isExpired = new Date(event.date) < new Date();
            return (
              <Grid item xs={12} sm={6} md={4} key={event._id}>
                <Card
                  sx={{
                    height: 'auto',  // Change from 100% to auto
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    },
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: isExpired ? '#f5f5f5' : '#ffffff',
                    position: 'relative',  // Add this
                  }}
                >
                  <CardHeader
                    title={
                      <Typography
                        className='black'
                        variant="h6"
                        sx={{
                          fontWeight: 'bold',
                          color: '#1a237e',
                          fontSize: '1.1rem'
                        }}
                      >
                        {event.name}
                      </Typography>
                    }
                  />
                  <Divider />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        color: '#1976d2',
                      }}
                    >
                      <CalendarToday
                        fontSize="small"
                        sx={{ marginRight: '8px' }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {formatDate(event.date)}
                      </Typography>

                      {new Date(event.date) < new Date() && (
                        <Chip
                          label={t('events.labels.expired')} color="error"
                          size="small"
                          sx={{ ml: 2, fontWeight: 500 }}
                        />
                      )}
                    </Box>


                    {/* Time */}
                    <Box
                      className='black'
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '12px',
                        color: '#1976d2'
                      }}
                    >
                      <AccessTime fontSize="small" sx={{ marginRight: '8px' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {formatTime(event.date)}
                      </Typography>
                    </Box>

                    {/* Location */}
                    {event.event_church_location && (
                      <Box
                        className='black'
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '12px',
                          color: '#1976d2'
                        }}
                      >
                        <Place fontSize="small" sx={{ marginRight: '8px' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {event.event_church_location}
                        </Typography>
                      </Box>
                    )}

                    {/* Description */}
                    {event.description && (
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            marginTop: 2,
                            marginBottom: 1
                          }}
                        >
                          <Box
                            sx={{
                              backgroundColor: '#f5f5f5',
                              borderRadius: '50%',
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '12px'
                            }}
                          >
                            <Description fontSize="small" />
                          </Box>


                          <Box sx={{ flexGrow: 1, position: 'relative' }}>  {/* Add position relative here */}
                            <Typography
                              variant="body2"
                              ref={el => descriptionRefs.current[event._id] = el}
                              sx={{
                                color: 'rgba(0, 0, 0, 0.6)',
                                lineHeight: 1.6,
                                overflow: 'hidden',
                                display: expandedIds[event._id] === false ? '-webkit-box' : 'block',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                maxHeight: expandedIds[event._id] === false ? '48px' : 'none',
                                position: expandedIds[event._id] ? 'relative' : 'static',  // Add this
                                zIndex: expandedIds[event._id] ? 10 : 1,  // Add this
                                backgroundColor: isExpired ? '#f5f5f5' : '#ffffff',
                              }}
                            >
                              {event.description}
                            </Typography>
                          </Box>
                        </Box>

                        {expandedIds[event._id] !== undefined && (
                          <Button
                            onClick={() => handleExpandClick(event._id)}
                            fullWidth
                            size="small"
                            sx={{
                              textTransform: 'none',
                              color: '#1976d2',
                              mt: 1
                            }}
                            endIcon={expandedIds[event._id] ? <ExpandLess /> : <ExpandMore />}
                          >
                            {expandedIds[event._id] ? t('events.buttons.show_less') : t('events.buttons.read_more')}                          </Button>
                        )}
                      </Box>
                    )}

                    {/* Images */}
                    {event.images && event.images.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          {t('events.labels.event_photos')}                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1
                          }}
                        >
                          {event.images.map((img, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 1,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                }
                              }}
                              onClick={() => handleImageClick(img)}
                            >
                              <img
                                src={img}
                                alt={t('events.alt.event_image', { number: index + 1 })} style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px'
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
              >
                {t('events.messages.no_events_available')}              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Image Zoom Dialog */}
      <Dialog
        open={zoomedImage !== null}
        onClose={handleCloseZoom}
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden'
          }
        }}
      >
        <IconButton
          onClick={handleCloseZoom}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.7)'
            }
          }}
        >
          <Close />
        </IconButton>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt={t('events.alt.zoomed_event')}
              style={{
                width: '100%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Event;