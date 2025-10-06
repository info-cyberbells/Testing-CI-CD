import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const CreateLanguageDialog = ({
  showAddLanguageModal,
  setShowAddLanguageModal,
  newLanguageName,
  setNewLanguageName,
  newMaleVoices,
  setNewMaleVoices,
  newFemaleVoices,
  setNewFemaleVoices,
  handleCreateLanguage
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

  // Function to add voice input field
  const addVoiceField = (type) => {
    if (type === 'male') {
      setNewMaleVoices([...newMaleVoices, '']);
    } else {
      setNewFemaleVoices([...newFemaleVoices, '']);
    }
  };

  // Function to remove voice input field
  const removeVoiceField = (type, index) => {
    if (type === 'male') {
      const updated = newMaleVoices.filter((_, i) => i !== index);
      setNewMaleVoices(updated.length === 0 ? [''] : updated);
    } else {
      const updated = newFemaleVoices.filter((_, i) => i !== index);
      setNewFemaleVoices(updated.length === 0 ? [''] : updated);
    }
  };

  // Function to update voice input
  const updateVoiceField = (type, index, value) => {
    if (type === 'male') {
      const updated = [...newMaleVoices];
      updated[index] = value;
      setNewMaleVoices(updated);
    } else {
      const updated = [...newFemaleVoices];
      updated[index] = value;
      setNewFemaleVoices(updated);
    }
  };

  return (
    <Dialog open={showAddLanguageModal} onClose={() => setShowAddLanguageModal(false)} fullWidth maxWidth="sm">
      <DialogTitle>{t('church.createNewLanguage')}</DialogTitle>
      <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Box sx={{ mt: 2 }}>
          <TextField
            label={t('church.languageName')}
            fullWidth
            margin="normal"
            value={newLanguageName}
            onChange={(e) => setNewLanguageName(e.target.value)}
            placeholder="e.g., Japanese, Korean, Arabic"
            sx={getTextFieldStyles}
          />

          {/* Male Voices Section */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#231f20' }}>
            {t('church.maleVoices')}
          </Typography>
          {newMaleVoices.map((voice, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                label={`${t('church.maleVoiceId')} ${index + 1}`}
                fullWidth
                value={voice}
                onChange={(e) => updateVoiceField('male', index, e.target.value)}
                placeholder="e.g., jap-m1, kor-m1"
                sx={getTextFieldStyles}
              />
              {newMaleVoices.length > 1 && (
                <Button
                  color="error"
                  onClick={() => removeVoiceField('male', index)}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  ✕
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            size="small"
            onClick={() => addVoiceField('male')}
            sx={{ mt: 1, color: '#231f20', borderColor: '#231f20' }}
          >
            {t('church.addMaleVoice')}
          </Button>

          {/* Female Voices Section */}
          <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#231f20' }}>
            {t('church.femaleVoices')}
          </Typography>
          {newFemaleVoices.map((voice, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                label={`${t('church.femaleVoiceId')} ${index + 1}`}
                fullWidth
                value={voice}
                onChange={(e) => updateVoiceField('female', index, e.target.value)}
                placeholder="e.g., jap-f1, kor-f1"
                sx={getTextFieldStyles}
              />
              {newFemaleVoices.length > 1 && (
                <Button
                  color="error"
                  onClick={() => removeVoiceField('female', index)}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  ✕
                </Button>
              )}
            </Box>
          ))}
          <Button
            variant="outlined"
            size="small"
            onClick={() => addVoiceField('female')}
            sx={{ mt: 1, color: '#231f20', borderColor: '#231f20' }}
          >
            {t('church.addFemaleVoice')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setShowAddLanguageModal(false);
            setNewLanguageName('');
            setNewMaleVoices(['']);
            setNewFemaleVoices(['']);
          }}
          variant="outlined"
          sx={{ color: '#231f20', borderColor: '#231f20' }}
        >
          {t('church.cancel')}
        </Button>
        <Button
          onClick={handleCreateLanguage}
          variant="contained"
          sx={{ backgroundColor: '#231f20', color: 'white' }}
          disabled={!newLanguageName.trim()}
        >
          {t('church.createLanguageButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateLanguageDialog;