import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    MenuItem
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const LanguageSelectionDialog = ({
    showLanguageDialog,
    setShowLanguageDialog,
    selectedCategory,
    selectedVoiceType,
    selectedLanguage,
    setSelectedLanguage,
    selectedVoiceId,
    setSelectedVoiceId,
    availableLanguages,
    currentChurch,
    handleLanguageSubmit,
    setShowAddLanguageModal
}) => {
    const { t } = useTranslation();

    const getTextFieldStyles = {
        '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#231f20' },
            '&:hover fieldset': { borderColor: '#231f20' },
            '&.Mui-focused fieldset': { borderColor: '#231f20' }
        },
        '& .MuiInputLabel-root': { color: '#231f20' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' }
    };

    return (
        <Dialog open={showLanguageDialog} onClose={() => setShowLanguageDialog(false)} fullWidth maxWidth="sm">
            <DialogTitle>
                {t('church.addLanguageTo')} {selectedCategory === 'goLive' ? t('church.goLiveLanguages') : t('church.joinLiveLanguages')} - {selectedVoiceType === 'male' ? t('church.maleVoices') : t('church.femaleVoices')}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <TextField
                        select
                        label={t('church.selectLanguage')}
                        fullWidth
                        margin="normal"
                        value={selectedLanguage}
                        onChange={(e) => {
                            setSelectedLanguage(e.target.value);
                            setSelectedVoiceId('');
                        }}
                        sx={getTextFieldStyles}
                    >
                        <MenuItem value="">
                            <em>{t('church.selectAnOption')}</em>
                        </MenuItem>
                        {availableLanguages
                            .filter(lang => {
                                // Get current languages already added to this category and voice type
                                const currentlyAddedLanguages = currentChurch.languageSettings?.[selectedCategory]?.[selectedVoiceType] || [];
                                // Get list of language names already added
                                const addedLanguageNames = currentlyAddedLanguages.map(item => item.language);
                                // Only show languages that aren't already added
                                return !addedLanguageNames.includes(lang.voiceName);
                            })
                            .map((lang) => (
                                <MenuItem key={lang._id} value={lang.voiceName}>
                                    {lang.voiceName}
                                </MenuItem>
                            ))}
                    </TextField>

                    {/* Show "Add a new language" button only when no language is selected */}
                    {!selectedLanguage && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                                {t('church.cantFindLanguage')}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setShowAddLanguageModal(true)}
                                sx={{
                                    color: '#007bff',
                                    borderColor: '#007bff',
                                    fontSize: '12px',
                                    py: 0.5,
                                    px: 2,
                                    '&:hover': { backgroundColor: '#f0f8ff' }
                                }}
                            >
                                {t('church.addNewLanguage')}
                            </Button>
                        </Box>
                    )}

                    {selectedLanguage && (
                        <TextField
                            select
                            label={t('church.selectVoiceId')}
                            fullWidth
                            margin="normal"
                            value={selectedVoiceId}
                            onChange={(e) => setSelectedVoiceId(e.target.value)}
                            sx={getTextFieldStyles}
                        >
                            <MenuItem value="">
                                <em>{t('church.selectAVoice')}</em>
                            </MenuItem>
                            {(() => {
                                const selectedLang = availableLanguages.find(lang => lang.voiceName === selectedLanguage);
                                if (!selectedLang) return [];

                                const voices = [];

                                // Only show voices that match the selected voice type
                                if (selectedVoiceType === 'male' && selectedLang.genderVoices.male) {
                                    selectedLang.genderVoices.male.forEach(voiceId => {
                                        voices.push({
                                            id: voiceId,
                                            label: `${voiceId} (Male Voice)`
                                        });
                                    });
                                } else if (selectedVoiceType === 'female' && selectedLang.genderVoices.female) {
                                    selectedLang.genderVoices.female.forEach(voiceId => {
                                        voices.push({
                                            id: voiceId,
                                            label: `${voiceId} (Female Voice)`
                                        });
                                    });
                                }

                                return voices.map((voice) => (
                                    <MenuItem key={voice.id} value={voice.id}>
                                        {voice.label}
                                    </MenuItem>
                                ));
                            })()}
                        </TextField>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setShowLanguageDialog(false);
                        setSelectedLanguage('');
                        setSelectedVoiceId('');
                    }}
                    variant="outlined"
                    sx={{ color: '#231f20', borderColor: '#231f20' }}
                >
                    {t('church.cancel')}
                </Button>
                <Button
                    onClick={handleLanguageSubmit}
                    variant="contained"
                    sx={{ backgroundColor: '#231f20', color: 'white' }}
                    disabled={!selectedLanguage || !selectedVoiceId}
                >
                    {t('church.addLanguageButton')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LanguageSelectionDialog;