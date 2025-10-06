import React, { useState, useEffect } from 'react';
import {
    Card,
    Container,
    Typography,
    Box,
    Paper,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
    Grid,
    Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';


const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    marginTop: theme.spacing(3),
    borderRadius: '12px',
    overflow: 'hidden',
    '& .MuiTableHead-root': {
        backgroundColor: theme.palette.grey[900],
        '& .MuiTableCell-head': {
            color: 'white',
            fontWeight: 600,
            fontSize: '0.95rem',
            padding: theme.spacing(2),
        }
    },
    '& .MuiTableBody-root': {
        '& .MuiTableRow-root': {
            '&:nth-of-type(even)': {
                backgroundColor: '#f8f9fa',
            },
            '&:hover': {
                backgroundColor: '#e3f2fd',
                transform: 'scale(1.002)',
                transition: 'all 0.2s ease',
            },
        },
        '& .MuiTableCell-root': {
            padding: theme.spacing(2),
            borderBottom: '1px solid #e0e0e0',
        }
    }
}));


const AdminFeedbackDashboard = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, feedbackId: null });
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [stats, setStats] = useState({ total: 0, audioFeedback: 0, feedbackOnly: 0 });

    useEffect(() => {
        fetchAllFeedbacks();
    }, []);

    const fetchAllFeedbacks = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/feedback/getAllFeedback`);

            if (response.data?.success) {
                const feedbackData = response.data.data || [];
                setFeedbacks(feedbackData);
                calculateStats(feedbackData);
            } else {
                toast.error(t('reviews.messages.fetchError'));
                setFeedbacks([]);
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            toast.error(t('reviews.messages.fetchError'));
            setFeedbacks([]);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (feedbackData) => {
        const total = feedbackData.length;
        const audioFeedback = feedbackData.filter(f => f.audioQuality).length;
        const feedbackOnly = feedbackData.filter(f => f.feedbackType && !f.audioQuality).length;
        setStats({ total, audioFeedback, feedbackOnly });
    };

    const handleDelete = async (feedbackId) => {
        try {
            const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/feedback/deleteFeedback?id=${feedbackId}`);
            if (response.data?.success) {
                toast.success(t('reviews.messages.deleteSuccess'));
                const updatedFeedbacks = feedbacks.filter(f => f._id !== feedbackId);
                setFeedbacks(updatedFeedbacks);
                calculateStats(updatedFeedbacks);
            } else {
                toast.error(t('reviews.messages.deleteError'));
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            toast.error(t('reviews.messages.deleteError'));
        } finally {
            setDeleteDialog({ open: false, feedbackId: null });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ borderRadius: 2 }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" sx={{ color: '#231f20', fontWeight: '600', mb: 2 }}>
                        {t('reviews.adminDashboard.allSubmissions', { count: feedbacks.length })}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : feedbacks.length === 0 ? (
                        <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: '#666' }}>
                            {t('reviews.adminDashboard.noSubmissions')}
                        </Typography>
                    ) : (
                        <StyledTableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('reviews.adminDashboard.table.date')}</TableCell>
                                        <TableCell>{t('reviews.adminDashboard.table.userId')}</TableCell>
                                        <TableCell>{t('reviews.adminDashboard.table.type')}</TableCell>
                                        <TableCell>{t('reviews.adminDashboard.table.audio')}</TableCell>
                                        <TableCell>{t('reviews.adminDashboard.table.comment')}</TableCell>
                                        <TableCell align="center">{t('reviews.adminDashboard.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {feedbacks.map(f => (
                                        <TableRow key={f._id}>
                                            <TableCell>{formatDate(f.createdAt)}</TableCell>
                                            <TableCell>{f.userId ? `${f.userId.firstName} ${f.userId.lastName}` : 'N/A'}</TableCell>
                                            <TableCell>{f.feedbackType || 'N/A'}</TableCell>
                                            <TableCell>{f.audioQuality || 'N/A'}</TableCell>
                                            <TableCell sx={{ maxWidth: 250 }}>
                                                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', lineHeight: 1.4, color: '#666', fontStyle: f.comment ? 'normal' : 'italic' }}>
                                                    {f.comment || t('reviews.adminDashboard.noComment')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Details">
                                                    <IconButton color="primary" onClick={() => setSelectedFeedback(f)}>
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('reviews.adminDashboard.delete')}>
                                                    <IconButton color="error" onClick={() => setDeleteDialog({ open: true, feedbackId: f._id })}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </StyledTableContainer>
                    )}
                </Box>
            </Paper>

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, feedbackId: null })}>
                <DialogTitle>{t('reviews.adminDashboard.confirmDeleteTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t('reviews.adminDashboard.confirmDeleteMessage')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, feedbackId: null })} sx={{ color: '#666' }}>
                        {t('reviews.adminDashboard.cancel')}
                    </Button>
                    <Button onClick={() => handleDelete(deleteDialog.feedbackId)} color="error" variant="contained">
                        {t('reviews.adminDashboard.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!selectedFeedback} onClose={() => setSelectedFeedback(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#231f20' }}>
                    {t('reviews.adminDashboard.dialog.title')}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedFeedback && (
                        <Grid container spacing={3}>
                            {/* User Info */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f5f5f5', height: '100%' }}>
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: '600', color: '#333' }}>
                                        {t('reviews.adminDashboard.dialog.userInfo')}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.userId')}:</b> {selectedFeedback.userId?._id}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.name')}:</b> {selectedFeedback.userId?.firstName} {selectedFeedback.userId?.lastName}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.email')}:</b> {selectedFeedback.userId?.email}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.suburb')}:</b> {selectedFeedback.userId?.suburb}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.faithLevel')}:</b> {selectedFeedback.userId?.faithLevel}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.language')}:</b> {selectedFeedback.userId?.language}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Feedback Info */}
                            <Grid item xs={12} md={6}>
                                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f5f5f5', height: '100%' }}>
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: '600', color: '#333' }}>
                                        {t('reviews.adminDashboard.dialog.feedbackInfo')}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.type')}:</b> {selectedFeedback.feedbackType || t('reviews.adminDashboard.dialog.na')}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.audioQuality')}:</b> {selectedFeedback.audioQuality || t('reviews.adminDashboard.dialog.na')}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.comment')}:</b> {selectedFeedback.comment || t('reviews.adminDashboard.dialog.na')}
                                    </Typography>
                                    <Typography sx={{ mb: 0.5 }}>
                                        <b>{t('reviews.adminDashboard.dialog.date')}:</b> {formatDate(selectedFeedback.createdAt)}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setSelectedFeedback(null)} variant="contained" color="primary">
                        {t('reviews.adminDashboard.dialog.close')}
                    </Button>
                </DialogActions>
            </Dialog>


            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </Container>
    );
};

export default AdminFeedbackDashboard;
