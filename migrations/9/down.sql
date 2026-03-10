
DELETE FROM system_settings WHERE setting_key IN (
  'institutional_founder_name',
  'institutional_founder_role', 
  'institutional_founder_bio',
  'institutional_founder_photo',
  'institutional_founder_linkedin'
);

DROP INDEX idx_job_applications_status;
DROP INDEX idx_job_openings_active;
DROP INDEX idx_team_members_active;
DROP TABLE job_applications;
DROP TABLE job_openings;
DROP TABLE team_members;
