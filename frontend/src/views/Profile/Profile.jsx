import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Modal } from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Profile = () => {
  const { t, i18n } = useTranslation();
  const initialUserState = {
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    image: '',
    suburb: '',

    // Employment Details
    jobTitle: '',
    department: '',
    employmentType: '',
    startDate: '',
    endDate: '',
    workLocation: '',
    workEmail: '',

    // Access & Permissions
    type: '',
    systemAccessLevel: '',
    assignedTeams: [],

    // Skills & Qualifications
    educationLevel: '',
    certifications: [],
    skills: [],
    languagesSpoken: [],

    // HR & Payroll Details
    employeeId: '',
    salaryOrHourlyRate: '',
    payrollBankDetails: '',
    tfnAbn: '',
    workVisaStatus: '',

    // Additional Information
    emergencyContact: '',
    linkedinProfile: '',
    notesAndComments: ''
  };

  const [user, setUser] = useState(initialUserState);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const userType = localStorage.getItem('userType');
  const isRestrictedUser = userType === '3';
  console.log("isRestrictedUser", isRestrictedUser)
  useEffect(() => {
    fetchUserProfile();
  }, [i18n.language]);

  // Clean array data when setting user state
  const cleanArrayData = (data) => {
    const cleanedData = { ...data };

    // List of fields that should be arrays
    const arrayFields = ['assignedTeams', 'certifications', 'skills', 'languagesSpoken'];

    arrayFields.forEach(field => {
      if (cleanedData[field]) {
        let cleanArray;
        if (Array.isArray(cleanedData[field])) {
          cleanArray = cleanedData[field].map(item => {
            try {
              const parsed = JSON.parse(item);
              return Array.isArray(parsed) ? parsed[0] : item;
            } catch (e) {
              return item;
            }
          });
        } else if (typeof cleanedData[field] === 'string') {
          try {
            cleanArray = JSON.parse(cleanedData[field]);
          } catch (e) {
            cleanArray = [cleanedData[field]];
          }
        }
        cleanedData[field] = cleanArray.filter(Boolean);
      }
    });

    return cleanedData;
  };

  const fetchUserProfile = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError(t('profile.errors.user_id_not_found'));
      return;
    }

    try {
      const currentLang = i18n.language;
      const response = await axios.get(`${apiBaseUrl}/user/detail/${userId}?lang=${currentLang}`);
      let userData = response.data;

      if (currentLang !== 'en') {
        try {
          console.log(`[FETCH PROFILE] Translating user data from English to ${currentLang}`);


          const textFields = [
            'firstName', 'lastName', 'suburb', 'jobTitle', 'department',
            'workLocation', 'educationLevel', 'emergencyContact', 'notesAndComments'
          ];
          for (const field of textFields) {
            if (userData[field]) {
              userData[field] = await translateText(userData[field], currentLang, 'en');
              console.log(`[FETCH PROFILE] Translated ${field}: ${userData[field]}`);
            }
          }


          const arrayFields = ['assignedTeams', 'certifications', 'skills', 'languagesSpoken'];
          for (const field of arrayFields) {
            if (userData[field]?.length > 0) {
              userData[field] = await Promise.all(
                userData[field].map(async item =>
                  item ? await translateText(item, currentLang, 'en') : item
                )
              );
              console.log(`[FETCH PROFILE] Translated ${field}:`, userData[field]);
            }
          }
        } catch (translationError) {
          console.error('[FETCH PROFILE] Translation error:', translationError);

        }
      }

      const cleanedData = cleanArrayData(userData);
      setUser(cleanedData);
    } catch (err) {
      console.error(err);
      setError(t('profile.errors.fetch_failed'));
    }
  };
  const handleInputChange = (field, value) => {
    setUser(prevUser => ({
      ...prevUser,
      [field]: value
    }));
    setError(null);
  };

  const handleArrayInputChange = (field, value) => {
    const arrayValues = value.split(',').map(item => item.trim());
    handleInputChange(field, arrayValues);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit before compression)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }

      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed for profile pictures!");
        return;
      }

      try {
        // Compression options to target 500–700 KB
        const options = {
          maxSizeMB: 0.7, // Target size: 700 KB
          maxWidthOrHeight: 1024, // Resize to max 1024px width or height
          initialQuality: 0.7, // Start with 70% quality
          useWebWorker: true, // Improve performance
          fileType: file.type, // Preserve original MIME type
        };

        // Compress the image
        const compressedBlob = await imageCompression(file, options);

        // Verify compressed file size (should be around 500–700 KB)
        if (compressedBlob.size > 0.8 * 1024 * 1024) {
          setError("Compressed image exceeds 800 KB. Please try a smaller file.");
          return;
        }

        // Create a new File object with correct name and MIME type
        const extension = file.name.split('.').pop(); // Get original extension
        const compressedFile = new File([compressedBlob], `profile-image.${extension}`, {
          type: file.type, // Preserve original MIME type
          lastModified: Date.now(),
        });

        // Update state with compressed file
        setImageFile(compressedFile);

        // Create a preview for the user interface
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression error:', error);
        setError("Failed to compress image. Please try a different file.");
      }
    }
  };


  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError("User ID not found in local storage");
      return;
    }

    try {
      const currentLang = i18n.language;
      let translatedData = { ...user };

      // Translate text fields to English if current language is not English
      if (currentLang !== 'en') {
        console.log(`[PROFILE UPDATE] Translating user data from ${currentLang} to English`);

        // Text fields to translate
        const textFields = [
          'firstName', 'lastName', 'suburb', 'jobTitle', 'department',
          'workLocation', 'educationLevel', 'emergencyContact', 'notesAndComments'
        ];
        for (const field of textFields) {
          if (translatedData[field]) {
            try {
              translatedData[field] = await translateText(translatedData[field], 'en', currentLang);
              console.log(`[PROFILE UPDATE] Translated ${field}: ${user[field]} -> ${translatedData[field]}`);
            } catch (translationError) {
              console.error(`[PROFILE UPDATE] Translation error for ${field}:`, translationError);
              throw new Error('Translation failed');
            }
          }
        }

        // Array fields to translate
        const arrayFields = ['assignedTeams', 'certifications', 'skills', 'languagesSpoken'];
        for (const field of arrayFields) {
          if (translatedData[field]?.length > 0) {
            try {
              translatedData[field] = await Promise.all(
                translatedData[field].map(async item =>
                  item ? await translateText(item, 'en', currentLang) : item
                )
              );
              console.log(`[PROFILE UPDATE] Translated ${field}: ${user[field]} -> ${translatedData[field]}`);
            } catch (translationError) {
              console.error(`[PROFILE UPDATE] Translation error for ${field}:`, translationError);
              throw new Error('Translation failed');
            }
          }
        }
      }

      const formData = new FormData();

      // Add non-file fields to formData using translated data
      Object.keys(translatedData).forEach(key => {
        if (key !== 'image') { // Skip image field, we'll handle it separately
          if (Array.isArray(translatedData[key])) {
            formData.append(key, JSON.stringify(translatedData[key]));
          } else if (translatedData[key] !== null && translatedData[key] !== undefined) {
            formData.append(key, translatedData[key]);
          }
        }
      });

      // Add file only if there's a new one selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.patch(
        `${apiBaseUrl}/user/profile-update/${userId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          maxContentLength: 5 * 1024 * 1024, // 5MB max content length
          maxBodyLength: 5 * 1024 * 1024   // 5MB max body length
        }
      );

      const cleanedData = cleanArrayData(response.data.user);
      setUser(cleanedData);
      setError(null);
      toast.success(t('profile.messages.profile_updated_successfully'));
    } catch (err) {
      console.error(err);
      if (err.message === 'Translation failed') {
        setError(t('profile.errors.translation_failed'));
        toast.error(t('profile.errors.translation_failed'));
      } else if (err.response && err.response.status === 413) {
        setError("File is too large. Please select an image under 5MB.");
        toast.error(t('profile.errors.file_too_large'));
      } else {
        setError(err.response?.data?.error || err.message || "Error updating profile");
        toast.error(t(`profile.errors.${(err.response?.data?.error || err.message || "Error updating profile").replace(/\s+/g, '_').toLowerCase()}`, err.response?.data?.error || err.message || "Error updating profile"));
      }
    }
  };


  // const handleRemoveImage = () => {
  //   setImageFile(null);
  //   setImagePreview(null);
  //   handleInputChange('image', '');
  // };
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error(t('profile.errors.user_id_not_found'));
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('profile.errors.all_password_fields_required'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('profile.errors.passwords_do_not_match'));
      return;
    }

    try {
      await axios.patch(`${apiBaseUrl}/user/change-password/${userId}`, {
        currentPassword,
        newPassword
      });
      toast.success(t('profile.messages.password_changed_successfully'));
      resetPasswordStates();
    } catch (err) {
      console.error(err);
      toast.error(t(`profile.errors.${(err.response?.data?.message || err.message || "Error changing password").replace(/\s+/g, '_').toLowerCase()}`, err.response?.data?.message || err.message || "Error changing password"));
    }
  };

  const resetPasswordStates = () => {
    setShowModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const renderFormSection = (title, children) => (
    <>
      <div className="section-heading mt-4">
        <h5 className="mb-0">{title}</h5>
      </div>
      {children}
    </>
  );

  const renderPasswordField = (label, value, showPassword, setShowPassword, setValue) => (
    <Form.Group className="mt-3">
      <Form.Label>{label}</Form.Label>
      <div className="position-relative">
        <Form.Control
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="focus-border"
        />
        <Button
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle-btn"
          type="button"
        >
          <i className={`fa ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
        </Button>
      </div>
    </Form.Group>
  );

  return (
    <React.Fragment>
      <style>
        {`
          .focus-border:focus {
            border-color: #231f20 !important;
            box-shadow: 0 0 0 0.2rem rgba(35, 31, 32, 0.25);
          }
          .section-heading {
            background-color: #f8f9fa;
            padding: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #231f20;
          }
          .bg-b {
            background-color: #231f20 !important;
            border-color: #231f20 !important;
          }
          .bg-b:hover {
            background-color: #000000 !important;
            border-color: #000000 !important;
          }
         .password-toggle-btn {
  background: none !important;
  border: none !important;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  padding: 0 !important;
  color: black !important;
  box-shadow: none !important;
}
.password-toggle-btn:hover,
.password-toggle-btn:focus,
.password-toggle-btn:active,
.password-toggle-btn:visited {
  background: none !important;
  border: none !important;
  color: black !important;
  box-shadow: none !important;
  outline: none !important;
}
.password-toggle-btn i,
.password-toggle-btn:hover i,
.password-toggle-btn:focus i,
.password-toggle-btn:active i,
.password-toggle-btn .fa,
.password-toggle-btn:hover .fa,
.password-toggle-btn:focus .fa,
.password-toggle-btn:active .fa {
  color: black !important;
}
          .form-label.required:after {
            content: "*";
            color: red;
            margin-left: 4px;
          }
        `}
      </style>

      <ToastContainer position="top-right" autoClose={3000} />

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">{t('profile.header')}</h4>
                <Button variant="primary" className="bg-b" onClick={() => setShowModal(true)}>
                  {t('profile.changePassword')}
                </Button>
              </div>
            </Card.Header>

            <Card.Body>
              {error && <div className="alert alert-danger">{t(`profile.errors.${error.replace(/\s+/g, '_').toLowerCase()}`, error)}</div>}
              <Form onSubmit={handleProfileUpdate}>
                {/* Basic Information */}
                {renderFormSection(t('profile.sections.basic_information'), (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.first_name')}</Form.Label>
                          <Form.Control
                            type="text"
                            value={user.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            // required
                            className="focus-border"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.last_name')}</Form.Label>
                          <Form.Control
                            type="text"
                            value={user.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            // required
                            className="focus-border"
                          />

                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.email')}</Form.Label>
                          <Form.Control
                            type="email"
                            value={user.email}
                            disabled
                            className="focus-border"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.phone_number')}</Form.Label>
                          <Form.Control
                            type="tel"
                            value={user.phone}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\+?\d*$/.test(value)) {
                                handleInputChange('phone', value);
                              }
                            }}
                            className="focus-border"
                            placeholder="+1234567890"
                            inputMode="tel"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.suburb')}</Form.Label>
                          <Form.Control
                            type="text"
                            value={user.suburb}
                            onChange={(e) => handleInputChange('suburb', e.target.value)}
                            className="focus-border"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.referalcode')}</Form.Label>
                          <Form.Control
                            type="text"
                            value={user.referralCode}
                            disabled
                            className="focus-border"
                          />
                        </Form.Group>
                      </Col>


                    </Row>

                    {userType === '4' && (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.accepted_jesus', 'Accepted Jesus')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.acceptedJesus || 'No'}
                              disabled
                              className="focus-border"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.accepted_jesus_at', 'Accepted Jesus At')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.acceptedJesusAt ? new Date(user.acceptedJesusAt).toLocaleDateString() : 'Not accepted yet'}
                              disabled
                              className="focus-border"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    )}

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('profile.fields.profile_photo')}</Form.Label>
                          <div className="d-flex gap-3 align-items-center">
                            <div className="flex-grow-1">
                              <Form.Control
                                type="file"
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="focus-border"
                              />
                              <small className="text-muted d-block mt-1">
                                {t('profile.messages.supported_formats')}
                              </small>
                            </div>
                            {console.log(`ewfdew`, user.image)}
                            {(imagePreview || user.image) && (
                              <div className="position-relative" style={{ minWidth: '100px' }}>
                                <img
                                  src={imagePreview || user.image}
                                  alt="Profile Preview"
                                  className="rounded"
                                  style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setShowImageModal(true)}
                                />
                              </div>
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                ))}

                {(userType === '3') && (
                  <>
                    {/* Employment Details */}
                    {renderFormSection(t('profile.sections.employment_details'), (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.job_title')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.jobTitle}
                              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                              className="focus-border"
                              disabled={userType === '3'}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.department')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.department}
                              onChange={(e) => handleInputChange('department', e.target.value)}
                              className="focus-border"
                              disabled={userType === '3'}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}

                    {/* Access & Permissions */}
                    {renderFormSection(t('profile.sections.access_permissions'), (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.user_role')}</Form.Label>
                            <Form.Select
                              value={user.type}
                              onChange={(e) => handleInputChange('type', e.target.value)}
                              className="focus-border"
                              disabled={userType === '3'}
                            >
                              <option value="">{t('profile.options.select_role')}</option>
                              <option value="2">{t('profile.options.admin')}</option>
                              <option value="3">{t('profile.options.staff')}</option>
                              <option value="4">{t('profile.options.user')}</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.system_access_level')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.systemAccessLevel}
                              onChange={(e) => handleInputChange('systemAccessLevel', e.target.value)}
                              className="focus-border"
                              disabled={userType === '3'}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}

                    {/* Skills & Qualifications */}
                    {renderFormSection(t('profile.sections.skills_qualifications'), (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.education_level')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.educationLevel}
                              onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                              className="focus-border"
                              placeholder={t('profile.placeholders.education_level')}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.certifications')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.certifications}
                              onChange={(e) => handleArrayInputChange('certifications', e.target.value)}
                              className="focus-border"
                              placeholder={t('profile.placeholders.certifications')}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}

                    {/* HR & Payroll Details */}
                    {renderFormSection(t('profile.sections.hr_payroll_details'), (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.employee_id')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.employeeId}
                              onChange={(e) => handleInputChange('employeeId', e.target.value)}
                              className="focus-border"
                              disabled={userType === '3'}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.salary_hourly_rate')}</Form.Label>
                            <Form.Control
                              type="number"
                              value={user.salaryOrHourlyRate}
                              onChange={(e) => handleInputChange('salaryOrHourlyRate', e.target.value)}
                              className="focus-border"
                              disabled={userType === '3'}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}

                    {/* Additional Information */}
                    {renderFormSection(t('profile.sections.additional_information'), (
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.emergency_contact')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.emergencyContact}
                              onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                              className="focus-border"
                              placeholder={t('profile.placeholders.emergency_contact')}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.linkedin_profile')}</Form.Label>
                            <Form.Control
                              type="url"
                              value={user.linkedinProfile}
                              onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                              className="focus-border"
                              placeholder={t('profile.placeholders.linkedin_profile')}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}
                  </>
                )}

                {(userType === '4') && (
                  <>
                    {/* Church Member Details */}
                    {renderFormSection(t('profile.sections.church_member_details'), (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>{t('profile.fields.attended_before')}</Form.Label>
                              <Form.Select
                                value={user.attendedBefore || 'Yes'}
                                onChange={(e) => handleInputChange('attendedBefore', e.target.value)}
                                className="focus-border"
                              >
                                <option value="Yes">{t('profile.options.yes')}</option>
                                <option value="No">{t('profile.options.no')}</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>{t('profile.fields.faith_journey')}</Form.Label>
                              <Form.Select
                                value={user.faithLevel || 'No faith'}
                                onChange={(e) => handleInputChange('faithLevel', e.target.value)}
                                className="focus-border"
                              >
                                <option value="No faith">{t('profile.options.no_faith')}</option>
                                <option value="Uncertain">{t('profile.options.uncertain')}</option>
                                <option value="Open to faith">{t('profile.options.open_to_faith')}</option>
                                <option value="Actively Exploring">{t('profile.options.actively_exploring')}</option>
                                <option value="Strong faith">{t('profile.options.strong_faith')}</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>{t('profile.fields.referral_source', 'Referral Source')}</Form.Label>
                              <Form.Select
                                value={user.referralSource || ''}
                                onChange={(e) => handleInputChange('referralSource', e.target.value)}
                                className="focus-border"
                              >
                                <option value="">{t('profile.options.select_referral_source', 'Select Referral Source')}</option>
                                <option value="friend_family">{t('profile.options.friend_family', 'Friend/Family')}</option>
                                <option value="church_event">{t('profile.options.church_event', 'Church Event')}</option>
                                <option value="social_media">{t('profile.options.social_media', 'Social Media')}</option>
                                <option value="community_outreach">{t('profile.options.community_outreach', 'Community Outreach')}</option>
                                <option value="online_search">{t('profile.options.online_search', 'Online Search')}</option>
                                <option value="flyer_poster">{t('profile.options.flyer_poster', 'Flyer/Poster')}</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>{t('profile.fields.language', 'Language')}</Form.Label>
                              <Form.Select
                                value={user.language || 'english'}
                                onChange={(e) => handleInputChange('language', e.target.value)}
                                className="focus-border"
                              >
                                <option value="english">{t('profile.options.english', 'English')}</option>
                                <option value="portuguese">{t('profile.options.portuguese', 'Portuguese')}</option>
                                <option value="mandarin">{t('profile.options.mandarin', 'Mandarin')}</option>
                                <option value="spanish">{t('profile.options.spanish', 'Spanish')}</option>
                                <option value="indonesian">{t('profile.options.indonesian', 'Indonesian')}</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    ))}

                    {user.referredBy && renderFormSection(
                      t('profile.sections.additional_church_info'), (
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-3">
                            <Form.Label>{t('profile.fields.brought_by')}</Form.Label>
                            <Form.Control
                              type="text"
                              value={user.referredBy}
                              disabled
                              className="focus-border"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}
                  </>
                )}

                <div className="d-flex justify-content-end mt-4">
                  <Button variant="primary" type="submit" className="bg-b">
                    {t('profile.buttons.update_profile')}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Password Change Modal */}
      <Modal show={showModal} onHide={resetPasswordStates}>
        <Modal.Header closeButton>
          <Modal.Title>{t('profile.modal.change_password')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleChangePassword}>
            {renderPasswordField(
              t('profile.fields.current_password'),
              currentPassword,
              showCurrentPassword,
              setShowCurrentPassword,
              setCurrentPassword
            )}

            {renderPasswordField(
              t('profile.fields.new_password'),
              newPassword,
              showNewPassword,
              setShowNewPassword,
              setNewPassword
            )}

            {renderPasswordField(
              t('profile.fields.confirm_new_password'),
              confirmPassword,
              showConfirmPassword,
              setShowConfirmPassword,
              setConfirmPassword
            )}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={resetPasswordStates}>
                {t('profile.buttons.cancel')}
              </Button>
              <Button variant="primary" type="submit" className="bg-b">
                {t('profile.buttons.change_password')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('profile.fields.profile_photo')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          <img
            src={imagePreview || user.image}
            alt="Profile Full View"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </Modal.Body>
      </Modal>
    </React.Fragment>
  );
};

export default Profile;
