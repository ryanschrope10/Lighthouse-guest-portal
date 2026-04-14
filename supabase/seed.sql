-- ============================================================================
-- seed.sql
-- Development seed data for the Lighthouse Guest Portal
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------------

insert into properties (id, name, slug, newbook_instance_url, newbook_api_key, timezone, cancellation_policy, features_enabled, contact_info, smart_lock_provider, smart_lock_config, branding)
values
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Holiday Motel',
    'holiday-motel',
    'https://holiday-motel.newbook.cloud',
    'nb_dev_key_holiday_motel',
    'America/New_York',
    '{
      "free_cancellation_hours": 48,
      "late_cancel_fee_percent": 50,
      "no_show_fee_percent": 100,
      "description": "Free cancellation up to 48 hours before check-in. Late cancellations are charged 50% of the booking total. No-shows are charged in full."
    }'::jsonb,
    '{
      "online_check_in": true,
      "smart_locks": true,
      "addon_requests": true,
      "document_uploads": true,
      "push_notifications": true,
      "guest_messaging": true,
      "payment_portal": true,
      "loyalty_program": false
    }'::jsonb,
    '{
      "phone": "+1 (828) 555-0142",
      "email": "front-desk@holidaymotel.com",
      "address": {
        "street": "1200 Main Street",
        "city": "Asheville",
        "state": "NC",
        "zip": "28801",
        "country": "US"
      },
      "office_hours": "7:00 AM - 11:00 PM ET",
      "emergency_phone": "+1 (828) 555-0199"
    }'::jsonb,
    'ttlock',
    '{"api_endpoint": "https://euapi.ttlock.com/v3", "client_id": "dev_holiday_motel"}'::jsonb,
    '{
      "primary_color": "#b47a24",
      "secondary_color": "#1a3a5c",
      "logo_url": "/assets/logos/holiday-motel.png",
      "welcome_message": "Welcome to the Holiday Motel! We hope you enjoy your stay in the heart of the Blue Ridge Mountains."
    }'::jsonb
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Blue Ridge RV Park',
    'blue-ridge',
    'https://blue-ridge-rv.newbook.cloud',
    'nb_dev_key_blue_ridge',
    'America/New_York',
    '{
      "free_cancellation_hours": 72,
      "late_cancel_fee_percent": 25,
      "no_show_fee_percent": 100,
      "seasonal_policy": {
        "peak_months": [6, 7, 8, 10],
        "peak_free_cancellation_hours": 168
      },
      "description": "Free cancellation up to 72 hours before arrival (7 days during peak season: Jun-Aug & Oct). Late cancellations are charged 25%. No-shows are charged in full."
    }'::jsonb,
    '{
      "online_check_in": true,
      "smart_locks": false,
      "addon_requests": true,
      "document_uploads": true,
      "push_notifications": true,
      "guest_messaging": true,
      "payment_portal": true,
      "loyalty_program": true,
      "vehicle_registration": true,
      "site_map": true
    }'::jsonb,
    '{
      "phone": "+1 (828) 555-0287",
      "email": "info@blueridgervpark.com",
      "address": {
        "street": "450 Mountain View Road",
        "city": "Banner Elk",
        "state": "NC",
        "zip": "28604",
        "country": "US"
      },
      "office_hours": "8:00 AM - 8:00 PM ET",
      "emergency_phone": "+1 (828) 555-0299",
      "after_hours_gate_code": "See your booking confirmation"
    }'::jsonb,
    null,
    '{}'::jsonb,
    '{
      "primary_color": "#2d6a4f",
      "secondary_color": "#40916c",
      "logo_url": "/assets/logos/blue-ridge-rv.png",
      "welcome_message": "Welcome to Blue Ridge RV Park! Enjoy the beauty of the Appalachian Mountains from the comfort of your rig."
    }'::jsonb
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Lakeview Mobile Home Park',
    'lakeview',
    'https://lakeview-mhp.newbook.cloud',
    'nb_dev_key_lakeview',
    'America/Chicago',
    '{
      "free_cancellation_hours": 24,
      "late_cancel_fee_percent": 100,
      "no_show_fee_percent": 100,
      "long_term_policy": "Monthly leases require 30-day written notice for cancellation.",
      "description": "Short-term stays: free cancellation up to 24 hours before arrival. Monthly residents: 30-day written notice required."
    }'::jsonb,
    '{
      "online_check_in": true,
      "smart_locks": true,
      "addon_requests": true,
      "document_uploads": true,
      "push_notifications": true,
      "guest_messaging": true,
      "payment_portal": true,
      "loyalty_program": false,
      "maintenance_requests": true,
      "community_board": true
    }'::jsonb,
    '{
      "phone": "+1 (615) 555-0334",
      "email": "office@lakeviewmhp.com",
      "address": {
        "street": "8800 Lakeshore Drive",
        "city": "Old Hickory",
        "state": "TN",
        "zip": "37138",
        "country": "US"
      },
      "office_hours": "9:00 AM - 5:00 PM CT (Mon-Fri), 10:00 AM - 2:00 PM CT (Sat)",
      "emergency_phone": "+1 (615) 555-0399",
      "maintenance_emergency": "+1 (615) 555-0388"
    }'::jsonb,
    'igloo',
    '{"api_endpoint": "https://api.igloodeveloper.co/v2", "property_code": "LV-MHP-001"}'::jsonb,
    '{
      "primary_color": "#0077b6",
      "secondary_color": "#023e8a",
      "logo_url": "/assets/logos/lakeview-mhp.png",
      "welcome_message": "Welcome to Lakeview Mobile Home Park! Lakeside living at its finest, just minutes from Nashville."
    }'::jsonb
  );
