import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Divider,
  Box,
  FormHelperText,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  Visibility,
  VisibilityOff,
  Person,
  Work,
  Security,
  School,
  AccountBalance,
  Info
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const StaffMemberModal = ({
  open,
  onClose,
  currentUser,
  setCurrentUser,
  modalType,
  validationErrors,
  handleFormSubmit,
  churches,
  userType,
  error
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [expandedSection, setExpandedSection] = useState('basicInfo');

  // Handle input change
  const handleInputChange = (field, value) => {
    setCurrentUser((prevState) => ({
      ...prevState,
      [field]: value
    }));
  };

  // Handle array input change (for comma-separated fields)
  const handleArrayInputChange = (field, value) => {
    setCurrentUser((prevState) => ({
      ...prevState,
      [field]: value
    }));
  };

  // Toggle accordion section
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // Common TextField props for consistent styling
  const textFieldProps = {
    fullWidth: true,
    margin: "normal",
    variant: "outlined",
    size: "small",
    sx: {
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: '#231f20'
        },
        '&:hover fieldset': {
          borderColor: '#231f20'
        },
        '&.Mui-focused fieldset': {
          borderColor: '#231f20'
        }
      },
      '& .MuiInputLabel-root': {
        color: '#231f20'
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: '#231f20'
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{
        // backgroundColor: '#231f20', 
        color: 'black',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {/* <Person />  */}
        {modalType === 'Save' ? t('staffmember.modal.title_save') : t('staffmember.modal.title_update')}      </DialogTitle>

      <DialogContent sx={{ p: 2, mt: 1 }}>
        <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 1 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2, p: 1, bgcolor: '#fff4f4', borderRadius: 1 }}>
              {error}
            </Typography>
          )}

          {/* Basic Information */}
          <Accordion
            expanded={expandedSection === 'basicInfo'}
            onChange={handleAccordionChange('basicInfo')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">{t('staffmember.sections.basic_info')}</Typography>              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.first_name')}
                    required
                    value={currentUser.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    error={!!validationErrors.firstName}
                    helperText={validationErrors.firstName}
                    placeholder={t('staffmember.placeholders.first_name')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person fontSize="small" sx={{ color: '#231f20' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.last_name')}
                    value={currentUser.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder={t('staffmember.placeholders.last_name')}
                    error={!!validationErrors.lastName}
                    helperText={validationErrors.lastName}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.email')}
                    type="email"
                    required
                    value={currentUser.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('staffmember.placeholders.email')}
                    disabled={modalType === 'Update'}
                    inputProps={{ maxLength: 45 }}
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.phone')}
                    value={currentUser.phone || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\+?\d*$/.test(value)) {
                        handleInputChange('phone', value);
                      }
                    }}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                    error={!!validationErrors.phone}
                    helperText={validationErrors.phone}
                    placeholder={t('staffmember.placeholders.phone')}
                  />
                </Grid>


                {modalType === 'Save' && (
                  <Grid item xs={12}>
                    <TextField
                      {...textFieldProps}
                      label={t('staffmember.fields.password')}
                      placeholder={t('staffmember.placeholders.password')}
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={currentUser.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      error={!!validationErrors.password}
                      helperText={validationErrors.password || t('staffmember.helper_text.password')} InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#231f20' }}
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.suburb')}
                    placeholder={t('staffmember.placeholders.suburb')}
                    required
                    value={currentUser.suburb || ''}
                    onChange={(e) => handleInputChange('suburb', e.target.value)}
                    error={!!validationErrors.suburb}
                    helperText={validationErrors.suburb}
                  />
                </Grid>

                {userType !== '2' && (
                  <Grid item xs={12}>
                    <FormControl
                      {...textFieldProps}
                      error={!!validationErrors.churchId}
                      required={userType === '1'}
                    >
                      <InputLabel>{t('staffmember.fields.church_name')}</InputLabel>                      <Select
                        label={t('staffmember.fields.church_name')}
                        value={currentUser.churchId || ''}
                        onChange={(e) => handleInputChange('churchId', e.target.value)}
                      >
                        <MenuItem value=""><em>{t('staffmember.options.select_church')}</em></MenuItem>
                        {churches.map((church) => (
                          <MenuItem key={church._id} value={church._id}>
                            {church.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors.churchId && (
                        <FormHelperText error>{validationErrors.churchId}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}

                {/* {modalType === 'Update' && (   
                <Grid item xs={12}>
                  <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Profile Photo
                    </Typography>
                    <input
                      type="file"
                      onChange={(e) => handleInputChange('profilePhoto', e.target.files[0])}
                      accept="image/*"
                      style={{ width: '100%' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Supported formats: JPG, PNG (max 5MB)
                    </Typography>
                  </Box>
                </Grid>
                )} */}
              </Grid>

            </AccordionDetails>
          </Accordion>

          {/* Employment Details */}
          <Accordion
            expanded={expandedSection === 'employment'}
            onChange={handleAccordionChange('employment')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">{t('staffmember.sections.employment')}</Typography>              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.job_title')}
                    placeholder={t('staffmember.placeholders.job_title')}
                    value={currentUser.jobTitle || ''}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.department')}
                    placeholder={t('staffmember.placeholders.department')}
                    value={currentUser.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl {...textFieldProps}>
                    <InputLabel>{t('staffmember.fields.employment_type')}</InputLabel>                    <Select
                      value={currentUser.employmentType || ''}
                      onChange={(e) => handleInputChange('employmentType', e.target.value)}
                      label={t('staffmember.fields.employment_type')}                    >
                      <MenuItem value="">{t('staffmember.options.select_type')}</MenuItem>
                      <MenuItem value="Full-Time">{t('staffmember.options.employment_full_time')}</MenuItem>
                      <MenuItem value="Part-Time">{t('staffmember.options.employment_part_time')}</MenuItem>
                      <MenuItem value="Contractor">{t('staffmember.options.employment_contractor')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl {...textFieldProps}>
                    <InputLabel>{t('staffmember.fields.work_location')}</InputLabel>                    <Select
                      value={currentUser.workLocation || ''}
                      onChange={(e) => handleInputChange('workLocation', e.target.value)}
                      label={t('staffmember.fields.work_location')}                    >
                      <MenuItem value="">{t('staffmember.options.select_location')}</MenuItem>
                      <MenuItem value="Onsite">{t('staffmember.options.location_onsite')}</MenuItem>
                      <MenuItem value="Remote">{t('staffmember.options.location_remote')}</MenuItem>
                      <MenuItem value="Hybrid">{t('staffmember.options.location_hybrid')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.start_date')} type="date"
                    value={currentUser.startDate ? currentUser.startDate.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.end_date')} type="date"
                    value={currentUser.endDate ? currentUser.endDate.split('T')[0] : ''}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.work_email')} type="email"
                    value={currentUser.workEmail || ''}
                    onChange={(e) => handleInputChange('workEmail', e.target.value)}
                    placeholder={t('staffmember.placeholders.work_email')} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.country')} value={currentUser.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder={t('staffmember.placeholders.country')} />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Access & Permissions */}
          <Accordion
            expanded={expandedSection === 'access'}
            onChange={handleAccordionChange('access')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">{t('staffmember.sections.access')}</Typography>              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl {...textFieldProps}>
                    <InputLabel>{t('staffmember.fields.user_role')}</InputLabel>                    <Select
                      value={currentUser.type || '3'} // Default to Staff (3)
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      label="User Role"
                      disabled // Since this is specifically for staff members
                    >
                      <MenuItem value="3">{t('staffmember.options.role_staff')}</MenuItem>                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.system_access_level')} value={currentUser.systemAccessLevel || ''}
                    placeholder={t('staffmember.placeholders.system_access_level')}
                    onChange={(e) => handleInputChange('systemAccessLevel', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.assigned_teams')} value={currentUser.assignedTeams || ''}
                    onChange={(e) => handleArrayInputChange('assignedTeams', e.target.value)}
                    placeholder={t('staffmember.placeholders.assigned_teams')}
                    helperText={t('staffmember.helper_text.comma_separated')} />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Skills & Qualifications */}
          <Accordion
            expanded={expandedSection === 'skills'}
            onChange={handleAccordionChange('skills')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">{t('staffmember.sections.skills')}</Typography>              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.education_level')} value={currentUser.educationLevel || ''}
                    onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                    placeholder={t('staffmember.placeholders.education_level')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.certifications')} value={currentUser.certifications || ''}
                    onChange={(e) => handleArrayInputChange('certifications', e.target.value)}
                    placeholder={t('staffmember.placeholders.certifications')}
                    helperText={t('staffmember.helper_text.comma_separated')} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.skills')} value={currentUser.skills || ''}
                    onChange={(e) => handleArrayInputChange('skills', e.target.value)}
                    placeholder={t('staffmember.placeholders.skills')}
                    helperText={t('staffmember.helper_text.comma_separated')} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.languages_spoken')}
                    value={currentUser.languagesSpoken || ''}
                    onChange={(e) => handleArrayInputChange('languagesSpoken', e.target.value)}
                    placeholder={t('staffmember.placeholders.languages_spoken')}
                    helperText={t('staffmember.helper_text.comma_separated')} />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* HR & Payroll Details */}
          <Accordion
            expanded={expandedSection === 'hr'}
            onChange={handleAccordionChange('hr')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">{t('staffmember.sections.hr')}</Typography>              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.employee_id')} value={currentUser.employeeId || ''}
                    placeholder={t('staffmember.placeholders.employee_id')}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.salary_or_hourly_rate')} type="number"
                    value={currentUser.salaryOrHourlyRate || ''}
                    onChange={(e) => handleInputChange('salaryOrHourlyRate', e.target.value)}
                    placeholder={t('staffmember.placeholders.salary_or_hourly_rate')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.payroll_bank_details')} type={showPassword ? 'text' : 'password'}
                    value={currentUser.payrollBankDetails || ''}
                    onChange={(e) => handleInputChange('payrollBankDetails', e.target.value)}
                    placeholder={t('staffmember.placeholders.payroll_bank_details')} InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#231f20' }}
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.tfn_abn')} value={currentUser.tfnAbn || ''}
                    placeholder={t('staffmember.placeholders.tfn_abn')}
                    onChange={(e) => handleInputChange('tfnAbn', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.work_visa_status')} value={currentUser.workVisaStatus || ''}
                    onChange={(e) => handleInputChange('workVisaStatus', e.target.value)}
                    placeholder={t('staffmember.placeholders.work_visa_status')}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Additional Information */}
          <Accordion
            expanded={expandedSection === 'additional'}
            onChange={handleAccordionChange('additional')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ backgroundColor: '#f5f5f5' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info fontSize="small" />
                <Typography variant="subtitle1" fontWeight="medium">{t('staffmember.sections.additional')}</Typography>              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.emergency_contact')} value={currentUser.emergencyContact || ''}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder={t('staffmember.placeholders.emergency_contact')} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.linkedin_profile')} type="url"
                    value={currentUser.linkedinProfile || ''}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                    placeholder={t('staffmember.placeholders.linkedin_profile')} />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    {...textFieldProps}
                    label={t('staffmember.fields.notes_and_comments')} multiline
                    placeholder={t('staffmember.placeholders.notes_and_comments')}
                    rows={3}
                    value={currentUser.notesAndComments || ''}
                    onChange={(e) => handleInputChange('notesAndComments', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, justifyContent: 'space-end', marginRight: '5px' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="secondary"
        // sx={{ borderColor: '#231f20', color: '#231f20' }}
        >
          {t('staffmember.buttons.cancel')}
        </Button>
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          className="bg-b"
          sx={{ backgroundColor: '#231f20', '&:hover': { backgroundColor: '#3d3a3b' } }}
        >
          {t(`staffmember.buttons.${modalType.toLowerCase()}`)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffMemberModal;