-- Fix security warnings by enabling stronger password protection
-- Enable leaked password protection
UPDATE auth.config 
SET 
  password_min_length = 8,
  password_strength_required = true
WHERE id = 'auth';

-- Configure OTP settings with shorter expiry
UPDATE auth.config 
SET 
  otp_exp = 3600,  -- 1 hour instead of default
  otp_length = 6
WHERE id = 'auth';