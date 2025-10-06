import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Button,
  Typography,
  InputAdornment,
  Container,
  Grid,
  Stack,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Box,
  Modal,
  Backdrop,
  Fade,
  Paper,
  Link,
  OutlinedInput
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import * as Yup from 'yup';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { translateText } from '../../utils/translate';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import sidebarLogo from '../../assets/images/church black.png';
import { Trans } from 'react-i18next';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
import './style.css';
// Validation schema for signup

const SignupScreen = () => {
  // const [isSignIn, setIsSignIn] = useState(true);
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('currentSignupPage');
    return savedPage ? parseInt(savedPage) : 1;
  });


  const [isSignIn, setIsSignIn] = useState(() => {
    const savedState = localStorage.getItem('isSignInState');
    return savedState ? JSON.parse(savedState) : true;
  });

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


  const toggleNewPasswordVisibility = () => setShowNewPassword((prev) => !prev);
  const toggleConfirmNewPasswordVisibility = () => setShowConfirmNewPassword((prev) => !prev);

  const savedLang = localStorage.getItem('language');
  if (savedLang && savedLang !== i18n.language) {
    i18n.changeLanguage(savedLang);
    console.log(`Language changed to: ${lang}`);
  }


  // Update localStorage when language changes
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };


  // Update the validationSchema email validation
  const validationSchema = useMemo(() => Yup.object().shape({
    firstName: Yup.string()
      .required(t('signup.errors.firstNameRequired')),
    lastName: Yup.string()
      .matches(/^[a-zA-Z\s]*$/, t('signup.errors.lastNameLetters')),
    email: Yup.string()
      .required(t('signup.errors.emailRequired'))
      .email(t('signup.errors.emailInvalid')),
    suburb: Yup.string().required(t('signup.errors.suburbRequired')),
    password: Yup.string()
      .min(6, t('signup.errors.passwordMin'))
      .required(t('signup.errors.passwordRequired')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], t('signup.errors.confirmPasswordMatch'))
      .required(t('signup.errors.confirmPasswordRequired')),
    churchId: Yup.string().required(t('signup.errors.churchRequired')),
  }), [t]);


  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      validateForm({
        firstName: true,
        lastName: true,
        email: true,
        suburb: true,
        password: true,
        confirmPassword: true,
        churchId: true,
      });
    }
  }, [i18n.language, validationSchema]);

  const handleForgotPassword = () => setShowForgotPassword(true);
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setShowCodeInput(false);
    setEmail('');
    setCode('');
    setConfirmNewPassword('');
    setNewPassword('');
  };

  const handleResetPasswordSubmit = async () => {
    if (!email || !email.includes('@')) {
      alert(t('login.errors.invalidEmail')); // Previously: 'Please enter a valid email address'
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.post(`${apiBaseUrl}/user/resetPassword`, { email });
      setIsLoading(false);
      if (response.status === 200) {
        setShowCodeInput(true);
        alert(t('login.codeSent')); // Previously: 'A 4-digit reset code has been sent to your email. Please check your inbox.'
      } else {
        alert(response.data?.message || t('login.errors.generic')); // Previously: 'Something went wrong. Please try again.'
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
      alert(error.response?.data?.message || t('login.errors.generic')); // Previously: 'Something went wrong. Please try again.'
    }
  };


  const handleCodeSubmit = async () => {
    if (!code || code.length !== 4) {
      alert(t('login.errors.invalidCode'));
      return;
    }

    if (!newPassword) {
      alert(t('login.errors.passwordRequired'));
      return;
    }

    if (!confirmNewPassword) {
      alert(t('login.errors.confirmPasswordRequired'));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert(t('login.errors.passwordMismatch'));
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${apiBaseUrl}/user/verifyResetCode`, {
        email,
        code,
        newPassword,
      });
      setIsLoading(false);

      if (response.data?.message === 'Password updated successfully. You can now log in.') {
        alert('Password updated successfully! Redirecting to login...');
        handleBackToLogin();
      } else {
        alert(response.data?.message || 'Invalid code or request.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  // Initialize formData from localStorage
  const [formData, setFormData] = useState(() => {
    const savedFormData = localStorage.getItem('signupFormData');
    return savedFormData ? JSON.parse(savedFormData) : {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      suburb: '',
      churchId: '',
      password: '',
      confirmPassword: '',
      attendedBefore: 'Yes',
      faithLevel: 'No faith',
      language: 'english',
      referralSource: 'friend_family',
      referredBy: '',
      termAgreement: false,
      churchNames: [],
    };
  });
  // Save formData to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('signupFormData', JSON.stringify(formData));
  }, [formData]);

  // Save currentPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentSignupPage', currentPage.toString());
  }, [currentPage]);

  // Save isSignIn state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('isSignInState', JSON.stringify(isSignIn));
  }, [isSignIn]);


  const handleSignInStateChange = (newState) => {
    setIsSignIn(newState);
    localStorage.setItem('isSignInState', JSON.stringify(newState));

    const clearedFormData = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      suburb: '',
      churchId: '',
      password: '',
      confirmPassword: '',
      attendedBefore: 'Yes',
      faithLevel: 'No faith',
      language: 'english',
      referralSource: 'friend_family',
      termAgreement: false,
      churchNames: formData.churchNames,
    };

    setFormData(clearedFormData);
    localStorage.setItem('signupFormData', JSON.stringify(clearedFormData));

    if (!newState) {
      setCurrentPage(1);
      localStorage.setItem('currentSignupPage', '1');
    }

    setErrors({});
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [openTermsModal, setOpenTermsModal] = useState(false);

  const handleOpenTermsModal = () => {
    setOpenTermsModal(true);
  };

  const handleCloseTermsModal = () => {
    setOpenTermsModal(false);
  };

  const handleConfirmTerms = () => {
    setFormData((prevData) => ({ ...prevData, termAgreement: true }));
    handleCloseTermsModal();
  };


  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/church/fetchAll?exclude=true`);
        const churches = Array.isArray(response.data) ? response.data : [];

        setFormData((prevData) => ({
          ...prevData,
          churchNames: churches,
        }));
      } catch (err) {
        console.error("[FETCH CHURCHES ERROR]", err);
        setFormData((prevData) => ({ ...prevData, churchNames: [] }));
      }
    };

    fetchChurches();
  }, []);



  const validateForm = async (fieldsToValidate) => {
    try {
      const schemaToValidate = Yup.object().shape(
        Object.keys(fieldsToValidate).reduce((acc, field) => {
          acc[field] = validationSchema.fields[field];
          return acc;
        }, {})
      );

      await schemaToValidate.validate(formData, { abortEarly: false });
      return true;
    } catch (validationErrors) {
      const newErrors = {};
      if (validationErrors.inner) {
        validationErrors.inner.forEach(error => {
          newErrors[error.path] = error.message;
        });
      }
      setErrors(newErrors);
      return false; // Form is invalid
    }
  };



  const handleInputChange = (field, value) => {
    if (field === 'email') {
      const cleanedEmail = value.replace(/\s/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: cleanedEmail
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  const validateSingleField = async (field, value) => {
    try {
      // For confirmPassword, we need to validate against the current password
      let dataToValidate = { [field]: value };
      if (field === 'confirmPassword') {
        dataToValidate = { password: formData.password, confirmPassword: value };
      }
      if (field === 'password') {
        dataToValidate = { password: value, confirmPassword: formData.confirmPassword };
      }

      const fieldSchema = Yup.object().shape({
        [field]: validationSchema.fields[field]
      });

      if (field === 'password' && formData.confirmPassword) {
        const fullSchema = Yup.object().shape({
          password: validationSchema.fields.password,
          confirmPassword: validationSchema.fields.confirmPassword
        });
        await fullSchema.validate(dataToValidate);
        setErrors(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      } else {
        await fieldSchema.validate(dataToValidate);
        setErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }
    } catch (validationError) {
      if (validationError.inner && validationError.inner.length > 0) {
        const newErrors = {};
        validationError.inner.forEach(error => {
          newErrors[error.path] = error.message;
        });
        setErrors(prev => ({
          ...prev,
          ...newErrors
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          [field]: validationError.message
        }));
      }
    }
  };

  const handleNextPage = async () => {
    let fieldsToValidate = {};
    if (currentPage === 1) {
      fieldsToValidate = {
        firstName: true,
        lastName: true,
        // phone: true,
        email: true,
        suburb: true,
        churchId: true,
        password: true,
        confirmPassword: true,
      };
    }

    const isValid = await validateForm(fieldsToValidate);
    if (isValid) {
      setErrors({});
      setCurrentPage(currentPage + 1);
    }
  };
  const handleSubmit = async () => {
    let errors = {};
    if (!formData.email) {
      errors.email = t('login.errors.emailRequired');
    }
    if (!formData.password) {
      errors.password = t('login.errors.passwordRequired');
    }
    if (Object.keys(errors).length > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, ...errors }));
      return;
    }
    if (isSignIn) {
      const loginData = {
        email: formData.email.trim().replace(/\s+/g, '').toLowerCase(),
        password: formData.password,
      };
      try {
        const response = await axios.post(`${apiBaseUrl}/auth/login`, loginData);
        const { user } = response.data;
        console.log("USER", user);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('firstName', user.firstName);
        localStorage.setItem('lastName', user.lastName);
        localStorage.setItem('churchId', user.churchId);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userType', user.type);
        localStorage.removeItem('signupFormData');
        localStorage.removeItem('isSignInState');
        navigate('/dashboard');
      } catch (err) {
        console.log("Err", err.response.data.error);
        alert(err.response.data.error || t('login.errors.invalidCredentials'));
      }
    } else {
      if (!formData.termAgreement) {
        alert(t('signup.errors.termsRequired'));
        return;
      }

      // Get the current app language for translation
      const currentLang = i18n.language;

      // Prepare registration data with translations
      let translatedData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        suburb: formData.suburb,
        broughtByName: formData.broughtBy === 'Yes' ? formData.broughtByName : '',
      };

      // Translate fields to English if current language is not English
      if (currentLang !== 'en') {
        try {
          console.log(`[SIGNUP SUBMIT] Translating fields from ${currentLang} to English`);

          // Translate firstName
          if (formData.firstName) {
            translatedData.firstName = await translateText(formData.firstName, 'en', currentLang);
            console.log(`[SIGNUP SUBMIT] Translated firstName: ${formData.firstName} -> ${translatedData.firstName}`);
          }

          // Translate lastName
          if (formData.lastName) {
            translatedData.lastName = await translateText(formData.lastName, 'en', currentLang);
            console.log(`[SIGNUP SUBMIT] Translated lastName: ${formData.lastName} -> ${translatedData.lastName}`);
          }

          // Translate suburb
          if (formData.suburb) {
            translatedData.suburb = await translateText(formData.suburb, 'en', currentLang);
            console.log(`[SIGNUP SUBMIT] Translated suburb: ${formData.suburb} -> ${translatedData.suburb}`);
          }

        } catch (translationError) {
          console.error('[SIGNUP SUBMIT] Translation error:', translationError);
          toast.error(t('signup.errors.translationFailed')); // New translation key
          return;
        }
      }

      const registrationData = {
        firstName: translatedData.firstName,
        lastName: translatedData.lastName,
        phone: formData.phone,
        email: formData.email.trim().replace(/\s+/g, ''),
        suburb: translatedData.suburb,
        churchId: formData.churchId,
        password: formData.password,
        attendedBefore: formData.attendedBefore,
        faithLevel: formData.faithLevel,
        referralSource: formData.referralSource,
        language: formData.language,
        termAgreement: formData.termAgreement,
        referredBy: formData.referredBy,
        type: "4",
      };

      try {
        await axios.post(`${apiBaseUrl}/user/add`, registrationData);
        localStorage.removeItem('isSignInState');
        toast.success(t('signup.success'));
        console.log("success");
        navigate('/');
        setIsSignIn(true);
        // Reset form data completely
        const resetFormData = {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          suburb: '',
          churchId: '',
          password: '',
          confirmPassword: '',
          attendedBefore: 'Yes',
          faithLevel: 'No faith',
          language: 'english',
          referralSource: 'friend_family',
          referredBy: '',
          termAgreement: false,
          churchNames: [],
        };
        setFormData(resetFormData);
      } catch (err) {
        const errorMessage = err.response?.data?.error || t('signup.errors.generic');
        if (
          errorMessage.toLowerCase().includes('email already exists') ||
          errorMessage.toLowerCase().includes('duplicate') ||
          errorMessage.toLowerCase().includes('email exists')
        ) {
          setErrors((prev) => ({
            ...prev,
            email: t('signup.errors.emailExists'),
          }));
          setCurrentPage(1);
          setFormData((prev) => ({
            ...prev,
            email: '',
            password: '',
            confirmPassword: '',
          }));
        } else if (
          errorMessage.toLowerCase().includes('invalid refer code') ||
          errorMessage.toLowerCase().includes('refer code') ||
          errorMessage.toLowerCase().includes('referral code') ||
          errorMessage.toLowerCase().includes('invalid referral')
        ) {
          alert('Invalid Referral code');
          setCurrentPage(2);
          setFormData((prev) => ({
            ...prev,
          }));
        } else {
          setErrors({});
          alert(errorMessage);
          if (errorMessage.toLowerCase().includes('password')) {
            setCurrentPage(1);
          }
        }
      }
    }
  };

  const renderTermsModal = () => (
    <Modal
      open={openTermsModal}
      onClose={handleCloseTermsModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >


      <Fade in={openTermsModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t('signup.termsAndConditions')}
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, maxHeight: 300, overflowY: 'auto', color: 'black' }}>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.introduction.paragraph3') }} />
            <p>
              <Trans i18nKey="privacypolicy.sections.introduction.paragraph5" />
            </p>


            <h5>{t('privacypolicy.sections.information_we_collect.title')}</h5>
            <p>{t('privacypolicy.sections.information_we_collect.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.information_we_collect.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p>{t('privacypolicy.sections.information_we_collect.paragraph2')}</p>

            <h5>{t('privacypolicy.sections.legal_basis.title')}</h5>
            <p>{t('privacypolicy.sections.legal_basis.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.legal_basis.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.how_we_use.title')}</h5>
            <p>{t('privacypolicy.sections.how_we_use.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.how_we_use.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.how_we_use.paragraph3') }} />

            <h5>{t('privacypolicy.sections.profile_photos.title')}</h5>
            <p>{t('privacypolicy.sections.profile_photos.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.profile_photos.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.microphone_access.title')}</h5>
            <p>
              <Trans i18nKey="privacypolicy.sections.microphone_access.paragraph1" />
            </p>

            <ul>
              {Object.values(t('privacypolicy.sections.microphone_access.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.third_party_services.title')}</h5>
            <p>{t('privacypolicy.sections.third_party_services.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.third_party_services.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.international_data_transfer.title')}</h5>
            <p>
              <Trans i18nKey="privacypolicy.sections.international_data_transfer.paragraph1" />
            </p>

            <p>{t('privacypolicy.sections.international_data_transfer.paragraph3')}</p>

            <h5>{t('privacypolicy.sections.data_access_sharing.title')}</h5>
            <p>{t('privacypolicy.sections.data_access_sharing.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.data_access_sharing.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.data_security.title')}</h5>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.data_security.paragraph1') }} />
            <ul>
              {Object.values(t('privacypolicy.sections.data_security.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.data_retention_deletion.title')}</h5>
            <p>{t('privacypolicy.sections.data_retention_deletion.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.data_retention_deletion.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.data_breach_notification.title')}</h5>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.data_breach_notification.paragraph1') }} />

            <h5>{t('privacypolicy.sections.your_rights.title')}</h5>
            <p>{t('privacypolicy.sections.your_rights.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.your_rights.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.childrens_privacy.title')}</h5>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.childrens_privacy.paragraph1') }} />
            <p>{t('privacypolicy.sections.childrens_privacy.paragraph2')}</p>

            <h5>{t('privacypolicy.sections.user_responsibilities.title')}</h5>
            <p>{t('privacypolicy.sections.user_responsibilities.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.user_responsibilities.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.termination.title')}</h5>
            <p>{t('privacypolicy.sections.termination.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.termination.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <h5>{t('privacypolicy.sections.intellectual_property.title')}</h5>
            <p>{t('privacypolicy.sections.intellectual_property.paragraph1')}</p>

            <h5>{t('privacypolicy.sections.limitation_liability.title')}</h5>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.limitation_liability.paragraph1') }} />

            <h5>{t('privacypolicy.sections.governing_law.title')}</h5>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.governing_law.paragraph1') }} />

            <h5>{t('privacypolicy.sections.changes_policy.title')}</h5>
            <p>{t('privacypolicy.sections.changes_policy.paragraph1')}</p>
            <p dangerouslySetInnerHTML={{ __html: t('privacypolicy.sections.changes_policy.paragraph2') }} />

            <h5>{t('privacypolicy.sections.disclaimer.title')}</h5>
            <p>{t('privacypolicy.sections.disclaimer.paragraph1')}</p>

            <h5>{t('privacypolicy.sections.contact_us.title')}</h5>
            <p>{t('privacypolicy.sections.contact_us.paragraph1')}</p>
            <ul>
              {Object.values(t('privacypolicy.sections.contact_us.list_items', { returnObjects: true })).map((item, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>

            <p>
              For the full Privacy Policy, visit{' '}
              <a href="https://churchtranslator.com/privacy-policy" target="_blank" rel="noopener noreferrer">
                https://churchtranslator.com/privacy-policy
              </a>.
            </p>
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmTerms}
            fullWidth className="bg-b"
            sx={{ mt: 2 }}
          >
            {t('signup.agree')}
          </Button>
        </Box>
      </Fade>
    </Modal>
  );


  const renderSignIn = () => (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label={t('login.email')}
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        onBlur={(e) => {
          const cleanEmail = e.target.value.replace(/\s/g, '');
          handleInputChange('email', cleanEmail);
          e.target.blur();
          setTimeout(() => {
            if (document.activeElement === e.target) {
              e.target.blur();
            }
          }, 100);
        }}
        onFocus={(e) => {
          setTimeout(() => {
            e.target.setAttribute('autocomplete', 'new-email');
          }, 0);
        }}
        error={!!errors.email}
        helperText={errors.email}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
        autoComplete="new-email"
        inputProps={{
          autoComplete: 'new-email',
          'data-lpignore': 'true',
          'data-form-type': 'other'
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: errors.email ? 'error.main' : '#231f20', },
            '&:hover fieldset': { borderColor: errors.email ? 'error.main' : '#231f20', },
            '&.Mui-focused fieldset': { borderColor: errors.email ? 'error.main' : '#231f20', },
          },
          '& .MuiInputLabel-root': { color: errors.email ? 'error.main' : '#231f20' },
          '& .MuiInputLabel-root.Mui-focused': { color: errors.email ? 'error.main' : '#231f20' },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
            transition: 'background-color 5000s ease-in-out 0s',
          },
          '& input:-webkit-autofill:hover': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
        }}
      />
      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label={t('login.password')}
        value={formData.password}
        onChange={(e) => handleInputChange('password', e.target.value)}
        onBlur={(e) => {
          // Force close any autofill dropdowns
          e.target.blur();
          setTimeout(() => {
            if (document.activeElement === e.target) {
              e.target.blur();
            }
          }, 100);
        }}
        onFocus={(e) => {
          // Clear any existing autofill suggestions
          setTimeout(() => {
            e.target.setAttribute('autocomplete', 'new-password');
          }, 0);
        }}
        error={!!errors.password}
        helperText={errors.password}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
        autoComplete="new-password"
        inputProps={{
          autoComplete: 'new-password',
          'data-lpignore': 'true',
          'data-form-type': 'other'
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={togglePasswordVisibility}>
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: errors.password ? 'error.main' : '#231f20', },
            '&:hover fieldset': { borderColor: errors.password ? 'error.main' : '#231f20', },
            '&.Mui-focused fieldset': { borderColor: errors.password ? 'error.main' : '#231f20', },
          },
          '& .MuiInputLabel-root': { color: errors.password ? 'error.main' : '#231f20', },
          '& .MuiInputLabel-root.Mui-focused': { color: errors.password ? 'error.main' : '#231f20', },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
            transition: 'background-color 5000s ease-in-out 0s',
          },
          '& input:-webkit-autofill:hover': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
        }}
      />
    </Stack>
  );

  const renderSignUpPageOne = () => (
    <Box sx={{
      // backgroundColor: "#f4eeee",
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: 0
    }}>
      <TextField
        fullWidth
        label={t('signup.firstName')}
        value={formData.firstName}
        onChange={(e) => handleInputChange('firstName', e.target.value)}
        onBlur={(e) => validateSingleField('firstName', e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: errors.firstName ? 'error.main' : '#231f20',
            },
            '&:hover fieldset': {
              borderColor: errors.firstName ? 'error.main' : '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: errors.firstName ? 'error.main' : '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: errors.firstName ? 'error.main' : '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: errors.firstName ? 'error.main' : '#231f20',
          },
        }}
        error={!!errors.firstName}
        helperText={errors.firstName}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
      />

      <TextField
        fullWidth
        label={t('signup.lastName')}
        value={formData.lastName}
        onChange={(e) => handleInputChange('lastName', e.target.value)}
        onBlur={(e) => validateSingleField('lastName', e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#231f20',
            },
            '&:hover fieldset': {
              borderColor: '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#231f20',
          },
        }}
        error={!!errors.lastName}
        helperText={errors.lastName}
      />

      <TextField
        fullWidth
        label={t('signup.phone')}
        type="tel"
        value={formData.phone}
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
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#231f20',
            },
            '&:hover fieldset': {
              borderColor: '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#231f20',
          },
        }}
      />


      <TextField
        fullWidth
        label={t('signup.email')}
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        onBlur={(e) => validateSingleField('email', e.target.value)}
        inputProps={{ maxLength: 45 }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: errors.email ? 'error.main' : '#231f20',
            },
            '&:hover fieldset': {
              borderColor: errors.email ? 'error.main' : '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: errors.email ? 'error.main' : '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: errors.email ? 'error.main' : '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: errors.email ? 'error.main' : '#231f20',
          },
        }}
        error={!!errors.email}
        helperText={errors.email}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
      />

      <TextField
        fullWidth
        label={t('signup.suburb')}
        value={formData.suburb}
        onChange={(e) => handleInputChange('suburb', e.target.value)}
        onBlur={(e) => validateSingleField('suburb', e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: errors.suburb ? 'error.main' : '#231f20',
            },
            '&:hover fieldset': {
              borderColor: errors.suburb ? 'error.main' : '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: errors.suburb ? 'error.main' : '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: errors.suburb ? 'error.main' : '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: errors.suburb ? 'error.main' : '#231f20',
          },
        }}
        error={!!errors.suburb}
        helperText={errors.suburb}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
      />

      <FormControl
        fullWidth
        variant="outlined"
        margin="normal"
        error={!!errors.churchId}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#231f20',
            },
            '&:hover fieldset': {
              borderColor: '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#231f20',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#231f20',
          },
          // Add this if you want to style the select when opened
          '& .MuiSelect-select:focus': {
            backgroundColor: 'transparent',
          }
        }}
      >
        <InputLabel
          id="formChurchId-label"
          shrink={formData.churchId !== ''}
          sx={{
            color: '#231f20',
            '&.Mui-focused': {
              color: '#231f20',
            }
          }}
        >
          {t('signup.church')}
        </InputLabel>
        <Select
          labelId="formChurchId-label"
          value={formData.churchId}
          onChange={(e) => handleInputChange('churchId', e.target.value)}
          onBlur={(e) => validateSingleField('churchId', e.target.value)}
          label="Church"
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#231f20',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#231f20',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#231f20',
            },
          }}
        >
          <MenuItem value="">
            <em>{t('signup.selectChurch')}</em>
          </MenuItem>
          {formData.churchNames.map((church) => (
            <MenuItem key={church._id} value={church._id}>
              {church.name}
            </MenuItem>
          ))}
        </Select>
        {errors.churchId && (
          <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
            {errors.churchId}
          </Typography>
        )}
      </FormControl>

      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label={t('signup.password')}
        value={formData.password}
        onChange={(e) => handleInputChange('password', e.target.value)}
        onBlur={(e) => {
          validateSingleField('password', e.target.value);
          e.target.blur();
          setTimeout(() => {
            if (document.activeElement === e.target) {
              e.target.blur();
            }
          }, 100);
        }}
        onFocus={(e) => {
          setTimeout(() => {
            e.target.setAttribute('autocomplete', 'new-password');
          }, 0);
        }}
        autoComplete="new-password"
        inputProps={{
          autoComplete: 'new-password',
          'data-lpignore': 'true',
          'data-form-type': 'other'
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: errors.password ? 'error.main' : '#231f20',
            },
            '&:hover fieldset': {
              borderColor: errors.password ? 'error.main' : '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: errors.password ? 'error.main' : '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: errors.password ? 'error.main' : '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: errors.password ? 'error.main' : '#231f20',
          },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
            transition: 'background-color 5000s ease-in-out 0s',
          },
          '& input:-webkit-autofill:hover': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={togglePasswordVisibility}
                onMouseDown={(e) => e.preventDefault()}
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        error={!!errors.password}
        helperText={errors.password}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
      />

      <TextField
        fullWidth
        type={showConfirmPassword ? 'text' : 'password'}
        label={t('signup.confirmPassword')}
        value={formData.confirmPassword}
        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
        onBlur={(e) => {
          validateSingleField('confirmPassword', e.target.value);
          // Force close any autofill dropdowns
          e.target.blur();
          setTimeout(() => {
            if (document.activeElement === e.target) {
              e.target.blur();
            }
          }, 100);
        }}
        onFocus={(e) => {
          // Clear any existing autofill suggestions
          setTimeout(() => {
            e.target.setAttribute('autocomplete', 'new-password');
          }, 0);
        }}
        autoComplete="new-password"
        inputProps={{
          autoComplete: 'new-password',
          'data-lpignore': 'true',
          'data-form-type': 'other'
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: errors.password ? 'error.main' : '#231f20',
            },
            '&:hover fieldset': {
              borderColor: errors.password ? 'error.main' : '#231f20',
            },
            '&.Mui-focused fieldset': {
              borderColor: errors.password ? 'error.main' : '#231f20',
            },
          },
          '& .MuiInputLabel-root': {
            color: errors.password ? 'error.main' : '#231f20',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: errors.password ? 'error.main' : '#231f20',
          },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
            transition: 'background-color 5000s ease-in-out 0s',
          },
          '& input:-webkit-autofill:hover': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px white inset',
            WebkitTextFillColor: 'black',
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={toggleConfirmPasswordVisibility}
                onMouseDown={(e) => e.preventDefault()}
              >
                {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        FormHelperTextProps={{
          sx: { marginLeft: 0 }
        }}
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '15px',
        }}
      >
        <Button
          variant="text"
          style={{
            color: '#231f20',
            fontSize: '14px',
            fontWeight: 500,
            textTransform: 'none',
          }}
          onClick={() => handleSignInStateChange(true)}
        >
          {t('login.backToLogin')}
        </Button>
        <Button
          variant="contained"
          style={{
            backgroundColor: '#231f20',
            color: 'white',
            fontSize: '14px',
            borderRadius: '0px',
            width: '140px',
            padding: '8px 0',
            fontWeight: 600,
          }}
          onClick={handleNextPage}
        >
          {t('signup.next')}
        </Button>
      </Box>
    </Box>
  );

  const renderSignUpPageTwo = () => (
    <Grid container spacing={2} >
      <Grid item xs={12}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Grid container direction="row" alignItems="center" spacing={1}>
              <Grid item>
                <IconButton size="small" color="primary">

                </IconButton>
              </Grid>
              <Grid item>
                <Typography sx={{ mt: 0 }} style={{ textAlign: 'center', marginLeft: '85px', color: 'black' }} variant="h6" color="info" >
                  {t('signup.getToKnowYou')}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {t('signup.attendedBeforeQuestion')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Grid container spacing={1}>
                  {['Yes', 'No'].map(option => (
                    <Grid item key={option} xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          backgroundColor: formData.attendedBefore === option ? '#231f20' : '#fff',
                          color: formData.attendedBefore === option ? '#fff' : 'inherit', // Set text color to white for contrast
                          '&:hover': {
                            backgroundColor: formData.attendedBefore === option ? '#default' : 'default' // Slightly darker on hover
                          }
                        }}
                        onClick={() => handleInputChange('attendedBefore', option)}
                      >
                        {t(`signup.${option.toLowerCase()}`)}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Faith Level Dropdown */}
          <FormControl fullWidth margin="normal" variant="outlined">
            <Typography variant="h6" gutterBottom>
              {t('signup.faithLevelQuestion')}
            </Typography>
            <Select
              value={formData.faithLevel || ''}
              onChange={(e) => handleInputChange("faithLevel", e.target.value)}
              label={t('signup.faithLevelLabel')}
              displayEmpty
              input={<OutlinedInput notched={false} />}
            >

              {[
                'No faith',
                'Uncertain',
                'Open to faith',
                'Actively Exploring',
                'Strong faith',
              ].map((level) => (
                <MenuItem key={level} value={level}>
                  {t(`signup.faithLevel.${level.toLowerCase().replace(/\s/g, '')}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Primary Language Dropdown */}
          <FormControl fullWidth margin="normal">
            <Typography variant="h6" gutterBottom>
              {t('signup.primaryLanguageQuestion')}
            </Typography>
            <Select
              value={formData.language || ''}
              onChange={(e) => handleInputChange("language", e.target.value)}
              label={t('signup.primaryLanguageLabel')}
              displayEmpty
              input={<OutlinedInput notched={false} />}
            >

              {[
                { value: 'english', key: 'english' },
                { value: 'spanish', key: 'spanish' },
                { value: 'portuguese', key: 'portuguese' },
                { value: 'indonesian', key: 'indonesian' },
                { value: 'mandarin', key: 'mandarin' },
              ].map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {t(`signup.language.${lang.key}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Referral Source Dropdown */}
          <FormControl fullWidth margin="normal">
            <Typography variant="h6" gutterBottom>
              {t('signup.howDidYouHearQuestion')}
            </Typography>
            <Select
              value={formData.referralSource || ''}
              onChange={(e) => handleInputChange("referralSource", e.target.value)}
              label={t('signup.howDidYouHearLabel')}
              displayEmpty
              input={<OutlinedInput notched={false} />}
            >

              {[
                { value: 'friend_family', key: 'friendFamily' },
                { value: 'church_event', key: 'churchEvent' },
                { value: 'social_media', key: 'socialMedia' },
                { value: 'community_outreach', key: 'communityOutreach' },
                { value: 'online_search', key: 'onlineSearch' },
                { value: 'flyer_poster', key: 'flyerPoster' },
              ].map((source) => (
                <MenuItem key={source.value} value={source.value}>
                  {t(`signup.referralSource.${source.key}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {t('signup.referralSection')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('signup.referralCode')}
                  placeholder={t('signup.referralCodePlaceholder')}
                  value={formData.referredBy}
                  onChange={(e) => handleInputChange('referredBy', e.target.value)}
                  sx={{
                    mb: 0,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#231f20' },
                      '&:hover fieldset': { borderColor: '#231f20' },
                      '&.Mui-focused fieldset': { borderColor: '#231f20' },
                    },
                    '& .MuiInputLabel-root': { color: '#231f20' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#231f20' },
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>


      <Grid item xs={12}>
        <Grid container spacing={1} sx={{ mt: 3 }} direction="row" justifyContent="space-between">
          <Grid item>
            <Button
              sx={{
                ms: 10,
                color: '#231f20', // Custom light blue color
                borderColor: '#231f20',
                '&:hover': {
                  backgroundColor: '#231f20',
                  color: '#fff',
                }
              }}
              variant="outlined"
              onClick={() => setCurrentPage(1)}
            >
              {t('signup.prev')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              sx={{
                // color: '#4dabf5', // Custom light blue color
                borderColor: '#4dabf5',

                '&:hover': {
                  backgroundColor: '#4dabf5',
                  color: '#fff',
                }
              }}
              variant="contained" className="bg-b"
              onClick={() => setCurrentPage(3)}
            >
              {t('signup.next')}
            </Button>
          </Grid>
        </Grid>
      </Grid>




    </Grid>
  );

  const renderSignUpPageThree = () => (
    <Grid container spacing={2} >


      <Grid item xs={12}>
        <Typography variant="h5" style={{ color: '#231f20' }} >
          {t('signup.termsAndConditions')}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">

          {t('signup.termsDescription')}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Link variant="outlined" color="primary" style={{ color: '#231f20', fontWeight: 'bold' }} onClick={handleOpenTermsModal}>
          {t('signup.readPrivacyPolicy')}
        </Link>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.termAgreement} style={{ color: '#231f20' }}
              onChange={(e) => handleInputChange('termAgreement', e.target.checked)}
            />
          }
          label={t('signup.acceptTerms')}
        />
      </Grid>
      <Grid item xs={12}>
        <Grid container spacing={2} direction="row" justifyContent="space-between">
          <Grid item>
            <Button
              sx={{
                // color: '#4dabf5', // Custom light blue color
                borderColor: '#231f20',
                '&:hover': {
                  backgroundColor: '#231f20',
                  color: '#fff',
                }
              }}
              variant="outlined"
              color="primar"
              onClick={() => setCurrentPage(2)}
            >
              {t('signup.prev')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit} style={{
                backgroundColor: formData.termAgreement ? '#231f20' : '#cccccc', // Gray when disabled
                color: 'white',
                '&:hover': {
                  backgroundColor: formData.termAgreement ? '#3d3d3d' : '#cccccc',
                },
              }}
              disabled={!formData.termAgreement}
            >
              {t('signup.finish')}
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );


  const renderPageContent = () => {
    switch (currentPage) {
      case 1:
        return renderSignUpPageOne();
      case 2:
        return renderSignUpPageTwo();
      case 3:
        return renderSignUpPageThree();
      default:
        return null;
    }
  };
  return (
    <>
      <Box
        sx={{
          position: { xs: 'absolute', sm: 'fixed' },
          top: { xs: '10px', sm: '20px' },
          right: { xs: '10px', sm: '20px' },
          zIndex: 1200,
          width: { xs: '100px', sm: '120px' },
        }}
      >
        <FormControl variant="outlined" size="small" fullWidth>
          <InputLabel id="language-select-label">{t('Language')}</InputLabel>
          <Select
            labelId="language-select-label"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            label={t('language.select')}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: 'transparent',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  width: { xs: '100px', sm: '120px' },
                  maxWidth: { xs: '100px', sm: '120px' },
                  maxHeight: '200px',
                  overflowY: 'auto',
                  '& .MuiMenuItem-root': {
                    fontSize: { xs: '12px', sm: '14px' },
                    padding: { xs: '6px 12px', sm: '8px 12px' },
                    backgroundColor: '#fff',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  },
                },
              },
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              getContentAnchorEl: null,
              disablePortal: true,
              MenuListProps: {
                sx: {
                  padding: 0,
                },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: { xs: '12px', sm: '14px' },
                '&:hover fieldset': { borderColor: '#231f20' },
                '&.Mui-focused fieldset': { borderColor: '#231f20' },
              },
              '& .MuiInputLabel-root': {
                fontSize: { xs: '12px', sm: '14px' },
                lineHeight: '1.2',
              },
              width: { xs: '100px', sm: '120px' },
              minWidth: { xs: '100px', sm: '120px' },
              maxWidth: { xs: '100px', sm: '120px' },
            }}
          >
            <MenuItem value="en">{t('English')}</MenuItem>
            <MenuItem value="pt">{t('Portuguese')}</MenuItem>
            <MenuItem value="es">{t('Spanish')}</MenuItem>
            <MenuItem value="id">{t('Indonesian')}</MenuItem>
            <MenuItem value="zh">{t('Mandarin')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Container
        maxWidth="sm"
        style={{
          height: isSignIn ? '100vh' : 'auto',
          minHeight: isSignIn ? '100vh' : '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isSignIn ? '0' : '20px 0',
        }}
      >
        <Paper
          elevation={3}
          style={{
            width: '80%',
            minHeight: 'fit-content',
            maxHeight: isSignIn ? 'none' : '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflowY: isSignIn ? 'visible' : 'auto',
          }}
        >
          <img
            src={sidebarLogo}
            alt="Church Translator"
            className="b-title"
            style={{ height: '67px', objectFit: 'contain', paddingTop: '18px' }}
          />
          <ToastContainer />
          <Box
            p={3}
            style={{}}
            sx={{
              '::-webkit-scrollbar': { width: '2px' },
              '::-webkit-scrollbar-thumb': {
                backgroundColor: '#fff',
                borderRadius: '8px',
              },
              '::-webkit-scrollbar-thumb:hover': { backgroundColor: '#555' },
              '::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1' },
            }}
          >
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              style={{
                background: '#231f20',
                padding: '12px',
                marginBottom: '20px',
                color: 'white',
                fontSize: '1.3rem',
              }}
            >
              {isSignIn
                ? showForgotPassword
                  ? showCodeInput
                    ? t('login.enterResetCode')
                    : t('login.resetPassword')
                  : t('login.signIn')
                : t('login.signUp')}
              {/* {!isSignIn && (
            <Link
              component="button"
              variant="h6"
              style={{ background: '#231f20', color: 'white' }}
              onClick={() => handleSignInStateChange(true)}
              sx={{ float: 'right', paddingRight: '7px' }}
            >
             {t('login.signIn')}
            </Link>
          )} */}
            </Typography>

            {/* Conditional Rendering */}
            {isSignIn && !showForgotPassword ? (
              renderSignIn()
            ) : isSignIn && showForgotPassword && !showCodeInput ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  width: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    color: '#231f20',
                    fontWeight: 600,
                    fontSize: '18px',
                    borderBottom: '1px solid #eaeaea',
                    paddingBottom: '12px',
                  }}
                >
                  {t('login.resetPassword')}
                </Typography>
                <Typography style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  {t('login.resetPasswordInstructions')}
                </Typography>
                <TextField
                  fullWidth
                  label={t('login.email')}
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    marginTop: '10px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      '&:hover fieldset': { borderColor: '#231f20' },
                      '&.Mui-focused fieldset': { borderColor: '#231f20' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '14px' },
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '15px',
                  }}
                >
                  <Button
                    variant="text"
                    style={{
                      color: '#231f20',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'none',
                    }}
                    onClick={handleBackToLogin}
                  >
                    {t('login.backToLogin')}
                  </Button>
                  <Button
                    variant="contained"
                    style={{
                      backgroundColor: '#231f20',
                      color: 'white',
                      fontSize: '14px',
                      borderRadius: '0px',
                      width: '140px',
                      padding: '8px 0',
                      fontWeight: 600,
                    }}
                    onClick={handleResetPasswordSubmit}
                  >
                    {t('login.sendCode')}
                  </Button>
                </Box>
              </Box>
            ) : isSignIn && showForgotPassword && showCodeInput ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  width: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  style={{
                    color: '#231f20',
                    fontWeight: 600,
                    fontSize: '18px',
                    borderBottom: '1px solid #eaeaea',
                    paddingBottom: '12px',
                  }}
                >
                  {t('login.enterResetCode')}
                </Typography>
                <Typography style={{ fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                  {t('login.enterCodeInstructions')}
                </Typography>
                <TextField
                  fullWidth
                  label={t('login.code')}
                  variant="outlined"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputProps={{ maxLength: 4 }}
                  sx={{
                    marginTop: '10px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      '&:hover fieldset': { borderColor: '#231f20' },
                      '&.Mui-focused fieldset': { borderColor: '#231f20' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '14px' },
                  }}
                />
                <TextField
                  fullWidth
                  label={t('login.newPassword')}
                  variant="outlined"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{
                    marginTop: '10px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      '&:hover fieldset': { borderColor: '#231f20' },
                      '&.Mui-focused fieldset': { borderColor: '#231f20' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '14px' },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleNewPasswordVisibility}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {showNewPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={t('login.confirmNewPassword')}
                  variant="outlined"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  sx={{
                    marginTop: '10px',
                    '& .MuiOutlinedInput-root': {
                      fontSize: '14px',
                      '&:hover fieldset': { borderColor: '#231f20' },
                      '&.Mui-focused fieldset': { borderColor: '#231f20' },
                    },
                    '& .MuiInputLabel-root': { fontSize: '14px' },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={toggleConfirmNewPasswordVisibility}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {showConfirmNewPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '15px',
                  }}
                >
                  <Button
                    variant="text"
                    style={{
                      color: '#231f20',
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'none',
                    }}
                    onClick={handleBackToLogin}
                  >
                    {t('login.backToLogin')}
                  </Button>
                  <Button
                    variant="contained"
                    style={{
                      backgroundColor: '#231f20',
                      color: 'white',
                      fontSize: '14px',
                      borderRadius: '0px',
                      width: '140px',
                      padding: '8px 0',
                      fontWeight: 600,
                    }}
                    onClick={handleCodeSubmit}
                  >
                    {t('login.submit')}
                  </Button>
                </Box>
              </Box>
            ) : (
              renderPageContent()
            )}
          </Box>

          {isSignIn && !showForgotPassword && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: '0 0 66.66%' }}>
                    <Typography style={{ paddingLeft: '9px' }}>
                      {t('login.noAccount')}
                      <span
                        style={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          color: '#231f20',
                          paddingLeft: '9px',
                        }}
                        onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                        onClick={() => handleSignInStateChange(false)}
                      >
                        {t('login.signUp')}
                      </span>
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '0 0 25%', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        backgroundColor: '#231f20',
                        color: 'white',
                        width: '80px',
                        fontSize: '16px',
                        borderRadius: '0px',
                        marginRight: '7px',
                      }}
                      onClick={handleSubmit}
                    >
                      {t('login.login')}
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right', paddingRight: '7px', marginTop: '4px' }}>
                  <Typography>
                    <span
                      style={{
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#231f20',
                      }}
                      onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                      onClick={handleForgotPassword}
                    >
                      {t('login.forgotPassword')}
                    </span>
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {renderTermsModal()}
        </Paper>
      </Container>

    </>
  );
};

export default SignupScreen;
