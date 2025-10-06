import React from 'react';
import { Card, Container, Typography, Box, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


const StyledSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4)
}));
const StyledBox = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  '& p': {
    margin: '0 0 8px 0',
    lineHeight: 1.6,
    color: '#231f20',
    fontSize: '15px'
  }
}));
const StyledHeading = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main
}));

const StyledListItem = styled(Box)(({ theme, noBullet }) => ({
  display: 'flex',
  marginBottom: theme.spacing(2),
  ...(noBullet
    ? {}
    : {
      '&:before': {
        content: '"•"',
        marginRight: theme.spacing(1),
        color: theme.palette.primary.main,
      },
    }),
}));



const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end', 
            mb: 2, 
          }}
        >
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: '#000',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            {t('privacypolicy.labels.back')}
          </Button>

        </Box>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          color="primary"
          sx={{ color: '#231f20', textAlign: 'center', fontWeight: '600' }}
        >
          {t('privacypolicy.labels.title')}
        </Typography>


        <StyledSection>
          <Typography align="center" sx={{ fontWeight: 'bold' }} paragraph>
            {t('privacypolicy.sections.introduction.paragraph1')}
          </Typography>

          <Typography sx={{ fontWeight: 'bold' }} paragraph>{t('privacypolicy.sections.introduction.paragraph2')}</Typography>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.introduction.paragraph3"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
          <Typography paragraph >
            <Trans
              i18nKey="privacypolicy.sections.introduction.paragraph4"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.introduction.paragraph5"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />

          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.table_of_contents.title')}
          </StyledHeading>
          <Box >
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item1')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item2')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item3')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item4')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item5')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item6')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item7')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item8')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item9')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item10')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item11')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item12')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item13')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item14')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item15')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item16')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item17')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item18')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item19')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item20')}</StyledListItem>
            <StyledListItem noBullet>{t('privacypolicy.sections.table_of_contents.list_items.item21')}</StyledListItem>
          </Box>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.information_we_collect.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.information_we_collect.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.name')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.email_address')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.mobile_number')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.home_suburb')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.church_attend')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.faith_status')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.information_we_collect.list_items.church_attendance_details')}</StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.information_we_collect.paragraph2')}</Typography>
          <Typography paragraph>{t('privacypolicy.sections.information_we_collect.paragraph3')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.legal_basis.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.legal_basis.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>

              <Trans
                i18nKey="privacypolicy.sections.legal_basis.list_items.consent"
                components={{ strong: <strong style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} /> }}
              />
            </StyledListItem>

            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.legal_basis.list_items.legitimate_interest"
                components={{ strong: <strong style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.legal_basis.list_items.contract_fulfilment"
                components={{ strong: <strong style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }} /> }}
              />
            </StyledListItem>
          </Box>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.how_we_use.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.how_we_use.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.how_we_use.list_items.provide_translation')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.how_we_use.list_items.manage_profile')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.how_we_use.list_items.share_pastors')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.how_we_use.list_items.monitor_kpis')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.how_we_use.list_items.improve_functionality')}</StyledListItem>
          </Box>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.how_we_use.paragraph2"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.how_we_use.paragraph3"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.profile_photos.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.profile_photos.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.profile_photos.list_items.camera"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.profile_photos.list_items.photo_library"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.profile_photos.paragraph2')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.microphone_access.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.microphone_access.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.microphone_access.list_items.active_sessions')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.microphone_access.list_items.audio_not_stored')}</StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.microphone_access.paragraph2')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.third_party_services.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.third_party_services.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.third_party_services.list_items.microsoft_azure"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.third_party_services.list_items.mongodb_atlas"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.third_party_services.paragraph2')}</Typography>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.third_party_services.paragraph3"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.international_data_transfer.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.international_data_transfer.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
          <Typography paragraph>{t('privacypolicy.sections.international_data_transfer.paragraph2')}</Typography>
          <Typography paragraph>{t('privacypolicy.sections.international_data_transfer.paragraph3')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.data_access_sharing.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.data_access_sharing.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.data_access_sharing.list_items.authorised_leadership')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.data_access_sharing.list_items.authorised_staff')}</StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.data_access_sharing.paragraph2')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.data_security.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.data_security.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.data_security.list_items.tls_ssl"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.data_security.list_items.encryption"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.data_security.list_items.role_based_access"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.data_security.list_items.secure_backups"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.data_security.list_items.authentication_protocols"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.data_security.paragraph2')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.data_retention_deletion.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.data_retention_deletion.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <Typography paragraph>
              <Trans
                i18nKey="privacypolicy.sections.data_retention_deletion.list_items.option1_title"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </Typography>
            <StyledListItem>{t('privacypolicy.sections.data_retention_deletion.list_items.option1_step')}</StyledListItem>
            <Typography paragraph>
              <Trans
                i18nKey="privacypolicy.sections.data_retention_deletion.list_items.option2_title"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </Typography>
            <StyledListItem>
              <Trans
                i18nKey="privacypolicy.sections.data_retention_deletion.list_items.option2_step1"
                components={{
                  blue: <a href="mailto:lauren.van.niekerk@futures.church" style={{ color: 'blue', textDecoration: 'none' }} />

                }}
              />
            </StyledListItem>

            <StyledListItem>{t('privacypolicy.sections.data_retention_deletion.list_items.option2_step2')}</StyledListItem>
          </Box>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.data_retention_deletion.paragraph2"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.data_breach_notification.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.data_breach_notification.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.your_rights.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.your_rights.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.your_rights.list_items.access_correct')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.your_rights.list_items.request_deletion')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.your_rights.list_items.withdraw_consent')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.your_rights.list_items.lodge_complaint')}</StyledListItem>
          </Box>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.childrens_privacy.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.childrens_privacy.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>

          <Typography paragraph>{t('privacypolicy.sections.childrens_privacy.paragraph2')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.user_responsibilities.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.user_responsibilities.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.user_responsibilities.list_items.accurate_information')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.user_responsibilities.list_items.lawful_purposes')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.user_responsibilities.list_items.secure_credentials')}</StyledListItem>
          </Box>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.termination.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.termination.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <StyledListItem>{t('privacypolicy.sections.termination.list_items.breach_terms')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.termination.list_items.misuse_services')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.termination.list_items.legal_security')}</StyledListItem>
          </Box>
          <Typography paragraph>{t('privacypolicy.sections.termination.paragraph2')}</Typography>
          <Typography paragraph>{t('privacypolicy.sections.termination.paragraph3')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.intellectual_property.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.intellectual_property.paragraph1')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.limitation_liability.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.limitation_liability.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.governing_law.title')}
          </StyledHeading>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.governing_law.paragraph1"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.changes_policy.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.changes_policy.paragraph1')}</Typography>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.changes_policy.paragraph2"
              components={{
                blue: <a href="mailto:lauren.van.niekerk@futures.church" style={{ color: 'blue', textDecoration: 'none' }} />
              }}
            />
          </Typography>

        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.disclaimer.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.disclaimer.paragraph1')}</Typography>
        </StyledSection>

        <StyledSection>
          <StyledHeading variant="h5" sx={{ color: '#231f20' }}>
            {t('privacypolicy.sections.contact_us.title')}
          </StyledHeading>
          <Typography paragraph>{t('privacypolicy.sections.contact_us.paragraph1')}</Typography>
          <Box sx={{ ml: 2, color: '#231f20' }}>
            <Typography paragraph>
              <Trans
                i18nKey="privacypolicy.sections.contact_us.list_items.email"
                components={{
                  strong: <strong style={{ fontWeight: 'bold' }} />,
                  blue: <a href="mailto:lauren.van.niekerk@futures.church" style={{ color: 'blue', textDecoration: 'none' }} />
                }}
              />
            </Typography>

            <Typography paragraph>
              <Trans
                i18nKey="privacypolicy.sections.contact_us.list_items.mailing_address_title"
                components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
              />
            </Typography>
            <StyledListItem>{t('privacypolicy.sections.contact_us.list_items.mailing_address_line1')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.contact_us.list_items.mailing_address_line2')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.contact_us.list_items.mailing_address_line3')}</StyledListItem>
            <StyledListItem>{t('privacypolicy.sections.contact_us.list_items.mailing_address_line4')}</StyledListItem>
          </Box>
          <Typography paragraph>
            <Trans
              i18nKey="privacypolicy.sections.contact_us.paragraph2"
              components={{ strong: <strong style={{ fontWeight: 'bold' }} /> }}
            />
          </Typography>
        </StyledSection>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;