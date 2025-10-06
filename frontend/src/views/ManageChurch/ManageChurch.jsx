import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import { Camera, Edit2 } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../utils/translate';
import i18n from 'i18next';
import 'react-toastify/dist/ReactToastify.css';
import NavRight from 'layouts/AdminLayout/NavBar/NavRight';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const ChurchEdit = () => {
  const { t } = useTranslation();
  const [church, setChurch] = useState({
    name: '',
    address: '',
    contact_no: '',
    city: '',
    state: '',
    country: '',
    senior_pastor_name: '',
    senior_pastor_phone_number: '',
    speech_key: '',
    speech_location: '',
    translator_endpoint: '',
    translator_key: '',
    stream_limit_minutes: '',
    stream_used_minutes: '',
    translator_location: '',
    api_key: '',
    image: ''
  });
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [editableFields, setEditableFields] = useState({
    speech_location: false,
    speech_key: false,
    translator_key: false,
    translator_location: false
  });

  useEffect(() => {
    const fetchChurchDetails = async () => {
      const churchId = localStorage.getItem('churchId');
      console.log('[FETCH] Church ID:', churchId);
      if (!churchId) {
        setError(t('churchEdit.errors.churchIdNotFound'));
        return;
      }

      try {
        const response = await axios.get(`${apiBaseUrl}/church/detail/${churchId}`);
        let churchData = response.data || {};
        const lang = i18n.language;
        console.log('[FETCH] Current language:', lang);

        if (lang !== 'en' && Object.keys(churchData).length > 0) {
          console.log('[FETCH] Translating church data to:', lang);
          const fieldsToTranslate = ['name', 'senior_pastor_name', 'address', 'city', 'state', 'country'];
          const translatedFields = {};

          for (const field of fieldsToTranslate) {
            if (churchData[field]) {
              console.log(`[TRANSLATING] ${field}: ${churchData[field]}`);
              translatedFields[field] = await translateText(churchData[field], lang);
              console.log(`[TRANSLATED] ${field}: ${translatedFields[field]}`);
            }
          }

          churchData = {
            ...churchData,
            ...translatedFields,
          };
          console.log('[FETCH] Translated church data:', churchData);
        }

        const { name, address, contact_no, city, state, country, senior_pastor_name, senior_pastor_phone_number, api_key, image, speech_key, speech_location, translator_endpoint, translator_key, translator_location, stream_used_minutes, stream_limit_minutes } = churchData;
        setChurch({ name, address, contact_no, city, state, country, senior_pastor_name, senior_pastor_phone_number, api_key, image, speech_key, speech_location, translator_endpoint, translator_key, translator_location, stream_used_minutes, stream_limit_minutes });
      } catch (err) {
        console.error('Error fetching church details:', err);
        setError(err.message || t('churchEdit.errors.fetchDetails'));
      }
    };
    fetchChurchDetails();
  }, []);


  const handleEnableFieldEdit = (fieldName, fieldLabel) => {
    const isConfirmed = window.confirm(
      `⚠️ CONFIDENTIAL FIELD\n\nYou are about to edit "${fieldLabel}" which is a sensitive API configuration field.\n\nAre you sure you want to edit this field?`
    );

    if (isConfirmed) {
      setEditableFields(prev => ({
        ...prev,
        [fieldName]: true
      }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Add this compression function
  // Fix the compressImage function
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const imgElement = document.createElement('img'); // Change this line
        imgElement.src = event.target.result;
        imgElement.onload = () => {
          const canvas = document.createElement('canvas');
          let width = imgElement.width;
          let height = imgElement.height;

          // Maximum dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(imgElement, 0, 0, width, height);

          // Convert to Blob with quality
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            },
            'image/jpeg',
            0.7 // compression quality
          );
        };
        imgElement.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  };
  // Update the handleImageChange function
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('churchEdit.errors.invalidImageType'));
      return;
    }

    try {
      setIsUploading(true);

      // Compress image before converting to base64
      const compressedImage = await compressImage(file);
      const base64Image = await convertToBase64(compressedImage);
      const churchId = localStorage.getItem('churchId');

      const response = await axios.patch(`${apiBaseUrl}/church/edit/${churchId}`, {
        image: base64Image
      });

      setChurch(prev => ({
        ...prev,
        image: response.data.image || base64Image
      }));

      toast.success(t('churchEdit.success.imageUpdated'));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('churchEdit.errors.uploadImage'));
    } finally {
      setIsUploading(false);
    }
  };


  const handleChurchUpdate = async (e) => {
    e.preventDefault();
    const churchId = localStorage.getItem('churchId');
    if (!churchId) {
      toast.error(t('churchEdit.errors.churchIdNotFound'));
      return;
    }

    // Add validation for required fields
    if (!church.speech_location) {
      toast.error(t('churchEdit.errors.speechLocationRequired') || 'Speech Location is required');
      return;
    }
    if (!church.speech_key) {
      toast.error(t('churchEdit.errors.speechKeyRequired') || 'Speech Key is required');
      return;
    }
    if (!church.translator_key) {
      toast.error(t('churchEdit.errors.translatorKeyRequired') || 'Translator Key is required');
      return;
    }
    if (!church.translator_location) {
      toast.error(t('churchEdit.errors.translatorLocationRequired') || 'Translator Location is required');
      return;
    }

    try {
      // Create a copy of church data without the image field
      let churchDataWithoutImage = { ...church };
      delete churchDataWithoutImage.image;

      // Translate text fields to English if the current language is not English
      const currentLang = i18n.language;
      if (currentLang !== 'en') {
        console.log(`[SUBMIT] Translating church data from ${currentLang} to English`);
        const fieldsToTranslate = ['name', 'senior_pastor_name', 'address', 'city', 'state', 'country']; // Adjust based on actual fields
        for (const field of fieldsToTranslate) {
          if (churchDataWithoutImage[field]) {
            console.log(`[SUBMIT] Translating ${field}: ${churchDataWithoutImage[field]}`);
            churchDataWithoutImage[field] = await translateText(churchDataWithoutImage[field], 'en', currentLang);
            console.log(`[SUBMIT] Translated ${field}: ${churchDataWithoutImage[field]}`);
          }
        }
      }

      const response = await axios.patch(`${apiBaseUrl}/church/edit/${churchId}`, churchDataWithoutImage);
      // Update the church state while preserving the existing image
      // setChurch(prev => ({
      //   ...response.data,
      //   image: prev.image // Preserve the existing image
      // }));

      toast.success(t('churchEditt.successUpdate') || "Church details updated successfully");
    } catch (err) {
      console.error('Error updating church details:', err);
      toast.error(err.response?.data?.error || err.message || t('churchEditt.updateDetails'));
    }
  };

  // Modify handleImageChange to use a separate endpoint for image updates
  // const handleImageChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   // Validate file type
  //   const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  //   if (!validTypes.includes(file.type)) {
  //     toast.error('Please upload a valid image file (JPEG, PNG)');
  //     return;
  //   }

  //   // Validate file size (5MB limit)
  //   // if (file.size > 5 * 1024 * 1024) {
  //   //   toast.error('Image size should be less than 5MB');
  //   //   return;
  //   // }

  //   try {
  //     setIsUploading(true);
  //     const base64Image = await convertToBase64(file);
  //     const churchId = localStorage.getItem('churchId');

  //     // Use a separate endpoint for image update
  //     const response = await axios.patch(`${apiBaseUrl}/church/edit/${churchId}`, {
  //       image: base64Image
  //     });

  //     setChurch(prev => ({
  //       ...prev,
  //       image: response.data.image || base64Image
  //     }));

  //     toast.success('Church image updated successfully');
  //   } catch (err) {
  //     console.error(err);
  //     toast.error(err.response?.data?.message || 'Error uploading image');
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  return (
    <React.Fragment>
      <style>{`
        .focus-border:focus {
          border-color: #231f20 !important;
          box-shadow: 0 0 0 0rem #231f20;
        }
        .church-image-section {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          padding: 20px 0;
        }
        // .church-image-container {
        //   position: relative;
        //   width: 80%;
        //   height: 200px;
        //   border-radius: 8px;
        //   overflow: hidden;
        //   box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        //   cursor: pointer;
        //   background-color: #f8f9fa;
        // }

        //   .church-image {
        //   width: 100%;
        //   height: 100%;
        //   object-fit: none;
        //   transition: all 0.3s ease;
        // }
          .church-image-container {
            position: relative;
            // width: auto;
            // height: auto; 
            max-height: 100%; 
            padding: 60px;
            max-width: 100%; 
            display: inline-block; 
            border-radius: 8px;
            overflow: hidden;
            // box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            // background-color: #f8f9fa;
          }
          .church-image {
          display: block; 
          max-width: 100%; 
          height: auto; 
          object-fit: contain; 
          transition: all 0.3s ease;
        }
      
        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(35, 31, 32, 0.6);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .church-image-container:hover .image-overlay {
          opacity: 1;
        }
        .overlay-text {
          color: white;
          font-size: 14px;
          margin-top: 8px;
          text-align: center;
        }
        .upload-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: #231f20;
        }
        @media (max-width: 768px) {
          .church-image-container {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>

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
      {console.log("chjrudjbf", church.image)}
      <Row>
        <Col>
          <Card>
            <Card.Body>
              {error && <p className="text-danger">{error}</p>}
              <div className="church-image-section">
                <div className="church-image-container" onClick={handleImageClick}>
                  <Image
                    src={church.image || '/default-church.png'}
                    alt={t('churchEdit.imageAlt')}
                    className="church-image"
                  />
                  <div className="image-overlay">
                    <Camera size={24} color="white" />
                    <span className="overlay-text">{t('churchEdit.overlayText')}</span>
                  </div>
                  {isUploading && <div className="upload-progress" />}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/jpg"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Your existing form */}
              <Form onSubmit={handleChurchUpdate}>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formName">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.name')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.name')}
                        value={church.name}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, name: e.target.value })}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group controlId="formContactNo">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.contactNo')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.contactNo')}
                        value={church.contact_no}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, contact_no: e.target.value })}
                      />
                    </Form.Group>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formCity">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.city')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.city')}
                        value={church.city}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, city: e.target.value })}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">

                    <Form.Group controlId="formState">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.state')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.state')}
                        value={church.state}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, state: e.target.value })}
                      />
                    </Form.Group>
                  </div>

                </div>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formCountry">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.country')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.country')}
                        value={church.country}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, country: e.target.value })}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group controlId="formPastorName">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.seniorPastorName')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.seniorPastorName')}
                        value={church.senior_pastor_name}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, senior_pastor_name: e.target.value })}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group controlId="formCountry">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.seniorPastorPhoneNumber')}</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.seniorPastorPhoneNumber')}
                        value={church.senior_pastor_phone_number}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, senior_pastor_phone_number: e.target.value })}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group controlId="formStreamLimit">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.stream_limit_minutes')}</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="number"
                          min="30"
                          max="10080"
                          step="30"
                          placeholder={t('churchEdit.placeholders.stream_limit_minutes')}
                          value={church.stream_limit_minutes}
                          className="focus-border black pe-5"
                          onChange={(e) => setChurch({ ...church, stream_limit_minutes: e.target.value })}
                          disabled
                        />
                        <span
                          className="position-absolute top-50 end-0 translate-middle-y pe-3 text-muted"
                          style={{ pointerEvents: 'none', fontSize: '14px' }}
                        >
                          minutes
                        </span>
                      </div>
                      {/* Show hour conversion */}
                      {church.stream_limit_minutes && (
                        <small className="text-muted mt-1 d-block">
                          ≈ {Math.round((church.stream_limit_minutes / 60) * 10) / 10} hours per week
                        </small>
                      )}
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group controlId="formStreamUsed">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.stream_used_minutes')}</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="number"
                          placeholder={t('churchEdit.placeholders.stream_used_minutes')}
                          value={church.stream_used_minutes}
                          className="focus-border black pe-5"
                          onChange={(e) => setChurch({ ...church, stream_used_minutes: e.target.value })}
                          disabled
                        />
                        <span
                          className="position-absolute top-50 end-0 translate-middle-y pe-3 text-muted"
                          style={{ pointerEvents: 'none', fontSize: '14px' }}
                        >
                          minutes
                        </span>
                      </div>
                    </Form.Group>
                  </div>


                  <div className="col-md-6">
                    <Form.Group controlId="formSpeechLocation">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Form.Label className="mt-2 black">{t('churchEdit.formLabels.speech_location')}</Form.Label>
                        {!editableFields.speech_location && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleEnableFieldEdit('speech_location', 'Speech Location')}
                            style={{
                              padding: '4px',
                              border: 'none',
                              color: '#231f20',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f8f9fa';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#231f20';
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.speech_location')}
                        value={church.speech_location}
                        className="focus-border black"
                        disabled={!editableFields.speech_location}
                        onChange={(e) => setChurch({ ...church, speech_location: e.target.value })}
                      />
                    </Form.Group>
                  </div>





                  <div className="col-md-6">
                    <Form.Group controlId="formSpeechKey">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Form.Label className="mt-2 black">{t('churchEdit.formLabels.speech_key')}</Form.Label>
                        {!editableFields.speech_key && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleEnableFieldEdit('speech_key', 'Speech Key')}
                            style={{
                              padding: '4px',
                              border: 'none',
                              color: '#231f20',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f8f9fa';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#231f20';
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.speech_key')}
                        value={church.speech_key}
                        className="focus-border black"
                        disabled={!editableFields.speech_key}
                        onChange={(e) => setChurch({ ...church, speech_key: e.target.value })}
                      />
                    </Form.Group>
                  </div>



                  <div className="col-md-6">
                    <Form.Group controlId="formTranslatorKey">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Form.Label className="mt-2 black">{t('churchEdit.formLabels.translator_key')}</Form.Label>
                        {!editableFields.translator_key && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleEnableFieldEdit('translator_key', 'Translator Key')}
                            style={{
                              padding: '4px',
                              border: 'none',
                              color: '#231f20',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f8f9fa';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#231f20';
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.translator_key')}
                        value={church.translator_key}
                        className="focus-border black"
                        disabled={!editableFields.translator_key}
                        onChange={(e) => setChurch({ ...church, translator_key: e.target.value })}
                      />
                    </Form.Group>
                  </div>



                  <div className="col-md-6">
                    <Form.Group controlId="formTranslatorLocation">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Form.Label className="mt-2 black">{t('churchEdit.formLabels.translator_location')}</Form.Label>
                        {!editableFields.translator_location && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleEnableFieldEdit('translator_location', 'Translator Location')}
                            style={{
                              padding: '4px',
                              border: 'none',
                              color: '#231f20',
                              backgroundColor: 'transparent',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f8f9fa';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.color = '#231f20';
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                        )}
                      </div>
                      <Form.Control
                        type="text"
                        placeholder={t('churchEdit.placeholders.translator_location')}
                        value={church.translator_location}
                        className="focus-border black"
                        disabled={!editableFields.translator_location}
                        onChange={(e) => setChurch({ ...church, translator_location: e.target.value })}
                      />
                    </Form.Group>
                  </div>



                  <div className="col-md-6">
                    <Form.Group controlId="formAddress">
                      <Form.Label className="mt-2 black">{t('churchEdit.formLabels.address')}</Form.Label>
                      <Form.Control
                        as="textarea"
                        placeholder={t('churchEdit.placeholders.address')}
                        value={church.address}
                        className="focus-border black"
                        onChange={(e) => setChurch({ ...church, address: e.target.value })}
                      />
                    </Form.Group>
                  </div>



                  {/* <div className="col-md-6">
                <Form.Group controlId="formApiKey">
                  <Form.Label className="mt-2 black">API Key</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter API Key"
                    value={church.api_key}
                     className="focus-border black"
                    onChange={(e) => setChurch({ ...church, api_key: e.target.value })}
                  />
                </Form.Group>

              </div> */}
                </div>


                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" type="submit" className='mt-3 bg-b'>{t('churchEdit.updateButton')}</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default ChurchEdit;