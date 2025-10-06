import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';


const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const DeleteAccountRequest = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // Store request status

  const deletionReasons = t('deletionReasons', { returnObjects: true });

  const handleReasonChange = (event) => {
    setReason(event.target.value);
  };

  const validateForm = () => {
    const errors = {};
    if (!reason) {
      errors.reason = t('deleteAccountRequest.errorNoReason');
    }
    return errors;
  };


  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const errors = validateForm();
  //   if (Object.keys(errors).length > 0) {
  //     toast.error(errors.reason);
  //     return;
  //   }

  //   setIsSubmitting(true);

  //   try {
  //     const userId = localStorage.getItem('userId');
  //     if (!userId) {
  //       toast.error(t('deleteAccountRequest.errors.userNotFound'));
  //       setIsSubmitting(false);
  //       return;
  //     }

  //     // Submit deletion request
  //     await axios.post(`${apiBaseUrl}/user/request-delete`, {
  //       userId,
  //       reason
  //     });

  //     // Update the request status
  //     await fetchRequestStatus();

  //     toast.success(t('deleteAccountRequest.successMessage'));
  //     setReason('');
  //   } catch (err) {
  //     console.error('Error submitting deletion request:', err);
  //     toast.error(err.response?.data?.error || t('deleteAccountRequest.errors.submitFailed'));
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      toast.error(errors.reason);
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error(t('deleteAccountRequest.userNotFound'));
        setIsSubmitting(false);
        return;
      }
      const language = localStorage.getItem('language');

      const response = await axios.delete(`${apiBaseUrl}/user/delete/${userId}`, {
        data: { reason }
      });
      localStorage.clear();

      if (language) {
        localStorage.setItem('language', language);
      }
      toast.success(response.data?.message || t('deleteAccountRequest.successMessage'));
      setTimeout(() => {
        navigate('/login', { replace: true });
        window.location.href = '/login'; 
      }, 2000);

    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error(err.response?.data?.error || t('deleteAccountRequest.errors.deleteFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };


  //   const renderStatusMessage = () => {
  //     switch (requestStatus) {
  //       case 'pending':
  //         return (
  //           <Typography variant="body1" align="center" sx={{ mt: 2, color: '#ff9800' }}>
  // {t('deleteAccountRequest.pendingMessage')}
  //           </Typography>
  //         );
  //       case 'approved':
  //         return (
  //           <Typography variant="body1" align="center" sx={{ mt: 2, color: '#4caf50' }}>
  // {t('deleteAccountRequest.approvedMessage')}
  //           </Typography>
  //         );
  //       case 'rejected':
  //         return (
  //           <Typography variant="body1" align="center" sx={{ mt: 2, color: '#f44336' }}>
  // {t('deleteAccountRequest.rejectedMessage')}
  //           </Typography>
  //         );
  //       default:
  //         return null;
  //     }
  //   };

  // return (
  //   <React.Fragment>
  //     <ToastContainer
  //       position="top-right"
  //       autoClose={3000}
  //       hideProgressBar={false}
  //       newestOnTop={false}
  //       closeOnClick
  //       rtl={false}
  //       pauseOnFocusLoss
  //       draggable
  //       pauseOnHover
  //       theme="light"
  //     />
  //     <Box
  //       sx={{
  //         maxWidth: 400,
  //         mx: 'auto',
  //         mt: 4,
  //         p: 3,
  //         borderRadius: 2,
  //         boxShadow: 3,
  //         backgroundColor: '#fff',
  //       }}
  //     >
  //       <Typography variant="h5" align="center" gutterBottom>
  //       {t('deleteAccountRequest.title')}        </Typography>
  //       <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
  //       {t('deleteAccountRequest.subtitle')}
  //               </Typography>


  //       {!requestStatus || requestStatus === 'rejected' ? (
  //         <>
  //           <FormControl fullWidth sx={{ mb: 3 }}>
  //           <InputLabel id="delete-reason-label">{t('deleteAccountRequest.reasonLabel')}</InputLabel>              <Select
  //               labelId="delete-reason-label"
  //               label={t('deleteAccountRequest.reasonLabel')}                value={reason}
  //               onChange={handleReasonChange}
  //               disabled={isSubmitting}
  //               sx={{
  //                 '& .MuiOutlinedInput-root': {
  //                   '& fieldset': { borderColor: '#231f20' },
  //                   '&:hover fieldset': { borderColor: '#231f20' },
  //                   '&.Mui-focused fieldset': { borderColor: '#231f20' },
  //                 },
  //                 '& .MuiInputLabel-root': { color: '#231f20' },
  //                 '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' },
  //               }}
  //             >
  //               <MenuItem value="">
  //               <em>{t('deleteAccountRequest.selectReason')}</em>                </MenuItem>
  //               {deletionReasons.map((reasonOption) => (
  //                 <MenuItem key={reasonOption} value={reasonOption}>
  //                   {reasonOption}
  //                 </MenuItem>
  //               ))}
  //             </Select>
  //           </FormControl>

  //           <Button
  //             variant="contained"
  //             color="error"
  //             fullWidth
  //             onClick={handleSubmit}
  //             disabled={isSubmitting}
  //             sx={{
  //               py: 1.5,
  //               backgroundColor: '#231f20',
  //               '&:hover': { backgroundColor: '#1a1718' },
  //               '&.Mui-disabled': { backgroundColor: '#4d4d4d' },
  //             }}
  //           >
  //             {isSubmitting ? (
  //               <CircularProgress size={24} sx={{ color: '#fff' }} />
  //             ) : (
  //               t('deleteAccountRequest.submitButton')              )}
  //           </Button>
  //         </>
  //       ) : null}

  //       {/* Show status message */}
  //       {/* {renderStatusMessage()} */}
  //     </Box>
  //   </React.Fragment>
  // );






  return (
    <React.Fragment>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Box
        sx={{
          maxWidth: 400,
          mx: 'auto',
          mt: 4,
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#fff',
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          {t('deleteAccountRequest.title')}
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
          {t('deleteAccountRequest.subtitle')}
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="delete-reason-label">{t('deleteAccountRequest.reasonLabel')}</InputLabel>
          <Select
            labelId="delete-reason-label"
            label={t('deleteAccountRequest.reasonLabel')}
            value={reason}
            onChange={handleReasonChange}
            disabled={isSubmitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#231f20' },
                '&:hover fieldset': { borderColor: '#231f20' },
                '&.Mui-focused fieldset': { borderColor: '#231f20' },
              },
              '& .MuiInputLabel-root': { color: '#231f20' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' },
            }}
          >
            <MenuItem value="">
              <em>{t('deleteAccountRequest.selectReason')}</em>
            </MenuItem>
            {deletionReasons.map((reasonOption) => (
              <MenuItem key={reasonOption} value={reasonOption}>
                {reasonOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            py: 1.5,
            backgroundColor: '#231f20',
            '&:hover': { backgroundColor: '#1a1718' },
            '&.Mui-disabled': { backgroundColor: '#4d4d4d' },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} sx={{ color: '#fff' }} />
          ) : (
            t('deleteAccountRequest.submitButton')
          )}
        </Button>
      </Box>
    </React.Fragment>
  );



};

export default DeleteAccountRequest;