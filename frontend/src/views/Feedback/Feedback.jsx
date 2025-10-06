import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    CircularProgress,
    Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const StyledSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4)
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#231f20' },
        '&:hover fieldset': { borderColor: '#231f20' },
        '&.Mui-focused fieldset': { borderColor: '#231f20' },
    },
    '& .MuiInputLabel-root': {
        color: '#231f20',
        '&.Mui-focused': { color: '#231f20' },
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#231f20' },
        '&:hover fieldset': { borderColor: '#231f20' },
        '&.Mui-focused fieldset': { borderColor: '#231f20' },
    },
    '& .MuiInputLabel-root': {
        color: '#231f20',
        '&.Mui-focused': { color: '#231f20' },
    },
}));

const FeedbackForm = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const [formData, setFormData] = useState({
        feedbackType: '',
        audioQuality: '',
        comment: ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.feedbackType) {
            newErrors.feedbackType = t('feedback.errors.selectType');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};

        if (!formData.feedbackType) {
            newErrors.feedbackType = t('feedback.errors.selectType');
        }

        const userId = localStorage.getItem('userId');
        if (formData.audioQuality && !userId) {
            newErrors.audioQuality = t('feedback.errors.userNotFound');
        }

        if ((formData.feedbackType || formData.audioQuality) && !formData.comment?.trim()) {
            newErrors.comment = t('feedback.errors.commentRequired');
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setIsLoading(true);

        try {
            const payload = { ...formData, userId };
            if (!payload.audioQuality) delete payload.audioQuality;
            const response = await axios.post(`${apiBaseUrl}/feedback/addFeedback`, payload);


            if (response.data?.success) {
                toast.success(t('feedback.messages.submitSuccess'));
                setFormData({ feedbackType: '', audioQuality: '', comment: '' });
            } else {
                toast.error(t('feedback.messages.submitError'));
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error(error.response?.data?.message || t('feedback.messages.submitError'));
        } finally {
            setIsLoading(false);
        }
    };

    const feedbackTypes = ["General Feedback", "Complaint", "Suggestion"];
    const audioOptions = ["Good", "Average", "Poor"];

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{ color: '#231f20', textAlign: 'center', fontWeight: 600, mb: 4 }}
                >
                    {t('feedback.heading')}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{ color: '#231f20', textAlign: 'center', mb: 4 }}
                >
                    {t('feedback.subheading')}
                </Typography>

                {submitStatus && (
                    <Alert
                        severity={submitStatus.type}
                        sx={{ mb: 3 }}
                        onClose={() => setSubmitStatus(null)}
                    >
                        {submitStatus.message}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <StyledSection>
                        <StyledFormControl fullWidth error={!!errors.feedbackType}>
                            <InputLabel>{t('feedback.fields.type')}</InputLabel>
                            <Select
                                value={formData.feedbackType}
                                onChange={(e) => handleInputChange('feedbackType', e.target.value)}
                                label={t('feedback.fields.type')}
                            >
                                {feedbackTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t(`feedback.types.${type.replace(/\s/g, '')}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.feedbackType && <FormHelperText>{errors.feedbackType}</FormHelperText>}
                        </StyledFormControl>
                    </StyledSection>

                    <StyledSection>
                        <StyledFormControl fullWidth>
                            <InputLabel>{t('feedback.fields.audioQuality')}</InputLabel>
                            <Select
                                value={formData.audioQuality}
                                onChange={(e) => handleInputChange('audioQuality', e.target.value)}
                                label={t('feedback.fields.audioQuality')}
                            >
                                {audioOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {t(`feedback.audio.${opt}`)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </StyledFormControl>
                    </StyledSection>

                    {(formData.feedbackType || formData.audioQuality) && (
                        <StyledTextField
                            label={t('feedback.fields.comment')}
                            multiline
                            rows={4}
                            fullWidth
                            value={formData.comment}
                            onChange={(e) => handleInputChange('comment', e.target.value)}
                            placeholder={t('feedback.fields.commentPlaceholder')}
                            error={!!errors.comment}
                            helperText={errors.comment}
                        />
                    )}


                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={() => {
                                setFormData({ feedbackType: '', audioQuality: '', comment: '' });
                                setErrors({});
                            }}
                            sx={{
                                color: '#231f20',
                                borderColor: '#231f20',
                                '&:hover': { backgroundColor: '#f5f5f5', borderColor: '#231f20' },
                            }}
                            disabled={isLoading}
                        >
                            {t('feedback.buttons.clearForm')}
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            sx={{
                                backgroundColor: '#231f20',
                                color: 'white',
                                px: 4,
                                '&:hover': { backgroundColor: '#3d3a3b' },
                                '&:disabled': { backgroundColor: '#ccc' },
                            }}
                        >
                            {isLoading ? <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} /> : t('feedback.buttons.submitFeedback')}
                        </Button>
                    </Box>
                </form>

                <Box sx={{ mt: 4, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: '#231f20', textAlign: 'center' }}>
                        {t('feedback.footer')}
                    </Typography>
                </Box>
            </Paper>

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
            />
        </Container>
    );
};

export default FeedbackForm;
