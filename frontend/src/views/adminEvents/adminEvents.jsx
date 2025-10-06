import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CardHeader,
  Divider,
} from '@mui/material';
import { CalendarToday, Description } from '@mui/icons-material';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Event = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const churchId = localStorage.getItem('churchId');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
        const response = await axios.get(`${apiBaseUrl}/event/fetchAll/${churchId}`); 
        console.log("response", response)
      setEvents(response.data);
    } catch (err) {
      setError(err.message || "Error fetching Events");
      console.error("Error fetching events:", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error" align="center">
          Error loading events: {error}
        </Typography>
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
        Upcoming Events
      </Typography>

      <Grid container spacing={3}>
        {events.length > 0 ? (
          events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  },
                  borderRadius: '12px',
                  overflow: 'hidden',
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
                <CardContent>
                  <Box 
                    className='black' 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '12px',
                      color: '#1976d2'
                    }}
                  >
                    <CalendarToday 
                      fontSize="small" 
                      sx={{ marginRight: '8px' }}
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {formatDate(event.date)}
                    </Typography>
                  </Box>
                  
                  {event.description && (
                    <Box 
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginTop: 2
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
                      <Typography 
                        variant="body2" 
                        sx={{
                          color: 'rgba(0, 0, 0, 0.6)',
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 3,
                        }}
                      >
                        {event.description}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
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
                No events available at the moment
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Event;