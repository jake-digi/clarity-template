
-- Demo behavior cases
INSERT INTO public.behavior_cases (tenant_id, instance_id, participant_id, category, severity_level, status, overview, location, raised_by, assigned_to_id, assigned_to_name, requires_immediate_action, is_sensitive_safeguarding, involves_staff_member, parent_notification_sent, timestamp)
VALUES
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '24600', 'Bullying', 'medium', 'open', 'Participant was reported to have been bullying another member during evening activity. Witnesses confirmed verbal intimidation.', 'Main Hall', 'auth0|6835eabad5f8b4c249edf333', 'auth0|683631460291389e25c0751c', 'Jamie', false, false, false, false, now() - interval '3 days'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '25652', 'Other', 'low', 'closed', 'Mum emailed in, someone to give her a call so she can talk to him about his behaviour at home before camp.', '', 'auth0|683631460291389e25c0751c', 'auth0|6835eabad5f8b4c249edf333', 'Jake', false, false, false, true, now() - interval '5 days'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '28186', 'Disruption', 'high', 'in-progress', 'Repeated disruption during safety briefing. Refused to follow instructions from staff. Had to be removed from the session.', 'Briefing Room', 'auth0|6835eabad5f8b4c249edf333', 'auth0|683631460291389e25c0751c', 'Jamie', true, false, false, false, now() - interval '1 day'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '22617', 'Safeguarding', 'critical', 'open', 'Participant disclosed concerning information during one-on-one chat. Needs immediate follow-up with safeguarding lead.', 'Welfare Tent', 'auth0|683631460291389e25c0751c', 'auth0|6835eabad5f8b4c249edf333', 'Jake', true, true, false, false, now() - interval '2 hours'),
  ('KettleOrganisation', '435NDwI1vIXcCIOSnFuQ', '24919', 'Property Damage', 'medium', 'pending', 'Participant broke a window in the accommodation block. Claims it was accidental but other participants say otherwise.', 'Block A Room 3', 'auth0|6835eabad5f8b4c249edf333', 'auth0|683631460291389e25c0751c', 'Jamie', false, false, false, false, now() - interval '12 hours');

-- Demo case actions for first case
INSERT INTO public.case_actions (case_id, instance_id, participant_id, action_type, description, old_status, new_status, performed_by, performed_by_name)
SELECT id, '435NDwI1vIXcCIOSnFuQ', '24600', 'statusChange', 'Status changed from pending to open', 'pending', 'open', 'auth0|6835eabad5f8b4c249edf333', 'Jake'
FROM public.behavior_cases WHERE participant_id = '24600' LIMIT 1;

-- Demo case actions for closed case
INSERT INTO public.case_actions (case_id, instance_id, participant_id, action_type, description, old_status, new_status, performed_by, performed_by_name)
SELECT id, '435NDwI1vIXcCIOSnFuQ', '25652', 'statusChange', 'Status changed from pending to open', 'pending', 'open', 'auth0|683631460291389e25c0751c', 'Jamie'
FROM public.behavior_cases WHERE participant_id = '25652' LIMIT 1;

INSERT INTO public.case_actions (case_id, instance_id, participant_id, action_type, description, old_status, new_status, performed_by, performed_by_name)
SELECT id, '435NDwI1vIXcCIOSnFuQ', '25652', 'statusChange', 'Status changed from open to closed', 'open', 'closed', 'auth0|6835eabad5f8b4c249edf333', 'Jake'
FROM public.behavior_cases WHERE participant_id = '25652' LIMIT 1;

-- Demo comments
INSERT INTO public.case_comments (case_id, author_id, author_name, content)
SELECT id, 'auth0|6835eabad5f8b4c249edf333', 'Jake', 'Spoke to the participant and they admitted to the behaviour. Will monitor over the next 24 hours.'
FROM public.behavior_cases WHERE participant_id = '24600' LIMIT 1;

INSERT INTO public.case_comments (case_id, author_id, author_name, content)
SELECT id, 'auth0|683631460291389e25c0751c', 'Jamie', 'Upon further conversation it was decided the participant will be given a formal warning and parents will be contacted tomorrow.'
FROM public.behavior_cases WHERE participant_id = '24600' LIMIT 1;

INSERT INTO public.case_comments (case_id, author_id, author_name, content)
SELECT id, 'auth0|683631460291389e25c0751c', 'Jamie', 'Called mum back, she was happy with the update. Case can be closed.'
FROM public.behavior_cases WHERE participant_id = '25652' LIMIT 1;
